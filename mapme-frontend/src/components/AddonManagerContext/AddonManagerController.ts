import { EventEmitter } from "events";

import { TestAddon } from "../../addon/testAddon/hooks/TestAddon";
import { TestAddon2 } from "../../addon/testAddon2/hooks/TestAddon2";
import { CesiumContextType } from "../CesiumContext/useCesiumContext";
import { CanadaTravelAdvisoryController } from "../../addon/CanadaTravelAdvisory/CanadaTravelAdvisoryController";

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
  install: () => Promise<boolean>;
  initialize: () => Promise<boolean>;
  start: () => void;
  stop: () => void;
  destroy: () => void;
  getState: () => AddonState;
  setInstalledPreviously: () => void;
  setOptions: (options: Record<string, any>) => void;
  groupId: string;
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
export class AddonManagerController extends EventEmitter {
  private addons: Record<string, AddonControlInterface> = {};
  private serverAddons: ServerAddonType[] = [];
  private cesium: CesiumContextType;

  constructor(cesium: CesiumContextType) {
    super();
    // Register available addons
    this.addons = {
      canadaTravelAdvisory: new CanadaTravelAdvisoryController(cesium),
      // testAddon: new TestAddon(cesium),
      // testAddon2: new TestAddon2(cesium),
      // testAddon3: new TestAddon2(cesium),
      // testAddon4: new TestAddon2(cesium),
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
      console.log(`[AddonManagerController] Found installed addon: ${name}`);

      // Initialize the addon
      const isInitialized = await this.addons[name].initialize();
      if (!isInitialized) {
        console.error(`[AddonManagerController] Failed to initialize addon: ${name}`);
        return;
      }

      // Start the addon if it is active
      console.log(`[AddonManagerController] Starting active addon: ${name}`);
      this.addons[name].start();

    } else {
      console.warn(`[AddonManagerController] Addon ${name} is not registered.`);
    }
  }

  /**
   * Configuration details from server, that are needed before starting the addon.
   */
  configureAddonStatus(addon: ServerAddonType) {
    if (!this.addons[addon.name]) {
      console.warn(`[AddonManagerController] Addon ${addon.name} is not registered.`);
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
      console.log("[AddonManagerController] Addons loaded successfully.");
      console.log(data);
      AllAddons = data;
      this.serverAddons = data;
      this.emit("addonsLoaded");
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
      console.log(`[AddonManagerController] Starting addon: ${name}`);
      this.addons[name].start();
    } else {
      console.warn(`[AddonManagerController] Addon ${name} is not registered.`);
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

  /*
    * This function should be called when the user changes the status of an addon.
    * The new addon status should be saved to the server.
    * Then the correct functions to get the addon running should be called
    * based on what the change in status was.
    */
  async updateAddonStatus(addon: ServerAddonType): Promise<ServerAddonType[]> {
    try {
      console.log(`[AddonManagerController] Updating addon status: ${addon.name} to installed: ${addon.installed}, active: ${addon.active}`);
      // Send a post request to the server to update the status of the addon
      const response = await fetch("http://localhost:5000/api/addons", {
        method: "POST",
        body: JSON.stringify({...addon, addon: undefined}),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        console.error(`Error: ${response.status}`);
        return [];
      }
      const data: ServerAddonType[] = await response.json();
      const oldStatus = this.serverAddons.find((a) => a.name === addon.name);
      const newStatus = data.find((a) => a.name === addon.name);
      if (oldStatus && newStatus && this.addons[addon.name]) {
        // if the addon was installed and is now active, start it
        if (oldStatus.installed && !oldStatus.active && newStatus.active) {
          console.log(`[AddonManagerController] Starting addon: ${addon.name}`);
          const addonStatus = this.addons[addon.name].getState();
          if (addonStatus !== AddonState.stopped) {
            this.addons[addon.name].initialize();
          }
          this.addons[addon.name].start();
        }
        // if the addon was active and is now inactive, stop it
        if (oldStatus.active && !newStatus.active) {
          this.addons[addon.name].stop();
        }
        // if the addon was installed and is now uninstalled, destroy it
        if (oldStatus.installed && !newStatus.installed) {
          this.addons[addon.name].destroy();
        }
        // if the addon was uninstalled and is now installed, initialize it
        if (!oldStatus.installed && newStatus.installed) {
          await this.addons[addon.name].install();
          await this.addons[addon.name].initialize();
          this.addons[addon.name].start();
        }
      }
      this.serverAddons = data;
      return data;
    }
    catch (err: any) {
      console.error(err.message);
    }
    return [];
  }

  getAddonController(name: string): AddonControlInterface | undefined {
    return this.addons[name];
  }
}
