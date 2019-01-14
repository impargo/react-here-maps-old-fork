// a "normal" marker that uses a static image as an icon.
// large numbers of markers of this type can be added to the map
// very quickly and efficiently

import * as React from "react";
import * as PropTypes from "prop-types";

export interface Coordinates {
  lat: number;
  lon: number;
}

// declare an interface containing the required and potential
// props that can be passed to the HEREMap Marker component
export interface RoutesProps {
    points?: Coordinates[];
    fillColor?: string;
    strokeColor?: string;
    lineWidth?: number;
    data? :object;
    zIndex? :number;
}

// declare an interface containing the potential context parameters
export interface RoutesContext {
  map: H.Map;
  routesGroup: H.map.Group;
}

// export the Marker React component from this module
export class Route extends React.Component<RoutesProps, object> {
  // define the context types that are passed down from a <HEREMap> instance
  public static contextTypes = {
    map: PropTypes.object,
    routesGroup: PropTypes.object,
  };

  public context: RoutesContext;

  private route: H.geo.LineString;
  private routeLine: H.map.Polyline;
  static defaultProps = { lineWidth: 10, fillColor: 'rgba(49, 95, 225, 0.8)', strokeColor: 'blue' }
  public componentWillReceiveProps(nextProps: RoutesProps) {
    const { map, routesGroup } = this.context;
    // it's cheaper to remove and add instead of deep comparision
    if (this.route) {
      routesGroup.removeObject(this.routeLine);
    }
    this.addRouteToMap(nextProps.points)
  }
  // remove the marker on unmount of the component
  public componentWillUnmount() {
    const { map, routesGroup } = this.context;

    if (this.route) {
      routesGroup.removeObject(this.routeLine);
    }
  }

  public render(): JSX.Element {
    const {map} = this.context;

    if (map && !this.route) {
      this.addRouteToMap(this.props.points);
    }

    return null;
  }

  private addRouteToMap(points:Coordinates[]) {
    const {
      map,
      routesGroup,
    } = this.context;
    const { lineWidth, fillColor, strokeColor, data, zIndex } = this.props
    if (routesGroup) {
      let route: H.geo.LineString;
      let routeLine: H.map.Polyline;
      route = new H.geo.LineString();
      points.forEach(point => {
        const { lat, lon } = point
        route.pushPoint(new H.geo.Point(lat, lon));
      })
      routeLine = new H.map.Polyline(route, {
        style: { lineWidth, fillColor, strokeColor },
        arrows: { fillColor: 'white', frequency: 2, width: 0.8, length: 0.7 },
        zIndex,
        data
      });
      routesGroup.addObject(routeLine);
      this.route = route;
      this.routeLine = routeLine;
    }
  }

}
export default Route;
