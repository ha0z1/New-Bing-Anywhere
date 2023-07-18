import { type Bing } from '@@/types'
import { ls, getConfig } from '@@/utils'

import {
  createPropmt,
  getFromConversation,
  bingChatGetSocketId,
  bingChatPing,
  bingChatCreateSession,
  bingChatSend,
  bingChatCloseWebSocket,
  checkHasText
} from './utils'

export const createBingChat = async (options: Bing.CreateBingChatOptions): Promise<Bing.CreateBingChatResponce | undefined> => {
  const { prompt, onMessage, needRefresh, session } = options
  if (!prompt) return

  const promptKey = `Prompt-v1-${prompt.trim()}`

  if (needRefresh) {
    await ls.remove(promptKey)
  }
  const promptCache = await ls.get<Bing.ConversationOptions>(promptKey)
  if (promptCache) {
    const data = await getFromConversation(promptCache)
    if (checkHasText(data)) {
      return { data: data!, conversationOptions: promptCache }
    }
  }

  onMessage({ type: 0, text: 'Creating socket...' })
  const socketId = await bingChatGetSocketId()
  onMessage({ type: 0, text: 'Created socket success!' })
  let finalSession = session
  if (!finalSession) {
    try {
      onMessage({ type: 0, text: 'Creating session...' })
      finalSession = await bingChatCreateSession()
      onMessage({ type: 0, text: 'Created session success!' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(e)
    }
  }

  bingChatPing(socketId)
  const ping = setInterval(() => {
    bingChatPing(socketId)
  }, 8000)

  const config = await getConfig()
  onMessage({ type: 0, text: 'Sending prompt to Bing...' })
  const type2Data = await bingChatSend(socketId, createPropmt({ session: finalSession, prompt, tone: config.conversationStyle }), onMessage)

  clearInterval(ping)
  bingChatCloseWebSocket(socketId)

  const resultVale = type2Data?.item?.result?.value

  switch (resultVale) {
    case 'Success':
      break
    case 'Throttled':
      throw new Error('Request is throttled. Please try again later.')
    default:
      throw new Error(type2Data?.item?.result?.message)
  }

  const conversationId = type2Data.item.conversationId
  const source = type2Data.item.messages?.find((msg) => msg.contentOrigin)?.contentOrigin
  const participantId = type2Data.item.messages?.find((msg) => msg.from)?.from?.id
  const conversationSignature = finalSession.conversationSignature

  const conversationOptions: Partial<Bing.ConversationOptions> = {
    source,
    participantId,
    session: {
      ...finalSession,
      conversationId,
      conversationSignature
    }
  }
  if (conversationId && source && participantId && conversationSignature) {
    ls.set<Bing.ConversationOptions>(promptKey, conversationOptions as Bing.ConversationOptions)
  }

  return {
    data: type2Data.item,
    conversationOptions
  }
}
