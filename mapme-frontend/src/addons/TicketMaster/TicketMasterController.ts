import { AddonControlInterface, AddonState } from "../../components/AddonManagerContext/AddonManagerController";
import { CesiumContextType } from "../../components/CesiumContext/useCesiumContext";
import * as Cesium from "cesium";
import { ADDONS } from "../../config";
import { debounce } from "lodash";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

interface Event {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
}

//events when zoomed out and clustered
interface ClusteredEvent {
  latitude: number;
  longitude: number;
  count: number;
  regionKey: string;
}

export class TicketmasterEventsController implements AddonControlInterface {
  private state = AddonState.uninstalled;
  public groupId = ADDONS.TICKETMASTER_EVENTS;
  private eventsDataSource: Cesium.CustomDataSource | null = null;
  private clustersDataSource: Cesium.CustomDataSource | null = null;
  private events: Record<string, Event> = {};
  // Cache of loaded areas with timestamps
  private loadedAreas = new Map<string, number>(); 
  // cache lasts for 5 minutes
  private cacheExpiryTime = 5 * 60 * 1000; 
  private loading = false;
  private cameraMoveHandler: (() => void) | null = null;
  private clickHandlerSet = false;
  private supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

  constructor(private cesium: CesiumContextType) {
    this.cesium = cesium;
    // handles when user moves the camera multiple times in a short period
    this.cameraMoveHandler = debounce(this.handleCameraMove.bind(this), 500);
  }

  /**
   * If the users settings indicate that the addon was installed previously, this function should be called.
   * Could maybe rethink this, it is just to get state to preinit.
   */
  setInstalledPreviously(): void {
    console.log(`[${this.groupId}] already installed...`);
    this.state = AddonState.preinit;
  }

  /**
   * Addon Installation
   * If there are any first-time setup steps, they should be done here.
   * If this is successful, the addon should be in the preinit state.
   */
  async install(): Promise<boolean> {
    console.log(`[${this.groupId}] Installing...`);
    this.state = AddonState.preinit;
    return Promise.resolve(true);
  }

  /**
   * This function should be called to initialize the addon.
   * Any one-time setup should be done here.
   * It should be called after the addon is installed and is in the preinit state.
   * If this is successful, the addon should be in the initialized state.
   * @returns true if the addon was initialized successfully, false otherwise
   */
  async initialize(): Promise<boolean> {
    console.log(`[${this.groupId}] Initializing...`);

    if (this.eventsDataSource || this.clustersDataSource || this.loading) {
      return true;
    }

    const viewer = this.cesium.getViewer();
    if (!viewer) {
      console.error(`[${this.groupId}] Cannot initialize, viewer is not available!`);
      return false;
    }

    try {
      this.loading = true;
      
      // Create data sources for events and clusters
      this.eventsDataSource = new Cesium.CustomDataSource("ticketmaster-events");
      this.clustersDataSource = new Cesium.CustomDataSource("ticketmaster-clusters");
      
      // Add data sources to viewer
      viewer.dataSources.add(this.eventsDataSource);
      viewer.dataSources.add(this.clustersDataSource);

      this.state = AddonState.initialized;
      return true;
    } catch (error) {
      console.error(`[${this.groupId}] Failed to initialize addon!`, error);
      this.cleanupDataSources();
      return false;
    } finally {
      this.loading = false;
    }
  }

