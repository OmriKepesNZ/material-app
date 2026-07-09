// src/components/GarmentSamples/GsDetail.jsx
import React from "react";
import Badge from "../Badge";
import { formatDate } from "../../utils/dateUtils";

const IconBack = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function GsDetail({ sample, view, onBack }) {
  if (!sample) return null;

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#6B7280",
          fontSize: 13,
          fontFamily: "inherit",
          marginBottom: 16,
          padding: 0,
        }}
      >
        <IconBack /> Back
      </button>

      <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #EFEFEF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              {sample.productName}
            </h2>
            <div style={{ fontSize: 13, color: "#6B7280" }}>
              Factory: {sample.factory || "—"} • {sample.versions?.length || 0} version{sample.versions?.length !== 1 ? "s" : ""}
            </div>
          </div>
          <Badge status={sample.status} type="garmentStatus" />
        </div>

        {/* Versions */}
        <div style={{ borderTop: "1px solid #EFEFEF", paddingTop: 20 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 600, color: "#111827" }}>Versions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sample.versions?.map((v, i) => (
              <div key={i} style={{ padding: 12, background: "#FAFAFA", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                      Version {v.versionNum || i + 1}
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                      {formatDate(v.dateReceived)}
                    </div>
                  </div>
                  <Badge status={v.status} type="garmentStatus" />
                </div>
                {v.factoryNotes && (
                  <div style={{ fontSize: 11, color: "#374151", marginTop: 8, whiteSpace: "pre-wrap" }}>
                    {v.factoryNotes}
                  </div>
                )}
                {v.photos?.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginTop: 8 }}>
                    {v.photos.map((ph, pi) => (
                      <img
                        key={pi}
                        src={ph.url}
                        alt={`v${v.versionNum}-${pi}`}
                        style={{
                          width: "100%",
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #E5E7EB",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}