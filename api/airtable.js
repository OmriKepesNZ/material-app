// Airtable and Cloudinary serverless endpoint.
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

const TABLE_GARMENT_SAMPLES  = "Garment Samples";
const TABLE_SAMPLE_VERSIONS  = "Sample Versions";

const F_GS_NAME       = "Sample Name";       // Single line text  (record title)
const F_GS_PRODUCT    = "Product";           // Link to Products
const F_GS_FACTORY    = "Factory";           // Single line text
const F_GS_STATUS     = "Status";            // Single select

const F_SV_SAMPLE     = "Garment Sample";    // Link to Garment Samples
const F_SV_VERSION    = "Version Number";    // Number
const F_SV_DATE       = "Submission Date";   // Date
const F_SV_NOTES      = "Factory Notes";     // Long text
const F_SV_STATUS     = "Status";            // Single select
const F_SV_PHOTOS     = "Photos";            // Attachments
const F_SV_FILES      = "Additional Files";  // Attachments
const F_SV_REVIEW_DATE  = "Review Date";     // Date
const F_SV_REVIEWED_BY  = "Reviewed By";     // Single line text
const F_SV_SUMMARY      = "Review Summary";  // Long text
const F_SV_NEXT_STEPS   = "Next Steps";      // Single select
const F_SV_FIT_COMMENTS  = "Fit Comments";          // Long text (JSON)
const F_SV_MFG_COMMENTS  = "Manufacturing Comments"; // Long text (JSON)
const F_SV_OBS_COMMENTS  = "Observation Comments";  // Long text (JSON)
const F_SV_MEAS_FILE     = "Measurement File";      // Attachments

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

  const productIdsWithMaterials = new Set();
  for (const mat of materialRecords) {
    const pid = mat.fields[F_MAT_PRODUCT]?.[0];
    if (pid) productIdsWithMaterials.add(pid);
  }

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

async function handleDELETE(body) {
  const { table, recordId } = body;
  const res = await fetch(`${BASE}/${encodeURIComponent(table)}/${recordId}`, {
    method:  "DELETE",
    headers: atHeaders,
  });
  return res.json();
}

