// Color tokens shared across badges, list rows, and detail views.
// NOTE: kept as plain hex here (not the CSS custom properties in ../styles/global.css)
// because these are used as inline styles, not className. If you want a single
// source of truth, these could be generated from the --status-* vars instead.

export const STATUS_COLORS = {
  Pending:  { bg: "#FFF8E6", text: "#92400E", dot: "#F59E0B" },
  Approved: { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  Rejected: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
};
export const SHIP_COLORS = {
  "At Factory": { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  "In Transit":  { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  Delivered:     { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
};

// Garment sample status colours (separate from material STATUS_COLORS)
export const GS_STATUS_COLORS = {
  "Awaiting Review":        { bg: "#FFF8E6", text: "#92400E",  dot: "#F59E0B" },
  "Approved":               { bg: "#ECFDF5", text: "#065F46",  dot: "#10B981" },
  "Approved with Comments": { bg: "#EFF6FF", text: "#1E40AF",  dot: "#3B82F6" },
  "New Sample Requested":   { bg: "#FFF3E0", text: "#B45309",  dot: "#F97316" },
  "Requires Resubmission":  { bg: "#FFF3E0", text: "#B45309",  dot: "#F97316" },
  "Rejected":               { bg: "#FEF2F2", text: "#991B1B",  dot: "#EF4444" },
};
