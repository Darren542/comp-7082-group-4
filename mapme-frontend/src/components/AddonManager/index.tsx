import Sidebar from "../Sidebar";
import useAddonManager from "./hooks/useAddonManager";
import { AddonWindow } from "../AddonWindow";
import { CanadaTravelAdvisoryModal } from "../../addons/CanadaTravelAdvisory/CanadaTravelAdvisoryModal";
import { ADDONS } from "../../config";
import { TicketmasterEventsModal } from "../../addons/TicketMaster/TicketMasterModal";
import { YelpModal } from "../../addons/Yelp/YelpModal";


/**
 * This function returns the component for the addon based on the addonId.
 * When a new addon is added, it should be added here.
 */
const getAddonComponent = (addonId: string) => {
  switch (addonId) {
    case ADDONS.CANADA_TRAVEL_ADVISORY:
      return <CanadaTravelAdvisoryModal />;
    case ADDONS.TICKETMASTER_EVENTS:
      return <TicketmasterEventsModal />;
    case ADDONS.YELP_PLACES:
      return <YelpModal />;
    default:
      return <p>No Details Available</p>;
  }
};


const AddonManager = () => {
  const hook = useAddonManager();
  // console.log("Available Addons: ", hook.availableAddons);
  // console.log("Installed Addons: ", hook.installedAddons);

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
        ([addonId, isOpen]) =>
          isOpen && 
            <AddonWindow key={addonId} name={addonId} onClose={hook.toggleAddonWindow}>
              {getAddonComponent(addonId)}
            </AddonWindow>
      )}
    </>
  );
};

export default AddonManager;
