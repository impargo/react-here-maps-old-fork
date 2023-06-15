import { useEffect } from "react";

const updateStyle = (map: H.Map) => {
  // get the vector provider from the base layer
  // @ts-ignore
  const provider = map.getBaseLayer().getProvider();

  // get the style object for the base layer
  const truckStyle = provider.getStyle();

  const changeListener = () => {
    // @ts-ignore
    if (truckStyle.getState() === H.map.Style.State.READY) {
      truckStyle.removeEventListener("change", changeListener);

      truckStyle.setProperty("textures.truck-attributes.sprites.truck-attributes--weight_timed", "None");
      truckStyle.setProperty("textures.truck-attributes.sprites.truck-attributes--width_timed", "None");
      truckStyle.setProperty("textures.truck-attributes.sprites.truck-attributes--wpa_timed", "None");
      truckStyle.setProperty("textures.truck-attributes.sprites.truck-attributes--height_timed", "None");
      truckStyle.setProperty("textures.truck-attributes.sprites.truck-attributes--length_timed", "None");
      truckStyle.setProperty("textures.truck-attributes.sprites.truck-attributes--default_timed", "None");
      truckStyle.setProperty("textures.truck-attributes.sprites.truck-attributes--trailers_timed", "None");
      const lineFilters = truckStyle.getProperty("layers.truck-restriction.lines.filter.all");
      truckStyle.setProperty("layers.truck-restriction.lines.filter.all", [...lineFilters, {
        hgv_time_restrictions: false,
      }]);
    }
  };

  truckStyle.addEventListener("change", changeListener);
};

export interface UseVectorLayersProps {
  map?: H.Map;
  truckRestrictions?: boolean;
  trafficLayer?: boolean;
  incidentsLayer?: boolean;
  useSatellite?: boolean;
  congestion?: boolean;
  defaultLayers?: H.service.DefaultLayers;
  useVectorTiles: boolean;
}

export const useVectorLayers = ({
  map,
  useSatellite,
  trafficLayer,
  congestion,
  truckRestrictions,
  incidentsLayer,
  defaultLayers,
  useVectorTiles,
}: UseVectorLayersProps) => {

  useEffect(() => {
    if (map && defaultLayers && useVectorTiles) {
      if (truckRestrictions) {
        // @ts-ignore
        map.setBaseLayer(defaultLayers.vector.normal.truck);
        updateStyle(map);
      } else {
        map.setBaseLayer(useSatellite
          ? defaultLayers.raster.satellite.map
          : defaultLayers.vector.normal.map);
      }
    }
  }, [truckRestrictions, congestion, map, useVectorTiles, useSatellite]);

  useEffect(() => {
    if (map && defaultLayers && useVectorTiles) {
      if (incidentsLayer) {
        map.addLayer(defaultLayers.vector.normal.trafficincidents);
      } else {
        map.removeLayer(defaultLayers.vector.normal.trafficincidents);
      }
    }
  }, [incidentsLayer, map, defaultLayers, useVectorTiles]);

  useEffect(() => {
    if (map && defaultLayers && useVectorTiles) {
      if (trafficLayer) {
        map.addLayer(defaultLayers.vector.normal.traffic);
      } else {
        map.removeLayer(defaultLayers.vector.normal.traffic);
      }
    }
  }, [trafficLayer, map, defaultLayers, useVectorTiles]);

};
