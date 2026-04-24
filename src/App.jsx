import React, { useState, useRef, useEffect, useMemo } from "react";
import "./App.css";
import {
  loadAllData, createRecord, updateRecord, uploadImage, deleteProduct,
  loadGarmentSamples, createGarmentSample, createSampleVersion,
  reviewSampleVersion, uploadFile,
} from "./airtable";

// ─── Constants ──────────────────────────────────────────────────────────────
// These come from Airtable option fields — keep in sync with your field settings.
// If you rename an Airtable option, update it here too.
const MATERIAL_TYPES  = ["Lab Dip", "Trim", "Fabric Swatch"];
const COURIER_OPTIONS = ["DHL", "FedEx", "UPS", "Other"];

const STATUS_COLORS = {
  Pending:  { bg:"#FFF8E6", text:"#92400E", dot:"#F59E0B" },
  Approved: { bg:"#ECFDF5", text:"#065F46", dot:"#10B981" },
  Rejected: { bg:"#FEF2F2", text:"#991B1B", dot:"#EF4444" },
};
const SHIP_COLORS = {
  "At Factory": { bg:"#F3F4F6", text:"#374151", dot:"#9CA3AF" },
  "In Transit": { bg:"#EFF6FF", text:"#1D4ED8", dot:"#3B82F6" },
  "Delivered":  { bg:"#ECFDF5", text:"#065F46", dot:"#10B981" },
};
const GS_STATUS_COLORS = {
  "Awaiting Review":        { bg:"#FFF8E6", text:"#92400E",  dot:"#F59E0B" },
  "Approved":               { bg:"#ECFDF5", text:"#065F46",  dot:"#10B981" },
  "Approved with Comments": { bg:"#EFF6FF", text:"#1E40AF",  dot:"#3B82F6" },
  "New Sample Requested":   { bg:"#FFF3E0", text:"#B45309",  dot:"#F97316" },
  "Requires Resubmission":  { bg:"#FFF3E0", text:"#B45309",  dot:"#F97316" },
  "Rejected":               { bg:"#FEF2F2", text:"#991B1B",  dot:"#EF4444" },
};

// ─── Shared tiny components ──────────────────────────────────────────────────
function Badge({ status, type = "approval" }) {
  const c = (type === "approval" ? STATUS_COLORS : SHIP_COLORS)[status]
    || { bg:"#F3F4F6", text:"#374151", dot:"#9CA3AF" };
  return (
    <span className="badge" style={{ background:c.bg, color:c.text }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot }} />
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" style={{ animation:"spin 0.8s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

// Reusable SVG icons
const ICO = {
  close:   <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back:    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  chevron: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  check:   <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  plus:    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  photo:   <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  file:    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  trash:   <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  factory: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="2 20 2 10 8 6 8 10 14 6 14 10 20 6 22 6 22 20"/></svg>,
  brand:   <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8l-2 4h12l-2-4z"/></svg>,
  garment: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>,
  material:<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  search:  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

// ─── SearchBar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-wrap">
      <span className="search-icon">{ICO.search}</span>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} />
      {value && (
        <button onClick={() => onChange("")}
          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer", color:"#9CA3AF" }}>
          {ICO.close}
        </button>
      )}
    </div>
  );
}

// ─── AddRow (inline product/item create) ─────────────────────────────────────
function AddRow({ placeholder, onAdd, onCancel }) {
  const [val, setVal] = useState("");
  const ref = useRef();
  useEffect(() => { ref.current?.focus(); }, []);
  const submit = () => val.trim() ? onAdd(val.trim()) : onCancel();
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderTop:"1px solid #F3F4F6" }}>
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key==="Enter") submit(); if (e.key==="Escape") onCancel(); }}
        placeholder={placeholder}
        style={{ flex:1, padding:"7px 10px", border:"1.5px solid #111827", borderRadius:7,
          fontSize:13, fontFamily:"inherit", outline:"none", color:"#111827" }} />
      <button onClick={submit} className="btn-primary" style={{ padding:"7px 14px" }}>Add</button>
      <button onClick={onCancel} className="btn-outline" style={{ padding:"7px 10px" }}>Cancel</button>
    </div>
  );
}