  /**
   * This function should be called to start the addon.
   * This should start any real-time data fetching, etc.
   * Should only start if the addon is in the initialized or stopped state.
   * If this is successful, the addon should be in the running state.
   */
  async start(): Promise<boolean> {
    // Should not start if the addon is not initialized
    if (!(this.state === AddonState.initialized || this.state === AddonState.stopped)) {
      console.error(`[${this.groupId}] Cannot start, addon is not initialized!`);
      return Promise.resolve(false);
    }

    console.log(`[${this.groupId}] Starting...`);
    
    const viewer = this.cesium.getViewer();
    if (!viewer || !this.eventsDataSource || !this.clustersDataSource) {
      console.error(`[${this.groupId}] Cannot start, viewer or data sources are not available!`);
      return Promise.resolve(false);
    }

    // Show data sources
    this.eventsDataSource.show = true;
    this.clustersDataSource.show = true;
    
    // Set up camera movement listener
    console.log(`[${this.groupId}] Setting up camera movement listener`);
    viewer.camera.moveEnd.addEventListener(this.cameraMoveHandler!);
    
    // Initial load based on current camera position
    console.log(`[${this.groupId}] Triggering initial camera move handler`);
    this.handleCameraMove();
    
    this.state = AddonState.running;
    console.log(`[${this.groupId}] Started successfully, state is now:`, this.state);
    return Promise.resolve(true);
  }

  /**
   * This function should be called to stop the addon.
   * This should stop any real-time data fetching, etc.
   * Should only stop if the addon is in the running state.
   * If this is successful, the addon should be in the stopped state.
   */
  async stop(): Promise<boolean> {
    console.log(`[${this.groupId}] Stopping...`);
    if (this.state === AddonState.running) {
      const viewer = this.cesium.getViewer();
      
      // Remove camera move event listener
      if (viewer && this.cameraMoveHandler) {
        viewer.camera.moveEnd.removeEventListener(this.cameraMoveHandler);
      }
      
      // Hide data sources
      if (this.eventsDataSource) {
        this.eventsDataSource.show = false;
      }
      
      if (this.clustersDataSource) {
        this.clustersDataSource.show = false;
      }
      
      this.state = AddonState.stopped;
      return Promise.resolve(true);
    } else {
      console.error(`[${this.groupId}] Cannot stop, addon is not running!`);
      return Promise.resolve(false);
    }
  }

  /**
   * This function should be called to destroy the addon.
   * This should clean up any resources, etc.
   * It is the counterpart to the initialize function.
   * If it is successful, the addon should be in the preinit state.
   */
  async destroy(): Promise<boolean> {
    console.log(`[${this.groupId}] Destroying...`);
    if (this.state === AddonState.uninstalled || this.state === AddonState.preinit) {
      console.error(`[${this.groupId}] Cannot destroy, addon is not initialized!`);
      return Promise.resolve(false);
    }
    
    // If addon is running, stop it first
    if (this.state === AddonState.running) {
      await this.stop();
    }
    
    // Clean up data sources
    this.cleanupDataSources();
    
    // Clear cached data
    this.events = {};
    this.loadedAreas.clear();
    
    this.state = AddonState.preinit;
    return Promise.resolve(true);
  }

  /**
   * This function should be called to uninstall the addon.
   * This should clean up any resources, etc.
   * May send a request to the server to remove any data, etc.
   * If it is successful, the addon should be in the uninstalled state.
   */
  async uninstall(): Promise<boolean> {
    console.log(`[${this.groupId}] Uninstalling...`);
    if (this.state === AddonState.uninstalled) {
      console.error(`[${this.groupId}] Cannot uninstall, addon is not installed!`);
      return Promise.resolve(false);
    }
    
    if (this.state === AddonState.running) {
      await this.stop();
    }
    
    if (this.state === AddonState.initialized || this.state === AddonState.stopped) {
      await this.destroy();
    }
    
    this.state = AddonState.uninstalled;
    return Promise.resolve(true);
  }

  /**
   * This function should return the current state of the addon.
   * This should be one of the AddonState values.
   */
  getState(): AddonState {
    return this.state;
  }

  /**
   * This function should set any options that the addon needs.
   * An Addon may have some user-configurable options that should be set here.
   */
  setOptions(options: Record<string, any>): void {
    console.log(`[${this.groupId}] Setting options...`, options);
    
    if (options.cacheExpiryTime) {
      this.cacheExpiryTime = options.cacheExpiryTime;
    }
  }

