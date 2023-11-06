import type Apis from '../abstract'
import { ISendPrompt, IMessage, Types } from '../abstract'
import { createSession, createWebsocket, sendMessage, Type2Data, type Session } from './_utils'
import { createPrompt } from './_createPrompt'

const ping = (ws: WebSocket) => {
  ws.send(JSON.stringify({ type: 6 }) + '\x1e')
}
const OPEN = 'open'
const ENDED = 'ended'
class Bing implements Apis {
  static type: Types = Types.Bing

  async createConversation() {
    const session = await createSession()
    return {
      conversationId: JSON.stringify(session)
    }
  }

  async sendPrompt(options: ISendPrompt): Promise<IMessage> {
    const { conversationId, onMessage: originOnMessage, prompt, extra } = options
    const session = JSON.parse(conversationId) as Session

    const onMessage = (msg: { msg: Partial<IMessage['msg']>; originMsg?: any }) => {
      originOnMessage({
        msg: {
          readyState: 'open',
          type: 'success',
          text: '',
          ...msg.msg
        },
        originMsg: msg.originMsg
      })
    }

    onMessage({ msg: { text: '111444a.Creating socket...' } })
    setInterval(() => {
      onMessage({ msg: { text: '222.Creating socket...222' } })
    }, 2000)

    const ws = await createWebsocket(session.encryptedConversationSignature)
    onMessage({ msg: { text: '333.Created socket success!' } })

    ping(ws)
    const timer = setInterval(() => {
      ping(ws)
    }, 8000)

    onMessage({ msg: { text: 'Sending prompt to Bing...' } })

    // return 1 as any

    const type2Data = await sendMessage(ws, createPrompt({ session, prompt, tone: extra.tone }), (msg) => {
      console.log(1111, 'llama-apis', msg)
      type MessageType = IMessage['msg']['type']

      const readyState = msg.type === 2 ? ENDED : OPEN

      let text = ''
      let type: MessageType = 'success'
      if (readyState === ENDED) {
        text = (msg as Type2Data).item?.result?.message
        type = (msg as Type2Data).item?.result?.error ? 'failure' : 'success'
      }

      text &&
        onMessage({
          msg: { readyState, text, type },
          originMsg: msg
        })
    })

    clearInterval(timer)
    ws.close()

    const msg = {} as IMessage['msg']
    return { msg, originMsg: type2Data }
  }

  async deleteConversation(_conversationId: string): Promise<void> {
    // noop
  }
}

export default Bing
