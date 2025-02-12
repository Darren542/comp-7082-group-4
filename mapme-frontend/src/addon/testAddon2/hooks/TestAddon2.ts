import { AddonControlInterface, AddonState } from "../../../components/AddonManagerContext/AddonManagerController";
import { CesiumContextType } from "../../../components/CesiumContext/useCesiumContext";
import { Color } from "cesium";

export class TestAddon2 implements AddonControlInterface {
  private state = AddonState.uninstalled;
  public groupId = "testAddon2";
  private apiLocation = "http://localhost:5000/api/testAddon";

  constructor(private cesium: CesiumContextType) {
    this.cesium = cesium;
  }

  /**
   * If the users settings indicate that the addon was installed previously, this function should be called.
   * Could maybe rethink this, it is just to get state to preinit.
   */
  setInstalledPreviously(): void {
    console.log("[TestAddon2] already installed...");
    this.state = AddonState.preinit;
  }

  install(): Promise<boolean> {
    console.log("[TestAddon2] Installing...");
    // Should install the addon
    // If there are any first-time setup steps, they should be done here
    // Might go straight to running if no setup is needed
    this.state = AddonState.preinit;
    return this.initialize();
  }

  /**
   * This function should be called to initialize the addon.
   * @returns true if the addon was initialized successfully, false otherwise
   */
  initialize(): Promise<boolean> {
    console.log("[TestAddon2] Initializing...");
    // Should do any logic needed to initialize the addon
    // May include sending authentication requests, setting up connections, etc.
    this.state = AddonState.initialized;
    return Promise.resolve(true);
  }

  start(): void {
    // Should not start if the addon is not initialized
    if (!(this.state === AddonState.initialized || this.state === AddonState.stopped)) {
      console.error("[TestAddon2] Cannot start, addon is not initialized!");
      return;
    }
    console.log("[TestAddon2] Starting...");
    this.state = AddonState.running;

    this.cesium.addEntityToGroup("testAddon2", {
      lat: Math.random() * 90,
      lon: Math.random() * 180,
      color: Color.GREEN,
      id: `${this.groupId}-entity-${Math.random()}`,
    });

    // Should start requesting data, sending data, etc.
  }

  stop(): void {
    console.log("[TestAddon] Stopping...");
    if (this.state === AddonState.running) {
      // Should stop requesting data, sending data, etc.
      this.state = AddonState.stopped;

      this.cesium.removeEntityFromGroup("testAddon2", "testAddon2");
    } else {
      console.error("[TestAddon2] Cannot stop, addon is not running!");
    }
  }

  destroy(): void {
    console.log("[TestAddon2] Destroying...");
    // What state it should go to depends on why it was destroyed
    this.cesium.clearGroup("testAddon2");
    this.state = AddonState.preinit;
  }

  getState(): AddonState {
    return this.state;
  }

  setOptions(options: Record<string, any>): void {
    console.log("[TestAddon2] Setting options...", options);
    // Should set any options that the addon needs
    if (options.apiLocation) {
      this.apiLocation = options.apiLocation;
    }
  }
}
