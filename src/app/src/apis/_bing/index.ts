import { type Bing } from '@@/types'
import { callBackground, ls } from '@@/utils'
import { v4 as uuidv4 } from 'uuid'
// import type2 from './data/type2'
import { createPropmt } from './utils'

export const getFromConversation = async (options: Bing.ConversationOptions): Promise<Bing.CoreData> => {
  const API =
    'https://sydney.bing.com/sydney/GetConversation?' +
    `conversationId=${encodeURIComponent(options.conversationId)}&` +
    `source=${encodeURIComponent(options.source)}&` +
    `participantId=${encodeURIComponent(options.participantId)}&` +
    `conversationSignature=${encodeURIComponent(options.conversationSignature)}&` +
    `traceId=${uuidv4()}`
  const data = await fetch(API).then((r) => r.json())
  return data
}

export const sendBingChat = async (
  prompt: string,
  oMmessage: (data: Bing.Type1Data | Bing.Type2Data) => void,
  reload: boolean
): Promise<Bing.CoreData | undefined> => {
  if (!prompt) return
  const promptKey = `Prompt@${prompt.trim()}`
  const session = await callBackground<Bing.Session>('bingChatCreate')

  if (reload) {
    await ls.remove(promptKey)
  }
  const promptCache = await ls.get<Bing.ConversationOptions>(promptKey)
  if (promptCache) {
    const data = await getFromConversation(promptCache)
    if (data.result.value === 'Success') {
      return data
    }
  }

  const socketId = await callBackground('bingChatGetSocketId')

  callBackground('bingChatPing', [socketId])
  const ping = setInterval(() => {
    callBackground('bingChatPing', [socketId])
  }, 8000)

  const onListener = (msg, _sender, sendResponse) => {
    setTimeout(() => {
      const { method, data } = msg ?? {}
      if (method === 'bingChatSendOnMessage') {
        data && oMmessage(data)
      }
      sendResponse('ok')
    })
    return true
  }

  chrome.runtime.onMessage.addListener(onListener)
  const data = await callBackground<Bing.Type2Data>('bingChatSend', [socketId, createPropmt({ session, prompt })])
  chrome.runtime.onMessage.removeListener(onListener)
  clearInterval(ping)
  callBackground('bingChatCloseWebSocket', [socketId])

  const conversationId = data.item.conversationId
  const source = data.item.messages.find((msg) => msg.contentOrigin)?.contentOrigin
  const participantId = data.item.messages.find((msg) => msg.from)?.from?.id
  const conversationSignature = session.conversationSignature

  if (conversationId && source && participantId && conversationSignature) {
    ls.set<Bing.ConversationOptions>(promptKey, {
      conversationId,
      source,
      participantId,
      conversationSignature
    })
  }

  return data.item
}
