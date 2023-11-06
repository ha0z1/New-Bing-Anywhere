import browser from 'webextension-polyfill'
import { merge } from 'lodash-es'
import { type Config, type ILanguage, Languages, TriggerMode, Sites, LlamasTypes } from './types/_config'

export { type Config, Sites, TriggerMode }

const CONFIG_KEY = 'configV3'

let language: ILanguage = chrome.i18n.getUILanguage() as ILanguage
if (!Languages.includes(language)) {
  language = 'en'
}

export const defaultConfig: Config = {
  darkMode: 'light',
  language,
  showGoogleButtonOnBing: true,
  showBingButtonOnGoogle: true,
  showSidebar: true,
  sidebarSites: [Sites.Google, Sites.Baidu, Sites.Yandex],
  selectedLlama: LlamasTypes.Bing,
  llamas: [LlamasTypes.Bing],
  showLinksIcon: true,
  DRF: false,
  Bing: {
    triggerMode: TriggerMode.Always,
    conversationStyle: 'Balanced'
  }
}

export const getConfig = async (): Promise<Config> => {
  const config = (await browser.storage.sync.get(CONFIG_KEY))[CONFIG_KEY]
  return merge({}, defaultConfig, config)
}

export const setConfig = async (values: Partial<Config>) => {
  const config = await getConfig()
  await browser.storage.sync.set({
    [CONFIG_KEY]: {
      ...config,
      ...values
    }
  })
}
