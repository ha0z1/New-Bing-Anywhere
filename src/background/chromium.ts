import crossPlatform from './cross_platform'
import initDynamicRules from './dynamic_rules'

crossPlatform()

chrome.runtime.onInstalled.addListener((details) => {
  initDynamicRules()
})

chrome.runtime.setUninstallURL('https://github.com/haozi/New-Bing-Anywhere/blob/main/uninstall.md')
