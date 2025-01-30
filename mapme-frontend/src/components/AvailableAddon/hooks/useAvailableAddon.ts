import { useCallback } from "react";

export const useAvailableAddon = () => {
  const handleAdd = useCallback((id: string) => {
    // Logic to handle adding the addon to the installed list
    console.log(`Add addon with ID: ${id}`);
  }, []);

  return { handleAdd };
};