// a "normal" marker that uses a static image as an icon.
// large numbers of markers of this type can be added to the map
// very quickly and efficiently

import React, { useContext, useEffect, useRef, FC } from "react";
import * as ReactDOMServer from "react-dom/server";
import { HEREMapContext, HEREMapContextType } from "./context";
import getDomMarkerIcon from "./utils/get-dom-marker-icon";
import getMarkerIcon from "./utils/get-marker-icon";

// declare an interface containing the required and potential
// props that can be passed to the HEREMap Marker componengetMartkerIdt
export interface MarkerProps extends H.map.Marker.Options, H.geo.IPoint {
  bitmap?: string;
  data?: any;
  draggable?: boolean;
  children?: React.ReactElement<any>;
  group?: string;
}

export const Marker: FC<MarkerProps> = ({
  children,
  group = "default",
  bitmap,
  data,
  draggable = false,
  lat,
  lng,
}) => {
  const { map, removeFromMarkerGroup, addToMarkerGroup } = useContext<HEREMapContextType>(HEREMapContext);

  const markerRef = useRef<H.map.DomMarker | H.map.Marker | null>(null);

  const renderChildren = () => {
    if (!map) {
      throw new Error("Map has to be loaded before performing this action");
    }

    // if children are provided, we render the provided react
    // code to an html string
    const html = ReactDOMServer.renderToStaticMarkup((
      <div className="dom-marker">
        {children}
      </div>
    ));

    // we then get a dom icon object from the wrapper method
    const icon = getDomMarkerIcon(html);

    // then create a dom marker instance and attach it to the map,
    // provided via context
    const marker = new H.map.DomMarker({ lat, lng }, { icon });
    (marker as any).draggable = draggable;
    marker.setData(data);
    addToMarkerGroup(marker, group);
    return marker;
  };

  const addMarkerToMap = () => {
    if (!map) {
      throw new Error("Map has to be loaded before performing this action");
    }

    if (React.Children.count(children) > 0) {
      markerRef.current = renderChildren();
    } else if (bitmap) {
      // if we have an image url and no react children, create a
      // regular icon instance
      const icon = getMarkerIcon(bitmap);
      // then create a normal marker instance and attach it to the map
      markerRef.current = new H.map.Marker({ lat, lng }, { icon });
      markerRef.current.setData(data);
      addToMarkerGroup(markerRef.current, group);
    } else {
      // create a default marker at the provided location
      markerRef.current = new H.map.Marker({ lat, lng });
      markerRef.current.setData(data);
      addToMarkerGroup(markerRef.current, group);
    }
  };

  useEffect(() => {
    addMarkerToMap();
    return () => {
      removeFromMarkerGroup(markerRef.current, group);
    };
  }, [group]);

  useEffect(() => {
    if (markerRef.current) {
      (markerRef.current as any).draggable = draggable;
    }
  }, [draggable]);

  useEffect(() => {
    (markerRef.current as any)?.setPosition({
      lat,
      lng,
    });
  }, [lat, lng]);

  useEffect(() => {
    markerRef.current?.setData(data);
  }, [data]);

  useEffect(() => {
    if (bitmap && markerRef.current) {
      markerRef.current.setIcon(getMarkerIcon(bitmap));
    }
  }, [bitmap]);

  useEffect(() => {
    if (markerRef.current) {
      const html = ReactDOMServer.renderToStaticMarkup((
        <div className="dom-marker">
          {children}
        </div>
      ));
      markerRef.current.setIcon(getDomMarkerIcon(html));
    }
  }, [children.props]);

  return null;
};

export default Marker;
