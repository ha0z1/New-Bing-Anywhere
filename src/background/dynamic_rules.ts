import { ALL_RESOURCE_TYPES } from '@@/constants'

import { genUA } from '@@/utils'

const MODIFY_HEADERS_LIST = {
  // 'X-Forwarded-For': '8.8.8.8',
  'User-Agent': genUA()
}
const MODIFY_HEADERS = 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS
// const REDIRECT = 'redirect' as chrome.declarativeNetRequest.RuleActionType.REDIRECT
// const APPEND = 'append' as chrome.declarativeNetRequest.HeaderOperation.APPEND
// const REMOVE = 'remove' as chrome.declarativeNetRequest.HeaderOperation.REMOVE
const SET = 'set' as chrome.declarativeNetRequest.HeaderOperation.SET

export const dynamicRules = [
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
]
  .filter(Boolean)
  .map((rule, index) => ({
    id: index + 1 + 2000,
    ...rule
  })) as chrome.declarativeNetRequest.Rule[]

export default () => {
  if (!dynamicRules.length) return

  chrome.declarativeNetRequest.getDynamicRules((dRules) => {
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
