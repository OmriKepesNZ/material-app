import React, { useState, useRef, useEffect } from "react";

export default function VersionDropdown({ versions, activeIdx, onSelect, labelFor, dateFor, dotFor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const lastIdx = versions.length - 1;
  const active = versions[activeIdx];
  const isCurrent = activeIdx === lastIdx;

  return (
    <div ref={ref} style={{ position:"relative", marginBottom:16 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px",
          borderRadius:10, cursor:"pointer", background:"#fff",
          border:"1.5px solid #E5E7EB", fontFamily:"inherit", minWidth:230,
          justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:dotFor(active), flexShrink:0 }} />
          <span style={{ fontSize:13, fontWeight:700, color:"#111827", fontFamily:"monospace" }}>{labelFor(active)}</span>
          <span style={{ fontSize:12, color:"#9CA3AF" }}>{dateFor(active)}</span>
          {isCurrent
            ? <span style={{ fontSize:10, fontWeight:700, color:"#065F46", background:"#ECFDF5",
                padding:"2px 7px", borderRadius:10, textTransform:"uppercase", letterSpacing:"0.04em" }}>Current</span>
            : <span style={{ fontSize:10, fontWeight:600, color:"#B45309", background:"#FFF8E6",
                padding:"2px 7px", borderRadius:10, textTransform:"uppercase", letterSpacing:"0.04em" }}>Past version</span>
          }
        </div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2"
          style={{ transform: open?"rotate(180deg)":"none", transition:"transform 0.15s", flexShrink:0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:20,
          background:"#fff", border:"1px solid #E5E7EB", borderRadius:10,
          boxShadow:"0 8px 24px rgba(0,0,0,0.1)", minWidth:260, overflow:"hidden", padding:4 }}>
          {[...versions].reverse().map((ver, ri) => {
            const idx = lastIdx - ri;
            const isAct = idx === activeIdx;
            const isCur = idx === lastIdx;
            return (
              <div key={idx} onClick={() => { onSelect(idx); setOpen(false); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
                  padding:"9px 11px", borderRadius:7, cursor:"pointer",
                  background: isAct ? "#F3F4F6" : "transparent" }}
                onMouseEnter={e => { if (!isAct) e.currentTarget.style.background = "#FAFAFA"; }}
                onMouseLeave={e => { if (!isAct) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:dotFor(ver), flexShrink:0 }} />
                  <span style={{ fontSize:13, fontWeight:700, color:"#111827", fontFamily:"monospace" }}>{labelFor(ver)}</span>
                  <span style={{ fontSize:12, color:"#9CA3AF" }}>{dateFor(ver)}</span>
                </div>
                {isCur && <span style={{ fontSize:9.5, fontWeight:700, color:"#065F46", background:"#ECFDF5",
                  padding:"2px 6px", borderRadius:10, textTransform:"uppercase", letterSpacing:"0.04em", flexShrink:0 }}>Current</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
