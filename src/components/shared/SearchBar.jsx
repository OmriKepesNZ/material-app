import React from "react";
import "./SearchBar.css";

export default function SearchBar({ search, setSearch, placeholder }) {
  return (
    <div className="search-bar">
      <svg className="search-bar-icon" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder} />
      {search && <button className="search-bar-clear" onClick={() => setSearch("")}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
    </div>
  );
}

