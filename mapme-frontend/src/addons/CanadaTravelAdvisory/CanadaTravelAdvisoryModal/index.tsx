import React, { useContext, useEffect, useState } from "react";
import { AddonContext } from "../../../components/AddonManagerContext/AddonContext";
import type { CanadaTravelAdvisoryController } from "../CanadaTravelAdvisoryController";
import { ADDONS } from "../../../config";

const advisoryLevels = [
  { text: "Canada", color: "bg-blue-500" },   
  { text: "Take normal security precautions", color: "bg-green-500" },
  { text: "Exercise a high degree of caution", color: "bg-yellow-300" },       
  { text: "Avoid non-essential travel", color: "bg-orange-500" },            
  { text: "Avoid all travel", color: "bg-red-500" },
  { text: "No data", color: "bg-gray-500" }, 
];

export const CanadaTravelAdvisoryModal = () => {
  const addonManager = useContext(AddonContext);
  const [addonController, setAddonController] = useState<CanadaTravelAdvisoryController | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("Loading...");

  useEffect(() => {
    if (!addonManager) return;
    console.log("[CanadaTravelAdvisoryModal] Loading CanadaTravelAdvisoryController...");
    const controller = addonManager.getAddonController(ADDONS.CANADA_TRAVEL_ADVISORY) as CanadaTravelAdvisoryController;
    setAddonController(controller);
  }, [addonManager]);

  useEffect(() => {
    if (!addonController) return;
    console.log("[CanadaTravelAdvisoryModal] Setting last update...");
    setLastUpdate(addonController.getLastDataUpdate());
  }, [addonController]);

  return (
    <div>
      {/* Advisory Levels with Colored Blocks */}
      <div className="space-y-2">
        <p>Map Legend</p>
        {advisoryLevels.map(({ text, color }) => (
          <div key={text} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-sm ${color}`} /> {/* Colored Block */}
            <p className="text-gray-700">{text}</p>
          </div>
        ))}
      </div>
      <p className="m-2">Last Updated: {lastUpdate}</p>
      <p className="m-2">Data Provided By: open.canada.ca</p>
    </div>
  );
};