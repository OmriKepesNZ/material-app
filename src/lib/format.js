// Date formatting helpers used across materials + garment samples.

// Format YYYY-MM-DD → "7 Apr 2026"
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}

// Relative time: "Today", "Yesterday", "3d ago"
export function relativeDate(dateStr) {
  if (!dateStr) return "";
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}
