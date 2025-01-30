import React, { useEffect, useState } from "react";
import { AddonManager } from "./addonManager";
import { AddonContext } from "./AddonContext";
import { useCesium } from "../CesiumContext/useCesiumContext";

export const AddonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [addonManager, setAddonManager] = useState<AddonManager | null>(null);
  const cesium = useCesium();

  useEffect(() => {
    const initializeAddons = async () => {
      const manager = new AddonManager(cesium);
      console.log("[AddonProvider] Loading addons...");
      await manager.loadAddons();
      setAddonManager(manager);
    };

    initializeAddons();
  }, []);

  return <AddonContext.Provider value={addonManager}>{children}</AddonContext.Provider>;
};