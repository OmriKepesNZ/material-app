import { MATERIAL_TYPES } from "../../lib/constants";

export default function MaterialFilters({ filters, setFilters }) {
  const inputStyle = { padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12, fontFamily: "inherit", color: "#111827", background: "#fff", outline: "none" };
  return <div style={{ display: "flex", gap: 7, flex: 1 }}>
    {[{ key: "type", options: MATERIAL_TYPES, label: "Type" }, { key: "status", options: ["Pending", "Approved", "Rejected"], label: "Status" }].map(({ key, options, label }) => (
      <select key={key} value={filters[key]} onChange={event => setFilters(current => ({ ...current, [key]: event.target.value }))} style={{ ...inputStyle, minWidth: 100, color: filters[key] ? "#111827" : "#9CA3AF" }}>
        <option value="">{label}</option>{options.map(option => <option key={option}>{option}</option>)}
      </select>
    ))}
    {Object.values(filters).some(Boolean) && <button onClick={() => setFilters({ type: "", status: "" })} style={{ ...inputStyle, cursor: "pointer", color: "#9CA3AF" }}>Clear</button>}
  </div>;
}
