import Apis, { Types, type IMessage, type ISendPrompt } from '../abstract'

const organizationReg = /\\"organization\\":{\\"uuid\\":\\"(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})\\"/
const accountReg = /\\"account\\":{\\"uuid\\":\\"(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})\\"/

interface IUserId {
  organizationId: string
  accountId: string
}
let cache: IUserId | undefined | null
const getUserId = async () => {
  // return {
  //   organizationId: '051f9cda-3b2c-45d2-a610-47bb14db582e',
  //   accountId: 'e97b02d0-8d4a-4817-a9e2-a0a145f9f4cd'
  // }
  if (cache) return cache
  try {
    const htmlStr = await fetch('https://claude.ai/chats', {
      method: 'GET'
    }).then((res) => res.text())

    const organizationId = htmlStr.match(organizationReg)?.[1] ?? ''
    const accountId = htmlStr.match(accountReg)?.[1] ?? ''
    if (!(organizationId && accountId)) throw new Error('need login https://claude.ai')
    cache = {
      organizationId,
      accountId
    }
    setTimeout(
      () => {
        cache = null
      },
      1000 * 60 * 3
    )
    return cache
  } catch (error) {
    throw error
  }
}

interface IChatConversations {
  uuid: string
  name: ''
  summary: ''
  created_at: string
  updated_at: string
}

interface IClaudeSendPrompt extends ISendPrompt {
  extractedContent: string
}

interface IAppendMessage {
  organizationId: string
  conversationId: string
  prompt: string
  extractedContent: string
  onMessage: (msg: IMessage) => void
}
const appendMessage = async (options: IAppendMessage) => {
  const { organizationId, conversationId, prompt, extractedContent, onMessage } = options
  const response = await fetch('https://claude.ai/api/append_message', {
    headers: {
      accept: 'text/event-stream',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      completion: { prompt, timezone: 'Asia/Singapore', model: 'claude-2' },
      organization_uuid: organizationId,
      conversation_uuid: conversationId,
      text: prompt,
      attachments: extractedContent
        ? [
            {
              file_name: 'paste.txt',
              file_size: new Blob([extractedContent]).size,
              file_type: 'txt',
              extracted_content: extractedContent
            }
          ]
        : []
    }),
    method: 'POST',
    mode: 'cors',
    credentials: 'include'
  })

  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader()
  const message: string[] = []
  let originMsg: any
  // eslint-disable-next-line no-constant-condition
  $i: while (true) {
    const { value, done } = await reader.read()
    if (done) break

    $j: for (let item of value.trim().split('\n\n')) {
      item = item.trim()
      if (!item.startsWith('data: ')) continue $j
      const dataPipe = JSON.parse(item.slice(6 /*'data: '.length*/))
      message.push(dataPipe.completion)
      const msg = message.join('')
      // console.log(JSON.stringify(dataPipe), 'pipe')
      if (dataPipe.stop_reason === 'stop_sequence') {
        originMsg = dataPipe
        break $i
      } else {
        onMessage({ msg, originMsg: dataPipe })
      }
    }
  }
  const msg = message.join('')
  return { msg, originMsg }
}

class Claude implements Apis {
  static type: Types = Types.Claude
  async createConversation() {
    const { organizationId } = await getUserId()
    const API = `https://claude.ai/api/organizations/${organizationId}/chat_conversations`
    const conversationId = crypto.randomUUID()
    const data: IChatConversations = await fetch(API, {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        uuid: conversationId,
        name: ''
      }),
      method: 'POST',
      mode: 'cors',
      credentials: 'include'
    }).then((res) => res.json())

    return {
      conversationId: data.uuid
    }
  }

  async sendPrompt(options: IClaudeSendPrompt) {
    const { organizationId } = await getUserId()
    const { prompt, extractedContent, conversationId, onMessage } = options ?? {}
    const data = await appendMessage({ organizationId, conversationId, prompt, extractedContent, onMessage })
    return data
  }

  async deleteConversation(conversationId: string) {
    const { organizationId } = await getUserId()

    const API = `https://claude.ai/api/organizations/${organizationId}/chat_conversations/${conversationId}`
    await fetch(API, {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(conversationId),
      method: 'DELETE',
      mode: 'cors',
      credentials: 'include'
    })
  }
}

export default Claude
