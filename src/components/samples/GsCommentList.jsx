import React from "react";

export default function GsCommentList({ comments }) {
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
                {c.photos.map((ph,pi) => (
                  <img key={pi} src={ph.dataUrl || ph.url} alt=""
                    style={{ width:48, height:40, objectFit:"cover", borderRadius:5,
                      border:"1px solid #E5E7EB" }} />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

