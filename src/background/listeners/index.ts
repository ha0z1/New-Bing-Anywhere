import { getURL, version } from '@@/utils'
import { getNotification, hideNotification } from './_notification'

const getEnv = async () => {
  return {
    version
  }
}

const openUrlInSameTab = async ({ url }: { url: string } = {} as any) => {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  const urlObj = getURL(url)
  let tab = tabs.find((tab) => tab.url?.startsWith(urlObj.origin))
  if (tab == null) {
    tab = await chrome.tabs.create({ url })
  } else {
    if (tab.id != null) {
      await Promise.all([chrome.tabs.move(tab.id, { index: tabs.length - 1 }), chrome.tabs.update(tab.id, { active: true })])
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

export default {
  getEnv,
  openUrlInSameTab,

  getNotification,
  hideNotification
}
