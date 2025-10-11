// frontend/src/components/pages/NotFound.js
import React from "react";
import { Link } from "react-router-dom";



export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "6rem", margin: 0 }}>404</h1>
      <h2 style={{ margin: "1rem 0" }}>Page Not Found</h2>
      <p style={{ marginBottom: "2rem", color: "#555" }}>
        Oops! The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#007bff",
          color: "white",
          textDecoration: "none",
          borderRadius: "6px",
          fontWeight: "bold",
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
