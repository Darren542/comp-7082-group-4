import { useContext, useEffect, useState } from "react";
import { AddonContext } from "../../../components/AddonManagerContext/AddonContext";
import { YelpController } from "../YelpController";
import { ADDONS } from "../../../config";

const yelpMarkerTypes = [
  { text: "Business Marker", color: "bg-yellow-500" }
];

export const YelpModal = () => {
  const addonManager = useContext(AddonContext);
  const [addonController, setAddonController] = useState<YelpController | null>(null);
  const [placeStats, setPlaceStats] = useState<{ totalPlaces: number, loadedAreas: number }>({
    totalPlaces: 0,
    loadedAreas: 0
  });

  useEffect(() => {
    if (!addonManager) return;
    console.log("[YelpPlacesModal] Loading YelpController...");
    const controller = addonManager.getAddonController(ADDONS.YELP_PLACES) as YelpController;
    setAddonController(controller);
  }, [addonManager]);

  useEffect(() => {
    if (!addonController) return;

    updateStats();
    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, [addonController]);

  const updateStats = () => {
    if (!addonController) return;
    setPlaceStats(addonController.getPlaceStats());
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Yelp Places</h3>

      {/* Legend for map markers */}
      <div className="space-y-2 mb-6">
        <p className="font-medium">Map Legend</p>
        {yelpMarkerTypes.map(({ text, color }) => (
          <div key={text} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${color}`} />
            <p className="text-gray-700">{text}</p>
          </div>
        ))}
      </div>

      {/* Stats about loaded places */}
      <div className="bg-gray-100 p-3 rounded-md">
        <h4 className="font-medium mb-2">Business Information</h4>
        <div className="space-y-1">
          <p className="text-sm">Total Places: {placeStats.totalPlaces}</p>
          <p className="text-sm">Loaded Areas: {placeStats.loadedAreas}</p>
        </div>
      </div>

      {/* Explanation of functionality */}
      <div className="mt-4 text-sm text-gray-600">
        <p className="mb-2">How it works:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Places are loaded based on your current map view</li>
          <li>Markers show restaurants, cafes, and other businesses</li>
          <li>Move the map to discover more places</li>
        </ul>
      </div>

      <p className="mt-6 text-xs text-gray-500">Data provided by Yelp API</p>
    </div>
  );
};