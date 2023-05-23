import { useEffect, useMemo } from "react";
import { Language } from "./utils/languages";

export interface UseRasterLayersProps {
  map?: H.Map;
  truckRestrictions?: boolean;
  trafficLayer?: boolean;
  incidentsLayer?: boolean;
  useSatellite?: boolean;
  congestion?: boolean;
  defaultLayers?: H.service.DefaultLayers;
  apiKey: string;
  lg?: Language;
  hidpi?: boolean;
  useVectorTiles: boolean;
}

const getLayers = (apiKey: string, lg?: Language, hidpi?: boolean) => {
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
          "&ppi=",
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
          "&ppi=",
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
          "&ppi=",
          hidpi ? "320" : "72",
        ].join("");
      },
    };
  };

  const truckOverlayProvider = new H.map.provider.ImageTileProvider(getTruckLayerProvider(false));
  const truckOverlayCongestionProvider = new H.map.provider.ImageTileProvider(getTruckLayerProvider(true));
  const trafficOverlayProvider = new H.map.provider.ImageTileProvider(getTrafficOverlayProvider());
  const trafficBaseProvider = new H.map.provider.ImageTileProvider(getTrafficBaseProvider());

  return {
    trafficBaseLayer: new H.map.layer.TileLayer(trafficBaseProvider),
    trafficOverlayLayer: new H.map.layer.TileLayer(trafficOverlayProvider),
    truckCongestionLayer: new H.map.layer.TileLayer(truckOverlayCongestionProvider),
    truckOverlayLayer: new H.map.layer.TileLayer(truckOverlayProvider),
  };
};

export const useRasterLayers = ({
  map,
  useSatellite,
  trafficLayer,
  congestion,
  truckRestrictions,
  incidentsLayer,
  defaultLayers,
  apiKey,
  lg,
  hidpi,
  useVectorTiles,
}: UseRasterLayersProps) => {
  const layers = useMemo(() => map && getLayers(apiKey, lg, hidpi), [apiKey, lg, hidpi, map]);

  useEffect(() => {
    if (map && layers && !useVectorTiles && defaultLayers) {
      const satelliteBaseLayer = defaultLayers?.raster.satellite.map;
      const emptyBaseLayer = defaultLayers?.raster.normal.map;
      const baseLayer = useSatellite
        ? satelliteBaseLayer
        : trafficLayer
          ? layers.trafficBaseLayer
          : emptyBaseLayer;

      map.setBaseLayer(baseLayer);
    }
  }, [map, useSatellite, defaultLayers, trafficLayer, useVectorTiles, layers]);

  useEffect(() => {
    if (map && layers && !useVectorTiles) {
      if (truckRestrictions) {
        if (congestion) {
          map.removeLayer(layers.truckOverlayLayer);
          map.addLayer(layers.truckCongestionLayer);
        } else {
          map.removeLayer(layers.truckCongestionLayer);
          map.addLayer(layers.truckOverlayLayer);
        }
      } else {
        map.removeLayer(layers.truckCongestionLayer);
        map.removeLayer(layers.truckOverlayLayer);
      }
    }
  }, [truckRestrictions, congestion, map, useVectorTiles, layers]);

  useEffect(() => {
    if (map && !useVectorTiles && defaultLayers) {
      if (incidentsLayer) {
        map.addLayer(defaultLayers.raster.normal.trafficincidents!);
      } else {
        map.removeLayer(defaultLayers.raster.normal.trafficincidents!);
      }
    }
  }, [incidentsLayer, map, defaultLayers, useVectorTiles]);

  useEffect(() => {
    if (map && layers && !useVectorTiles) {
      if (trafficLayer) {
        map.addLayer(layers.trafficOverlayLayer);
      } else {
        map.removeLayer(layers.trafficOverlayLayer);
      }
    }
  }, [trafficLayer, map, useVectorTiles, layers]);
};
