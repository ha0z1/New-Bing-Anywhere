import { ALL_RESOURCE_TYPES } from '@@/constants'

import { genUA } from '@@/utils'

const MODIFY_HEADERS_LIST = {
  // 'X-Forwarded-For': '8.8.8.8',
  // MAC      Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.48
  // Windows  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.48
  'User-Agent': genUA()
}
const MODIFY_HEADERS = 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS
// const REDIRECT = 'redirect' as chrome.declarativeNetRequest.RuleActionType.REDIRECT
// const APPEND = 'append' as chrome.declarativeNetRequest.HeaderOperation.APPEND
// const REMOVE = 'remove' as chrome.declarativeNetRequest.HeaderOperation.REMOVE
const SET = 'set' as chrome.declarativeNetRequest.HeaderOperation.SET

export const dynamicRules: chrome.declarativeNetRequest.Rule[] = [
  {
    priority: 2001,
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
      resourceTypes: ALL_RESOURCE_TYPES
    }
  }
].map((rule, index) => ({
  id: index + 1 + 2000,
  ...rule
}))

export default () => {
  chrome.declarativeNetRequest.getDynamicRules((dRules) => {
    // console.log(111, dRules)
    // console.log(222, [...new Set([...rules.map((rule) => rule.id), ...dRules.map((rule) => rule.id)])])

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [...new Set([...dynamicRules.map((rule) => rule.id), ...dRules.map((rule) => rule.id)])],
      addRules: dynamicRules
    })
    // .then(() => {
    //   chrome.declarativeNetRequest.getDynamicRules((dRules) => {
    //     console.log(333, dRules)
    //   })
    // })
  })

  // chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((...args) => {
  //   console.log(1111, ...args)
  // })
}
