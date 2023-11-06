import React, { useEffect, type FC } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import s from './app.module.styl'

import { getDataFromBingNaturalSearch } from 'global/Chat/apis'
import Article from 'global/Chat/components/Article'
import Header from 'global/Chat/components/Header'
import Links from 'global/Chat/components/Links'
import Suggestions from 'global/Chat/components/Suggestions'
import { AppDispatch } from 'global/Chat/store'
import appSlice from 'global/Chat/store/app.slice'
import useConfig from 'global/hooks/useConfig'
import type { Config, IChatAppProps } from 'global/types'
import useProps from 'global/hooks/useProps'

const ChatApp: FC<IChatAppProps> = (props) => {
  const dispatch = useDispatch<AppDispatch>()
  const { prompt, darkMode, style } = props
  const [config] = useConfig()

  const { Bing } = config
  const conversationStyle = Bing.conversationStyle.toLowerCase() ?? ''
  const { data: naturalSearchData } = useSWR(`${prompt}getDataFromBingNaturalSearch`, () => getDataFromBingNaturalSearch(prompt), {
    revalidateOnFocus: false
  })

  useEffect(() => {
    dispatch(appSlice.actions.setProps(props))
  }, [props])

  {
    const [, setAppProps] = useProps()
    useEffect(() => {
      setAppProps(props)
    }, [props])
  }
  useEffect(() => {
    if (!naturalSearchData) return

    dispatch(appSlice.actions.setNaturalSearchData(naturalSearchData))
  }, [naturalSearchData])

  return (
    <div className={[s.wrap, s[conversationStyle]].filter(Boolean).join(' ')} color-scheme={darkMode} style={style}>
      <Header />
      <main>
        <Article />
      </main>
      <footer>
        <Links />
        <Suggestions />
      </footer>
    </div>
  )
}

export default ChatApp
