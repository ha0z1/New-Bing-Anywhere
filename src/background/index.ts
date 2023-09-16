import { addBackgroundListener, openUrlInSameTab } from '@ha0z1/extension-utils'
import { Bing, Claude, Types, methods as llamaMethods } from '@ha0z1/llama-apis'

import { version } from '../../package.json'
// import { getNotification, hideNotification } from './_notification'
import { bingOrgaincSearch } from './_bing'
import { googleOrgaincSearch } from './_google'

const getEnv = async () => {
  return {
    version
  }
}

chrome.offscreen.createDocument({
  url: `/offscreen/index.html?url=${encodeURIComponent(
    JSON.stringify({
      Bing: 'https://www.bing.com/favicon.ico'
    })
  )}`,
  reasons: [chrome.offscreen.Reason.IFRAME_SCRIPTING],
  justification: 'need post message.'
})

const methods = {
  getEnv,
  openUrlInSameTab,
  'Bing.orgaincSearch': bingOrgaincSearch,
  'Google.orgaincSearch': googleOrgaincSearch
}

addBackgroundListener(methods)
