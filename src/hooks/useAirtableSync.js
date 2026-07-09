// src/hooks/useAirtableSync.js
import { useCallback } from "react";
import { createRecord, updateRecord } from "../airtable";

export function useAirtableSync() {
  const syncToAirtable = useCallback(async (table, data) => {
    try {
      return await createRecord(table, data);
    } catch (err) {
      console.error("Airtable sync failed:", err);
      throw err;
    }
  }, []);

  const updateAirtable = useCallback(async (table, recordId, data) => {
    try {
      return await updateRecord(table, recordId, data);
    } catch (err) {
      console.error("Airtable update failed:", err);
      throw err;
    }
  }, []);

  return { syncToAirtable, updateAirtable };
}