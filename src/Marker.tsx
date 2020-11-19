// a "normal" marker that uses a static image as an icon.
// large numbers of markers of this type can be added to the map
// very quickly and efficiently

import * as PropTypes from "prop-types";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import * as isEqual from "react-fast-compare";
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

// declare an interface containing the potential context parameters
export interface MarkerContext {
  map: H.Map;
  addToMarkerGroup: (marker: H.map.Marker, group: string) => void;
  removeFromMarkerGroup: (marker: H.map.Marker, group: string) => void;
}

// export the Marker React component from this module
export class Marker extends React.Component<MarkerProps, object> {
  // define the context types that are passed down from a <HEREMap> instance
  public static contextTypes = {
    addToMarkerGroup: PropTypes.func,
    map: PropTypes.object,
    removeFromMarkerGroup: PropTypes.func,
  };
  public static defaultProps = { draggable: false, group: "default" };
  public context: MarkerContext;

  private marker: H.map.DomMarker | H.map.Marker;
  public constructor(props: MarkerProps, context: MarkerContext) {
    super(props, context);
  }
  // change the position automatically if the props get changed
  public componentWillReceiveProps(nextProps: MarkerProps) {
    if (!this.context.map) {
      return;
    }
    // Rerender the marker if child props change
    const nextChildProps = nextProps.children && nextProps.children.props;
    const childProps = this.props.children && this.props.children.props;
    if (nextProps.group !== this.props.group) {
      const { removeFromMarkerGroup } = this.context;
      if (this.marker) {
        removeFromMarkerGroup(this.marker, this.props.group);
      }
      this.marker = this.renderChildren(nextProps);
      return;
    }
    if (!this.marker) {
      return;
    }
    if ((nextChildProps && !isEqual(nextChildProps, childProps))) {
      const html = ReactDOMServer.renderToStaticMarkup((
        <div className="dom-marker">
          {nextProps.children}
        </div>
      ));
      this.marker.setIcon(getDomMarkerIcon(html));
    }
    if (!nextChildProps && !childProps && (nextProps.bitmap)) {
      this.marker.setIcon(getMarkerIcon(nextProps.bitmap));
    }
    if (nextProps.data !== this.props.data) {
      this.marker.setData(nextProps.data);
    }
    if (nextProps.draggable !== this.props.draggable) {
      this.marker.draggable = true;
    }
    if (nextProps.lat !== this.props.lat || nextProps.lng !== this.props.lng) {
      this.setPosition({
        lat: nextProps.lat,
        lng: nextProps.lng,
      });
    }
  }

  // remove the marker on unmount of the component
  public componentWillUnmount() {
    const { removeFromMarkerGroup } = this.context;

    if (this.marker) {
      removeFromMarkerGroup(this.marker, this.props.group);
    }
  }

  public render(): JSX.Element {
    const { map } = this.context;
    if (map && !this.marker) {
      this.addMarkerToMap();
    }

    return null;
  }

  private renderChildren(props: MarkerProps) {
    const { addToMarkerGroup, map } = this.context;
    if (!map) {
      throw new Error("Map has to be loaded before performing this action");
    }

    // if children are provided, we render the provided react
    // code to an html string
    const html = ReactDOMServer.renderToStaticMarkup((
      <div className="dom-marker">
        {props.children}
      </div>
    ));

    // we then get a dom icon object from the wrapper method
    const icon = getDomMarkerIcon(html);

    // then create a dom marker instance and attach it to the map,
    // provided via context
    const { lat, lng } = props;
    const marker = new H.map.DomMarker({ lat, lng }, { icon });
    marker.draggable = props.draggable;
    marker.setData(props.data);
    addToMarkerGroup(marker, props.group);
    return marker;
  }

  private addMarkerToMap() {
    const { addToMarkerGroup, map } = this.context;
    if (!map) {
      throw new Error("Map has to be loaded before performing this action");
    }

    const {
      children,
      bitmap,
      lat,
      lng,
      group,
    } = this.props;

    let marker: H.map.DomMarker | H.map.Marker;
    if (React.Children.count(children) > 0) {
      marker = this.renderChildren(this.props);
    } else if (bitmap) {
      // if we have an image url and no react children, create a
      // regular icon instance
      const icon = getMarkerIcon(bitmap);

      // then create a normal marker instance and attach it to the map
      marker = new H.map.Marker({ lat, lng }, { icon });
      addToMarkerGroup(marker, group);
    } else {
      // create a default marker at the provided location
      marker = new H.map.Marker({ lat, lng });
      addToMarkerGroup(marker, group);
    }

    this.marker = marker;
  }

  private setPosition(point: H.geo.IPoint): void {
    this.marker.setGeometry(point);
  }
}

// make the Marker component the default export
export default Marker;
