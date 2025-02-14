import Sidebar from "../Sidebar";
import useAddonManager from "./hooks/useAddonManager";
import { AddonWindow } from "../AddonWindow";
import { CanadaTravelAdvisoryModal } from "../../addon/CanadaTravelAdvisory/CanadaTravelAdvisoryModal";

const getAddonComponent = (addonName: string) => {
  switch (addonName) {
    case "canadaTravelAdvisory":
      return <CanadaTravelAdvisoryModal />;
    default:
      return <p>No Details Available</p>
  }
};

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
          isOpen && 
            <AddonWindow key={addonName} name={addonName} onClose={hook.toggleAddonWindow}>
              {/* Addon Specific Content Goes Here */}
              {getAddonComponent(addonName)}
            </AddonWindow>
      )}
    </>
  );
};

export default AddonManager;
