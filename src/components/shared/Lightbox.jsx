import React, { useEffect } from "react";
import { downloadFile } from "../../lib/download";

// Full-screen photo viewer. Click the backdrop or press Escape to close;
// the download button fetches the image and saves it locally rather than
// just opening it in a new tab.
export default function Lightbox({ src, name = "photo", onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(10,10,15,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => downloadFile(src, name)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            background: "rgba(255,255,255,0.12)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.12)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, cursor: "pointer",
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <img
        src={src}
        alt={name}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "90vw", maxHeight: "86vh", objectFit: "contain",
          borderRadius: 8, boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}
