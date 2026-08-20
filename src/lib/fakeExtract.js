// ── MOCK ONLY ──────────────────────────────────────────────────────────────
// This simulates a vision-model extraction so the UI has something to show.
// Swap this out for a real API call when you wire up actual AI extraction —
// nothing else in the app needs to change, it just awaits fakeExtractFromImage().
// ──────────────────────────────────────────────────────────────────────────
export async function fakeExtractFromImage(imageDataUrl, styleName, materialType, existingMaterials) {
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
