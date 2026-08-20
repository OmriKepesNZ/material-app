import React, { useState, useRef, useEffect } from "react";

export default function AddRow({ placeholder, onAdd, onCancel }) {
  const [val, setVal] = useState("");
  const ref = useRef();
  useEffect(() => { ref.current && ref.current.focus(); }, []);
  function submit() { if (val.trim()) onAdd(val.trim()); else onCancel(); }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderTop: "1px solid #F3F4F6" }}>
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        placeholder={placeholder}
        style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #111827", borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#111827" }} />
      <button onClick={submit} style={{ padding: "7px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
      <button onClick={onCancel} style={{ padding: "7px 10px", background: "transparent", color: "#9CA3AF", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
    </div>
  );
}
