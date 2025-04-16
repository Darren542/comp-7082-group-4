import { useEffect, useState } from "react";
import type { ServerAddonType } from "../../AddonManagerContext/AddonManagerController";

/**
 * This hook is used to get and continuously update the status of the addon.
 */
export const useAvailableAddon = (details: ServerAddonType) => {
  const [status, setStatus] = useState(details.addon?.getState?.() ?? "unknown");

  useEffect(() => {
    const interval = setInterval(() => {
      const current = details.addon?.getState?.();
      setStatus(current ?? "unknown");
    }, 500);

    return () => clearInterval(interval);
  }, [details.addon]);

  return {
    status
  }
};