import { useContext, useEffect, useRef, FC } from "react";
import { HEREMapContext, HEREMapContextType } from "./context";

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface MapStyles {
  style?: object;
  arrows?: object;
}

const defaultMapStyles: MapStyles = {
  style: {
    fillColor: "blue",
    lineWidth: 4,
    strokeColor: "blue",
  },
};

// declare an interface containing the required and potential
// props that can be passed to the HEREMap Marker component
export interface RoutesProps {
  points?: Coordinates[];
  data?: object;
  zIndex?: number;
  mapStyles?: MapStyles;
}

// declare an interface containing the potential context parameters
export interface RoutesContext {
  map: H.Map;
  routesGroup: H.map.Group;
}

export const Route: FC<RoutesProps> = ({
  mapStyles = defaultMapStyles,
  data,
  zIndex,
  points,
}) => {
  const { routesGroup } = useContext<HEREMapContextType>(HEREMapContext);

  const routeLineRef = useRef<H.map.Polyline>(null);

  const addRouteToMap = () => {
    if (routesGroup && points.length > 1) {
      let route: H.geo.Strip;
      let routeLine: H.map.Polyline;
      route = new H.geo.Strip();
      points.forEach((point) => {
        const { lat, lon } = point;
        route.pushPoint(new H.geo.Point(lat, lon));
      });
      routeLine = new H.map.Polyline(route, { style: mapStyles.style, arrows: mapStyles.arrows, zIndex, data });
      routesGroup.addObject(routeLine);
      routeLineRef.current = routeLine;
    }
  };

  useEffect(() => {
    addRouteToMap();
    return () => {
      if (routeLineRef.current) {
        routesGroup.removeObject(routeLineRef.current);
      }
    };
  }, []);

  return null;
};

export default Route;
