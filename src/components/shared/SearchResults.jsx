import React from "react";

export default function SearchResults({ results, search }) {
  return (
    <div>
      <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:10 }}>
        {results.length} result{results.length!==1?"s":""} for <span style={{ fontWeight:600, color:"#374151" }}>"{search}"</span>
      </div>
    </div>
  );
}


// =============================================================================
// GARMENT SAMPLE COMPONENTS
// Completely isolated from materials logic. All state prefixed with g/G.
// =============================================================================

