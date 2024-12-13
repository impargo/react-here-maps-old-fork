import '@here/maps-api-for-javascript/bin/mapsjs.bundle.harp.js'

let platform: H.service.Platform

// return the current platform if there is one,
// otherwise open up a new platform
export function getPlatform (platformOptions: H.service.Platform.Options) {
  if (platform) {
    return platform
  }

  platform = new H.service.Platform(platformOptions)

  return platform
}

// make the getPlatform method the default export
export default getPlatform
