import { getAllTabs, ls, unique } from '@@/utils'

const APP_URL = chrome.runtime.getURL('app/index.html')

export const dumpTabs = async ({ windowId }): Promise<void> => {
  const [currentTabs, [currentTab]] = await Promise.all([
    getAllTabs(),
    chrome.tabs.query({ active: true, currentWindow: true })
  ])

  await ls.set('currentTabs', unique(currentTabs, 'url'))

  const tabs = await chrome.tabs.query({
    url: APP_URL,
    windowId
  })

  let AppTab = tabs.find((tab) => tab.url === APP_URL)
  if (AppTab == null) {
    AppTab = await chrome.tabs.create({ url: APP_URL })
  }

  if (AppTab.id != null) {
    await Promise.all([
      chrome.tabs.move(AppTab.id, { index: 0 }),
      chrome.tabs.update(AppTab.id, { active: true, pinned: true })
    ])
  }

  const openedTabs = await chrome.tabs.query({ windowId })

  openedTabs.forEach(async (tab) => {
    try {
      if (tab.id == null) return
      if (tab.url == null) return
      if (['chrome://newtab/'].includes(tab.url)) {
        await chrome.tabs.remove(tab.id)
      }
      if (tab.id === AppTab?.id) return
      if (tab.pinned) return
      if (tab.audible === true) return
      if (tab.highlighted) return
      if (tab.active) return

      if (tab.id === currentTab.id) return

      await chrome.tabs.remove(tab.id)
    } catch {}
  })
}

export const getURL = (url: string = '', base?: string): URL => {
  try {
    return new URL(url, base)
  } catch (e) {
    // console.error(e)
    return {
      searchParams: {
        get: () => null
      }
    } as any
  }
}

type IMethods = Record<string, (...args: any[]) => Promise<any>>

export const registryListener = (callMethods: IMethods) => {
  chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    ;(async () => {
      // 如果不使用同步返回 true，会报 Unchecked runtime.lastError: The message port closed before a response was received.
      try {
        const { method, args } = req
        const data = await callMethods[method](...args)
        sendResponse({ code: 200, msg: 'ok', data })
      } catch (e: any) {
        const err = e ?? {}
        sendResponse({ code: 500, msg: err.stack ?? err.message ?? e })
      }
    })()
    return true
  })
}

export const openPage = async (url: string): Promise<chrome.tabs.Tab> => {
  const tabs = await chrome.tabs.query({ currentWindow: true })

  const urlObj = getURL(url)
  let tab = tabs.find((tab) => tab.url?.startsWith(urlObj.origin))

  if (tab == null) {
    tab = await chrome.tabs.create({ url })
  } else {
    await Promise.all([
      chrome.tabs.move(tab.id!, { index: tabs.length - 1 }),
      chrome.tabs.update(tab.id!, { active: true })
    ])
  }
  return tab
}
