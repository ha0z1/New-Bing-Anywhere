import { type Session } from './_utils'
type ConversationStyle = 'Creative' | 'Precise' | 'Balanced'

interface createPromptOptions {
  tone: ConversationStyle
  session: Session
  invocationId?: 0
  isStartOfSession?: boolean
  prompt: string
}

const pad0 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

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

export const createPrompt = (options: createPromptOptions) => {
  const { prompt, isStartOfSession = true, session, tone } = options
  const { encryptedConversationSignature, clientId, conversationId } = session
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
        conversationSignature: encryptedConversationSignature,
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

export type BingPrompt = ReturnType<typeof createPrompt>
