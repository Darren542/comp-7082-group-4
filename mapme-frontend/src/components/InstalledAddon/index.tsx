import React from "react";
import { useInstalledAddon } from "./hooks/useInstalledAddon";
import { ServerAddonType } from "../AddonManagerContext/AddonManagerController";

type InstalledAddonProps = {
  details: ServerAddonType;
  update: (newStatus: ServerAddonType) => void;
  openAddonWindow: (addonName: string) => void;
};

export const InstalledAddon = ({
  details,
  update,
  openAddonWindow,
}: InstalledAddonProps) => {
  const { handleToggleVisibility, handleRemove, isVisible, status } = useInstalledAddon(details, update);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
      {/* Name Row */}
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{details.name}</h3>
      </div>

      {/* Description Row */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{details.desc}</p>
      </div>

      {/* Buttons and Toggle Row */}
      <div className="flex items-center justify-start space-x-2">
        {/* Toggle Visibility */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={() => handleToggleVisibility(details.id, isVisible)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
          <div className="w-4 h-4 bg-white rounded-full shadow absolute left-1 top-1 peer-checked:translate-x-4 transition-transform"></div>
        </label>

        {/* Details Button */}
        <button
          className="cursor-pointer rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
          onClick={() => openAddonWindow(details.id)}
        >
          Details
        </button>

        {/* Remove Button */}
        <button
          className="cursor-pointer rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors"
          onClick={() => handleRemove(details.id)}
        >
          Remove
        </button>

        <div>
          <p className="text-xs leading-none text-gray-500 dark:text-gray-400 self-end">Status:<br />{status}</p>
        </div>
      </div>
    </div>
  );
};
