import { useContext, useEffect, useState, FC } from "react";
import { HEREMapContext, HEREMapContextType } from "./context";

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
export interface RoutesProps {
  points?: Coordinates[];
  data?: object;
  zIndex?: number;
  style?: object;
  onPointerMove?: (evt: H.mapevents.Event) => void;
  onPointerLeave?: (evt: H.mapevents.Event) => void;
  onPointerEnter?: (evt: H.mapevents.Event) => void;
  onTap?: (evt: H.mapevents.Event) => void;
}

// declare an interface containing the potential context parameters
export interface RoutesContext {
  map: H.Map;
  routesGroup: H.map.Group;
}

export const Route: FC<RoutesProps> = ({
  style = defaultMapStyles,
  data,
  zIndex,
  points,
  onPointerMove,
  onPointerLeave,
  onPointerEnter,
  onTap,
}) => {
  const { routesGroup } = useContext<HEREMapContextType>(HEREMapContext);
  const [polyline, setPolyline] = useState<H.map.Polyline>(null);

  const createPolyline = () => {
    let route: H.geo.LineString;
    let routeLine: H.map.Polyline;
    route = new H.geo.LineString();
    points.forEach((point) => {
      const { lat, lon } = point;
      route.pushPoint(new H.geo.Point(lat, lon));
    });
    routeLine = new H.map.Polyline(route, { style, zIndex, data });
    return routeLine;
  };

  useEffect(() => {
    if (polyline && onTap) {
      polyline.addEventListener("tap", onTap as any);
      return () => {
        polyline.removeEventListener("tap", onTap as any);
      };
    }
  }, [polyline, onTap]);

  useEffect(() => {
    if (polyline && onPointerLeave) {
      polyline.addEventListener("pointerleave", onPointerLeave as any);
      return () => {
        polyline.removeEventListener("pointerleave", onPointerLeave as any);
      };
    }
  }, [polyline, onPointerLeave]);

  useEffect(() => {
    if (polyline && onPointerMove) {
      polyline.addEventListener("pointermove", onPointerMove as any);
      return () => {
        polyline.removeEventListener("pointermove", onPointerMove as any);
      };
    }
  }, [polyline, onPointerMove]);

  useEffect(() => {
    if (polyline && onPointerEnter) {
      polyline.addEventListener("pointerenter", onPointerEnter as any);
      return () => {
        polyline.removeEventListener("pointerenter", onPointerEnter as any);
      };
    }
  }, [polyline, onPointerEnter]);

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
    if (routesGroup && points.length > 1) {
      const routeLine = createPolyline();
      routesGroup.addObject(routeLine);
      setPolyline(routeLine);
      return () => {
        routesGroup.removeObject(routeLine);
      };
    }
  }, [points, routesGroup]);

  return null;
};

export default Route;
