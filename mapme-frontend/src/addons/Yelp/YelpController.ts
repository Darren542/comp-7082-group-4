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

interface ClusteredPlace {
  latitude: number;
  longitude: number;
  count: number;
  places: YelpPlace[];
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

    this.loadPlaces(latitude, longitude, radius, zoomLevel);
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

  private async loadPlaces(latitude: number, longitude: number, radius: number, zoomLevel: number): Promise<void> {
    const areaKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
    const lastLoaded = this.loadedAreas.get(areaKey);
    if (lastLoaded && Date.now() - lastLoaded < this.cacheExpiryTime) return;
  
    const { data, error } = await this.supabase.functions.invoke("yelp", {
      body: { latitude, longitude, radius }
    }) as { data: YelpPlace[], error: any };
  
    if (error || !data || !this.dataSource) return;
  
    this.places = {};
    this.dataSource.entities.removeAll();
  
    // Grouping logic (based on zoom level)
    const clusterPrecision = zoomLevel < 14 ? 2 : 5;
    const clusters: Record<string, ClusteredPlace> = {};
  
    for (const place of data) {
      if (!place.coordinates?.latitude || !place.coordinates?.longitude) continue;
  
      const lat = parseFloat(place.coordinates.latitude.toFixed(clusterPrecision));
      const lon = parseFloat(place.coordinates.longitude.toFixed(clusterPrecision));
      const key = `${lat}-${lon}`;
  
      if (!clusters[key]) {
        clusters[key] = { latitude: lat, longitude: lon, count: 0, places: [] };
      }
      clusters[key].places.push(place);
      clusters[key].count++;
    }
  
    for (const cluster of Object.values(clusters)) {
      const mostRelevant = cluster.places[0];
  
      const labelText = cluster.count > 1
        ? `${mostRelevant.name} (+${cluster.count - 1} more)`
        : mostRelevant.name;
  
      const description = `
        <div style="
          font-family: 'Segoe UI', sans-serif;
          background: white;
          border-radius: 12px;
          padding: 16px;
          max-width: 280px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        ">
    <h3 style="font-size: 1.2em; color: #d32323; margin-bottom: 8px;">${mostRelevant.name}</h3>
    <p style="margin: 4px 0; color: #2b6cb0;"><strong>Rating:</strong> ${mostRelevant.rating}</p>
    <p style="margin: 4px 0; color: #2b6cb0;"><strong>Category:</strong> ${mostRelevant.categories?.[0]?.title ?? "N/A"}</p>
    <p style="margin: 4px 0; color: #2b6cb0;"><strong>Address:</strong> ${mostRelevant.location?.address1 ?? "N/A"}, ${mostRelevant.location?.city}</p>
    ${
      mostRelevant.url
        ? `<p style="margin: 4px 0;"><a href="${mostRelevant.url}" target="_blank" style="color: #0073bb; text-decoration: none; font-weight: 500;">View on Yelp</a></p>`
        : ""
    }
  </div>
`;
  
      this.dataSource.entities.add({
        id: `yelp-${mostRelevant.id}`,
        name: mostRelevant.name,
        position: Cesium.Cartesian3.fromDegrees(cluster.longitude, cluster.latitude),
        billboard: {
          image: "/pin.png",
          width: 32,
          height: 32,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scaleByDistance: new Cesium.NearFarScalar(100, 1.0, 20000, 0.3)
        },
        label: {
          text: labelText,
          font: "14px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -32),
          scaleByDistance: new Cesium.NearFarScalar(100, 1.0, 8000, 0.0),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000)
        },
        description
      });
    }
  
    this.loadedAreas.set(areaKey, Date.now());
  }
  

  getPlaceStats(): { totalPlaces: number; loadedAreas: number } {
    return {
      totalPlaces: Object.keys(this.places).length,
      loadedAreas: this.loadedAreas.size,
    };
  }
}
