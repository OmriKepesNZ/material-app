export default function Sidebar({
  openTabs,
  products,
  materials,
  gSamples,
  view,
  activeTab,
  setActiveTab,
  setSelected,
  setGSelected,
  setShowNew,
  setAddingProduct,
  setNav,
  setBNav,
  closeTab,
}) {
  return (
    <div className="sidebar" style={{ width: 220 }}>
      <div className={openTabs.length > 0 ? "sidebar-header sidebar-header-active" : "sidebar-header"}>
        <button
          className={activeTab ? "navitem" : "navitem navitem-active"}
          onClick={() => {
            setActiveTab(null);
            setSelected(null);
            setGSelected(null);
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={!activeTab ? "#111827" : "#9CA3AF"} strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className={activeTab ? "nav-label nav-label-muted" : "nav-label nav-label-active"}>All Products</span>
        </button>

        {view === "factory" && (
          <button
            className="sidebar-action"
            onClick={() => {
              if (activeTab) setShowNew(true);
              else setAddingProduct(true);
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {activeTab ? "New Submission" : "Add Product"}
          </button>
        )}
      </div>

      {openTabs.length > 0 && (
        <div className="open-tabs-wrap">
          <div className="open-tabs-label">Open</div>
          {openTabs.map((tabId) => {
            const p = products.find((x) => x.id === tabId);
            if (!p) return null;
            const isActive = tabId === activeTab;
            const mats = p.materialIds.map((id) => materials.find((m) => m.id === id)).filter(Boolean);
            const real = mats.filter((m) => m.materialName !== "__empty__" && m.versions.length > 0);
            const pendingMat = real.filter((m) => m.versions[m.versions.length - 1].status === (view === "brand" ? "Pending" : "Rejected")).length;
            const pendingGs = gSamples.filter(
              (s) => s.productName === p.name && s.status === (view === "brand" ? "Awaiting Review" : "New Sample Requested")
            ).length;
            const totalPending = pendingMat + pendingGs;
            const thumb = real.find((m) => m.versions[m.versions.length - 1].image)?.versions.slice(-1)[0].image || null;

            return (
              <div
                key={tabId}
                className={isActive ? "tab-item tab-item-active" : "tab-item"}
                onClick={() => {
                  setActiveTab(tabId);
                  setSelected(null);
                  setGSelected(null);
                }}
              >
                <div className="tab-item-main">
                  <div className="tab-thumb">
                    {thumb ? (
                      <img src={thumb} alt="" />
                    ) : (
                      <div className="tab-thumb-placeholder">
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" />
                          <path d="M16 3H8l-2 4h12l-2-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className={isActive ? "tab-name tab-name-active" : "tab-name"}>{p.name}</span>
                </div>
                <div className="tab-item-actions">
                  {totalPending > 0 && <span className="tab-badge">{totalPending}</span>}
                  <button className="close-tab" onClick={(e) => closeTab(tabId, e)}>
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
