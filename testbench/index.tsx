import React from 'react'
import ReactDOM from 'react-dom'

import { HEREMap } from '../src/HEREMap'

if (!process.env.HERE_APIKEY) {
  console.error('Missing HERE_APIKEY environment variable.')
  process.exit(1)
}

ReactDOM.render(
  <HEREMap
    apiKey={process.env.HERE_APIKEY}
    center={{ lat: 51.528098, lng: 9.951222 }}
    zoom={6}
    truckRestrictions
    // trafficLayer
    // useVectorTiles
    onMapAvailable={() => console.log('Map is available')}
    disableMapSettings
    hidpi={devicePixelRatio > 1}
  />,
  document.getElementById('root'),
)
