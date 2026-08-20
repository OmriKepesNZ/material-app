import React, { useState } from "react";
import GsBadge from "./GsBadge";
import GsCommentList from "./GsCommentList";
import GsReviewModal from "./GsReviewModal";
import GsNewVersionModal from "./GsNewVersionModal";
import VersionDropdown from "../shared/VersionDropdown";
import { formatDate } from "../../lib/format";
import { GS_STATUS_COLORS } from "../../lib/theme";

export default function GsDetail({ sample, view, onBack, onDecide, onSubmitVersion }) {
  const [activeIdx,   setActiveIdx]   = React.useState(sample.versions.length-1);
  const [showReview,  setShowReview]  = React.useState(false);
  const [showNewVer,  setShowNewVer]  = React.useState(false);

  const ver      = sample.versions[activeIdx];
  const isLatest = activeIdx === sample.versions.length-1;
  const d        = ver.brandDecision;

  const card = { padding:"12px 14px", background:"#FAFAFA", borderRadius:8, border:"1px solid #F3F4F6" };
  const lbl  = { fontSize:10, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
    letterSpacing:"0.07em", display:"block", marginBottom:4 };

  const DC = {
    "Approved":               { bg:"#F0FDF4", border:"#D1FAE5", text:"#065F46" },
    "Approved with Comments": { bg:"#EFF6FF", border:"#BFDBFE", text:"#1E40AF" },
    "New Sample Requested":   { bg:"#FFF3E0", border:"#FED7AA", text:"#B45309" },
    "Rejected":               { bg:"#FEF2F2", border:"#FEE2E2", text:"#991B1B" },
    "Other":                  { bg:"#F3F4F6", border:"#E5E7EB", text:"#374151" },
  };

  return (
    <div>
      {/* Breadcrumb header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <button onClick={onBack}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF",
              display:"flex", alignItems:"center", gap:4, fontSize:13, fontFamily:"inherit", padding:0 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{sample.productName}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <GsBadge status={ver.status}/>
          {view==="brand"&&isLatest&&!d&&(
            <button onClick={()=>setShowReview(true)}
              style={{padding:"7px 14px",background:"#0F1117",color:"#fff",
                border:"none",borderRadius:8,fontSize:13,fontWeight:600,
                cursor:"pointer",fontFamily:"inherit"}}>
              Review sample
            </button>
          )}
        </div>
      </div>

      {/* Version selector */}
      {sample.versions.length > 1 && (
        <VersionDropdown
          versions={sample.versions}
          activeIdx={activeIdx}
          onSelect={idx => setActiveIdx(idx)}
          labelFor={v => `V${v.versionNum}`}
          dateFor={v => formatDate(v.dateReceived)}
          dotFor={v => (GS_STATUS_COLORS[v.status]||{}).dot || "#9CA3AF"}
        />
      )}
      {!isLatest && (
        <div style={{ fontSize:11.5, color:"#B45309", background:"#FFF8E6", border:"1px solid #FDE9C3",
          borderRadius:7, padding:"6px 10px", marginBottom:14, display:"inline-block" }}>
          Viewing Proto {ver.versionNum} — an earlier version, not the latest submission
        </div>
      )}

      {/* Two-column body — matches MaterialDetail layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, alignItems:"start" }}>
        {/* Left: photos */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div style={lbl}>Sample photos</div>
            {ver.photos && ver.photos.length>0 ? (
              <>
                <div style={{width:"100%",aspectRatio:"4/3",borderRadius:10,
                  background:"#E5E7EB",border:"1px solid #E5E7EB",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  marginBottom:8,overflow:"hidden"}}>
                  {ver.photos[0].url || ver.photos[0].dataUrl
                    ? <img src={ver.photos[0].url||ver.photos[0].dataUrl} alt=""
                        style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{textAlign:"center"}}>
                        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#C4C9D4" strokeWidth="1.5" style={{display:"block",margin:"0 auto 6px"}}>
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                  }
                </div>
                {ver.photos.length>1&&(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {ver.photos.slice(1).map((ph,i)=>(
                      <div key={i} style={{width:64,height:54,borderRadius:7,
                        background:"#E5E7EB",border:"1px solid #E5E7EB",overflow:"hidden"}}>
                        {(ph.url||ph.dataUrl)&&<img src={ph.url||ph.dataUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{width:"100%",aspectRatio:"4/3",border:"1.5px dashed #E5E7EB",
                borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",background:"#FAFAFA",gap:8}}>
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style={{fontSize:11,color:"#D1D5DB"}}>No photos</span>
              </div>
            )}
          </div>
          {/* Additional files */}
          {ver.additionalFiles && ver.additionalFiles.length>0 && (
            <div style={card}>
              <div style={lbl}>Additional files</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {ver.additionalFiles.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:12}}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span style={{color:"#374151"}}>{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Metadata — matches MaterialDetail 3-col grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
            {[
              ["Factory", sample.factory||"—"],
              ["Sent",    formatDate(ver.dateReceived)],
              ["Reviewed", d ? formatDate(d.date) : "Pending"],
            ].map(([k,val])=>(
              <div key={k} style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:3 }}>{k}</div>
                <div style={{ fontSize:13, fontWeight:500, color: val==="Pending" ? "#C4C9D4" : "#111827" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: notes + decision + actions */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {ver.factoryNotes&&(
            <div style={card}>
              <div style={lbl}>Factory notes</div>
              <div style={{fontSize:13,color:"#374151",lineHeight:1.65}}>{ver.factoryNotes}</div>
            </div>
          )}

          {/* Brand decision */}
          {d&&(()=>{
            const dc = DC[d.type]||DC["Other"];
            const allSections = [
              {label:"Fit & function",rows:d.fitComments||[]},
              {label:"Manufacturing", rows:d.mfgComments||[]},
              {label:"Observations",  rows:d.obsComments||[]},
            ].filter(s=>s.rows.length>0&&s.rows.some(r=>r.text));
            return (<>
              <div style={{background:dc.bg,border:`1px solid ${dc.border}`,
                borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:600,color:dc.text,textTransform:"uppercase",
                  letterSpacing:"0.07em",marginBottom:4}}>{d.type}</div>
                {d.summary&&<div style={{fontSize:13,color:dc.text,lineHeight:1.65,marginBottom:6}}>{d.summary}</div>}
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:dc.text,opacity:0.6}}>{d.by} · {d.date}</span>
                  {d.nextSteps&&(
                    <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,
                      background:"rgba(0,0,0,0.06)",color:dc.text,opacity:0.8}}>
                      {d.nextSteps==="request-another"?"Another sample requested":"No more samples required"}
                    </span>
                  )}
                </div>
              </div>
              {allSections.map(sec=>(
                <div key={sec.label} style={card}>
                  <div style={lbl}>{sec.label}</div>
                  <GsCommentList comments={sec.rows}/>
                </div>
              ))}
              {d.measFile&&(
                <div style={card}>
                  <div style={lbl}>Measurement sheet</div>
                  <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12}}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span style={{color:"#374151"}}>{typeof d.measFile==="string"?d.measFile:d.measFile.name}</span>
                  </div>
                </div>
              )}
            </>);
          })()}

          {/* Factory: resubmit button */}
          {view==="factory"&&isLatest&&
            (ver.status==="New Sample Requested"||ver.status==="Rejected")&&(
            <button onClick={()=>setShowNewVer(true)}
              style={{padding:"11px",background:"#111827",color:"#fff",border:"none",
                borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              + Submit Version {ver.versionNum+1}
            </button>
          )}
        </div>
      </div>

      {showReview&&(
        <GsReviewModal sample={sample} versionIdx={activeIdx}
          onClose={()=>setShowReview(false)}
          onSubmit={async data => { await onDecide(sample.id, activeIdx, data); setShowReview(false); }}/>
      )}
      {showNewVer&&(
        <GsNewVersionModal sample={sample}
          onClose={()=>setShowNewVer(false)}
          onSubmit={async data => { await onSubmitVersion(data); setShowNewVer(false); }}/>
      )}
    </div>
  );
}

const thStyle = { padding:"9px 14px", textAlign:"left", fontSize:10.5, fontWeight:700, color:"#C4C9D4", textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" };
