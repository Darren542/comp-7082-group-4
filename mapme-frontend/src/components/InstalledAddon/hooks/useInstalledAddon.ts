import { useCallback, useState } from "react";
import { ServerAddonType } from "../../AddonManagerContext/addonManager";

export const useInstalledAddon = (details: ServerAddonType) => {
  const [isVisible, setIsVisible] = useState(details.active || false);

  const handleToggleVisibility = useCallback((id: string, isVisible: boolean) => {
    // Logic to toggle visibility on the map
    console.log(`Toggling visibility for ${id}: ${!isVisible}`);
    setIsVisible(!isVisible);
  }, []);

  const handleRemove = useCallback((id: string) => {
    // Logic to remove the addon from the installed list
    console.log(`Removing addon with ID: ${id}`);
  }, []);

  const handleShowDetails = useCallback((id: string) => {
    // Logic to show a modal with addon details
    console.log(`Showing details for addon with ID: ${id}`);
  }, []);

  return { handleToggleVisibility, handleRemove, handleShowDetails, isVisible };
};