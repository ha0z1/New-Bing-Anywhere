import crossPlatform from './cross_platform'
import initDynamicRules from './dynamic_rules'

crossPlatform()

chrome.runtime.onInstalled.addListener((details) => {
  initDynamicRules()
})
