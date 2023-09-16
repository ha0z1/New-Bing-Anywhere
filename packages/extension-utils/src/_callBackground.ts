type IMethods = Record<string, (...args: any[]) => Promise<any>>
// let hasListener = false
const browser = chrome
export const addBackgroundListener = (callMethods: IMethods) => {
  // if (hasListener) throw new Error('addBackgroundListener can only be called once')
  // hasListener = true

  browser.runtime.onMessage.addListener((req, sender, sendResponse) => {
    ;(async () => {
      try {
        const { method, args, onMessageUUID } = req

        if (onMessageUUID && Object.prototype.toString.call(args[0]) === '[object Object]') {
          // debugger
          args[0].onMessage = (...msg: any[]) => {
            // const tabId = sender.tab?.id
            // tabId && browser.tabs?.sendMessage(tabId, { msgId: uuid, msg: 'msg999' })
            // browser.runtime.sendMessage({ msgId: uuid, msg: 'msg888' })
            // console.log(11111, 6666, JSON.stringify(msg))
            sendResponse({ code: 200, msg: 'ok22222', data: msg, onMessageUUID })
            // sendResponse({ code: 200, msg: 'ok', data: msg })
          }
        }

        if (!callMethods[method]) {
          // console.log(`addBackgroundListener.${method} is not registry`)
          return
          // throw new Error(`addBackgroundListener.${method} is not registry`)
        }
        const data = await callMethods[method](...args)
        sendResponse({ code: 200, msg: 'ok', data })
      } catch (e: any) {
        const err = e ?? {}
        console.log(err)
        sendResponse({ code: 500, msg: err.stack ?? err.message ?? e, ...e })
      }
    })()
    return true
  })
}

export const callBackground = async <T = any>(method: string, args: any[] = []): Promise<T> => {
  return await new Promise((resolve, reject) => {
    let onMessageUUID: string | undefined

    const onMessage = args[0]?.onMessage
    if (onMessage) {
      args[0].onMessage = undefined
      onMessageUUID = crypto.randomUUID()
      // msgCb = (options: { msgId: string; msg: any }) => {
      // debugger
      // const { msgId, msg } = options
      // if (msgId !== uuid) return
      // onMessage(...msg)
      // }
      // browser.runtime.onMessage.addListener(msgCb)
    }
    try {
      browser.runtime.sendMessage(
        {
          method,
          args: [...args],
          onMessageUUID
        },
        (res) => {
          if (!res) return
          const { code, msg, data, onMessageUUID } = res
          if (code !== 200) {
            reject(new Error(msg))
          } else {
            if (onMessageUUID) {
              onMessage(...data)
            }
            resolve(res.data)
          }
          // console.log(1111, 8888, JSON.stringify(res))
          // debugger
          // if (onMessage) {
          //   debugger
          //   onMessage(res.data)
          // }
          // msgCb && browser.runtime.onMessage.removeListener(msgCb)
        }
      )
    } catch (err) {
      reject(err)
    }
  })
}
