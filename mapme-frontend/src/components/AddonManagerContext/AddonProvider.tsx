import React, { useEffect, useState, useRef } from "react";
import { AddonManagerController } from "./AddonManagerController";
import { AddonContext } from "./AddonContext";
import { useCesium } from "../CesiumContext/useCesiumContext";

export const AddonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addonManagerRef = useRef<AddonManagerController | null>(null);
  const [addonManager, setAddonManager] = useState<AddonManagerController | null>(null);
  const cesium = useCesium();

  useEffect(() => {
    if (addonManagerRef.current) return;
  
    const initializeAddons = async () => {
      const manager = new AddonManagerController(cesium);
      console.log("[AddonProvider] Loading addons...");
      addonManagerRef.current = manager;
      await manager.loadAddons();
      setAddonManager(manager);
      console.log("[AddonProvider] Addons loaded.");
    };

    initializeAddons();
  }, []);

  return <AddonContext.Provider value={addonManager}>{children}</AddonContext.Provider>;
};