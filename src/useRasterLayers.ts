import { useEffect, useMemo } from 'react'

import { Language } from './utils/languages'

export interface UseRasterLayersProps {
  map?: H.Map,
  truckRestrictions?: boolean,
  trafficLayer?: boolean,
  incidentsLayer?: boolean,
  useSatellite?: boolean,
  congestion?: boolean,
  defaultLayers?: H.service.DefaultLayers,
  apiKey: string,
  hidpi?: boolean,
  useVectorTiles: boolean,
  locale?: string,
  /**
   * @deprecated
   */
  lg?: Language,
  useLegacyTruckLayer?: boolean,
  useLegacyTrafficLayer?: boolean,
}

const getLayers = (
  apiKey: string,
  locale?: string,
  lg?: string,
  hidpi?: boolean,
  useLegacyTruckLayer?: boolean,
  useLegacyTrafficLayer?: boolean,
) => {
  const lang = locale ?? 'en'
  const ppi = hidpi ? 400 : 100
  const format = 'png8'

  const getTruckLayerProvider = (enableCongestion: boolean): H.map.provider.ImageTileProvider.Options => {
    return {
      max: 20,
      min: 8,
      getURL (col, row, level) {
        const features = enableCongestion
          ? 'vehicle_restrictions:active_and_inactive,environmental_zones:all,congestion_zones:all'
          : 'vehicle_restrictions:active_and_inactive'
        const style = 'logistics.day'
        return `https://maps.hereapi.com/v3/blank/mc/${level}/${col}/${row}/${format}?apiKey=${apiKey}&features=${features}&lang=${lang}&ppi=${ppi}&style=${style}`
      },
    }
  }
  const getTrafficOverlayProvider = (): H.map.provider.ImageTileProvider.Options => {
    return {
      getURL (col, row, level) {
        return `https://traffic.maps.hereapi.com/v3/flow/mc/${level}/${col}/${row}/${format}?apiKey=${apiKey}&ppi=${ppi}`
      },
    }
  }
  const getTrafficBaseProvider = (): H.map.provider.ImageTileProvider.Options => {
    return {
      getURL (col, row, level) {
        const style = 'lite.day'
        return `https://maps.hereapi.com/v3/base/mc/${level}/${col}/${row}/${format}?apiKey=${apiKey}&lang=${lang}&ppi=${ppi}&style=${style}`
      },
    }
  }

  const getTruckLayerProviderLegacy = (enableCongestion: boolean): H.map.provider.ImageTileProvider.Options => {
    return {
      max: 20,
      min: 8,
      getURL (col, row, level) {
        return ['https://',
          '1.base.maps.ls.hereapi.com/maptile/2.1/truckonlytile/newest/normal.day/',
          level,
          '/',
          col,
          '/',
          row,
          '/256/png8',
          '?style=fleet',
          '&apiKey=',
          apiKey,
          enableCongestion ? '&congestion' : '',
          '&lg=',
          lg,
          '&ppi=',
          hidpi ? '320' : '72',
        ].join('')
      },
    }
  }
  const getTrafficOverlayProviderLegacy = (): H.map.provider.ImageTileProvider.Options => {
    return {
      getURL (col, row, level) {
        return ['https://',
          '1.traffic.maps.ls.hereapi.com/maptile/2.1/flowtile/newest/normal.day/',
          level,
          '/',
          col,
          '/',
          row,
          '/256/png8',
          '?apiKey=',
          apiKey,
          '&ppi=',
          hidpi ? '320' : '72',
        ].join('')
      },
    }
  }
  const getTrafficBaseProviderLegacy = (): H.map.provider.ImageTileProvider.Options => {
    return {
      getURL (col, row, level) {
        return ['https://',
          '1.traffic.maps.ls.hereapi.com/maptile/2.1/traffictile/newest/normal.day/',
          level,
          '/',
          col,
          '/',
          row,
          '/256/png8',
          '?apiKey=',
          apiKey,
          '&ppi=',
          hidpi ? '320' : '72',
        ].join('')
      },
    }
  }

  const truckOverlayProvider = new H.map.provider.ImageTileProvider(useLegacyTruckLayer
    ? getTruckLayerProviderLegacy(false)
    : getTruckLayerProvider(false))
  const truckOverlayCongestionProvider = new H.map.provider.ImageTileProvider(useLegacyTruckLayer
    ? getTruckLayerProviderLegacy(true)
    : getTruckLayerProvider(true))
  const trafficOverlayProvider = new H.map.provider.ImageTileProvider(useLegacyTrafficLayer
    ? getTrafficOverlayProviderLegacy()
    : getTrafficOverlayProvider())
  const trafficBaseProvider = new H.map.provider.ImageTileProvider(useLegacyTrafficLayer
    ? getTrafficBaseProviderLegacy()
    : getTrafficBaseProvider())

  return {
    trafficBaseLayer: new H.map.layer.TileLayer(trafficBaseProvider),
    trafficOverlayLayer: new H.map.layer.TileLayer(trafficOverlayProvider),
    truckCongestionLayer: new H.map.layer.TileLayer(truckOverlayCongestionProvider),
    truckOverlayLayer: new H.map.layer.TileLayer(truckOverlayProvider),
  }
}

