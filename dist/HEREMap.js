"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var lodash_1 = require("lodash");
var React = require("react");
var ReactDOM = require("react-dom");
var PropTypes = require("prop-types");
var h_map_methods_1 = require("./mixins/h-map-methods");
var cache_1 = require("./utils/cache");
var get_link_1 = require("./utils/get-link");
var get_platform_1 = require("./utils/get-platform");
var get_script_map_1 = require("./utils/get-script-map");
// export the HEREMap React Component from this module
var HEREMap = /** @class */ (function (_super) {
    __extends(HEREMap, _super);
    function HEREMap(props, context) {
        var _this = _super.call(this, props, context) || this;
        // add the state property
        _this.state = {};
        // bind all event handling methods to this
        _this.resizeMap = _this.resizeMap.bind(_this);
        // debounce the resize map method
        _this.debouncedResizeMap = lodash_1.debounce(_this.resizeMap, 200);
        _this.zoomOnMarkers = _this.zoomOnMarkers.bind(_this);
        _this.screenToGeo = _this.screenToGeo.bind(_this);
        return _this;
    }
    HEREMap.prototype.screenToGeo = function (x, y) {
        var map = this.state.map;
        return map.screenToGeo(x, y);
    };
    HEREMap.prototype.zoomOnMarkers = function (animate) {
        if (animate === void 0) { animate = true; }
        var _a = this.state, map = _a.map, markersGroup = _a.markersGroup;
        if (!markersGroup)
            return;
        var viewBounds = markersGroup.getBounds();
        if (viewBounds)
            map.setViewBounds(viewBounds, animate);
    };
    HEREMap.prototype.getChildContext = function () {
        var _a = this.state, map = _a.map, markersGroup = _a.markersGroup, routesGroup = _a.routesGroup;
        return { map: map, markersGroup: markersGroup, routesGroup: routesGroup };
    };
    HEREMap.prototype.componentDidMount = function () {
        var _this = this;
        var secure = this.props.secure;
        cache_1["default"](get_script_map_1["default"](secure === true));
        var stylesheetUrl = (secure === true ? "https:" : "") + "//js.api.here.com/v3/3.0/mapsjs-ui.css";
        get_link_1["default"](stylesheetUrl, "HERE Maps UI");
        cache_1.onAllLoad(function () {
            var _a = _this.props, appId = _a.appId, appCode = _a.appCode, center = _a.center, hidpi = _a.hidpi, interactive = _a.interactive, secure = _a.secure, zoom = _a.zoom, routes = _a.routes, useSatellite = _a.useSatellite, trafficLayer = _a.trafficLayer, onMapAvailable = _a.onMapAvailable, disableMapSettings = _a.disableMapSettings, language = _a.language;
            // get the platform to base the maps on
            var platform = get_platform_1["default"]({
                app_code: appCode,
                app_id: appId,
                useHTTPS: secure === true
            });
            _this.defaultLayers = platform.createDefaultLayers({
                ppi: hidpi ? 320 : 72
            });
            var truckOverlayLayerOptions = {
                label: 'Tile Info Overlay',
                descr: "",
                min: 8,
                max: 20,
                getURL: function (col, row, level) {
                    return ["https://",
                        "1.base.maps.cit.api.here.com/maptile/2.1/truckonlytile/newest/normal.day/",
                        level,
                        "/",
                        col,
                        "/",
                        row,
                        "/256/png8",
                        "?style=fleet",
                        "&app_code=",
                        appCode,
                        "&app_id=",
                        appId
                    ].join("");
                }
            };
            var truckOverlayProvider = new H.map.provider.ImageTileProvider(truckOverlayLayerOptions);
            _this.truckOverlayLayer = new H.map.layer.TileLayer(truckOverlayProvider);
            var hereMapEl = ReactDOM.findDOMNode(_this);
            var baseLayer = _this.defaultLayers.normal.map;
            var map = new H.Map(hereMapEl.querySelector(".map-container"), baseLayer, {
                center: center,
                pixelRatio: hidpi ? 2 : 1,
                zoom: zoom
            });
            var markersGroup = new H.map.Group();
            var routesGroup = new H.map.Group();
            map.addObject(markersGroup);
            map.addObject(routesGroup);
            if (_this.props.transportData)
                map.addLayer(_this.truckOverlayLayer);
            if (interactive !== false) {
                // make the map interactive
                // MapEvents enables the event system
                // Behavior implements default interactions for pan/zoom
                var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
                // create the default UI for the map
                var ui = H.ui.UI.createDefault(map, _this.defaultLayers, language);
                disableMapSettings && ui.removeControl('mapsettings');
                _this.setState({
                    behavior: behavior,
                    ui: ui
                });
                onMapAvailable(map, ui);
            }
            if (trafficLayer) {
                if (useSatellite)
                    map.setBaseLayer(_this.defaultLayers.satellite.traffic);
                else
                    map.setBaseLayer(_this.defaultLayers.normal.traffic);
            }
            else {
                if (useSatellite)
                    map.setBaseLayer(_this.defaultLayers.satellite.map);
                else
                    map.setBaseLayer(_this.defaultLayers.normal.map);
            }
            // make the map resize when the window gets resized
            window.addEventListener("resize", _this.debouncedResizeMap);
            // attach the map object to the component"s state
            _this.setState({ map: map, markersGroup: markersGroup, routesGroup: routesGroup });
        });
    };
    HEREMap.prototype.componentWillUnmount = function () {
        // make the map resize when the window gets resized
        window.removeEventListener("resize", this.debouncedResizeMap);
    };
    // change the zoom and center automatically if the props get changed
    HEREMap.prototype.componentWillReceiveProps = function (nextProps) {
        var map = this.getMap();
        if (!map)
            return;
        if (nextProps.trafficLayer) {
            if (nextProps.useSatellite)
                map.setBaseLayer(this.defaultLayers.satellite.traffic);
            else
                map.setBaseLayer(this.defaultLayers.normal.traffic);
        }
        else {
            if (nextProps.useSatellite)
                map.setBaseLayer(this.defaultLayers.satellite.map);
            else
                map.setBaseLayer(this.defaultLayers.normal.map);
        }
        if (nextProps.transportData) {
            map.addLayer(this.truckOverlayLayer);
        }
        else {
            map.removeLayer(this.truckOverlayLayer);
        }
        if (nextProps.incidentsLayer) {
            map.addLayer(this.defaultLayers.incidents);
        }
        else {
            map.removeLayer(this.defaultLayers.incidents);
        }
    };
    HEREMap.prototype.render = function () {
        var children = this.props.children;
        return (React.createElement("div", { className: "heremap", style: { height: "100%" } },
            React.createElement("div", { className: "map-container", id: "map-container-" + lodash_1.uniqueId(), style: { height: "100%" } }, children)));
    };
    HEREMap.prototype.resizeMap = function () {
        var map = this.state.map;
        if (map) {
            map.getViewPort().resize();
        }
    };
    HEREMap.childContextTypes = {
        map: PropTypes.object,
        markersGroup: PropTypes.object,
        routesGroup: PropTypes.object
    };
    HEREMap = __decorate([
        h_map_methods_1["default"]
    ], HEREMap);
    return HEREMap;
}(React.Component));
exports.HEREMap = HEREMap;
// make the HEREMap component the default export
exports["default"] = HEREMap;
