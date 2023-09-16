import fs from 'fs-extra'
import { ALL_RESOURCE_TYPES, BING, FULL_VERSION, MAIN_VERSION } from '../global/constants'
import { chromiumDir } from './_config'
import type { DeclarativeNetRequest } from 'webextension-polyfill'

const MODIFY_HEADERS = 'modifyHeaders'
const REDIRECT = 'redirect'
const APPEND = 'append'
// const REMOVE = 'remove' as chrome.declarativeNetRequest.HeaderOperation.REMOVE
const SET = 'set'

export const staticRules = [
  {
    action: {
      type: MODIFY_HEADERS,
      requestHeaders: [
        {
          operation: SET,
          header: 'sec-ch-ua',
          value: `"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"`
        },
        // {
        //   operation: SET,
        //   header: 'sec-ch-ua-arch',
        //   value: '"x86"'
        // },
        // {
        //   operation: SET,
        //   header: 'sec-ch-ua-bitness',
        //   value: '"64"'
        // },
        {
          operation: SET,
          header: 'sec-ch-ua-full-version',
          value: `"${FULL_VERSION}"`
        },
        {
          operation: SET,
          header: 'sec-ch-ua-full-version-list',
          value: `"Not.A/Brand";v="8.0.0.0", "Chromium";v="114.0.5735.201", "Microsoft Edge";v="114.0.1823.82"`
        },
        {
          operation: SET,
          header: 'sec-ms-gec-version',
          value: `1-${FULL_VERSION}`
        },
        {
          operation: SET,
          header: 'User-Agent',
          value: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MAIN_VERSION}.0.0.0 Safari/537.36 Edg/${FULL_VERSION}`
        }

        // {
        //   operation: SET,
        //   header: 'sec-ms-gec',
        //   value: 'B55DF865827912FB0EDCCEC47284BFB22D3D2D453623DE97B2CCEDDBB57DAD23'
        // }
        // {
        //   operation: REMOVE,
        //   header: 'X-Forwarded-For'
        // }
      ]
    },
    condition: {
      requestDomains: ['bing.com', 'www.bing.com', 'cn.bing.com'],
      resourceTypes: ALL_RESOURCE_TYPES
    }
  },
  {
    action: {
      type: MODIFY_HEADERS,
      requestHeaders: [
        {
          operation: SET,
          header: 'origin',
          value: 'https://www.bing.com'
        },
        {
          operation: SET,
          header: 'referer',
          value: 'https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx'
        }
      ]
    },
    condition: {
      requestDomains: ['www.bing.com', 'sydney.bing.com'],
      resourceTypes: ['websocket', 'xmlhttprequest']
    }
  },
  {
    action: {
      type: REDIRECT,
      redirect: {
        regexSubstitution: '\\1setlang=zh-Hans&mkt=zh-HK\\2'
      }
    },
    condition: {
      // https://regex101.com/r/LC68hZ/1
      regexFilter: '(^https:\\/\\/www\\.bing\\.com\\/(?:search|\\?|account/action).*?)(?:mkt=zh-CN|cc=cn|cc=zh-cn|cc=zh)(.*)',
      isUrlFilterCaseSensitive: false,
      requestDomains: ['www.bing.com'],
      resourceTypes: ALL_RESOURCE_TYPES
    }
  },
  {
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
    action: {
      type: MODIFY_HEADERS,
      responseHeaders: [
        {
          header: 'Set-Cookie',
          operation: APPEND,
          value: 'SNRHOP=I=8; domain=.bing.com; path=/; secure; SameSite=None; HttpOnly;'
        }
      ]
    },
    condition: {
      requestDomains: ['bing.com', 'www.bing.com']
    }
  }
  // {
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
].map((rule, index) => ({
  id: index + 1,
  ...rule
})) as DeclarativeNetRequest.Rule[]

export default () => {
  fs.outputJSONSync(`${chromiumDir}/rules.json`, staticRules)
}