// ─── Materials: New Submission Modal ─────────────────────────────────────────
// Simplified: 2 steps — pick type, upload photo + add details manually.
// AI extraction removed; all fields filled by the user.
function NewSubmissionModal({ onClose, onSubmit, existingStyles, existingMaterials }) {
  const [step,         setStep]        = useState("form");
  const [materialType, setMaterialType]= useState("");
  const [materialName, setMaterialName]= useState("");
  const [notes,        setNotes]       = useState("");
  const [specs,        setSpecs]       = useState("");
  const [image,        setImage]       = useState(null);
  const [courier,      setCourier]     = useState("DHL");
  const [tracking,     setTracking]    = useState("");
  const [visible,      setVisible]     = useState(false);
  const fileRef = useRef();

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const close = () => { setVisible(false); setTimeout(onClose, 200); };

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = e => setImage(e.target.result);
    r.readAsDataURL(file);
  }

  function handleSubmit() {
    // Find existing version number for this material
    const match = existingMaterials.find(m =>
      m.materialType === materialType &&
      m.materialName.toLowerCase() === materialName.toLowerCase()
    );
    const version = match ? match.versions.length + 1 : 1;
    onSubmit({
      materialType,
      materialName: materialName || "Unnamed",
      factoryNotes: notes,
      extractedSpecs: specs,
      image,
      courier,
      trackingNumber: tracking,
      shipmentStatus: tracking ? "In Transit" : "At Factory",
      season: "",
      factoryName: "",
      detectedVersion: version,
    });
    close();
  }

  const panelStyle = {
    background:"#fff", borderRadius:20, width:"100%", maxWidth:440, overflow:"hidden",
    boxShadow: visible ? "0 0 0 1px rgba(0,0,0,0.06),0 24px 64px rgba(0,0,0,0.18)" : "none",
    transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
    opacity: visible ? 1 : 0,
    transition: "transform 0.24s cubic-bezier(0.22,1,0.36,1),opacity 0.18s,box-shadow 0.24s",
  };

  return (
    <div onClick={e => e.target===e.currentTarget && close()}
      style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center",
        justifyContent:"center", padding:20,
        background: visible ? "rgba(10,10,15,0.55)" : "rgba(10,10,15,0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0)",
        transition:"background 0.22s,backdrop-filter 0.22s" }}>

      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
        onChange={e => handleFile(e.target.files[0])} />

      <div style={panelStyle}>
        {/* Header */}
        <div style={{ padding:"24px 24px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontSize:17, fontWeight:650, letterSpacing:"-0.02em" }}>New Submission</div>
            <button onClick={close} className="btn-outline"
              style={{ width:30, height:30, padding:0, justifyContent:"center" }}>{ICO.close}</button>
          </div>
        </div>

        {/* Step 1: pick type */}
        {step === "form" && (
          <div style={{ padding:"0 24px 24px" }}>
            <p style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:8 }}>Material Type</p>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {MATERIAL_TYPES.map(t => (
                <button key={t} onClick={() => setMaterialType(t)}
                  style={{ flex:1, padding:"10px 4px", borderRadius:8, border:"1.5px solid",
                    cursor:"pointer", fontFamily:"inherit", fontSize:12.5, fontWeight:500,
                    borderColor: materialType===t ? "#111827" : "#E5E7EB",
                    background:  materialType===t ? "#111827" : "#fff",
                    color:       materialType===t ? "#fff"    : "#374151" }}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("details")} disabled={!materialType}
              className="btn-primary" style={{ width:"100%", padding:13, justifyContent:"center",
                fontSize:14, borderRadius:10 }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: details + photo */}
        {step === "details" && (
          <div style={{ padding:"0 24px 24px", display:"flex", flexDirection:"column", gap:14 }}>
            <button onClick={() => setStep("form")}
              style={{ background:"none", border:"none", cursor:"pointer", display:"flex",
                alignItems:"center", gap:5, color:"#9CA3AF", fontSize:13, fontFamily:"inherit",
                padding:0, marginBottom:4 }}>
              {ICO.back} Back
            </button>

            <div>
              <p className="lbl">Material Name</p>
              <input value={materialName} onChange={e => setMaterialName(e.target.value)}
                placeholder={`e.g. Olive Lab Dip, YKK Zipper Pull...`}
                className="inp" />
            </div>

            <div>
              <p className="lbl">Factory Notes <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#C4C9D4" }}>— optional</span></p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="What was submitted, changes made..." className="inp" />
            </div>

            <div>
              <p className="lbl">Specs <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#C4C9D4" }}>— optional</span></p>
              <textarea value={specs} onChange={e => setSpecs(e.target.value)} rows={3}
                placeholder="Colour delta, composition, finish, dimensions..." className="inp" />
            </div>

            <div>
              <p className="lbl">Photo <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#C4C9D4" }}>— optional</span></p>
              <div onClick={() => fileRef.current.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                className="drop-zone">
                {image
                  ? <img src={image} alt="" style={{ maxHeight:80, borderRadius:5 }} />
                  : <><div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Drop photo here</div>
                     <div style={{ fontSize:12, color:"#9CA3AF" }}>or click to browse</div></>}
              </div>
            </div>

            <details>
              <summary style={{ fontSize:12, color:"#9CA3AF", cursor:"pointer", listStyle:"none" }}>
                + Add courier / tracking
              </summary>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10 }}>
                <div>
                  <p className="lbl">Courier</p>
                  <select value={courier} onChange={e => setCourier(e.target.value)} className="inp">
                    {COURIER_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <p className="lbl">Tracking No.</p>
                  <input value={tracking} onChange={e => setTracking(e.target.value)}
                    placeholder="Optional" className="inp" />
                </div>
              </div>
            </details>

            <button onClick={handleSubmit} disabled={!materialName.trim()}
              className="btn-primary" style={{ width:"100%", padding:13, justifyContent:"center",
                fontSize:14, borderRadius:10 }}>
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// --- Detail Modal --------------------------------------------------------------
function DetailModal({ material, view, onClose, onApprove, onReject, brandComment, setBrandComment, setMaterials, onSubmitNewVersion, showNewVersionFor, setShowNewVersionFor }) {
  const [visible, setVisible] = useState(false);
  const [editShipment, setEditShipment] = useState(false);
  const [newVer, setNewVer] = useState({ factoryNotes: "", courier: "DHL", trackingNumber: "", image: null });
  const [activeVersionIdx, setActiveVersionIdx] = useState(material.versions.length - 1);
  const vFileRef = useRef();

  const latest = material.versions[material.versions.length - 1];
  const v = material.versions[activeVersionIdx]; // currently viewed version
  const isLatest = activeVersionIdx === material.versions.length - 1;

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  function close() { setVisible(false); setTimeout(onClose, 200); }

  function handleVersionImg(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => setNewVer(f => ({ ...f, image: e.target.result }));
    r.readAsDataURL(file);
  }

  const inp = { width: "100%", padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, fontFamily: "inherit", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box" };
  const lbl = { fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 4 };
  const card = { padding: "12px 14px", background: "#FAFAFA", borderRadius: 8, border: "1px solid #F3F4F6" };

  return (
    <div onClick={e => e.target === e.currentTarget && close()}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        background: visible ? "rgba(10,10,15,0.5)" : "rgba(10,10,15,0)",
        backdropFilter: visible ? "blur(5px)" : "blur(0)",
        transition: "background 0.2s, backdrop-filter 0.2s" }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto",
        boxShadow: visible ? "0 0 0 1px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1), 0 32px 72px rgba(0,0,0,0.2)" : "none",
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.96)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.24s cubic-bezier(0.22,1,0.36,1), opacity 0.18s, box-shadow 0.24s",
        transformOrigin: "center bottom",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 2, borderRadius: "16px 16px 0 0" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.02em" }}>{material.materialName}</span>
              <span style={{ padding: "1px 7px", background: isLatest ? "#111827" : "#F3F4F6", borderRadius: 4, fontSize: 11, fontWeight: 700, color: isLatest ? "#fff" : "#374151", fontFamily: "monospace" }}>V{v.version}</span>
              <Badge status={v.status} />
              <Badge status={v.shipmentStatus} type="shipment" />
              {!isLatest && <span style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic" }}>- historical view</span>}
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              {material.styleName}<span style={{ margin: "0 4px", color: "#E5E7EB" }}>{" . "}</span>
              <span style={{ color: "#6B7280" }}>{material.materialType}</span>
              {material.season && <><span style={{ margin: "0 4px", color: "#E5E7EB" }}>{" . "}</span>{material.season}</>}
              <span style={{ margin: "0 4px", color: "#E5E7EB" }}>{" . "}</span>{material.factoryName}
            </div>
          </div>
          <button onClick={close} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 16 }}
            onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {v.image
              ? <img src={v.image} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10, border: "1px solid #E5E7EB" }} alt="" />
              : <div style={{ width: "100%", aspectRatio: "4/3", border: "1.5px dashed #E5E7EB", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAFAFA", gap: 8 }}>
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{ fontSize: 11, color: "#D1D5DB" }}>No image</span>
                </div>
            }
            <div style={{ ...card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={lbl}>Factory</div><div style={{ fontSize: 13, fontWeight: 500 }}>{material.factoryName}</div></div>
              <div><div style={lbl}>Submitted</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v.submissionDate}</div></div>
            </div>
            {/* Shipment - only editable on latest */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={lbl}>Shipment</div>
                {view === "factory" && !editShipment && isLatest && <button style={{ background: "none", border: "none", fontSize: 12, color: "#6B7280", cursor: "pointer", fontFamily: "inherit", padding: 0 }} onClick={() => setEditShipment(true)}>Edit</button>}
              </div>
              {!editShipment ? (
                <div style={{ fontSize: 12.5, color: "#374151" }}>
                  {v.courier && <span style={{ fontWeight: 600 }}>{v.courier}</span>}
                  {v.trackingNumber
                    ? <span style={{ fontFamily: "monospace", color: "#6366F1", marginLeft: 8, fontSize: 11.5 }}>{v.trackingNumber}</span>
                    : <span style={{ color: "#C4C9D4", marginLeft: 6 }}>No tracking number</span>}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <select value={latest.courier} onChange={e => setMaterials(p => p.map(m => m.id !== material.id ? m : { ...m, versions: m.versions.map((vv,i) => i===m.versions.length-1 ? {...vv, courier:e.target.value} : vv) }))} style={inp}>{COURIER_OPTIONS.map(c => <option key={c}>{c}</option>)}</select>
                  <input value={latest.trackingNumber} onChange={e => setMaterials(p => p.map(m => m.id !== material.id ? m : { ...m, versions: m.versions.map((vv,i) => i===m.versions.length-1 ? {...vv, trackingNumber:e.target.value} : vv) }))} placeholder="Tracking number" style={inp} />
                  <select value={latest.shipmentStatus} onChange={e => setMaterials(p => p.map(m => m.id !== material.id ? m : { ...m, versions: m.versions.map((vv,i) => i===m.versions.length-1 ? {...vv, shipmentStatus:e.target.value} : vv) }))} style={inp}>{["At Factory","In Transit","Delivered"].map(s => <option key={s}>{s}</option>)}</select>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ flex:1, padding:"7px 0", background:"#111827", color:"#fff", border:"none", borderRadius:6, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }} onClick={() => setEditShipment(false)}>Save</button>
                    <button style={{ flex:1, padding:"7px 0", background:"transparent", color:"#6B7280", border:"1px solid #E5E7EB", borderRadius:6, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }} onClick={() => setEditShipment(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {v.factoryNotes && (
              <div style={card}><div style={lbl}>Factory Notes</div><div style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{v.factoryNotes}</div></div>
            )}
            {v.brandComment && (
              <div style={{ ...card, background: v.status==="Approved" ? "#F0FDF4" : v.status==="Rejected" ? "#FEF2F2" : "#FAFAFA", border: `1px solid ${v.status==="Approved"?"#D1FAE5":v.status==="Rejected"?"#FEE2E2":"#F3F4F6"}` }}>
                <div style={{ ...lbl, color: v.status==="Approved"?"#065F46":v.status==="Rejected"?"#991B1B":"#9CA3AF" }}>Brand Feedback</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: v.status==="Approved"?"#065F46":v.status==="Rejected"?"#7F1D1D":"#374151" }}>{v.brandComment}</div>
              </div>
            )}

            {/* Brand actions only on latest */}
            {view === "brand" && isLatest && latest.status === "Pending" && (
              <div style={card}>
                <div style={lbl}>Review Decision</div>
                <textarea value={brandComment} onChange={e => setBrandComment(e.target.value)} placeholder="Add comment (optional)..." style={{ ...inp, resize:"none", height:64, fontSize:12.5, lineHeight:1.5, marginBottom:10 }} />
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={onApprove} style={{ flex:1, padding:"9px", background:"#10B981", color:"#fff", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Approve</button>
                  <button onClick={onReject}  style={{ flex:1, padding:"9px", background:"#fff", color:"#EF4444", border:"1.5px solid #EF4444", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Reject</button>
                </div>
              </div>
            )}
            {view === "factory" && isLatest && latest.status === "Rejected" && !showNewVersionFor && (
              <button onClick={() => setShowNewVersionFor(material.id)} style={{ padding:"11px", background:"#111827", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                + Submit V{latest.version+1}
              </button>
            )}
            {view === "factory" && showNewVersionFor === material.id && (
              <div style={card}>
                <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:10 }}>New Submission - V{latest.version+1}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  <div>
                    <div style={lbl}>Factory Notes *</div>
                    <textarea required value={newVer.factoryNotes} onChange={e => setNewVer(f=>({...f,factoryNotes:e.target.value}))} placeholder="What changed?" style={{ ...inp, resize:"none", height:60 }} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div><div style={lbl}>Courier</div><select value={newVer.courier} onChange={e=>setNewVer(f=>({...f,courier:e.target.value}))} style={inp}>{COURIER_OPTIONS.map(c=><option key={c}>{c}</option>)}</select></div>
                    <div><div style={lbl}>Tracking</div><input value={newVer.trackingNumber} onChange={e=>setNewVer(f=>({...f,trackingNumber:e.target.value}))} placeholder="Optional" style={inp}/></div>
                  </div>
                  <div>
                    <div style={lbl}>Image</div>
                    <input ref={vFileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleVersionImg(e.target.files[0])} />
                    <div onClick={()=>vFileRef.current.click()} style={{ border:"1.5px dashed #E5E7EB", borderRadius:7, padding:12, textAlign:"center", cursor:"pointer", background:"#fff" }}>
                      {newVer.image ? <img src={newVer.image} style={{ maxHeight:80, borderRadius:5 }} alt="" /> : <span style={{ color:"#9CA3AF", fontSize:12 }}>Upload photo</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => { if (!newVer.factoryNotes.trim()) return; onSubmitNewVersion(material.id, newVer); setNewVer({factoryNotes:"",courier:"DHL",trackingNumber:"",image:null}); }}
                      style={{ flex:1, padding:"8px", background:"#111827", color:"#fff", border:"none", borderRadius:6, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>Submit</button>
                    <button onClick={()=>setShowNewVersionFor(null)} style={{ flex:1, padding:"8px", background:"transparent", color:"#6B7280", border:"1px solid #E5E7EB", borderRadius:6, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Version history - simple rows, click to switch main panel */}
            {material.versions.length > 1 && (
              <div>
                <div style={lbl}>Version History</div>
                <div style={{ display:"flex", flexDirection:"column", gap: 3 }}>
                  {[...material.versions].reverse().map((ver, ri) => {
                    const idx = material.versions.length - 1 - ri;
                    const isActive = activeVersionIdx === idx;
                    return (
                      <div key={ver.version}
                        onClick={() => { setActiveVersionIdx(idx); setEditShipment(false); }}
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding: "8px 10px", borderRadius: 7, cursor: "pointer", transition: "background 0.08s", background: isActive ? "#F3F4F6" : "transparent" }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#FAFAFA"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "#F3F4F6" : "transparent"; }}>
                        <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#111827" : "#6B7280", fontFamily: "monospace" }}>V{ver.version}</span>
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{ver.submissionDate}</span>
                        </div>
                        <Badge status={ver.status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// =============================================================================
// GARMENT SAMPLE COMPONENTS
// Completely isolated from materials logic. All state prefixed with g/G.
// =============================================================================

function GsBadge({ status }) {
  const c = GS_STATUS_COLORS[status] || { bg:"#F3F4F6", text:"#374151", dot:"#9CA3AF" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px",
      borderRadius:20, background:c.bg, color:c.text, fontSize:11, fontWeight:600 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot }} />{status}
    </span>
  );
}

function GsSectionCard({ title, icon, children, defaultOpen=true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ background:"#fff", border:"1px solid #EFEFEF", borderRadius:12,
      overflow:"hidden", marginBottom:10 }}>
      <div onClick={() => setOpen(o=>!o)}
        style={{ padding:"12px 16px", display:"flex", alignItems:"center",
          justifyContent:"space-between", cursor:"pointer",
          borderBottom: open?"1px solid #F3F4F6":"none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8,
          fontSize:13, fontWeight:600, color:"#111827" }}>
          {icon}{title}
        </div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"
          style={{ transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.15s" }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
      {open && <div style={{ padding:"12px 16px" }}>{children}</div>}
    </div>
  );
}

function GsCommentList({ comments }) {
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

// ── New Garment Sample Modal (factory) ────────────────────────────────────────
function GsNewSampleModal({ onClose, onSubmit, existingProductNames }) {
  const [step,        setStep]       = React.useState(1);
  const [productName, setProductName]= React.useState("");
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
                letterSpacing:"0.06em", marginBottom:6 }}>Product name</div>
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

// ── Submit New Version Modal (factory resubmission) ───────────────────────────
function GsNewVersionModal({ sample, onClose, onSubmit }) {
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

// ── Brand Review Modal ────────────────────────────────────────────────────────
function GsReviewModal({ sample, versionIdx, onClose, onSubmit }) {
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
      fitComments:  fit.filter(r=>r.text.trim()),
      mfgComments:  mfg.filter(r=>r.text.trim()),
      obsComments:  obs.filter(r=>r.text.trim()),
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

  function CommentSection({ label, rows, setter, sKey }) {
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
          <CommentSection label="Fit & function" rows={fit} setter={setFit} sKey="fit"/>
          <CommentSection label="Manufacturing"  rows={mfg} setter={setMfg} sKey="mfg"/>
          <CommentSection label="Observations"   rows={obs} setter={setObs} sKey="obs"/>
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
function GsDetail({ sample, view, onBack, onDecide, onSubmitVersion }) {
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
    <div style={{background:"#fff",border:"1px solid #E8EAED",borderRadius:16,
      overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      {/* Sticky header */}
      <div style={{padding:"18px 22px 0",borderBottom:"1px solid #F3F4F6",
        position:"sticky",top:0,background:"#fff",zIndex:2}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",
              color:"#9CA3AF",display:"flex",alignItems:"center",gap:3,fontSize:12,
              fontFamily:"inherit",padding:0,marginBottom:6}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>All samples
            </button>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
              <span style={{fontSize:17,fontWeight:700,letterSpacing:"-0.02em",color:"#0F1117"}}>{sample.productName}</span>
              <span style={{padding:"1px 7px",background:isLatest?"#111827":"#F3F4F6",borderRadius:4,
                fontSize:11,fontWeight:700,color:isLatest?"#fff":"#374151",fontFamily:"monospace"}}>
                Proto {ver.versionNum}
              </span>
              <GsBadge status={ver.status}/>
              {!isLatest&&<span style={{fontSize:11,color:"#9CA3AF",fontStyle:"italic"}}>— historical view</span>}
            </div>
            <div style={{fontSize:12,color:"#9CA3AF",display:"flex",gap:4,flexWrap:"wrap"}}>
              <span>{sample.factory||""}</span>
              {sample.factory&&<span style={{color:"#E5E7EB"}}>·</span>}
              <span>Sent {ver.dateReceived}</span>
              {d&&<><span style={{color:"#E5E7EB"}}>·</span><span>Reviewed {d.date}</span></>}
            </div>
          </div>
          {view==="brand"&&isLatest&&!d&&(
            <button onClick={()=>setShowReview(true)}
              style={{padding:"8px 16px",background:"#0F1117",color:"#fff",
                border:"none",borderRadius:8,fontSize:13,fontWeight:600,
                cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
              Review sample
            </button>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{padding:"18px 22px 22px",display:"grid",
        gridTemplateColumns:"1fr 1fr",gap:20}}>
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
          {/* Dates */}
          <div style={card}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><div style={lbl}>Date sent</div><div style={{fontSize:13,fontWeight:500}}>{ver.dateReceived}</div></div>
              <div><div style={lbl}>Date reviewed</div>
                <div style={{fontSize:13,fontWeight:500}}>{d?.date||<span style={{color:"#C4C9D4"}}>Pending</span>}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: notes + decision + actions + version history */}
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

          {/* Version history */}
          {sample.versions.length>1&&(
            <div>
              <div style={lbl}>Version history</div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {[...sample.versions].reverse().map((v,ri)=>{
                  const idx = sample.versions.length-1-ri;
                  const isAct = idx===activeIdx;
                  return (
                    <div key={v.versionNum} onClick={()=>setActiveIdx(idx)}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                        padding:"8px 10px",borderRadius:7,cursor:"pointer",
                        background:isAct?"#F3F4F6":"transparent",transition:"background 0.08s"}}
                      onMouseEnter={e=>{if(!isAct)e.currentTarget.style.background="#FAFAFA";}}
                      onMouseLeave={e=>{if(!isAct)e.currentTarget.style.background="transparent";}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:12,fontWeight:isAct?700:500,
                          color:isAct?"#111827":"#6B7280",fontFamily:"monospace"}}>
                          Proto {v.versionNum}
                        </span>
                        <span style={{fontSize:12,color:"#9CA3AF"}}>{v.dateReceived}</span>
                      </div>
                      <GsBadge status={v.status}/>
                    </div>
                  );
                })}
              </div>
            </div>
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



export default function App() {

  const [view,    setView]    = useState("factory"); // "factory" | "brand"
  const [section, setSection] = useState("materials"); // "materials" | "samples"
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // ---- shared flat materials (populated from Airtable on mount) ----
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    loadAllData()
      .then(data => { setMaterials(data); setLoading(false); })
      .catch(err  => { console.error("Airtable load error:", err); setLoadError(err.message); setLoading(false); });
  }, []);

  // ---- garment samples state (separate from materials) ----
  const [gSamples,    setGSamples]    = useState([]);
  const [gLoading,    setGLoading]    = useState(false);
  const [gSelected,   setGSelected]   = useState(null); // airtableId of selected sample
  const [showNewGs,   setShowNewGs]   = useState(false);
  const [gSearch,     setGSearch]     = useState("");

  // Load garment samples when section switches to "samples"
  useEffect(() => {
    if (section !== "samples" || gSamples.length > 0) return;
    setGLoading(true);
    loadGarmentSamples()
      .then(data => { setGSamples(data); setGLoading(false); })
      .catch(err  => { console.error("Garment samples load error:", err); setGLoading(false); });
  }, [section]);

  const gSelectedSample = gSelected ? gSamples.find(s => s.id === gSelected) : null;

  // ---- garment sample mutators ----
  async function handleGsSubmit(data) {
    // Find if a sample already exists for this product name (to add a version)
    const existing = gSamples.find(s =>
      s.productName.toLowerCase() === data.productName.trim().toLowerCase()
    );
    // Find matching Airtable product id from materials products list
    const matchedProduct = products.find(p =>
      p.name.toLowerCase() === data.productName.trim().toLowerCase()
    );
    try {
      // Upload photos first (best-effort)
      const photoUrls = [];
      for (const ph of data.photos) {
        if (ph.dataUrl) {
          try {
            const url = await uploadImage(ph.dataUrl, ph.name);
            photoUrls.push(url);
          } catch(e) { console.warn("Photo upload failed:", e); }
        }
      }
      // Upload additional files
      const fileUrls = [];
      for (const f of (data.additionalFiles || [])) {
        if (f.dataUrl) {
          try {
            const url = await uploadFile(f.dataUrl, f.name);
            fileUrls.push(url);
          } catch(e) { console.warn("File upload failed:", e); }
        }
      }

      if (existing) {
        // Add a new version to the existing sample
        const nextVer = existing.versions.length + 1;
        const result = await createSampleVersion({
          garmentSampleId: existing.id,
          versionNum: nextVer,
          factoryNotes: data.notes,
          dateSent: data.dateSent,
          photoUrls,
          additionalFileUrls: fileUrls,
        });
        // Update local state optimistically
        const newVersion = {
          airtableId:      result.versionId,
          versionNum:      nextVer,
          dateReceived:    data.dateSent,
          status:          "Awaiting Review",
          factoryNotes:    data.notes,
          photos:          photoUrls.map((url,i) => ({ url, name: data.photos[i]?.name || "" })),
          additionalFiles: fileUrls.map((url,i) => ({ url, name: (data.additionalFiles||[])[i]?.name || "" })),
          brandDecision:   null,
        };
        setGSamples(p => p.map(s => s.id !== existing.id ? s : {
          ...s, status: "Awaiting Review",
          versions: [...s.versions, newVersion],
        }));
      } else {
        // Create a brand new sample
        const result = await createGarmentSample({
          productName: data.productName.trim(),
          factory: data.factory || "",
          airtableProductId: matchedProduct?.airtableProductId || null,
          factoryNotes: data.notes,
          dateSent: data.dateSent,
          photoUrls,
          additionalFileUrls: fileUrls,
        });
        const newSample = {
          id:          result.sampleId,
          airtableId:  result.sampleId,
          productName: data.productName.trim(),
          factory:     data.factory || "",
          status:      "Awaiting Review",
          versions: [{
            airtableId:      result.versionId,
            versionNum:      1,
            dateReceived:    data.dateSent,
            status:          "Awaiting Review",
            factoryNotes:    data.notes,
            photos:          photoUrls.map((url,i) => ({ url, name: data.photos[i]?.name || "" })),
            additionalFiles: fileUrls.map((url,i) => ({ url, name: (data.additionalFiles||[])[i]?.name || "" })),
            brandDecision:   null,
          }],
        };
        setGSamples(p => [newSample, ...p]);
      }
    } catch(err) {
      console.error("Failed to create garment sample:", err);
      alert("Could not save sample. Check console for details.");
    }
  }

  async function handleGsDecide(sampleId, versionIdx, reviewData) {
    const sample = gSamples.find(s => s.id === sampleId);
    const ver    = sample?.versions[versionIdx];
    if (!ver) return;
    try {
      // Upload measurement file if present
      let measurementFileUrl = null;
      if (reviewData.measFile) {
        try {
          const r = new FileReader();
          const dataUrl = await new Promise(res => { r.onload=e=>res(e.target.result); r.readAsDataURL(reviewData.measFile); });
          measurementFileUrl = await uploadFile(dataUrl, reviewData.measFile.name);
        } catch(e) { console.warn("Measurement file upload failed:", e); }
      }
      // Upload per-comment photos
      async function uploadCommentPhotos(rows) {
        return Promise.all(rows.map(async row => {
          const photos = await Promise.all((row.photos||[]).map(async ph => {
            if (!ph.dataUrl) return ph;
            try { return { ...ph, url: await uploadImage(ph.dataUrl, ph.name) }; }
            catch(e) { return ph; }
          }));
          return { ...row, photos };
        }));
      }
      const fitComments = await uploadCommentPhotos(reviewData.fitComments||[]);
      const mfgComments = await uploadCommentPhotos(reviewData.mfgComments||[]);
      const obsComments = await uploadCommentPhotos(reviewData.obsComments||[]);

      if (ver.airtableId) {
        await reviewSampleVersion({
          versionId:         ver.airtableId,
          garmentSampleId:   sampleId,
          status:            reviewData.status,
          reviewedBy:        "Brand",
          reviewDate:        new Date().toISOString().slice(0,10),
          summary:           reviewData.summary,
          nextSteps:         reviewData.nextSteps,
          fitComments,
          mfgComments,
          obsComments,
          measurementFileUrl,
        });
      }
      // Update local state
      const decision = {
        type:       reviewData.status,
        by:         "Brand",
        date:       new Date().toISOString().slice(0,10),
        summary:    reviewData.summary,
        nextSteps:  reviewData.nextSteps,
        fitComments,
        mfgComments,
        obsComments,
        measFile:   reviewData.measFile ? { name: reviewData.measFile.name, url: measurementFileUrl } : null,
      };
      setGSamples(p => p.map(s => {
        if (s.id !== sampleId) return s;
        const newVersions = s.versions.map((v,i) =>
          i !== versionIdx ? v : { ...v, status: reviewData.status, brandDecision: decision }
        );
        return { ...s, status: newVersions[newVersions.length-1].status, versions: newVersions };
      }));
    } catch(err) {
      console.error("Failed to submit review:", err);
      alert("Could not save review. Check console for details.");
    }
  }

  async function handleGsNewVersion(data) {
    const sample = gSamples.find(s => s.id === data.garmentSampleId);
    if (!sample) return;
    try {
      const photoUrls = [];
      for (const ph of data.photos||[]) {
        if (ph.dataUrl) {
          try { photoUrls.push(await uploadImage(ph.dataUrl, ph.name)); }
          catch(e) { console.warn("Photo upload failed:", e); }
        }
      }
      const fileUrls = [];
      for (const f of data.additionalFiles||[]) {
        if (f.dataUrl) {
          try { fileUrls.push(await uploadFile(f.dataUrl, f.name)); }
          catch(e) { console.warn("File upload failed:", e); }
        }
      }
      let versionId = null;
      if (sample.id && !sample.id.startsWith("local_")) {
        const result = await createSampleVersion({
          garmentSampleId:   sample.id,
          versionNum:        data.versionNum,
          factoryNotes:      data.factoryNotes,
          dateSent:          data.dateSent,
          photoUrls,
          additionalFileUrls: fileUrls,
        });
        versionId = result.versionId;
      }
      const newVersion = {
        airtableId:      versionId || ("local_" + Date.now()),
        versionNum:      data.versionNum,
        dateReceived:    data.dateSent,
        status:          "Awaiting Review",
        factoryNotes:    data.factoryNotes,
        photos:          photoUrls.map((url,i) => ({ url, name:(data.photos||[])[i]?.name||"" })),
        additionalFiles: fileUrls.map((url,i) => ({ url, name:(data.additionalFiles||[])[i]?.name||"" })),
        brandDecision:   null,
      };
      setGSamples(p => p.map(s => s.id !== sample.id ? s : {
        ...s, status:"Awaiting Review", versions:[...s.versions, newVersion],
      }));
    } catch(err) {
      console.error("Failed to submit new version:", err);
      alert("Could not save new version. Check console for details.");
    }
  }

  //  nav state 
  // Factory nav: null = product list  |  string productId = inside a product
  const [nav, setNav]                     = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  // Brand nav: null = product list  |  string productId = inside a product
  const [bNav, setBNav]                   = useState(null);

  //  shared material state 
  const [selected, setSelected]                   = useState(null);
  const [showNew, setShowNew]                     = useState(false);
  const [filters, setFilters]                     = useState({ type:"", status:"" });
  const [brandComment, setBrandComment]           = useState("");
  const [showNewVersionFor, setShowNewVersionFor] = useState(null);
  const [search, setSearch]                       = useState("");

  //  derive product list from Airtable materials (no hardcoded folders) 
  // Each unique styleName becomes one product folder.
  // airtableProductId is stored on the material so we can link new submissions.
  const products = useMemo(() => {
    const map = {};
    materials.forEach(m => {
      const name = m.styleName || "Unknown";
      if (!map[name]) map[name] = {
        id:               name,
        name,
        airtableProductId: m.airtableProductId || null,
        materialIds:      [],
      };
      // keep the first real airtableProductId we find
      if (!map[name].airtableProductId && m.airtableProductId) {
        map[name].airtableProductId = m.airtableProductId;
      }
      map[name].materialIds.push(m.id);
    });
    return Object.values(map);
  }, [materials]);

  //  derived nav objects 
  // Factory: nav is the product name string (used as id)
  const curProduct = nav ? products.find(p => p.id === nav) : null;
  // Brand: bNav is the product name string
  const curBProduct = bNav ? products.find(p => p.id === bNav) : null;

  //  scoped materials 
  const scopedMaterials = curProduct
    ? materials.filter(m => curProduct.materialIds.includes(m.id))
    : curBProduct
    ? materials.filter(m => curBProduct.materialIds.includes(m.id))
    : materials;

  const allStyles = [...new Set(materials.filter(m => m.materialName !== "__empty__").map(m => m.styleName).filter(Boolean))];
  const selectedMaterial = selected ? materials.find(m => m.id === selected) : null;

  //  nav helpers 
  function goHome()       { setNav(null);  setSelected(null); setAddingProduct(false); }
  function goProd(id)     { setNav(id);    setSelected(null); setFilters({ type:"", status:"" }); }
  function bGoHome()      { setBNav(null); setSelected(null); setSearch(""); }
  function bGoProd(id)    { setBNav(id);   setSelected(null); setFilters({ type:"", status:"" }); setSearch(""); }

  //  mutators 

  // Add a new product: creates Airtable Products record, optimistically adds to local state
  async function addProduct(name) {
    setAddingProduct(false);
    try {
      const created = await createRecord("Products", { "Product Name": name });
      // Add a sentinel material so the product folder is immediately visible
      const sentinel = {
        id:                "sentinel__" + created.id,
        airtableId:        null,
        airtableProductId: created.id,
        styleName:         name,
        brand:             "",
        season:            "",
        factoryName:       "",
        materialType:      "",
        materialName:      "__empty__",
        versions:          [],
      };
      setMaterials(p => [...p, sentinel]);
    } catch(err) {
      console.error("Failed to create product:", err);
    }
  }

  // Add a new submission: creates Airtable Materials + Submissions records
  async function addMaterial(data) {
    const productName       = curProduct?.name || "Unknown";
    const airtableProductId = curProduct?.airtableProductId || null;

    try {
      // 1. Create Material in Airtable FIRST (never blocked by image upload)
      const matFields = {
        "Material Name": data.materialName,
        "Type":          data.materialType,
        "Supplier":      data.factoryName || "",
      };
      if (airtableProductId) matFields["Product"] = [airtableProductId];
      const createdMat = await createRecord("Materials", matFields);

      // 2. Create Submission record (no photo yet)
      const subFields = {
        "Material":        [createdMat.id],
        "Version":         data.detectedVersion || 1,
        "Submission Date": new Date().toISOString().slice(0, 10),
        "Status":          "Pending",
        "Shipment Status": data.shipmentStatus || "At Factory",
      };
      if (data.factoryNotes)   subFields["Factory Notes"]   = data.factoryNotes;
      if (data.extractedSpecs) subFields["Extracted Specs"] = data.extractedSpecs;
      if (data.courier)        subFields["Courier"]         = data.courier;
      if (data.trackingNumber) subFields["Tracking Number"] = data.trackingNumber;
      const createdSub = await createRecord("Submissions", subFields);

      // 3. Add to local state immediately so it shows in the app
      const localImage = data.image || null; // use base64 locally for instant display
      const nm = {
        id:                createdMat.id,
        airtableId:        createdMat.id,
        airtableProductId: airtableProductId,
        styleName:         productName,
        brand:             curProduct?.brand  || "",
        season:            data.season        || "",
        factoryName:       data.factoryName   || "",
        materialType:      data.materialType,
        materialName:      data.materialName,
        versions: [{
          airtableId:     createdSub.id,
          version:        data.detectedVersion || 1,
          submissionDate: new Date().toISOString().slice(0, 10),
          image:          localImage,
          factoryNotes:   data.factoryNotes    || "",
          extractedSpecs: data.extractedSpecs  || "",
          status:         "Pending",
          brandComment:   "",
          approvalDate:   null,
          courier:        data.courier         || "",
          trackingNumber: data.trackingNumber  || "",
          shipmentStatus: data.shipmentStatus  || "At Factory",
        }],
      };
      setMaterials(p => [
        ...p.filter(m => m.materialName !== "__empty__" || m.styleName !== productName),
        nm,
      ]);

      // 4. Upload image separately — best-effort, patches submission after creation
      if (data.image && data.image.startsWith("data:")) {
        uploadImage(
          data.image,
          `${productName}_${data.materialName}_v${data.detectedVersion || 1}.jpg`
        ).then(photoUrl => {
          // Patch Airtable submission with the photo URL
          updateRecord("Submissions", createdSub.id, { "Photo": [{ url: photoUrl }] })
            .catch(e => console.warn("Photo patch failed:", e));
          // Update local state so thumbnail shows the hosted URL (not base64)
          setMaterials(p => p.map(m => m.id !== createdMat.id ? m : {
            ...m,
            versions: m.versions.map(v => v.airtableId !== createdSub.id ? v : { ...v, image: photoUrl }),
          }));
        }).catch(e => console.warn("Image upload failed (record still saved):", e));
      }

    } catch(err) {
      console.error("Failed to create submission:", err);
      alert("Could not save submission. Check console for details.");
    }
  }
  async function handleApprove() {
    const mat    = materials.find(m => m.id === selected);
    const latest = mat?.versions[mat.versions.length - 1];
    if (latest?.airtableId) {
      await updateRecord("Submissions", latest.airtableId, {
        "Status":        "Approved",
        "Brand Comment": brandComment,
        "Approval Date": new Date().toISOString().slice(0, 10),
      });
    }
    setMaterials(p => p.map(m => m.id !== selected ? m : { ...m,
      versions: m.versions.map((v,i) => i === m.versions.length-1 ? { ...v, status:"Approved", brandComment, approvalDate:new Date().toISOString().slice(0,10) } : v) }));
    setBrandComment("");
  }
  async function handleReject() {
    const mat    = materials.find(m => m.id === selected);
    const latest = mat?.versions[mat.versions.length - 1];
    if (latest?.airtableId) {
      await updateRecord("Submissions", latest.airtableId, {
        "Status":        "Rejected",
        "Brand Comment": brandComment,
        "Approval Date": new Date().toISOString().slice(0, 10),
      });
    }
    setMaterials(p => p.map(m => m.id !== selected ? m : { ...m,
      versions: m.versions.map((v,i) => i === m.versions.length-1 ? { ...v, status:"Rejected", brandComment, approvalDate:new Date().toISOString().slice(0,10) } : v) }));
    setBrandComment("");
  }
  async function handleNewVersion(materialId, nv) {
    const mat        = materials.find(m => m.id === materialId);
    const newVersion = mat ? mat.versions.length + 1 : 1;
    let   airtableId = null;

    // Create the submission record first (never blocked by image upload)
    if (mat?.airtableId) {
      const subFields = {
        "Material":        [mat.airtableId],
        "Version":         newVersion,
        "Submission Date": new Date().toISOString().slice(0, 10),
        "Factory Notes":   nv.factoryNotes,
        "Status":          "Pending",
        "Courier":         nv.courier,
        "Tracking Number": nv.trackingNumber,
        "Shipment Status": nv.trackingNumber ? "In Transit" : "At Factory",
      };
      const created = await createRecord("Submissions", subFields);
      airtableId = created.id;

      // Upload image separately after record is saved
      if (nv.image && nv.image.startsWith("data:") && airtableId) {
        uploadImage(nv.image, `${mat.materialName}_v${newVersion}.jpg`)
          .then(photoUrl => {
            updateRecord("Submissions", airtableId, { "Photo": [{ url: photoUrl }] })
              .catch(e => console.warn("Photo patch failed:", e));
            setMaterials(p => p.map(m => m.id !== materialId ? m : { ...m,
              versions: m.versions.map(v => v.airtableId !== airtableId ? v : { ...v, image: photoUrl }) }));
          })
          .catch(e => console.warn("Image upload failed (record still saved):", e));
      }
    }

    // Update local state immediately with base64 for instant display
    setMaterials(p => p.map(m => m.id !== materialId ? m : { ...m,
      versions:[...m.versions, { airtableId, version:newVersion, submissionDate:new Date().toISOString().slice(0,10),
        image: nv.image || null, factoryNotes:nv.factoryNotes, status:"Pending", brandComment:"", approvalDate:null,
        courier:nv.courier, trackingNumber:nv.trackingNumber, shipmentStatus:nv.trackingNumber ? "In Transit" : "At Factory" }] }));
    setShowNewVersionFor(null);
  }

  // Delete a product and all its materials/submissions
  async function handleDeleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const hasSubmissions = product.materialIds.some(id => {
      const m = materials.find(x => x.id === id);
      return m && m.materialName !== "__empty__" && m.versions.length > 0;
    });

    const confirmed = hasSubmissions
      ? window.confirm(`Delete "${product.name}" and all its submissions? This cannot be undone.`)
      : window.confirm(`Delete "${product.name}"?`);
    if (!confirmed) return;

    try {
      const airtableProductId = product.airtableProductId;
      if (airtableProductId) {
        await deleteProduct(airtableProductId);
      }
      // Remove from local state
      setMaterials(p => p.filter(m => !product.materialIds.includes(m.id)));
      // If we're navigated inside this product, go home
      if (nav === productId) setNav(null);
    } catch(err) {
      console.error("Delete failed:", err);
      alert("Could not delete product: " + err.message);
    }
  }

  // ---- search ----
  const allMats = materials
    .filter(m => m.materialName !== "__empty__" && m.versions.length > 0)
    .map(m => ({ ...m, latest: m.versions[m.versions.length-1] }));
  const searchResults = search.trim().length > 1
    ? allMats.filter(m => {
        const q = search.toLowerCase();
        return m.materialName.toLowerCase().includes(q)
          || m.materialType.toLowerCase().includes(q)
          || m.styleName.toLowerCase().includes(q)
          || m.factoryName.toLowerCase().includes(q)
          || (m.season && m.season.toLowerCase().includes(q))
          || (m.latest?.status || "").toLowerCase().includes(q);
      })
    : null;

  // ---- style constants ----
  const ddArrow = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")";

  // ---- icons ----
  const icoFolder   = <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8l-2 4h12l-2-4z"/></svg>;
  const icoProduct  = <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
  const icoFactory  = <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><polygon points="2 20 2 10 8 6 8 10 14 6 14 10 20 6 22 6 22 20"/></svg>;
  const icoCal      = <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

  // ---- shared filter bar ----
  function FilterBar({ extraKey }) {
    return (
      <div style={{ display:"flex", gap:7, flex:1 }}>
        {[{ key:"type", options:MATERIAL_TYPES, ph:"Type" }, { key:"status", options:["Pending","Approved","Rejected"], ph:"Status" }].map(({ key, options, ph }) => (
          <select key={key} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]:e.target.value }))}
            style={{ ...inp, minWidth:100, color:filters[key]?"#111827":"#9CA3AF" }}>
            <option value="">{ph}</option>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {Object.values(filters).some(Boolean) && <button onClick={() => setFilters({ type:"", status:"" })} style={{ ...inp, cursor:"pointer", color:"#9CA3AF", background:"transparent", border:"1px solid #E5E7EB" }}>Clear</button>}
      </div>
    );
  }

  // ---- materials table (shared) ----
  function MatTable({ rows, showContext = false }) {
    const filtered = rows.filter(m => (!filters.type || m.materialType === filters.type) && (!filters.status || m.latest.status === filters.status));
    return (
      <div style={{ background:"#fff", border:"1px solid #E8EAED", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #F3F4F6", background:"#FAFAFA" }}>
              {showContext && <th className="th">Product / Factory</th>}
              {["Type","Material","Version","Shipment","Status"].map(h => <th key={h} className="th">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={showContext ? 6 : 5} style={{ padding:48, textAlign:"center", color:"#C4C9D4", fontSize:13 }}>No materials found</td></tr>
              : filtered.map((m, idx) => (
                <tr key={m.id} className="mrow"
                  onClick={() => { setSelected(m.id); setBrandComment(m.latest.brandComment||""); setShowNewVersionFor(null); }}
                  style={{ borderBottom: idx < filtered.length-1 ? "1px solid #F9FAFB" : "none", background:"#fff", transition:"background 0.08s" }}>
                  {showContext && (
                    <td style={{ padding:"10px 14px" }}>
                      <div style={{ fontSize:12.5, fontWeight:500 }}>{m.styleName}</div>
                      <div style={{ fontSize:11, color:"#C4C9D4", marginTop:1 }}>{m.factoryName}</div>
                    </td>
                  )}
                  <td style={{ padding:"11px 14px", fontSize:12, color:"#9CA3AF" }}>{m.materialType}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                      {m.latest.image
                        ? <img src={m.latest.image} style={{ width:36, height:36, objectFit:"cover", borderRadius:7, border:"1px solid #E5E7EB", flexShrink:0 }} alt="" />
                        : <div style={{ width:36, height:36, borderRadius:7, border:"1.5px dashed #E5E7EB", background:"#F3F4F6", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                      }
                      <span style={{ fontSize:13, fontWeight:500, textAlign:"left" }}>{m.materialName}</span>
                    </div>
                  </td>
                  <td style={{ padding:"11px 14px" }}><span style={{ padding:"1px 7px", background:"#F3F4F6", borderRadius:4, fontSize:11, fontWeight:700, color:"#374151", fontFamily:"monospace" }}>V{m.latest.version}</span></td>
                  <td style={{ padding:"11px 14px" }}><Badge status={m.latest.shipmentStatus} type="shipment" /></td>
                  <td style={{ padding:"11px 14px" }}><Badge status={m.latest.status} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }

  // ---- folder row ----
  function FolderRow({ icon, title, sub, onClick, last, onDelete }) {
    return (
      <div className="frow" onClick={onClick}
        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:last?"none":"1px solid #F3F4F6", background:"#fff", transition:"background 0.08s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{icon}</div>
          <div>
            <div style={{ fontSize:14, fontWeight:600 }}>{title}</div>
            {sub && <div style={{ fontSize:11.5, color:"#9CA3AF", marginTop:1 }}>{sub}</div>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ width:28, height:28, borderRadius:6, border:"1px solid #F3F4F6", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#D1D5DB", transition:"all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#FEE2E2"; e.currentTarget.style.color="#EF4444"; e.currentTarget.style.background="#FEF2F2"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="#F3F4F6"; e.currentTarget.style.color="#D1D5DB"; e.currentTarget.style.background="transparent"; }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          )}
          {ICO.chevron}
        </div>
      </div>
    );
  }

  // ---- folder level wrapper ----
  function Level({ title, count, action, children }) {
    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:19, fontWeight:650, letterSpacing:"-0.02em" }}>{title}</div>
            {count && <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>{count}</div>}
          </div>
          {action}
        </div>
        {children}
      </div>
    );
  }

  // ---- breadcrumb pieces ----
  function BCBtn({ label, dim, onClick }) {
    return <button onClick={onClick||undefined} style={{ background:"none", border:"none", fontFamily:"inherit", fontSize:13, fontWeight:600, color:dim?"#9CA3AF":"#111827", cursor:onClick?"pointer":"default", padding:"2px 4px", borderRadius:4, whiteSpace:"nowrap" }}>{label}</button>;
  }
  function BCSep() { return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>; }


  // ---- loading / error screens ----
  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"DM Sans, Helvetica Neue, sans-serif", color:"#9CA3AF", fontSize:14, background:"#F9FAFB" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:32, height:32, border:"2.5px solid #E5E7EB", borderTopColor:"#111827", borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 14px" }} />
        Loading...
      </div>
    </div>
  );
  if (loadError) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"DM Sans, Helvetica Neue, sans-serif", color:"#EF4444", fontSize:13, background:"#F9FAFB", padding:24 }}>
      <div style={{ textAlign:"center", maxWidth:360 }}>
        <div style={{ fontWeight:600, marginBottom:8 }}>Could not connect to Airtable</div>
        <div style={{ color:"#9CA3AF", lineHeight:1.6 }}>{loadError}</div>
        <div style={{ color:"#C4C9D4", fontSize:11.5, marginTop:12 }}>Check your AIRTABLE_TOKEN and AIRTABLE_BASE_ID in Vercel environment variables.</div>
      </div>
    </div>
  );

  return (
    <div className="app-root">


      {/* ===== NAV BAR ===== */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E8EAED", flexShrink:0 }}>
        <div style={{ height:56, display:"flex", alignItems:"center",
          justifyContent:"space-between", padding:"0 24px" }}>

          {/* Logo + breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:6, overflow:"hidden", minWidth:0 }}>
            <div style={{ width:24, height:24, background:"#111827", borderRadius:6, display:"flex",
              alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {ICO.check}
            </div>

            {section === "materials" && view === "factory" && (
              <>
                <BCBtn label="Approvals" dim={!!nav} onClick={goHome} />
                {curProduct && <><BCSep/><BCBtn label={curProduct.name} dim={false} onClick={null} /></>}
              </>
            )}
            {section === "materials" && view === "brand" && (
              <>
                <BCBtn label="Approvals" dim={!!bNav} onClick={bGoHome} />
                {curBProduct && <><BCSep/><BCBtn label={curBProduct.name} dim={false} onClick={null} /></>}
              </>
            )}
            {section === "samples" && (
              <>
                <BCBtn label="Approvals" dim={!!gSelected} onClick={() => { setGSelected(null); setGSearch(""); }} />
                {gSelectedSample && <><BCSep/><BCBtn label={gSelectedSample.productName} dim={false} onClick={null} /></>}
              </>
            )}
          </div>

          {/* Factory / Brand pill toggle */}
          <div style={{ display:"flex", background:"#0F1117", borderRadius:40,
            padding:4, gap:2, boxShadow:"0 2px 8px rgba(0,0,0,0.18)" }}>
            {[
              { v:"factory", label:"Factory",
                icon:<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="2 20 2 10 8 6 8 10 14 6 14 10 20 6 22 6 22 20"/></svg> },
              { v:"brand", label:"Brand",
                icon:<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8l-2 4h12l-2-4z"/></svg> },
            ].map(({ v, icon, label }) => (
              <button key={v}
                onClick={() => { setView(v); setNav(null); setBNav(null); setGSelected(null); setSearch(""); setGSearch(""); }}
                style={{ display:"flex", alignItems:"center", gap:5,
                  padding:"6px 14px", borderRadius:32, border:"none", cursor:"pointer",
                  fontFamily:"inherit", fontSize:12, fontWeight:600,
                  background: view===v ? "#fff" : "transparent",
                  color: view===v ? "#111827" : "rgba(255,255,255,0.45)",
                  transition:"all 0.15s cubic-bezier(0.34,1.56,0.64,1)" }}>
                {icon}{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== BODY: sidebar + content ===== */}
      <div style={{ display:"flex", flex:1, minHeight:0, overflow:"hidden" }}>

        {/* ── Sidebar ── */}
        <div style={{ width:200, background:"#fff", borderRight:"1px solid #E8EAED",
          flexShrink:0, padding:"16px 10px", display:"flex", flexDirection:"column", gap:2,
          overflowY:"auto" }}>

          <div style={{ fontSize:10, fontWeight:700, color:"#C4C9D4", textTransform:"uppercase",
            letterSpacing:"0.08em", padding:"0 8px", marginBottom:6 }}>Approvals</div>

          {[
            { key:"materials", label:"Materials",
              count: materials.filter(m => m.materialName !== "__empty__" && m.versions.length > 0
                && m.versions[m.versions.length-1].status === "Pending").length,
              icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
            { key:"samples", label:"Garment Samples",
              count: gSamples.filter(s => s.status === "Awaiting Review").length,
              icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg> },
          ].map(item => (
            <button key={item.key} className="navitem"
              onClick={() => { setSection(item.key); setGSelected(null); setNav(null); setBNav(null); }}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"8px 10px", borderRadius:7, border:"none", cursor:"pointer",
                fontFamily:"inherit", textAlign:"left", width:"100%",
                background: section===item.key ? "#F3F4F6" : "transparent",
                transition:"background 0.1s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ color: section===item.key ? "#0F1117" : "#9CA3AF",
                  display:"flex", alignItems:"center" }}>{item.icon}</span>
                <span style={{ fontSize:13, fontWeight: section===item.key ? 600 : 400,
                  color: section===item.key ? "#0F1117" : "#6B7280" }}>{item.label}</span>
              </div>
              {item.count > 0 && (
                <span style={{ fontSize:10, fontWeight:700, minWidth:18, height:18,
                  borderRadius:9, background: section===item.key ? "#0F1117" : "#E5E7EB",
                  color: section===item.key ? "#fff" : "#6B7280",
                  display:"flex", alignItems:"center", justifyContent:"center", padding:"0 5px" }}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Main scrollable content ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"28px 28px 100px", minWidth:0 }}>

        {/* ===== PAGE CONTENT ===== */}
        <div style={{ maxWidth:900 }}>



        {/* ===== MATERIALS SECTION ===== */}
        {section === "materials" && (<>

        {/* ---- FACTORY VIEW ---- */}
        {view === "factory" && (
          <>
            {!nav && searchResults === null && (
              <>
                {/* Dashboard header */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
                  <div>
                    <div style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.03em", color:"#0F1117", lineHeight:1.1 }}>Material Approvals</div>
                    {(() => {
                      const allReal = materials.filter(m => m.materialName !== "__empty__" && m.versions.length > 0);
                      const pending = allReal.filter(m => m.versions[m.versions.length-1].status === "Pending").length;
                      const prods   = products.filter(p => p.materialIds.some(id => materials.find(m => m.id===id && m.materialName!=="__empty__"))).length;
                      const urgent  = allReal.filter(m => {
                        const v = m.versions[m.versions.length-1];
                        const days = v.submissionDate ? Math.floor((Date.now()-new Date(v.submissionDate))/(1000*60*60*24)) : 0;
                        return v.status === "Pending" && days >= 5;
                      }).length;
                      return <div style={{ fontSize:13, color:"#8B909A", marginTop:5, fontWeight:500 }}>{pending} Pending · {prods} Product{prods!==1?"s":""}{urgent>0?` · ${urgent} Urgent`:""}</div>;
                    })()}
                  </div>
                  <button onClick={() => setAddingProduct(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", background:"#0F1117", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(0,0,0,0.18)", letterSpacing:"-0.01em" }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Product
                  </button>
                </div>

                {/* Summary stat cards */}
                {(() => {
                  const allReal = materials.filter(m => m.materialName !== "__empty__" && m.versions.length > 0);
                  const pending  = allReal.filter(m => m.versions[m.versions.length-1].status === "Pending").length;
                  const overdue  = allReal.filter(m => {
                    const v = m.versions[m.versions.length-1];
                    const days = v.submissionDate ? Math.floor((Date.now()-new Date(v.submissionDate))/(1000*60*60*24)) : 0;
                    return v.status === "Pending" && days >= 5;
                  }).length;
                  const approved = allReal.filter(m => m.versions[m.versions.length-1].status === "Approved").length;
                  const cards = [
                    { label:"Pending",           value:pending,  sub:"Pending",            icon:<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, bg:"#FFFBEB", ring:"#FDE68A", ic:"#FEF3C7" },
                    { label:"Overdue",            value:overdue,  sub:"Overdue",            icon:<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, bg:"#FEF2F2", ring:"#FEE2E2", ic:"#FEE2E2" },
                    { label:"Approved This Week", value:approved, sub:"Approved",           icon:<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>, bg:"#ECFDF5", ring:"#A7F3D0", ic:"#D1FAE5" },
                  ];
                  return (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:28 }}>
                      {cards.map(c => (
                        <div key={c.label} style={{ background:"#fff", border:`1px solid ${c.ring}`, borderRadius:14, padding:"18px 20px", display:"flex", alignItems:"center", gap:14 }}>
                          <div style={{ width:42, height:42, borderRadius:10, background:c.ic, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{c.icon}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:"#6B7280", marginBottom:2 }}>{c.label}</div>
                            <div style={{ fontSize:28, fontWeight:800, color:"#0F1117", letterSpacing:"-0.04em", lineHeight:1 }}>{c.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}

            {/* Search bar */}
            <SearchBar search={search} setSearch={setSearch} placeholder="Search products, materials, suppliers..." />

            {searchResults !== null
              ? (<div>
                  <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:12 }}>
                    {searchResults.length} result{searchResults.length!==1?"s":""} for <span style={{ fontWeight:600, color:"#374151" }}>"{search}"</span>
                  </div>
                  <MatTable rows={searchResults} showContext />
                 </div>)
              : <>
                  {/* L1: product cards */}
                  {!nav && (
                    <div>
                      {products.length===0 && !addingProduct && (
                        <div style={{ padding:"64px 24px", textAlign:"center", background:"#fff", borderRadius:16, border:"1px solid #E8EAED" }}>
                          <div style={{ fontSize:32, marginBottom:10 }}>🎉</div>
                          <div style={{ fontWeight:700, fontSize:15, color:"#111827", marginBottom:6 }}>No products yet</div>
                          <div style={{ color:"#9CA3AF", fontSize:13 }}>Add a product to start tracking material approvals</div>
                        </div>
                      )}
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {products.map(p => {
                          const mats    = p.materialIds.map(id => materials.find(m => m.id===id)).filter(Boolean);
                          const real    = mats.filter(m => m.materialName !== "__empty__" && m.versions.length > 0);
                          const pending = real.filter(m => m.versions[m.versions.length-1].status === "Pending").length;
                          const approved= real.filter(m => m.versions[m.versions.length-1].status === "Approved").length;
                          const rejected= real.filter(m => m.versions[m.versions.length-1].status === "Rejected").length;
                          const thumb   = real.find(m => m.versions[m.versions.length-1].image)?.versions.slice(-1)[0].image || null;

                          // Use approvalDate when available (approved/rejected), else submissionDate
                          const latestMat = real.length > 0 ? real[real.length-1] : null;
                          const latestVer = latestMat ? latestMat.versions[latestMat.versions.length-1] : null;
                          const displayDate = latestVer
                            ? (latestVer.approvalDate || latestVer.submissionDate)
                            : null;
                          const daysAgo = displayDate ? Math.floor((Date.now()-new Date(displayDate))/(1000*60*60*24)) : null;
                          const timeStr = daysAgo === null ? "" : daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

                          // Factory-specific status label: Rejected → Requires Resubmission
                          const dominantStatus = pending > 0 ? "Pending" : rejected > 0 ? "Rejected" : approved > 0 ? "Approved" : null;
                          const factoryLabel   = dominantStatus === "Rejected" ? "Requires Resubmission" : dominantStatus;
                          const sc = STATUS_COLORS[dominantStatus] || { bg:"#F3F4F6", text:"#6B7280", dot:"#9CA3AF" };
                          // Resubmission pill gets a distinct orange-red colour
                          const pillStyle = dominantStatus === "Rejected"
                            ? { bg:"#FFF3E0", text:"#B45309", dot:"#F97316" }
                            : sc;

                          // Button label: only "Review" when brand needs to act (pending).
                          // Factory has nothing to action on pending — use "Open" instead.
                          const btnLabel = rejected > 0 ? "Resubmit" : "Open";
                          const btnStyle = rejected > 0
                            ? { background:"#0F1117", color:"#fff" }
                            : { background:"#F3F4F6", color:"#374151" };

                          return (
                            <div key={p.id} className="prow"
                              onClick={() => goProd(p.id)}
                              style={{ background:"#fff", border:"1px solid #E8EAED", borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:16, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                              {/* Thumbnail */}
                              <div style={{ width:56, height:56, borderRadius:10, background:"#F3F4F6", flexShrink:0, overflow:"hidden", border:"1px solid #E8EAED", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {thumb
                                  ? <img src={thumb} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                                  : <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                                }
                              </div>
                              {/* Info */}
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                                  <span style={{ fontSize:15, fontWeight:700, color:"#0F1117", letterSpacing:"-0.02em" }}>{p.name}</span>
                                  {factoryLabel && (
                                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, background:pillStyle.bg, color:pillStyle.text, fontSize:11, fontWeight:600 }}>
                                      <span style={{ width:5, height:5, borderRadius:"50%", background:pillStyle.dot }} />{factoryLabel}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize:12.5, color:"#8B909A", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                  {real.length > 0 && <span>{real.length} submission{real.length!==1?"s":""}</span>}
                                  {pending > 0 && <><span style={{ color:"#E5E7EB" }}>·</span><span style={{ color:"#D97706", fontWeight:600 }}>{pending} awaiting brand</span></>}
                                  {rejected > 0 && pending === 0 && <><span style={{ color:"#E5E7EB" }}>·</span><span style={{ color:"#F97316", fontWeight:600 }}>{rejected} need{rejected===1?"s":""} resubmission</span></>}
                                  {timeStr && <><span style={{ color:"#E5E7EB" }}>·</span><span>{latestVer?.approvalDate ? "Decided" : "Submitted"} {timeStr}</span></>}
                                </div>
                              </div>
                              {/* Actions */}
                              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                                <button onClick={e => { e.stopPropagation(); handleDeleteProduct(p.id); }}
                                  style={{ width:30, height:30, borderRadius:7, border:"1px solid #F3F4F6", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#D1D5DB", transition:"all 0.12s" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor="#FEE2E2"; e.currentTarget.style.color="#EF4444"; e.currentTarget.style.background="#FEF2F2"; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor="#F3F4F6"; e.currentTarget.style.color="#D1D5DB"; e.currentTarget.style.background="transparent"; }}>
                                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                </button>
                                <button onClick={e => { e.stopPropagation(); goProd(p.id); }}
                                  style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", border:"none", borderRadius:8, fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit", ...btnStyle }}>
                                  {btnLabel}
                                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {addingProduct && (
                          <div style={{ background:"#fff", border:"1.5px dashed #CBD5E1", borderRadius:14, overflow:"hidden" }}>
                            <AddRow placeholder="Product name..." onAdd={addProduct} onCancel={() => setAddingProduct(false)} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* L2: submissions inside a product */}
                  {curProduct && (
                    <div>
                      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
                        <FilterBar />
                        <button onClick={() => setShowNew(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"#0F1117", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          New Submission
                        </button>
                      </div>
                      <MatTable rows={scopedMaterials.filter(m => m.materialName!=="__empty__" && m.versions.length > 0).map(m => ({ ...m, latest:m.versions[m.versions.length-1] }))} />
                      {scopedMaterials.filter(m => m.materialName!=="__empty__").length === 0 && (
                        <div style={{ padding:"48px 24px", textAlign:"center", background:"#fff", borderRadius:14, border:"1px solid #E8EAED", marginTop:2 }}>
                          <div style={{ fontWeight:600, fontSize:14, color:"#9CA3AF" }}>No submissions yet — add the first one</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
            }
          </>
        )}

        {/* ---- BRAND VIEW ---- */}
        {view === "brand" && (
          <>
            {!bNav && searchResults === null && (
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.03em", color:"#0F1117", lineHeight:1.1, marginBottom:5 }}>Material Approvals</div>
                {(() => {
                  const allReal = materials.filter(m => m.materialName !== "__empty__" && m.versions.length > 0);
                  const pending = allReal.filter(m => m.versions[m.versions.length-1].status === "Pending").length;
                  const prods   = products.filter(p => p.materialIds.some(id => materials.find(m => m.id===id && m.materialName!=="__empty__"))).length;
                  return <div style={{ fontSize:13, color:"#8B909A", fontWeight:500 }}>{pending} Pending · {prods} Product{prods!==1?"s":""}</div>;
                })()}
              </div>
            )}

            <SearchBar search={search} setSearch={setSearch} placeholder="Search products, materials, suppliers..." />

            {searchResults !== null
              ? (<div>
                  <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:12 }}>
                    {searchResults.length} result{searchResults.length!==1?"s":""} for <span style={{ fontWeight:600, color:"#374151" }}>"{search}"</span>
                  </div>
                  <MatTable rows={searchResults} showContext />
                 </div>)
              : <>
                  {!bNav && (
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {products.length===0 && (
                        <div style={{ padding:"64px 24px", textAlign:"center", background:"#fff", borderRadius:16, border:"1px solid #E8EAED" }}>
                          <div style={{ fontSize:32, marginBottom:10 }}>🎉</div>
                          <div style={{ fontWeight:700, fontSize:15, color:"#111827" }}>No pending approvals</div>
                          <div style={{ color:"#9CA3AF", fontSize:13, marginTop:4 }}>Factory teams are clear.</div>
                        </div>
                      )}
                      {products.map(p => {
                        const mats    = p.materialIds.map(id => materials.find(m => m.id===id)).filter(Boolean);
                        const real    = mats.filter(m => m.materialName !== "__empty__" && m.versions.length > 0);
                        const pending = real.filter(m => m.versions[m.versions.length-1].status === "Pending").length;
                        const approved= real.filter(m => m.versions[m.versions.length-1].status === "Approved").length;
                        const rejected= real.filter(m => m.versions[m.versions.length-1].status === "Rejected").length;
                        const thumb   = real.find(m => m.versions[m.versions.length-1].image)?.versions.slice(-1)[0].image || null;

                        // Use approvalDate when available, else submissionDate
                        const latestMat = real.length > 0 ? real[real.length-1] : null;
                        const latestVer = latestMat ? latestMat.versions[latestMat.versions.length-1] : null;
                        const displayDate = latestVer ? (latestVer.approvalDate || latestVer.submissionDate) : null;
                        const daysAgo = displayDate ? Math.floor((Date.now()-new Date(displayDate))/(1000*60*60*24)) : null;
                        const timeStr = daysAgo === null ? "" : daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

                        const dominantStatus = pending > 0 ? "Pending" : rejected > 0 ? "Rejected" : approved > 0 ? "Approved" : null;
                        const sc = STATUS_COLORS[dominantStatus] || { bg:"#F3F4F6", text:"#6B7280", dot:"#9CA3AF" };

                        // Brand button: "Review" only when there's something pending to approve/reject
                        const btnLabel = pending > 0 ? "Review" : "Open";
                        const btnStyle = pending > 0
                          ? { background:"#0F1117", color:"#fff" }
                          : { background:"#F3F4F6", color:"#374151" };

                        return (
                          <div key={p.id} className="prow"
                            onClick={() => bGoProd(p.id)}
                            style={{ background:"#fff", border:"1px solid #E8EAED", borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:16, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                            <div style={{ width:56, height:56, borderRadius:10, background:"#F3F4F6", flexShrink:0, overflow:"hidden", border:"1px solid #E8EAED", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              {thumb
                                ? <img src={thumb} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                                : <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                              }
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                                <span style={{ fontSize:15, fontWeight:700, color:"#0F1117", letterSpacing:"-0.02em" }}>{p.name}</span>
                                {dominantStatus && (
                                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, background:sc.bg, color:sc.text, fontSize:11, fontWeight:600 }}>
                                    <span style={{ width:5, height:5, borderRadius:"50%", background:sc.dot }} />{dominantStatus}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize:12.5, color:"#8B909A", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                {real.length > 0 && <span>{real.length} submission{real.length!==1?"s":""}</span>}
                                {pending > 0 && <><span style={{ color:"#E5E7EB" }}>·</span><span style={{ color:"#D97706", fontWeight:600 }}>{pending} to review</span></>}
                                {timeStr && <><span style={{ color:"#E5E7EB" }}>·</span><span>{latestVer?.approvalDate ? "Decided" : "Submitted"} {timeStr}</span></>}
                              </div>
                            </div>
                            <div style={{ flexShrink:0 }}>
                              <button onClick={e => { e.stopPropagation(); bGoProd(p.id); }}
                                style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", border:"none", borderRadius:8, fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit", ...btnStyle }}>
                                {btnLabel}
                                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {curBProduct && (
                    <div>
                      <div style={{ display:"flex", gap:7, marginBottom:14 }}><FilterBar /></div>
                      <MatTable rows={scopedMaterials.filter(m => m.materialName!=="__empty__" && m.versions.length > 0).map(m => ({ ...m, latest:m.versions[m.versions.length-1] }))} />
                    </div>
                  )}
                </>
            }
          </>
        )}
        </>)}{/* end materials section */}

      </div>

      {selectedMaterial && (
        <DetailModal material={selectedMaterial} view={view}
          onClose={() => setSelected(null)}
          onApprove={handleApprove} onReject={handleReject}
          brandComment={brandComment} setBrandComment={setBrandComment}
          setMaterials={setMaterials}
          onSubmitNewVersion={handleNewVersion}
          showNewVersionFor={showNewVersionFor} setShowNewVersionFor={setShowNewVersionFor}
        />
      )}

        {/* ===== GARMENT SAMPLES SECTION ===== */}
        {section === "samples" && (
          <>
            {gLoading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                padding:60, color:"#9CA3AF", gap:10 }}>
                <Spinner /> Loading samples...
              </div>
            ) : gSelectedSample ? (
              <GsDetail
                key={gSelectedSample.id}
                sample={gSelectedSample}
                view={view}
                onBack={() => setGSelected(null)}
                onDecide={handleGsDecide}
                onSubmitVersion={handleGsNewVersion}
              />
            ) : (
              <>
                {/* Dashboard header */}
                <div style={{ display:"flex", alignItems:"flex-start",
                  justifyContent:"space-between", marginBottom:24 }}>
                  <div>
                    <div style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.03em",
                      color:"#0F1117", lineHeight:1.1 }}>Garment Samples</div>
                    <div style={{ fontSize:13, color:"#8B909A", marginTop:5, fontWeight:500 }}>
                      {gSamples.filter(s=>s.status==="Awaiting Review").length} to review
                      {" · "}{gSamples.length} total
                    </div>
                  </div>
                  {view === "factory" && (
                    <button onClick={() => setShowNewGs(true)}
                      style={{ display:"flex", alignItems:"center", gap:6,
                        padding:"8px 15px", background:"#0F1117", color:"#fff",
                        border:"none", borderRadius:7, fontSize:13, fontWeight:600,
                        cursor:"pointer", fontFamily:"inherit" }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.8">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Submit sample
                    </button>
                  )}
                </div>

                {/* Search */}
                <SearchBar search={gSearch} setSearch={setGSearch}
                  placeholder="Search samples, products, factories..." />

                {/* Sample cards */}
                {gSamples.length === 0 ? (
                  <div style={{ padding:"64px 24px", textAlign:"center",
                    background:"#fff", borderRadius:16, border:"1px solid #E8EAED" }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>👕</div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#111827", marginBottom:6 }}>
                      No garment samples yet
                    </div>
                    <div style={{ color:"#9CA3AF", fontSize:13 }}>
                      {view==="factory"
                        ? "Submit your first sample to get started"
                        : "No samples awaiting review"}
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {gSamples
                      .filter(s => {
                        if (!gSearch.trim()) return true;
                        const q = gSearch.toLowerCase();
                        return s.productName.toLowerCase().includes(q)
                          || (s.factory||"").toLowerCase().includes(q)
                          || s.status.toLowerCase().includes(q);
                      })
                      .map(s => {
                        const latest = s.versions[s.versions.length-1];
                        const sc = GS_STATUS_COLORS[s.status] || GS_STATUS_COLORS["Awaiting Review"];
                        const factoryLabel = view==="factory" && s.status==="New Sample Requested"
                          ? "Requires Resubmission" : s.status;
                        const fsc = view==="factory" && s.status==="New Sample Requested"
                          ? { bg:"#FFF3E0", text:"#B45309", dot:"#F97316" } : sc;

                        // Action button logic
                        const btnLabel = view==="brand"
                          ? (s.status==="Awaiting Review" ? "Review sample" : "Open")
                          : (s.status==="New Sample Requested" ? "Resubmit" : "Open");
                        const btnDark = (view==="brand" && s.status==="Awaiting Review")
                          || (view==="factory" && s.status==="New Sample Requested");

                        // Date display
                        const actionDate = latest?.brandDecision?.date || latest?.dateReceived;
                        const dAgo = actionDate ? (() => {
                          const d = Math.floor((Date.now()-new Date(actionDate))/(1000*60*60*24));
                          if (d===0) return "Today"; if (d===1) return "Yesterday"; return `${d}d ago`;
                        })() : "";
                        const dateLabel = latest?.brandDecision
                          ? (latest.brandDecision.type==="Approved" ? "Approved" :
                             latest.brandDecision.type==="New Sample Requested" ? "Requested" : "Reviewed")
                          : "Submitted";

                        // Thumb from first photo of latest version
                        const thumb = latest?.photos?.[0]?.url || latest?.photos?.[0]?.dataUrl || null;

                        return (
                          <div key={s.id} className="scard"
                            onClick={() => setGSelected(s.id)}
                            style={{ background:"#fff", border:"1px solid #E8EAED",
                              borderRadius:14, padding:"14px 18px",
                              display:"flex", alignItems:"center", gap:16,
                              boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>

                            {/* Thumbnail */}
                            <div style={{ width:56, height:56, borderRadius:10,
                              background:"#F3F4F6", flexShrink:0, overflow:"hidden",
                              border:"1px solid #E8EAED", display:"flex",
                              alignItems:"center", justifyContent:"center" }}>
                              {thumb
                                ? <img src={thumb} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                                : <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                                    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
                                  </svg>
                              }
                            </div>

                            {/* Info */}
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", alignItems:"center",
                                gap:8, marginBottom:4, flexWrap:"wrap" }}>
                                <span style={{ fontSize:15, fontWeight:700, color:"#0F1117",
                                  letterSpacing:"-0.02em" }}>{s.productName}</span>
                                <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                                  padding:"2px 8px", borderRadius:20, background:fsc.bg,
                                  color:fsc.text, fontSize:11, fontWeight:600 }}>
                                  <span style={{ width:5, height:5, borderRadius:"50%", background:fsc.dot }} />
                                  {factoryLabel}
                                </span>
                              </div>
                              <div style={{ fontSize:12.5, color:"#8B909A",
                                display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                                <span style={{ fontFamily:"monospace", fontSize:11,
                                  fontWeight:600, color:"#374151" }}>
                                  {s.versions.length} version{s.versions.length!==1?"s":""}
                                </span>
                                {s.factory && <>
                                  <span style={{ color:"#E5E7EB" }}>·</span>
                                  <span>{s.factory}</span>
                                </>}
                                {dAgo && <>
                                  <span style={{ color:"#E5E7EB" }}>·</span>
                                  <span>{dateLabel} {dAgo}</span>
                                </>}
                              </div>
                            </div>

                            {/* Button */}
                            <div onClick={e => e.stopPropagation()} style={{ flexShrink:0 }}>
                              <button onClick={() => setGSelected(s.id)}
                                style={{ display:"flex", alignItems:"center", gap:5,
                                  padding:"7px 14px", border:"none", borderRadius:8,
                                  fontSize:12.5, fontWeight:600, cursor:"pointer",
                                  fontFamily:"inherit",
                                  background: btnDark ? "#0F1117" : "#F3F4F6",
                                  color: btnDark ? "#fff" : "#374151" }}>
                                {btnLabel}
                                <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </>
            )}
          </>
        )}

        </div>{/* end maxWidth */}
        </div>{/* end main content */}

      {showNew && (
        <NewSubmissionModal onClose={() => setShowNew(false)} onSubmit={addMaterial}
          existingStyles={allStyles} existingMaterials={scopedMaterials} />
      )}

      {showNewGs && (
        <GsNewSampleModal
          existingProductNames={products.map(p => p.name)}
          onClose={() => setShowNewGs(false)}
          onSubmit={async data => { await handleGsSubmit(data); setShowNewGs(false); }}
        />
      )}

      {/* ===== BOTTOM VIEW TOGGLE (hidden — toggle moved to navbar) ===== */}
      <div style={{ display:"none" }}>
        <div>
          {[
            { v:"factory", icon:<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="2 20 2 10 8 6 8 10 14 6 14 10 20 6 22 6 22 20"/></svg>, label:"Factory" },
            { v:"brand",   icon:<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8l-2 4h12l-2-4z"/></svg>, label:"Brand" },
          ].map(({ v, icon, label }) => (
            <button key={v}
              onClick={() => { setView(v); setNav(null); setBNav(null); setSearch(""); }}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 18px", borderRadius:36, border:"none", cursor:"pointer",
                fontFamily:"inherit", fontSize:12.5, fontWeight:600,
                background: view===v ? "#fff" : "transparent",
                color: view===v ? "#111827" : "rgba(255,255,255,0.45)",
                transition:"all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom padding so content doesn't hide behind toggle */}
      <div style={{ height:80 }} />
    </div>
  );
}



function SearchResults({ results, search }) {
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

function GsBadge({ status }) {
  const c = GS_STATUS_COLORS[status] || { bg:"#F3F4F6", text:"#374151", dot:"#9CA3AF" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px",
      borderRadius:20, background:c.bg, color:c.text, fontSize:11, fontWeight:600 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot }} />{status}
    </span>
  );
}

function GsSectionCard({ title, icon, children, defaultOpen=true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ background:"#fff", border:"1px solid #EFEFEF", borderRadius:12,
      overflow:"hidden", marginBottom:10 }}>
      <div onClick={() => setOpen(o=>!o)}
        style={{ padding:"12px 16px", display:"flex", alignItems:"center",
          justifyContent:"space-between", cursor:"pointer",
          borderBottom: open?"1px solid #F3F4F6":"none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8,
          fontSize:13, fontWeight:600, color:"#111827" }}>
          {icon}{title}
        </div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"
          style={{ transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.15s" }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
      {open && <div style={{ padding:"12px 16px" }}>{children}</div>}
    </div>
  );
}

function GsCommentList({ comments }) {
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

// ── New Garment Sample Modal (factory) ────────────────────────────────────────
function GsNewSampleModal({ onClose, onSubmit, existingProductNames }) {
  const [step,        setStep]       = React.useState(1);
  const [productName, setProductName]= React.useState("");
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
                letterSpacing:"0.06em", marginBottom:6 }}>Product name</div>
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

// ── Submit New Version Modal (factory resubmission) ───────────────────────────
function GsNewVersionModal({ sample, onClose, onSubmit }) {
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

// ── Brand Review Modal ────────────────────────────────────────────────────────
function GsReviewModal({ sample, versionIdx, onClose, onSubmit }) {
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
      fitComments:  fit.filter(r=>r.text.trim()),
      mfgComments:  mfg.filter(r=>r.text.trim()),
      obsComments:  obs.filter(r=>r.text.trim()),
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

  function CommentSection({ label, rows, setter, sKey }) {
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
          <CommentSection label="Fit & function" rows={fit} setter={setFit} sKey="fit"/>
          <CommentSection label="Manufacturing"  rows={mfg} setter={setMfg} sKey="mfg"/>
          <CommentSection label="Observations"   rows={obs} setter={setObs} sKey="obs"/>
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
function GsDetail({ sample, view, onBack, onDecide, onSubmitVersion }) {
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
    <div style={{background:"#fff",border:"1px solid #E8EAED",borderRadius:16,
      overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      {/* Sticky header */}
      <div style={{padding:"18px 22px 0",borderBottom:"1px solid #F3F4F6",
        position:"sticky",top:0,background:"#fff",zIndex:2}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",
              color:"#9CA3AF",display:"flex",alignItems:"center",gap:3,fontSize:12,
              fontFamily:"inherit",padding:0,marginBottom:6}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>All samples
            </button>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
              <span style={{fontSize:17,fontWeight:700,letterSpacing:"-0.02em",color:"#0F1117"}}>{sample.productName}</span>
              <span style={{padding:"1px 7px",background:isLatest?"#111827":"#F3F4F6",borderRadius:4,
                fontSize:11,fontWeight:700,color:isLatest?"#fff":"#374151",fontFamily:"monospace"}}>
                Proto {ver.versionNum}
              </span>
              <GsBadge status={ver.status}/>
              {!isLatest&&<span style={{fontSize:11,color:"#9CA3AF",fontStyle:"italic"}}>— historical view</span>}
            </div>
            <div style={{fontSize:12,color:"#9CA3AF",display:"flex",gap:4,flexWrap:"wrap"}}>
              <span>{sample.factory||""}</span>
              {sample.factory&&<span style={{color:"#E5E7EB"}}>·</span>}
              <span>Sent {ver.dateReceived}</span>
              {d&&<><span style={{color:"#E5E7EB"}}>·</span><span>Reviewed {d.date}</span></>}
            </div>
          </div>
          {view==="brand"&&isLatest&&!d&&(
            <button onClick={()=>setShowReview(true)}
              style={{padding:"8px 16px",background:"#0F1117",color:"#fff",
                border:"none",borderRadius:8,fontSize:13,fontWeight:600,
                cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
              Review sample
            </button>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{padding:"18px 22px 22px",display:"grid",
        gridTemplateColumns:"1fr 1fr",gap:20}}>
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
          {/* Dates */}
          <div style={card}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><div style={lbl}>Date sent</div><div style={{fontSize:13,fontWeight:500}}>{ver.dateReceived}</div></div>
              <div><div style={lbl}>Date reviewed</div>
                <div style={{fontSize:13,fontWeight:500}}>{d?.date||<span style={{color:"#C4C9D4"}}>Pending</span>}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: notes + decision + actions + version history */}
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

          {/* Version history */}
          {sample.versions.length>1&&(
            <div>
              <div style={lbl}>Version history</div>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {[...sample.versions].reverse().map((v,ri)=>{
                  const idx = sample.versions.length-1-ri;
                  const isAct = idx===activeIdx;
                  return (
                    <div key={v.versionNum} onClick={()=>setActiveIdx(idx)}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                        padding:"8px 10px",borderRadius:7,cursor:"pointer",
                        background:isAct?"#F3F4F6":"transparent",transition:"background 0.08s"}}
                      onMouseEnter={e=>{if(!isAct)e.currentTarget.style.background="#FAFAFA";}}
                      onMouseLeave={e=>{if(!isAct)e.currentTarget.style.background="transparent";}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:12,fontWeight:isAct?700:500,
                          color:isAct?"#111827":"#6B7280",fontFamily:"monospace"}}>
                          Proto {v.versionNum}
                        </span>
                        <span style={{fontSize:12,color:"#9CA3AF"}}>{v.dateReceived}</span>
                      </div>
                      <GsBadge status={v.status}/>
                    </div>
                  );
                })}
              </div>
            </div>
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
