import { useState, useRef, useEffect, useMemo } from "react";
import { loadAllData, createRecord, updateRecord, uploadImage, deleteProduct } from "./airtable";

// --- Constants ----------------------------------------------------------------
const MATERIAL_TYPES = ["Lab Dip", "Trim", "Fabric Swatch"];
const COURIER_OPTIONS = ["DHL", "FedEx", "UPS", "Other"];
const SEASONS = ["SS25", "FW25", "SS26", "FW26"];

const STATUS_COLORS = {
  Pending:  { bg: "#FFF8E6", text: "#92400E", dot: "#F59E0B" },
  Approved: { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  Rejected: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
};
const SHIP_COLORS = {
  "At Factory": { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  "In Transit":  { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  Delivered:     { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
};

// --- SVG sketch image generators (inline data URIs) ---------------------------
function makeSVG(content) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(content);
}

// Lab dip colour swatches
const labDip1 = makeSVG(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f5f0e8"/>
  <rect x="40" y="40" width="140" height="140" rx="4" fill="#c8b84a" stroke="#a89830" stroke-width="1.5"/>
  <rect x="220" y="40" width="140" height="140" rx="4" fill="#d4c455" stroke="#b4a435" stroke-width="1.5"/>
  <text x="110" y="210" font-family="monospace" font-size="11" fill="#888" text-anchor="middle">LAB DIP V1</text>
  <text x="290" y="210" font-family="monospace" font-size="11" fill="#888" text-anchor="middle">TARGET REF</text>
  <text x="110" y="226" font-family="monospace" font-size="10" fill="#aaa" text-anchor="middle">#C8B84A - OLIVE</text>
  <text x="290" y="226" font-family="monospace" font-size="10" fill="#aaa" text-anchor="middle">#8B9B3A - SPEC</text>
  <line x1="40" y1="260" x2="360" y2="260" stroke="#ddd" stroke-width="1"/>
  <text x="200" y="280" font-family="monospace" font-size="10" fill="#bbb" text-anchor="middle">APEX TEXTILES . FW25 . 2025-01-10</text>
</svg>`);

const labDip2 = makeSVG(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f5f0e8"/>
  <rect x="40" y="40" width="140" height="140" rx="4" fill="#8b9b3a" stroke="#6b7b2a" stroke-width="1.5"/>
  <rect x="220" y="40" width="140" height="140" rx="4" fill="#8B9B3A" stroke="#6b7b2a" stroke-width="1.5" stroke-dasharray="4 2"/>
  <text x="110" y="210" font-family="monospace" font-size="11" fill="#888" text-anchor="middle">LAB DIP V2</text>
  <text x="290" y="210" font-family="monospace" font-size="11" fill="#888" text-anchor="middle">TARGET REF</text>
  <text x="110" y="226" font-family="monospace" font-size="10" fill="#aaa" text-anchor="middle">#8B9B3A - OLIVE V2</text>
  <text x="200" y="280" font-family="monospace" font-size="10" fill="#bbb" text-anchor="middle">APEX TEXTILES . FW25 . 2025-01-22</text>
</svg>`);

// Woven label sketches
const label1 = makeSVG(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f8f6f2"/>
  <rect x="100" y="60" width="200" height="120" rx="3" fill="#fff" stroke="#ccc" stroke-width="1.5"/>
  <rect x="100" y="60" width="200" height="28" rx="3" fill="#222"/>
  <text x="200" y="79" font-family="serif" font-size="13" fill="#fff" text-anchor="middle" letter-spacing="3">TRAIL PANT</text>
  <text x="200" y="115" font-family="serif" font-size="9" fill="#999" text-anchor="middle" font-weight="300" letter-spacing="1">APEX TEXTILES CO.</text>
  <text x="200" y="133" font-family="monospace" font-size="8" fill="#bbb" text-anchor="middle">100% NYLON . MADE IN VIETNAM</text>
  <text x="200" y="151" font-family="monospace" font-size="8" fill="#bbb" text-anchor="middle">WASH COLD . DO NOT BLEACH</text>
  <text x="200" y="220" font-family="monospace" font-size="10" fill="#aaa" text-anchor="middle">MAIN LABEL V1 - FONT WT LIGHT</text>
  <text x="200" y="280" font-family="monospace" font-size="10" fill="#bbb" text-anchor="middle">APEX TEXTILES . FW25 . 2025-01-08</text>
</svg>`);

const label2 = makeSVG(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f8f6f2"/>
  <rect x="100" y="60" width="200" height="120" rx="3" fill="#fff" stroke="#ccc" stroke-width="1.5"/>
  <rect x="100" y="60" width="200" height="28" rx="3" fill="#222"/>
  <text x="200" y="79" font-family="serif" font-size="14" fill="#fff" text-anchor="middle" font-weight="bold" letter-spacing="3">TRAIL PANT</text>
  <text x="200" y="112" font-family="serif" font-size="10" fill="#666" text-anchor="middle" font-weight="bold" letter-spacing="2">APEX TEXTILES CO.</text>
  <text x="200" y="132" font-family="monospace" font-size="8" fill="#bbb" text-anchor="middle">100% NYLON . MADE IN VIETNAM</text>
  <text x="200" y="150" font-family="monospace" font-size="8" fill="#bbb" text-anchor="middle">WASH COLD . DO NOT BLEACH</text>
  <text x="200" y="220" font-family="monospace" font-size="10" fill="#aaa" text-anchor="middle">MAIN LABEL V2 - BOLD, LOGO OFF-CENTER</text>
  <text x="200" y="280" font-family="monospace" font-size="10" fill="#bbb" text-anchor="middle">APEX TEXTILES . FW25 . 2025-01-19</text>
</svg>`);

const label3 = makeSVG(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f8f6f2"/>
  <rect x="100" y="60" width="200" height="120" rx="3" fill="#fff" stroke="#ccc" stroke-width="1.5"/>
  <rect x="100" y="60" width="200" height="28" rx="3" fill="#222"/>
  <text x="200" y="79" font-family="serif" font-size="14" fill="#fff" text-anchor="middle" font-weight="bold" letter-spacing="3">TRAIL PANT</text>
  <circle cx="200" cy="118" r="14" fill="none" stroke="#222" stroke-width="1.5"/>
  <text x="200" y="122" font-family="serif" font-size="9" fill="#222" text-anchor="middle" font-weight="bold">AP</text>
  <text x="200" y="148" font-family="monospace" font-size="8" fill="#bbb" text-anchor="middle">100% NYLON . MADE IN VIETNAM</text>
  <text x="200" y="162" font-family="monospace" font-size="8" fill="#bbb" text-anchor="middle">WASH COLD . DO NOT BLEACH</text>
  <text x="200" y="220" font-family="monospace" font-size="10" fill="#4a9" text-anchor="middle">MAIN LABEL V3 - v APPROVED</text>
  <text x="200" y="280" font-family="monospace" font-size="10" fill="#bbb" text-anchor="middle">APEX TEXTILES . FW25 . 2025-02-01</text>
</svg>`);

// Zipper pull sketch
const zipper1 = makeSVG(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f2f2f2"/>
  <rect x="160" y="50" width="80" height="14" rx="3" fill="#1a1a1a"/>
  <rect x="170" y="64" width="60" height="110" rx="6" fill="#2a2a2a" stroke="#111" stroke-width="1.5"/>
  <rect x="178" y="72" width="44" height="94" rx="4" fill="#1a1a1a"/>
  <ellipse cx="200" cy="185" rx="18" ry="6" fill="#333"/>
  <circle cx="200" cy="191" r="8" fill="#2a2a2a" stroke="#111" stroke-width="1"/>
  <circle cx="200" cy="191" r="3" fill="#111"/>
  <line x1="200" y1="199" x2="200" y2="220" stroke="#222" stroke-width="2.5"/>
  <text x="200" y="248" font-family="monospace" font-size="10" fill="#888" text-anchor="middle">YKK #5 ZIPPER PULL V1</text>
  <text x="200" y="264" font-family="monospace" font-size="10" fill="#aaa" text-anchor="middle">MATTE BLACK FINISH</text>
  <text x="200" y="285" font-family="monospace" font-size="10" fill="#bbb" text-anchor="middle">SUMMIT FABRICS . FW25 . 2025-02-10</text>
</svg>`);

// Fabric swatch sketch
const swatch1 = makeSVG(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#eef0f2"/>
  <rect x="60" y="40" width="280" height="180" rx="4" fill="#d0d8e0" stroke="#b8c0ca" stroke-width="1.5"/>
  <line x1="60" y1="60" x2="340" y2="60" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="60" y1="80" x2="340" y2="80" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="60" y1="100" x2="340" y2="100" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="60" y1="120" x2="340" y2="120" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="60" y1="140" x2="340" y2="140" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="60" y1="160" x2="340" y2="160" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="60" y1="180" x2="340" y2="180" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="80" y1="40" x2="80" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="100" y1="40" x2="100" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="120" y1="40" x2="120" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="140" y1="40" x2="140" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="160" y1="40" x2="160" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="180" y1="40" x2="180" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="200" y1="40" x2="200" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="220" y1="40" x2="220" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="240" y1="40" x2="240" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="260" y1="40" x2="260" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="280" y1="40" x2="280" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="300" y1="40" x2="300" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <line x1="320" y1="40" x2="320" y2="220" stroke="#c0c8d2" stroke-width="0.5"/>
  <text x="200" y="252" font-family="monospace" font-size="10" fill="#888" text-anchor="middle">3L SHELL FABRIC V1 . 75D RIPSTOP</text>
  <text x="200" y="268" font-family="monospace" font-size="10" fill="#aaa" text-anchor="middle">DWR TREATED . 10K/10K</text>
  <text x="200" y="285" font-family="monospace" font-size="10" fill="#bbb" text-anchor="middle">SUMMIT FABRICS . FW25 . 2025-02-12</text>
</svg>`);

// --- Seed Data ---------------------------------------------------------------
const seedMaterials = [
  {
    id: 1, styleName: "Trail Pant", season: "FW25", factoryName: "Apex Textiles",
    materialType: "Lab Dip", materialName: "Olive",
    versions: [
      { version: 1, submissionDate: "2025-01-10", image: labDip1, factoryNotes: "First attempt at olive colorway.", status: "Rejected", brandComment: "Too yellow-green - need more grey undertone.", approvalDate: "2025-01-15", courier: "DHL", trackingNumber: "1234567890", shipmentStatus: "Delivered" },
      { version: 2, submissionDate: "2025-01-22", image: labDip2, factoryNotes: "Reduced yellow, added grey pigment.", status: "Pending", brandComment: "", approvalDate: null, courier: "DHL", trackingNumber: "9876543210", shipmentStatus: "Delivered" },
    ],
  },
  {
    id: 2, styleName: "Trail Pant", season: "FW25", factoryName: "Apex Textiles",
    materialType: "Trim", materialName: "Main Woven Label",
    versions: [
      { version: 1, submissionDate: "2025-01-08", image: label1, factoryNotes: "Standard woven label per spec.", status: "Rejected", brandComment: "Font weight too light. Needs bolder.", approvalDate: "2025-01-12", courier: "FedEx", trackingNumber: "FX112233", shipmentStatus: "Delivered" },
      { version: 2, submissionDate: "2025-01-19", image: label2, factoryNotes: "Updated font weight to bold.", status: "Rejected", brandComment: "Better - but logo placement is off-center.", approvalDate: "2025-01-24", courier: "FedEx", trackingNumber: "FX445566", shipmentStatus: "Delivered" },
      { version: 3, submissionDate: "2025-02-01", image: label3, factoryNotes: "Logo recentered, font bold.", status: "Approved", brandComment: "Perfect. Approved for production.", approvalDate: "2025-02-05", courier: "UPS", trackingNumber: "UPS778899", shipmentStatus: "Delivered" },
    ],
  },
  {
    id: 3, styleName: "Rain Jacket", season: "FW25", factoryName: "Summit Fabrics",
    materialType: "Trim", materialName: "YKK Zipper Pull",
    versions: [
      { version: 1, submissionDate: "2025-02-10", image: zipper1, factoryNotes: "YKK #5, matte black finish.", status: "Rejected", brandComment: "Need gunmetal, not matte black.", approvalDate: "2025-02-14", courier: "DHL", trackingNumber: "", shipmentStatus: "At Factory" },
    ],
  },
  {
    id: 4, styleName: "Rain Jacket", season: "FW25", factoryName: "Summit Fabrics",
    materialType: "Fabric Swatch", materialName: "3L Shell Fabric",
    versions: [
      { version: 1, submissionDate: "2025-02-12", image: swatch1, factoryNotes: "3-layer shell, 75D ripstop, DWR treated.", status: "Pending", brandComment: "", approvalDate: null, courier: "DHL", trackingNumber: "DHL334455", shipmentStatus: "In Transit" },
    ],
  },
];


// --- Tiny helpers -------------------------------------------------------------
function Badge({ status, type = "approval" }) {
  const c = (type === "approval" ? STATUS_COLORS : SHIP_COLORS)[status] || { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: c.bg, color: c.text, fontSize: 11.5, fontWeight: 500 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot }} />{status}
    </span>
  );
}

function Divider() { return <div style={{ height: 1, background: "#F3F4F6", margin: "2px 0" }} />; }

// --- Spinner ------------------------------------------------------------------
function Spinner() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// --- Fake AI extraction -------------------------------------------------------
// In production this calls a vision API. Here we simulate plausible results
// and use existing materials context to infer version number.
async function fakeExtractFromImage(imageDataUrl, styleName, materialType, existingMaterials) {
  await new Promise(r => setTimeout(r, 1900));

  const nameMap = {
    "Lab Dip":       ["Olive #3", "Slate Blue", "Warm Terracotta", "Charcoal Grey", "Dusty Sage"],
    "Trim":          ["YKK Zipper Pull", "Main Woven Label", "Care Label", "Size Tab", "Metal Button"],
    "Fabric Swatch": ["3L Shell Fabric", "Lining Fleece", "Rib Knit Cuff", "Woven Twill", "Mesh Backer"],
  };
  const names = nameMap[materialType] || ["Sample"];
  const detectedName = names[Math.floor(Math.random() * names.length)];

  // Per-type spec extraction simulation
  const specMap = {
    "Lab Dip": [
      "Colorway: Olive Drab\nDye method: Reactive\nDelta E: 1.2 vs. target\nSubstrate: 100% Cotton poplin",
      "Colorway: Slate Blue\nDye method: Vat\nDelta E: 0.8 vs. target\nSubstrate: 80% Nylon / 20% Elastane",
      "Colorway: Warm Terracotta\nDye method: Pigment\nDelta E: 2.1 vs. target\nSubstrate: 100% Linen",
    ],
    "Trim": [
      "Material: Zinc alloy, nickel-free\nFinish: Matte black PVD\nSize: #5 (5mm tape width)\nPuller length: 38mm",
      "Weave: Damask\nThread count: 72 EPI\nSize: 55mm x 30mm\nContent: 100% Polyester",
      "Print method: Heat transfer\nSize: 40mm x 18mm\nContent: 100% Satin polyester\nCompliance: REACH, OEKO-TEX",
    ],
    "Fabric Swatch": [
      "Weight: 128 g/m2\nComposition: 75D 100% Nylon ripstop\nFinish: DWR (C0)\nRating: 10K/10K waterproof / breathable\nWidth: 150cm",
      "Weight: 320 g/m2\nComposition: 94% Polyester / 6% Elastane\nConstruction: Double-faced fleece\nPilling resistance: 4.5 (Martindale)\nWidth: 160cm",
      "Weight: 185 g/m2\nComposition: 87% Recycled Nylon / 13% Elastane\nConstruction: 4-way stretch woven\nColorfastness: 4-5 (ISO 105-C06)\nWidth: 148cm",
    ],
  };

  const specOptions = specMap[materialType] || [];
  const extractedSpecs = specOptions.length ? specOptions[Math.floor(Math.random() * specOptions.length)] : "";

  // Check if this material already exists for this style -> infer version
  const match = existingMaterials.find(
    m => m.styleName === styleName && m.materialType === materialType &&
         m.materialName.toLowerCase() === detectedName.toLowerCase()
  );
  const version = match ? match.versions.length + 1 : 1;
  const submissionDate = new Date().toISOString().slice(0, 10);

  return { materialName: detectedName, version, submissionDate, extractedSpecs };
}

// --- New Submission Modal -----------------------------------------------------
function NewSubmissionModal({ onClose, onSubmit, existingStyles, existingMaterials }) {
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

// --- Inline add row -----------------------------------------------------------
function AddRow({ placeholder, onAdd, onCancel }) {
  const [val, setVal] = useState("");
  const ref = useRef();
  useEffect(() => { ref.current && ref.current.focus(); }, []);
  function submit() { if (val.trim()) onAdd(val.trim()); else onCancel(); }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderTop: "1px solid #F3F4F6" }}>
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        placeholder={placeholder}
        style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #111827", borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#111827" }} />
      <button onClick={submit} style={{ padding: "7px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
      <button onClick={onCancel} style={{ padding: "7px 10px", background: "transparent", color: "#9CA3AF", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
    </div>
  );
}

// --- Main App -----------------------------------------------------------------
export default function App() {

  const [view, setView]       = useState("factory"); // "factory" | "brand"
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // ---- shared flat materials (populated from Airtable on mount) ----
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    loadAllData()
      .then(data => { setMaterials(data); setLoading(false); })
      .catch(err  => { console.error("Airtable load error:", err); setLoadError(err.message); setLoading(false); });
  }, []);

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
  const inp = { padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:6, fontSize:12, fontFamily:"inherit", color:"#111827", background:"#fff", outline:"none" };
  const addBtn = { display:"flex", alignItems:"center", gap:6, padding:"8px 15px", background:"#111827", color:"#fff", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" };
  const ddArrow = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")";
  const chevron = <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;

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
            style={{ ...inp, minWidth:100, color:filters[key]?"#111827":"#9CA3AF", backgroundImage:ddArrow, backgroundRepeat:"no-repeat", backgroundPosition:"right 7px center", paddingRight:24 }}>
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
              {showContext && <th style={thStyle}>Product / Factory</th>}
              {["Type","Material","Version","Shipment","Status"].map(h => <th key={h} style={thStyle}>{h}</th>)}
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
          {chevron}
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

  const icoCheck = <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;

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
    <div style={{ fontFamily:"DM Sans, Helvetica Neue, sans-serif", background:"#F4F5F7", minHeight:"100vh", color:"#111827" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#E2E5EA; border-radius:4px; }
        input:focus, select:focus, textarea:focus { outline:none; border-color:#111827 !important; }
        .prow { transition: box-shadow 0.15s, transform 0.15s, background 0.1s; cursor:pointer; }
        .prow:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; transform: translateY(-1px); background:#fff !important; }
        .mrow:hover { background:#F8F8FA !important; cursor:pointer; }
        select { appearance:none; }
      `}</style>

      {/* ===== NAV BAR ===== */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E8EAED" }}>
        <div style={{ maxWidth:960, height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px" }}>

          {/* Logo + breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:6, overflow:"hidden", minWidth:0 }}>
            <div style={{ width:24, height:24, background:"#111827", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {icoCheck}
            </div>

            {view === "factory" && (
              <>
                <BCBtn label="Approvals" dim={!!nav} onClick={goHome} />
                {curProduct && <><BCSep/><BCBtn label={curProduct.name} dim={false} onClick={null} /></>}
              </>
            )}

            {view === "brand" && (
              <>
                <BCBtn label="Approvals" dim={!!bNav} onClick={bGoHome} />
                {curBProduct && <><BCSep/><BCBtn label={curBProduct.name} dim={false} onClick={null} /></>}
              </>
            )}
          </div>

        </div>
      </div>

      {/* ===== PAGE CONTENT ===== */}
      <div style={{ maxWidth:960, padding:"28px 28px 100px" }}>

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
      {showNew && (
        <NewSubmissionModal onClose={() => setShowNew(false)} onSubmit={addMaterial}
          existingStyles={allStyles} existingMaterials={scopedMaterials} />
      )}

      {/* ===== BOTTOM VIEW TOGGLE ===== */}
      <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:100 }}>
        <div style={{ display:"flex", background:"#0F1117", borderRadius:40, padding:5, gap:2, boxShadow:"0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)" }}>
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

function SearchBar({ search, setSearch, placeholder }) {
  return (
    <div style={{ position:"relative", marginBottom:20 }}>
      <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"11px 14px 11px 38px", border:"1.5px solid #E8EAED", borderRadius:11, fontSize:13.5, fontFamily:"inherit", color:"#111827", background:"#fff", outline:"none", boxShadow:"0 1px 3px rgba(0,0,0,0.04)", transition:"border-color 0.15s" }}
        onFocus={e => e.target.style.borderColor="#0F1117"}
        onBlur={e => e.target.style.borderColor="#E8EAED"}
      />
      {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:2 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
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

const thStyle = { padding:"9px 14px", textAlign:"left", fontSize:10.5, fontWeight:700, color:"#C4C9D4", textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" };
