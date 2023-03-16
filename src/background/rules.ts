const allResourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType)

const BING = 'https://www.bing.com/'
let ua = navigator.userAgent

const isMac = ua.includes('Macintosh')
const isEdge = ua.includes('Edg')

// const isIos = ua.includes('iPhone') || ua.includes('iPad')
// const isAndroid = ua.includes('Android')

if (!isEdge) {
  if (isMac) {
    ua += ' Edg/111.0.0.0'
  } else {
    ua += ' Edg/111.0.1661.39'
  }
}

const MODIFY_HEADERS = {
  // 'X-Forwarded-For': '8.8.8.8',
  // 'X-Forwarded-For': '23.142.200.233',
  // 'X-Forwarded-For': '171.22.109.233',
  // MAC      Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.0.0
  // Windows  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.39
  'User-Agent': ua
}

const rules: chrome.declarativeNetRequest.Rule[] = [
  {
    id: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: Object.entries(MODIFY_HEADERS).map(([header, value]) => ({
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
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
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
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
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        url: 'https://www.bing.com/?setlang=zh-Hans&mkt=zh-HK'
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
    id: 4,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        regexSubstitution: `${BING}\\1`
      }
    },
    condition: {
      requestDomains: ['cn.bing.com', 'bing.com'],
      regexFilter: '^http(?:s)?:\\/\\/(?:cn\\.)?bing\\.com/(.*)',
      resourceTypes: allResourceTypes
    }
  },
  {
    id: 5,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      responseHeaders: [
        {
          header: 'Set-Cookie',
          operation: chrome.declarativeNetRequest.HeaderOperation.APPEND,
          value: 'SNRHOP=I=9; path=/; domain=.bing.com'
        }
      ]
    },
    condition: {
      requestDomains: ['bing.com', 'www.bing.com']
    }
  }
]

export default rules
