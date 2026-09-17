import "./ProductList.css";
import { relativeDate } from "../../lib/format";
import { STATUS_COLORS, GS_STATUS_COLORS } from "../../lib/theme";

export default function ProductList({
  products,
  materials,
  gSamples,
  openTab,
  handleDeleteProduct,
}) {
  return (
    <div className="product-list">
      {products.map((p) => {
        const mats = p.materialIds.map((id) => materials.find((m) => m.id === id)).filter(Boolean);
        const real = mats.filter((m) => m.materialName !== "__empty__" && m.versions.length > 0);
        const pending = real.filter((m) => m.versions[m.versions.length - 1].status === "Pending").length;
        const rejected = real.filter((m) => m.versions[m.versions.length - 1].status === "Rejected").length;
        const latestVer = real.length > 0 ? real[real.length - 1].versions[real[real.length - 1].versions.length - 1] : null;
        const displayDate = latestVer ? latestVer.approvalDate || latestVer.submissionDate : null;
        const timeStr = relativeDate(displayDate);

        const gs = gSamples.filter((s) => s.productName === p.name);
        const gsPending = gs.filter((s) => s.status === "Awaiting Review").length;

        const latestGsPhoto = gs
          .map((s) => s.versions[s.versions.length - 1])
          .filter((v) => v && v.photos && v.photos.length > 0)
          .sort((a, b) => new Date(b.dateReceived || 0) - new Date(a.dateReceived || 0))[0]?.photos[0];
        const gsThumb = latestGsPhoto ? latestGsPhoto.url || latestGsPhoto.dataUrl : null;
        const matThumb = real.find((m) => m.versions[m.versions.length - 1].image)?.versions.slice(-1)[0].image || null;
        const thumb = gsThumb || matThumb;

        const hasPending = pending > 0;
        const hasRejected = rejected > 0;
        const overallStatus = hasPending
          ? "Pending"
          : hasRejected
          ? "Rejected"
          : real.length > 0 && real.every((m) => m.versions[m.versions.length - 1].status === "Approved")
          ? "Approved"
          : real.length === 0
          ? "No submissions"
          : "Mixed";

        const sc = STATUS_COLORS[overallStatus] || { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" };

        return (
          <div key={p.id} className="product-card" onClick={() => openTab(p.id)}>
            <div className="product-card-thumb">
              {thumb ? (
                <img src={thumb} alt="" />
              ) : (
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 3H8l-2 4h12l-2-4z" />
                </svg>
              )}
            </div>

            <div className="product-card-info">
              <div className="product-card-header">
                <span className="product-card-name">{p.name}</span>
                {real.length > 0 && (
                  <span className="status-pill" style={{ background: sc.bg, color: sc.text }}>
                    <span className="status-pill-dot" style={{ background: sc.dot }} />
                    {overallStatus}
                  </span>
                )}
                {gsPending > 0 && (
                  <span className="status-pill" style={{ background: GS_STATUS_COLORS["Awaiting Review"].bg, color: GS_STATUS_COLORS["Awaiting Review"].text }}>
                    <span className="status-pill-dot" style={{ background: GS_STATUS_COLORS["Awaiting Review"].dot }} />
                    {gsPending} sample{gsPending !== 1 ? "s" : ""} to review
                  </span>
                )}
              </div>

              <div className="product-card-meta">
                {real.length > 0 && <span>{real.length} material{real.length !== 1 ? "s" : ""}</span>}
                {gs.length > 0 && <><span className="meta-separator">·</span><span>{gs.length} garment sample{gs.length !== 1 ? "s" : ""}</span></>}
                {timeStr && <><span className="meta-separator">·</span><span>{timeStr}</span></>}
              </div>
            </div>

            <div className="product-card-actions" onClick={(e) => e.stopPropagation()}>
              <button className="icon-action danger-action" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
              <button className="primary-inline-button" onClick={() => openTab(p.id)}>
                Open
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
