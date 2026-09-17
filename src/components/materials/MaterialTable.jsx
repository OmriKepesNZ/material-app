import Badge from "../shared/Badge";

const headerStyle = { padding: "9px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#C4C9D4", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" };

export default function MaterialTable({ rows, filters, products, view, onSelect, onClearSearch, showContext = false }) {
  const filtered = rows.filter(material => material.latest && (!filters.type || material.materialType === filters.type) && (!filters.status || material.latest.status === filters.status));
  return (
    <div style={{ background: "#fff", border: "1px solid #E8EAED", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          {showContext && <th style={headerStyle}>Product / Factory</th>}
          {["Type", "Material", "Version", "Shipment", "Status"].map(label => <th key={label} style={headerStyle}>{label}</th>)}
        </tr></thead>
        <tbody>{filtered.length === 0 ? (
          <tr><td colSpan={showContext ? 6 : 5} style={{ padding: 48, textAlign: "center", color: "#C4C9D4", fontSize: 13 }}>No materials found</td></tr>
        ) : filtered.map((material, index) => (
          <tr key={material.id} className="mrow" onClick={() => {
            const product = products.find(item => item.airtableProductId === material.airtableProductId || item.name === material.styleName);
            onSelect(material.id, product, view === "factory" ? "factory" : "brand");
            onClearSearch();
          }} style={{ borderBottom: index < filtered.length - 1 ? "1px solid #F9FAFB" : "none", background: "#fff" }}>
            {showContext && <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 12.5, fontWeight: 500 }}>{material.styleName}</div><div style={{ fontSize: 11, color: "#C4C9D4", marginTop: 1 }}>{material.factoryName}</div></td>}
            <td style={{ padding: "11px 14px", fontSize: 12, color: "#9CA3AF" }}>{material.materialType}</td>
            <td style={{ padding: "11px 14px" }}><div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {material.latest.image ? <img src={material.latest.image} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 7, border: "1px solid #E5E7EB" }} alt="" /> : <div style={{ width: 36, height: 36, borderRadius: 7, border: "1.5px dashed #E5E7EB", background: "#F3F4F6" }} />}
              <span style={{ fontSize: 13, fontWeight: 500 }}>{material.materialName}</span>
            </div></td>
            <td style={{ padding: "11px 14px" }}><span style={{ padding: "1px 7px", background: "#F3F4F6", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#374151", fontFamily: "monospace" }}>V{material.latest.version}</span></td>
            <td style={{ padding: "11px 14px" }}><Badge status={material.latest.shipmentStatus} type="shipment" /></td>
            <td style={{ padding: "11px 14px" }}><Badge status={material.latest.status} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
