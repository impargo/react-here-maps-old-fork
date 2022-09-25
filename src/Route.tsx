import { useContext, useEffect, useMemo, useState, FC } from "react";
import { HEREMapContext, HEREMapContextType } from "./context";
import { useEventHandlers, EventHandlers } from "./useEventHandlers";

export interface Coordinates {
  lat: number;
  lon: number;
}

const defaultMapStyles: object = {
  fillColor: "blue",
  lineWidth: 4,
  strokeColor: "blue",
};

// declare an interface containing the required and potential
// props that can be passed to the HEREMap Marker component
export interface RoutesProps extends EventHandlers {
  points?: Coordinates[];
  data?: object;
  zIndex?: number;
  style?: object;
  /**
   * This is only supported when using the legacy P2D engine (when not using vector tiles).
   * When using vector tiles and/or the new engine, use lineDash, lineHeadCap, and lineTailCap instead.
   */
  arrows?: object;
  draggable?: boolean;
}

// declare an interface containing the potential context parameters
export interface RoutesContext {
  map: H.Map;
  routesGroup: H.map.Group;
}

export const Route: FC<RoutesProps> = ({
  style = defaultMapStyles,
  arrows,
  data,
  zIndex,
  points,
  onPointerMove,
  onPointerLeave,
  onPointerEnter,
  onDrag,
  onDragEnd,
  onDragStart,
  onTap,
  draggable,
}) => {
  const { routesGroup } = useContext<HEREMapContextType>(HEREMapContext);
  const [polyline, setPolyline] = useState<H.map.Polyline>(null);

  const line = useMemo(() => {
    const route = new H.geo.LineString();
    points.forEach((point) => {
      const { lat, lon } = point;
      route.pushPoint(new H.geo.Point(lat, lon));
    });
    return route;
  }, [points]);

  useEventHandlers(polyline, {
    onDrag,
    onDragEnd,
    onDragStart,
    onPointerEnter,
    onPointerLeave,
    onPointerMove,
    onTap,
  });

  useEffect(() => {
    if (polyline && typeof draggable === "boolean") {
      // @ts-ignore
      polyline.draggable = draggable;
    }
  }, [polyline, draggable]);

  useEffect(() => {
    polyline?.setGeometry(line);

  }, [line]);

  useEffect(() => {
    polyline?.setData(data);
  }, [polyline, data]);

  useEffect(() => {
    polyline?.setZIndex(zIndex);
  }, [polyline, zIndex]);

  useEffect(() => {
    polyline?.setStyle(style);
  }, [polyline, style]);

  useEffect(() => {
    if (routesGroup) {
      const routeLine = new H.map.Polyline(line, { style, arrows, zIndex, data });
      routesGroup.addObject(routeLine);
      setPolyline(routeLine);
      return () => {
        routesGroup.removeObject(routeLine);
      };
    }
  }, [routesGroup]);

  return null;
};

export default Route;
