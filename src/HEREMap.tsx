import { debounce, uniqueId } from "lodash";
import * as PropTypes from "prop-types";
import * as React from "react";
import * as ReactDOM from "react-dom";

import HMapMethods from "./mixins/h-map-methods";
import cache, { onAllLoad } from "./utils/cache";
import getLink from "./utils/get-link";
import getPlatform from "./utils/get-platform";
import getScriptMap from "./utils/get-script-map";
import { Language } from "./utils/languages";

// declare an interface containing the required and potential
// props that can be passed to the HEREMap component
export interface HEREMapProps extends H.Map.Options {
  apiKey: string;
  animateCenter?: boolean;
  animateZoom?: boolean;
  hidpi?: boolean;
  interactive?: boolean;
  lg?: Language;
  secure?: boolean;
  routes?: object[];
  transportData?: boolean;
  trafficLayer?: boolean;
  incidentsLayer?: boolean;
  useSatellite?: boolean;
  disableMapSettings?: boolean;
  onMapAvailable?: (state: HEREMapState) => void;
  language?: string;
  congestion?: boolean;
}

// declare an interface containing the potential state flags
export interface HEREMapState {
  map?: H.Map;
  behavior?: H.mapevents.Behavior;
  ui?: H.ui.UI;
  markersGroups: Record<string, H.map.Group>;
  routesGroup?: H.map.Group;
  trafficLayer?: boolean;
}

// declare an interface containing the context to be passed through the heirarchy
export interface HEREMapChildContext {
  map: H.Map;
}

