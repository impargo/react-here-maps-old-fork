export const loadScripts = async (_secure = true, _loadLegacyModules = true) => {
  // @ts-ignore
  await import('@here/maps-api-for-javascript/bin/mapsjs.bundle.harp.js')
}

/**
 * @deprecated use loadScripts instead
 */
export const loadScriptsStandAlone = async (secure = true) => {
  return loadScripts(secure)
}
