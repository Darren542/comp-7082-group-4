import Sidebar from "../Sidebar";
import useAddonManager from "./hooks/useAddonManager";
import { AddonWindow } from "../AddonWindow";

const AddonManager = () => {
  const hook = useAddonManager();

  console.log("Available Addons: ", hook.availableAddons);
  console.log("Installed Addons: ", hook.installedAddons);

  return (
    <>
      <Sidebar
        availableAddons={hook.availableAddons}
        installedAddons={hook.installedAddons}
        updateAddonStatus={hook.updateAddonStatus}
        openAddonWindow={hook.toggleAddonWindow}
      />

      {/* Render Addon Windows Dynamically */}
      {Object.entries(hook.openWindows).map(
        ([addonName, isOpen]) =>
          isOpen && <AddonWindow key={addonName} name={addonName} onClose={hook.toggleAddonWindow} />
      )}
    </>
  );
};

export default AddonManager;
