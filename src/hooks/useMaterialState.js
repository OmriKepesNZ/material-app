// src/hooks/useMaterialState.js
import { useReducer, useCallback } from "react";

const materialsReducer = (state, action) => {
  switch (action.type) {
    case "SET_MATERIALS":
      return action.payload;
    case "ADD_MATERIAL":
      return [...state, action.payload];
    case "UPDATE_MATERIAL":
      return state.map(m => m.id !== action.payload.id ? m : action.payload);
    case "DELETE_MATERIAL":
      return state.filter(m => !action.payload.includes(m.id));
    case "ADD_VERSION":
      return state.map(m => m.id !== action.payload.materialId ? m : {
        ...m,
        versions: [...(m.versions || []), action.payload.version]
      });
    default:
      return state;
  }
};

export function useMaterialState() {
  const [materials, dispatch] = useReducer(materialsReducer, []);

  const setMaterials = useCallback((data) => {
    dispatch({ type: "SET_MATERIALS", payload: data });
  }, []);

  const addMaterial = useCallback((material) => {
    dispatch({ type: "ADD_MATERIAL", payload: material });
  }, []);

  const updateMaterial = useCallback((material) => {
    dispatch({ type: "UPDATE_MATERIAL", payload: material });
  }, []);

  const deleteMaterials = useCallback((ids) => {
    dispatch({ type: "DELETE_MATERIAL", payload: ids });
  }, []);

  const addVersion = useCallback((materialId, version) => {
    dispatch({ type: "ADD_VERSION", payload: { materialId, version } });
  }, []);

  return { materials, setMaterials, addMaterial, updateMaterial, deleteMaterials, addVersion };
}