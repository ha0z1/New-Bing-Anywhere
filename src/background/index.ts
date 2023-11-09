import { addBackgroundListener, openUrlInSameTab } from '@ha0z1/extension-utils'
import { Bing, Claude, Types, methods as llamaMethods } from '@ha0z1/llama-apis'
// import offscreenMethods from '../offscreen'

import { version } from '../../package.json'
// import { getNotification, hideNotification } from './_notification'
import { bingNaturalSearch } from './_bing'
import { googleNaturalSearch } from './_google'

const getEnv = async () => {
  return {
    version
  }
}

const OFFSCREEN_DOCUMENT_PATH = `/offscreen/index.html?url=${encodeURIComponent(
  JSON.stringify({
    Bing: 'https://www.bing.com/favicon.ico'
  })
)}`

// const hasOffscreenDocument = async () => {
//   if ('getContexts' in chrome.runtime) {
//     const contexts = await (chrome.runtime as any).getContexts({
//       contextTypes: ['OFFSCREEN_DOCUMENT'],
//       documentUrls: [OFFSCREEN_DOCUMENT_PATH]
//     })
//     console.log(contexts, 4444444)
//     return Boolean(contexts.length)
//   } else {
//     const matchedClients = await globalThis.clients.matchAll()
//     return await matchedClients.some((client) => {
//       client.url.includes(chrome.runtime.id)
//     })
//   }
// }

let creating: boolean = false
const createOffscreen = async () => {
  if (creating) return

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: [chrome.offscreen.Reason.IFRAME_SCRIPTING],
    justification: 'need post message.'
  })
  creating = true
}

const methods = {
  getEnv,
  openUrlInSameTab,
  'Bing.naturalSearch': bingNaturalSearch,
  'Google.naturalSearch': googleNaturalSearch,
  createOffscreen
}

addBackgroundListener(methods)

// console.log(4444444)
// const setupOffscreenDocument = () => {

// }
// setupOffscreenDocument()
