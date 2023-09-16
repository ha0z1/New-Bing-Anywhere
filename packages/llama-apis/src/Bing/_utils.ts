export interface Session {
  encryptedConversationSignature: string
  clientId: string
  conversationId: string
}
export interface Type1Data {
  type: 1
  target: 'update'
  arguments: [CoreData]
}

interface CoreData {
  messages?: Array<
    Partial<{
      text: string
      author: 'user' | 'bot'
      createdAt: string
      timestamp: string
      messageId: string
      messageType?: 'RenderCardRequest' | 'Text' | 'RichCard' | 'EndOfConversationActivity' | 'ActivityTypes/Event' | 'InternalSearchResult'
      groundingInfo?: {
        web_search_results?: Array<{
          index: string
          snippets: string[]
          title: string
          url: string
        }>
      }

      requestId: string
      offense: string
      feedback: {
        tag: null
        updatedOn: null
        type: 'None'
      }
      from: {
        id: string
        name: string | null
      }
      contentOrigin: 'cib' | 'DeepLeo'
      sourceAttributions?: Array<{
        providerDisplayName: string
        seeMoreUrl: string
        searchQuery: string
      }>
      suggestedResponses: Array<{
        text: string
        author: 'user' | 'bot'
        createdAt: string
        timestamp: string
        messageId: string
        messageType: 'Suggestion'
        offense: 'Unknown'
        feedback: {
          type: 'None'
        }
        contentOrigin: 'SuggestionChipsFalconService'
      }>
      privacy: null
    }>
  >
  firstNewMessageIndex: number | null
  defaultChatName: string | null
  conversationId: string
  requestId: string
  conversationExpiryTime: string
  shouldInitiateConversation: boolean
  telemetry: {
    metrics: null
    startTime: string
  }
  throttling: {
    maxNumUserMessagesInConversation: number
    numUserMessagesInConversation: number
  }
  result: {
    error?: string // 'Request is throttled.'
    value: 'Success' | 'Throttled'
    message: string // 'Request is throttled.'
    serviceVersion: string
  }
}
export interface Type2Data {
  type: 2
  invocationId: string
  item: CoreData
}

export const createSession = async (): Promise<Session> => {
  const API = 'https://www.bing.com/turing/conversation/create?bundleVersion=1.864.15'
  try {
    const xhr = await fetch(API, {
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
    })
    const encryptedConversationSignature = xhr.headers.get('x-sydney-encryptedconversationsignature') ?? ''
    const res = await xhr.json()

    return {
      conversationId: res.conversationId,
      clientId: res.clientId,
      encryptedConversationSignature
    }
  } catch {
    throw new Error(`Failed to create session.Please ensure that the \`${API}\` request is accessible.`)
  }
}

export const createWebsocket = async (encryptedConversationSignature: string): Promise<WebSocket> => {
  const socketUrl = `wss://sydney.bing.com/sydney/ChatHub?sec_access_token=${encodeURIComponent(encryptedConversationSignature)}`
  return await new Promise((resolve, reject) => {
    try {
      let ws: WebSocket = new WebSocket(socketUrl)
      ws.onopen = (_e) => {
        // console.log(`Connected to ${socketUrl}`)
        const hello = JSON.stringify({ protocol: 'json', version: 1 }) + '\x1e'
        ws.send(hello)
      }

      ws.onclose = () => {
        // console.log('WebSocket was closed')
        ws = null as any
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
          resolve(ws)
          return
        }
        ws.close()
        ws = null as any
        reject(new Error('WebSocket did not connect successfully'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

export const sendMessage = async (ws: WebSocket, msg: object, oMmessage: (data: Type1Data | Type2Data) => void): Promise<Type2Data> => {
  return await new Promise((resolve, _reject) => {
    ws.onmessage = (e) => {
      try {
        const msg = e.data
        for (const item of msg.split('\x1e').filter(Boolean)) {
          const data = JSON.parse(item.replaceAll('\n', '\\n'))
          oMmessage(data)

          if (data.type === 2) {
            resolve(data)
          }
        }
      } catch {
        resolve({} as any)
      }
    }
    ws.send(JSON.stringify(msg) + '\x1e')
  })
}
