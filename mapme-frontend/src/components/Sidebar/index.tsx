import React from "react";
import useSidebar from "./hooks/useSidebar";
import { AvailableAddon } from "../AvailableAddon";
import { InstalledAddon } from "../InstalledAddon";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import { ServerAddonType } from "../AddonManagerContext/AddonManagerController";

type SidebarProps = {
  availableAddons: ServerAddonType[];
  installedAddons: ServerAddonType[];
  updateAddonStatus: (newStatus: ServerAddonType) => void;
  openAddonWindow: (addonName: string) => void;
};

const Sidebar = ({ 
  availableAddons,
  installedAddons,
  updateAddonStatus,
  openAddonWindow
}: SidebarProps) => {
  const hook = useSidebar();

  return (
    <div className="bg-slate-800" style={{ width: "256px", color: "#ffffff" }}>
      <div>
        <div>
          <div
            className="flex justify-between items-center cursor-pointer pr-2"
            onClick={() => hook.setIsAvailableCollapsed(!hook.isAvailableCollapsed)}
          >
            <h2 className="text-xl font-bold p-2">Available Addons</h2>
            {hook.isAvailableCollapsed ? (
              <ChevronRightIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors" />
            )}
          </div>

          {!hook.isAvailableCollapsed && (
            <div className="space-y-1">
              {availableAddons.map((item) => (
                <AvailableAddon key={item.name} details={item} update={updateAddonStatus} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div
            className="flex justify-between items-center cursor-pointer pr-2"
            onClick={() => hook.setIsInstalledCollapsed(!hook.isInstalledCollapsed)}
          >
            <h2 className="text-xl font-bold p-2">Installed Addons</h2>
            {hook.isInstalledCollapsed ? (
              <ChevronRightIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors" />
            )}
          </div>

          {!hook.isInstalledCollapsed && (
            <div className="space-y-1">
              {installedAddons.map((item) => (
                <InstalledAddon
                  key={item.name}
                  details={item}
                  update={updateAddonStatus}
                  openAddonWindow={openAddonWindow}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
