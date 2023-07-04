import { type Bing } from '@@/types'

import { v4 as uuidv4 } from 'uuid'

const pad0 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

// by Dj0ulo
const timestamp = () => {
  const t = new Date().getTimezoneOffset()
  const hOff = Math.floor(Math.abs(t / 60))
  const mOff = Math.abs(t % 60)
  let end = ''
  if (t < 0) {
    end = `+${pad0(hOff)}:${pad0(mOff)}`
  } else if (t > 0) {
    end = `-${pad0(hOff)}:${pad0(mOff)}`
  } else if (t === 0) {
    end = 'Z'
  }
  const now = new Date()
  const d = now.getDate()
  const mo = now.getMonth() + 1
  const y = now.getFullYear()
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  return `${pad0(y)}-${pad0(mo)}-${pad0(d)}T${pad0(h)}:${pad0(m)}:${pad0(s)}${end}`
}

export const createPropmt = (options: Bing.createPropmtOptions) => {
  const { prompt, isStartOfSession = true, session, tone } = options
  const { conversationSignature, clientId, conversationId } = session
  return {
    arguments: [
      {
        source: 'cib',
        optionsSets: [
          'nlu_direct_response_filter',
          'deepleo',
          'disable_emoji_spoken_text',
          'responsible_ai_policy_235',
          'enablemm',
          'galileo',
          'saharagenconv5',
          'iyntlbing',
          'iyxapbing',
          'objopinion',
          'intmvgnd',
          'rweasgv2',
          'videoansgnd',
          'dv3sugg',
          // 'autosave',
          'iyoloxap',
          'iyoloneutral'
        ],
        allowedMessageTypes: [
          'ActionRequest',
          'Chat',
          'Context',
          'InternalSearchQuery',
          'InternalSearchResult',
          'Disengaged',
          'InternalLoaderMessage',
          'Progress',
          'RenderCardRequest',
          'AdsQuery',
          'SemanticSerp',
          'GenerateContentQuery',
          'SearchQuery'
        ],
        sliceIds: [
          'winmuid3tf',
          'wrapalledgtf',
          'newmma-prod',
          'rankcf',
          'imgchatgptv1',
          'cibbeta2',
          'pref2',
          'winstmsg2tf',
          'sydtransctrl',
          'cssconvdesk',
          '606rai271s0',
          '517opinion',
          '602refusals0',
          '606rls0',
          '529rwea',
          '524vidansg'
        ],
        verbosity: 'verbose',
        isStartOfSession,

        message: {
          // locale: 'zh-CN',
          timestamp: timestamp(),
          author: 'user',
          inputMethod: 'Keyboard',
          text: prompt,
          messageType: 'Chat'
        },
        tone,
        conversationSignature,
        participant: {
          id: clientId
        },
        spokenTextMode: 'None',
        conversationId
      }
    ],
    invocationId: '0',
    target: 'chat',
    type: 4
  }
}

const webSockets: Record<string, WebSocket | null> = {}

let id = 0
const uid = () => ++id

export const bingChatCreateSession = async (): Promise<Bing.Session> => {
  const API = 'https://www.bing.com/turing/conversation/create'
  try {
    const res = await fetch(API, {
      headers: {
        accept: '*/*',
        'accept-language': 'zh,en;q=0.9,en-US;q=0.8,zh-CN;q=0.7,zh-TW;q=0.6',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'none'
      },
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: null,
      method: 'GET',
      mode: 'cors',
      credentials: 'include'
    }).then(async (r) => await r.json())

    return {
      conversationId: res.conversationId,
      clientId: res.clientId,
      conversationSignature: res.conversationSignature
    }
  } catch {
    throw new Error(`Failed to create session.Please ensure that the \`${API}\` request is accessible.`)
  }
}

export const bingChatGetSocketId = async (): Promise<number> => {
  const socketUrl = 'wss://sydney.bing.com/sydney/ChatHub'
  return await new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(socketUrl)
      const socketId = uid()
      ws.onopen = (e) => {
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

export const bingChatPing = async (socketId: number) => {
  return await new Promise((resolve, reject) => {
    const ws = webSockets[socketId]
    if (ws == null) throw new Error(`WebSocket ${socketId} not found`)

    ws.send(JSON.stringify({ type: 6 }) + '\x1e')
    resolve(null)
  })
}

export const bingChatSend = async (
  socketId: number,
  msg: object,
  oMmessage: (data: Bing.Type1Data | Bing.Type2Data) => void
): Promise<Bing.Type2Data> => {
  return await new Promise((resolve, reject) => {
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

export const bingChatCloseWebSocket = async (socketId: number) => {
  const ws = webSockets[socketId]
  ws?.close()
  webSockets[socketId] = null
}

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

export const checkHasText = (data?: Partial<Bing.CoreData> | null | undefined) => {
  return data?.result?.value === 'Success' && !!data?.messages?.reverse().find((msg) => !msg.messageType && msg.author === 'bot')?.text
}
