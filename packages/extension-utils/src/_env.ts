const userAgent = navigator.userAgent
const userAgentData = (navigator as any).userAgentData

export const checkIsSimpleChinese = () => {
  try {
    const lang = chrome.i18n.getUILanguage().toLowerCase()
    return lang === 'zh-cn'
  } catch {
    return false
  }
}

export const checkIsChinese = () => {
  try {
    const lang = chrome.i18n.getUILanguage().toLowerCase()
    return lang === 'zh-cn' || lang === 'zh-tw' || lang === 'zh-hk' || lang === 'zh'
  } catch {
    return false
  }
}

export const checkIsCN = () => {
  return false
}

export const isMac = /* @__PURE__ */ userAgent.includes('Macintosh')
export const isFirefox = /* @__PURE__ */ userAgent.includes('Firefox')
export const isEdge = /* @__PURE__ */ userAgent.includes('Edg/')
export const isBrave = /* @__PURE__ */ userAgentData?.brands.findIndex((item: any) => item.brand === 'Brave') > -1
export const isChinese = /* @__PURE__ */ checkIsChinese()
export const isSimpleChinese = /* @__PURE__ */ checkIsSimpleChinese()
