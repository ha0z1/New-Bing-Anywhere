import { getURLSearchParams } from '@ha0z1/extension-utils'
import Chat, { type IChatAppProps } from 'global/Chat'
import { getSiteType } from 'global/check'
import useConfig from 'global/hooks/useConfig'
import { Sites } from 'global/types/_config'
import React, { FC, useEffect, useState } from 'react'

export { IChatAppProps }

type IDir = 'ltr' | 'rtl'
type IDarkMode = 'dark' | 'light'
const siteType = getSiteType()

const App = () => {
  const [dir, setDir] = useState<IDir>('ltr')
  const [prompt, setPrompt] = useState<string>('')
  const [darkMode, setDarkMode] = useState<IDarkMode>('light')
  const [site, setSite] = useState<Sites>()
  const [config] = useConfig()

  const [locationUrl, setLocationUrl] = useState(location.href)

  useEffect(() => {
    const listener = () => {
      setLocationUrl(location.href)
    }
    const evtTypes = ['popstate', 'hashchange']
    for (let evtType of evtTypes) {
      window.addEventListener(evtType, listener)
    }

    const loop = () => {
      listener()
      setTimeout(loop, 2000)
    }
    loop()
    return () => {
      for (let evtType of evtTypes) {
        window.removeEventListener(evtType, listener)
      }
    }
  }, [])

  useEffect(() => {
    if (!config) return
    const userDarkMode = config.darkMode
    const autoDarkMode = config.darkMode === 'auto'
    !autoDarkMode && setDarkMode(userDarkMode as 'dark' | 'light')

    const search = location.search
    if (siteType === Sites.Google) {
      setPrompt(getURLSearchParams(search).get('q') ?? '')
      setDir(document.documentElement.dir as IDir)
      setSite(Sites.Google)
      autoDarkMode &&
        setDarkMode((document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement)?.content === 'dark' ? 'dark' : 'light')
    } else if (siteType === Sites.Baidu) {
      setPrompt(getURLSearchParams(search).get('wd') ?? '')
      setSite(Sites.Baidu)
    } else if (siteType === Sites.Yandex) {
      setPrompt(getURLSearchParams(search).get('text') ?? '')
      setSite(Sites.Yandex)
      autoDarkMode &&
        setDarkMode(
          document.cookie.match(/skin\.([sld])/)?.[1] === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        )
    }
    // if (isBing) {
    //   prompt = getURLSearchParams(search).get('q') ?? ''
    //   dir = document.documentElement.dir
    //   await $w('body')
    //   darkMode = (document.querySelector('body[class*="b_dark"]') as HTMLBodyElement) ? 'dark' : ''
    // }
    // if (isSo) {
    //   prompt = getURLSearchParams(search).get('q') ?? ''
    // }
    // if (isDuckduckgo) {
    //   prompt = getURLSearchParams(search).get('q') ?? ''
    //   darkMode = document.cookie.includes('ae=d') ? 'dark' : ''
    // }
    // if (isBrave) {
    //   prompt = getURLSearchParams(search).get('q') ?? ''
    //   darkMode = document.cookie.includes('theme=dark') ? 'dark' : ''
    // }
    // if (isEcosia) {
    //   prompt = getURLSearchParams(search).get('q') ?? ''
    // }
    // if (isNaver) {
    //   prompt = getURLSearchParams(search).get('query') ?? ''
    // }
    // if (isYahoo) {
    //   prompt = getURLSearchParams(search).get('p') ?? ''
    // }
  }, [config, locationUrl])

  const showApp = config && prompt && config.sidebarSites.includes(site!)
  if (!showApp) return null

  const maxWidth = siteType === Sites.Google ? 372 : undefined
  return (
    <Chat
      prompt={prompt}
      dir={dir || 'ltr'}
      darkMode={darkMode || 'light'}
      site={site || Sites.Google}
      style={{ marginBottom: 10, maxWidth }}
    />
  )
}
export default App
