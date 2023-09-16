import { isEdge, isMac } from '@ha0z1/extension-utils'
import { FULL_VERSION, MAIN_VERSION } from './constants'

export const genUA = () => {
  let ua = navigator.userAgent
  if (!isEdge) {
    if (isMac) {
      ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MAIN_VERSION}.0.0.0 Safari/537.36 Edg/${FULL_VERSION}`
    } else {
      ua = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MAIN_VERSION}.0.0.0 Safari/537.36 Edg/${FULL_VERSION}`
    }
  }
  return ua
}

export default genUA
