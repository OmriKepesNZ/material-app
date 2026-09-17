import "./AppHeader.css";

export default function AppHeader({ view, setView, setNav, setBNav, setGSelected, setSearch, setGSearch }) {
  return (
    <div className="navbar">
      <div className="navbar-inner">
        <div className="app-logo">
          <div className="app-logo-mark">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <span className="app-title">Approvals</span>
        </div>

        <div className="view-toggle">
          {[
            {
              v: "factory",
              label: "Factory",
              icon: (
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="2 20 2 10 8 6 8 10 14 6 14 10 20 6 22 6 22 20" />
                </svg>
              )
            },
            {
              v: "brand",
              label: "Brand",
              icon: (
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                  <path d="M16 3H8l-2 4h12l-2-4z" />
                </svg>
              )
            },
          ].map(({ v, icon, label }) => (
            <button
              key={v}
              className={view === v ? "active" : "inactive"}
              onClick={() => {
                setView(v);
                setNav(null);
                setBNav(null);
                setGSelected(null);
                setSearch("");
                setGSearch("");
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
