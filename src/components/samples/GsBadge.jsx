import React, { useState } from "react";
import { GS_STATUS_COLORS } from "../../lib/theme";

export default function GsBadge({ status }) {
  const c = GS_STATUS_COLORS[status] || { bg:"#F3F4F6", text:"#374151", dot:"#9CA3AF" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px",
      borderRadius:20, background:c.bg, color:c.text, fontSize:11, fontWeight:600 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot }} />{status}
    </span>
  );
}
