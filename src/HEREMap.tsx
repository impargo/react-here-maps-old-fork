import { debounce, uniqueId } from "lodash";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import { HEREMapContext } from "./context";
import { loadScripts } from "./utils/cache";
import getPlatform from "./utils/get-platform";
import { Language } from "./utils/languages";

// declare an interface containing the required and potential
// props that can be passed to the HEREMap component
export interface HEREMapProps extends H.Map.Options {
  children: React.ReactNode;
  apiKey: string;
  animateCenter?: boolean;
  animateZoom?: boolean;
  hidpi?: boolean;
  interactive?: boolean;
  lg?: Language;
  secure?: boolean;
  routes?: object[];
  truckRestrictions?: boolean;
  trafficLayer?: boolean;
  incidentsLayer?: boolean;
  useSatellite?: boolean;
  disableMapSettings?: boolean;
  onMapAvailable?: (state: HEREMapState) => void;
  language?: string;
  /**
   * Also known as environmental zones.
   */
  congestion?: boolean;
  useVectorTiles?: boolean;
  onScriptLoadError?: (failedScripts: string[]) => void;
}

// declare an interface containing the potential state flags
export interface HEREMapState {
  map?: H.Map;
  behavior?: H.mapevents.Behavior;
  ui?: H.ui.UI;
  markersGroups: Record<string, H.map.Group>;
  routesGroup?: H.map.Group;
  trafficLayer?: boolean;
}

export interface HEREMapRef {
  getMap: () => H.Map;
  getElement: () => Element;
  setCenter: (point: H.geo.IPoint) => void;
  setZoom: (zoom: number) => void;
  screenToGeo: (x: number, y: number) => H.geo.Point;
  zoomOnMarkers: (animate?: boolean, group?: string) => void;
  zoomOnMarkersSet: (markersSet: H.map.DomMarker[], animate?: boolean) => void;
  addToMarkerGroup: (marker: H.map.Marker, group: string) => void;
  removeFromMarkerGroup: (marker: H.map.Marker, group: string) => void;
}

