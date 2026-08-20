import React from "react";
import { STATUS_COLORS, SHIP_COLORS } from "../../lib/theme";

export default function Badge({ status, type = "approval" }) {
  const c = (type === "approval" ? STATUS_COLORS : SHIP_COLORS)[status] || { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: c.bg, color: c.text, fontSize: 11.5, fontWeight: 500 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot }} />{status}
    </span>
  );
}

export function Divider() { return <div style={{ height: 1, background: "#F3F4F6", margin: "2px 0" }} />; }
