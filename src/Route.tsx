// a "normal" marker that uses a static image as an icon.
// large numbers of markers of this type can be added to the map
// very quickly and efficiently

import * as PropTypes from "prop-types";
import * as React from "react";

export interface Coordinates {
  lat: number;
  lon: number;
}
export interface MapStyles {
  style?: object;
  arrows?: object;
}
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

// export the Marker React component from this module
export class Route extends React.PureComponent<RoutesProps, object> {
  // define the context types that are passed down from a <HEREMap> instance
  public static contextTypes = {
    map: PropTypes.object,
    routesGroup: PropTypes.object,
  };
  public static defaultProps = {
    mapStyles: {
      style: {
        fillColor: "blue",
        lineWidth: 4,
        strokeColor: "blue",
      },
    },
  };

  public context: RoutesContext;

  // private route: H.geo.LineString;
  private routeLine: H.map.Polyline;
  // remove the marker on unmount of the component
  public componentWillUnmount() {
    const { routesGroup } = this.context;

    if (this.routeLine) {
      routesGroup.removeObject(this.routeLine);
    }
  }

  public render(): JSX.Element {
    // WARNING: Pure component will not re-render if context changes.
    const { map, routesGroup } = this.context;
    if (map) {
      if (this.routeLine) {
        routesGroup.removeObject(this.routeLine);
      }
      this.addRouteToMap(this.props);
    }
    return null;
  }

  private addRouteToMap(props: RoutesProps) {
    const { routesGroup } = this.context;
    const { mapStyles, data, zIndex, points } = props;
    if (routesGroup && points.length > 1) {
      let route: H.geo.LineString;
      let routeLine: H.map.Polyline;
      route = new H.geo.LineString();
      points.forEach((point) => {
        const { lat, lon } = point;
        route.pushPoint(new H.geo.Point(lat, lon));
      });
      routeLine = new H.map.Polyline(route, { style: mapStyles.style, arrows: mapStyles.arrows, zIndex, data });
      routesGroup.addObject(routeLine);
      // this.route = route;
      this.routeLine = routeLine;
    }
  }

}
export default Route;