export const useRasterLayers = ({
  map,
  useSatellite,
  trafficLayer,
  congestion,
  truckRestrictions,
  incidentsLayer,
  defaultLayers,
  apiKey,
  locale,
  hidpi,
  useVectorTiles,
  lg,
  useLegacyTrafficLayer,
  useLegacyTruckLayer,
}: UseRasterLayersProps) => {
  const layers = useMemo(() => map && getLayers(
    apiKey,
    locale,
    lg,
    hidpi,
    useLegacyTruckLayer,
    useLegacyTrafficLayer),
  [apiKey, locale, lg, hidpi, map, useLegacyTruckLayer, useLegacyTrafficLayer])

  useEffect(() => {
    if (map && layers && !useVectorTiles && defaultLayers) {
      const satelliteBaseLayer = defaultLayers?.raster.satellite.map
      const emptyBaseLayer = defaultLayers?.raster.normal.map
      const baseLayer = useSatellite
        ? satelliteBaseLayer
        : trafficLayer
          ? layers.trafficBaseLayer
          : emptyBaseLayer

      map.setBaseLayer(baseLayer)
    }
  }, [map, useSatellite, defaultLayers, trafficLayer, useVectorTiles, layers])

  useEffect(() => {
    if (map && layers && !useVectorTiles) {
      if (truckRestrictions) {
        if (congestion) {
          map.removeLayer(layers.truckOverlayLayer)
          map.addLayer(layers.truckCongestionLayer)
        } else {
          map.removeLayer(layers.truckCongestionLayer)
          map.addLayer(layers.truckOverlayLayer)
        }
      } else {
        map.removeLayer(layers.truckCongestionLayer)
        map.removeLayer(layers.truckOverlayLayer)
      }
    }
  }, [truckRestrictions, congestion, map, useVectorTiles, layers])

  useEffect(() => {
    if (map && !useVectorTiles && defaultLayers) {
      if (incidentsLayer) {
        map.addLayer(defaultLayers.raster.normal.trafficincidents!)
      } else {
        map.removeLayer(defaultLayers.raster.normal.trafficincidents!)
      }
    }
  }, [incidentsLayer, map, defaultLayers, useVectorTiles])

  useEffect(() => {
    if (map && layers && !useVectorTiles) {
      if (trafficLayer) {
        map.addLayer(layers.trafficOverlayLayer)
      } else {
        map.removeLayer(layers.trafficOverlayLayer)
      }
    }
  }, [trafficLayer, map, useVectorTiles, layers])
}
