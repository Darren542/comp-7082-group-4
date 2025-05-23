// TicketmasterEventsModal.tsx
import { useContext, useEffect, useState } from "react";
import { AddonContext } from "../../../components/AddonManagerContext/AddonContext";
import{ TicketmasterEventsController } from "../TicketMasterController";
import { ADDONS } from "../../../config";

const eventMarkerTypes = [
  { text: "Individual Event", color: "bg-red-500" },
  { text: "Event Cluster", color: "bg-blue-500" },
];

/**
 * Modal for Ticketmaster add on details
 */
export const TicketmasterEventsModal = () => {
  const addonManager = useContext(AddonContext);
  const [addonController, setAddonController] = useState<TicketmasterEventsController | null>(null);
  const [eventStats, setEventStats] = useState<{ totalEvents: number, loadedAreas: number }>({ 
    totalEvents: 0, 
    loadedAreas: 0 
  });

  useEffect(() => {
    if (!addonManager) return;
    console.log("[TicketmasterEventsModal] Loading TicketmasterEventsController...");
    const controller = addonManager.getAddonController(ADDONS.TICKETMASTER_EVENTS) as TicketmasterEventsController;
    setAddonController(controller);
  }, [addonManager]);

  useEffect(() => {
    if (!addonController) return;
    
    // Initial stats update
    updateStats();
    
    // Set up interval to upade stats every 10 seconds
    const interval = setInterval(updateStats, 10000); 
    
    return () => clearInterval(interval);
  }, [addonController]);
  
  const updateStats = () => {
    if (!addonController) return;
    setEventStats(addonController.getEventStats());
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Ticketmaster Events</h3>
      
      {/* Legend for map markers */}
      <div className="space-y-2 mb-6">
        <p className="font-medium">Map Legend</p>
        {eventMarkerTypes.map(({ text, color }) => (
          <div key={text} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${color}`} />
            <p className="text-gray-700">{text}</p>
          </div>
        ))}
      </div>
      
      {/* Stats about loaded events */}
      <div className="bg-gray-100 p-3 rounded-md">
        <h4 className="font-medium mb-2">Event Information</h4>
        <div className="space-y-1">
          <p className="text-sm">Total Events: {eventStats.totalEvents}</p>
          <p className="text-sm">Loaded Areas: {eventStats.loadedAreas}</p>
        </div>
      </div>
      
      {/* Explanation of functionality */}
      <div className="mt-4 text-sm text-gray-600">
        <p className="mb-2">How it works:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Events are loaded based on your current map view</li>
          <li>Zooming in shows individual events</li>
          <li>Zooming out shows event clusters</li>
          <li>Move the map to discover more events</li>
        </ul>
      </div>
      
      <p className="mt-6 text-xs text-gray-500">Data provided by Ticketmaster API</p>
    </div>
  );
};