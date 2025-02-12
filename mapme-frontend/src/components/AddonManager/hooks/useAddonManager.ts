/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useContext } from "react";
import { useCesium } from "../../CesiumContext/useCesiumContext";
import { Color } from "cesium";
import { AddonContext } from "../../AddonManagerContext/AddonContext";
import { ServerAddonType } from "../../AddonManagerContext/AddonManagerController";

const useAddonManager = () => {
  const addonManager = useContext(AddonContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableAddons, setAvailableAddons] = useState<ServerAddonType[]>([]);
  const [installedAddons, setInstalledAddons] = useState<ServerAddonType[]>([]);

  const [openWindows, setOpenWindows] = useState< { [key: string]: boolean } >({});

  const toggleAddonWindow = (addonName: string) => {
    setOpenWindows((prev) => ({
      ...prev,
      [addonName]: !prev[addonName]
    }));
  }

  // const { addEntityToGroup, clearGroup } = useCesium();

  const updateAddonStatus = async (addon: ServerAddonType) => {
    if (!addonManager) {
      console.error("[useAddonManager] Addon manager not found.");
      return;
    }
    try {
      const updatedAddons = await addonManager.updateAddonStatus(addon);
      if (updatedAddons) {
        setInstalledAddons(addonManager.getInstalledAddons());
        setAvailableAddons(addonManager.getAvailableAddons());
      }
    }
    catch (err: any) {
      console.error(err.message);
    }
  }

  // const installAddon = async 

  // TODO I had a lot of functionality here that I have moved to the addonManager, still needs to be refactored more
  useEffect(() => {
    const initAddons = async () => {
      console.log("[useAddonManager] Event listener Triggered.");
      if (!addonManager) return;

      console.log("[useAddonManager] Fetching addons...");
      try {
        setInstalledAddons(addonManager.getInstalledAddons());
        setAvailableAddons(addonManager.getAvailableAddons());
      } catch (err: any) {
        console.error(err.message);
      }
    };
    console.log("[useAddonManager] Initializing addons...");
    if (!addonManager) return;
    console.log("[useAddonManager] Event listener added.");
    addonManager.on("addonsLoaded", initAddons);
    initAddons();
  }, [addonManager]);

  return { 
    loading,
    error,
    availableAddons,
    installedAddons,
    updateAddonStatus,
    toggleAddonWindow,
    openWindows
  };
};

export default useAddonManager;
