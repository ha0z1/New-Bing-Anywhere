import crossPlatform from './cross_platform'
import initDynamicRules from './dynamic_rules'

crossPlatform()

chrome.runtime.onInstalled.addListener((_details) => {
  initDynamicRules()
})

chrome.runtime.setUninstallURL('https://github.com/ha0z1/New-Bing-Anywhere/blob/main/uninstall.md')
