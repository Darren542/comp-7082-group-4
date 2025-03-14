import { EventEmitter } from "events";
import { CesiumContextType } from "../CesiumContext/useCesiumContext";
import { CanadaTravelAdvisoryController } from "../../addons/CanadaTravelAdvisory/CanadaTravelAdvisoryController";
import { TicketmasterEventsController } from "../../addons/TicketMaster/TicketMasterController";
import { APP_CONFIG } from "../../config";

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
 */
export interface AddonControlInterface {
  install: () => Promise<boolean>;
  initialize: () => Promise<boolean>;
  start: () => Promise<boolean>;
  stop: () => Promise<boolean>;
  destroy: () => Promise<boolean>;
  uninstall: () => Promise<boolean>;
  getState: () => AddonState;
  setInstalledPreviously: () => void;
  setOptions: (options: Record<string, any>) => void;
  groupId: string;
  // You can't enforce constructors in an interface
  // But this is how it should look when you make a new addon
  // constructor: (cesium: CesiumContextType) => void;
}

/**
 * This type matches the response from the server.
 */
export type ServerAddonType = {
  id: string;
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
    // Register available addons here
    this.addons = {
      canadaTravelAdvisory: new CanadaTravelAdvisoryController(cesium),
      Ticketmaster: new TicketmasterEventsController(cesium),
    };

    this.cesium = cesium;
  }

  /**
   * We should parallelize the initialization of addons.
   * @param id the name of the addon is registered with
   * @returns 
   */
  async initializeAndStartAddon(id: string) {
    if (this.addons[id]) {
      console.log(`[AddonManagerController] Found installed addon: ${id}`);

      // Initialize the addon
      const isInitialized = await this.addons[id].initialize();
      if (!isInitialized) {
        console.error(`[AddonManagerController] Failed to initialize addon: ${id}`);
        return;
      }

      // Start the addon if it is active
      console.log(`[AddonManagerController] Starting active addon: ${id}`);
      this.addons[id].start();

    } else {
      console.warn(`[AddonManagerController] Addon ${id} is not registered.`);
    }
  }

  /**
   * Configuration details from server, that are needed before starting the addon.
   */
  configureAddonStatus(addon: ServerAddonType) {
    if (!this.addons[addon.id]) {
      console.warn(`[AddonManagerController] Addon ${addon.id} is not registered.`);
      return;
    }

    this.addons[addon.id].setOptions({ apiLocation: addon.apiLocation });
    if (addon.installed) this.addons[addon.id].setInstalledPreviously();
  }


  async loadAddons() {
    let AllAddons: ServerAddonType[] = []

    // Fetch installed addons from the server
    // const installedAddons = await (await import("./serverResponse")).getInstalledAddons();
    try {
      // Should going to have it fetch the full list of all addons for now
      // We can see about breaking this up later if needed
      const response = await fetch("http://localhost:5001/api/addons");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data: ServerAddonType[] = await response.json();
      console.log("[AddonManagerController] Addons loaded successfully.", data);
      AllAddons = data;
      this.serverAddons = data;
      this.emit("addonsLoaded");
    } catch (err: any) {
      console.error(err.message);
    }

    for (const addon of AllAddons) {
      this.configureAddonStatus(addon);
      const { id, active, installed } = addon;
      if (installed && active) {
        await this.initializeAndStartAddon(id);
      }
    }
  }

  async startAddon(id: string) {
    if (this.addons[id]) {
      console.log(`[AddonManagerController] Starting addon: ${id}`);
      this.addons[id].start();
    } else {
      console.warn(`[AddonManagerController] Addon ${id} is not registered.`);
    }
  }

  getInstalledAddons(): ServerAddonType[] {
    return this.serverAddons
    .filter((addon) => addon.installed)
    .filter((addon) => this.addons[addon.id])
    .map((addon) => ({ addon: this.addons[addon.id], ...addon }));
  }

  getAvailableAddons(): ServerAddonType[] {
    return this.serverAddons
      .filter((addon) => !addon.installed)
      .filter((addon) => this.addons[addon.id])
      .map((addon) => ({ addon: this.addons[addon.id], ...addon }));
  }

  /*
    * This function should be called when the user changes the status of an addon.
    * The new addon status should be saved to the server.
    * Then the correct functions to get the addon running should be called
    * based on what the change in status was.
    */
  async updateAddonStatus(addon: ServerAddonType): Promise<ServerAddonType[]> {
    try {
      console.log(`[AddonManagerController] Updating addon status: ${addon.id} to installed: ${addon.installed}, active: ${addon.active}`);
      // Send a post request to the server to update the status of the addon
      const response = await fetch(`${APP_CONFIG.ADDON_MANAGER_URL}/addons`, {
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
      const oldStatus = this.serverAddons.find((a) => a.id === addon.id);
      const newStatus = data.find((a) => a.id === addon.id) as ServerAddonType;
      if (oldStatus && newStatus && this.addons[addon.id]) {
        // if the addon was installed and is now active, start it
        if (oldStatus.installed && !oldStatus.active && newStatus.active) {
          console.log(`[AddonManagerController] Starting addon: ${addon.id}`);
          const addonStatus = this.addons[addon.id].getState();
          if (addonStatus !== AddonState.stopped) {
            await this.addons[addon.id].initialize();
          }
          await this.addons[addon.id].start();
        }
        // if the addon was active and is now inactive, stop it
        if (oldStatus.active && !newStatus.active) {
          await this.addons[addon.id].stop();
        }
        // if the addon was installed and is now uninstalled, uninstall it
        if (oldStatus.installed && !newStatus.installed) {
          await this.addons[addon.id].destroy();
          await this.addons[addon.id].uninstall();
        }
        // if the addon was uninstalled and is now installed, initialize it
        if (!oldStatus.installed && newStatus.installed) {
          this.addons[addon.id].install()
            .then(() => this.addons[addon.id].initialize())
            .then(() => this.addons[addon.id].start());
          // const response = await this.addons[addon.id].initialize();
          // await this.addons[addon.id].start();
        }
      }
      this.serverAddons = this.serverAddons.map((a) => a.id === addon.id ? newStatus : a);
      return data;
    }
    catch (err: any) {
      console.error(err.message);
    }
    return [];
  }

  getAddonController(id: string): AddonControlInterface | undefined {
    return this.addons[id];
  }
}
