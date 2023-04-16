import { staticRules } from '../../scripts/static_rules'
import crossPlatform from './cross_platform'
import { dynamicRules } from './dynamic_rules'
const browser = chrome

const rules = [...staticRules, ...dynamicRules]
const modifyRequestHeadersRules = rules.filter((item) => item.action?.type === 'modifyHeaders' && item.action?.requestHeaders?.length)
const modifyResponseHeadersRules = rules.filter((item) => item.action?.type === 'modifyHeaders' && item.action?.responseHeaders?.length)

const redirectRules = rules.filter((item) => item.action?.type === 'redirect')

console.log('rules', rules.length)
console.log('modifyRequestHeadersRules', modifyRequestHeadersRules.length, modifyRequestHeadersRules)
console.log('modifyResponseHeadersRules', modifyResponseHeadersRules.length, modifyResponseHeadersRules)
console.log('redirectRules', redirectRules.length, redirectRules)

crossPlatform()
browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (!details.requestHeaders) return
    // console.log(111, details)
    const newHeaders = details.requestHeaders
    for (const rule of modifyRequestHeadersRules) {
      const urlObj = new URL(details.url)
      if (
        !rule.condition ||
        (rule.condition?.requestDomains ?? []).includes(urlObj.hostname) ||
        new RegExp(rule.condition?.regexFilter ?? '', rule.condition?.isUrlFilterCaseSensitive ? 'i' : undefined).test(urlObj.href) ||
        urlObj.href.includes(rule.condition?.urlFilter ?? '')
      ) {
        for (const requestHeader of rule.action.requestHeaders ?? []) {
          switch (requestHeader.operation) {
            case 'set':
              if (!details.requestHeaders.find((header) => header.name === requestHeader.header)) {
                newHeaders.push({
                  name: requestHeader.header,
                  value: requestHeader.value
                })
              } else {
                for (const header of details.requestHeaders) {
                  if (header.name.toLowerCase() === requestHeader.header.toLowerCase()) {
                    // console.log(1110, header.name)
                    header.value = requestHeader.value
                  }
                }
              }

              break
            case 'append':
              // console.log(111, requestHeader.header)
              newHeaders.push({
                name: requestHeader.header,
                value: requestHeader.value
              })
              break
            default:
          }
        }
      }
    }

    return { requestHeaders: newHeaders }
  },
  {
    urls: ['<all_urls>']
  },
  ['blocking', 'requestHeaders']
)

browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (!details.responseHeaders) return
    // console.log(222, details)
    const newHeaders = details.responseHeaders

    for (const rule of modifyResponseHeadersRules) {
      // const urlObj = new URL(details.url)
      if (
        // !rule.condition ||
        // rule.condition?.regexFilter
        // ?
        new RegExp(rule.condition?.regexFilter ?? '', rule.condition?.isUrlFilterCaseSensitive ? 'i' : undefined).test(details.url)
        // : false // urlObj.href.includes(rule.condition?.urlFilter ?? '')
        // ||
        // (rule.condition?.requestDomains ?? []).includes(urlObj.hostname)
      ) {
        // for (const rule of redirectRules) {
        //   console.log(
        //     111,
        //     rule,
        //     details.url,
        //     rule.condition?.regexFilter,
        //     new RegExp(rule.condition?.regexFilter ?? '', rule.condition?.isUrlFilterCaseSensitive ? 'i' : undefined),
        //     new RegExp(rule.condition?.regexFilter ?? '', rule.condition?.isUrlFilterCaseSensitive ? 'i' : undefined).test(details.url)
        //   )
        // }

        for (const requestHeader of rule.action.responseHeaders ?? []) {
          switch (requestHeader.operation) {
            case 'set':
              for (const header of details.responseHeaders) {
                if (header.name.toLowerCase() === requestHeader.header.toLowerCase()) {
                  // console.log(222, header.name)
                  header.value = requestHeader.value
                } else {
                  newHeaders.push({
                    name: requestHeader.header,
                    value: requestHeader.value
                  })
                }
              }
              break
            case 'append':
              newHeaders.push({
                name: requestHeader.header,
                value: requestHeader.value
              })
              break
            default:
          }
        }
      }
    }
    return { responseHeaders: newHeaders }
  },
  {
    urls: ['<all_urls>']
  },
  ['blocking', 'responseHeaders']
)
