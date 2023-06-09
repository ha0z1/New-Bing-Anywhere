import { CN_REDIRECT_URL } from '@@/constants'
import crossPlatform from './cross_platform'
import initDynamicRules from './dynamic_rules'
import { isSimpleChinese } from '@@/utils'

crossPlatform()

chrome.runtime.onInstalled.addListener((details) => {
  initDynamicRules()
})

if (isSimpleChinese) {
  chrome.runtime.setUninstallURL(CN_REDIRECT_URL)
}
