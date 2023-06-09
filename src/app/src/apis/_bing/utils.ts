import { Bing } from '@@/types'

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
  const { prompt, isStartOfSession = true, session } = options
  const { conversationSignature, clientId, conversationId } = session
  return {
    arguments: [
      {
        source: 'cib',
        sliceIds: [
          'winmuid1tf',
          'forallv2p2c',
          'sbsvgoptcf',
          'encjsrefcf',
          'winlongmsgtf',
          'controlwp',
          '0427visuals0',
          '0430dv3_2k_pc',
          '428gl16ks0',
          '420bics0',
          '0329resp',
          '425bicpctrl',
          '424dagslnv1'
        ],
        optionsSets: [
          'nlu_direct_response_filter',
          'deepleo',
          'disable_emoji_spoken_text',
          'responsible_ai_policy_235',
          'enablemm',
          'h3imaginative',
          'clgalileo',
          'gencontentv3',
          'dlresponse2k',
          'dltokens19k',
          'responseos',
          'dagslnv1',
          'dv3sugg'
        ],
        allowedMessageTypes: [
          'ActionRequest',
          'Chat',
          'InternalSearchQuery',
          'InternalSearchResult',
          'Disengaged',
          'InternalLoaderMessage',
          'RenderCardRequest',
          'AdsQuery',
          'SemanticSerp',
          'GenerateContentQuery',
          'SearchQuery'
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
        conversationSignature,
        participant: {
          id: clientId
        },
        conversationId
      }
    ],
    invocationId: Bing.InvocationId.Balanced,
    target: 'chat',
    type: 4
  }
}
