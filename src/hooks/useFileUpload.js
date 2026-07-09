// src/hooks/useFileUpload.js
import { useCallback } from "react";
import { uploadImage, uploadFile } from "../airtable";

export function useFileUpload() {
  const uploadFiles = useCallback(async (photos = [], additionalFiles = []) => {
    const photoUrls = [];
    for (const ph of photos) {
      if (ph.dataUrl) {
        try {
          const url = await uploadImage(ph.dataUrl, ph.name || "photo.jpg");
          photoUrls.push(url);
        } catch (e) {
          console.warn("Photo upload failed:", e);
        }
      }
    }

    const fileUrls = [];
    for (const f of additionalFiles) {
      if (f.dataUrl) {
        try {
          const url = await uploadFile(f.dataUrl, f.name || "file");
          fileUrls.push(url);
        } catch (e) {
          console.warn("File upload failed:", e);
        }
      }
    }

    return { photoUrls, fileUrls };
  }, []);

  return { uploadFiles };
}