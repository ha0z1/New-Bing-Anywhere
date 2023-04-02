const BING = 'https://www.bing.com/'
const ALL_RESOURCE_TYPES = [
  'csp_report',
  'font',
  'image',
  'main_frame',
  'media',
  'object',
  'other',
  'ping',
  'script',
  'stylesheet',
  'sub_frame',
  'webbundle',
  'websocket',
  'webtransport',
  'xmlhttprequest'
] as chrome.declarativeNetRequest.ResourceType[]

const MODIFY_HEADERS = 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS
const REDIRECT = 'redirect' as chrome.declarativeNetRequest.RuleActionType.REDIRECT
const APPEND = 'append' as chrome.declarativeNetRequest.HeaderOperation.APPEND
// const REMOVE = 'remove' as chrome.declarativeNetRequest.HeaderOperation.REMOVE
const SET = 'set' as chrome.declarativeNetRequest.HeaderOperation.SET

const staticRules: chrome.declarativeNetRequest.Rule[] = [
  {
    id: 1,
    action: {
      type: MODIFY_HEADERS,
      requestHeaders: [
        {
          operation: SET,
          header: 'User-Agent',
          value:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.51'
        }
      ]
    },
    condition: {
      requestDomains: ['bing.com', 'www.bing.com', 'cn.bing.com'],
      resourceTypes: ALL_RESOURCE_TYPES
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
      resourceTypes: ALL_RESOURCE_TYPES
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
      resourceTypes: ALL_RESOURCE_TYPES
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
      resourceTypes: ALL_RESOURCE_TYPES
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
      resourceTypes: ALL_RESOURCE_TYPES
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
  //   condition: { urlFilter: 'https://www.bing.com/', resourceTypes: ALL_RESOURCE_TYPES }
  // }
]

export default staticRules
