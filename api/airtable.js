// =============================================================================
// /api/airtable.js  --  Vercel serverless function
// =============================================================================
// Place this file at:  your-project/api/airtable.js
//
// Then add these two Environment Variables in Vercel:
//   AIRTABLE_TOKEN    -> your personal access token from airtable.com/create/tokens
//   AIRTABLE_BASE_ID  -> the "appXXXXXXXXXXXX" from your Airtable base URL
//
// NOTE: No VITE_ prefix needed here -- these run on the server, not the browser.
// =============================================================================
// TABLE & FIELD NAMES -- change these if your Airtable columns are named differently
// =============================================================================

const TABLE_PRODUCTS    = "Products";
const TABLE_MATERIALS   = "Materials";
const TABLE_SUBMISSIONS = "Submissions";

const F_PRODUCT_NAME   = "Product Name";
const F_PRODUCT_SEASON = "Season";

const F_MAT_NAME     = "Material Name";
const F_MAT_TYPE     = "Type";
const F_MAT_PRODUCT  = "Product";
const F_MAT_SUPPLIER = "Supplier";

const F_SUB_MATERIAL  = "Material";
const F_SUB_VERSION   = "Version";
const F_SUB_DATE      = "Submission Date";
const F_SUB_PHOTO     = "Photo";
const F_SUB_NOTES     = "Factory Notes";
const F_SUB_SPECS     = "Extracted Specs";
const F_SUB_STATUS    = "Status";
const F_SUB_COMMENT   = "Brand Comment";
const F_SUB_APPROVAL  = "Approval Date";
const F_SUB_COURIER   = "Courier";
const F_SUB_TRACKING  = "Tracking Number";
const F_SUB_SHIPMENT  = "Shipment Status";

// =============================================================================
// NOTHING BELOW THIS LINE NEEDS CHANGING
// =============================================================================

const TOKEN   = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const BASE    = `https://api.airtable.com/v0/${BASE_ID}`;

const atHeaders = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function fetchAll(table) {
  let records = [];
  let offset  = null;
  do {
    const url = new URL(`${BASE}/${encodeURIComponent(table)}`);
    if (offset) url.searchParams.set("offset", offset);
    const res  = await fetch(url, { headers: atHeaders });
    const data = await res.json();
    if (data.error) throw new Error(`Airtable "${table}": ${data.error.message}`);
    records = records.concat(data.records);
    offset  = data.offset;
  } while (offset);
  return records;
}

async function handleGET() {
  const [productRecords, materialRecords, submissionRecords] = await Promise.all([
    fetchAll(TABLE_PRODUCTS),
    fetchAll(TABLE_MATERIALS),
    fetchAll(TABLE_SUBMISSIONS),
  ]);

  const productsById = {};
  for (const p of productRecords) productsById[p.id] = p;

  const subsByMat = {};
  for (const sub of submissionRecords) {
    const matId = sub.fields[F_SUB_MATERIAL]?.[0];
    if (!matId) continue;
    if (!subsByMat[matId]) subsByMat[matId] = [];
    subsByMat[matId].push(sub);
  }

  // Track which products already have at least one material
  const productIdsWithMaterials = new Set();
  for (const mat of materialRecords) {
    const pid = mat.fields[F_MAT_PRODUCT]?.[0];
    if (pid) productIdsWithMaterials.add(pid);
  }

  // Build result: all materials (as before)
  const result = materialRecords.map(mat => {
    const product = productsById[mat.fields[F_MAT_PRODUCT]?.[0]];
    const subs    = (subsByMat[mat.id] || [])
      .sort((a, b) => a.fields[F_SUB_VERSION] - b.fields[F_SUB_VERSION]);

    return {
      id:                mat.id,
      airtableId:        mat.id,
      airtableProductId: mat.fields[F_MAT_PRODUCT]?.[0] || null,
      styleName:         product?.fields[F_PRODUCT_NAME]   || "",
      brand:             "",
      season:            product?.fields[F_PRODUCT_SEASON] || "",
      factoryName:       mat.fields[F_MAT_SUPPLIER]        || "",
      materialType:      mat.fields[F_MAT_TYPE]            || "",
      materialName:      mat.fields[F_MAT_NAME]            || "",
      versions: subs.map(sub => ({
        airtableId:     sub.id,
        version:        sub.fields[F_SUB_VERSION]          || 1,
        submissionDate: sub.fields[F_SUB_DATE]             || "",
        image:          sub.fields[F_SUB_PHOTO]?.[0]?.url  || null,
        factoryNotes:   sub.fields[F_SUB_NOTES]            || "",
        extractedSpecs: sub.fields[F_SUB_SPECS]            || "",
        status:         sub.fields[F_SUB_STATUS]           || "Pending",
        brandComment:   sub.fields[F_SUB_COMMENT]          || "",
        approvalDate:   sub.fields[F_SUB_APPROVAL]         || null,
        courier:        sub.fields[F_SUB_COURIER]          || "",
        trackingNumber: sub.fields[F_SUB_TRACKING]         || "",
        shipmentStatus: sub.fields[F_SUB_SHIPMENT]         || "At Factory",
      })),
    };
  });

  // Add sentinel entries for products that have NO materials yet,
  // so empty product folders survive a refresh.
  for (const p of productRecords) {
    if (!productIdsWithMaterials.has(p.id)) {
      result.push({
        id:                "sentinel__" + p.id,
        airtableId:        null,
        airtableProductId: p.id,
        styleName:         p.fields[F_PRODUCT_NAME]   || "",
        brand:             "",
        season:            p.fields[F_PRODUCT_SEASON] || "",
        factoryName:       "",
        materialType:      "",
        materialName:      "__empty__",
        versions:          [],
      });
    }
  }

  return result;
}

async function handlePATCH(body) {
  const { table, recordId, fields } = body;
  const res = await fetch(`${BASE}/${encodeURIComponent(table)}/${recordId}`, {
    method:  "PATCH",
    headers: atHeaders,
    body:    JSON.stringify({ fields }),
  });
  return res.json();
}

async function handlePOST(body) {
  const { table, fields } = body;
  const res = await fetch(`${BASE}/${encodeURIComponent(table)}`, {
    method:  "POST",
    headers: atHeaders,
    body:    JSON.stringify({ fields }),
  });
  return res.json();
}

// Upload a base64 image via Cloudinary unsigned upload.
// Requires one env var: CLOUDINARY_CLOUD_NAME (free Cloudinary account).
// Upload preset must be set to "unsigned" in your Cloudinary dashboard.
// Preset name defaults to "ml_default" (Cloudinary's built-in unsigned preset).
async function handleImageUpload(body) {
  const { imageBase64, filename } = body;
  const cloudName   = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "ml_default";

  if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME env var not set");

  const form = new FormData();
  form.append("file", imageBase64);          // Cloudinary accepts data URIs directly
  form.append("upload_preset", uploadPreset);
  if (filename) form.append("public_id", filename.replace(/\.[^.]+$/, ""));

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body:   form,
  });

  const data = await res.json();
  if (data.error) throw new Error("Cloudinary upload failed: " + data.error.message);
  return { url: data.secure_url };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const data = await handleGET();
      return res.status(200).json(data);
    }
    if (req.method === "PATCH") {
      const result = await handlePATCH(req.body);
      return res.status(200).json(result);
    }
    if (req.method === "POST") {
      // Route: image upload vs. normal record creation
      if (req.body?.action === "uploadImage") {
        const result = await handleImageUpload(req.body);
        return res.status(200).json(result);
      }
      const result = await handlePOST(req.body);
      return res.status(200).json(result);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
