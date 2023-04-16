import { getConfig } from '@@/utils'
import bingHandler from './bing-handler'
import googleHandler from './google-handler'
;(async ($, $root) => {
  const config = await getConfig()

  if (location.hostname === 'www.bing.com') {
    bingHandler(config, $, $root)
  }

  if (location.hostname.startsWith('www.google.')) {
    googleHandler(config, $, $root)
  }
})((window as any).Zepto, document.documentElement)
