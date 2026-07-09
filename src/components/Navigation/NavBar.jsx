// src/components/Navigation/NavBar.jsx
import React from "react";
import { STYLES } from "../../constants";

const IconFactory = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-4h2v18h-2z" />
  </svg>
);

const IconBrand = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);

export default function NavBar({ view, onViewChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        padding: "16px 28px",
        background: "#fff",
        borderBottom: "1px solid #EFEFEF",
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Material App</div>
      <div style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
        <button
          onClick={() => onViewChange("factory")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: view === "factory" ? "#111827" : "transparent",
            color: view === "factory" ? "#fff" : "#6B7280",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          <IconFactory /> Factory
        </button>
        <button
          onClick={() => onViewChange("brand")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: view === "brand" ? "#111827" : "transparent",
            color: view === "brand" ? "#fff" : "#6B7280",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          <IconBrand /> Brand
        </button>
      </div>
    </div>
  );
}