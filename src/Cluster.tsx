import { useCallback, useContext, useEffect, useMemo, useRef } from 'react'

import { HEREMapContext } from './context'
import getMarkerIcon from './utils/get-marker-icon'

export interface Datapoint<T> {
  lat: number,
  lon: number,
  /**
   * Any generic data that can be stored in the datapoint.
   */
  data: T,
}

export interface ClusterProps<T> {
  /**
   * The datapoints that should be clustered. They should contain coordinates, a bitmap, and any generic type of data.
   * Note: a change in this array will force a reclustering of the entire cluster.
   */
  points: Array<Datapoint<T>>,
  /**
   * Clustering options used by HERE maps clustering provider.
   * Note: a change in these options will recreate the clustering provider.
   */
  clusteringOptions?: H.clustering.Provider.ClusteringOptions,
  /**
   * A function that should return the marker bitmap to be used for a specific set of cluster points.
   * Note: a change in this function will trigger a redraw for all the datapoints in the cluster.
   * So make sure to wrap it in a `useCallback` and only change its reference when necessary.
   */
  getBitmapForCluster: (points: T[]) => string,
  /**
   * A function that should return the marker bitmap for a single point.
   * Note: a change in this function will trigger a redraw for all the datapoints in the cluster.
   * So make sure to wrap it in a `useCallback` and only change its reference when necessary.
   */
  getBitmapForPoint: (point: T) => string,
  /**
   * A callback for when a cluster of points are clicked.
   */
  onClusterClick: (data: T[], e: H.mapevents.Event) => void,
  /**
   * A callback for when a single point in the cluster is clicked.
   */
  onPointClick: (data: T, e: H.mapevents.Event) => void,
}

export const defaultClusteringOptions: H.clustering.Provider.ClusteringOptions = {
  /**
   * Maximum radius of the neighborhood.
   */
  eps: 32,
  /**
   * Minimum weight of points required to form a cluster (default weight for a cluster point is 1).
   */
  minWeight: 2,
}

function createTheme<T> (
  getBitmapForCluster: (points: T[]) => string,
  getBitmapForPoint: (point: T) => string,
): H.clustering.ITheme {
  return {
    getClusterPresentation: (cluster) => {
      const clusterPoints: T[] = []
      cluster.forEachDataPoint((point) => clusterPoints.push(point.getData()))
      return new H.map.Marker(cluster.getPosition(), {
        data: clusterPoints,
        icon: getMarkerIcon(getBitmapForCluster(clusterPoints)),
        max: cluster.getMaxZoom(),
        min: cluster.getMinZoom(),
      })
    },
    getNoisePresentation: (point) => {
      const data: T = point.getData()
      return new H.map.Marker(point.getPosition(), {
        data,
        icon: getMarkerIcon(getBitmapForPoint(data)),
        min: point.getMinZoom(),
      })
    },
  }
}

function pointToDatapoint<T> (point: Datapoint<T>): H.clustering.DataPoint {
  return new H.clustering.DataPoint(point.lat, point.lon, null, point.data)
}

/**
 * A component that can automatically cluster a group of datapoints.
 */
export default function Cluster<T> ({
  points,
  clusteringOptions = defaultClusteringOptions,
  getBitmapForCluster,
  getBitmapForPoint,
  onClusterClick,
  onPointClick,
}: ClusterProps<T>): null {
  const { map } = useContext(HEREMapContext)

  const onClusterClickRef = useRef(onClusterClick)
  onClusterClickRef.current = onClusterClick

  const onPointClickRef = useRef(onPointClick)
  onPointClickRef.current = onPointClick

  const theme: H.clustering.ITheme = useMemo(() => createTheme(
    getBitmapForCluster,
    getBitmapForPoint,
  ), [getBitmapForCluster, getBitmapForPoint])

  const datapoints = useMemo(() => points.map(pointToDatapoint), [points])

  const onClick = useCallback((evt: Event) => {
    const e = evt as unknown as H.mapevents.Event
    const data: T | T[] = (e.target as H.map.Object).getData()
    if (Array.isArray(data)) {
      onClusterClickRef.current(data, e)
    } else {
      onPointClickRef.current(data, e)
    }
  }, [])

  const clusteredDataProvider = useMemo(() => {
    const provider = new H.clustering.Provider(datapoints, {
      clusteringOptions,
      theme,
    })
    provider.addEventListener('tap', onClick)
    return provider
  }, [clusteringOptions, onClick])

  useEffect(() => {
    clusteredDataProvider.setTheme(theme)
  }, [theme, clusteredDataProvider])

  useEffect(() => {
    clusteredDataProvider.setDataPoints(datapoints)
  }, [datapoints, clusteredDataProvider])

  useEffect(() => {
    const layer = new H.map.layer.ObjectLayer(clusteredDataProvider)
    map?.addLayer(layer)
    return () => {
      map?.removeLayer(layer)
    }
  }, [map, clusteredDataProvider])

  return null
}
