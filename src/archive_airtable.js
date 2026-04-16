// src/airtable.js  --  client-side helper that talks to /api/airtable
// =============================================================================

const API = "/api/airtable";

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
  return res.json();
}

export async function updateRecord(table, recordId, fields) {
  const res = await fetch(API, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, recordId, fields }),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
}

// Upload a base64 image via the serverless function (which proxies to Imgur)
// and return a public URL suitable for Airtable attachment fields.
export async function uploadImage(imageBase64, filename = "submission.jpg") {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "uploadImage", imageBase64, filename }),
  });
  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);
  const data = await res.json();
  return data.url; // public https URL
}
