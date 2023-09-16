import { getURL } from '@ha0z1/extension-utils'

export default (link: string) => {
  if (link.startsWith('https://zh.wikipedia.org/')) {
    const url = getURL(link)
    const [, lang, qs] = url.pathname.split('/')
    url.pathname = `/wiki/${qs}`

    return url.toString()
  }

  if (link === 'https://www.baidu.com/default.html' || link === 'http://wap.baidu.com') {
    return 'https://www.baidu.com/'
  }

  return link
}
