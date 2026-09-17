import MaterialDetail from "../materials/MaterialDetail";
import GsDetail from "../samples/GsDetail";

export default function ProductWorkspace({
  activeProduct,
  activeTabSection,
  selectedMaterial,
  materials,
  view,
  setSelected,
  setActiveTab,
  brandComment,
  setBrandComment,
  setMaterials,
  filters,
  showNewVersionFor,
  setShowNewVersionFor,
  handleApprove,
  handleReject,
  handleNewVersion,
  setShowNew,
  gSamples,
  gSelectedSample,
  setGSelected,
  handleGsDecide,
  handleGsNewVersion,
  setShowNewGs,
  handleDeleteGarmentSample,
  search,
  setSearch,
  gSearch,
  gLoading,
  Spinner,
  FilterBar,
  MaterialTable,
  products,
  onSelectMaterial,
  ICO,
  setTabSectionForActive,
}) {
  if (!activeProduct) return null;

  const materialDetailOpen = activeTabSection === "materials" && selectedMaterial && activeProduct.materialIds.includes(selectedMaterial.id);
  const sampleDetailOpen = activeTabSection === "samples" && gSelectedSample && gSelectedSample.productName === activeProduct.name;
  const detailOpen = materialDetailOpen || sampleDetailOpen;

  return (
    <div style={{ maxWidth: 900 }}>
      {!detailOpen && (
        <div className="product-header-wrap">
          <div className="product-breadcrumb">
            <button className="back-link" onClick={() => { setActiveTab(null); setSelected(null); setGSelected(null); }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              All products
            </button>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="product-breadcrumb-current">{activeProduct.name}</span>
          </div>

          <div className="section-switcher">
            {[
              {
                key: "samples",
                label: "Garment Samples",
                icon: (
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
                  </svg>
                )
              },
              {
                key: "materials",
                label: "Materials",
                icon: (
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                )
              },
            ].map((s) => {
              const activeTab_ = activeTabSection === s.key;
              return (
                <button key={s.key} className={activeTab_ ? "section-switch-btn active" : "section-switch-btn"} onClick={() => setTabSectionForActive(s.key)}>
                  {s.icon} {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTabSection === "materials" && (() => {
        const scopedMats = materials.filter(
          (m) => activeProduct.materialIds.includes(m.id) && m.materialName !== "__empty__" && m.versions.length > 0
        ).map((m) => ({ ...m, latest: m.versions[m.versions.length - 1] }));

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
            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
              <FilterBar />
              {view === "factory" && (
                <button onClick={() => setShowNew(true)} className="primary-inline-button" style={{ flexShrink: 0 }}>
                  {ICO.plus()} New Submission
                </button>
              )}
            </div>
            {scopedMats.length === 0 ? (
              <div className="empty-state" style={{ padding: "48px 24px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#374151", marginBottom: 4 }}>No submissions yet</div>
                {view === "factory" && <div style={{ color: "#9CA3AF", fontSize: 13 }}>Use &quot;New Submission&quot; to add the first one</div>}
                {view === "brand" && <div style={{ color: "#9CA3AF", fontSize: 13 }}>Waiting for the factory to submit</div>}
              </div>
            ) : <MaterialTable
              rows={scopedMats}
              filters={filters}
              products={products}
              view={view}
              onSelect={onSelectMaterial}
              onClearSearch={() => {}}
            />}
          </div>
        );
      })()}

      {activeTabSection === "samples" && (() => {
        const productGs = gSamples.filter((s) => s.productName === activeProduct.name);

        if (gSelectedSample && gSelectedSample.productName === activeProduct.name) {
          return (
            <div style={{ maxWidth: 900 }}>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
                {productGs.length} sample{productGs.length !== 1 ? "s" : ""}
              </span>
              {view === "factory" && (
                <button className="primary-inline-button" onClick={() => setShowNewGs(true)}>
                  {ICO.plus()} Submit sample
                </button>
              )}
            </div>

            {gLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 10, color: "#9CA3AF" }}>
                <Spinner />
                <span style={{ fontSize: 13 }}>Loading samples…</span>
              </div>
            ) : productGs.length === 0 ? (
              <div className="empty-state" style={{ padding: "48px 24px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#374151", marginBottom: 4 }}>No samples yet</div>
                <div style={{ color: "#9CA3AF", fontSize: 13 }}>
                  {view === "factory" ? "Submit the first sample to get started" : "Nothing to review right now"}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {productGs
                  .filter((s) => {
                    if (!gSearch.trim()) return true;
                    const q = gSearch.toLowerCase();
                    return s.productName.toLowerCase().includes(q) || (s.factory || "").toLowerCase().includes(q);
                  })
                  .map((s) => {
                    const latest = s.versions[s.versions.length - 1];
                    const sc = { bg: "#E5E7EB", text: "#374151", dot: "#6B7280" };
                    const factoryLabel = view === "factory" && s.status === "New Sample Requested" ? "Requires Resubmission" : s.status;
                    const btnLabel = view === "brand" ? (s.status === "Awaiting Review" ? "Review sample" : "Open") : (s.status === "New Sample Requested" ? "Resubmit" : "Open");
                    const btnDark = (view === "brand" && s.status === "Awaiting Review") || (view === "factory" && s.status === "New Sample Requested");
                    const thumb = latest?.photos?.[0]?.url || latest?.photos?.[0]?.dataUrl || null;

                    return (
                      <div key={s.id} className="product-card" onClick={() => setGSelected(s.id)}>
                        <div className="product-card-thumb">
                          {thumb ? <img src={thumb} alt="" /> : <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" /></svg>}
                        </div>
                        <div className="product-card-info">
                          <div className="product-card-header">
                            <span className="product-card-name">{s.productName}</span>
                            <span className="status-pill" style={{ background: sc.bg, color: sc.text }}>
                              <span className="status-pill-dot" style={{ background: sc.dot }} />
                              {factoryLabel}
                            </span>
                          </div>
                          <div className="product-card-meta">
                            <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: "#374151" }}>
                              {s.versions.length} version{s.versions.length !== 1 ? "s" : ""}
                            </span>
                            {s.factory && <><span className="meta-separator">·</span><span>{s.factory}</span></>}
                          </div>
                        </div>
                        <div className="product-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="icon-action danger-action" onClick={(e) => { e.stopPropagation(); handleDeleteGarmentSample(s.id); }}>
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                          </button>
                          <button className="primary-inline-button" style={{ background: btnDark ? "#0F1117" : "#F3F4F6", color: btnDark ? "#fff" : "#374151" }} onClick={() => setGSelected(s.id)}>
                            {btnLabel}
                            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
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
}
