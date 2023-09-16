const $ = (s: string, parent = document) => parent.querySelector(s)
const mutationConfig = { attributes: true, childList: true, subtree: true }

/**
 *
 * @param domSelector string
 * @param timeout number Unit: second
 * @param parent Element | undefined
 * @returns Element | null
 */
export const $w = async (domSelector: string, timeout: number = 30 /* second */, parent = document): Promise<Element | null> => {
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
      // if timeout, resolve Element or null
      const $dom = $(domSelector, parent)
      observer.disconnect()
      resolve($dom)
    }, timeout * 1000)
  })
}
