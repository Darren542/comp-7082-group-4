import { useContext, createContext } from "react";
import { Viewer, Color } from "cesium";

/**
 * This interface is used to provide the Cesium context to the app.
 */
export interface CesiumContextType {
  addEntityToGroup: (
    groupId: string,
    entityOptions: {
      lat: number;
      lon: number;
      color?: Color;
      id?: string;
    }
  ) => void;
  clearGroup: (groupId: string) => void;
  removeEntityFromGroup: (groupId: string, entityId: string) => void;
  getViewer: () => Viewer | null;
}

export const CesiumContext = createContext<CesiumContextType | undefined>(undefined);

/**
 * This hook is used to get the Cesium context.
 */
export const useCesium = () => {
  const context = useContext(CesiumContext);
  if (!context) {
    throw new Error("useCesium must be used within a CesiumProvider");
  }
  return context;
};