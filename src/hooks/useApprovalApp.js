import { useEffect, useMemo, useState } from "react";
import {
  createGarmentSample,
  createRecord,
  createSampleVersion,
  deleteGarmentSample,
  deleteProduct,
  loadAllData,
  loadGarmentSamples,
  reviewSampleVersion,
  updateRecord,
  uploadFile,
  uploadImage,
} from "../lib/airtable";

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function uploadCommentPhotos(rows, sectionLabel) {
  return Promise.all((rows || []).map(async row => ({
    ...row,
    photos: await Promise.all((row.photos || []).map(async photo => {
      if (!photo.dataUrl) return { name: photo.name, url: photo.url };
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          return { name: photo.name, url: await uploadImage(photo.dataUrl, photo.name) };
        } catch (error) {
          if (attempt === 2) {
            throw new Error(`Failed to upload photo "${photo.name}" in ${sectionLabel} comments - ${error.message || error}`);
          }
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      return { name: photo.name, url: photo.url };
    })),
  })));
}

export default function useApprovalApp() {
  const [view, setView] = useState("factory");
  const [materials, setMaterials] = useState([]);
  const [gSamples, setGSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [gLoading, setGLoading] = useState(false);
  const [gError, setGError] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [tabSection, setTabSection] = useState({});
  const [selected, setSelected] = useState(null);
  const [gSelected, setGSelected] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNewGs, setShowNewGs] = useState(false);
  const [filters, setFilters] = useState({ type: "", status: "" });
  const [brandComment, setBrandComment] = useState("");
  const [showNewVersionFor, setShowNewVersionFor] = useState(null);
  const [search, setSearch] = useState("");
  const [gSearch, setGSearch] = useState("");

  useEffect(() => {
    loadAllData()
      .then(data => { setMaterials(data); setLoading(false); })
      .catch(error => { console.error("Airtable load error:", error); setLoadError(error.message); setLoading(false); });
  }, []);

  useEffect(() => {
    if (gSamples.length || gLoading) return;
    setGLoading(true);
    loadGarmentSamples()
      .then(data => { setGSamples(data); setGLoading(false); })
      .catch(error => { console.error("Garment samples load error:", error); setGError(error.message); setGLoading(false); });
  }, [gSamples.length, gLoading]);

  const products = useMemo(() => {
    const byName = {};
    materials.forEach(material => {
      const name = material.styleName || "Unknown";
      byName[name] ||= { id: name, name, airtableProductId: material.airtableProductId || null, materialIds: [] };
      byName[name].airtableProductId ||= material.airtableProductId || null;
      byName[name].materialIds.push(material.id);
    });
    return Object.values(byName);
  }, [materials]);

  const activeProduct = products.find(product => product.id === activeTab) || null;
  const selectedMaterial = materials.find(material => material.id === selected) || null;
  const gSelectedSample = gSamples.find(sample => sample.id === gSelected) || null;
  const activeTabSection = activeTab ? tabSection[activeTab] || "samples" : "samples";
  const allStyles = [...new Set(materials.filter(m => m.materialName !== "__empty__").map(m => m.styleName).filter(Boolean))];
  const allMaterials = materials
    .filter(material => material.materialName !== "__empty__" && material.versions.length)
    .map(material => ({ ...material, latest: material.versions[material.versions.length - 1] }));
  const searchResults = search.trim().length > 1
    ? allMaterials.filter(material => {
        const query = search.toLowerCase();
        return [material.materialName, material.materialType, material.styleName, material.factoryName, material.season, material.latest?.status]
          .some(value => value?.toLowerCase().includes(query));
      })
    : null;

  function openTab(productId) {
    setOpenTabs(tabs => tabs.includes(productId) ? tabs : [...tabs, productId]);
    setActiveTab(productId);
    setSelected(null);
    setGSelected(null);
  }

  function closeTab(productId, event) {
    event.stopPropagation();
    setOpenTabs(tabs => {
      const next = tabs.filter(id => id !== productId);
      if (activeTab === productId) setActiveTab(next[next.length - 1] || null);
      return next;
    });
    if (activeTab === productId) { setSelected(null); setGSelected(null); }
  }

  function setTabSectionForActive(section) {
    if (activeTab) setTabSection(current => ({ ...current, [activeTab]: section }));
  }

  async function addProduct(name) {
    setAddingProduct(false);
    try {
      const created = await createRecord("Products", { "Product Name": name });
      setMaterials(current => [...current, {
        id: `sentinel__${created.id}`, airtableId: null, airtableProductId: created.id,
        styleName: name, brand: "", season: "", factoryName: "", materialType: "",
        materialName: "__empty__", versions: [],
      }]);
    } catch (error) { console.error("Failed to create product:", error); }
  }

  async function addMaterial(data) {
    const product = activeProduct;
    const productName = product?.name || "Unknown";
    try {
      const materialFields = { "Material Name": data.materialName, Type: data.materialType, Supplier: data.factoryName || "" };
      if (product?.airtableProductId) materialFields.Product = [product.airtableProductId];
      const material = await createRecord("Materials", materialFields);
      const submission = await createRecord("Submissions", {
        Material: [material.id], Version: data.detectedVersion || 1, "Submission Date": today(),
        Status: "Pending", "Shipment Status": data.shipmentStatus || "At Factory",
        ...(data.factoryNotes && { "Factory Notes": data.factoryNotes }),
        ...(data.extractedSpecs && { "Extracted Specs": data.extractedSpecs }),
        ...(data.courier && { Courier: data.courier }),
        ...(data.trackingNumber && { "Tracking Number": data.trackingNumber }),
      });
      const version = {
        airtableId: submission.id, version: data.detectedVersion || 1, submissionDate: today(),
        image: data.image || null, factoryNotes: data.factoryNotes || "", extractedSpecs: data.extractedSpecs || "",
        status: "Pending", brandComment: "", approvalDate: null, courier: data.courier || "",
        trackingNumber: data.trackingNumber || "", shipmentStatus: data.shipmentStatus || "At Factory",
      };
      setMaterials(current => [...current.filter(item => item.materialName !== "__empty__" || item.styleName !== productName), {
        id: material.id, airtableId: material.id, airtableProductId: product?.airtableProductId || null,
        styleName: productName, brand: product?.brand || "", season: data.season || "", factoryName: data.factoryName || "",
        materialType: data.materialType, materialName: data.materialName, versions: [version],
      }]);
      if (data.image?.startsWith("data:")) {
        uploadImage(data.image, `${productName}_${data.materialName}_v${version.version}.jpg`).then(photoUrl => {
          updateRecord("Submissions", submission.id, { Photo: [{ url: photoUrl }] }).catch(error => console.warn("Photo patch failed:", error));
          setMaterials(current => current.map(item => item.id !== material.id ? item : { ...item, versions: item.versions.map(itemVersion => itemVersion.airtableId === submission.id ? { ...itemVersion, image: photoUrl } : itemVersion) }));
        }).catch(error => console.warn("Image upload failed:", error));
      }
    } catch (error) { console.error("Failed to create submission:", error); alert("Could not save submission. Check console for details."); }
  }

  async function updateMaterialStatus(status) {
    const material = materials.find(item => item.id === selected);
    const latest = material?.versions.at(-1);
    if (!latest) return;
    if (latest.airtableId) await updateRecord("Submissions", latest.airtableId, { Status: status, "Brand Comment": brandComment, "Approval Date": today() });
    setMaterials(current => current.map(item => item.id !== selected ? item : { ...item, versions: item.versions.map((version, index) => index === item.versions.length - 1 ? { ...version, status, brandComment, approvalDate: today() } : version) }));
    setBrandComment("");
  }

  async function handleNewVersion(materialId, data) {
    const material = materials.find(item => item.id === materialId);
    const version = material ? material.versions.length + 1 : 1;
    let airtableId = null;
    if (material?.airtableId) {
      const created = await createRecord("Submissions", { Material: [material.airtableId], Version: version, "Submission Date": today(), "Factory Notes": data.factoryNotes, Status: "Pending", Courier: data.courier, "Tracking Number": data.trackingNumber, "Shipment Status": data.trackingNumber ? "In Transit" : "At Factory" });
      airtableId = created.id;
      if (data.image?.startsWith("data:")) uploadImage(data.image, `${material.materialName}_v${version}.jpg`).then(photoUrl => updateRecord("Submissions", airtableId, { Photo: [{ url: photoUrl }] }).then(() => setMaterials(current => current.map(item => item.id !== materialId ? item : { ...item, versions: item.versions.map(itemVersion => itemVersion.airtableId === airtableId ? { ...itemVersion, image: photoUrl } : itemVersion) })))).catch(error => console.warn("Image upload failed:", error));
    }
    setMaterials(current => current.map(item => item.id !== materialId ? item : { ...item, versions: [...item.versions, { airtableId, version, submissionDate: today(), image: data.image || null, factoryNotes: data.factoryNotes, status: "Pending", brandComment: "", approvalDate: null, courier: data.courier, trackingNumber: data.trackingNumber, shipmentStatus: data.trackingNumber ? "In Transit" : "At Factory" }] }));
    setShowNewVersionFor(null);
  }

  async function handleGsSubmit(data) {
    const existing = gSamples.find(sample => sample.productName.toLowerCase() === data.productName.trim().toLowerCase());
    try {
      const photoUrls = await Promise.all((data.photos || []).filter(photo => photo.dataUrl).map(photo => uploadImage(photo.dataUrl, photo.name).catch(() => null))).then(urls => urls.filter(Boolean));
      const fileUrls = await Promise.all((data.additionalFiles || []).filter(file => file.dataUrl).map(file => uploadFile(file.dataUrl, file.name).catch(() => null))).then(urls => urls.filter(Boolean));
      const versionNumber = (existing?.versions.length || 0) + 1;
      const payload = { garmentSampleId: existing?.id, versionNum: versionNumber, productName: data.productName.trim(), factory: data.factory || "", factoryNotes: data.notes, dateSent: data.dateSent, photoUrls, additionalFileUrls: fileUrls };
      const result = existing ? await createSampleVersion(payload) : await createGarmentSample(payload);
      const version = { airtableId: result.versionId, versionNum: versionNumber, dateReceived: data.dateSent, status: "Awaiting Review", factoryNotes: data.notes, photos: photoUrls.map((url, index) => ({ url, name: data.photos[index]?.name || "" })), additionalFiles: fileUrls.map((url, index) => ({ url, name: data.additionalFiles[index]?.name || "" })), brandDecision: null };
      setGSamples(current => existing ? current.map(sample => sample.id === existing.id ? { ...sample, status: "Awaiting Review", versions: [...sample.versions, version] } : sample) : [{ id: result.sampleId, airtableId: result.sampleId, productName: data.productName.trim(), factory: data.factory || "", status: "Awaiting Review", versions: [version] }, ...current]);
    } catch (error) { console.error("Failed to create garment sample:", error); alert("Could not save sample. Check console for details."); }
  }

  async function handleGsDecide(sampleId, versionIndex, reviewData) {
    const sample = gSamples.find(item => item.id === sampleId);
    const version = sample?.versions[versionIndex];
    if (!version) return;
    try {
      let measurementFileUrl = null;
      if (reviewData.measFile) {
        const dataUrl = await new Promise(resolve => { const reader = new FileReader(); reader.onload = event => resolve(event.target.result); reader.readAsDataURL(reviewData.measFile); });
        measurementFileUrl = await uploadFile(dataUrl, reviewData.measFile.name);
      }
      const fitComments = await uploadCommentPhotos(reviewData.fitComments, "Fit & Function");
      const mfgComments = await uploadCommentPhotos(reviewData.mfgComments, "Manufacturing");
      const obsComments = await uploadCommentPhotos(reviewData.obsComments, "Observations");
      if (version.airtableId) await reviewSampleVersion({ versionId: version.airtableId, garmentSampleId: sampleId, status: reviewData.status, reviewedBy: "Brand", reviewDate: today(), summary: reviewData.summary, nextSteps: reviewData.nextSteps, fitComments, mfgComments, obsComments, measurementFileUrl });
      const decision = { type: reviewData.status, by: "Brand", date: today(), summary: reviewData.summary, nextSteps: reviewData.nextSteps, fitComments, mfgComments, obsComments, measFile: reviewData.measFile ? { name: reviewData.measFile.name, url: measurementFileUrl } : null };
      setGSamples(current => current.map(item => item.id !== sampleId ? item : { ...item, status: reviewData.status, versions: item.versions.map((itemVersion, index) => index === versionIndex ? { ...itemVersion, status: reviewData.status, brandDecision: decision } : itemVersion) }));
    } catch (error) { console.error("Failed to submit review:", error); alert(`Could not save review.\n\nError: ${error?.message || error}`); throw error; }
  }

  async function handleGsNewVersion(data) {
    const sample = gSamples.find(item => item.id === data.garmentSampleId);
    if (!sample) return;
    try {
      const photoUrls = await Promise.all((data.photos || []).filter(photo => photo.dataUrl).map(photo => uploadImage(photo.dataUrl, photo.name).catch(() => null))).then(urls => urls.filter(Boolean));
      const fileUrls = await Promise.all((data.additionalFiles || []).filter(file => file.dataUrl).map(file => uploadFile(file.dataUrl, file.name).catch(() => null))).then(urls => urls.filter(Boolean));
      const result = sample.id.startsWith("local_") ? {} : await createSampleVersion({ garmentSampleId: sample.id, versionNum: data.versionNum, factoryNotes: data.factoryNotes, dateSent: data.dateSent, photoUrls, additionalFileUrls: fileUrls });
      const version = { airtableId: result.versionId || `local_${Date.now()}`, versionNum: data.versionNum, dateReceived: data.dateSent, status: "Awaiting Review", factoryNotes: data.factoryNotes, photos: photoUrls.map((url, index) => ({ url, name: data.photos[index]?.name || "" })), additionalFiles: fileUrls.map((url, index) => ({ url, name: data.additionalFiles[index]?.name || "" })), brandDecision: null };
      setGSamples(current => current.map(item => item.id === sample.id ? { ...item, status: "Awaiting Review", versions: [...item.versions, version] } : item));
    } catch (error) { console.error("Failed to submit new version:", error); alert("Could not save new version. Check console for details."); }
  }

  async function handleDeleteGarmentSample(sampleId) {
    const sample = gSamples.find(item => item.id === sampleId);
    if (!sample || !window.confirm(`Delete "${sample.productName}"?\n\nThis cannot be undone.`)) return;
    try {
      if (sample.airtableId && !sample.airtableId.startsWith("local_")) await deleteGarmentSample(sample.airtableId);
      setGSamples(current => current.filter(item => item.id !== sampleId));
      if (gSelected === sampleId) setGSelected(null);
    } catch (error) { console.error("Delete failed:", error); alert(`Could not delete - please try again.\n\n${error.message}`); }
  }

  async function handleDeleteProduct(productId) {
    const product = products.find(item => item.id === productId);
    if (!product || !window.confirm(`Delete "${product.name}"?\n\nThis cannot be undone.`)) return;
    try {
      if (product.airtableProductId) await deleteProduct(product.airtableProductId);
      setMaterials(current => current.filter(item => !product.materialIds.includes(item.id)));
      if (activeTab === productId) setActiveTab(null);
    } catch (error) { console.error("Delete failed:", error); alert(`Could not delete - please try again.\n\n${error.message}`); }
  }

  async function retryLoad() {
    setLoadError(null); setLoading(true);
    try { setMaterials(await loadAllData()); setLoading(false); } catch (error) { setLoadError(error.message); setLoading(false); }
  }

  return {
    view, setView, materials, setMaterials, gSamples, loading, loadError, retryLoad, gLoading, gError,
    openTabs, activeTab, setActiveTab, selected, setSelected, gSelected, setGSelected, activeProduct,
    selectedMaterial, gSelectedSample, activeTabSection, setTabSectionForActive, closeTab, openTab,
    addingProduct, setAddingProduct, showNew, setShowNew, showNewGs, setShowNewGs, filters, setFilters,
    brandComment, setBrandComment, showNewVersionFor, setShowNewVersionFor, search, setSearch, gSearch, setGSearch,
    products, allStyles, searchResults, addProduct, addMaterial, handleApprove: () => updateMaterialStatus("Approved"),
    handleReject: () => updateMaterialStatus("Rejected"), handleNewVersion, handleGsSubmit, handleGsDecide,
    handleGsNewVersion, handleDeleteGarmentSample, handleDeleteProduct,
  };
}
