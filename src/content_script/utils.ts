import { callBackground } from '@@/utils'

export const openUrlInSameTab = async (url: string) => {
  try {
    return await callBackground('openUrlInSameTab', [{ url }])
  } catch (e) {
    // console.error(e)
    location.href = url
  }
}

export const mutationConfig = { attributes: true, childList: true, subtree: true }

const $ = (s, parent = document) => parent.querySelector(s)

export const $w = async (domSelector: string, timeout: number = 30 /* second */, parent = document): Promise<Element> => {
  return await new Promise((resolve) => {
    const $dom = $(domSelector, parent)
    if ($dom) {
      resolve($dom)
      return
    }

    const observer = new MutationObserver((_mutationList, observer) => {
      const $dom = $(domSelector, parent)
      if ($dom) {
        observer.disconnect()
        resolve($dom)
      }
    })
    observer.observe(document, mutationConfig)

    setTimeout(() => {
      const $dom = $(domSelector, parent)
      observer.disconnect()
      resolve($dom)
    }, timeout * 1000)
  })
}
