import { createContext } from "react";

export interface HEREMapContextType {
  map?: H.Map;
  routesGroup?: H.map.Group;
  removeFromMarkerGroup: (marker: H.map.Marker, group: string) => void;
  addToMarkerGroup: (marker: H.map.Marker, group: string) => void;
}

export const HEREMapContext = createContext<HEREMapContextType>({
  addToMarkerGroup: () => undefined,
  removeFromMarkerGroup: () => undefined,
});
