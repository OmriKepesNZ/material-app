import React, { useState, useRef } from "react";
import Badge from "../shared/Badge";
import VersionDropdown from "../shared/VersionDropdown";
import Lightbox from "../shared/Lightbox";
import { ICO } from "../../lib/icons";
import { STATUS_COLORS } from "../../lib/theme";
import { COURIER_OPTIONS } from "../../lib/constants";
import { formatDate } from "../../lib/format";

export default function MaterialDetail({ material, view, onClose, onApprove, onReject,
  brandComment, setBrandComment, setMaterials, onSubmitNewVersion,
  showNewVersionFor, setShowNewVersionFor }) {

  // Local style constant — MaterialDetail lives outside App() so can't use App's inp
  const inp = { width:"100%", padding:"8px 10px", border:"1.5px solid #E5E7EB",
    borderRadius:7, fontSize:13, fontFamily:"inherit", color:"#111827",
    background:"#fff", outline:"none", boxSizing:"border-box" };

  const [activeVersionIdx, setActiveVersionIdx] = useState(material.versions.length - 1);
  const [editShipment,     setEditShipment]     = useState(false);
  const [newVer,           setNewVer]           = useState({ factoryNotes:"", courier:"DHL", trackingNumber:"", image:null });
  const [lightbox,         setLightbox]         = useState(null); // {src, name} | null
  const vFileRef = useRef();

  if (!material.versions.length) return (
    <div style={{ textAlign:"center", padding:60, color:"#9CA3AF" }}>
      No submissions yet.
      <button onClick={onClose} style={{ display:"block", margin:"16px auto 0", background:"none",
        border:"none", color:"#6B7280", cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>
        {ICO.back()} Back
      </button>
    </div>
  );

  const latest   = material.versions[material.versions.length - 1];
  const v        = material.versions[activeVersionIdx];
  const isLatest = activeVersionIdx === material.versions.length - 1;
  if (!v) return null;

  function handleVersionImg(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => setNewVer(f => ({ ...f, image: e.target.result }));
    r.readAsDataURL(file);
  }

  const card = { padding:"14px 16px", background:"#fff", borderRadius:10, border:"1px solid #EFEFEF", marginBottom:12 };

  return (
    <div>
      {/* Breadcrumb header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <button onClick={onClose}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF",
              display:"flex", alignItems:"center", gap:4, fontSize:13, fontFamily:"inherit", padding:0 }}>
            {ICO.back()} Back
          </button>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{material.materialName}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Badge status={v.status} />
          <Badge status={v.shipmentStatus} type="shipment" />
        </div>
      </div>

      {/* Version selector */}
      {material.versions.length > 1 && (
        <VersionDropdown
          versions={material.versions}
          activeIdx={activeVersionIdx}
          onSelect={idx => { setActiveVersionIdx(idx); setEditShipment(false); }}
          labelFor={ver => `V${ver.version}`}
          dateFor={ver => formatDate(ver.submissionDate)}
          dotFor={ver => (STATUS_COLORS[ver.status]||{}).dot || "#9CA3AF"}
        />
      )}
      {!isLatest && (
        <div style={{ fontSize:11.5, color:"#B45309", background:"#FFF8E6", border:"1px solid #FDE9C3",
          borderRadius:7, padding:"6px 10px", marginBottom:14, display:"inline-block" }}>
          Viewing V{v.version} — an earlier version, not the latest submission
        </div>
      )}

      {/* Two-column body */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, alignItems:"start" }}>

        {/* LEFT */}
        <div>
          {v.image
            ? <img src={v.image} alt="" onClick={() => setLightbox({ src: v.image, name: `${material.materialName}-v${v.version}` })}
                style={{ width:"100%", aspectRatio:"4/3", objectFit:"cover", cursor:"pointer",
                  borderRadius:12, border:"1px solid #E5E7EB", marginBottom:14, display:"block" }} />
            : <div style={{ width:"100%", aspectRatio:"4/3", border:"1.5px dashed #E5E7EB",
                borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", background:"#FAFAFA", gap:8, marginBottom:14 }}>
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style={{ fontSize:12, color:"#C4C9D4", fontWeight:500 }}>No photo uploaded</span>
              </div>
          }

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
            {[["Factory",material.factoryName||"—"],["Submitted",formatDate(v.submissionDate)],["Type",material.materialType||"—"]].map(([k,val])=>(
              <div key={k} style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:3 }}>{k}</div>
                <div style={{ fontSize:13, fontWeight:500, color:"#111827" }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em" }}>Shipment</div>
              {view==="factory" && isLatest && !editShipment && (
                <button onClick={()=>setEditShipment(true)} style={{ background:"none", border:"none",
                  fontSize:12, color:"#6B7280", cursor:"pointer", fontFamily:"inherit", padding:0 }}>Edit</button>
              )}
            </div>
            {!editShipment ? (
              <div style={{ fontSize:13, color:"#374151" }}>
                {v.courier && <span style={{ fontWeight:600 }}>{v.courier}</span>}
                {v.trackingNumber
                  ? <span style={{ fontFamily:"monospace", color:"#6366F1", marginLeft:8, fontSize:12 }}>{v.trackingNumber}</span>
                  : <span style={{ color:"#C4C9D4", marginLeft:6 }}>No tracking</span>}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                <select value={latest.courier} style={inp}
                  onChange={e=>setMaterials(p=>p.map(m=>m.id!==material.id?m:{...m,versions:m.versions.map((vv,i)=>i===m.versions.length-1?{...vv,courier:e.target.value}:vv)}))}>
                  {COURIER_OPTIONS.map(c=><option key={c}>{c}</option>)}
                </select>
                <input value={latest.trackingNumber} placeholder="Tracking number" style={inp}
                  onChange={e=>setMaterials(p=>p.map(m=>m.id!==material.id?m:{...m,versions:m.versions.map((vv,i)=>i===m.versions.length-1?{...vv,trackingNumber:e.target.value}:vv)}))} />
                <select value={latest.shipmentStatus} style={inp}
                  onChange={e=>setMaterials(p=>p.map(m=>m.id!==material.id?m:{...m,versions:m.versions.map((vv,i)=>i===m.versions.length-1?{...vv,shipmentStatus:e.target.value}:vv)}))}
                  >{["At Factory","In Transit","Delivered"].map(s=><option key={s}>{s}</option>)}</select>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>setEditShipment(false)} style={{ flex:1,padding:"7px",background:"#111827",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>Save</button>
                  <button onClick={()=>setEditShipment(false)} style={{ flex:1,padding:"7px",background:"transparent",color:"#6B7280",border:"1px solid #E5E7EB",borderRadius:6,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {v.factoryNotes && (
            <div style={card}>
              <div style={{ fontSize:11,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6 }}>Factory notes</div>
              <div style={{ fontSize:13,color:"#374151",lineHeight:1.7 }}>{v.factoryNotes}</div>
            </div>
          )}
          {v.extractedSpecs && (
            <div style={card}>
              <div style={{ fontSize:11,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6 }}>Specs</div>
              <pre style={{ fontSize:12,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"inherit",margin:0 }}>{v.extractedSpecs}</pre>
            </div>
          )}
          {v.brandComment && (
            <div style={{ ...card,
              background:v.status==="Approved"?"#F0FDF4":v.status==="Rejected"?"#FEF2F2":"#FAFAFA",
              border:`1px solid ${v.status==="Approved"?"#D1FAE5":v.status==="Rejected"?"#FEE2E2":"#F3F4F6"}` }}>
              <div style={{ fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6,
                color:v.status==="Approved"?"#065F46":v.status==="Rejected"?"#991B1B":"#9CA3AF" }}>Brand feedback</div>
              <div style={{ fontSize:13,lineHeight:1.7,color:v.status==="Approved"?"#065F46":v.status==="Rejected"?"#7F1D1D":"#374151" }}>{v.brandComment}</div>
            </div>
          )}
          {view==="brand" && isLatest && latest.status==="Pending" && (
            <div style={card}>
              <div style={{ fontSize:11,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8 }}>Review decision</div>
              <textarea value={brandComment} onChange={e=>setBrandComment(e.target.value)}
                placeholder="Add comment (optional)..." rows={3}
                style={{ ...inp,resize:"none",lineHeight:1.55,marginBottom:10 }} />
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={onApprove} style={{ flex:1,padding:"10px",background:"#10B981",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Approve</button>
                <button onClick={onReject}  style={{ flex:1,padding:"10px",background:"#fff",color:"#EF4444",border:"1.5px solid #EF4444",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Reject</button>
              </div>
            </div>
          )}
          {view==="factory" && isLatest && latest.status==="Rejected" && !showNewVersionFor && (
            <button onClick={()=>setShowNewVersionFor(material.id)}
              style={{ width:"100%",padding:12,background:"#111827",color:"#fff",border:"none",
                borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:12 }}>
              + Submit V{latest.version+1}
            </button>
          )}
          {view==="factory" && showNewVersionFor===material.id && (
            <div style={card}>
              <div style={{ fontSize:13,fontWeight:600,color:"#374151",marginBottom:12 }}>New Submission — V{latest.version+1}</div>
              <input ref={vFileRef} type="file" accept="image/*" style={{ display:"none" }}
                onChange={e=>handleVersionImg(e.target.files[0])} />
              <div style={{ display:"flex",flexDirection:"column",gap:9 }}>
                <div>
                  <div style={{ fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>Factory notes *</div>
                  <textarea value={newVer.factoryNotes} rows={3}
                    onChange={e=>setNewVer(f=>({...f,factoryNotes:e.target.value}))}
                    placeholder="What changed?" style={{ ...inp,resize:"none",lineHeight:1.55 }} />
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                  <div>
                    <div style={{ fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>Courier</div>
                    <select value={newVer.courier} onChange={e=>setNewVer(f=>({...f,courier:e.target.value}))} style={inp}>
                      {COURIER_OPTIONS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>Tracking</div>
                    <input value={newVer.trackingNumber} onChange={e=>setNewVer(f=>({...f,trackingNumber:e.target.value}))} placeholder="Optional" style={inp} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>Photo</div>
                  <div onClick={()=>vFileRef.current.click()} style={{ border:"1.5px dashed #E5E7EB",borderRadius:8,padding:"12px",textAlign:"center",cursor:"pointer",background:"#FAFAFA" }}>
                    {newVer.image?<img src={newVer.image} style={{ maxHeight:80,borderRadius:5 }} alt="" />:<span style={{ color:"#9CA3AF",fontSize:12 }}>Upload photo</span>}
                  </div>
                </div>
                <div style={{ display:"flex",gap:6 }}>
                  <button onClick={()=>{if(!newVer.factoryNotes.trim())return;onSubmitNewVersion(material.id,newVer);setNewVer({factoryNotes:"",courier:"DHL",trackingNumber:"",image:null});}}
                    style={{ flex:1,padding:"9px",background:"#111827",color:"#fff",border:"none",borderRadius:7,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>Submit</button>
                  <button onClick={()=>setShowNewVersionFor(null)}
                    style={{ flex:1,padding:"9px",background:"transparent",color:"#6B7280",border:"1px solid #E5E7EB",borderRadius:7,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {lightbox && (
        <Lightbox src={lightbox.src} name={lightbox.name} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
