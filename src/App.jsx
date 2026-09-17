import "./styles/global.css";
import useApprovalApp from "./hooks/useApprovalApp";
import AppHeader from "./components/layout/AppHeader";
import Sidebar from "./components/layout/Sidebar";
import ProductList from "./components/layout/ProductList";
import ProductWorkspace from "./components/layout/ProductWorkspace";
import MaterialTable from "./components/materials/MaterialTable";
import MaterialFilters from "./components/materials/MaterialFilters";
import NewSubmissionModal from "./components/materials/NewSubmissionModal";
import GsNewSampleModal from "./components/samples/GsNewSampleModal";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import SearchBar from "./components/shared/SearchBar";
import AddRow from "./components/shared/AddRow";
import Spinner from "./components/shared/Spinner";
import { ICO } from "./lib/icons";

const screenStyle = { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "DM Sans, Helvetica Neue, sans-serif", background: "#F4F5F7" };

function LoadingScreen() {
  return <div style={screenStyle}><div style={{ textAlign: "center" }}><div style={{ width: 36, height: 36, border: "2.5px solid #E5E7EB", borderTopColor: "#111827", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} /><div style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>Loading</div><div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Connecting to Airtable...</div></div></div>;
}

function ErrorScreen({ message, onRetry }) {
  return <div style={screenStyle}><div style={{ textAlign: "center", maxWidth: 380, padding: 24 }}><div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Could not connect to Airtable</div><div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, marginBottom: 20 }}>{message}</div><button onClick={onRetry} style={{ padding: "10px 24px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Retry</button></div></div>;
}

export default function App() {
  const app = useApprovalApp();
  if (app.loading) return <LoadingScreen />;
  if (app.loadError) return <ErrorScreen message={app.loadError} onRetry={app.retryLoad} />;

  const selectMaterial = (id, product) => {
    if (product) app.openTab(product.id);
    app.setSelected(id);
    const material = app.materials.find(item => item.id === id);
    app.setBrandComment(material?.versions.at(-1)?.brandComment || "");
    app.setShowNewVersionFor(null);
    app.setSearch("");
  };

  return <div className="app-root">
    <AppHeader view={app.view} setView={app.setView} setNav={() => {}} setBNav={() => {}} setGSelected={app.setGSelected} setSearch={app.setSearch} setGSearch={app.setGSearch} />
    <div className="app-shell">
      <Sidebar openTabs={app.openTabs} products={app.products} materials={app.materials} gSamples={app.gSamples} view={app.view} activeTab={app.activeTab} setActiveTab={app.setActiveTab} setSelected={app.setSelected} setGSelected={app.setGSelected} setShowNew={app.setShowNew} setAddingProduct={app.setAddingProduct} closeTab={app.closeTab} />
      <ErrorBoundary><main className="content-scroll">
        {!app.activeTab ? <Home app={app} onSelectMaterial={selectMaterial} /> : <ProductWorkspace
          activeProduct={app.activeProduct} activeTabSection={app.activeTabSection} selectedMaterial={app.selectedMaterial} materials={app.materials} view={app.view}
          setSelected={app.setSelected} setActiveTab={app.setActiveTab} setGSelected={app.setGSelected} setTabSectionForActive={app.setTabSectionForActive}
          brandComment={app.brandComment} setBrandComment={app.setBrandComment} setMaterials={app.setMaterials} filters={app.filters} showNewVersionFor={app.showNewVersionFor} setShowNewVersionFor={app.setShowNewVersionFor}
          handleApprove={app.handleApprove} handleReject={app.handleReject} handleNewVersion={app.handleNewVersion} setShowNew={app.setShowNew} gSamples={app.gSamples} gSelectedSample={app.gSelectedSample}
          handleGsDecide={app.handleGsDecide} handleGsNewVersion={app.handleGsNewVersion} setShowNewGs={app.setShowNewGs} handleDeleteGarmentSample={app.handleDeleteGarmentSample} gSearch={app.gSearch} gLoading={app.gLoading} Spinner={Spinner} FilterBar={() => <MaterialFilters filters={app.filters} setFilters={app.setFilters} />} MaterialTable={MaterialTable} products={app.products} onSelectMaterial={selectMaterial} ICO={ICO}
        />}
      </main></ErrorBoundary>
    </div>
    {app.showNew && <NewSubmissionModal onClose={() => app.setShowNew(false)} onSubmit={app.addMaterial} existingStyles={app.allStyles} existingMaterials={app.materials.filter(item => item.materialName !== "__empty__")} />}
    {app.showNewGs && <GsNewSampleModal existingProductNames={app.products.map(product => product.name)} defaultProductName={app.activeProduct?.name || ""} onClose={() => app.setShowNewGs(false)} onSubmit={async data => { await app.handleGsSubmit(data); app.setShowNewGs(false); }} />}
  </div>;
}

function Home({ app, onSelectMaterial }) {
  return <div style={{ maxWidth: 900 }}>
    {app.view === "factory" && !app.openTabs.length && <button onClick={() => app.setAddingProduct(true)} className="primary-inline-button" style={{ marginBottom: 16 }}>{ICO.plus()} Add product</button>}
    <SearchBar search={app.search} setSearch={app.setSearch} placeholder="Search products, materials, suppliers..." />
    {app.searchResults ? <><div style={{ fontSize: 12, color: "#9CA3AF", margin: "12px 0" }}>{app.searchResults.length} result{app.searchResults.length !== 1 ? "s" : ""}</div><MaterialTable rows={app.searchResults} filters={app.filters} products={app.products} view={app.view} onSelect={onSelectMaterial} onClearSearch={() => app.setSearch("")} showContext /></> : <>
      {app.addingProduct && <AddRow placeholder="Product name..." onAdd={app.addProduct} onCancel={() => app.setAddingProduct(false)} />}
      <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, margin: "12px 0 10px" }}>{app.products.length} product{app.products.length !== 1 ? "s" : ""}</div>
      {app.products.length ? <ProductList products={app.products} materials={app.materials} gSamples={app.gSamples} openTab={app.openTab} handleDeleteProduct={app.handleDeleteProduct} /> : <div className="empty-state">No products yet</div>}
    </>}
  </div>;
}
