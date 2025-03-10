
import React, { useEffect, useRef } from "react";
import { Viewer, Entity, Cartesian3, Color, CustomDataSource, Ion, Math } from "cesium";
import { CesiumContext } from "./useCesiumContext";
import { Header } from "../Header";
import { APP_CONFIG } from "../../config";

interface EntityGroup {
  dataSource: CustomDataSource;
}

export const CesiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const viewerRef = useRef<Viewer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const entityGroupsRef = useRef<{ [key: string]: EntityGroup }>({}); // Track groups by groupId
  const [viewer, setViewer] = React.useState<Viewer | null>(null);

  useEffect(() => {
    Ion.defaultAccessToken = APP_CONFIG.CESIUM_ACCESS_TOKEN;
    if (!containerRef.current || viewerRef.current) return;

    viewerRef.current = new Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      terrainProvider: undefined,
    });

    // gets center coordiantes of the map
    viewerRef.current.camera.moveEnd.addEventListener(() => {
      if (viewerRef.current) {
        const center = viewerRef.current.camera.pickEllipsoid(
          new Cartesian3(
            viewerRef.current.canvas.clientWidth / 2,
            viewerRef.current.canvas.clientHeight / 2
          )
        );
        
        if (center) {
          // Convert Cartesian3 to longitude/latitude
          const cartographic = viewerRef.current.scene.globe.ellipsoid.cartesianToCartographic(center);
          const longitude = Math.toDegrees(cartographic.longitude);
          const latitude = Math.toDegrees(cartographic.latitude);
          
          console.log("Map center:", { longitude, latitude });
        }
      }
    });

    setViewer(viewerRef.current);
  

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        setViewer(null);
      }
    };
  }, []);

  const addEntityToGroup = (
    groupId: string,
    { lat, lon, color = Color.RED, id }: { lat: number; lon: number; color?: Color; id?: string }
  ) => {
    if (!viewerRef.current) return;

    // Ensure the group exists
    if (!entityGroupsRef.current[groupId]) {
      const dataSource = new CustomDataSource(groupId);
      viewerRef.current.dataSources.add(dataSource);
      entityGroupsRef.current[groupId] = { dataSource };
    }

    // Add the entity to the group's data source
    entityGroupsRef.current[groupId].dataSource.entities.add(
      new Entity({
        id: id || `entity-${groupId}-${lat}-${lon}`,
        position: Cartesian3.fromDegrees(lon, lat),
        point: { pixelSize: 10, color: color || Color.RED },
      })
    );
  };

  const clearGroup = (groupId: string) => {
    if (!entityGroupsRef.current[groupId]) return;

    // Remove all entities in the group
    console.log("[CesiumProvider] Clearing group", groupId);
    entityGroupsRef.current[groupId].dataSource.entities.removeAll();
    
    // Tell Cesium to reload the data source
    // viewerRef.current?.dataSources.remove(entityGroupsRef.current[groupId].dataSource, true);
  };

  const removeEntityFromGroup = (groupId: string, entityId: string) => {
    if (!entityGroupsRef.current[groupId]) return;

    // Remove a specific entity by ID
    const entity = entityGroupsRef.current[groupId].dataSource.entities.getById(entityId);
    if (entity) {
      entityGroupsRef.current[groupId].dataSource.entities.remove(entity);
    }
  };

  const showGroup = (groupId: string, show: boolean) => {
    if (!entityGroupsRef.current[groupId]) return;

    // Show or hide the group
    entityGroupsRef.current[groupId].dataSource.show = show;
  };

  const getViewer = () => viewerRef.current;

  const returnValue = {
    viewer,
    addEntityToGroup,
    clearGroup,
    removeEntityFromGroup,
    showGroup,
    getViewer,
  }

  return (
    <CesiumContext.Provider value={returnValue}>
      <div>
        <div style={{ width: "100%", height: "60px", overflow: "hidden" }}>
            <Header />
        </div>
        <div style={{ display: "flex", width: "100vw", height: "calc(100vh - 60px)" }}>
          {children}
          <div ref={containerRef} style={{ width: "100%", height: "calc(100vh - 60px)" }} />
        </div>
      </div>
    </CesiumContext.Provider>
  );
};

