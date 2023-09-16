import { isChinese } from '@ha0z1/extension-utils'
import { version } from '../package.json'
import { getConfig } from './config'

const repositoryUrl = 'https://github.com/ha0z1/New-Bing-Anywhere'
const genGithubIssueUrl = async (extra?: Record<string, string | null | undefined>) => {
  try {
    const config = await getConfig()
    const url: string = `${repositoryUrl}/issues/new?title=&body=`
    let finalUrl: string = url
    let comment =
      'Please write your comment ABOVE this line, provide as much detailed information and screenshots as possible.' +
      'Please confirm that you have read the #8 https://github.com/ha0z1/New-Bing-Anywhere/issues/8.' +
      'The UA may not necessarily reflect your actual browser and platform, so please make sure to indicate them clearly.'
    if (isChinese) {
      comment =
        '请在此行上方发表您的讨论。请确认已经阅读了FAQ(https://github.com/ha0z1/New-Bing-Anywhere/issues/8)，详尽的描述和截图有助于我们定位问题，描述不清的问题会被关闭，UA 不一定真实反映您的浏览器和平台，请备注清楚'
    }

    const body =
      ' \n\n\n\n' +
      `<!--  ${comment} -->\n` +
      '<pre>\n' +
      Object.entries<string>({
        Version: `${version}`,
        UA: navigator.userAgent,
        Lang: chrome.i18n.getUILanguage(),
        AcceptLangs: (await chrome.i18n.getAcceptLanguages()).join(', '),
        config: JSON.stringify(config),
        ...extra
      })
        .map(([key, val]) => {
          return val ? `${key}: ${val}` : ''
        })
        .join('\n') +
      '</pre>'
    finalUrl += encodeURIComponent(body.slice(0, 2000))
    return finalUrl
  } catch {
    return repositoryUrl
  }
}

export default genGithubIssueUrl
