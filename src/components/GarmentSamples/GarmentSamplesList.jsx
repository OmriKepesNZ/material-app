// src/components/GarmentSamples/GarmentSamplesList.jsx
import React, { useState, useMemo } from "react";
import SearchBar from "../SearchBar";
import Badge from "../Badge";
import Spinner from "../Spinner";
import { formatDate } from "../../utils/dateUtils";

export default function GarmentSamplesList({ samples, gLoading, view, onSelectSample, onAddSample }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return samples.filter(s =>
      s.productName?.toLowerCase().includes(search.toLowerCase()) ||
      s.factory?.toLowerCase().includes(search.toLowerCase())
    );
  }, [samples, search]);

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Garment Samples</h2>
        {view === "factory" && (
          <button
            onClick={onAddSample}
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
            + New Sample
          </button>
        )}
      </div>

      <SearchBar search={search} setSearch={setSearch} placeholder="Search samples..." />

      {gLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
          <Spinner />
          <div style={{ fontSize: 12, marginTop: 8 }}>Loading samples...</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              No garment samples found
            </div>
          ) : (
            filtered.map(sample => {
              const latest = sample.versions?.[sample.versions.length - 1];
              return (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample.id)}
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
                        {sample.productName}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7280", display: "flex", gap: 12 }}>
                        <span>Factory: {sample.factory || "—"}</span>
                        <span>•</span>
                        <span>{sample.versions?.length || 0} version{sample.versions?.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      {latest && <Badge status={latest.status} type="garmentStatus" />}
                      {latest && (
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                          {formatDate(latest.dateReceived)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}