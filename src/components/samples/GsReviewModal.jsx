import React, { useState, useRef, useEffect } from "react";
import CommentSection from "./CommentSection";

export default function GsReviewModal({ sample, versionIdx, onClose, onSubmit }) {
  const ver = sample.versions[versionIdx];
  const [status,     setStatus]    = React.useState(null);
  const [nextSteps,  setNextSteps] = React.useState(null);
  const [summary,    setSummary]   = React.useState("");
  const [fit,        setFit]       = React.useState([{ text:"", photos:[] }]);
  const [mfg,        setMfg]       = React.useState([{ text:"", photos:[] }]);
  const [obs,        setObs]       = React.useState([{ text:"", photos:[] }]);
  const [measFile,   setMeasFile]  = React.useState(null);
  const [visible,    setVisible]   = React.useState(false);
  const measRef  = React.useRef();
  const photoRefs= React.useRef({});

  React.useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  function close() { setVisible(false); setTimeout(onClose, 200); }

  function addRow(setter) { setter(r => [...r, { text:"", photos:[] }]); }
  function updateText(setter, i, v) { setter(r => r.map((row,j) => j===i?{...row,text:v}:row)); }
  function removeRow(setter, i)     { setter(r => r.filter((_,j) => j!==i)); }
  function addPhotoToRow(setter, i, file) {
    const r = new FileReader();
    r.onload = e => setter(rows => rows.map((row,j) =>
      j===i ? {...row, photos:[...row.photos, {name:file.name, dataUrl:e.target.result}]} : row
    ));
    r.readAsDataURL(file);
  }
  function removePhotoFromRow(setter, ri, pi) {
    setter(r => r.map((row,j) => j===ri ? {...row, photos:row.photos.filter((_,k)=>k!==pi)} : row));
  }

  const canSubmit = status !== null && nextSteps !== null;

  async function handleSubmit() {
    await onSubmit({
      versionId: ver.airtableId,
      garmentSampleId: sample.id,
      status, nextSteps, summary,
      // Keep a row if it has text OR at least one photo — don't drop photo-only comments
      fitComments:  fit.filter(r=>r.text.trim() || (r.photos&&r.photos.length>0)),
      mfgComments:  mfg.filter(r=>r.text.trim() || (r.photos&&r.photos.length>0)),
      obsComments:  obs.filter(r=>r.text.trim() || (r.photos&&r.photos.length>0)),
      measFile,
    });
    close();
  }

  const inp = { width:"100%", padding:"8px 10px", border:"1.5px solid #E5E7EB",
    borderRadius:7, fontSize:13, fontFamily:"inherit", color:"#111827",
    background:"#fff", outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:10, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
    letterSpacing:"0.07em", display:"block", marginBottom:5 };
  const divLine = { height:1, background:"#F3F4F6", margin:"4px 0 16px" };

  const STATUS_OPTS = [
    { key:"Approved",               label:"Approved",               col:"#10B981", bg:"#ECFDF5" },
    { key:"Approved with Comments", label:"Approved with comments",  col:"#3B82F6", bg:"#EFF6FF" },
    { key:"New Sample Requested",   label:"Request new sample",      col:"#F97316", bg:"#FFF3E0" },
    { key:"Rejected",               label:"Rejected",                col:"#EF4444", bg:"#FEF2F2" },
    { key:"Other",                  label:"Other",                   col:"#6B7280", bg:"#F3F4F6" },
  ];


  return (
    <div onClick={e=>e.target===e.currentTarget&&close()}
      style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",
        justifyContent:"center",padding:20,
        background:visible?"rgba(10,10,15,0.52)":"rgba(10,10,15,0)",
        backdropFilter:visible?"blur(5px)":"blur(0)",
        transition:"background 0.22s, backdrop-filter 0.22s",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:520,
        maxHeight:"92vh",overflowY:"auto",
        boxShadow:visible?"0 0 0 1px rgba(0,0,0,0.06),0 24px 64px rgba(0,0,0,0.18)":"none",
        transform:visible?"translateY(0) scale(1)":"translateY(20px) scale(0.97)",
        opacity:visible?1:0,transition:"transform 0.24s cubic-bezier(0.22,1,0.36,1),opacity 0.18s"}}>
        {/* Header */}
        <div style={{padding:"20px 22px 16px",borderBottom:"1px solid #F3F4F6",
          position:"sticky",top:0,background:"#fff",zIndex:2,borderRadius:"20px 20px 0 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:16,fontWeight:700,letterSpacing:"-0.02em",marginBottom:2}}>Review sample</div>
              <div style={{fontSize:12,color:"#9CA3AF"}}>{sample.productName} · Proto {ver.versionNum}</div>
            </div>
            <button onClick={close} style={{width:30,height:30,borderRadius:8,border:"1px solid #E5E7EB",
              background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{padding:"20px 22px 24px",display:"flex",flexDirection:"column",gap:18}}>
          {/* Summary */}
          <div>
            <div style={lbl}>Summary note
              <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"#C4C9D4"}}> — optional</span>
            </div>
            <textarea value={summary} onChange={e=>setSummary(e.target.value)} rows={3}
              placeholder="Overall comments on this sample..."
              style={{...inp,resize:"none",lineHeight:1.55}} />
          </div>
          <div style={divLine}/>
          <CommentSection label="Fit & function" rows={fit} setter={setFit} sKey="fit"
            addRow={addRow} updateText={updateText} removeRow={removeRow}
            addPhotoToRow={addPhotoToRow} removePhotoFromRow={removePhotoFromRow}
            photoRefs={photoRefs} inp={inp} lbl={lbl}/>
          <CommentSection label="Manufacturing" rows={mfg} setter={setMfg} sKey="mfg"
            addRow={addRow} updateText={updateText} removeRow={removeRow}
            addPhotoToRow={addPhotoToRow} removePhotoFromRow={removePhotoFromRow}
            photoRefs={photoRefs} inp={inp} lbl={lbl}/>
          <CommentSection label="Observations" rows={obs} setter={setObs} sKey="obs"
            addRow={addRow} updateText={updateText} removeRow={removeRow}
            addPhotoToRow={addPhotoToRow} removePhotoFromRow={removePhotoFromRow}
            photoRefs={photoRefs} inp={inp} lbl={lbl}/>
          <div style={divLine}/>
          {/* Measurement file upload */}
          <div>
            <div style={lbl}>Measurement sheet
              <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"#C4C9D4"}}> — optional</span>
            </div>
            <input ref={measRef} type="file" accept=".pdf,.xlsx,.csv,image/*" style={{display:"none"}}
              onChange={e=>setMeasFile(e.target.files[0]||null)}/>
            {measFile?(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",
                background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12}}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span style={{flex:1,color:"#374151"}}>{measFile.name}</span>
                <button onClick={()=>setMeasFile(null)} style={{background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",fontSize:14}}>×</button>
              </div>
            ):(
              <div onClick={()=>measRef.current.click()}
                style={{border:"1.5px dashed #E5E7EB",borderRadius:8,padding:"12px",
                  textAlign:"center",cursor:"pointer",background:"#FAFAFA",fontSize:12,color:"#9CA3AF"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#9CA3AF"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#E5E7EB"}>
                Attach measurement chart (PDF, spreadsheet or image)
              </div>
            )}
          </div>
          <div style={divLine}/>
          {/* Next steps */}
          <div>
            <div style={lbl}>Next steps</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {key:"request-another",label:"Request another sample"},
                {key:"no-more",        label:"No more samples required"},
              ].map(opt=>(
                <button key={opt.key} onClick={()=>setNextSteps(opt.key)}
                  style={{padding:"11px 12px",borderRadius:9,fontFamily:"inherit",cursor:"pointer",textAlign:"left",
                    border:nextSteps===opt.key?"2px solid #111827":"1.5px solid #E5E7EB",
                    background:nextSteps===opt.key?"#111827":"#fff",
                    color:nextSteps===opt.key?"#fff":"#374151",transition:"all 0.1s"}}>
                  <div style={{fontSize:12.5,fontWeight:600}}>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Status */}
          <div>
            <div style={lbl}>Status</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {STATUS_OPTS.map(opt=>(
                <button key={opt.key} onClick={()=>setStatus(opt.key)}
                  style={{padding:"7px 14px",borderRadius:8,fontFamily:"inherit",
                    fontSize:12.5,fontWeight:600,cursor:"pointer",
                    border:status===opt.key?`2px solid ${opt.col}`:"1.5px solid #E5E7EB",
                    background:status===opt.key?opt.bg:"#fff",
                    color:status===opt.key?opt.col:"#374151",transition:"all 0.1s"}}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Submit */}
          <button onClick={handleSubmit} disabled={!canSubmit}
            style={{width:"100%",padding:13,borderRadius:10,border:"none",
              fontSize:14,fontWeight:600,cursor:canSubmit?"pointer":"not-allowed",fontFamily:"inherit",
              background:canSubmit?"#111827":"#F3F4F6",
              color:canSubmit?"#fff":"#9CA3AF",transition:"background 0.15s"}}>
            {canSubmit?"Submit review":"Select next steps and status to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Garment Sample Detail (full version view) ─────────────────────────────────
