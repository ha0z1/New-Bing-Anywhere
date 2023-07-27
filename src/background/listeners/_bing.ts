import { type Bing } from '@@/types'
import { v4 as uuidv4 } from 'uuid'

export const getFromConversation = async (options: Bing.ConversationOptions): Promise<Bing.CoreData | null> => {
  const API =
    'https://sydney.bing.com/sydney/GetConversation?' +
    `conversationId=${encodeURIComponent(options.session.conversationId)}&` +
    `source=${encodeURIComponent(options.source)}&` +
    `participantId=${encodeURIComponent(options.participantId)}&` +
    `conversationSignature=${encodeURIComponent(options.session.conversationSignature)}&` +
    `traceId=${uuidv4()}`
  try {
    const data = await fetch(API).then((r) => r.json())
    return data
  } catch (err: unknown) {
    return null
    // const { message } = err as { message: string }
    // throw new Error(`Failed to get conversation from ${API}: ${message}}`)
  }
}

const webSockets: Record<string, WebSocket | null> = {}

export const bingChatGetSocketId = async (): Promise<string> => {
  const socketUrl = 'wss://sydney.bing.com/sydney/ChatHub'
  return await new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(socketUrl)
      const socketId = uuidv4()
      ws.onopen = (_e) => {
        // console.log(`Connected to ${socketUrl}`)
        const hello = JSON.stringify({ protocol: 'json', version: 1 }) + '\x1e'
        ws.send(hello)
      }

      ws.onclose = () => {
        // console.log('WebSocket was closed')
        webSockets[socketId] = null
      }
      ws.onerror = (e) => {
        if (e.type === 'error') {
          reject(new Error(`WebSocket \`${socketUrl}\` did not connect successfully.`))
          return
        }
        reject(e)
      }

      ws.onmessage = (e) => {
        const msg = e.data
        if (msg === '{}\x1e') {
          webSockets[socketId] = ws
          resolve(socketId)
          return
        }
        ws.close()
        webSockets[socketId] = null
        reject(new Error('WebSocket did not connect successfully'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

export const bingChatPing = async (socketId: string) => {
  return await new Promise((resolve, _reject) => {
    const ws = webSockets[socketId]
    if (ws == null) throw new Error(`WebSocket ${socketId} not found`)

    ws.send(JSON.stringify({ type: 6 }) + '\x1e')
    resolve(null)
  })
}

export const bingChatSend = async (
  socketId: string,
  msg: object,
  oMmessage: (data: Bing.Type1Data | Bing.Type2Data) => void
): Promise<Bing.Type2Data> => {
  return await new Promise((resolve, _reject) => {
    const ws = webSockets[socketId]
    if (ws == null) throw new Error(`WebSocket ${socketId} not found`)

    ws.onmessage = (e) => {
      const msg = e.data
      for (const item of msg.split('\x1e').filter(Boolean)) {
        const data = JSON.parse(item.replaceAll('\n', '\\n'))
        oMmessage(data)

        if (data.type === 2) {
          setTimeout(() => {
            resolve(data)
          })
        }
      }
    }
    ws.send(JSON.stringify(msg) + '\x1e')
  })
}

export const bingChatCloseWebSocket = async (socketId: string) => {
  const ws = webSockets[socketId]
  ws?.close()
  webSockets[socketId] = null
}