// export the HEREMap React Component from this module
@HMapMethods
export class HEREMap
  extends React.Component<HEREMapProps, HEREMapState>
  implements React.ChildContextProvider<HEREMapChildContext> {
  public static childContextTypes = {
    addToMarkerGroup: PropTypes.func,
    map: PropTypes.object,
    removeFromMarkerGroup: PropTypes.func,
    routesGroup: PropTypes.object,
  };

  // add typedefs for the HMapMethods mixin
  public getElement: () => Element;
  public getMap: () => H.Map;
  public setCenter: (point: H.geo.IPoint) => void;
  public setZoom: (zoom: number) => void;

  // add the state property
  public state: HEREMapState = {
    markersGroups: {},
  };
  public defaultLayers: H.service.DefaultLayers;
  public trafficLayer: H.map.layer.TileLayer;

  private unmounted: boolean;

  private debouncedResizeMap: any;
  constructor(props: HEREMapProps, context: object) {
    super(props, context);

    this.unmounted = false;

    // bind all event handling methods to this
    this.resizeMap = this.resizeMap.bind(this);

    // debounce the resize map method
    this.debouncedResizeMap = debounce(this.resizeMap, 200);
    this.zoomOnMarkers = this.zoomOnMarkers.bind(this);
    this.screenToGeo = this.screenToGeo.bind(this);
    this.addToMarkerGroup = this.addToMarkerGroup.bind(this);
    this.removeFromMarkerGroup = this.removeFromMarkerGroup.bind(this);
  }
  public screenToGeo(x: number, y: number): H.geo.Point {
    const { map } = this.state;
    return map.screenToGeo(x, y);
  }
  public zoomOnMarkers(animate: boolean = true, group: string = "default") {
    const { map, markersGroups } = this.state;
    if (!markersGroups[group]) { return; }
    const viewBounds = markersGroups[group].getBoundingBox();
    if (viewBounds) {
      map.getViewModel().setLookAtData({
        bounds: viewBounds,
      }, animate);
    }
  }
  public zoomOnMarkersSet(markersSet: H.map.DomMarker[], animate: boolean = true) {
    const { map } = this.state;
    const markersGroupSet = new H.map.Group();
    markersSet.map((m) => markersGroupSet.addObject(m));
    const viewBounds = markersGroupSet.getBoundingBox();
    if (viewBounds) {
      map.getViewModel().setLookAtData({
        bounds: viewBounds,
      }, animate);

    }
  }
  public addToMarkerGroup(marker: H.map.Marker, group: string) {
    const { map, markersGroups } = this.state;
    if (!markersGroups[group]) {
      markersGroups[group] = new H.map.Group();
      map.addObject(markersGroups[group]);
    }
    markersGroups[group].addObject(marker);
  }
  public removeFromMarkerGroup(marker: H.map.Marker, group: string) {
    const { map, markersGroups } = this.state;
    if (markersGroups[group]) {
      markersGroups[group].removeObject(marker);
      if (markersGroups[group].getObjects().length === 0) {
        if (map.getObjects().length > 0) {
          map.removeObject(markersGroups[group]);
        }
        markersGroups[group] = null;
      }
    }
  }
  public getChildContext() {
    const { map, routesGroup } = this.state;
    const addToMarkerGroup = this.addToMarkerGroup;
    const removeFromMarkerGroup = this.removeFromMarkerGroup;
    return { map, addToMarkerGroup, removeFromMarkerGroup, routesGroup };
  }
  public componentDidMount() {
    const {
      secure,
    } = this.props;
    cache(getScriptMap(secure === true));
    // TODO(jlabeit): Upgrade to 3.1.
    const stylesheetUrl = `${secure === true ? "https:" : ""}//js.api.here.com/v3/3.0/mapsjs-ui.css`;
    getLink(stylesheetUrl, "HERE Maps UI");
    onAllLoad(() => {
      if (this.unmounted) {
        return;
      }

      const {
        center,
        hidpi,
        interactive,
        zoom,
        lg,
        onMapAvailable,
        disableMapSettings,
        language,
        congestion,
        apiKey,
      } = this.props;

      // get the platform to base the maps on
      const platform = getPlatform({
        apikey: apiKey,
        useHTTPS: secure === true,
      });
      this.defaultLayers = platform.createDefaultLayers({
        lg,
        ppi: hidpi ? 320 : 72,
      });

      const trafficService = platform.getTrafficService();
      // TODO(jlabeit): Fix HERE types.
      // @ts-ignore
      const trafficProvider = new H.service.traffic.flow.Provider(trafficService);
      this.trafficLayer = new H.map.layer.TileLayer(trafficProvider);

      const hereMapEl = ReactDOM.findDOMNode(this) as Element;

      // TODO(jlabeit): Fix HERE types.
      // @ts-ignore
      const baseLayer = this.defaultLayers.vector.normal.truck as H.map.layer.TileLayer
      const map = new H.Map(
        hereMapEl.querySelector(".map-container"),
        baseLayer, {
        center,
        pixelRatio: hidpi ? 2 : 1,
        zoom,
      });
      const routesGroup = new H.map.Group();
      map.addObject(routesGroup);
      let ui: H.ui.UI;
      if (interactive !== false) {
        // make the map interactive
        // MapEvents enables the event system
        // Behavior implements default interactions for pan/zoom
        const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

        // create the default UI for the map
        ui = H.ui.UI.createDefault(map, this.defaultLayers, language);
        if (disableMapSettings) {
          ui.removeControl("mapsettings");
        }
        this.setState({
          behavior,
          ui,
        });
      }
      // make the map resize when the window gets resized
      window.addEventListener("resize", this.debouncedResizeMap);
      // attach the map object to the component"s state
      this.setState({ map, routesGroup }, () => onMapAvailable(this.state));
    });
  }

  public componentWillUnmount() {
    this.unmounted = true;
    // make the map resize when the window gets resized
    this.debouncedResizeMap.cancel();
    window.removeEventListener("resize", this.debouncedResizeMap);
    if (this.getMap()) {
      this.getMap().dispose();
    }
  }
  // change the zoom and center automatically if the props get changed
  public componentWillReceiveProps(nextProps: HEREMapProps) {
    const props = this.props;
    const map = this.getMap();
    if (!map) { return; }

    if (props.trafficLayer !== nextProps.trafficLayer) {
      if (nextProps.trafficLayer) {
        map.addLayer(this.trafficLayer);
      } else {
        map.removeLayer(this.trafficLayer);
      }
    }
    if (props.useSatellite !== nextProps.useSatellite) {
      if (nextProps.useSatellite) {
        map.setBaseLayer(this.defaultLayers.raster.satellite.base);
      } else {
        map.setBaseLayer(this.defaultLayers.vector.normal.map);
      }
    }
  }

  public render() {
    const { children } = this.props;
    return (
      <div className="heremap" style={{ height: "100%" }}>
        <div
          className="map-container"
          id={`map-container-${uniqueId()}`}
          style={{ height: "100%" }}
        >
          {children}
        </div>
      </div>
    );
  }

  private resizeMap() {
    const {
      map,
    } = this.state;

    if (map) {
      map.getViewPort().resize();
    }
  }
}

// make the HEREMap component the default export
export default HEREMap;
