import { FULL_VERSION, MAIN_VERSION } from './constants'

const userAgent = navigator.userAgent

export const isMac = userAgent.includes('Macintosh')
export const isFirefox = userAgent.includes('Firefox')
export const isEdge = userAgent.includes('Edg/')

export const ls = {
  set: async (key: string, value: any) => {
    return await new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          [key]: value
        },
        () => {
          resolve(undefined)
        }
      )
    })
  },
  get: async (key: string) => {
    return await new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key])
      })
    })
  }
}

export const getAllTabs = async (queryInfo: chrome.tabs.QueryInfo = { status: 'complete' }): Promise<ITab[]> => {
  const newTabs: ITab[] = (await chrome.tabs.query(queryInfo)) as ITab[]
  const oldTabs: ITab[] = unique((await ls.get('currentTabs')) as ITab[])
  for (const newTab of newTabs) {
    for (const oldTab of oldTabs) {
      if (oldTab.url != null && oldTab.url === newTab.url) {
        newTab.$extra = oldTab.$extra
        break
      }
    }
  }
  let tabs = newTabs.concat(oldTabs)
  tabs = tabs.filter((tab) => {
    const url = tab.url ?? ''
    return url.startsWith('http') || url.startsWith('chrome-extension://')
  })
  tabs.forEach((tab) => {
    if (tab.url == null) return
    tab.url = tab.url.replace(/#.*$/, '')
  })
  tabs = unique(tabs, 'url').slice(0, 5000)
  return tabs
}

export const unique = <T>(arr: T[], key: string = 'url'): T[] => {
  const map = new Map()
  return arr.filter((item: any) => {
    if (map.has(item[key])) {
      return false
    } else {
      map.set(item[key], true)
      return true
    }
  })
}

export type ITab = chrome.tabs.Tab & {
  $extra?: {
    lastModified: number
  }
}

export const findSameUrlTab = async (url?: string, queryInfo: chrome.tabs.QueryInfo = {}): Promise<chrome.tabs.Tab | null> => {
  if (!url) return null
  const openedTabs = await chrome.tabs.query(queryInfo)
  return (
    openedTabs.find((openedTab) => {
      if (!openedTab.url) return false
      return normalizeUrl(openedTab.url) === url
    }) ?? null
  )
}

export const normalizeUrl = (url: string = ''): string => {
  return url.replace(/#.*$/, '')
}

export const sleep = async (delay: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, delay)
  })
}

/**
 * check if is Chinese
 */
export const isSimpleChinese = () => {
  const lang = chrome.i18n.getUILanguage().toLowerCase()
  return lang === 'zh-cn'
}

export const isChinese = () => {
  const lang = chrome.i18n.getUILanguage().toLowerCase()
  return lang === 'zh-cn' || lang === 'zh-tw' || lang === 'zh-hk' || lang === 'zh'
}

/**
 * check if in Mainland China
 */
export const isCN = () => {
  return false
}

const CONFIG_KEY = 'configV1'
export interface Config {
  showGoogleButtonOnBing: boolean
  showBingButtonOnGoogle: boolean
  showGuideToGithub: boolean
}
export const getConfig = async (): Promise<Config> => {
  const config = (await chrome.storage.sync.get(CONFIG_KEY))[CONFIG_KEY]
  return {
    showGoogleButtonOnBing: true,
    showBingButtonOnGoogle: true,
    showGuideToGithub: true,
    ...config
  }
}

export const setConfig = async (values: Partial<Config>) => {
  const config = await getConfig()
  await chrome.storage.sync.set({
    [CONFIG_KEY]: {
      ...config,
      ...values
    }
  })
}

export const escapeHtml = (s: string): string => {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2f;')
}

export const genUA = () => {
  let ua = userAgent
  if (!isEdge) {
    if (isMac) {
      ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MAIN_VERSION}.0.0.0 Safari/537.36 Edg/${FULL_VERSION}`
    } else {
      ua = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MAIN_VERSION}.0.0.0 Safari/537.36 Edg/${FULL_VERSION}`
    }
  }
  return ua
}
