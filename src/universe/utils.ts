import { version as pkgVersion, repository } from '../../package.json'
import { FULL_VERSION, MAIN_VERSION } from './constants'
import { type Bing } from './types'

export const checkIsGoogle = () => {
  return location.hostname.includes('google')
}
export const ls = {
  set: async <T = any>(key: string, value: T): Promise<void> => {
    const KEY = `NBA@${encodeURIComponent(key)}`
    await new Promise((resolve) => {
      chrome.storage.local.set(
        {
          [KEY]: value
        },
        () => {
          resolve(undefined)
        }
      )
    })
  },
  get: async <T = any>(key: string): Promise<T | undefined> => {
    const KEY = `NBA@${encodeURIComponent(key)}`
    return await new Promise((resolve) => {
      chrome.storage.local.get([KEY], (result) => {
        resolve(result[KEY])
      })
    })
  },
  remove: async (key: string): Promise<void> => {
    const KEY = `NBA@${encodeURIComponent(key)}`
    await new Promise((resolve) => {
      chrome.storage.local.remove([KEY])
      resolve(undefined)
    })
  }
}

export const getAllTabs = async (queryInfo: chrome.tabs.QueryInfo = { status: 'complete' }): Promise<ITab[]> => {
  const newTabs: ITab[] = (await chrome.tabs.query(queryInfo)) as ITab[]
  const oldTabs: ITab[] = unique((await ls.get<ITab[]>('currentTabs'))!)
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
export const checkIsSimpleChinese = () => {
  try {
    const lang = chrome.i18n.getUILanguage().toLowerCase()
    return lang === 'zh-cn'
  } catch {
    return false
  }
}

export const checkIsChinese = () => {
  try {
    const lang = chrome.i18n.getUILanguage().toLowerCase()
    return lang === 'zh-cn' || lang === 'zh-tw' || lang === 'zh-hk' || lang === 'zh'
  } catch {
    return false
  }
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
  showChat: boolean
  showRelease: boolean
  triggerMode: 'Always' | 'Questionmark' | 'Manually'
  conversationStyle: Bing.ConversationStyle
}
export const getConfig = async (): Promise<Config> => {
  const config = (await chrome.storage.sync.get(CONFIG_KEY))[CONFIG_KEY]
  return {
    showGoogleButtonOnBing: true,
    showBingButtonOnGoogle: true,
    showGuideToGithub: true,
    showChat: true,
    showRelease: true,
    triggerMode: 'Always',
    conversationStyle: 'Balanced',
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

export const callBackground = async <T = any>(method: string, args: any[] = []): Promise<T> => {
  return await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        method,
        args: [...args]
      },
      (res) => {
        if (!res || res.code !== 200) {
          reject(res?.msg)
        } else {
          resolve(res.data)
        }
      }
    )
  })
}

export const localCache = (() => {
  const v = 'v1'
  return {
    get: async <T = any>(key: string): Promise<null | T> => {
      key = `${v}:${key}`
      const { data, maxAge, lastModified } = (await chrome.storage.local.get(key))?.[key] ?? {}
      if (Date.now() - lastModified > maxAge * 1000) {
        chrome.storage.local.remove(key)
        return null
      }
      return data
    },

    set: async <T = object>(key: string, data: T, maxAge: number = Infinity /* 单位秒 */): Promise<void> => {
      key = `${v}:${key}`
      await chrome.storage.local.set({
        [key]: {
          data,
          lastModified: Date.now(),
          maxAge
        }
      })
    }
  }
})()

export const toDataUrl = async (url: string): Promise<string> => {
  return await new Promise((resolve, reject) => {
    fetch(url)
      .then(async (r) => await r.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
  })
}

const userAgent = navigator.userAgent
const userAgentData = (navigator as any).userAgentData

export const isMac = userAgent.includes('Macintosh')
export const isFirefox = userAgent.includes('Firefox')
export const isEdge = userAgent.includes('Edg/')
export const isBrave = userAgentData?.brands.findIndex((item) => item.brand === 'Brave') > -1
export const isChinese = checkIsChinese()
export const isSimpleChinese = checkIsSimpleChinese()
export const isCanary: boolean = !!globalThis.__NBA_isCanary
export const version: string = isCanary ? `0.${pkgVersion}` : pkgVersion

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

export const genIssueUrl = async (extra?: Record<string, string | null | undefined>) => {
  const repositoryUrl: string = repository.url
  try {
    const config = await getConfig()
    const url: string = `${repositoryUrl}/issues/new?title=&body=`
    let finalUrl: string = url
    let comment =
      'Please write your comment ABOVE this line, provide as much detailed information and screenshots as possible.' +
      'The UA may not necessarily reflect your actual browser and platform, so please make sure to indicate them clearly.'
    if (isChinese) {
      comment = '请在此行上方发表您的讨论。详尽的描述和截图有助于我们定位问题，UA 不一定真实反映您的浏览器和平台，请备注清楚'
    }

    const body =
      ' \n\n\n\n' +
      `<!--  ${comment} -->\n` +
      Object.entries<string>({
        Version: `${version}${isCanary ? ' (Canary)' : ''} `,
        UA: navigator.userAgent,
        Lang: chrome.i18n.getUILanguage(),
        AcceptLangs: (await chrome.i18n.getAcceptLanguages()).join(', '),
        config: JSON.stringify(config),
        ...extra
      })
        .map(([key, val]) => {
          return val ? `${key}: ${val}` : ''
        })
        .join('\n')

    finalUrl += encodeURIComponent(body.slice(0, 2000))
    return finalUrl
  } catch {
    return repositoryUrl
  }
}