  /**
   * Handler for camera movement. fetches events for the current view
   */
  private handleCameraMove(): void {
    console.log(`[${this.groupId}] handleCameraMove called, addon state:`, this.state);
    if (this.state !== AddonState.running) {
      console.log(`[${this.groupId}] Addon not running, state:`, this.state);
      return;
    }
    
    const viewer = this.cesium.getViewer();
    if (!viewer) {
      console.log(`[${this.groupId}] Viewer not available`);
      return;
    }
    
    // Get current camera position and center of view
    const center = viewer.camera.pickEllipsoid(
      new Cesium.Cartesian3(
        viewer.canvas.clientWidth / 2,
        viewer.canvas.clientHeight / 2
      )
    );
    
    if (!center) return;
    
    // Convert Cartesian3 to lat/long
    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(center);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    
    // Calculate appropriate radius based on camera height
    const height = viewer.camera.positionCartographic.height;
    const zoomLevel = this.getZoomLevelFromHeight(height);
    const radius = this.getRadiusForZoomLevel(zoomLevel);
    
    // Load events for the current area
    this.loadEventsForArea(latitude, longitude, radius, zoomLevel);
  }

  /**
   * Converts camera height to a zoom level value (1-20)
   */
  private getZoomLevelFromHeight(height: number): number {
    if (height > 10000000) return 1;
    if (height > 5000000) return 2;
    if (height > 1000000) return 3;
    if (height > 500000) return 5;
    if (height > 100000) return 8;
    if (height > 50000) return 10;
    if (height > 10000) return 15;
    return 20;
  }
  
  /**
   * Converts zoom level to an appropriate search radius in km
   */
  private getRadiusForZoomLevel(zoomLevel: number): number {
    // Convert zoom level to search radius in km
    return Math.max(10, Math.min(500, 500 - (zoomLevel * 20)));
  }

  /**
   * Fetches events for a specific area and updates the display
   */
  private async loadEventsForArea(latitude: number, longitude: number, radius: number, zoomLevel: number): Promise<void> {
    console.log(`[${this.groupId}] loadEventsForArea called with lat:${latitude}, lon:${longitude}, radius:${radius}`);

    //percision depending on zoom level
    const precision = zoomLevel > 10 ? 2 : 1; 
    const roundedLat = Number(latitude.toFixed(precision));
    const roundedLon = Number(longitude.toFixed(precision));
    const areaKey = `${roundedLat}-${roundedLon}-${radius}`;
    
    // Check if area is already in cache
    const lastLoaded = this.loadedAreas.get(areaKey);
    if (lastLoaded && Date.now() - lastLoaded < this.cacheExpiryTime) {
      console.log(`[${this.groupId}] Using cached data for area ${areaKey}`);
      this.updateDisplay(zoomLevel);
      return;
    }
    
    try {
      // Fetch events from microservice
      console.log(`[${this.groupId}] Fetching events`);
      const { data, error } = await this.supabase.functions.invoke('ticketmaster', {
        body: {
          latitude,
          longitude,
          radius,
        }
      }) as { data: Event[], error: any };

      if (error) {
        console.log(`[${this.groupId}] Error invoking Ticketmaster Microservice`);
      }

      // Process and store events
      if (data) {
        // Clear existing entities
        if (this.eventsDataSource) {
          this.eventsDataSource.entities.removeAll();
        }
        
        if (this.clustersDataSource) {
          this.clustersDataSource.entities.removeAll();
        }
        
        // Store the events
        data.forEach((event: Event) => {
          this.events[event.id] = event;
        });
        
        // Update the map 
        this.loadedAreas.set(areaKey, Date.now());
        this.updateDisplay(zoomLevel);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
      } else {
        console.error(`[${this.groupId}] Error fetching Ticketmaster events:`, error);
      }
    }
  }

