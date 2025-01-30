
import React, { useEffect, useRef } from "react";
import { Viewer, Entity, Cartesian3, Color, CustomDataSource, Ion } from "cesium";
import { CesiumContext } from "./useCesiumContext";
import { Topbar } from "../Topbar";

interface EntityGroup {
  dataSource: CustomDataSource;
}

export const CesiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const viewerRef = useRef<Viewer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const entityGroupsRef = useRef<{ [key: string]: EntityGroup }>({}); // Track groups by groupId

  useEffect(() => {
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ACCESS_TOKEN as string;
    if (!containerRef.current || viewerRef.current) return;

    viewerRef.current = new Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      terrainProvider: undefined,
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
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
    entityGroupsRef.current[groupId].dataSource.entities.removeAll();
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

  const returnValue = {
    viewer: viewerRef.current,
    addEntityToGroup,
    clearGroup,
    removeEntityFromGroup,
    showGroup,
  }

  return (
    <CesiumContext.Provider value={returnValue}>
      <div>
        <Topbar />
        <div style={{ display: "flex", width: "100vw", height: "calc(100vh - 60px)" }}>
          {children}
          <div ref={containerRef} style={{ width: "100%", height: "calc(100vh - 60px)" }} />
        </div>
      </div>
    </CesiumContext.Provider>
  );
};

