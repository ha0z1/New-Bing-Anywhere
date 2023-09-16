import { Types as LlamasTypes } from '@ha0z1/llama-apis'
export { LlamasTypes }
export type ILanguage = 'en' | 'zh_CN' | 'zh_TW' | 'ru'
export const Languages: ILanguage[] = ['en', 'zh_CN', 'zh_TW', 'ru']

export const enum Sites {
  Google = 'Google',
  Baidu = 'Baidu',
  Yandex = 'Yandex'
}

export const enum TriggerMode {
  Always = 'Always',
  Questionmark = 'Questionmark',
  Manually = 'Manually'
}

export interface Config {
  darkmode: 'auto' | 'dark' | 'light'
  language: ILanguage

  showGoogleButtonOnBing: boolean
  showBingButtonOnGoogle: boolean

  showLinksIcon: boolean

  showSidebar: boolean
  sidebarSites: Array<Sites>
  selectedLlama: LlamasTypes
  llamas: Array<LlamasTypes>
  DRF: boolean

  Bing: {
    triggerMode: TriggerMode
    conversationStyle: 'Creative' | 'Precise' | 'Balanced'
  }
}
