import React, { createContext, useContext } from "react";
import { AddonManagerController } from "./AddonManagerController";

export const AddonContext = createContext<AddonManagerController | null>(null);

export const useAddonContext = () => {
  const context = useContext(AddonContext);
  if (!context) {
    throw new Error("useAddonContext must be used within an AddonProvider");
  }
  return context;
};