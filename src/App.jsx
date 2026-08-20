import React, { useState, useRef, useEffect, useMemo } from "react";
import "./styles/global.css";

import {
  loadAllData, createRecord, updateRecord, uploadImage, deleteProduct,
  loadGarmentSamples, createGarmentSample, createSampleVersion,
  reviewSampleVersion, uploadFile, deleteGarmentSample,
} from "./lib/airtable";

import { MATERIAL_TYPES } from "./lib/constants";
import { relativeDate } from "./lib/format";
import { STATUS_COLORS, GS_STATUS_COLORS } from "./lib/theme";
import { ICO } from "./lib/icons";

import Badge from "./components/shared/Badge";
import Spinner from "./components/shared/Spinner";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import SearchBar from "./components/shared/SearchBar";
import AddRow from "./components/shared/AddRow";

import NewSubmissionModal from "./components/materials/NewSubmissionModal";
import MaterialDetail from "./components/materials/MaterialDetail";

import GsNewSampleModal from "./components/samples/GsNewSampleModal";
import GsDetail from "./components/samples/GsDetail";

const thStyle = { padding:"9px 14px", textAlign:"left", fontSize:10.5, fontWeight:700, color:"#C4C9D4", textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" };

export default function App() {

  const [view,    setView]    = useState("factory"); // "factory" | "brand"
  const [section, setSection] = useState("samples"); // "materials" | "samples"
  // ---- product tabs (open products in sidebar) ----
  const [openTabs,    setOpenTabs]    = useState([]); // array of product ids
  const [activeTab,   setActiveTab]   = useState(null); // currently selected product id
  const [tabSection,  setTabSection]  = useState({}); // { [productId]: "materials" | "samples" }
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

  const [gError, setGError] = useState(null);

  // Load garment samples when section switches to "samples"
  useEffect(() => {
    if (section !== "samples" || gSamples.length > 0) return;
    setGLoading(true);
    setGError(null);
    loadGarmentSamples()
      .then(data => { setGSamples(data); setGLoading(false); })
      .catch(err  => {
        console.error("Garment samples load error:", err);
        setGError(err.message);
        setGLoading(false);
      });
  }, [section]);

  function retryGarmentSamples() {
    setGError(null);
    setGLoading(true);
    loadGarmentSamples()
      .then(data => { setGSamples(data); setGLoading(false); })
      .catch(err  => { setGError(err.message); setGLoading(false); });
  }

  const gSelectedSample = gSelected ? gSamples.find(s => s.id === gSelected) : null;

  // ---- tab helpers ----
  function openTab(productId) {
    setOpenTabs(t => t.includes(productId) ? t : [...t, productId]);
    setActiveTab(productId);
    setSelected(null); setGSelected(null);
    // Load garment samples if not yet loaded
    if (gSamples.length === 0 && !gLoading) {
      setGLoading(true);
      loadGarmentSamples()
        .then(data => { setGSamples(data); setGLoading(false); })
        .catch(err  => { setGError(err.message); setGLoading(false); });
    }
  }
  function closeTab(productId, e) {
    e.stopPropagation();
    setOpenTabs(t => {
      const next = t.filter(id => id !== productId);
      if (activeTab === productId) setActiveTab(next[next.length-1] || null);
      return next;
    });
    if (activeTab === productId) { setSelected(null); setGSelected(null); }
  }
  function setTabSectionForActive(sec) {
    if (!activeTab) return;
    setTabSection(s => ({ ...s, [activeTab]: sec }));
  }

  const activeTabSection = activeTab ? (tabSection[activeTab] || "samples") : "samples";

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
      alert("Could not save review.\n\nError: " + (err?.message || String(err)) + "\n\nCheck that your Airtable Sample Versions table has all required fields (see setup guide).");
    }
  }

  async function handleDeleteGarmentSample(sampleId) {
    const sample = gSamples.find(s => s.id === sampleId);
    if (!sample) return;

    const versionCount = sample.versions.length;
    const msg = versionCount > 0
      ? `Delete "${sample.productName}"?\n\nThis will permanently delete the sample and ${versionCount} version${versionCount !== 1 ? "s" : ""}. This cannot be undone.`
      : `Delete "${sample.productName}"?\n\nThis cannot be undone.`;

    if (!window.confirm(msg)) return;

    try {
      if (sample.airtableId && !sample.airtableId.startsWith("local_")) {
        await deleteGarmentSample(sample.airtableId);
      }
      setGSamples(p => p.filter(s => s.id !== sampleId));
      if (gSelected === sampleId) setGSelected(null);
    } catch(err) {
      console.error("Delete failed:", err);
      alert("Could not delete — please try again.\n\n" + err.message);
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

  const activeProduct = activeTab ? products.find(p => p.id === activeTab) : null;

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
    const targetProduct     = activeProduct || curProduct;
    const productName       = targetProduct?.name || "Unknown";
    const airtableProductId = targetProduct?.airtableProductId || null;

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
        brand:             targetProduct?.brand  || "",
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

    const submissionCount = product.materialIds.filter(id => {
      const m = materials.find(x => x.id === id);
      return m && m.materialName !== "__empty__" && m.versions.length > 0;
    }).length;

    const msg = submissionCount > 0
      ? `Delete "${product.name}"?

This will permanently delete the product and ${submissionCount} material submission${submissionCount !== 1 ? "s" : ""}. This cannot be undone.`
      : `Delete "${product.name}"?

This cannot be undone.`;

    if (!window.confirm(msg)) return;

    try {
      if (product.airtableProductId) {
        await deleteProduct(product.airtableProductId);
      }
      setMaterials(p => p.filter(m => !product.materialIds.includes(m.id)));
      if (nav === productId) setNav(null);
      if (bNav === productId) setBNav(null);
    } catch(err) {
      console.error("Delete failed:", err);
      alert("Could not delete — please try again.\n\n" + err.message);
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
    const filtered = rows.filter(m => m.latest && (!filters.type || m.materialType === filters.type) && (!filters.status || m.latest.status === filters.status));
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
                  onClick={() => {
                    setSelected(m.id);
                    setBrandComment(m.latest?.brandComment||"");
                    setShowNewVersionFor(null);
                    // If in search mode, also nav into the product so detail view renders
                    if (searchResults !== null) {
                      // Find the product by airtableProductId or by matching name
                      const prod = products.find(p =>
                        p.airtableProductId === m.airtableProductId ||
                        p.name === m.styleName
                      );
                      if (prod) {
                        if (view === "factory") goProd(prod.id);
                        else bGoProd(prod.id);
                      }
                      setSearch("");
                    }
                  }}
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


  // ---- loading / error screens ----
  const screenStyle = { display:"flex", alignItems:"center", justifyContent:"center",
    height:"100vh", fontFamily:"DM Sans, Helvetica Neue, sans-serif", background:"#F4F5F7" };

  if (loading) return (
    <div style={screenStyle}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"2.5px solid #E5E7EB",
          borderTopColor:"#111827", borderRadius:"50%",
          animation:"spin 0.7s linear infinite", margin:"0 auto 16px" }} />
        <div style={{ fontSize:14, fontWeight:500, color:"#374151" }}>Loading</div>
        <div style={{ fontSize:12, color:"#9CA3AF", marginTop:4 }}>Connecting to Airtable…</div>
      </div>
    </div>
  );

  if (loadError) return (
    <div style={screenStyle}>
      <div style={{ textAlign:"center", maxWidth:380, padding:24 }}>
        <div style={{ width:48, height:48, borderRadius:12, background:"#FEF2F2",
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
            stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div style={{ fontSize:15, fontWeight:600, color:"#111827", marginBottom:6 }}>
          Could not connect to Airtable
        </div>
        <div style={{ fontSize:13, color:"#6B7280", lineHeight:1.65, marginBottom:20 }}>
          {loadError}
        </div>
        <div style={{ fontSize:11, color:"#C4C9D4", marginBottom:20, lineHeight:1.6 }}>
          Check your <code style={{ background:"#F3F4F6", padding:"1px 5px",
            borderRadius:3, fontFamily:"monospace", fontSize:11 }}>AIRTABLE_TOKEN</code> and{" "}
          <code style={{ background:"#F3F4F6", padding:"1px 5px",
            borderRadius:3, fontFamily:"monospace", fontSize:11 }}>AIRTABLE_BASE_ID</code>{" "}
          in Vercel environment variables.
        </div>
        <button
          onClick={() => { setLoadError(null); setLoading(true); loadAllData().then(d=>{setMaterials(d);setLoading(false);}).catch(e=>{setLoadError(e.message);setLoading(false);}); }}
          style={{ padding:"10px 24px", background:"#111827", color:"#fff",
            border:"none", borderRadius:8, fontSize:13, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit" }}>
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"DM Sans, Helvetica Neue, sans-serif", background:"#F4F5F7", minHeight:"100vh", color:"#111827", display:"flex", flexDirection:"column" }}>
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
        .scard { transition: box-shadow 0.15s, transform 0.12s; cursor:pointer; }
        .scard:hover { box-shadow:0 4px 16px rgba(0,0,0,0.08) !important; transform:translateY(-1px); }
        .navitem:hover { background:#F3F4F6 !important; }
        select { appearance:none; }
      `}</style>

      {/* ===== NAV BAR ===== */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E8EAED", flexShrink:0 }}>
        <div style={{ height:56, display:"flex", alignItems:"center",
          justifyContent:"space-between", padding:"0 24px" }}>

          {/* Logo + app title */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:24, height:24, background:"#111827", borderRadius:6, display:"flex",
              alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <span style={{ fontSize:14, fontWeight:700, color:"#111827", letterSpacing:"-0.01em" }}>Approvals</span>
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
        <div style={{ width:220, background:"#fff", borderRight:"1px solid #E8EAED",
          flexShrink:0, display:"flex", flexDirection:"column", overflowY:"auto" }}>

          {/* Factory submit button + home — always at top */}
          <div style={{ padding:"12px 10px", borderBottom: openTabs.length > 0 ? "1px solid #F3F4F6" : "none" }}>
            {/* Home button */}
            <button className="navitem"
              onClick={() => { setActiveTab(null); setSelected(null); setGSelected(null); }}
              style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
                padding:"8px 10px", borderRadius:7, border:"none", cursor:"pointer",
                fontFamily:"inherit",
                background: !activeTab ? "#F3F4F6" : "transparent" }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={!activeTab?"#111827":"#9CA3AF"} strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontSize:13, fontWeight: !activeTab ? 600 : 400,
                color: !activeTab ? "#111827" : "#6B7280" }}>All Products</span>
            </button>
            {/* New submission (factory) or placeholder */}
            {view === "factory" && (
              <button onClick={() => { if (activeTab) setShowNew(true); else setAddingProduct(true); }}
                style={{ display:"flex", alignItems:"center", gap:6, width:"100%",
                  padding:"8px 10px", borderRadius:7, border:"1px solid #E8EAED",
                  background:"transparent", cursor:"pointer", fontFamily:"inherit",
                  fontSize:12, fontWeight:600, color:"#374151", marginTop:4 }}>
                {ICO.plus()}
                {activeTab ? "New Submission" : "Add Product"}
              </button>
            )}
          </div>

          {/* Open product tabs */}
          {openTabs.length > 0 && (
            <div style={{ padding:"8px 10px", flex:1 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#C4C9D4", textTransform:"uppercase",
                letterSpacing:"0.08em", padding:"0 4px", marginBottom:6 }}>Open</div>
              {openTabs.map(tabId => {
                const p = products.find(x => x.id === tabId);
                if (!p) return null;
                const isActive = tabId === activeTab;
                const mats = p.materialIds.map(id => materials.find(m => m.id===id)).filter(Boolean);
                const real = mats.filter(m => m.materialName !== "__empty__" && m.versions.length > 0);
                const pendingMat = real.filter(m => m.versions[m.versions.length-1].status === (view==="brand"?"Pending":"Rejected")).length;
                const pendingGs  = gSamples.filter(s => s.productName === p.name &&
                  s.status === (view==="brand"?"Awaiting Review":"New Sample Requested")).length;
                const totalPending = pendingMat + pendingGs;
                const thumb = real.find(m => m.versions[m.versions.length-1].image)?.versions.slice(-1)[0].image || null;
                return (
                  <div key={tabId} onClick={() => { setActiveTab(tabId); setSelected(null); setGSelected(null); }}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"7px 8px", borderRadius:7, cursor:"pointer", marginBottom:2,
                      background: isActive ? "#F3F4F6" : "transparent",
                      transition:"background 0.1s" }}
                    onMouseEnter={e => { if(!isActive) e.currentTarget.style.background="#FAFAFA"; }}
                    onMouseLeave={e => { if(!isActive) e.currentTarget.style.background="transparent"; }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
                      {/* Mini thumb */}
                      <div style={{ width:24, height:24, borderRadius:5, flexShrink:0, overflow:"hidden",
                        background:"#F3F4F6", border:"1px solid #E8EAED" }}>
                        {thumb
                          ? <img src={thumb} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12l-2-4z"/></svg>
                            </div>
                        }
                      </div>
                      <span style={{ fontSize:12.5, fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#111827" : "#6B7280",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {p.name}
                      </span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                      {totalPending > 0 && (
                        <span style={{ fontSize:9, fontWeight:700, width:16, height:16, borderRadius:"50%",
                          background:"#EF4444", color:"#fff", display:"flex", alignItems:"center",
                          justifyContent:"center" }}>{totalPending}</span>
                      )}
                      <button onClick={e => closeTab(tabId, e)}
                        style={{ width:16, height:16, borderRadius:3, border:"none",
                          background:"transparent", cursor:"pointer", display:"flex",
                          alignItems:"center", justifyContent:"center", color:"#C4C9D4",
                          fontSize:14, lineHeight:1, padding:0 }}
                        onMouseEnter={e => { e.currentTarget.style.color="#6B7280"; e.currentTarget.style.background="#E5E7EB"; }}
                        onMouseLeave={e => { e.currentTarget.style.color="#C4C9D4"; e.currentTarget.style.background="transparent"; }}>
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Main scrollable content ── */}
        <ErrorBoundary>
        <div style={{ flex:1, overflowY:"auto", padding:"28px 28px 100px", minWidth:0 }}>

        {/* ===== PAGE CONTENT ===== */}

        {/* ── HOME: no active tab — show all products ── */}
        {!activeTab && (
          <div style={{ maxWidth:900 }}>
            {/* Factory: new submission button above search when no tabs open */}
            {view === "factory" && openTabs.length === 0 && (
              <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                <button onClick={() => setAddingProduct(true)}
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px",
                    background:"#111827", color:"#fff", border:"none", borderRadius:7,
                    fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  {ICO.plus()} Add product
                </button>
              </div>
            )}

            {/* Global search */}
            <SearchBar search={search} setSearch={setSearch}
              placeholder="Search products, materials, suppliers..." />

            {searchResults !== null ? (
              <div>
                <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:12 }}>
                  {searchResults.length} result{searchResults.length!==1?"s":""} for{" "}
                  <span style={{ fontWeight:600, color:"#374151" }}>"{search}"</span>
                </div>
                <MatTable rows={searchResults} showContext />
              </div>
            ) : (
              <div>
                {/* Add product inline */}
                {addingProduct && (
                  <AddRow placeholder="Product name…"
                    onAdd={addProduct} onCancel={() => setAddingProduct(false)} />
                )}
                {/* Product count */}
                <div style={{ fontSize:12, color:"#9CA3AF", fontWeight:500, marginBottom:10 }}>
                  {products.length} product{products.length!==1?"s":""}
                </div>
                {/* All product cards */}
                {products.length === 0 && !addingProduct ? (
                  <div style={{ padding:"64px 24px", textAlign:"center", background:"#fff",
                    borderRadius:12, border:"1px solid #E8EAED" }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:"#F3F4F6",
                      display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.6">
                        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12l-2-4z"/>
                      </svg>
                    </div>
                    <div style={{ fontWeight:600, fontSize:14, color:"#374151", marginBottom:5 }}>No products yet</div>
                    <div style={{ color:"#9CA3AF", fontSize:13 }}>
                      {view==="factory" ? "Use \"Add product\" to get started" : "No products set up yet"}
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {products.map(p => {
                      const mats    = p.materialIds.map(id => materials.find(m => m.id===id)).filter(Boolean);
                      const real    = mats.filter(m => m.materialName !== "__empty__" && m.versions.length > 0);
                      const pending = real.filter(m => m.versions[m.versions.length-1].status === "Pending").length;
                      const rejected= real.filter(m => m.versions[m.versions.length-1].status === "Rejected").length;
                      const latestVer = real.length > 0 ? real[real.length-1].versions[real[real.length-1].versions.length-1] : null;
                      const displayDate = latestVer ? (latestVer.approvalDate || latestVer.submissionDate) : null;
                      const timeStr = relativeDate(displayDate);

                      // Garment sample counts for this product
                      const gs = gSamples.filter(s => s.productName === p.name);
                      const gsPending = gs.filter(s => s.status === "Awaiting Review").length;

                      // Thumbnail — prefer the most recently submitted garment sample photo,
                      // fall back to the most recent raw material photo if no garment sample photo exists
                      const latestGsPhoto = gs
                        .map(s => s.versions[s.versions.length-1])
                        .filter(v => v && v.photos && v.photos.length > 0)
                        .sort((a,b) => new Date(b.dateReceived||0) - new Date(a.dateReceived||0))[0]
                        ?.photos[0];
                      const gsThumb = latestGsPhoto ? (latestGsPhoto.url || latestGsPhoto.dataUrl) : null;
                      const matThumb = real.find(m => m.versions[m.versions.length-1].image)?.versions.slice(-1)[0].image || null;
                      const thumb = gsThumb || matThumb;

                      // Overall product status
                      const hasPending  = pending > 0;
                      const hasRejected = rejected > 0;
                      const overallStatus = hasPending ? "Pending"
                        : hasRejected ? "Rejected"
                        : real.length > 0 && real.every(m => m.versions[m.versions.length-1].status === "Approved") ? "Approved"
                        : real.length === 0 ? "No submissions" : "Mixed";
                      const sc = STATUS_COLORS[overallStatus] || { bg:"#F3F4F6", text:"#6B7280", dot:"#9CA3AF" };

                      return (
                        <div key={p.id} className="prow"
                          onClick={() => openTab(p.id)}
                          style={{ background:"#fff", border:"1px solid #E8EAED",
                            borderRadius:14, padding:"14px 18px",
                            display:"flex", alignItems:"center", gap:14,
                            boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>

                          {/* Thumbnail */}
                          <div style={{ width:52, height:52, borderRadius:10, flexShrink:0,
                            overflow:"hidden", background:"#F3F4F6", border:"1px solid #E8EAED",
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {thumb
                              ? <img src={thumb} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                              : <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-2 4h12l-2-4z"/>
                                </svg>
                            }
                          </div>

                          {/* Info */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                              <span style={{ fontSize:14, fontWeight:600, color:"#0F1117", letterSpacing:"-0.01em" }}>
                                {p.name}
                              </span>
                              {real.length > 0 && (
                                <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                                  padding:"2px 8px", borderRadius:20, background:sc.bg, color:sc.text,
                                  fontSize:11, fontWeight:600 }}>
                                  <span style={{ width:5, height:5, borderRadius:"50%", background:sc.dot }} />
                                  {overallStatus}
                                </span>
                              )}
                              {gsPending > 0 && (
                                <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                                  padding:"2px 8px", borderRadius:20,
                                  background:GS_STATUS_COLORS["Awaiting Review"].bg,
                                  color:GS_STATUS_COLORS["Awaiting Review"].text,
                                  fontSize:11, fontWeight:600 }}>
                                  <span style={{ width:5, height:5, borderRadius:"50%", background:GS_STATUS_COLORS["Awaiting Review"].dot }} />
                                  {gsPending} sample{gsPending!==1?"s":""} to review
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize:12, color:"#8B909A", display:"flex", gap:5, flexWrap:"wrap" }}>
                              {real.length > 0 && <span>{real.length} material{real.length!==1?"s":""}</span>}
                              {gs.length > 0 && <><span style={{ color:"#E5E7EB" }}>·</span><span>{gs.length} garment sample{gs.length!==1?"s":""}</span></>}
                              {timeStr && <><span style={{ color:"#E5E7EB" }}>·</span><span>{timeStr}</span></>}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                            <button onClick={e => { e.stopPropagation(); handleDeleteProduct(p.id); }}
                              style={{ width:30, height:30, borderRadius:7, border:"1px solid #F3F4F6",
                                background:"transparent", cursor:"pointer", display:"flex",
                                alignItems:"center", justifyContent:"center", color:"#D1D5DB", transition:"all 0.12s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor="#FEE2E2"; e.currentTarget.style.color="#EF4444"; e.currentTarget.style.background="#FEF2F2"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor="#F3F4F6"; e.currentTarget.style.color="#D1D5DB"; e.currentTarget.style.background="transparent"; }}>
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                            <button onClick={() => openTab(p.id)}
                              style={{ display:"flex", alignItems:"center", gap:5,
                                padding:"7px 14px", border:"none", borderRadius:8,
                                fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                                background:"#F3F4F6", color:"#374151" }}>
                              Open
                              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCT TAB: active product open ── */}
        {activeTab && activeProduct && (() => {
          const materialDetailOpen = activeTabSection === "materials" && selectedMaterial && activeProduct.materialIds.includes(selectedMaterial.id);
          const sampleDetailOpen   = activeTabSection === "samples" && gSelectedSample && gSelectedSample.productName === activeProduct.name;
          const detailOpen = materialDetailOpen || sampleDetailOpen;
          return (
          <div style={{ maxWidth:900 }}>
            {/* Product header — hidden while viewing a material/sample detail, which has its own back nav */}
            {!detailOpen && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <button onClick={() => { setActiveTab(null); setSelected(null); setGSelected(null); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF",
                    display:"flex", alignItems:"center", gap:4, fontSize:13, fontFamily:"inherit", padding:0 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  All products
                </button>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{activeProduct.name}</span>
              </div>

              {/* Section toggle: Garment Samples / Materials */}
              <div style={{ display:"flex", alignItems:"center", gap:2, padding:3,
                background:"#EEF0F3", borderRadius:11, border:"1px solid #E5E7EB" }}>
                {[
                  { key:"samples",   label:"Garment Samples",
                    icon:<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg> },
                  { key:"materials", label:"Materials",
                    icon:<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
                ].map(s => {
                  const activeTab_ = activeTabSection === s.key;
                  return (
                    <button key={s.key} onClick={() => setTabSectionForActive(s.key)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
                        borderRadius:8, border: activeTab_ ? "1px solid #111827" : "1px solid transparent",
                        cursor:"pointer", fontFamily:"inherit",
                        fontSize:13, fontWeight: activeTab_ ? 700 : 500,
                        background: activeTab_ ? "#111827" : "transparent",
                        color:      activeTab_ ? "#fff"    : "#9CA3AF",
                        boxShadow:  activeTab_ ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                        transition:"all 0.12s" }}
                      onMouseEnter={e => { if (!activeTab_) e.currentTarget.style.color = "#374151"; }}
                      onMouseLeave={e => { if (!activeTab_) e.currentTarget.style.color = "#9CA3AF"; }}>
                      {s.icon} {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {/* ── MATERIALS inside product ── */}
            {activeTabSection === "materials" && (() => {
              const scopedMats = materials.filter(m =>
                activeProduct.materialIds.includes(m.id) &&
                m.materialName !== "__empty__" && m.versions.length > 0
              ).map(m => ({ ...m, latest: m.versions[m.versions.length-1] }));

              if (selectedMaterial && activeProduct.materialIds.includes(selectedMaterial.id)) {
                return (
                  <MaterialDetail
                    key={selectedMaterial.id}
                    material={selectedMaterial}
                    view={view}
                    onClose={() => setSelected(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    brandComment={brandComment}
                    setBrandComment={setBrandComment}
                    setMaterials={setMaterials}
                    onSubmitNewVersion={handleNewVersion}
                    showNewVersionFor={showNewVersionFor}
                    setShowNewVersionFor={setShowNewVersionFor}
                  />
                );
              }

              return (
                <div>
                  <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
                    <FilterBar />
                    {view === "factory" && (
                      <button onClick={() => setShowNew(true)}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px",
                          background:"#111827", color:"#fff", border:"none", borderRadius:7,
                          fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
                        {ICO.plus()} New Submission
                      </button>
                    )}
                  </div>
                  {scopedMats.length === 0 ? (
                    <div style={{ padding:"48px 24px", textAlign:"center", background:"#fff",
                      borderRadius:12, border:"1px solid #E8EAED" }}>
                      <div style={{ fontWeight:600, fontSize:14, color:"#374151", marginBottom:4 }}>No submissions yet</div>
                      {view === "factory" && <div style={{ color:"#9CA3AF", fontSize:13 }}>Use &quot;New Submission&quot; to add the first one</div>}
                      {view === "brand"   && <div style={{ color:"#9CA3AF", fontSize:13 }}>Waiting for the factory to submit</div>}
                    </div>
                  ) : (
                    <MatTable rows={scopedMats} />
                  )}
                </div>
              );
            })()}

            {/* ── GARMENT SAMPLES inside product ── */}
            {activeTabSection === "samples" && (() => {
              const productGs = gSamples.filter(s => s.productName === activeProduct.name);

              if (gSelectedSample && gSelectedSample.productName === activeProduct.name) {
                return (
                  <div style={{ maxWidth:900 }}>
                    <GsDetail
                      key={gSelectedSample.id}
                      sample={gSelectedSample}
                      view={view}
                      onBack={() => setGSelected(null)}
                      onDecide={handleGsDecide}
                      onSubmitVersion={handleGsNewVersion}
                    />
                  </div>
                );
              }

              return (
                <div>
                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <span style={{ fontSize:12, color:"#9CA3AF", fontWeight:500 }}>
                      {productGs.length} sample{productGs.length!==1?"s":""}
                    </span>
                    {view === "factory" && (
                      <button onClick={() => setShowNewGs(true)}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px",
                          background:"#111827", color:"#fff", border:"none", borderRadius:7,
                          fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        {ICO.plus()} Submit sample
                      </button>
                    )}
                  </div>

                  {gLoading ? (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48, gap:10, color:"#9CA3AF" }}>
                      <Spinner /><span style={{ fontSize:13 }}>Loading samples…</span>
                    </div>
                  ) : productGs.length === 0 ? (
                    <div style={{ padding:"48px 24px", textAlign:"center", background:"#fff",
                      borderRadius:12, border:"1px solid #E8EAED" }}>
                      <div style={{ fontWeight:600, fontSize:14, color:"#374151", marginBottom:4 }}>No samples yet</div>
                      <div style={{ color:"#9CA3AF", fontSize:13 }}>
                        {view==="factory" ? "Submit the first sample to get started" : "Nothing to review right now"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      {productGs
                        .filter(s => {
                          if (!gSearch.trim()) return true;
                          const q = gSearch.toLowerCase();
                          return s.productName.toLowerCase().includes(q) || (s.factory||"").toLowerCase().includes(q);
                        })
                        .map(s => {
                          const latest  = s.versions[s.versions.length-1];
                          const sc      = GS_STATUS_COLORS[s.status] || GS_STATUS_COLORS["Awaiting Review"];
                          const factoryLabel = view==="factory" && s.status==="New Sample Requested" ? "Requires Resubmission" : s.status;
                          const fsc     = view==="factory" && s.status==="New Sample Requested"
                            ? { bg:"#FFF3E0", text:"#B45309", dot:"#F97316" } : sc;
                          const btnLabel = view==="brand" ? (s.status==="Awaiting Review" ? "Review sample" : "Open") : (s.status==="New Sample Requested" ? "Resubmit" : "Open");
                          const btnDark  = (view==="brand" && s.status==="Awaiting Review") || (view==="factory" && s.status==="New Sample Requested");
                          const actionDate = latest?.brandDecision?.date || latest?.dateReceived;
                          const dAgo = relativeDate(actionDate);
                          const dateLabel = latest?.brandDecision ? (latest.brandDecision.type==="Approved" ? "Approved" : "Reviewed") : "Submitted";
                          const thumb = latest?.photos?.[0]?.url || latest?.photos?.[0]?.dataUrl || null;

                          return (
                            <div key={s.id} className="prow"
                              onClick={() => setGSelected(s.id)}
                              style={{ background:"#fff", border:"1px solid #E8EAED",
                                borderRadius:14, padding:"14px 18px",
                                display:"flex", alignItems:"center", gap:14,
                                boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                              <div style={{ width:52, height:52, borderRadius:10, flexShrink:0, overflow:"hidden",
                                background:"#F3F4F6", border:"1px solid #E8EAED",
                                display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {thumb ? <img src={thumb} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                                  : <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                                      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
                                    </svg>}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                                  <span style={{ fontSize:14, fontWeight:600, color:"#0F1117" }}>{s.productName}</span>
                                  <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                                    padding:"2px 8px", borderRadius:20, background:fsc.bg, color:fsc.text, fontSize:11, fontWeight:600 }}>
                                    <span style={{ width:5, height:5, borderRadius:"50%", background:fsc.dot }} />{factoryLabel}
                                  </span>
                                </div>
                                <div style={{ fontSize:12, color:"#8B909A", display:"flex", gap:5, flexWrap:"wrap" }}>
                                  <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:600, color:"#374151" }}>
                                    {s.versions.length} version{s.versions.length!==1?"s":""}
                                  </span>
                                  {s.factory && <><span style={{ color:"#E5E7EB" }}>·</span><span>{s.factory}</span></>}
                                  {dAgo && <><span style={{ color:"#E5E7EB" }}>·</span><span>{dateLabel} {dAgo}</span></>}
                                </div>
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                                <button onClick={e => { e.stopPropagation(); handleDeleteGarmentSample(s.id); }}
                                  style={{ width:30, height:30, borderRadius:7, border:"1px solid #F3F4F6",
                                    background:"transparent", cursor:"pointer", display:"flex",
                                    alignItems:"center", justifyContent:"center", color:"#D1D5DB", transition:"all 0.12s" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor="#FEE2E2"; e.currentTarget.style.color="#EF4444"; e.currentTarget.style.background="#FEF2F2"; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor="#F3F4F6"; e.currentTarget.style.color="#D1D5DB"; e.currentTarget.style.background="transparent"; }}>
                                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                </button>
                                <button onClick={() => setGSelected(s.id)}
                                  style={{ display:"flex", alignItems:"center", gap:5,
                                    padding:"7px 14px", border:"none", borderRadius:8,
                                    fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                                    background: btnDark ? "#0F1117" : "#F3F4F6",
                                    color:      btnDark ? "#fff"    : "#374151" }}>
                                  {btnLabel}
                                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          );
        })()}

        </div>{/* end main scrollable */}
        </ErrorBoundary>
      </div>{/* end body flex */}

      {showNew && (
        <NewSubmissionModal onClose={() => setShowNew(false)} onSubmit={addMaterial}
          existingStyles={allStyles}
          existingMaterials={activeProduct
            ? materials.filter(m => activeProduct.materialIds.includes(m.id) && m.materialName !== "__empty__")
            : materials.filter(m => m.materialName !== "__empty__")} />
      )}

      {showNewGs && (
        <GsNewSampleModal
          existingProductNames={products.map(p => p.name)}
          defaultProductName={activeProduct?.name || ""}
          onClose={() => setShowNewGs(false)}
          onSubmit={async data => { await handleGsSubmit(data); setShowNewGs(false); }}
        />
      )}




    </div>
  );
}



