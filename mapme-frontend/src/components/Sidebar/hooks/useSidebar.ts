import { useState, useEffect, useContext } from "react";
import { useCesium } from "../../CesiumContext/useCesiumContext";
import { Color } from "cesium";
import { AddonContext } from "../../AddonManagerContext/AddonContext";
import { ServerAddonType } from "../../AddonManagerContext/addonManager";

const useSidebar = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<{ lat: number; lon: number }[]>([]);
  const [availableAddons, setAvailableAddons] = useState<ServerAddonType[]>([]);
  const [installedAddons, setInstalledAddons] = useState<ServerAddonType[]>([]);

  const [isAvailableCollapsed, setIsAvailableCollapsed] = useState(false);
  const [isInstalledCollapsed, setIsInstalledCollapsed] = useState(false);

  const { addEntityToGroup, clearGroup } = useCesium();
  const addonManager = useContext(AddonContext);

  const fetchPoints = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/points");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setLoading(false);
      // return data; // Backend should return points for the map
      setPoints(data); // Mock data
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
    }
  };

  const removePoints = () => {
    clearGroup("test-group");
    setPoints([]);
  }

  useEffect(() => {
    for (const point of points) {
      addEntityToGroup(
        "test-group",
        {
          lat: point.lat,
          lon: point.lon,
          color: Color.RED,
          id: `point-${point.lat}-${point.lon}`,
        }
      )
    }
  }, [points]);

  // TODO I had a lot of functionality here that I have moved to the addonManager, still needs to be refactored more
  useEffect(() => {
    const initAddons = async () => {
      if (!addonManager) return;

      console.log("[useSidebar] Fetching addons...");
      try {
        setInstalledAddons(addonManager.getInstalledAddons());
        setAvailableAddons(addonManager.getAvailableAddons());
      } catch (err: any) {
        console.error(err.message);
      }
    };

    initAddons();
  }, [addonManager]);

  return { 
    fetchPoints,
    removePoints,
    loading,
    error,
    availableAddons,
    installedAddons,
    isAvailableCollapsed,
    isInstalledCollapsed,
    setIsAvailableCollapsed,
    setIsInstalledCollapsed,
  };
};

export default useSidebar;
