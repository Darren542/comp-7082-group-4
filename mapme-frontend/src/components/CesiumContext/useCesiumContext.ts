import { useContext, createContext } from "react";
import { Viewer, Color } from "cesium";

export interface CesiumContextType {
  viewer: Viewer | null;
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
}

export const CesiumContext = createContext<CesiumContextType | undefined>(undefined);

export const useCesium = () => {
  const context = useContext(CesiumContext);
  if (!context) {
    throw new Error("useCesium must be used within a CesiumProvider");
  }
  return context;
};