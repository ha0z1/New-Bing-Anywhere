import { getAllTabs, ls, unique } from '@@/utils'

export const dumpTabs = async ({ windowId }): Promise<void> => {
  const APP_URL = chrome.runtime.getURL('app/index.html')

  const [currentTabs, [currentTab]] = await Promise.all([getAllTabs(), chrome.tabs.query({ active: true, currentWindow: true })])

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
    await Promise.all([chrome.tabs.move(AppTab.id, { index: 0 }), chrome.tabs.update(AppTab.id, { active: true, pinned: true })])
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setCookie = async (options: chrome.cookies.SetDetails, cookie: chrome.cookies.Cookie = {} as any) => {
  return await chrome.cookies.set({
    domain: cookie.domain,
    storeId: cookie.storeId,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    expirationDate: cookie.expirationDate,
    ...options
  })
}
