import { extensionName } from '../../package.json'
import bingHandler from './bing-handler'
import googleHandler from './google-handler'
import { callMethod } from './utils'
;(async ($) => {
  const $document = $(document.documentElement)
  if ($document.find(`meta[name="${extensionName}"]`).length) return
  const $meta = $(`<meta name="${extensionName}" />`)

  $document.prepend($meta)

  callMethod('getEnv').then((env) => {
    $meta.attr('content', env.version)
  })

  if (location.hostname === 'www.bing.com') {
    await bingHandler($)
  }

  if (location.hostname.startsWith('www.google.')) {
    await googleHandler($)
  }
})((window as any).Zepto)
