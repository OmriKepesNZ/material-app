// src/components/Products/ProductsList.jsx
import React, { useState, useMemo } from "react";
import SearchBar from "../SearchBar";
import Badge from "../Badge";

const IconDelete = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
  </svg>
);

export default function ProductsList({ products, materials, gSamples, view, search, onSearch, onOpenProduct, onDeleteProduct, onAddProduct }) {
  const filtered = useMemo(() => {
    return products.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111827" }}>
          {view === "factory" ? "Factory" : "Brand"} Dashboard
        </h1>
        <button
          onClick={onAddProduct}
          style={{
            padding: "10px 18px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          + New Product
        </button>
      </div>

      <SearchBar search={search} setSearch={onSearch} placeholder="Search products..." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
            No products found
          </div>
        ) : (
          filtered.map(product => {
            const prodMaterials = materials.filter(m => product.materialIds?.includes(m.id) && m.materialName !== "__empty__");
            const prodSamples = gSamples.filter(s => s.productName === product.name);
            const pendingMaterials = prodMaterials.filter(m => m.versions?.some(v => v.status === "Pending"));
            const pendingSamples = prodSamples.filter(s => s.versions?.some(v => v.status === "Awaiting Review"));

            return (
              <div
                key={product.id}
                style={{
                  padding: 16,
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #EFEFEF",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FAFAFA";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#EFEFEF";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <h3
                    style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827", flex: 1 }}
                    onClick={() => onOpenProduct(product.id)}
                  >
                    {product.name}
                  </h3>
                  <button
                    onClick={() => onDeleteProduct(product.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: "#9CA3AF",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Delete product"
                  >
                    <IconDelete />
                  </button>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: 12, color: "#6B7280" }}>
                  <div>
                    <span style={{ color: "#9CA3AF" }}>Materials:</span> {prodMaterials.length}
                  </div>
                  {view === "brand" && (
                    <div>
                      <span style={{ color: "#9CA3AF" }}>Samples:</span> {prodSamples.length}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {pendingMaterials.length > 0 && (
                    <Badge status={`${pendingMaterials.length} Material Pending`} />
                  )}
                  {pendingSamples.length > 0 && (
                    <Badge status={`${pendingSamples.length} Sample Pending`} type="garmentStatus" />
                  )}
                </div>

                <button
                  onClick={() => onOpenProduct(product.id)}
                  style={{
                    marginTop: 12,
                    padding: "8px 12px",
                    background: "#F3F4F6",
                    border: "1px solid #E5E7EB",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#111827",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#E5E7EB";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#F3F4F6";
                  }}
                >
                  View Details →
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}