  /**
   * Updates the display based on current zoom level
   */
  private updateDisplay(zoomLevel: number): void {
    if (!this.eventsDataSource || !this.clustersDataSource) return;
    
    console.log(`[${this.groupId}] Updating display for zoom level: ${zoomLevel}`);
    
    // Clear existing entities
    this.eventsDataSource.entities.removeAll();
    this.clustersDataSource.entities.removeAll();
    
    // Configure viewer for infobox display
    const viewer = this.cesium.getViewer();
    if (viewer) {
      viewer.infoBox.frame.setAttribute('sandbox', 'allow-same-origin allow-popups allow-forms');
    }
    
    // Very high zoom - show detailed individual events with full information
    if (zoomLevel >= 15) {
      console.log(`[${this.groupId}] Showing detailed individual events`);
      this.displayIndividualEvents();
      this.eventsDataSource.show = true;
      this.clustersDataSource.show = false;
      
      // Make sure infobox is visible
      if (viewer) {
        viewer.scene.screenSpaceCameraController.enableZoom = true;
      }
    } else if (zoomLevel >= 12) {
      // High zoom - show individual events with basic information
      console.log(`[${this.groupId}] Showing individual events`);
      this.displayIndividualEvents();
      this.eventsDataSource.show = true;
      this.clustersDataSource.show = false;
      
      // Make sure infobox is visible
      if (viewer) {
        viewer.scene.screenSpaceCameraController.enableZoom = true;
      }
    } else {
      // Low zoom - show clusters
      console.log(`[${this.groupId}] Showing clustered events`);
      this.displayClusteredEvents(zoomLevel);
      this.eventsDataSource.show = false;
      this.clustersDataSource.show = true;
    }
  }
  
