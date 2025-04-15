import { useCallback, useState, useEffect } from "react";
import { ServerAddonType } from "../../AddonManagerContext/AddonManagerController";

/**
 * This hook is used to manage the installed addons.
 */
export const useInstalledAddon = (details: ServerAddonType, update: (newStatus: ServerAddonType) => void) => {
  const [isVisible, setIsVisible] = useState(details.active || false);
  const [status, setStatus] = useState(details.addon?.getState?.() ?? "unknown");

  const handleToggleVisibility = useCallback((id: string, isVisible: boolean) => {
    // Logic to toggle visibility on the map
    console.log(`[${id}] Toggling visibility: ${!isVisible}`);
    update({ ...details, active: !isVisible });
    setIsVisible(!isVisible);
  }, []);

  const handleRemove = useCallback((id: string) => {
    // Logic to remove the addon from the installed list
    update({ ...details, installed: false, active: false });
    console.log(`[${id}] Starting Uninstall process...`);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = details.addon?.getState?.();
      setStatus(current ?? "unknown");
    }, 500);

    return () => clearInterval(interval);
  }, [details.addon]);

  return { handleToggleVisibility, handleRemove, isVisible, status };
};