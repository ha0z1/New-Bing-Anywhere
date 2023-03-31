import { repository, version } from '../../package.json'
import { BAND_MKTS, BING } from './constants'
import initContextMenu from './context_menus'
import initDynamicRules from './dynamic_rules'
import { getURL, getURLSearchParams, openPage, registryListener } from './utils'

initContextMenu()

registryListener({
  openUrlInSameTab: async ({ url }: { url: string } = {} as any) => {
    const tabs = await chrome.tabs.query({ currentWindow: true })
    const urlObj = getURL(url)
    let tab = tabs.find((tab) => tab.url?.startsWith(urlObj.origin))
    if (tab == null) {
      tab = await chrome.tabs.create({ url })
    } else {
      if (tab.id != null) {
        await Promise.all([
          chrome.tabs.move(tab.id, { index: tabs.length - 1 }),
          chrome.tabs.update(tab.id, { active: true })
        ])
      }
    }

    let newUrl = url
    let query = ''
    let tabQuery = ''
    const isGoogle = urlObj.hostname === 'www.google.com'
    const isBing = urlObj.hostname === 'www.bing.com'
    if (isGoogle) {
      query = urlObj.searchParams.get('q') ?? ''
      tabQuery = getURL(tab.url).searchParams.get('q') ?? ''
      getURL(tab.url).searchParams.get('q')
    } else if (isBing) {
      query = urlObj.searchParams.get('q') ?? ''
      tabQuery = getURL(tab.url).searchParams.get('q') ?? ''
    }

    query = query.trim()
    tabQuery = tabQuery.trim()

    if (query && query === tabQuery) return // 不刷新页面

    if (isGoogle) {
      newUrl = `${urlObj.origin}${urlObj.pathname}?q=${encodeURIComponent(query)}`
    } else if (isBing) {
      newUrl = `${urlObj.origin}${urlObj.pathname}?q=${encodeURIComponent(query)}`
      // newUrl = `${urlObj.origin}${urlObj.pathname}?q=${query}&showconv=1`
    }

    await chrome.tabs.update(tab.id!, { url: newUrl })
  }
})

chrome.runtime.onInstalled.addListener((details) => {
  initDynamicRules()
  const repositoryUrl: string = repository.url
  if (details.reason === 'install') {
    openPage(repositoryUrl)
  } else if (details.reason === 'update') {
    openPage(`${repositoryUrl}/releases/tag/${version}`)
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

        const searchObj = getURLSearchParams(value)
        const mkt = searchObj.get('mkt')?.toLowerCase() ?? ''

        if (!BAND_MKTS.map((m) => m.toLowerCase()).includes(mkt)) return
        searchObj.delete('mkt')
        chrome.cookies.set({
          url: BING,
          domain: cookie.domain,
          name: cookie.name,
          storeId: cookie.storeId,
          path: cookie.path,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          expirationDate: cookie.expirationDate,
          value: searchObj.toString()
        })
      }
    )
  },
  { urls: [BING + '*'], types: ['main_frame'] }
)
