// src/constants.js
export const CONSTANTS = {
  MATERIAL_TYPES: ["Lab Dip", "Trim", "Fabric Swatch"],
  COURIER_OPTIONS: ["DHL", "FedEx", "UPS", "Other"],
  SEASONS: ["SS25", "FW25", "SS26", "FW26"],
};

export const COLORS = {
  STATUS: {
    Pending: { bg: "#FFF8E6", text: "#92400E", dot: "#F59E0B" },
    Approved: { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
    Rejected: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
  },
  SHIP: {
    "At Factory": { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
    "In Transit": { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
    Delivered: { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  },
  GS_STATUS: {
    "Awaiting Review": { bg: "#FFF8E6", text: "#92400E", dot: "#F59E0B" },
    "Approved": { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
    "Approved with Comments": { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6" },
    "New Sample Requested": { bg: "#FFF3E0", text: "#B45309", dot: "#F97316" },
    "Requires Resubmission": { bg: "#FFF3E0", text: "#B45309", dot: "#F97316" },
    "Rejected": { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
  },
};

export const STYLES = {
  appContainer: {
    fontFamily: "'DM Sans', Helvetica Neue, sans-serif",
    background: "#F4F5F7",
    minHeight: "100vh",
    color: "#111827",
    display: "flex",
    flexDirection: "column",
  },
  bodyFlex: {
    display: "flex",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    overflowY: "auto",
    padding: "28px 28px 100px",
    minWidth: 0,
  },
  screenCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "'DM Sans', Helvetica Neue, sans-serif",
    background: "#F4F5F7",
  },
  input: {
    padding: "7px 10px",
    border: "1.5px solid #E5E7EB",
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "inherit",
    color: "#111827",
    background: "#fff",
    outline: "none",
  },
  button: {
    padding: "7px 14px",
    border: "none",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  primaryButton: {
    padding: "10px 24px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  },
  card: {
    padding: "14px 16px",
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #EFEFEF",
    marginBottom: 12,
  },
};