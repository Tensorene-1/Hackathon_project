/*import React, { useState, useEffect } from "react";
import StreamCard from "./StreamCard";
import "./styles.css";

function App() {
  const [search, setSearch] = useState("");
  const [streams, setStreams] = useState([]);
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState([
    "All",
    "YouTube Live",
    "Twitch Live",
    "Kick Live",
    "Facebook Live"
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreams() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/streams");
        const data = await res.json();
        let items = data.items || [];

        // Assign unified categories
        const updatedStreams = items.map((s) => {
          if (s.platform === "YouTube") return { ...s, category: "YouTube Live" };
          if (s.platform === "Twitch") return { ...s, category: "Twitch Live" };
          if (s.platform === "Kick") return { ...s, category: "Kick Live" };
          if (s.platform === "Facebook") return { ...s, category: "Facebook Live" };
          return s;
        });

        setStreams(updatedStreams);
      } catch (err) {
        console.error("Error fetching streams:", err);
        setStreams([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStreams();

    const interval = setInterval(fetchStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch = stream.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || stream.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app">
      <h1>🎥 StreamSphere – What’s Live Now</h1>

      <input
        type="text"
        placeholder="Search streams..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="categories">
        {categories.map((cat) => (
          <button
            key={cat}
            className={category === cat ? "active" : ""}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading streams...</p>
      ) : (
        <div className="stream-list">
          {filteredStreams.length > 0 ? (
            filteredStreams.map((stream) => (
              <StreamCard key={stream.id} {...stream} />
            ))
          ) : (
            <p>No streams found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;*/
import React, { useState, useEffect } from "react";
import StreamCard from "./StreamCard";
import "./styles.css";

function App() {
  const [search, setSearch] = useState("");
  const [streams, setStreams] = useState([]);
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState(["All", "Twitch Live", "YouTube Live"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreams() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/streams");
        const data = await res.json();
        let items = data.items || [];

        // Map platform to unified category
        const updatedStreams = items.map((s) => {
          if (s.platform === "Twitch") return { ...s, category: "Twitch Live" };
          if (s.platform === "YouTube") return { ...s, category: "YouTube Live" };
          return s;
        });

        setStreams(updatedStreams);
      } catch (err) {
        console.error("Error fetching streams:", err);
        setStreams([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStreams();
    const interval = setInterval(fetchStreams, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch = stream.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || stream.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app">
      <h1>🎥 StreamSphere – What’s Live Now</h1>

      <input
        type="text"
        placeholder="Search streams..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="categories">
        {categories.map((cat) => (
          <button
            key={cat}
            className={category === cat ? "active" : ""}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading streams...</p>
      ) : (
        <div className="stream-list">
          {filteredStreams.length > 0 ? (
            filteredStreams.map((stream) => (
              <StreamCard key={stream.id} {...stream} />
            ))
          ) : (
            <p>No streams found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
/*import React, { useState, useEffect } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import StreamCard from "./StreamCard";
import Footer from "./components/Footer";

function App() {
  const [search, setSearch] = useState("");
  const [streams, setStreams] = useState([]);
  const [category, setCategory] = useState("All");
  const [categories] = useState(["All", "Twitch Live", "YouTube Live"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreams() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/streams");
        const data = await res.json();
        let items = data.items || [];

        // Normalize category
        const updatedStreams = items.map((s) => {
          if (s.platform === "Twitch") return { ...s, category: "Twitch Live" };
          if (s.platform === "YouTube") return { ...s, category: "YouTube Live" };
          return s;
        });

        setStreams(updatedStreams);
      } catch (err) {
        console.error("Error fetching streams:", err);
        setStreams([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStreams();
    const interval = setInterval(fetchStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch = stream.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || stream.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      <Nav />

      <Hero
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        categories={categories}
      />

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading streams...</div>
      ) : (
        <section className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredStreams.length > 0 ? (
            filteredStreams.map((stream) => (
              <StreamCard key={stream.id} {...stream} />
            ))
          ) : (
            <p className="col-span-full text-center text-slate-400">No streams found.</p>
          )}
        </section>
      )}

      <Footer />
    </div>
  );
}

export default App;*/

