import React from "react";
import { ICO } from "../../lib/icons";

export default function SearchBar({ search, setSearch, placeholder }) {
  return (
    <div style={{ position:"relative", marginBottom:20 }}>
      <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"11px 14px 11px 38px", border:"1.5px solid #E8EAED", borderRadius:11, fontSize:13.5, fontFamily:"inherit", color:"#111827", background:"#fff", outline:"none", boxShadow:"0 1px 3px rgba(0,0,0,0.04)", transition:"border-color 0.15s" }}
        onFocus={e => e.target.style.borderColor="#0F1117"}
        onBlur={e => e.target.style.borderColor="#E8EAED"}
      />
      {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:2 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
    </div>
  );
}

