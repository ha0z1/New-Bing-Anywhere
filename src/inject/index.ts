import { genUA } from '@@/utils'

try {
  const ua = genUA()
  Object.defineProperty(navigator, 'userAgent', {
    get: () => ua
  })
} catch {}
