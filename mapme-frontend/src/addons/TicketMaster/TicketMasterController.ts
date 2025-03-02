import { AddonControlInterface, AddonState } from "../../components/AddonManagerContext/AddonManagerController";
import { CesiumContextType } from "../../components/CesiumContext/useCesiumContext";
import * as Cesium from "cesium";
import { ADDONS } from "../../config";
import debounce from "lodash.debounce";

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

interface ClusteredEvent {
  latitude: number;
  longitude: number;
  count: number;
  regionKey: string;
}

export class TicketmasterEventsController implements AddonControlInterface {
  private state = AddonState.uninstalled;
  public groupId = ADDONS.TICKETMASTER_EVENTS;
  private apiEndpoint = "/api/events";
  private eventsDataSource: Cesium.CustomDataSource | null = null;
  private clustersDataSource: Cesium.CustomDataSource | null = null;
  private events: Record<string, Event> = {};
  private loadedAreas = new Map<string, number>(); // Cache of loaded areas with timestamps
  private cacheExpiryTime = 5 * 60 * 1000; // 5 minutes cache expiry
  private loading = false;
  private cameraMoveHandler: (() => void) | null = null;

  constructor(private cesium: CesiumContextType) {
    this.cesium = cesium;
    // Create debounced handler for camera movement
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
    viewer.camera.moveEnd.addEventListener(this.cameraMoveHandler!);
    
    // Initial load based on current camera position
    this.handleCameraMove();
    
    this.state = AddonState.running;
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
    
    if (options.apiEndpoint) {
      this.apiEndpoint = options.apiEndpoint;
    }
    
    if (options.cacheExpiryTime) {
      this.cacheExpiryTime = options.cacheExpiryTime;
    }
  }

  /**
   * Handler for camera movement - fetches events for the current view
   */
  private handleCameraMove(): void {
    if (this.state !== AddonState.running) return;
    
    const viewer = this.cesium.getViewer();
    if (!viewer) return;
    
    // Get current camera position and center of view
    const center = viewer.camera.pickEllipsoid(
      new Cesium.Cartesian3(
        viewer.canvas.clientWidth / 2,
        viewer.canvas.clientHeight / 2
      )
    );
    
    if (!center) return;
    
    // Convert to lat/lon
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
    // Round coordinates to create a cache key with reasonable granularity
    const precision = zoomLevel > 10 ? 2 : 1; // More precise at higher zoom levels
    const roundedLat = Number(latitude.toFixed(precision));
    const roundedLon = Number(longitude.toFixed(precision));
    const areaKey = `${roundedLat}-${roundedLon}-${radius}`;
    
    // Check if we've loaded this area recently
    const lastLoaded = this.loadedAreas.get(areaKey);
    if (lastLoaded && Date.now() - lastLoaded < this.cacheExpiryTime) {
      // Area data is still valid, just update the display based on zoom level
      this.updateDisplay(zoomLevel);
      return;
    }
    
    try {
      // Fetch events from our backend
      const response = await fetch(`${this.apiEndpoint}?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      
      // Process and store events
      if (data._embedded && data._embedded.events) {
        // Clear existing entities
        if (this.eventsDataSource) {
          this.eventsDataSource.entities.removeAll();
        }
        
        if (this.clustersDataSource) {
          this.clustersDataSource.entities.removeAll();
        }
        
        // Store the events
        data._embedded.events.forEach((event: Event) => {
          this.events[event.id] = event;
        });
        
        // Update the map display
        this.loadedAreas.set(areaKey, Date.now());
        this.updateDisplay(zoomLevel);
      }
    } catch (error) {
      console.error(`[${this.groupId}] Error fetching Ticketmaster events:`, error);
    }
  }

  /**
   * Updates the display based on current zoom level
   */
  private updateDisplay(zoomLevel: number): void {
    if (!this.eventsDataSource || !this.clustersDataSource) return;
    
    // Clear existing entities
    this.eventsDataSource.entities.removeAll();
    this.clustersDataSource.entities.removeAll();
    
    if (zoomLevel >= 12) {
      // High zoom - show individual events
      this.displayIndividualEvents();
      this.eventsDataSource.show = true;
      this.clustersDataSource.show = false;
    } else {
      // Low zoom - show clusters
      this.displayClusteredEvents(zoomLevel);
      this.eventsDataSource.show = false;
      this.clustersDataSource.show = true;
    }
  }
  
  /**
   * Displays individual event markers
   */
  private displayIndividualEvents(): void {
    if (!this.eventsDataSource) return;
    
    Object.values(this.events).forEach(event => {
      const venue = event._embedded?.venues?.[0];
      if (!venue?.location) return;
      
      const lat = parseFloat(venue.location.latitude);
      const lon = parseFloat(venue.location.longitude);
      
      if (isNaN(lat) || isNaN(lon)) return;
      
      this.eventsDataSource!.entities.add({
        id: `event-${event.id}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        point: {
          pixelSize: 10,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: event.name,
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -15),
          show: false // Only show on hover
        }
      });
    });
  }
  
  /**
   * Displays clustered event markers for zoomed-out views
   */
  private displayClusteredEvents(zoomLevel: number): void {
    if (!this.clustersDataSource) return;
    
    // Group events by geographic region
    const clusters: Record<string, ClusteredEvent> = {};
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
          regionKey
        };
      }
      
      clusters[regionKey].count++;
    });
    
    // Display clusters
    Object.values(clusters).forEach(cluster => {
      // Scale the point size based on count
      const size = Math.min(30, 10 + (cluster.count * 0.5));
      
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
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -size - 5),
          show: true
        }
      });
    });
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