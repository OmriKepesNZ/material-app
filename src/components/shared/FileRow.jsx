import React from "react";
import { downloadFile } from "../../lib/download";

// A single non-image file (PDF, spreadsheet, etc.) shown with a download icon.
// Click anywhere on the row to download it.
export default function FileRow({ name, url }) {
  return (
    <div
      onClick={() => url && downloadFile(url, name)}
      style={{
        display: "flex", alignItems: "center", gap: 7, fontSize: 12,
        cursor: url ? "pointer" : "default",
      }}
    >
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span style={{ color: url ? "#2563EB" : "#374151", textDecoration: url ? "underline" : "none" }}>
        {name}
      </span>
      {url && (
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ marginLeft: 2, flexShrink: 0 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
    </div>
  );
}
