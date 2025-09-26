require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5500;
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 30000);

// --- Simple in-memory cache ---
let cache = {
  streams: [],
  lastUpdated: 0
};

// --- Twitch token caching ---
let twitchToken = null;
let twitchTokenExpiry = 0;

async function getTwitchAppToken() {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) return null;

  if (twitchToken && Date.now() < twitchTokenExpiry) return twitchToken;

  const params = new URLSearchParams();
  params.append("client_id", process.env.TWITCH_CLIENT_ID);
  params.append("client_secret", process.env.TWITCH_CLIENT_SECRET);
  params.append("grant_type", "client_credentials");

  try {
    const res = await axios.post("https://id.twitch.tv/oauth2/token", params);
    twitchToken = res.data.access_token;
    twitchTokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
    return twitchToken;
  } catch (err) {
    console.error("Twitch token error:", err.response?.data || err.message);
    return null;
  }
}

async function fetchTwitchStreams() {
  const token = await getTwitchAppToken();
  if (!token) return [];

  try {
    const res = await axios.get("https://api.twitch.tv/helix/streams", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${token}`
      },
      params: { first: 20 }
    });

    return res.data.data.map(s => ({
      id: `twitch_${s.id}`,
      title: s.title,
      platform: "Twitch",
      link: `https://twitch.tv/${s.user_login}`,
      thumbnail: (s.thumbnail_url || "").replace("{width}", "320").replace("{height}", "180"),
      category: s.game_name || "Gaming",
      viewer_count: s.viewer_count || 0
    }));
  } catch (err) {
    console.error("Twitch streams error:", err.response?.data || err.message);
    return [];
  }
}

// --- YouTube ---
async function fetchYouTubeLive() {
  if (!process.env.YOUTUBE_API_KEY) return [];

  try {
    const liveRes = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        eventType: "live",
        type: "video",
        maxResults: 20,
        key: process.env.YOUTUBE_API_KEY,
        q: "gaming"
      }
    });

    const upcomingRes = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        eventType: "upcoming",
        type: "video",
        maxResults: 20,
        key: process.env.YOUTUBE_API_KEY,
        q: "gaming"
      }
    });

    const allItems = [...(liveRes.data.items || []), ...(upcomingRes.data.items || [])];

    return allItems.map(item => ({
      id: `yt_${item.id.videoId}`,
      title: item.snippet.title,
      platform: "YouTube",
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails?.medium?.url || "",
      category: item.snippet.channelTitle || "Live",
      status: item.snippet.liveBroadcastContent,
      viewer_count: 0
    }));
  } catch (err) {
    console.error("YouTube live/upcoming error:", err.response?.data || err.message);
    return [];
  }
}

// --- Kick ---
let kickToken = null;
let kickTokenExpiry = 0;

async function getKickAccessToken() {
  if (!process.env.KICK_CLIENT_ID || !process.env.KICK_CLIENT_SECRET) return null;

  if (kickToken && Date.now() < kickTokenExpiry) return kickToken;

  try {
    const res = await axios.post(
      "https://id.kick.com/oauth2/token",
      new URLSearchParams({
        client_id: process.env.KICK_CLIENT_ID,
        client_secret: process.env.KICK_CLIENT_SECRET,
        grant_type: "client_credentials"
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    kickToken = res.data.access_token;
    kickTokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
    return kickToken;
  } catch (err) {
    console.error("Kick token error:", err.response?.data || err.message);
    return null;
  }
}

async function fetchKickStreams() {
  const token = await getKickAccessToken();
  if (!token) return [];

  try {
    const res = await axios.get("https://api.kick.com/v1/streams", {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      params: { limit: 20 }
    });

    return (res.data.data || []).map(s => ({
      id: `kick_${s.id}`,
      title: s.title,
      platform: "Kick",
      link: `https://kick.com/${s.user.username}`,
      thumbnail: s.thumbnail || "",
      category: s.category || "Live",
      viewer_count: s.viewer_count || 0
    }));
  } catch (err) {
    console.error("Kick streams error:", err.response?.data || err.message);
    return [];
  }
}

// --- Aggregate safely ---
async function aggregateStreams() {
  const [twitch, youtube, kick] = await Promise.allSettled([
    fetchTwitchStreams(),
    fetchYouTubeLive(),
    fetchKickStreams()
  ]);

  const results = [];

  if (twitch.status === "fulfilled" && Array.isArray(twitch.value)) results.push(...twitch.value);
  if (youtube.status === "fulfilled" && Array.isArray(youtube.value)) results.push(...youtube.value);
  if (kick.status === "fulfilled" && Array.isArray(kick.value)) results.push(...kick.value);

  return results;
}

// --- GET /api/streams ---
app.get("/api/streams", async (req, res) => {
  try {
    const now = Date.now();
    if (cache.streams.length && (now - cache.lastUpdated) < CACHE_TTL_MS) {
      return res.json({ source: "cache", items: cache.streams });
    }

    const items = await aggregateStreams();
    items.sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0));

    cache.streams = items;
    cache.lastUpdated = Date.now();

    res.json({ source: "live", items });
  } catch (err) {
    console.error("/api/streams error:", err);
    res.status(500).json({ error: "Failed to fetch streams" });
  }
});

// --- Optional: manual stream ---
app.post("/api/streams", (req, res) => {
  const stream = req.body;
  if (!stream || !stream.title || !stream.link) {
    return res.status(400).json({ error: "title and link required" });
  }

  const entry = { id: `local_${Date.now()}`, ...stream };
  cache.streams.unshift(entry);
  res.status(201).json(entry);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
