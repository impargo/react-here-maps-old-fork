"use strict";
// a "normal" marker that uses a static image as an icon.
// large numbers of markers of this type can be added to the map
// very quickly and efficiently
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
exports.__esModule = true;
var React = require("react");
var PropTypes = require("prop-types");
// export the Marker React component from this module
var Route = /** @class */ (function (_super) {
    __extends(Route, _super);
    function Route() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Route.prototype.componentWillReceiveProps = function (nextProps) {
        var _a = this.context, map = _a.map, routesGroup = _a.routesGroup;
        // it's cheaper to remove and add instead of deep comparision
        if (this.route) {
            routesGroup.removeObject(this.routeLine);
        }
        this.addRouteToMap(nextProps.points);
    };
    // remove the marker on unmount of the component
    Route.prototype.componentWillUnmount = function () {
        var _a = this.context, map = _a.map, routesGroup = _a.routesGroup;
        if (this.route) {
            routesGroup.removeObject(this.routeLine);
        }
    };
    Route.prototype.render = function () {
        var map = this.context.map;
        if (map && !this.route) {
            this.addRouteToMap(this.props.points);
        }
        return null;
    };
    Route.prototype.addRouteToMap = function (points) {
        var _a = this.context, map = _a.map, routesGroup = _a.routesGroup;
        var _b = this.props, lineWidth = _b.lineWidth, fillColor = _b.fillColor, strokeColor = _b.strokeColor, data = _b.data, zIndex = _b.zIndex;
        if (routesGroup) {
            var route_1;
            var routeLine = void 0;
            route_1 = new H.geo.LineString();
            points.forEach(function (point) {
                var lat = point.lat, lon = point.lon;
                route_1.pushPoint(new H.geo.Point(lat, lon));
            });
            routeLine = new H.map.Polyline(route_1, { style: { lineWidth: lineWidth, fillColor: fillColor, strokeColor: strokeColor }, zIndex: zIndex, data: data });
            routesGroup.addObject(routeLine);
            this.route = route_1;
            this.routeLine = routeLine;
        }
    };
    // define the context types that are passed down from a <HEREMap> instance
    Route.contextTypes = {
        map: PropTypes.object,
        routesGroup: PropTypes.object
    };
    Route.defaultProps = { lineWidth: 4, fillColor: 'blue', strokeColor: 'blue' };
    return Route;
}(React.Component));
exports.Route = Route;
exports["default"] = Route;
