import { useEffect, useState } from "react";

import type { ServerAddonType } from "../../AddonManagerContext/AddonManagerController";

export const useAvailableAddon = (details: ServerAddonType) => {
  const [status, setStatus] = useState(details.addon?.getState?.() ?? "unknown");

  useEffect(() => {
    const interval = setInterval(() => {
      const current = details.addon?.getState?.();
      setStatus(current ?? "unknown");
    }, 500);

    return () => clearInterval(interval); // cleanup
  }, [details.addon]);

  return {
    status
  }
};