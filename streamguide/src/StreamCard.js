import React from "react";

function StreamCard({ title, link, thumbnail, platform, category, viewer_count }) {
  return (
    <div className="stream-card">
      <img src={thumbnail} alt={title} className="thumbnail" />
      <h3>{title}</h3>
      <p>{platform} | {category} | {viewer_count} viewers</p>
      <a href={link} target="_blank" rel="noopener noreferrer">
        Watch
      </a>
    </div>
  );
}

export default StreamCard;
