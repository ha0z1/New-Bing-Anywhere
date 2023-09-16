export { default as Chatgpt } from './Chatgpt'
export { default as Claude } from './Claude'
export { default as Bing } from './Bing'
export { type default as IApis, Types, type IMessage } from './abstract'

export const methods: ('createConversation' | 'sendPrompt' | 'deleteConversation')[] = [
  'createConversation',
  'sendPrompt',
  'deleteConversation'
]