async function handleDeleteProduct(body) {
  const { productId } = body;

  const materialRecords = await fetchAll(TABLE_MATERIALS);
  const linked = materialRecords.filter(m => m.fields[F_MAT_PRODUCT]?.[0] === productId);

  for (const mat of linked) {
    const submissionRecords = await fetchAll(TABLE_SUBMISSIONS);
    const subs = submissionRecords.filter(s => s.fields[F_SUB_MATERIAL]?.[0] === mat.id);
    for (const sub of subs) {
      await fetch(`${BASE}/${encodeURIComponent(TABLE_SUBMISSIONS)}/${sub.id}`, {
        method: "DELETE", headers: atHeaders,
      });
    }
    await fetch(`${BASE}/${encodeURIComponent(TABLE_MATERIALS)}/${mat.id}`, {
      method: "DELETE", headers: atHeaders,
    });
  }

  await fetch(`${BASE}/${encodeURIComponent(TABLE_PRODUCTS)}/${productId}`, {
    method: "DELETE", headers: atHeaders,
  });

  return { deleted: true, productId };
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

async function handleDeleteGarmentSample(body) {
  const { sampleId } = body;

  const versionRecords = await fetchAll(TABLE_SAMPLE_VERSIONS);
  const linked = versionRecords.filter(v => v.fields[F_SV_SAMPLE]?.[0] === sampleId);

  for (const v of linked) {
    await fetch(`${BASE}/${encodeURIComponent(TABLE_SAMPLE_VERSIONS)}/${v.id}`, {
      method: "DELETE", headers: atHeaders,
    });
  }

  await fetch(`${BASE}/${encodeURIComponent(TABLE_GARMENT_SAMPLES)}/${sampleId}`, {
    method: "DELETE", headers: atHeaders,
  });

  return { deleted: true, sampleId };
}

async function handleImageUpload(body) {
  const { imageBase64, filename } = body;
  const cloudName    = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "ml_default";

  if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME env var not set");

  const form = new FormData();
  form.append("file", imageBase64);
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

async function handleGetGarmentSamples() {
  const [sampleRecords, versionRecords, productRecords] = await Promise.all([
    fetchAll(TABLE_GARMENT_SAMPLES),
    fetchAll(TABLE_SAMPLE_VERSIONS),
    fetchAll(TABLE_PRODUCTS),
  ]);

  const productsById = {};
  for (const p of productRecords) productsById[p.id] = p;

  const versionsBySample = {};
  for (const v of versionRecords) {
    const sampleId = v.fields[F_SV_SAMPLE]?.[0];
    if (!sampleId) continue;
    if (!versionsBySample[sampleId]) versionsBySample[sampleId] = [];
    versionsBySample[sampleId].push(v);
  }

  return sampleRecords.map(s => {
    const productId  = s.fields[F_GS_PRODUCT]?.[0] || null;
    const product    = productId ? productsById[productId] : null;
    const rawVersions = (versionsBySample[s.id] || [])
      .sort((a, b) => (a.fields[F_SV_VERSION] || 0) - (b.fields[F_SV_VERSION] || 0));

    const versions = rawVersions.map(v => {
      let fitComments = [], mfgComments = [], obsComments = [];
      try { fitComments = JSON.parse(v.fields[F_SV_FIT_COMMENTS] || "[]"); } catch {}
      try { mfgComments = JSON.parse(v.fields[F_SV_MFG_COMMENTS] || "[]"); } catch {}
      try { obsComments = JSON.parse(v.fields[F_SV_OBS_COMMENTS] || "[]"); } catch {}

      return {
        airtableId:     v.id,
        versionNum:     v.fields[F_SV_VERSION]      || 1,
        dateReceived:   v.fields[F_SV_DATE]          || "",
        status:         v.fields[F_SV_STATUS]        || "Awaiting Review",
        factoryNotes:   v.fields[F_SV_NOTES]         || "",
        photos:         (v.fields[F_SV_PHOTOS] || []).map(a => ({ url: a.url, name: a.filename })),
        additionalFiles:(v.fields[F_SV_FILES]  || []).map(a => ({ url: a.url, name: a.filename })),
        measurementFile:(v.fields[F_SV_MEAS_FILE]?.[0])
          ? { url: v.fields[F_SV_MEAS_FILE][0].url, name: v.fields[F_SV_MEAS_FILE][0].filename }
          : null,
        brandDecision: v.fields[F_SV_STATUS] === "Awaiting Review" ? null : {
          type:       v.fields[F_SV_STATUS]       || "",
          by:         v.fields[F_SV_REVIEWED_BY]  || "",
          date:       v.fields[F_SV_REVIEW_DATE]  || "",
          summary:    v.fields[F_SV_SUMMARY]       || "",
          nextSteps:  v.fields[F_SV_NEXT_STEPS]   || "",
          fitComments,
          mfgComments,
          obsComments,
        },
      };
    });

    const latestVersion = versions[versions.length - 1];

    return {
      id:          s.id,
      airtableId:  s.id,
      productName: s.fields[F_GS_NAME]    || "",
      productId:   productId,
      code:        product?.fields[F_PRODUCT_NAME] || "", // reuse product name as code fallback
      factory:     s.fields[F_GS_FACTORY] || "",
      status:      latestVersion?.status  || "Awaiting Review",
      versions,
    };
  });
}

async function handleCreateGarmentSample(body) {
  const {
    productName,
    factory,
    airtableProductId,
    factoryNotes,
    dateSent,
    photoUrls      = [],
    additionalFileUrls = [],
  } = body;

  const sampleFields = {
    [F_GS_NAME]:    productName,
    [F_GS_FACTORY]: factory,
    [F_GS_STATUS]:  "Awaiting Review",
  };
  if (airtableProductId) {
    sampleFields[F_GS_PRODUCT] = [airtableProductId];
  }

  const sampleRes = await fetch(`${BASE}/${encodeURIComponent(TABLE_GARMENT_SAMPLES)}`, {
    method:  "POST",
    headers: atHeaders,
    body:    JSON.stringify({ fields: sampleFields }),
  });
  const sampleData = await sampleRes.json();
  if (sampleData.error) throw new Error(`Create garment sample: ${sampleData.error.message}`);

  const versionFields = {
    [F_SV_SAMPLE]:   [sampleData.id],
    [F_SV_VERSION]:  1,
    [F_SV_DATE]:     dateSent || new Date().toISOString().slice(0, 10),
    [F_SV_NOTES]:    factoryNotes || "",
    [F_SV_STATUS]:   "Awaiting Review",
  };
  if (photoUrls.length > 0) {
    versionFields[F_SV_PHOTOS] = photoUrls.map(url => ({ url }));
  }
  if (additionalFileUrls.length > 0) {
    versionFields[F_SV_FILES] = additionalFileUrls.map(url => ({ url }));
  }

  const versionRes = await fetch(`${BASE}/${encodeURIComponent(TABLE_SAMPLE_VERSIONS)}`, {
    method:  "POST",
    headers: atHeaders,
    body:    JSON.stringify({ fields: versionFields }),
  });
  const versionData = await versionRes.json();
  if (versionData.error) throw new Error(`Create sample version: ${versionData.error.message}`);

  return {
    sampleId:  sampleData.id,
    versionId: versionData.id,
    sampleData,
    versionData,
  };
}

async function handleCreateSampleVersion(body) {
  const {
    garmentSampleId,
    versionNum,
    factoryNotes,
    dateSent,
    photoUrls          = [],
    additionalFileUrls = [],
  } = body;

  const versionFields = {
    [F_SV_SAMPLE]:  [garmentSampleId],
    [F_SV_VERSION]: versionNum,
    [F_SV_DATE]:    dateSent || new Date().toISOString().slice(0, 10),
    [F_SV_NOTES]:   factoryNotes || "",
    [F_SV_STATUS]:  "Awaiting Review",
  };
  if (photoUrls.length > 0) {
    versionFields[F_SV_PHOTOS] = photoUrls.map(url => ({ url }));
  }
  if (additionalFileUrls.length > 0) {
    versionFields[F_SV_FILES] = additionalFileUrls.map(url => ({ url }));
  }

  await fetch(`${BASE}/${encodeURIComponent(TABLE_GARMENT_SAMPLES)}/${garmentSampleId}`, {
    method:  "PATCH",
    headers: atHeaders,
    body:    JSON.stringify({ fields: { [F_GS_STATUS]: "Awaiting Review" } }),
  });

  const res  = await fetch(`${BASE}/${encodeURIComponent(TABLE_SAMPLE_VERSIONS)}`, {
    method:  "POST",
    headers: atHeaders,
    body:    JSON.stringify({ fields: versionFields }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Create sample version: ${data.error.message}`);

  return { versionId: data.id, versionData: data };
}

async function handleReviewSampleVersion(body) {
  const {
    versionId,
    garmentSampleId,
    status,
    reviewedBy,
    reviewDate,
    summary,
    nextSteps,
    fitComments  = [],
    mfgComments  = [],
    obsComments  = [],
    measurementFileUrl,
  } = body;

  const versionFields = {
    [F_SV_STATUS]:      status,
    [F_SV_REVIEWED_BY]: reviewedBy || "",
    [F_SV_REVIEW_DATE]: reviewDate || new Date().toISOString().slice(0, 10),
    [F_SV_SUMMARY]:     summary    || "",
    [F_SV_NEXT_STEPS]:  nextSteps === "request-another" ? "Request Another Sample" : nextSteps === "no-more" ? "No More Samples Required" : "",
    [F_SV_FIT_COMMENTS]: JSON.stringify(fitComments),
    [F_SV_MFG_COMMENTS]: JSON.stringify(mfgComments),
    [F_SV_OBS_COMMENTS]: JSON.stringify(obsComments),
  };
  if (measurementFileUrl) {
    versionFields[F_SV_MEAS_FILE] = [{ url: measurementFileUrl }];
  }

  const versionRes = await fetch(`${BASE}/${encodeURIComponent(TABLE_SAMPLE_VERSIONS)}/${versionId}`, {
    method:  "PATCH",
    headers: atHeaders,
    body:    JSON.stringify({ fields: versionFields }),
  });
  const versionData = await versionRes.json();
  if (versionData.error) throw new Error(`Review version: ${versionData.error.message}`);

  await fetch(`${BASE}/${encodeURIComponent(TABLE_GARMENT_SAMPLES)}/${garmentSampleId}`, {
    method:  "PATCH",
    headers: atHeaders,
    body:    JSON.stringify({ fields: { [F_GS_STATUS]: status } }),
  });

  return { versionId, status, versionData };
}

async function handleFileUpload(body) {
  const { fileBase64, filename } = body;
  const cloudName    = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "ml_default";

  if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME env var not set");

  const form = new FormData();
  form.append("file", fileBase64);
  form.append("upload_preset", uploadPreset);
  form.append("resource_type", "raw");
  if (filename) form.append("public_id", filename.replace(/\.[^.]+$/, ""));

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: "POST",
    body:   form,
  });
  const data = await res.json();
  if (data.error) throw new Error("Cloudinary file upload failed: " + data.error.message);
  return { url: data.secure_url, filename };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {

    if (req.method === "GET") {
      if (req.query?.section === "samples") {
        return res.status(200).json(await handleGetGarmentSamples());
      }
      return res.status(200).json(await handleGET());
    }

    if (req.method === "PATCH") {
      return res.status(200).json(await handlePATCH(req.body));
    }

    if (req.method === "POST") {
      const { action } = req.body || {};

      if (action === "uploadImage") {
        return res.status(200).json(await handleImageUpload(req.body));
      }
      if (action === "deleteProduct") {
        return res.status(200).json(await handleDeleteProduct(req.body));
      }
      if (action === "deleteGarmentSample") {
        return res.status(200).json(await handleDeleteGarmentSample(req.body));
      }

      if (action === "uploadFile") {
        return res.status(200).json(await handleFileUpload(req.body));
      }
      if (action === "createGarmentSample") {
        return res.status(200).json(await handleCreateGarmentSample(req.body));
      }
      if (action === "createSampleVersion") {
        return res.status(200).json(await handleCreateSampleVersion(req.body));
      }
      if (action === "reviewSampleVersion") {
        return res.status(200).json(await handleReviewSampleVersion(req.body));
      }

      return res.status(200).json(await handlePOST(req.body));
    }

    if (req.method === "DELETE") {
      return res.status(200).json(await handleDELETE(req.body));
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
