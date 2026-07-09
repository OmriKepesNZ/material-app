// src/components/Materials/MaterialDetail.jsx
import React, { useState } from "react";
import Badge from "../Badge";
import { formatDate } from "../../utils/dateUtils";
import { STYLES } from "../../constants";

const IconBack = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function MaterialDetail({ material, view, onClose, onApprove, onReject }) {
  const [brandComment, setBrandComment] = useState("");
  const latest = material?.versions?.[material.versions.length - 1];

  if (!material) return null;

  return (
    <div>
      <button
        onClick={onClose}
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
              {material.materialName}
            </h2>
            <div style={{ fontSize: 13, color: "#6B7280", display: "flex", gap: 16 }}>
              <div>
                <span style={{ color: "#9CA3AF" }}>Style:</span> {material.styleName}
              </div>
              <div>
                <span style={{ color: "#9CA3AF" }}>Type:</span> {material.materialType}
              </div>
            </div>
          </div>
          {latest && <Badge status={latest.status} />}
        </div>

        {/* Image */}
        {latest?.image && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Photo
            </div>
            <img
              src={latest.image}
              alt={material.materialName}
              style={{
                maxWidth: "100%",
                height: "auto",
                maxHeight: 300,
                borderRadius: 8,
                border: "1px solid #EFEFEF",
              }}
            />
          </div>
        )}

        {/* Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Version
            </div>
            <div style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>v{latest?.version || 1}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Submission Date
            </div>
            <div style={{ fontSize: 13, color: "#111827" }}>{formatDate(latest?.submissionDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Factory
            </div>
            <div style={{ fontSize: 13, color: "#111827" }}>{material.factoryName || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Courier
            </div>
            <div style={{ fontSize: 13, color: "#111827" }}>{latest?.courier || "—"}</div>
          </div>
        </div>

        {/* Notes */}
        {latest?.factoryNotes && (
          <div style={{ marginBottom: 20, padding: 12, background: "#FAFAFA", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Factory Notes
            </div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {latest.factoryNotes}
            </div>
          </div>
        )}

        {/* Brand Review Section */}
        {view === "brand" && (
          <div style={{ borderTop: "1px solid #EFEFEF", paddingTop: 20 }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 600, color: "#111827" }}>Brand Review</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
                Comment (optional)
              </label>
              <textarea
                value={brandComment}
                onChange={(e) => setBrandComment(e.target.value)}
                placeholder="Enter your feedback..."
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1.5px solid #E5E7EB",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "inherit",
                  color: "#111827",
                  minHeight: 80,
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => onApprove(brandComment)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: "#10B981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#059669")}
                onMouseLeave={(e) => (e.target.style.background = "#10B981")}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => onReject(brandComment)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: "#EF4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#DC2626")}
                onMouseLeave={(e) => (e.target.style.background = "#EF4444")}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}