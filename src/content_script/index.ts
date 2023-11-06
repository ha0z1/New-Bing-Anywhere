import { callBackground, getURL, isChinese } from '@ha0z1/extension-utils'
import { checkIsGoogle, checkIsBing } from 'global/check'
import { getConfig } from 'global/config'
import $ from 'jquery'
import { extensionName } from '../../package.json'
import bingHandler from './bing-handler'
import chatHandler from './chat-handler'
import googleHandler from './google-handler'
import offscreenHandler from '../offscreen/content'

const isInIframe = window !== top
;(async ($) => {
  if (isInIframe && location.hash.includes('###new-bing-anywhere-offscreen')) {
    offscreenHandler()
    return
  }

  if (isInIframe) return

  const $document = $(document.documentElement)
  if ($document.find(`meta[name="${extensionName}"]`).length) return
  const $meta = $(`<meta name="${extensionName}" />`)

  $document.prepend($meta)

  callBackground('getEnv').then((env) => {
    $meta.attr('content', env.version)
  })

  getConfig().then((config) => {
    if (config.showSidebar) {
      chatHandler(config)
    }
  })

  if (checkIsBing()) {
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
