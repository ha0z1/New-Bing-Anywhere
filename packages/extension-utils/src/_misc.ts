// export const ls = {
//   set: async <T = any>(key: string, value: T): Promise<void> => {
//     const KEY = `NBA@${encodeURIComponent(key)}`
//     await new Promise((resolve) => {
//       chrome.storage.local.set(
//         {
//           [KEY]: value
//         },
//         () => {
//           resolve(undefined)
//         }
//       )
//     })
//   },
//   get: async <T = any>(key: string): Promise<T | undefined> => {
//     const KEY = `NBA@${encodeURIComponent(key)}`
//     return await new Promise((resolve) => {
//       chrome.storage.local.get([KEY], (result) => {
//         resolve(result[KEY])
//       })
//     })
//   },
//   remove: async (key: string): Promise<void> => {
//     const KEY = `NBA@${encodeURIComponent(key)}`
//     await new Promise((resolve) => {
//       chrome.storage.local.remove([KEY])
//       resolve(undefined)
//     })
//   }
// }

// export const getAllTabs = async (queryInfo: chrome.tabs.QueryInfo = { status: 'complete' }): Promise<ITab[]> => {
//   const newTabs: ITab[] = (await chrome.tabs.query(queryInfo)) as ITab[]
//   const oldTabs: ITab[] = unique((await ls.get<ITab[]>('currentTabs'))!)
//   for (const newTab of newTabs) {
//     for (const oldTab of oldTabs) {
//       if (oldTab.url != null && oldTab.url === newTab.url) {
//         newTab.$extra = oldTab.$extra
//         break
//       }
//     }
//   }
//   let tabs = newTabs.concat(oldTabs)
//   tabs = tabs.filter((tab) => {
//     const url = tab.url ?? ''
//     return url.startsWith('http') || url.startsWith('chrome-extension://')
//   })
//   tabs.forEach((tab) => {
//     if (tab.url == null) return
//     tab.url = tab.url.replace(/#.*$/, '')
//   })
//   tabs = unique(tabs, 'url').slice(0, 5000)
//   return tabs
// }

/**
 * @param arr Array, support object array
 * @param key Comparison key, support function
 * @param removeOlder Whether to remove the old one will remove the newly added array by default. Setting as True will remove the old duplicate items. In the object array, if there is the same key, the last one will be retained.
 * @returns
 */
export const unique = <T>(arr: T[], key?: ((a: T, b: T) => boolean) | string, removeOlder = false) => {
  if (key == null) {
    return Array.from(new Set(arr))
  }

  let ret: T[] = []
  removeOlder && arr.reverse()
  const isStringKey = typeof key === 'string'
  for (const item of arr) {
    if (
      ret.find((r) => {
        if (isStringKey) {
          return (r as any)[key] === (item as any)[key]
        }
        return key(r, item)
      }) != null
    ) {
      continue
    }
    ret.push(item)
  }
  removeOlder && (ret = ret.reverse())
  return ret
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

/**
 *
 * @param delay Unit: second
 */
export const sleep = async (delay: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, delay * 1000)
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

export const localCache = /* @__PURE__ */ (() => {
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
