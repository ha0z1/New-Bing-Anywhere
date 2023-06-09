import { type Bing } from '@@/types'
const webSockets: Record<string, WebSocket | null> = {}

let id = 0
const uid = () => ++id

export const bingChatCreate = async (): Promise<Bing.Session> => {
  // return {
  //   conversationId: '51D|BingProd|F09DEF3DC34F46B76A5D4505D3085B0DB55C8AD37DEE97AC4D3C488C8AABDD01',
  //   clientId: '844427168919600',
  //   conversationSignature: 'vRWlTKxY8nD7PfrkWuR09mFoyFjvwHxjO70uJcddvBU='
  // }
  const res = await fetch('https://www.bing.com/turing/conversation/create', {
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
}

export const bingChatGetSocketId = async (): Promise<number> => {
  const socketUrl = 'wss://sydney.bing.com/sydney/ChatHub'
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(socketUrl)
    const socketId = uid()
    ws.onopen = (e) => {
      // console.log(`Connected to ${socketUrl}`)
      const hello = JSON.stringify({ protocol: 'json', version: 1 }) + '\x1e'
      ws.send(hello)
    }

    ws.onclose = () => {
      console.log('WebSocket is closed')
      webSockets[socketId] = null
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
  })
}

export const bingChatPing = async (socketId: number, msg: object) => {
  return await new Promise((resolve, reject) => {
    const ws = webSockets[socketId]
    if (ws == null) throw new Error(`WebSocket ${socketId} not found`)

    ws.send(JSON.stringify({ type: 6 }) + '\x1e')
    resolve(null)
  })
}

export const bingChatSend = async (socketId: number, msg: object) => {
  return await new Promise((resolve, reject) => {
    const ws = webSockets[socketId]
    if (ws == null) throw new Error(`WebSocket ${socketId} not found`)

    ws.onmessage = (e) => {
      const msg = e.data
      for (const item of msg.split('\x1e').filter(Boolean)) {
        const data = JSON.parse(item.replaceAll('\n', '\\n'))
        chrome.runtime.sendMessage(
          {
            method: 'bingChatSendOnMessage',
            data
          },
          () => {
            // if (chrome.runtime.lastError) return
          }
        )

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
