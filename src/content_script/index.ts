import { callBackground, checkIsGoogle, getConfig, getURL, isChinese } from '@@/utils'
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

  if (isChinese) {
    if (location.hostname.endsWith('aiplus.lol')) {
      $(document).on('click', 'a', (e) => {
        const $this = $(e.currentTarget)
        const href = $this.attr('href')
        const url = getURL(href)
        const { hostname, pathname, searchParams } = url

        if (hostname === 'aiplus.lol' && pathname === '/') {
          searchParams.set('inVitecode', 'WPYDMSUVIP')
          url.search = searchParams.toString()
          const newUrl = url.toString()
          $this.attr('href', newUrl)
        }
      })
    }
  }
})($)
