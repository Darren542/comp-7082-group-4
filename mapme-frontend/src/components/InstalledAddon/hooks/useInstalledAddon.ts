import { useCallback, useState } from "react";
import { ServerAddonType } from "../../AddonManagerContext/AddonManagerController";

export const useInstalledAddon = (details: ServerAddonType, update: (newStatus: ServerAddonType) => void) => {
  const [isVisible, setIsVisible] = useState(details.active || false);

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

  return { handleToggleVisibility, handleRemove, isVisible };
};