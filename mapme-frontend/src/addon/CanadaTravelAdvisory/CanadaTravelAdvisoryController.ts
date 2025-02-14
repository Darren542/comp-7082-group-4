import { AddonControlInterface, AddonState } from "../../components/AddonManagerContext/AddonManagerController";
import { CesiumContextType } from "../../components/CesiumContext/useCesiumContext";
import * as Cesium from "cesium";

/**
 * Maps advisory-state to a Cesium color.
 */
function getColorForAdvisoryState(advisoryState: number): Cesium.Color {
  switch (advisoryState) {
    case 0: return Cesium.Color.GREEN.withAlpha(0.5);   // Safe
    case 1: return Cesium.Color.YELLOW.withAlpha(0.5);  // Caution
    case 2: return Cesium.Color.ORANGE.withAlpha(0.5);  // Avoid non-essential travel
    case 3: return Cesium.Color.RED.withAlpha(0.5);     // Avoid all travel
    default: return Cesium.Color.GRAY.withAlpha(0.5);   // No data
  }
}

export class CanadaTravelAdvisoryController implements AddonControlInterface {
  private state = AddonState.uninstalled;
  public groupId = "canadaTravelAdvisory";
  private apiLocation = "http://localhost:5000/api/testAddon";
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

  install(): Promise<boolean> {
    console.log(`[${this.groupId}] Installing...`);
    // Should install the addon
    // If there are any first-time setup steps, they should be done here
    // Might go straight to running if no setup is needed
    this.state = AddonState.preinit;
    return Promise.resolve(true);
  }

  /**
   * This function should be called to initialize the addon.
   * @returns true if the addon was initialized successfully, false otherwise
   */
  async initialize(): Promise<boolean> {
    console.log(`[${this.groupId}] Initializing...`);
    // Should do any logic needed to initialize the addon
    // May include sending authentication requests, setting up connections, etc.

    // I was having race condition problems with this getting called again before it finished
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
        if (!entity.polygon) return; // Ensure polygon exists
      
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

  start(): void {
    // Should not start if the addon is not initialized
    if (!(this.state === AddonState.initialized || this.state === AddonState.stopped)) {
      console.error(`[${this.groupId}] Cannot start, addon is not initialized!`);
      return;
    }
    // Should start requesting data, sending data, etc.
    console.log(`[${this.groupId}] Starting...`);
    
    // Set the visibility of the GeoJsonDataSource to true
    if (this.countryGeoJsonDataSource) {
      this.countryGeoJsonDataSource.show = true;
    } else {
      console.error(`[${this.groupId}] Cannot start, GeoJsonDataSource is not available!`);
      return;
    }
    this.state = AddonState.running;
  }

  stop(): void {
    console.log("[TestAddon] Stopping...");
    if (this.state === AddonState.running) {
      // Should stop requesting data, sending data, etc.
      this.state = AddonState.stopped;

      if (this.countryGeoJsonDataSource) {
        this.countryGeoJsonDataSource.show = false
      }
    } else {
      console.error(`[${this.groupId}] Cannot stop, addon is not running!`);
    }
  }

  destroy(): void {
    // What state it should go to may depend on why it was destroyed
    console.log(`[${this.groupId}] Destroying...`);
    const viewer = this.cesium.getViewer();
    if (this.countryGeoJsonDataSource && viewer) {
      viewer.dataSources.remove(this.countryGeoJsonDataSource, true);
      this.countryGeoJsonDataSource = null;
    }
    this.state = AddonState.preinit;
  }

  getState(): AddonState {
    return this.state;
  }

  setOptions(options: Record<string, any>): void {
    console.log("[TestAddon] Setting options...", options);
    // Should set any options that the addon needs
    if (options.apiLocation) {
      this.apiLocation = options.apiLocation;
    }
  }

  getLastDataUpdate(): string {
    if (!this.travelAdvisoryJson) return "No data";
    return this.travelAdvisoryJson?.metadata?.generated?.date || "No data";
  }
}
