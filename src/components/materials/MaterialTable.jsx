import Badge from "../shared/Badge";
import "./MaterialTable.css";

export default function MaterialTable({ rows, filters, products, view, onSelect, onClearSearch, showContext = false }) {
  const filtered = rows.filter(material => material.latest && (!filters.type || material.materialType === filters.type) && (!filters.status || material.latest.status === filters.status));
  return (
    <div className="material-table">
      <table>
        <thead><tr>
          {showContext && <th>Product / Factory</th>}
          {["Type", "Material", "Version", "Shipment", "Status"].map(label => <th key={label}>{label}</th>)}
        </tr></thead>
        <tbody>{filtered.length === 0 ? (
          <tr><td className="material-empty" colSpan={showContext ? 6 : 5}>No materials found</td></tr>
        ) : filtered.map((material, index) => (
          <tr key={material.id} className="material-row" onClick={() => {
            const product = products.find(item => item.airtableProductId === material.airtableProductId || item.name === material.styleName);
            onSelect(material.id, product, view === "factory" ? "factory" : "brand");
            onClearSearch();
          }} style={{ borderBottom: index < filtered.length - 1 ? "1px solid #F9FAFB" : "none", background: "#fff" }}>
            {showContext && <td className="material-context-cell"><div className="material-context-name">{material.styleName}</div><div className="material-context-factory">{material.factoryName}</div></td>}
            <td className="material-cell material-type">{material.materialType}</td>
            <td className="material-cell"><div className="material-name-wrap">
              {material.latest.image ? <img className="material-image" src={material.latest.image} alt="" /> : <div className="material-image-placeholder" />}
              <span className="material-name">{material.materialName}</span>
            </div></td>
            <td className="material-cell"><span className="material-version">V{material.latest.version}</span></td>
            <td className="material-cell"><Badge status={material.latest.shipmentStatus} type="shipment" /></td>
            <td className="material-cell"><Badge status={material.latest.status} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
