import { callBackground, checkIsGoogle, getConfig } from '@@/utils'
import $ from 'jquery'
import { extensionName } from '../../package.json'
import bingHandler from './bing-handler'
import chatHandler from './chat-handler'
import googleHandler from './google-handler'
;(async ($) => {
  const $document = $(document.documentElement)
  if ($document.find(`meta[name="${extensionName}"]`).length) return
  const $meta = $(`<meta name="${extensionName}" />`)

  $document.prepend($meta)

  callBackground('getEnv').then((env) => {
    $meta.attr('content', env.version)
  })

  getConfig().then((config) => {
    if (config.showChat) {
      chatHandler(config)
    }
  })

  if (location.hostname === 'www.bing.com') {
    bingHandler()
  }

  if (checkIsGoogle()) {
    googleHandler()
  }
})($)
