// src/components/SearchBar.jsx
import React from "react";

const IconSearch = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function SearchBar({ search, setSearch, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <div
        style={{
          position: "absolute",
          left: 13,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconSearch />
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder || "Search..."}
        style={{
          width: "100%",
          padding: "11px 14px 11px 38px",
          border: "1.5px solid #E8EAED",
          borderRadius: 11,
          fontSize: 13.5,
          fontFamily: "inherit",
          color: "#111827",
          background: "#fff",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#0F1117")}
        onBlur={(e) => (e.target.style.borderColor = "#E8EAED")}
      />
      {search && (
        <button
          onClick={() => setSearch("")}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}