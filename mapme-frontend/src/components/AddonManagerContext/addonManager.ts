import { TestAddon } from "../../addon/testAddon/hooks/useTestAddon";
import { CesiumContextType } from "../CesiumContext/useCesiumContext";

/**
 * A enum of the different states an addon can be in.
 */
export enum AddonState {
  preinit = "preinit",
  initialized = "initialized",
  running = "running",
  stopped = "stopped",
  disabled = "disabled",
  uninstalled = "uninstalled",
}

/**
 * This interface should be implemented by all addons.
 * We should get this finalized before we start implementing the addons.
 */
export interface AddonControlInterface {
  install: () => void;
  initialize: () => boolean;
  start: () => void;
  stop: () => void;
  destroy: () => void;
  getState: () => AddonState;
  setInstalledPreviously: () => void;
  setOptions: (options: Record<string, any>) => void;
  // constructor: (cesium: CesiumContextType) => void;
}

/**
 * This type matches the response from the server.
 */
export type ServerAddonType = {
  name: string;
  desc: string;
  active: boolean;
  installed: boolean;
  apiLocation: string;
  addon?: AddonControlInterface;
};

/**
 * This Class is responsible for managing the addons.
 * It should be used as a singleton.
 * Any changes to the addons status should be done through this class.
 */
export class AddonManager {
  private addons: Record<string, AddonControlInterface> = {};
  private serverAddons: ServerAddonType[] = [];
  private cesium: CesiumContextType;

  constructor(cesium: CesiumContextType) {
    // Register available addons
    this.addons = {
      testAddon: new TestAddon(cesium),
      testAddon2: new TestAddon(cesium),
      testAddon3: new TestAddon(cesium),
      testAddon4: new TestAddon(cesium),
    };

    this.cesium = cesium;
  }

  /**
   * We should parallelize the initialization of addons.
   * @param name the name of the addon is registered with
   * @returns 
   */
  async initializeAndStartAddon(name: string) {
    if (this.addons[name]) {
      console.log(`[AddonManager] Found installed addon: ${name}`);

      // Initialize the addon
      const isInitialized = this.addons[name].initialize();
      if (!isInitialized) {
        console.error(`[AddonManager] Failed to initialize addon: ${name}`);
        return;
      }

      // Start the addon if it is active
      console.log(`[AddonManager] Starting active addon: ${name}`);
      this.addons[name].start();

    } else {
      console.warn(`[AddonManager] Addon ${name} is not registered.`);
    }
  }

  /**
   * Configuration details from server, that are needed before starting the addon.
   */
  configureAddonStatus(addon: ServerAddonType) {
    if (!this.addons[addon.name]) {
      console.warn(`[AddonManager] Addon ${addon.name} is not registered.`);
      return;
    }

    this.addons[addon.name].setOptions({ apiLocation: addon.apiLocation });
    if (addon.installed) this.addons[addon.name].setInstalledPreviously();
  }


  async loadAddons() {
    let AllAddons: ServerAddonType[] = []

    // Fetch installed addons from the server
    // const installedAddons = await (await import("./serverResponse")).getInstalledAddons();
    try {
      // Should going to have it fetch the full list of all addons for now
      // We can see about breaking this up later if needed
      const response = await fetch("http://localhost:5000/api/addons");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data: ServerAddonType[] = await response.json();
      console.log(data);
      AllAddons = data;
      this.serverAddons = data;
    } catch (err: any) {
      console.error(err.message);
    }

    for (const addon of AllAddons) {
      this.configureAddonStatus(addon);
      const { name, active, installed } = addon;
      if (installed && active) {
        await this.initializeAndStartAddon(name);
      }
    }
  }

  async startAddon(name: string) {
    if (this.addons[name]) {
      console.log(`[AddonManager] Starting addon: ${name}`);
      this.addons[name].start();
    } else {
      console.warn(`[AddonManager] Addon ${name} is not registered.`);
    }
  }

  getInstalledAddons(): ServerAddonType[] {
    return this.serverAddons
    .filter((addon) => addon.installed)
    .filter((addon) => this.addons[addon.name])
    .map((addon) => ({ addon: this.addons[addon.name], ...addon }));
  }

  getAvailableAddons(): ServerAddonType[] {
    return this.serverAddons
      .filter((addon) => !addon.installed)
      .filter((addon) => this.addons[addon.name])
      .map((addon) => ({ addon: this.addons[addon.name], ...addon }));
  }
}
