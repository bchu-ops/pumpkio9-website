// frontend/src/components/pages/NotFound.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { publicFile } from "../../App";
import "./NotFound.css";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <main className="notfound">
      <div className="notfound-card">
        <div className="notfound-trees" aria-hidden="true">
          🌲<span className="notfound-lost">🧭</span>🌲
        </div>
        <p className="notfound-code">404</p>
        <h1 className="notfound-title">This page wandered off into the forest</h1>
        <p className="notfound-text">
          Couldn't find <code>{pathname}</code>. The link may be old, or the page moved.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn--primary">
            🏠 Back home
          </Link>
          <a
            href={publicFile("resume/Brian_Chu_Resume.pdf")}
            target="_blank"
            rel="noopener noreferrer"
            className="notfound-btn"
          >
            📄 Resume
          </a>
          <a href="mailto:brian.chu1030@gmail.com" className="notfound-btn">
            ✉️ Say hi
          </a>
        </div>
      </div>
    </main>
  );
}
