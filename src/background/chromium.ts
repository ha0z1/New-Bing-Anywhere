import { isSimpleChinese } from '@/universe/utils'
import crossPlatform from './cross_platform'
import initDynamicRules from './dynamic_rules'
import { CN_REDIRECT_URL } from '@/universe/constants'

crossPlatform()

chrome.runtime.onInstalled.addListener((_details) => {
  initDynamicRules()
})

const uninstallUrl = isSimpleChinese ? CN_REDIRECT_URL : 'https://github.com/ha0z1/New-Bing-Anywhere/blob/main/uninstall.md'
chrome.runtime.setUninstallURL(uninstallUrl)
