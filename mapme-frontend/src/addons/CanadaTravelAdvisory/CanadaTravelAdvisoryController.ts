import { AddonControlInterface, AddonState } from "../../components/AddonManagerContext/AddonManagerController";
import { CesiumContextType } from "../../components/CesiumContext/useCesiumContext";
import * as Cesium from "cesium";
import { ADDONS } from "../../config";

/**
 * Maps advisory-state to a Cesium color.
 */
function getColorForAdvisoryState(advisoryState: number): Cesium.Color {
  switch (advisoryState) {
    case 0: return Cesium.Color.GREEN.withAlpha(0.5);   // Take normal security precautions
    case 1: return Cesium.Color.YELLOW.withAlpha(0.5);  // Exercise a high degree of caution
    case 2: return Cesium.Color.ORANGE.withAlpha(0.5);  // Avoid non-essential travel
    case 3: return Cesium.Color.RED.withAlpha(0.5);     // Avoid all travel
    default: return Cesium.Color.GRAY.withAlpha(0.5);   // No data
  }
}

export class CanadaTravelAdvisoryController implements AddonControlInterface {
  private state = AddonState.uninstalled;
  public groupId = ADDONS.CANADA_TRAVEL_ADVISORY;
  // TODO - Add a backend API to Cache and fetch new data.
  private apiLocation = "http://localhost:5000/api/canadaTravelAdvisory";
  private countryGeoJsonDataSource: Cesium.GeoJsonDataSource | null = null;
  private travelAdvisoryJson: any = null;
  private loading = false;

  constructor(private cesium: CesiumContextType) {
    this.cesium = cesium;
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

    // I was having race condition problems with this getting called again before it finished initializing
    // so I added a loading flag to prevent that.
    // This is not the best solution, but it works for now.
    if (this.countryGeoJsonDataSource || this.loading) {
      return true;
    }
    const viewer = this.cesium.getViewer();
    if (!viewer) {
      console.error(`[${this.groupId}] Cannot initialize, viewer is not available!`);
      return false;
    }
    try {
      this.loading = true
      
      const reponse = await fetch("/countries.geojson");
      const json = await reponse.json();
      const geoJsonDataSource = await Cesium.GeoJsonDataSource.load(json);
      this.countryGeoJsonDataSource = geoJsonDataSource;
      viewer.dataSources.add(geoJsonDataSource);
  
      const travelAdvisory = await fetch("/canadaTravelAdvisory.json");
      this.travelAdvisoryJson = await travelAdvisory.json();
  
      // Apply the travel advisory state to the countries
      geoJsonDataSource.entities.values.forEach((entity) => {
        if (!entity.polygon) return;
      
        // There are some geographies that do not have ISO_A2 codes
        // Should probably handle that case later.
        const ISO_A2 = entity.properties?.ISO_A2;
        const stateLevel = this.travelAdvisoryJson.data?.[ISO_A2]?.["advisory-state"] ?? 5;
        entity.polygon.material = new Cesium.ColorMaterialProperty(
          ISO_A2 == "CA" ? Cesium.Color.BLUE.withAlpha(0.5) : getColorForAdvisoryState(stateLevel ?? 5) 
        );
      
        entity.polygon.outline = new Cesium.ConstantProperty(true);
        entity.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.BLACK);
        entity.polygon.outlineWidth = new Cesium.ConstantProperty(4);
      });
      this.state = AddonState.initialized;
      return true;
    } catch {
      console.error(`[${this.groupId}] Failed to initialize addon!`);
      if (this.countryGeoJsonDataSource) {
        viewer.dataSources.remove(this.countryGeoJsonDataSource, true);
        this.countryGeoJsonDataSource = null;
      }
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
    // Should start requesting data, sending data, etc.
    console.log(`[${this.groupId}] Starting...`);
    
    // Set the visibility of the GeoJsonDataSource to true
    if (this.countryGeoJsonDataSource) {
      this.countryGeoJsonDataSource.show = true;
    } else {
      console.error(`[${this.groupId}] Cannot start, GeoJsonDataSource is not available!`);
      return Promise.resolve(false);
    }
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
      if (this.countryGeoJsonDataSource) {
        this.countryGeoJsonDataSource.show = false
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
    const viewer = this.cesium.getViewer();
    if (this.countryGeoJsonDataSource && viewer) {
      viewer.dataSources.remove(this.countryGeoJsonDataSource, true);
      this.countryGeoJsonDataSource = null;
    }
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
    // Should set any options that the addon needs
    if (options.apiLocation) {
      this.apiLocation = options.apiLocation;
    }
  }

  /**
   * This function is specfic to the Canada Travel Advisory addon.
   * You can add any other functions that are specific to your addon to the addon controll class.
   */
  getLastDataUpdate(): string {
    if (!this.travelAdvisoryJson) return "No data";
    return this.travelAdvisoryJson?.metadata?.generated?.date || "No data";
  }
}