  /**
   * Displays individual event markers
   */
  private displayIndividualEvents(): void {
    const eventsDataSource = this.eventsDataSource;
    if (!eventsDataSource) return;
    
    const viewer = this.cesium.getViewer();
    if (!viewer) return;
    
    // Group events by location
    const eventsByLocation: Record<string, Event[]> = {};
    
    // First, group all events by their location
    Object.values(this.events).forEach(event => {
      const venue = event._embedded?.venues?.[0];
      if (!venue?.location) return;
      
      const lat = parseFloat(venue.location.latitude);
      const lon = parseFloat(venue.location.longitude);
      
      if (isNaN(lat) || isNaN(lon)) return;
      
      // Create a location key with reasonable precision
      const locationKey = `${lat.toFixed(5)}-${lon.toFixed(5)}`;
      
      if (!eventsByLocation[locationKey]) {
        eventsByLocation[locationKey] = [];
      }
      
      eventsByLocation[locationKey].push(event);
    });
    
    // Now create entities for each location
    Object.entries(eventsByLocation).forEach(([locationKey, eventsAtLocation]) => {
        // Sort events by date (most recent first)
        console.log(`[${this.groupId}] Sorting events for location ${locationKey}:`);
        eventsAtLocation.forEach(event => {
          console.log(`Event: ${event.name}, Date: ${event.dates?.start?.localDate}`);
        });
        
        eventsAtLocation.sort((a, b) => {
            const dateA = a.dates?.start?.localDate ? new Date(a.dates.start.localDate) : new Date(0);
            const dateB = b.dates?.start?.localDate ? new Date(b.dates.start.localDate) : new Date(0);
            
            // Sort by soonest date first (ascending order)
            const comparison = dateA.getTime() - dateB.getTime();
            console.log(`Comparing ${a.name} (${dateA.toISOString()}) with ${b.name} (${dateB.toISOString()}) = ${comparison}`);
            return comparison;
        });
        
        console.log(`[${this.groupId}] Sorted events:`);
        eventsAtLocation.forEach(event => {
          console.log(`Event: ${event.name}, Date: ${event.dates?.start?.localDate}`);
        });
        
        // Get the most recent event
        const mostRecentEvent = eventsAtLocation[0];
        const venue = mostRecentEvent._embedded?.venues?.[0];
        
        if (!venue?.location) return;
        
        const lat = parseFloat(venue.location.latitude);
        const lon = parseFloat(venue.location.longitude);
        
        // description with all events at venue
        let htmlDescription = `
          <div style="padding: 10px;">
            <h2 style="color: #d32f2f; margin-bottom: 10px;">Events at ${venue.name || 'this location'}</h2>
            <p>${eventsAtLocation.length} event${eventsAtLocation.length > 1 ? 's' : ''} found</p>
            <ul style="list-style-type: none; padding: 0; margin-top: 10px;">
        `;
        
        // each individual event at the venue
        eventsAtLocation.forEach(event => {
          const eventDate = event.dates?.start?.localDate 
            ? new Date(event.dates.start.localDate).toLocaleDateString() 
            : 'Date TBA';
            
          htmlDescription += `
            <li style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
              <h3 style="color: #1976d2; margin: 0 0 5px 0;">${event.name}</h3>
              <p><strong>Venue:</strong> ${venue.name || 'TBA'}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              ${event.url ? `<p><a href="${event.url}" target="_blank" style="color: #1976d2;">Buy Tickets</a></p>` : ''}
            </li>
          `;
        });
        
        htmlDescription += `
            </ul>
          </div>
        `;
        
        // Create a label that shows the count if there are multiple events
        const labelText = eventsAtLocation.length > 1 
          ? `${mostRecentEvent.name} (+${eventsAtLocation.length - 1} more)`
          : mostRecentEvent.name;
        
        // Add the entity to the data source
        eventsDataSource.entities.add({
          id: `${venue.name}`,
          position: Cesium.Cartesian3.fromDegrees(lon, lat),
          billboard: {
            image: 'mapPoint.png',
            width: 40,
            height: 40,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM
          },
          //label of the event
          label: {
            text: labelText,
            font: '20px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            show: true
          },
          description: htmlDescription,
        });
      });
    
    // opens the infobox when an event is clicked
    if (!this.clickHandlerSet) {
      viewer.screenSpaceEventHandler.setInputAction((click: any) => {
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          viewer.selectedEntity = pickedObject.id;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      
      this.clickHandlerSet = true;
    }
  }
  
  /**
   * Displays clustered event markers for zoomed-out views
   */
  private displayClusteredEvents(zoomLevel: number): void {
    if (!this.clustersDataSource) return;
    
    const viewer = this.cesium.getViewer();
    if (!viewer) return;
    
    // Group events by geographic region
    const clusters: Record<string, ClusteredEvent & { events: Event[] }> = {};
    const gridSize = this.getGridSizeForZoomLevel(zoomLevel);
    
    Object.values(this.events).forEach(event => {
      const venue = event._embedded?.venues?.[0];
      if (!venue?.location) return;
      
      const lat = parseFloat(venue.location.latitude);
      const lon = parseFloat(venue.location.longitude);
      
      if (isNaN(lat) || isNaN(lon)) return;
      
      // Create a region key based on grid
      const regionLat = Math.floor(lat / gridSize) * gridSize;
      const regionLon = Math.floor(lon / gridSize) * gridSize;
      const regionKey = `${regionLat}-${regionLon}`;
      
      if (!clusters[regionKey]) {
        clusters[regionKey] = {
          latitude: regionLat + gridSize/2, // center of grid cell
          longitude: regionLon + gridSize/2,
          count: 0,
          regionKey,
          events: []
        };
      }
      
      clusters[regionKey].count++;
      clusters[regionKey].events.push(event);
    });
    
    // Display clusters
    Object.values(clusters).forEach(cluster => {
      // Scale the point size based on count of events
      const size = Math.min(30, 10 + (cluster.count * 0.5));
      
      // Sort events by date (most recent first)
      cluster.events.sort((a, b) => {
        const dateA = a.dates?.start?.localDate ? new Date(a.dates.start.localDate) : new Date(0);
        const dateB = b.dates?.start?.localDate ? new Date(b.dates.start.localDate) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Create HTML description for the cluster with a dark background
      let htmlDescription = `
        <div style="padding: 10px; background-color: #212121; color: white;">
          <h2 style="color: #d32f2f; margin-bottom: 10px;">Event Cluster</h2>
          <p>${cluster.count} events in this area</p>
          <div style="max-height: 400px; overflow-y: auto;">
      `;
      
      // Group events by venue
      const eventsByVenue: Record<string, Event[]> = {};
      
      cluster.events.forEach(event => {
        const venue = event._embedded?.venues?.[0];
        if (!venue) return;
        
        const venueName = venue.name || 'Unknown Venue';
        if (!eventsByVenue[venueName]) {
          eventsByVenue[venueName] = [];
        }
        eventsByVenue[venueName].push(event);
      });
      
      // Add events grouped by venue with dark background and a white border
      Object.entries(eventsByVenue).forEach(([venueName, venueEvents]) => {
        htmlDescription += `
          <div style="margin-top: 15px; padding: 10px; border-radius: 5px; border: 1px solid white;">
            <h2 style="color: #d32f2f; margin-bottom: 10px;">${venueName}</h3>
            <p>${venueEvents.length} event${venueEvents.length > 1 ? 's' : ''}</p>
            <ul style="list-style-type: none; padding: 0; margin-top: 10px;">
        `;
        
        venueEvents.forEach(event => {
          const eventDate = event.dates?.start?.localDate 
            ? new Date(event.dates.start.localDate).toLocaleDateString() 
            : 'Date TBA';
              
          htmlDescription += `
            <li style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
              <h3 style="color: #1976d2; margin: 0 0 5px 0;">${event.name}</h4>
              <p><strong>Date:</strong> ${eventDate}</p>
              ${event.url ? `<p><a href="${event.url}" target="_blank" style="color: #1976d2;">Buy Tickets</a></p>` : ''}
            </li>
          `;
        });
        
        htmlDescription += `
            </ul>
          </div>
        `;
      });
      
      htmlDescription += `
          </div>
        </div>
      `;
      
      this.clustersDataSource!.entities.add({
        id: `cluster-${cluster.regionKey}`,
        position: Cesium.Cartesian3.fromDegrees(cluster.longitude, cluster.latitude),
        point: {
          pixelSize: size,
          color: Cesium.Color.BLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: `${cluster.count} events`,
          font: '18px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -size - 5),
          show: true
        },
        description: htmlDescription
      });
    });
    
    // Make sure click handler is set up for clusters too
    if (!this.clickHandlerSet) {
      viewer.screenSpaceEventHandler.setInputAction((click: any) => {
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          viewer.selectedEntity = pickedObject.id;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      
      this.clickHandlerSet = true;
    }
  }
  
  /**
   * Determines grid size based on zoom level
   */
  private getGridSizeForZoomLevel(zoomLevel: number): number {
    // Returns grid size in degrees
    if (zoomLevel < 3) return 10;
    if (zoomLevel < 5) return 5;
    if (zoomLevel < 8) return 2;
    if (zoomLevel < 10) return 1;
    return 0.5;
  }
  
  /**
   * Cleanup for data sources
   */
  private cleanupDataSources(): void {
    const viewer = this.cesium.getViewer();
    if (!viewer) return;
    
    if (this.eventsDataSource) {
      viewer.dataSources.remove(this.eventsDataSource, true);
      this.eventsDataSource = null;
    }
    
    if (this.clustersDataSource) {
      viewer.dataSources.remove(this.clustersDataSource, true);
      this.clustersDataSource = null;
    }
  }
  
  /**
   * Returns statistics about loaded events
   */
  getEventStats(): { totalEvents: number, loadedAreas: number } {
    return {
      totalEvents: Object.keys(this.events).length,
      loadedAreas: this.loadedAreas.size
    };
  }
}