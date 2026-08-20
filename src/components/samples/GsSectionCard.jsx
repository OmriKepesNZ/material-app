import React, { useState } from "react";

export default function GsSectionCard({ title, icon, children, defaultOpen=true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ background:"#fff", border:"1px solid #EFEFEF", borderRadius:12,
      overflow:"hidden", marginBottom:10 }}>
      <div onClick={() => setOpen(o=>!o)}
        style={{ padding:"12px 16px", display:"flex", alignItems:"center",
          justifyContent:"space-between", cursor:"pointer",
          borderBottom: open?"1px solid #F3F4F6":"none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8,
          fontSize:13, fontWeight:600, color:"#111827" }}>
          {icon}{title}
        </div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"
          style={{ transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.15s" }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
      {open && <div style={{ padding:"12px 16px" }}>{children}</div>}
    </div>
  );
}
