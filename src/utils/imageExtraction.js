// src/utils/imageExtraction.js
export async function fakeExtractFromImage(imageDataUrl, styleName, materialType, existingMaterials) {
  await new Promise(r => setTimeout(r, 1900));

  const nameMap = {
    "Lab Dip": ["Olive #3", "Slate Blue", "Warm Terracotta", "Charcoal Grey", "Dusty Sage"],
    "Trim": ["YKK Zipper Pull", "Main Woven Label", "Care Label", "Size Tab", "Metal Button"],
    "Fabric Swatch": ["3L Shell Fabric", "Lining Fleece", "Rib Knit Cuff", "Woven Twill", "Mesh Backer"],
  };
  const names = nameMap[materialType] || ["Sample"];
  const detectedName = names[Math.floor(Math.random() * names.length)];

  const specMap = {
    "Lab Dip": [
      "Colorway: Olive Drab\nDye method: Reactive\nDelta E: 1.2 vs. target\nSubstrate: 100% Cotton poplin",
      "Colorway: Slate Blue\nDye method: Vat\nDelta E: 0.8 vs. target\nSubstrate: 80% Nylon / 20% Elastane",
    ],
    "Trim": [
      "Material: Zinc alloy, nickel-free\nFinish: Matte black PVD\nSize: #5 (5mm tape width)",
    ],
    "Fabric Swatch": [
      "Weight: 128 g/m2\nComposition: 75D 100% Nylon ripstop\nFinish: DWR (C0)",
    ],
  };

  const specOptions = specMap[materialType] || [];
  const extractedSpecs = specOptions.length ? specOptions[Math.floor(Math.random() * specOptions.length)] : "";

  const match = existingMaterials.find(
    m => m.styleName === styleName && m.materialType === materialType &&
    m.materialName.toLowerCase() === detectedName.toLowerCase()
  );
  const version = match ? match.versions.length + 1 : 1;
  const submissionDate = new Date().toISOString().slice(0, 10);

  return { materialName: detectedName, version, submissionDate, extractedSpecs };
}