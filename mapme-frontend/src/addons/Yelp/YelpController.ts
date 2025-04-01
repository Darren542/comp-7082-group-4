import { AddonControlInterface, AddonState } from "../../components/AddonManagerContext/AddonManagerController";
import { CesiumContextType } from "../../components/CesiumContext/useCesiumContext";
import * as Cesium from "cesium";
import { ADDONS } from "../../config";
import { debounce } from "lodash";
import { createClient } from "@supabase/supabase-js";

interface YelpPlace {
  id: string;
  name: string;
  url: string;
  rating: number;
  image_url: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  categories: {
    title: string;
  }[];
  location: {
    address1: string;
    city: string;
    country: string;
  };
}

export class YelpController implements AddonControlInterface {
  private state = AddonState.uninstalled;
  public groupId = ADDONS.YELP_PLACES;
  private dataSource: Cesium.CustomDataSource | null = null;
  private places: Record<string, YelpPlace> = {};
  private loadedAreas = new Map<string, number>();
  private cacheExpiryTime = 5 * 60 * 1000; // 5 minutes
  private cameraMoveHandler: (() => void) | null = null;
  private supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

  constructor(private cesium: CesiumContextType) {
    this.cameraMoveHandler = debounce(this.handleCameraMove.bind(this), 500);
  }

  setInstalledPreviously(): void {
    this.state = AddonState.preinit;
  }

  async install(): Promise<boolean> {
    this.state = AddonState.preinit;
    return true;
  }

  async initialize(): Promise<boolean> {
    const viewer = this.cesium.getViewer();
    if (!viewer) return false;

    this.dataSource = new Cesium.CustomDataSource("yelp-places");
    await viewer.dataSources.add(this.dataSource);

    this.state = AddonState.initialized;
    return true;
  }

  async start(): Promise<boolean> {
    if (this.state !== AddonState.initialized && this.state !== AddonState.stopped) return false;

    const viewer = this.cesium.getViewer();
    if (!viewer || !this.dataSource) return false;

    this.dataSource.show = true;
    viewer.camera.moveEnd.addEventListener(this.cameraMoveHandler!);
    this.handleCameraMove();

    this.state = AddonState.running;
    return true;
  }

  async stop(): Promise<boolean> {
    const viewer = this.cesium.getViewer();
    if (viewer && this.cameraMoveHandler) {
      viewer.camera.moveEnd.removeEventListener(this.cameraMoveHandler);
    }
    if (this.dataSource) this.dataSource.show = false;
    this.state = AddonState.stopped;
    return true;
  }

  async destroy(): Promise<boolean> {
    if (this.state === AddonState.running) await this.stop();
    const viewer = this.cesium.getViewer();
    if (viewer && this.dataSource) {
      viewer.dataSources.remove(this.dataSource);
      this.dataSource = null;
    }
    this.places = {};
    this.loadedAreas.clear();
    this.state = AddonState.preinit;
    return true;
  }

  async uninstall(): Promise<boolean> {
    if (this.state === AddonState.running) await this.stop();
    if (this.state === AddonState.initialized || this.state === AddonState.stopped) await this.destroy();
    this.state = AddonState.uninstalled;
    return true;
  }

  getState(): AddonState {
    return this.state;
  }

  setOptions(options: Record<string, any>): void {
    if (options.cacheExpiryTime) {
      this.cacheExpiryTime = options.cacheExpiryTime;
    }
  }

  private handleCameraMove(): void {
    if (this.state !== AddonState.running) return;
    const viewer = this.cesium.getViewer();
    if (!viewer) return;

    const center = viewer.camera.pickEllipsoid(
      new Cesium.Cartesian2(viewer.canvas.clientWidth / 2, viewer.canvas.clientHeight / 2)
    );
    if (!center) return;

    const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(center);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const height = viewer.camera.positionCartographic.height;
    const zoomLevel = this.getZoomLevelFromHeight(height);
    const radius = this.getRadiusForZoomLevel(zoomLevel);

    this.loadPlaces(latitude, longitude, radius);
  }

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

  private getRadiusForZoomLevel(zoomLevel: number): number {
    return Math.max(100, Math.min(1000, 1500 - (zoomLevel * 40)));
  }

  private async loadPlaces(latitude: number, longitude: number, radius: number): Promise<void> {
    const areaKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
    const lastLoaded = this.loadedAreas.get(areaKey);
    if (lastLoaded && Date.now() - lastLoaded < this.cacheExpiryTime) return;

    const { data, error } = await this.supabase.functions.invoke("yelp", {
      body: { latitude, longitude, radius }
    }) as { data: YelpPlace[], error: any };

    if (error || !data) return;

    this.places = {};
    if (this.dataSource) this.dataSource.entities.removeAll();

    data.forEach(place => {
      this.places[place.id] = place;

      if (!place.coordinates?.latitude || !place.coordinates?.longitude) return;

      const description = `
        <div>
          <h3>${place.name}</h3>
          <p><strong>Rating:</strong> ${place.rating}</p>
          <p><strong>Category:</strong> ${place.categories?.[0]?.title ?? "N/A"}</p>
          <p><strong>Address:</strong> ${place.location?.address1 ?? "N/A"}, ${place.location?.city}</p>
          ${place.url ? `<p><a href="${place.url}" target="_blank">View on Yelp</a></p>` : ""}
        </div>
      `;

      this.dataSource?.entities.add({
        id: `yelp-${place.id}`,
        position: Cesium.Cartesian3.fromDegrees(place.coordinates.longitude, place.coordinates.latitude),
        billboard: {
          image: "yelpMarker.png",
          width: 32,
          height: 32,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        },
        label: {
          text: place.name,
          font: "14px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -32)
        },
        description: description
      });
    });

    this.loadedAreas.set(areaKey, Date.now());
  }

  getPlaceStats(): { totalPlaces: number; loadedAreas: number } {
    return {
      totalPlaces: Object.keys(this.places).length,
      loadedAreas: this.loadedAreas.size,
    };
  }
}
