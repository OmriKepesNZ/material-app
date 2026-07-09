// src/components/Materials/MaterialsList.jsx
import React, { useState, useMemo } from "react";
import SearchBar from "../SearchBar";
import Badge from "../Badge";
import { formatDate } from "../../utils/dateUtils";

export default function MaterialsList({ materials, view, onSelectMaterial, onAddSubmission }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return materials.filter(m =>
      m.materialName !== "__empty__" &&
      (m.materialName?.toLowerCase().includes(search.toLowerCase()) ||
        m.styleName?.toLowerCase().includes(search.toLowerCase()) ||
        m.materialType?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [materials, search]);

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Materials</h2>
        {view === "factory" && (
          <button
            onClick={onAddSubmission}
            style={{
              padding: "8px 14px",
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
            + Add Submission
          </button>
        )}
      </div>

      <SearchBar search={search} setSearch={setSearch} placeholder="Search materials..." />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
            No materials found
          </div>
        ) : (
          filtered.map(material => {
            const latest = material.versions?.[material.versions.length - 1];
            return (
              <button
                key={material.id}
                onClick={() => onSelectMaterial(material.id)}
                style={{
                  padding: "14px 16px",
                  background: "#fff",
                  border: "1px solid #EFEFEF",
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FAFAFA";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#EFEFEF";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
                      {material.materialName}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>{material.styleName}</span>
                      <span>•</span>
                      <span>{material.materialType}</span>
                      <span>•</span>
                      <span>{material.factoryName}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    {latest && <Badge status={latest.status} />}
                    {latest && (
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                        v{latest.version || material.versions.length}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}