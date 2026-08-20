import React from "react";

export default function CommentSection({ label, rows, setter, sKey, addRow, updateText, removeRow,
  addPhotoToRow, removePhotoFromRow, photoRefs, inp, lbl }) {
  return (
    <div>
      <div style={lbl}>{label}
        <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0,
          color:"#C4C9D4" }}> — optional</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {rows.map((row, i) => {
          const rk = `${sKey}-${i}`;
          return (
            <div key={i} style={{ background:"#FAFAFA", border:"1px solid #F3F4F6",
              borderRadius:9, padding:"10px 12px" }}>
              <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:6 }}>
                <span style={{ fontSize:11, color:"#C4C9D4", width:16, flexShrink:0,
                  paddingTop:10, textAlign:"center" }}>{i+1}</span>
                <textarea value={row.text} onChange={e=>updateText(setter,i,e.target.value)}
                  placeholder="Add comment..." rows={2}
                  style={{...inp,flex:1,padding:"7px 10px",resize:"none",lineHeight:1.5,background:"#fff"}} />
                {rows.length>1 && (
                  <button onClick={()=>removeRow(setter,i)}
                    style={{background:"none",border:"none",color:"#C4C9D4",
                      cursor:"pointer",fontSize:16,padding:"6px 2px",flexShrink:0}}>×</button>
                )}
              </div>
              {row.photos.length>0 && (
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6,paddingLeft:22}}>
                  {row.photos.map((ph,pi)=>(
                    <div key={pi} style={{position:"relative"}}>
                      <img src={ph.dataUrl} alt="" style={{width:52,height:44,objectFit:"cover",borderRadius:6,border:"1px solid #E5E7EB"}}/>
                      <button onClick={()=>removePhotoFromRow(setter,i,pi)}
                        style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#111827",border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{paddingLeft:22}}>
                <input ref={el=>photoRefs.current[rk]=el} type="file" accept="image/*"
                  style={{display:"none"}}
                  onChange={e=>{if(e.target.files[0])addPhotoToRow(setter,i,e.target.files[0]);e.target.value="";}} />
                <button onClick={()=>photoRefs.current[rk]?.click()}
                  style={{background:"none",border:"1px dashed #E5E7EB",borderRadius:5,
                    padding:"3px 9px",color:"#9CA3AF",cursor:"pointer",fontSize:11,
                    fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>Add photo
                </button>
              </div>
            </div>
          );
        })}
        <button onClick={()=>addRow(setter)}
          style={{background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",
            fontSize:12,fontFamily:"inherit",textAlign:"left",padding:"2px 0"}}>
          + Add comment
        </button>
      </div>
    </div>
  );
}
