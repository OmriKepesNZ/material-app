import React, { useState, useRef, useEffect } from "react";
import Spinner from "../shared/Spinner";

export default function GsNewVersionModal({ sample, onClose, onSubmit }) {
  const [notes,      setNotes]     = React.useState("");
  const [dateSent,   setDateSent]  = React.useState(new Date().toISOString().slice(0,10));
  const [photos,     setPhotos]    = React.useState([]);
  const [files,      setFiles]     = React.useState([]);
  const [submitting, setSubmitting]= React.useState(false);
  const [visible,    setVisible]   = React.useState(false);
  const photoRef = React.useRef();
  const fileRef  = React.useRef();

  React.useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  function close() { setVisible(false); setTimeout(onClose, 200); }

  function readFile(file, cb) {
    const r = new FileReader();
    r.onload = e => cb(e.target.result);
    r.readAsDataURL(file);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const nextVer = sample.versions.length + 1;
    await onSubmit({ garmentSampleId: sample.id, versionNum: nextVer,
      factoryNotes: notes, dateSent, photos, additionalFiles: files });
    close();
  }

  const inp = { width:"100%", padding:"9px 11px", border:"1.5px solid #E5E7EB",
    borderRadius:8, fontSize:13, fontFamily:"inherit", color:"#111827",
    background:"#fff", outline:"none", boxSizing:"border-box" };
  const nextVer = sample.versions.length + 1;

  return (
    <div onClick={e => e.target===e.currentTarget && close()}
      style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center",
        justifyContent:"center", padding:20,
        background:visible?"rgba(10,10,15,0.52)":"rgba(10,10,15,0)",
        backdropFilter:visible?"blur(5px)":"blur(0)",
        transition:"background 0.22s, backdrop-filter 0.22s" }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:440,
        overflow:"hidden",
        boxShadow:visible?"0 0 0 1px rgba(0,0,0,0.06),0 24px 64px rgba(0,0,0,0.18)":"none",
        transform:visible?"translateY(0) scale(1)":"translateY(20px) scale(0.97)",
        opacity:visible?1:0, transition:"transform 0.24s cubic-bezier(0.22,1,0.36,1),opacity 0.18s" }}>
        <div style={{ padding:"20px 24px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.02em" }}>
                Submit Version {nextVer}
              </div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>{sample.productName}</div>
            </div>
            <button onClick={close} style={{ width:30, height:30, borderRadius:8,
              border:"1px solid #E5E7EB", background:"transparent", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{ padding:"0 24px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:6 }}>Date sent</div>
            <input type="date" value={dateSent} onChange={e=>setDateSent(e.target.value)} style={inp} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:6 }}>Notes — what changed?</div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
              placeholder="Describe what was changed since the last version..."
              style={{ ...inp, resize:"none", lineHeight:1.55 }} />
          </div>
          {/* Photos */}
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:6 }}>Photos</div>
            <input ref={photoRef} type="file" accept="image/*" multiple style={{ display:"none" }}
              onChange={e=>{ Array.from(e.target.files).forEach(f=>{ const r=new FileReader(); r.onload=ev=>setPhotos(p=>[...p,{name:f.name,dataUrl:ev.target.result}]); r.readAsDataURL(f); }); }} />
            {photos.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
              {photos.map((ph,i)=><div key={i} style={{position:"relative"}}>
                <img src={ph.dataUrl} alt="" style={{width:60,height:50,objectFit:"cover",borderRadius:7,border:"1px solid #E5E7EB"}}/>
                <button onClick={()=>setPhotos(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#111827",border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>×</button>
              </div>)}
            </div>}
            <div onClick={()=>photoRef.current.click()} style={{border:"1.5px dashed #E5E7EB",borderRadius:8,padding:"10px",textAlign:"center",cursor:"pointer",background:"#FAFAFA",fontSize:12,color:"#9CA3AF"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#111827"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#E5E7EB"}>
              {photos.length>0?"+ Add more photos":"Upload photos"}
            </div>
          </div>
          {/* Additional files */}
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:6 }}>Additional files
              <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#C4C9D4" }}> — optional</span>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.xlsx,.csv,.doc,.docx,image/*" multiple style={{display:"none"}}
              onChange={e=>{ Array.from(e.target.files).forEach(f=>{ const r=new FileReader(); r.onload=ev=>setFiles(p=>[...p,{name:f.name,dataUrl:ev.target.result,type:f.type}]); r.readAsDataURL(f); }); }} />
            {files.length>0&&<div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:6}}>
              {files.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 9px",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:6,fontSize:12}}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style={{flex:1,color:"#374151"}}>{f.name}</span>
                <button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",fontSize:14}}>×</button>
              </div>)}
            </div>}
            <div onClick={()=>fileRef.current.click()} style={{border:"1.5px dashed #E5E7EB",borderRadius:7,padding:"9px",textAlign:"center",cursor:"pointer",background:"#FAFAFA",fontSize:12,color:"#9CA3AF"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#9CA3AF"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#E5E7EB"}>
              Attach PDF, spreadsheet or image
            </div>
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ width:"100%", padding:13, background:submitting?"#F3F4F6":"#111827",
              color:submitting?"#9CA3AF":"#fff", border:"none", borderRadius:10,
              fontSize:14, fontWeight:600, cursor:submitting?"not-allowed":"pointer",
              fontFamily:"inherit", display:"flex", alignItems:"center",
              justifyContent:"center", gap:8 }}>
            {submitting ? <><Spinner />Submitting...</> : `Submit Version ${nextVer}`}
          </button>
        </div>
      </div>
    </div>
  );
}

