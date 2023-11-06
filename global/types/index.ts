import { LlamasTypes, type Sites } from './_config'
export { type ILanguage, Languages, Sites, type Config } from './_config'
import { IMessage } from '@ha0z1/llama-apis/src'

export type Content = Required<IMessage['msg']>
export interface CorePageData {
  content: {
    [LlamasTypes.Bing]?: Content
    [LlamasTypes.Chatgpt]?: Content
    [LlamasTypes.Claude]?: Content
  }
  links: {
    list: Array<{
      title: string
      link: string
      description?: string
    }>
  }
  suggestions: {
    list: Array<{
      title: string
    }>
  }
}

export interface IChatAppProps {
  prompt: string
  dir: 'ltr' | 'rtl'
  darkMode: 'dark' | 'light'
  site: Sites
  style?: React.CSSProperties
}
