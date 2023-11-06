import { addBackgroundListener } from '@ha0z1/extension-utils'
import { Types as LlamasTypes, methods as LlamasMethods } from '@ha0z1/llama-apis'

const s = new URLSearchParams(location.search)
const url: Record<string, string> = JSON.parse(s.get('url')!)
const iframes: Record<string, HTMLIFrameElement> = {}
for (const [key, src] of Object.entries(url)) {
  const iframe = document.createElement('iframe')
  iframe.src = src + '###new-bing-anywhere-offscreen'
  iframe.id = key
  iframes[key] = iframe
  document.body.appendChild(iframe)
}

const iframe = iframes.Bing

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.target !== 'offscreen') return;
//     if (message.action === 'url') {
//       sendResponse(window.location.href);
//     } else {
//       sendMsg2Iframe(message, sendResponse);
//     }
//     return true;
//   });

interface IMessage {
  uuid: string
  msg: any
}
const genUUID = () => Math.random() + ''

const sendMsg2Iframe = <T = any, U = any>(iframe: HTMLIFrameElement, options: T): Promise<U> => {
  return new Promise((resolve, reject) => {
    const uuid = genUUID()
    const onMessageUUID = genUUID()
    const onMessage = options?.[1]?.onMessage
    const hasOnMessage = typeof onMessage === 'function'

    if (hasOnMessage) {
      options[1].onMessage = undefined
    }

    const messageHandler = (e: MessageEvent<IMessage>) => {
      const { msg, uuid: callbackUUID } = e.data
      if (callbackUUID === uuid) {
        if (msg.code === 200) {
          resolve(msg.data)
        } else {
          reject(msg)
        }
        window.removeEventListener('message', messageHandler)
      }

      console.log(1111, 'offscreen onMessage', { onMessageUUID, callbackUUID, uuid, msg })
      if (hasOnMessage && callbackUUID === onMessageUUID) {
        console.log(1111, 'offscreen onMessage', { msg })
        onMessage(msg)
      }
    }

    window.addEventListener('message', messageHandler)
    setTimeout(() => {
      if (!iframe.contentWindow) return

      iframe.contentWindow.postMessage({ msg: options, uuid, onMessageUUID: hasOnMessage ? onMessageUUID : undefined }, '*')
    })
  })
}

const methods = {
  'LLaMA.Bing.createConversation': (args) => {
    const LLaMA = LlamasTypes.Bing
    // console.log(111111, 'LLaMA.Bing.createConversation', { args, iframes, LLaMA })
    return sendMsg2Iframe(iframes[LLaMA], ['LLaMA.Bing.createConversation', args])
  },
  'LLaMA.Bing.sendPrompt': (args) => {
    const LLaMA = LlamasTypes.Bing
    // console.log(111111, 'LLaMA.Bing.sendPrompt', { args, iframes, LLaMA })
    return sendMsg2Iframe(iframes[LLaMA], ['LLaMA.Bing.sendPrompt', args])
  }
}

addBackgroundListener(methods)
