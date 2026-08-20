import React, { useState, useRef, useEffect } from "react";
import Spinner from "../shared/Spinner";

export default function GsNewSampleModal({ onClose, onSubmit, existingProductNames, defaultProductName="" }) {
  const [step,        setStep]       = React.useState(1);
  const [productName, setProductName]= React.useState(defaultProductName);
  const [factory,     setFactory]    = React.useState("");
  const [dateSent,    setDateSent]   = React.useState(new Date().toISOString().slice(0,10));
  const [notes,       setNotes]      = React.useState("");
  const [photos,      setPhotos]     = React.useState([]);   // {name, dataUrl}
  const [files,       setFiles]      = React.useState([]);   // {name, dataUrl, type}
  const [submitting,  setSubmitting] = React.useState(false);
  const [visible,     setVisible]    = React.useState(false);
  const photoRef = React.useRef();
  const fileRef  = React.useRef();

  React.useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  function close() { setVisible(false); setTimeout(onClose, 200); }

  function readFile(file, cb) {
    const r = new FileReader();
    r.onload = e => cb(e.target.result);
    r.readAsDataURL(file);
  }
  function handlePhotos(fileList) {
    Array.from(fileList).forEach(f =>
      readFile(f, dataUrl => setPhotos(p => [...p, { name:f.name, dataUrl }]))
    );
  }
  function handleFiles(fileList) {
    Array.from(fileList).forEach(f =>
      readFile(f, dataUrl => setFiles(p => [...p, { name:f.name, dataUrl, type:f.type }]))
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    await onSubmit({ productName, factory, dateSent, notes, photos, additionalFiles: files });
    close();
  }

  const inp = { width:"100%", padding:"9px 11px", border:"1.5px solid #E5E7EB",
    borderRadius:8, fontSize:13, fontFamily:"inherit", color:"#111827",
    background:"#fff", outline:"none", boxSizing:"border-box" };
  const steps = ["Details", "Photos & files"];
  const isMatch = existingProductNames.some(n => n.toLowerCase() === productName.trim().toLowerCase());

  return (
    <div onClick={e => e.target===e.currentTarget && close()}
      style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center",
        justifyContent:"center", padding:20,
        background: visible?"rgba(10,10,15,0.52)":"rgba(10,10,15,0)",
        backdropFilter: visible?"blur(5px)":"blur(0)",
        transition:"background 0.22s, backdrop-filter 0.22s" }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:460,
        overflow:"hidden",
        boxShadow: visible?"0 0 0 1px rgba(0,0,0,0.06),0 24px 64px rgba(0,0,0,0.18)":"none",
        transform: visible?"translateY(0) scale(1)":"translateY(20px) scale(0.97)",
        opacity: visible?1:0,
        transition:"transform 0.24s cubic-bezier(0.22,1,0.36,1),opacity 0.18s" }}>
        {/* Header */}
        <div style={{ padding:"20px 24px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.02em" }}>New Garment Sample</div>
            <button onClick={close} style={{ width:30, height:30, borderRadius:8, border:"1px solid #E5E7EB",
              background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          {/* Step indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:20 }}>
            {steps.map((s, i) => {
              const sNum = i+1;
              const active = step===sNum, done = step>sNum;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", flex:i<steps.length-1?1:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, flexShrink:0,
                      background:done||active?"#111827":"#F3F4F6", color:done||active?"#fff":"#9CA3AF" }}>
                      {done ? <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : sNum}
                    </div>
                    <span style={{ fontSize:11, fontWeight:active?600:400, color:active?"#111827":"#9CA3AF", whiteSpace:"nowrap" }}>{s}</span>
                  </div>
                  {i<steps.length-1 && <div style={{ flex:1, height:1, background:"#E5E7EB", margin:"0 8px" }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Details */}
        {step===1 && (
          <div style={{ padding:"0 24px 24px", display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
                letterSpacing:"0.06em", marginBottom:6 }}>Product</div>
              {defaultProductName ? (
                <div style={{ ...inp, display:"flex", alignItems:"center", gap:8,
                  background:"#F9FAFB", color:"#111827", fontWeight:600, cursor:"default" }}>
                  {productName}
                </div>
              ) : (
                <>
                  <input list="gs-products" value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="Type a product or select existing..."
                    style={inp} />
                  <datalist id="gs-products">
                    {existingProductNames.map(n => <option key={n} value={n} />)}
                  </datalist>
                  {productName.trim().length > 1 && (
                    <div style={{ fontSize:11, marginTop:4,
                      color: isMatch ? "#10B981" : "#6366F1" }}>
                      {isMatch ? "✓ Adding version to existing product" : "+ Will create new product"}
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
                letterSpacing:"0.06em", marginBottom:6 }}>Date sent</div>
              <input type="date" value={dateSent} onChange={e => setDateSent(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
                letterSpacing:"0.06em", marginBottom:6 }}>Notes
                <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0,
                  color:"#C4C9D4" }}> — optional</span>
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Changes made, things to flag, courier info..."
                style={{ ...inp, resize:"none", lineHeight:1.55 }} />
            </div>
            <button onClick={() => setStep(2)} disabled={!productName.trim()}
              style={{ width:"100%", padding:13,
                background:productName.trim()?"#111827":"#F3F4F6",
                color:productName.trim()?"#fff":"#9CA3AF",
                border:"none", borderRadius:10, fontSize:14, fontWeight:600,
                cursor:productName.trim()?"pointer":"not-allowed", fontFamily:"inherit" }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Photos & files */}
        {step===2 && (
          <div style={{ padding:"0 24px 24px", display:"flex", flexDirection:"column", gap:14 }}>
            {/* Photos */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
                letterSpacing:"0.06em", marginBottom:6 }}>Sample photos</div>
              <input ref={photoRef} type="file" accept="image/*" multiple style={{ display:"none" }}
                onChange={e => handlePhotos(e.target.files)} />
              {photos.length > 0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                  {photos.map((ph,i) => (
                    <div key={i} style={{ position:"relative" }}>
                      <img src={ph.dataUrl} alt="" style={{ width:72, height:60, objectFit:"cover",
                        borderRadius:8, border:"1px solid #E5E7EB" }} />
                      <button onClick={() => setPhotos(p => p.filter((_,j)=>j!==i))}
                        style={{ position:"absolute", top:-5, right:-5, width:18, height:18,
                          borderRadius:"50%", background:"#111827", border:"none",
                          color:"#fff", cursor:"pointer", display:"flex",
                          alignItems:"center", justifyContent:"center", fontSize:10 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div onClick={() => photoRef.current.click()}
                style={{ border:"2px dashed #E5E7EB", borderRadius:10,
                  padding:photos.length>0?"12px":"28px 20px", textAlign:"center",
                  cursor:"pointer", background:"#FAFAFA", transition:"border-color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#111827"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#E5E7EB"}>
                <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:3 }}>
                  {photos.length>0?"+  Add more photos":"Upload photos"}
                </div>
                <div style={{ fontSize:12, color:"#9CA3AF" }}>Front, back, labels, details</div>
              </div>
            </div>

            {/* Additional files */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
                letterSpacing:"0.06em", marginBottom:6 }}>Additional files
                <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0,
                  color:"#C4C9D4" }}> — optional</span>
              </div>
              <div style={{ fontSize:11, color:"#C4C9D4", marginBottom:6 }}>
                Spec sheets, measurement charts, supporting documents
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.xlsx,.csv,.doc,.docx,image/*"
                multiple style={{ display:"none" }}
                onChange={e => handleFiles(e.target.files)} />
              {files.length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:8 }}>
                  {files.map((f,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
                      padding:"7px 10px", background:"#F9FAFB", border:"1px solid #E5E7EB",
                      borderRadius:7, fontSize:12 }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span style={{ flex:1, color:"#374151" }}>{f.name}</span>
                      <button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))}
                        style={{ background:"none", border:"none", color:"#9CA3AF",
                          cursor:"pointer", fontSize:14, lineHeight:1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div onClick={() => fileRef.current.click()}
                style={{ border:"1.5px dashed #E5E7EB", borderRadius:8, padding:"12px",
                  textAlign:"center", cursor:"pointer", background:"#FAFAFA",
                  fontSize:12, color:"#9CA3AF", transition:"border-color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#9CA3AF"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#E5E7EB"}>
                Attach PDF, spreadsheet or image
              </div>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setStep(1)}
                style={{ padding:"11px 18px", border:"1.5px solid #E5E7EB", borderRadius:10,
                  background:"#fff", fontSize:13, fontWeight:600, cursor:"pointer",
                  fontFamily:"inherit", color:"#374151" }}>Back</button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ flex:1, padding:13, background:submitting?"#F3F4F6":"#111827",
                  color:submitting?"#9CA3AF":"#fff", border:"none", borderRadius:10,
                  fontSize:14, fontWeight:600,
                  cursor:submitting?"not-allowed":"pointer", fontFamily:"inherit",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {submitting ? <><Spinner />Submitting...</> : "Submit sample"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

