import type Apis from '../abstract'
import { IMessage, ISendPrompt, Types } from '../abstract'
import { createPrompt } from './_createPrompt'
import { createSession, createWebsocket, sendMessage, type Session, type Type1Data, type Type2Data } from './_utils'

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
    console.log(11111, 'LLaMA.sendPrompt')
    const { conversationId, onMessage: originOnMessage, prompt, extra } = options
    const session = JSON.parse(conversationId) as Session

    const onMessage = (msg: { msg: Partial<IMessage['msg']>; originMsg?: any }) => {
      debugger
      originOnMessage &&
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

    // onMessage({ msg: { text: '111.Creating socket...' } })
    onMessage({ msg: { text: '222.Creating socket...' } })
    // setInterval(() => {
    //   onMessage({ msg: { text: '222.Creating socket...222' } })
    // }, 2000)

    // const ws = await createWebsocket(session.encryptedConversationSignature)
    onMessage({ msg: { text: '333.Created socket success!' } })

    // ping(ws)
    // const timer = setInterval(() => {
    //   ping(ws)
    // }, 8000)

    onMessage({ msg: { text: '444.Sending prompt to Bing...' } })

    return 1 as any

    const type2Data = await sendMessage(ws, createPrompt({ session, prompt, tone: extra.tone }), (msg) => {
      // console.log(11112, 'llama-apis', msg)
      type MessageType = IMessage['msg']['type']

      const readyState = msg.type === 2 ? ENDED : OPEN // 2 ENDED; 1 OPEN

      let text = ''
      let type: MessageType = 'success'

      if (readyState === OPEN) {
        text = (msg as Type1Data).arguments?.[0].messages?.[0].text ?? ''
        type = (msg as Type1Data).arguments?.[0].result.error ? 'failure' : 'success'
      } else if (readyState === ENDED) {
        text = (msg as Type2Data).item?.result?.message ?? ''
        type = (msg as Type2Data).item?.result?.error ? 'failure' : 'success'
      }

      text &&
        onMessage({
          msg: { readyState, text: 'iiiiiiiiiiii' + text, type },
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
