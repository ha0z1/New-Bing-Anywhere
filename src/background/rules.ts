const allResourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType)

const BING = 'https://www.bing.com/'
let ua = navigator.userAgent

const isMac = ua.includes('Macintosh')
const isEdge = ua.includes('Edg')

// const isIos = ua.includes('iPhone') || ua.includes('iPad')
// const isAndroid = ua.includes('Android')

if (!isEdge) {
  if (isMac) {
    ua += ' Edg/111.0.1661.39'
  } else {
    ua += ' Edg/112.0.1722.11'
  }
}

const MODIFY_HEADERS_LIST = {
  // 'X-Forwarded-For': '8.8.8.8',
  // MAC      Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.0.0
  // Windows  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/112.0.1722.11
  'User-Agent': ua
}
const MODIFY_HEADERS = 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS
const REDIRECT = 'redirect' as chrome.declarativeNetRequest.RuleActionType.REDIRECT
const APPEND = 'append' as chrome.declarativeNetRequest.HeaderOperation.APPEND
// const REMOVE = 'remove' as chrome.declarativeNetRequest.HeaderOperation.REMOVE
const SET = 'set' as chrome.declarativeNetRequest.HeaderOperation.SET

const rules: chrome.declarativeNetRequest.Rule[] = [
  {
    id: 1,
    action: {
      type: MODIFY_HEADERS,
      requestHeaders: Object.entries(MODIFY_HEADERS_LIST).map(([header, value]) => ({
        operation: SET,
        header,
        value
      }))
    },
    condition: {
      requestDomains: ['bing.com', 'www.bing.com', 'cn.bing.com'],
      resourceTypes: allResourceTypes
    }
  },
  {
    id: 2,
    action: {
      type: REDIRECT,
      redirect: {
        regexSubstitution: '\\1setlang=zh-Hans&mkt=zh-HK\\2'
      }
    },
    condition: {
      // https://regex101.com/r/LC68hZ/1
      regexFilter:
        '(^https:\\/\\/www\\.bing\\.com\\/(?:search|\\?|account/action).*?)(?:mkt=zh-CN|cc=cn|cc=zh-cn|cc=zh)(.*)',
      isUrlFilterCaseSensitive: false,
      requestDomains: ['www.bing.com'],
      resourceTypes: allResourceTypes
    }
  },
  {
    id: 3,
    action: {
      type: REDIRECT,
      redirect: {
        regexSubstitution: '\\1setlang=ru&cc=clean&mkt=en-us\\2'
      }
    },
    condition: {
      // https://regex101.com/r/LC68hZ/1
      regexFilter: '(^https:\\/\\/www\\.bing\\.com\\/(?:search|\\?|account/action).*?)(?:mkt=ru-ru|mkt=ru|cc=ru)(.*)',
      isUrlFilterCaseSensitive: false,
      requestDomains: ['www.bing.com'],
      resourceTypes: allResourceTypes
    }
  },
  {
    id: 4,
    action: {
      type: REDIRECT,
      redirect: {
        url: `${BING}?setlang=zh-Hans&mkt=zh-HK`
      }
    },
    condition: {
      regexFilter: '\\/\\?(?:new-bing-anywhere|nba|run)',
      isUrlFilterCaseSensitive: false,
      requestDomains: ['www.bing.com'],
      resourceTypes: allResourceTypes
    }
  },
  {
    id: 5,
    priority: 99,
    action: {
      type: REDIRECT,
      redirect: {
        regexSubstitution: `${BING}\\1`
      }
    },
    condition: {
      // https://cn.bing.com/search?q=fdsafdsafdsafdsafdsafdsafdsafdsaf&cvid=49400b6fae014ff3b23411b541cc7115&aqs=edge..69i57.3974j0j9&FORM=ANAB01&DAF0=1&PC=CNNDDB
      requestDomains: ['cn.bing.com', 'bing.com'],
      regexFilter: '^http(?:s)?:\\/\\/(?:cn\\.)?bing\\.com\\/(.*)',
      resourceTypes: allResourceTypes
    }
  },
  {
    id: 6,
    action: {
      type: MODIFY_HEADERS,
      responseHeaders: [
        {
          header: 'Set-Cookie',
          operation: APPEND,
          value: 'SNRHOP=I=9; domain=.bing.com; path=/; secure; SameSite=None; HttpOnly;'
        }
      ]
    },
    condition: {
      requestDomains: ['bing.com', 'www.bing.com']
    }
  }
  // {
  //   id: 6,
  //   action: {
  //     type: MODIFY_HEADERS,
  //     responseHeaders: [
  //       {
  //         header: 'Set-Cookie',
  //         operation: REMOVE
  //       }
  //     ]
  //   },
  //   condition: { urlFilter: 'https://www.bing.com/', resourceTypes: allResourceTypes }
  // }
]

export default () => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map((rule) => rule.id),
    addRules: rules
  })

  // chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((...args) => {
  //   console.log(1111, ...args)
  // })
}
