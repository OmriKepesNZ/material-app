// src/components/Navigation/Sidebar.jsx
import React, { useMemo } from "react";
import Badge from "../Badge";
import Spinner from "../Spinner";

const IconPlus = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconClose = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function Sidebar({
  openTabs,
  activeTab,
  products,
  materials,
  gSamples,
  gLoading,
  view,
  onSelectTab,
  onCloseTab,
  onAddProduct,
}) {
  const pendingCount = useMemo(() => {
    return materials.filter(m => m.versions?.some(v => v.status === "Pending")).length;
  }, [materials]);

  const gsPendingCount = useMemo(() => {
    return gSamples.filter(s => s.versions?.some(v => v.status === "Awaiting Review")).length;
  }, [gSamples]);

  return (
    <div
      style={{
        width: 280,
        background: "#fff",
        borderRight: "1px solid #EFEFEF",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 14px", borderBottom: "1px solid #EFEFEF", flexShrink: 0 }}>
        <button
          onClick={onAddProduct}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 14px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "inherit",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#1F2937")}
          onMouseLeave={(e) => (e.target.style.background = "#111827")}
        >
          <IconPlus /> New Product
        </button>
      </div>

      {/* Tabs List */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {openTabs.length === 0 ? (
          <div style={{ padding: "20px 14px", textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>
            Open a product to start
          </div>
        ) : (
          openTabs.map((tabId) => {
            const prod = products.find(p => p.id === tabId);
            const prodMaterials = materials.filter(m => prod?.materialIds?.includes(m.id));
            const pending = prodMaterials.filter(m => m.versions?.some(v => v.status === "Pending")).length;

            return (
              <button
                key={tabId}
                onClick={() => onSelectTab(tabId)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: activeTab === tabId ? "#F3F4F6" : "transparent",
                  border: "none",
                  borderLeft: activeTab === tabId ? "3px solid #111827" : "3px solid transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  color: "#111827",
                  transition: "all 0.15s",
                  textAlign: "left",
                }}
              >
                <div style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {prod?.name || tabId}
                </div>
                {pending > 0 && (
                  <Badge status="Pending" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tabId);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    color: "#9CA3AF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 6,
                    flexShrink: 0,
                  }}
                >
                  <IconClose />
                </button>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid #EFEFEF",
          fontSize: 12,
          color: "#6B7280",
          flexShrink: 0,
          display: "flex",
          gap: 12,
        }}
      >
        <div>
          Materials: <strong>{materials.filter(m => m.materialName !== "__empty__").length}</strong>
        </div>
        {view === "brand" && (
          <div>
            Samples: {gLoading ? <Spinner /> : <strong>{gSamples.length}</strong>}
          </div>
        )}
      </div>
    </div>
  );
}