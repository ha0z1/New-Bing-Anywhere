import { BAND_MKTS, BING } from '@@/constants'
import { isCanary, registryListener, version, getConfig } from '@@/utils'

import { repository } from '../../package.json'
import initContextMenu from './context_menus'
import listeners from './listeners'
import { getURLSearchParams, openPage, setCookie } from './utils'

export default () => {
  initContextMenu()
  registryListener(listeners)

  chrome.runtime.onInstalled.addListener(async (details) => {
    const config = await getConfig()
    const repositoryUrl: string = repository.url
    // const debugurl = 'https://www.bing.com/search?q=Edge%20%E4%B8%8B%E8%BD%BD&showconv=1&FORM=hpcodx'
    // if (debugurl) {
    //   openPage(debugurl)
    //   return
    // }
    if (isCanary) {
      openPage(`${repositoryUrl}/tree/canary`)
      return
    }
    if (details.reason === 'install') {
      openPage(repositoryUrl)
    } else if (details.reason === 'update' && config.showRelease) {
      openPage(`${repositoryUrl}/releases/tag/v${version}`)
    }
  })

  chrome.webRequest.onBeforeRequest.addListener(
    () => {
      chrome.cookies.get(
        {
          name: '_EDGE_S',
          url: BING
        },
        (cookie) => {
          const value = cookie?.value
          if (!value) return

          const valueObj = getURLSearchParams(value)
          const mkt = valueObj.get('mkt')?.toLowerCase() ?? ''

          if (!BAND_MKTS.map((m) => m.toLowerCase()).includes(mkt)) return
          if (mkt === 'zh-cn') {
            valueObj.set('mkt', 'zh-HK')
            valueObj.set('ui', 'zh-hans')
          } else {
            valueObj.delete('mkt')
          }

          setCookie(
            {
              url: BING,
              name: cookie.name,
              value: valueObj.toString()
            },
            cookie
          )
        }
      )

      chrome.cookies.get(
        {
          name: '_RwBf',
          url: BING
        },
        (cookie) => {
          const value = cookie?.value
          if (!value) {
            setCookie({
              url: BING,
              name: '_RwBf',
              value: 'wls=2',
              domain: '.bing.com',
              httpOnly: true
            })
            return
          }

          const valueObj = getURLSearchParams(value)
          const wls = valueObj.get('wls')
          if (wls !== '2' && wls !== '') {
            valueObj.set('wls', '2')
          }
          setCookie(
            {
              url: BING,
              name: '_RwBf',
              domain: '.bing.com',
              httpOnly: true,
              value: valueObj.toString()
            },
            cookie
          )
        }
      )
    },
    { urls: [BING + '*'], types: ['main_frame'] }
  )
}
