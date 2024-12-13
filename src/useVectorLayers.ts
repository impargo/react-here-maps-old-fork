import { useEffect } from 'react'

import { DefaultLayers } from './types'

export interface UseVectorLayersProps {
  map?: H.Map,
  truckRestrictions?: boolean,
  trafficLayer?: boolean,
  incidentsLayer?: boolean,
  useSatellite?: boolean,
  congestion?: boolean,
  defaultLayers?: DefaultLayers,
  useVectorTiles: boolean,
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
        map.setBaseLayer(defaultLayers.vector.normal.truck)
      } else {
        map.setBaseLayer(useSatellite
          ? defaultLayers.raster.satellite.map
          : defaultLayers.vector.normal.map)
      }
    }
  }, [defaultLayers, truckRestrictions, congestion, map, useVectorTiles, useSatellite])

  useEffect(() => {
    if (map && defaultLayers && useVectorTiles) {
      if (incidentsLayer) {
        map.addLayer(defaultLayers.vector.normal.trafficincidents)
      } else {
        map.removeLayer(defaultLayers.vector.normal.trafficincidents)
      }
    }
  }, [incidentsLayer, map, defaultLayers, useVectorTiles])

  useEffect(() => {
    if (map && defaultLayers && useVectorTiles) {
      if (trafficLayer) {
        map.addLayer(defaultLayers.vector.normal.traffic)
      } else {
        map.removeLayer(defaultLayers.vector.normal.traffic)
      }
    }
  }, [trafficLayer, map, defaultLayers, useVectorTiles])
}
