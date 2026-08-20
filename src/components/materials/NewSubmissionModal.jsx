import React, { useState, useRef, useEffect } from "react";
import { MATERIAL_TYPES, COURIER_OPTIONS } from "../../lib/constants";
import { fakeExtractFromImage } from "../../lib/fakeExtract";
import Spinner from "../shared/Spinner";

export default function NewSubmissionModal({ onClose, onSubmit, existingStyles, existingMaterials }) {
  const [step, setStep] = useState("form"); // form | uploading | review
  const [styleName, setStyleName] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [image, setImage] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null); // { materialName, version, submissionDate }
  const [showMore, setShowMore] = useState(false);
  const [courier, setCourier] = useState("DHL");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [visible, setVisible] = useState(false);
  const dropRef = useRef();
  const fileRef = useRef();

  const resolvedStyle = ""; // style is derived from nav context, not modal

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  async function handleImageSelected(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      setImage(e.target.result);
      setExtracting(true);
      setStep("review");
      const result = await fakeExtractFromImage(e.target.result, resolvedStyle, materialType, existingMaterials);
      setExtracted(result);
      if (result.extractedSpecs) setNotes(result.extractedSpecs);
      setExtracting(false);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleImageSelected(file);
  }

  function handleSubmit() {
    onSubmit({
      styleName:       resolvedStyle,
      materialType,
      materialName:    extracted?.materialName || "Unnamed",
      factoryNotes:    notes,
      image,
      courier,
      trackingNumber,
      shipmentStatus:  trackingNumber ? "In Transit" : "At Factory",
      season:          "",
      factoryName:     "",
      detectedVersion: extracted?.version || 1,
      extractedSpecs:  extracted?.extractedSpecs || "",
    });
    handleClose();
  }

  const canProceedToUpload = !!materialType;

  const inp = { width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        background: visible ? "rgba(10,10,15,0.55)" : "rgba(10,10,15,0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",
        transition: "background 0.22s, backdrop-filter 0.22s" }}>

      {/* Single shared hidden file input for all steps */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageSelected(e.target.files[0])} />

      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, overflow: "hidden",
        boxShadow: visible ? "0 0 0 1px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.18), 0 64px 120px rgba(0,0,0,0.1)" : "none",
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.24s cubic-bezier(0.22,1,0.36,1), opacity 0.18s ease, box-shadow 0.24s",
      }}>

        {/* -- STEP 1: Pick material type ------------------------- */}
        {step === "form" && (
          <div>
            <div style={{ padding: "24px 24px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.02em" }}>New Submission</div>
                <button onClick={handleClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E7EB", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Type selector only - style/product is already known from nav context */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>Material Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {MATERIAL_TYPES.map(t => (
                    <button key={t} onClick={() => setMaterialType(t)} style={{
                      flex: 1, padding: "10px 4px", borderRadius: 8, border: "1.5px solid", cursor: "pointer",
                      fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, transition: "all 0.12s", lineHeight: 1.3,
                      borderColor: materialType === t ? "#111827" : "#E5E7EB",
                      background: materialType === t ? "#111827" : "#fff",
                      color: materialType === t ? "#fff" : "#374151",
                    }}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: "0 24px 24px" }}>
              <button
                onClick={() => setStep("uploading")}
                disabled={!materialType}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, border: "none", cursor: materialType ? "pointer" : "not-allowed",
                  fontFamily: "inherit", fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
                  background: materialType ? "#111827" : "#F3F4F6",
                  color: materialType ? "#fff" : "#9CA3AF",
                  transition: "all 0.15s",
                }}>
                Continue {'->'}
              </button>
            </div>
          </div>
        )}

        {/* -- STEP 2: Photo upload ------------------------------- */}
        {step === "uploading" && (
          <div>
            <div style={{ padding: "24px 24px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <button onClick={() => setStep("form")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#9CA3AF", fontSize: 13, padding: 0, fontFamily: "inherit" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <button onClick={handleClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E7EB", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.02em", marginBottom: 4 }}>Upload Photo</div>
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>
                  <span style={{ fontWeight: 500, color: "#374151" }}>{resolvedStyle}</span>
                  {" . "}
                  <span style={{ color: "#6B7280" }}>{materialType}</span>
                </div>
              </div>
            </div>

            {/* Drop zone */}
            <div style={{ padding: "0 24px 24px" }}>
              <div
                ref={dropRef}
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); dropRef.current.style.borderColor = "#6366F1"; dropRef.current.style.background = "#F5F3FF"; }}
                onDragLeave={() => { dropRef.current.style.borderColor = "#E5E7EB"; dropRef.current.style.background = "#FAFAFA"; }}
                onDrop={handleDrop}
                style={{
                  border: "2px dashed #E5E7EB", borderRadius: 14, background: "#FAFAFA",
                  padding: "48px 24px", textAlign: "center", cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Drop photo here</div>
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>or click to browse</div>
              </div>

              {/* Camera shortcut note */}
              <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#C4C9D4" }}>
                Works with camera, gallery, or files
              </div>
            </div>
          </div>
        )}

        {/* -- STEP 3: Review extracted info ---------------------- */}
        {step === "review" && (
          <div>
            {/* Image header */}
            <div style={{ position: "relative" }}>
              {image && (
                <img src={image} alt="Upload" style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }} />
              )}
              {/* Loading shimmer overlay while extracting */}
              {extracting && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,15,0.45)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <Spinner style={{ color: "#fff" }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Reading photo...</span>
                </div>
              )}
              {/* Top bar overlays */}
              <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ background: "rgba(0,0,0,0.48)", backdropFilter: "blur(6px)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#fff", fontWeight: 500 }}>
                  {resolvedStyle}{" . "}{materialType}
                </div>
                <button onClick={handleClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(0,0,0,0.48)", backdropFilter: "blur(6px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {/* Replace photo button */}
              {!extracting && (
                <button onClick={() => fileRef.current.click()} style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.48)", backdropFilter: "blur(6px)", border: "none", borderRadius: 7, padding: "5px 10px", color: "#fff", fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  Replace
                </button>
              )}
            </div>

            <div style={{ padding: "20px 22px 22px" }}>

              {/* -- Extracted fields (read-only display) -- */}
              <div style={{ marginBottom: 18 }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: extracting ? "#C4C9D4" : "#10B981", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {extracting ? (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E5E7EB", display: "inline-block" }} />
                    ) : (
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    {extracting ? "Extracting..." : "Auto-filled"}
                  </div>
                </div>

                {/* Three extracted read-only chips */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 14 }}>
                  {/* Material Name - editable */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#C4C9D4", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Name</div>
                    {extracting ? (
                      <div style={{ height: 36, background: "#F3F4F6", borderRadius: 8, animation: "pulse 1.2s ease-in-out infinite" }} />
                    ) : (
                      <input
                        value={extracted?.materialName || ""}
                        onChange={e => setExtracted(x => ({ ...x, materialName: e.target.value }))}
                        style={{ ...inp, fontSize: 13, fontWeight: 600, padding: "8px 10px" }}
                      />
                    )}
                  </div>

                  {/* Version - read only */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#C4C9D4", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Version</div>
                    {extracting ? (
                      <div style={{ width: 52, height: 36, background: "#F3F4F6", borderRadius: 8, animation: "pulse 1.2s ease-in-out infinite" }} />
                    ) : (
                      <div style={{ height: 36, minWidth: 48, padding: "0 12px", background: "#F3F4F6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#374151", fontFamily: "monospace", border: "1.5px solid #EBEBEB" }}>
                        V{extracted?.version || 1}
                      </div>
                    )}
                  </div>

                  {/* Date - read only */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#C4C9D4", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Date</div>
                    {extracting ? (
                      <div style={{ width: 84, height: 36, background: "#F3F4F6", borderRadius: 8, animation: "pulse 1.2s ease-in-out infinite" }} />
                    ) : (
                      <div style={{ height: 36, padding: "0 10px", background: "#F3F4F6", borderRadius: 8, display: "flex", alignItems: "center", fontSize: 12, fontWeight: 500, color: "#6B7280", whiteSpace: "nowrap", border: "1.5px solid #EBEBEB" }}>
                        {extracted?.submissionDate || new Date().toISOString().slice(0,10)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Version context note - only if V2+ */}
                {!extracting && extracted?.version > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: "#FFF8E6", borderRadius: 8, border: "1px solid #FDE68A", marginBottom: 14 }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ fontSize: 12, color: "#92400E", fontWeight: 500 }}>
                      Resubmission - previous version was rejected
                    </span>
                  </div>
                )}

                {/* Notes - pre-filled with extracted specs, editable */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#C4C9D4", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                    Notes
                    {!extracting && notes && (
                      <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, color: "#10B981", fontSize: 10 }}>extracted from photo</span>
                    )}
                    {!extracting && !notes && (
                      <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#D1D5DB" }}>- optional</span>
                    )}
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={notes ? 6 : 2}
                    placeholder="Anything the brand should know..."
                    disabled={extracting}
                    style={{ ...inp, resize: "vertical", fontSize: 13, lineHeight: 1.6, color: extracting ? "#C4C9D4" : "#111827", fontFamily: notes ? "monospace" : "inherit" }}
                  />
                </div>
              </div>

              {/* More info accordion */}
              {!extracting && (
                <div style={{ marginBottom: 16 }}>
                  <button
                    onClick={() => setShowMore(v => !v)}
                    style={{ background: "none", border: "none", padding: "6px 0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ transform: showMore ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    {showMore ? "Hide courier info" : "Add courier / tracking"}
                  </button>

                  {showMore && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8, padding: "12px 14px", background: "#FAFAFA", borderRadius: 10, border: "1px solid #F3F4F6" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#C4C9D4", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Courier</div>
                        <select value={courier} onChange={e => setCourier(e.target.value)}
                          style={{ ...inp, fontSize: 13, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 26 }}>
                          {COURIER_OPTIONS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#C4C9D4", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Tracking No.</div>
                        <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Optional" style={{ ...inp, fontSize: 13 }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={extracting}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, border: "none",
                  cursor: extracting ? "not-allowed" : "pointer",
                  fontFamily: "inherit", fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
                  background: extracting ? "#F3F4F6" : "#111827",
                  color: extracting ? "#C4C9D4" : "#fff",
                  transition: "all 0.15s",
                }}>
                {extracting ? "Reading photo..." : "Submit for Approval"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
