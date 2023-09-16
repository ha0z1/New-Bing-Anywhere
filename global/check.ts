import { FULL_VERSION, GOOGLE_DOMAINS, MAIN_VERSION, YANDEX_DOMAINS } from './constants'
import { Sites } from 'global/types/_config'
export const checkIsGoogle = (hostname = location.hostname): boolean => {
  return GOOGLE_DOMAINS.includes(hostname.replace(/^www\./, ''))
}

export const checkIsBaidu = (hostname = location.hostname): boolean => {
  return hostname === 'www.baidu.com'
}
export const checkIsYandex = (hostname = location.hostname): boolean => {
  return YANDEX_DOMAINS.includes(hostname.replace(/^www\./, ''))
}
export const checkIsSo = (hostname = location.hostname): boolean => {
  return hostname === 'www.so.com'
}
export const checkIsBing = (hostname = location.hostname): boolean => {
  return hostname === 'www.bing.com'
}
export const checkIsDuckduckgo = (hostname = location.hostname): boolean => {
  return hostname === 'duckduckgo.com'
}
export const checkIsEcosia = (hostname = location.hostname): boolean => {
  return hostname === 'www.ecosia.org'
}
export const checkIsBrave = (hostname = location.hostname): boolean => {
  return hostname === 'search.brave.com'
}
export const checkIsNaver = (hostname = location.hostname): boolean => {
  return hostname === 'search.naver.com'
}
export const checkIsYahoo = (hostname = location.hostname): boolean => {
  return hostname.endsWith('search.yahoo.com') || hostname === 'search.yahoo.co.jp'
}

const isBaidu = /* @__PURE__ */ checkIsBaidu()
const isGoogle = /* @__PURE__ */ checkIsGoogle()
const isYandex = /* @__PURE__ */ checkIsYandex()

export const getSiteType = () => {
  if (isGoogle) return Sites.Google
  if (isBaidu) return Sites.Baidu
  if (isYandex) return Sites.Yandex
  return Sites.Google
}
