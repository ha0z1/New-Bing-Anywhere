import { getAllTabs, isChinese as checkIsChinese, ls, unique } from '@@/utils'
import { repository, version } from '../../package.json'

const APP_URL = chrome.runtime.getURL('app/index.html')
export const isChinese = checkIsChinese()

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

export const getURLSearchParams = (url: string): URLSearchParams => {
  try {
    return new URLSearchParams(url)
  } catch {
    return {
      get: () => null
    } as any
  }
}

type IMethods = Record<string, (...args: any[]) => Promise<any>>

export const registryListener = (callMethods: IMethods) => {
  chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    ;(async () => {
      // if not return true immediately，will throw error `Unchecked runtime.lastError: The message port closed before a response was received.`
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
    await Promise.all(
      [
        chrome.tabs.move(tab.id!, { index: tabs.length - 1 }),
        tab.url !== url && chrome.tabs.update(tab.id!, { url }),
        chrome.tabs.update(tab.id!, { active: true, url: tab.url !== url ? url : undefined })
      ].filter(Boolean)
    )
  }
  return tab
}

export const genIssueUrl = async () => {
  const repositoryUrl: string = repository.url
  const url: string = `${repositoryUrl}/issues/new?title=&body=`
  let finalUrl: string = url
  let comment =
    'Please write your comment ABOVE this line, provide as much detailed information and screenshots as possible.' +
    'The UA may not necessarily reflect your actual browser and platform, so please make sure to indicate them clearly.'
  if (isChinese) {
    comment =
      '请在此行上方发表您的讨论。详尽的描述和截图有助于我们定位问题，UA 不一定真实反映您的浏览器和平台，请备注清楚'
  }

  const body =
    ' \n\n\n\n' +
    `<!--  ${comment} -->\n` +
    `Version: ${version}\n` +
    `UA: ${navigator.userAgent}\n` +
    `Lang: ${chrome.i18n.getUILanguage()}\n` +
    `AcceptLangs: ${(await chrome.i18n.getAcceptLanguages()).join(', ')}`

  finalUrl += encodeURIComponent(body.slice(0, 2000))
  return finalUrl
}

interface ICookieOptions {
  url: string
  name: string
  value: string
  domain?: string
  httpOnly?: boolean
}

export const setCookie = async ({ url, name, value }: ICookieOptions, cookie: chrome.cookies.Cookie = {} as any) => {
  return await chrome.cookies.set({
    ...{
      domain: cookie.domain,
      storeId: cookie.storeId,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expirationDate: cookie.expirationDate
    },
    name,
    value,
    url
  })
}
