// import from npm
import loadjs from "loadjs";
import getScriptMap from "./get-script-map";

/**
 * @deprecated use loadScripts instead
 */
export const loadScriptsStandAlone = async (secure = true) => {
  return loadScripts(secure);
};

const loadJsDefaultOptions = {
  numRetries: 3,
  returnPromise: true,
};

export const loadScripts = async (secure = true) => {
  const { coreScript, ...scripts } = getScriptMap(secure);
  if (!loadjs.isDefined("mapsjs-core")) {
    // Make sure this is loaded before the others
    await loadjs(coreScript, "mapsjs-core", loadJsDefaultOptions);
  }
  if (!loadjs.isDefined("mapsjs")) {
    await loadjs(Object.values(scripts), "mapsjs", loadJsDefaultOptions);
  }
};
