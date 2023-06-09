import { BugOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Spin, Tooltip } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { genIssueUrl } from '@@/utils'

import { sendBingChat } from '@/apis'
import { type Bing } from '@@/types'
import s from './chat.module.styl'

export type Scene = 'newtab' | 'popup' | 'iframe' | undefined
type SourceAttributions = NonNullable<Bing.CoreData['messages'][0]['sourceAttributions']>
type SuggestedResponses = NonNullable<Bing.CoreData['messages'][0]['suggestedResponses']>

const sc = { revalidateOnFocus: false }

export default () => {
  const [reloadKey, setReloadKey] = useState(0)
  const [content, setContent] = useState({
    text: '',
    sourceAttributions: [] as SourceAttributions,
    suggestedResponses: [] as SuggestedResponses
  })
  const [searchParams] = useSearchParams()
  const { scene = 'newtab' } = useParams<{ scene: Scene }>()
  const isPopup = scene === 'popup'
  const prompt = searchParams.get('q') ?? ''
  const engine = searchParams.get('engine') ?? 'google'

  const popupCss = {
    minWidth: 400,
    minHeight: 400,
    borderRadius: 0
  }
  const onMessage = useCallback((data: Bing.Type1Data | Bing.Type2Data) => {
    if (data.type !== 1) return

    const message = data.arguments?.[0]?.messages?.[0]
    const messageType = message?.messageType
    if (messageType === 'RenderCardRequest') return

    const text = message?.text ?? ''
    const sourceAttributions = message?.sourceAttributions ?? []
    const suggestedResponses = message?.suggestedResponses ?? []
    text &&
      setContent({
        text,
        sourceAttributions,
        suggestedResponses
      })
  }, [])

  const reload = useCallback(() => {
    setReloadKey(Date.now())
    setContent({ text: '', sourceAttributions: [], suggestedResponses: [] })
  }, [])

  const { data, error } = useSWR([prompt, reloadKey], () => sendBingChat(prompt, onMessage, !!reloadKey), sc)
  useEffect(() => {
    if (!data) return
    const message = (data.messages ?? []).reverse().find((msg) => !msg.messageType && msg.author === 'bot')
    const text = message?.text ?? ''
    const sourceAttributions = message?.sourceAttributions ?? []
    const suggestedResponses = message?.suggestedResponses ?? []

    text &&
      setContent({
        text,
        sourceAttributions,
        suggestedResponses
      })
  }, [data])

  return (
    <>
      <div className={s.wrap} style={isPopup ? popupCss : {}}>
        <header>
          <img src="../images/bing_48x48.png" />
          <h1>New Bing Anywhere</h1>
          <div className={s.btns}>
            <Button icon={<ReloadOutlined />} type="ghost" onClick={reload} />
            <Button icon={<SettingOutlined />} type="ghost" href="/app/index.html#/options" target="_blank" />
            <Tooltip title="Report a bug or suggestion">
              <Button
                icon={<BugOutlined />}
                type="ghost"
                onClick={async () => {
                  const url = await genIssueUrl()
                  window.open(url)
                }}
              />
            </Tooltip>
          </div>
        </header>
        <hr />
        <article>
          <div className={s.cont}>
            {error && (
              <div>
                Network error, please try to{' '}
                <a href="https://github.com/haozi/New-Bing-Anywhere/issues/8" target="_blank" rel="nofollow noopener noreferrer">
                  configure the network proxy
                </a>{' '}
                correctly, And complete the login on the{' '}
                <a href="https://www.bing.com" target="_blank" rel="nofollow noopener noreferrer">
                  Bing.com
                </a>
                .
              </div>
            )}

            {!error &&
              (content.text ? (
                <ReactMarkdown>{content.text.replace(/\[\^\d+\^\]/g, '')}</ReactMarkdown>
              ) : (
                <div className={s.loading}>
                  <Spin size="small" />
                </div>
              ))}

            {content.sourceAttributions.length > 0 && (
              <>
                <hr />
                <ul className={s.sourceAttributions}>
                  {content.sourceAttributions.map((item, i) => (
                    <li key={i}>
                      <a href={item.seeMoreUrl} target="_blank" title={item.providerDisplayName} rel="nofollow noopener noreferrer">
                        {item.providerDisplayName}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </article>

        {content.suggestedResponses.length > 0 && (
          <>
            <hr />
            <footer>
              <div className={s.more}>
                {content.suggestedResponses.map((item, i) => {
                  let searchUrl = ''
                  if (engine === 'google') {
                    searchUrl = `https://www.google.com/search?q=${encodeURIComponent(item.text)}`
                  }
                  return (
                    <a href={searchUrl} target="top" rel="nofollow noopener" key={i}>
                      {item.text}
                    </a>
                  )
                })}
              </div>
            </footer>
          </>
        )}
      </div>
    </>
  )
}
