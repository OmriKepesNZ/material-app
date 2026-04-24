// src/airtable.js  --  client-side helper that talks to /api/airtable
// =============================================================================

const API = "/api/airtable";

// =============================================================================
// EXISTING FUNCTIONS — COMPLETELY UNCHANGED
// =============================================================================

export async function loadAllData() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`Load failed: ${res.status}`);
  return res.json();
}

export async function createRecord(table, fields) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, fields }),
  });
  if (!res.ok) throw new Error(`Create failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Airtable error (${table}): ${data.error.message || JSON.stringify(data.error)}`);
  if (!data.id)   throw new Error(`Airtable returned no record ID for table "${table}". Response: ${JSON.stringify(data)}`);
  return data;
}

export async function updateRecord(table, recordId, fields) {
  const res = await fetch(API, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, recordId, fields }),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Airtable update error (${table}): ${data.error.message || JSON.stringify(data.error)}`);
  return data;
}

// Upload a base64 image via Cloudinary (proxied through serverless function).
export async function uploadImage(imageBase64, filename = "submission.jpg") {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "uploadImage", imageBase64, filename }),
  });
  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

export async function deleteProduct(productId) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteProduct", productId }),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Delete error: ${data.error}`);
  return data;
}

// =============================================================================
// NEW — GARMENT SAMPLE FUNCTIONS
// Isolated from existing functions above. Safe to add without affecting materials.
// =============================================================================

// Load all garment samples with full version history
export async function loadGarmentSamples() {
  const res = await fetch(`${API}?section=samples`);
  if (!res.ok) throw new Error(`Load garment samples failed: ${res.status}`);
  return res.json();
}

// Upload any file type (PDF, spreadsheet, image) via Cloudinary raw upload.
// Returns a public URL string.
export async function uploadFile(fileBase64, filename) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "uploadFile", fileBase64, filename }),
  });
  if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Upload error: ${data.error}`);
  return data.url;
}

// Create a new garment sample + its first version in one call.
// photoUrls and additionalFileUrls must already be hosted URLs (from uploadImage/uploadFile).
export async function createGarmentSample({
  productName,
  factory,
  airtableProductId = null,
  factoryNotes      = "",
  dateSent,
  photoUrls         = [],
  additionalFileUrls = [],
}) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "createGarmentSample",
      productName,
      factory,
      airtableProductId,
      factoryNotes,
      dateSent,
      photoUrls,
      additionalFileUrls,
    }),
  });
  if (!res.ok) throw new Error(`Create garment sample failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Garment sample error: ${data.error}`);
  return data; // { sampleId, versionId, sampleData, versionData }
}

// Submit a new version of an existing garment sample (factory resubmission).
export async function createSampleVersion({
  garmentSampleId,
  versionNum,
  factoryNotes      = "",
  dateSent,
  photoUrls         = [],
  additionalFileUrls = [],
}) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "createSampleVersion",
      garmentSampleId,
      versionNum,
      factoryNotes,
      dateSent,
      photoUrls,
      additionalFileUrls,
    }),
  });
  if (!res.ok) throw new Error(`Create sample version failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Sample version error: ${data.error}`);
  return data; // { versionId, versionData }
}

// Submit a brand review on a specific version.
export async function reviewSampleVersion({
  versionId,
  garmentSampleId,
  status,
  reviewedBy        = "",
  reviewDate,
  summary           = "",
  nextSteps         = "",
  fitComments       = [],
  mfgComments       = [],
  obsComments       = [],
  measurementFileUrl = null,
}) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "reviewSampleVersion",
      versionId,
      garmentSampleId,
      status,
      reviewedBy,
      reviewDate,
      summary,
      nextSteps,
      fitComments,
      mfgComments,
      obsComments,
      measurementFileUrl,
    }),
  });
  if (!res.ok) throw new Error(`Review submission failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Review error: ${data.error}`);
  return data; // { versionId, status, versionData }
}
