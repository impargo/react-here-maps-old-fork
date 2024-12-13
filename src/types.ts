export interface DefaultLayers {
  raster: {
    normal: {
      map: H.map.layer.BaseTileLayer,
      base: H.map.layer.BaseTileLayer,
      trafficincidents: H.map.layer.TileLayer,
    },
    satellite: {
      map: H.map.layer.BaseTileLayer,
    },
  },
  vector: {
    normal: {
      map: H.map.layer.BaseTileLayer,
      trafficincidents: H.map.layer.TileLayer,
      traffic: H.map.layer.TileLayer,
      truck: H.map.layer.TileLayer,
    },
  },
  hybrid: {
    logistics: {
      raster: H.map.layer.BaseTileLayer,
      vector: H.map.layer.BaseTileLayer,
    },
  },
}
