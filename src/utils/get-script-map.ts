// declare an interface representing the URL map that
// is returned from this method
export interface ScriptMap {
  [key: string]: string;
}

export function getScriptMap(secure?: boolean): ScriptMap {
  // store the versions of the HERE API
  const apiVersion = "v3";
  const codeVersion = "3.1";

  // get the relevant protocol for the HERE Maps API
  let protocol = "";

  if (secure === true) {
    protocol = "https:";
  }

  // the base url for all scripts from the API
  const baseUrl: string = `${protocol}//js.api.here.com/` +
    `${apiVersion}/${codeVersion}`;

  // core code
  const coreScript: string =
    `${baseUrl}/mapsjs-core.js`;

  // core legacy code
  const coreLegacyScript: string =
    `${baseUrl}/mapsjs-core-legacy.js`;

  // service code
  const serviceScript: string =
    `${baseUrl}/mapsjs-service.js`;

  // service legacy code
  const serviceLegacyScript: string =
    `${baseUrl}/mapsjs-service-legacy.js`;

  // default ui code
  const uiScript: string =
    `${baseUrl}/mapsjs-ui.js`;

  // map events (pan, scroll wheel zoom) code
  const mapEventsScript: string =
    `${baseUrl}/mapsjs-mapevents.js`;

  // clustering module
  const clusteringScript: string =
    `${baseUrl}/mapsjs-clustering.js`;

  // default ui css
  const uiCss: string =
    `${baseUrl}/mapsjs-ui.css`;

  // return an array with all script names within
  return {
    clusteringScript,
    coreLegacyScript,
    coreScript,
    mapEventsScript,
    serviceLegacyScript,
    serviceScript,
    uiCss,
    uiScript,
  };
}

// make the getScriptMap method the default export
export default getScriptMap;
