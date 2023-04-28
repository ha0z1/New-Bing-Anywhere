import { getConfig } from '@@/utils'
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

  const config = await getConfig()

  if (location.hostname === 'www.bing.com') {
    await bingHandler(config, $, $document)
  }

  if (location.hostname.startsWith('www.google.')) {
    await googleHandler(config, $, $document)
  }
})((window as any).Zepto)
