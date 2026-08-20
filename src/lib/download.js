// Downloads a file from a URL (typically a Cloudinary URL, so cross-origin).
// A plain <a download> tag does NOT force a download for cross-origin
// resources — the browser just navigates to it / opens it in a new tab.
// Fetching as a blob first and downloading that blob works around this.
export async function downloadFile(url, filename = "download") {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    // CORS or network failure — fall back to opening it in a new tab so
    // the user can still save it manually.
    console.warn("Direct download failed, opening in a new tab instead:", e);
    window.open(url, "_blank");
  }
}
