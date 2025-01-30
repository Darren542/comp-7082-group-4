import React, { createContext, useContext } from "react";
import { AddonManager } from "./addonManager";

export const AddonContext = createContext<AddonManager | null>(null);

export const useAddonContext = () => {
  const context = useContext(AddonContext);
  if (!context) {
    throw new Error("useAddonContext must be used within an AddonProvider");
  }
  return context;
};