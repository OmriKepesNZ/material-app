// =============================================================================
// src/airtable.js  --  frontend client
// =============================================================================
// This file lives in src/ and is imported by App.jsx.
// It talks to /api/airtable.js (your Vercel function) -- NOT directly to Airtable.
// Your secret token never touches the browser.
//
// YOU DO NOT NEED TO CHANGE ANYTHING IN THIS FILE.
// All the table/field names live in /api/airtable.js instead.
// =============================================================================

const API = "/api/airtable";

// Load all materials (with nested versions) from Airtable via the API route
export async function loadAllData() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
  return res.json();
}

// Update an existing Airtable record
export async function updateRecord(table, recordId, fields) {
  const res = await fetch(API, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ table, recordId, fields }),
  });
  if (!res.ok) throw new Error(`Failed to update record: ${res.status}`);
  return res.json();
}

// Create a new Airtable record, returns the new record including its Airtable ID
export async function createRecord(table, fields) {
  const res = await fetch(API, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ table, fields }),
  });
  if (!res.ok) throw new Error(`Failed to create record: ${res.status}`);
  return res.json();
}
