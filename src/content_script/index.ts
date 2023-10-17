import { callBackground, checkIsGoogle, getConfig, getURL, isBrave, isChinese } from '@@/utils'
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

  // if (isBrave) {
  //   const val = await callBackground('getBraveReload')
  //   const tmpVal = await callBackground('getBraveReloadTmp')

  //   console.log(111111, val, tmpVal)
  //   if (val) {
  //     callBackground('setBraveReloadTmp', [true])
  //   }
  //   console.log(2222222, await callBackground('getBraveReload'), await callBackground('getBraveReloadTmp'))
  //   if (!tmpVal) {
  //     callBackground('setBraveReload', [false])
  //   }

  //   if (val === 2) {
  //     await callBackground('setBraveReload', [true])
  //     await callBackground('setBraveReloadTmp', [true])
  //   }

  //   console.log(3333333, await callBackground('getBraveReload'), await callBackground('getBraveReloadTmp'))
  //   if (!val && !tmpVal) {
  //     console.log(44444444, val, tmpVal)
  //     callBackground('setBraveReload', [2])
  //     await callBackground('runtimeReload')
  //   }

  //   console.log(5555555, await callBackground('getBraveReload'), await callBackground('getBraveReloadTmp'))
  //   if (!tmpVal) {
  //     callBackground('setBraveReload', [false])
  //   }

  //   if (!val) {
  //     callBackground('setBraveReloadTmp', [false])
  //   }

  //   if (!val && !tmpVal) {
  //     await callBackground('setBraveReload', [true])
  //   }
  // }

  if (isChinese) {
    if (location.hostname.endsWith('aiplus.lol')) {
      $(document).on('click', 'a', (e) => {
        const $this = $(e.currentTarget)
        const href = $this.attr('href')
        const url = getURL(href)
        const { hostname, pathname, searchParams } = url

        if (hostname === 'ai.aiplus.lol' && pathname === '/') {
          searchParams.set('inVitecode', 'WPYDMSUVIP')
          url.search = searchParams.toString()
          const newUrl = url.toString()
          $this.attr('href', newUrl)
        }
      })
    }
  }
})($)
