import React, { FC, useContext, useEffect, useState } from 'react'
import * as ReactDOMServer from 'react-dom/server'

import { HEREMapContext, HEREMapContextType } from './context'
import { EventHandlers, useEventHandlers } from './useEventHandlers'
import getDomMarkerIcon from './utils/get-dom-marker-icon'
import getMarkerIcon from './utils/get-marker-icon'

// declare an interface containing the required and potential
// props that can be passed to the HEREMap Marker componengetMartkerIdt
export interface MarkerProps extends H.map.Marker.Options, EventHandlers {
  lat: number,
  lng: number,
  /**
   * Either an image URL or an SVG markup.
   */
  bitmap?: string,
  data?: any,
  draggable?: boolean,
  /**
   * @deprecated use bitmap instead. Passing children in this way has performance
   * implications since the 3.1 version of the API and should be avoided.
   */
  children?: React.ReactElement<any>,
  group?: string,
  anchor?: H.math.IPoint,
}

/**
 * A "normal" marker that uses a static image as an icon.
 * large numbers of markers of this type can be added to the map
 * very quickly and efficiently
 */
export const Marker: FC<MarkerProps> = ({
  children,
  group = 'default',
  bitmap,
  data,
  draggable = false,
  lat,
  lng,
  anchor,
  onTap,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  onDrag,
  onDragEnd,
  onDragStart,
  ...options
}) => {
  const { map, removeFromMarkerGroup, addToMarkerGroup } = useContext<HEREMapContextType>(HEREMapContext)

  const [marker, setMarker] = useState<H.map.DomMarker | H.map.Marker | null>(null)

  const renderChildren = (): H.map.DomIcon => {
    if (!map) {
      throw new Error('Map has to be loaded before performing this action')
    }

    // if children are provided, we render the provided react
    // code to an html string
    const html = ReactDOMServer.renderToStaticMarkup((
      <div className="dom-marker">
        {children}
      </div>
    ))

    // we then get a dom icon object from the wrapper method
    return getDomMarkerIcon(html)
  }

  const addMarkerToMap = () => {
    if (!map) {
      throw new Error('Map has to be loaded before performing this action')
    }

    let newMarker = null
    if (React.Children.count(children) > 0) {
      const icon = renderChildren()
      newMarker = new H.map.DomMarker({ lat, lng }, { icon })
    } else if (bitmap) {
      // if we have an image url or an svg markup and no react children, create a
      // regular icon instance
      const icon = getMarkerIcon(bitmap, anchor)
      // then create a normal marker instance and attach it to the map
      newMarker = new H.map.Marker({ lat, lng }, {
        icon,
        // @ts-ignore
        volatility: draggable,
        ...options,
      })
    } else {
      // create a default marker at the provided location
      newMarker = new H.map.Marker({ lat, lng })
    }
    newMarker.draggable = draggable
    newMarker.setData(data)
    addToMarkerGroup(newMarker, group)
    setMarker(newMarker)
    return newMarker
  }

  useEventHandlers(marker, {
    onDrag,
    onDragEnd,
    onDragStart,
    onPointerEnter,
    onPointerLeave,
    onPointerMove,
    onTap,
  })

  useEffect(() => {
    const addedMarker = addMarkerToMap()
    return () => {
      removeFromMarkerGroup(addedMarker, group)
    }
  }, [group])

  useEffect(() => {
    if (marker) {
      marker.draggable = draggable
      // @ts-ignore
      marker.setVolatility(draggable)
    }
  }, [marker, draggable])

  useEffect(() => {
    marker?.setGeometry({
      lat,
      lng,
    })
  }, [marker, lat, lng])

  useEffect(() => {
    marker?.setData(data)
  }, [marker, data])

  useEffect(() => {
    if (bitmap) {
      marker?.setIcon(getMarkerIcon(bitmap, anchor))
    }
  }, [marker, bitmap, anchor])

  useEffect(() => {
    if (React.Children.count(children)) {
      const icon = renderChildren()
      marker?.setIcon(icon)
    }
  }, [marker, children?.props])

  return null
}

export default Marker