export const HEREMap = forwardRef<HEREMapRef, HEREMapProps>(({
  children,
  secure,
  onScriptLoadError,
  center,
  hidpi,
  interactive = true,
  zoom,
  lg,
  useSatellite,
  trafficLayer,
  onMapAvailable,
  disableMapSettings,
  language,
  congestion,
  truckRestrictions,
  incidentsLayer,
  apiKey,
  animateZoom,
  animateCenter,
  useVectorTiles,
},                                                           ref) => {
  const uniqueIdRef = useRef<string>(uniqueId());

  const [map, setMap] = useState<H.Map>(null);
  const [routesGroup, setRoutesGroup] = useState(null);

  const markersGroupsRef = useRef<Record<string, H.map.Group>>({});

  const unmountedRef = useRef(false);

  const defaultLayersRef = useRef<H.service.DefaultLayers>(null);
  const trafficOverlayLayerRef = useRef<H.map.layer.TileLayer>(null);
  const trafficBaseLayerRef = useRef<H.map.layer.TileLayer>(null);
  const truckOverlayLayerRef = useRef<H.map.layer.TileLayer>(null);
  const truckCongestionLayerRef = useRef<H.map.layer.TileLayer>(null);

  const usedMapTiles = useVectorTiles
    ? defaultLayersRef.current?.vector.normal
    : defaultLayersRef.current?.raster.normal;

  const screenToGeo = (x: number, y: number): H.geo.Point => {
    return map.screenToGeo(x, y);
  };

  const zoomOnMarkers = (animate: boolean = true, group: string = "default") => {
    if (map) {
      if (!markersGroupsRef.current[group]) { return; }
      const viewBounds = markersGroupsRef.current[group].getBoundingBox();
      if (viewBounds) { map.getViewModel().setLookAtData({ bounds: viewBounds }, animate); }
    }
  };

  const zoomOnMarkersSet = (markersSet: H.map.DomMarker[], animate: boolean = true) => {
    const markersGroupSet = new H.map.Group();
    markersSet.map((m) => markersGroupSet.addObject(m));
    const viewBounds = markersGroupSet.getBoundingBox();
    if (viewBounds) { map.getViewModel().setLookAtData({ bounds: viewBounds }, animate); }
  };

  const addToMarkerGroup = (marker: H.map.Marker, group: string) => {
    if (!markersGroupsRef.current[group]) {
      markersGroupsRef.current[group] = new H.map.Group();
      map.addObject(markersGroupsRef.current[group]);
    }
    markersGroupsRef.current[group].addObject(marker);
  };

  const removeFromMarkerGroup = (marker: H.map.Marker, group: string) => {
    if (markersGroupsRef.current[group]) {
      markersGroupsRef.current[group].removeObject(marker);
      if (markersGroupsRef.current[group].getObjects().length === 0) {
        if (map.getObjects().length > 0) {
          map.removeObject(markersGroupsRef.current[group]);
        }
        markersGroupsRef.current[group] = null;
      }
    }
  };

  useImperativeHandle<HEREMapRef, HEREMapRef>(ref, () => {
    return {
      addToMarkerGroup,
      getElement: () => document.querySelector(`#map-container-${uniqueIdRef.current}`),
      getMap: () => map,
      removeFromMarkerGroup,
      screenToGeo,
      setCenter: (point: H.geo.IPoint) => {
        map.setCenter(point, animateCenter);
      },
      setZoom: (newZoom: number) => {
        map.setZoom(newZoom, animateZoom);
      },
      zoomOnMarkers,
      zoomOnMarkersSet,
    };
  }, [map]);

  const getTruckLayerProvider = (enableCongestion: boolean): H.map.provider.ImageTileProvider.Options => {
    return {
      max: 20,
      min: 8,
      getURL(col, row, level) {
        return ["https://",
          "1.base.maps.ls.hereapi.com/maptile/2.1/truckonlytile/newest/normal.day/",
          level,
          "/",
          col,
          "/",
          row,
          "/256/png8",
          "?style=fleet",
          "&apiKey=",
          apiKey,
          enableCongestion ? "&congestion" : "",
          "&lg=",
          lg,
          "&=ppi",
          hidpi ? "320" : "72",
        ].join("");
      },
    };
  };
  const getTrafficOverlayProvider = (): H.map.provider.ImageTileProvider.Options => {
    return {
      getURL(col, row, level) {
        return ["https://",
          "1.traffic.maps.ls.hereapi.com/maptile/2.1/flowtile/newest/normal.day/",
          level,
          "/",
          col,
          "/",
          row,
          "/256/png8",
          "?apiKey=",
          apiKey,
          "&=ppi",
          hidpi ? "320" : "72",
        ].join("");
      },
    };
  };
  const getTrafficBaseProvider = (): H.map.provider.ImageTileProvider.Options => {
    return {
      getURL(col, row, level) {
        return ["https://",
          "1.traffic.maps.ls.hereapi.com/maptile/2.1/traffictile/newest/normal.day/",
          level,
          "/",
          col,
          "/",
          row,
          "/256/png8",
          "?apiKey=",
          apiKey,
          "&=ppi",
          hidpi ? "320" : "72",
        ].join("");
      },
    };
  };
  useEffect(() => {
    loadScripts(secure, !useVectorTiles).then(() => {
      if (unmountedRef.current) {
        return;
      }

      // get the platform to base the maps on
      const platform = getPlatform({
        apikey: apiKey,
        useHTTPS: secure === true,
      });
      defaultLayersRef.current = platform.createDefaultLayers({
        lg,
        ppi: hidpi ? 320 : 72,
      });
      const truckOverlayProvider = new H.map.provider.ImageTileProvider(getTruckLayerProvider(false));
      const truckOverlayCongestionProvider = new H.map.provider.ImageTileProvider(getTruckLayerProvider(true));
      const trafficOverlayProvider = new H.map.provider.ImageTileProvider(getTrafficOverlayProvider());
      const trafficBaseProvider = new H.map.provider.ImageTileProvider(getTrafficBaseProvider());

      truckOverlayLayerRef.current = new H.map.layer.TileLayer(truckOverlayProvider);
      truckCongestionLayerRef.current = new H.map.layer.TileLayer(truckOverlayCongestionProvider);
      trafficOverlayLayerRef.current = new H.map.layer.TileLayer(trafficOverlayProvider);
      trafficBaseLayerRef.current = new H.map.layer.TileLayer(trafficBaseProvider);

      const hereMapEl = document.querySelector(`#map-container-${uniqueIdRef.current}`);
      const baseLayer = useVectorTiles
        ? defaultLayersRef.current.vector.normal.map
        : defaultLayersRef.current.raster.normal.map;
      const newMap = new H.Map(
        hereMapEl,
        baseLayer,
        {
          center,
          // @ts-ignore
          engineType: useVectorTiles ? undefined : H.map.render.RenderEngine.EngineType.P2D,
          pixelRatio: hidpi ? 2 : 1,
          zoom,
        },
      );

      const routesProvider = new H.map.provider.LocalObjectProvider();
      const routesLayer = new H.map.layer.ObjectLayer(routesProvider);
      newMap.addLayer(routesLayer);

      let ui: H.ui.UI;

      // make the map interactive
      // MapEvents enables the event system
      // Behavior implements default interactions for pan/zoom
      const behavior = interactive ? new H.mapevents.Behavior(new H.mapevents.MapEvents(newMap)) : undefined;

      if (behavior) {
        // @ts-ignore
        behavior.disable(H.mapevents.Behavior.Feature.FRACTIONAL_ZOOM);

        // create the default UI for the map
        ui = H.ui.UI.createDefault(newMap, defaultLayersRef.current, language);
        if (disableMapSettings) {
          ui.removeControl("mapsettings");
        }
      }

      setMap(newMap);
      setRoutesGroup(routesProvider.getRootGroup());

      onMapAvailable({
        behavior,
        map: newMap,
        markersGroups: markersGroupsRef.current,
        routesGroup: routesProvider.getRootGroup(),
        trafficLayer,
        ui,
      });
    }).catch(onScriptLoadError);

    return () => {
      unmountedRef.current = true;
      map?.dispose();
    };
  }, []);

  useEffect(() => {
    if (map) {
      const satelliteBaseLayer = defaultLayersRef.current.raster.satellite.map;
      const emptyBaseLayer = usedMapTiles.map;
      const baseLayer = useSatellite
        ? satelliteBaseLayer
        : (trafficLayer && !useVectorTiles)
         ? trafficBaseLayerRef.current
         : emptyBaseLayer;

      map.setBaseLayer(baseLayer);
    }
  }, [map, useSatellite, usedMapTiles, trafficLayer]);

  useEffect(() => {
    if (map) {
      if (truckRestrictions) {
        if (congestion) {
          map.removeLayer(truckOverlayLayerRef.current);
          map.addLayer(truckCongestionLayerRef.current);
        } else {
          map.removeLayer(truckCongestionLayerRef.current);
          map.addLayer(truckOverlayLayerRef.current);
        }
      } else {
        map.removeLayer(truckCongestionLayerRef.current);
        map.removeLayer(truckOverlayLayerRef.current);
      }
    }
  }, [truckRestrictions, congestion, map]);

  useEffect(() => {
    if (map) {
      if (incidentsLayer) {
        map.addLayer(usedMapTiles.trafficincidents);
      } else {
        map.removeLayer(usedMapTiles.trafficincidents);
      }
    }
  }, [incidentsLayer, map, usedMapTiles]);

  useEffect(() => {
    if (map) {
      if (trafficLayer) {
        if (useVectorTiles) {
          // Adding the vector traffic layer is not strictly necessary,
          // however it's helpful because it changes the color for roads
          // and highways to white which makes the traffic data more visible.
          map.addLayer(defaultLayersRef.current.vector.normal.traffic);
        }
        // Ideally, we wouldn't need to add an additional layer here and
        // the vector traffic layer added above would be enough, however
        // the vector traffic layer is only visible on a high zoom level,
        // and if the zoom level is changed using setMin, then performance
        // issues appear.
        map.addLayer(trafficOverlayLayerRef.current);
      } else {
        map.removeLayer(defaultLayersRef.current.vector.normal.traffic);
        map.removeLayer(trafficOverlayLayerRef.current);
      }
    }
  }, [trafficLayer, map]);

  useEffect(() => {
    if (map) {
      const resizeMap = () => {
        map.getViewPort().resize();
      };

      const debouncedResizeMap = debounce(resizeMap, 200);

      // make the map resize when the window gets resized
      window.addEventListener("resize", debouncedResizeMap);
      return () => {
        window.removeEventListener("resize", debouncedResizeMap);
      };
    }
  }, [map]);

  return (
    <div className="heremap" style={{ height: "100%" }}>
      <div
        className="map-container"
        id={`map-container-${uniqueIdRef.current}`}
        style={{ height: "100%" }}
      >
        {map && <HEREMapContext.Provider value={{ map, routesGroup, removeFromMarkerGroup, addToMarkerGroup }}>
          {children}
        </HEREMapContext.Provider>}
      </div>
    </div>
  );
});

// make the HEREMap component the default export
export default HEREMap;
