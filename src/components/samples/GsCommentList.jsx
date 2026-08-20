import React, { useState } from "react";
import Lightbox from "../shared/Lightbox";

export default function GsCommentList({ comments }) {
  const [lightbox, setLightbox] = useState(null); // {src, name} | null

  if (!comments || comments.length === 0)
    return <div style={{ fontSize:12, color:"#C4C9D4" }}>No comments.</div>;
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      {comments.map((c, i) => (
        <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start",
          padding:"8px 0", borderBottom: i<comments.length-1?"1px solid #F9FAFB":"none" }}>
          <span style={{ fontSize:11, color:"#C4C9D4", width:16, flexShrink:0, paddingTop:2 }}>{i+1}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:"#374151", lineHeight:1.55 }}>{c.text}</div>
            {c.photos && c.photos.length > 0 && (
              <div style={{ display:"flex", gap:5, marginTop:6, flexWrap:"wrap" }}>
                {c.photos.map((ph,pi) => {
                  const src = ph.url || ph.dataUrl;
                  return (
                    <img key={pi} src={src} alt=""
                      onClick={() => setLightbox({ src, name: ph.name || "photo" })}
                      style={{ width:48, height:40, objectFit:"cover", borderRadius:5,
                        border:"1px solid #E5E7EB", cursor:"pointer" }} />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}
      {lightbox && (
        <Lightbox src={lightbox.src} name={lightbox.name} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
