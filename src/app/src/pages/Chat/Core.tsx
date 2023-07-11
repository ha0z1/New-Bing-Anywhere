import { BugOutlined, LinkOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Spin, Tooltip } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import useSWR from 'swr'

import { createBingChat } from '@/apis'
import useConfig from '@/hooks/useConfig'
import { type Bing, type Extra } from '@@/types'
import { callBackground, genIssueUrl } from '@@/utils'
import Markdown from './Markdown'
import Settings from './Settings'
import { formatText } from './_utils'
import s from './chat.module.styl'

export type Scene = 'newtab' | 'popup' | 'iframe' | undefined
type SourceAttributions = NonNullable<NonNullable<Bing.CoreData['messages']>[0]['sourceAttributions']>
type SuggestedResponses = NonNullable<NonNullable<Bing.CoreData['messages']>[0]['suggestedResponses']>

export default () => {
  const [config] = useConfig()
  const [needFetch, setNeedFecth] = useState<string | null>(null)
  const [refreshDataKey, setRefreshDataKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState({
    text: '',
    sourceAttributions: [] as SourceAttributions,
    suggestedResponses: [] as SuggestedResponses
  })
  const [searchParams] = useSearchParams()
  const { scene = 'newtab' } = useParams<{ scene: Scene }>()
  const [openSettings, setOpenSettings] = useState(false)
  const isPopup = scene === 'popup'
  const prompt = searchParams.get('prompt') ?? ''
  const engine = searchParams.get('engine') ?? 'google'
  const dir = searchParams.get('dir')
  const darkmode = searchParams.get('darkmode')
  const domain = searchParams.get('domain')
  useEffect(() => {
    const $html = document.documentElement
    dir && ($html.dir = dir)

    if (darkmode) {
      $html.style.setProperty('color-scheme', darkmode)
      $html.setAttribute('color-scheme', darkmode)
    }
  }, [])
  // extra
  let extra: Extra | undefined
  try {
    extra = JSON.parse(searchParams.get('extra') ?? '')
  } catch {}
  const [session, setSession] = useState(extra?.bingSession)
  useEffect(() => {
    if (!extra?.needRefresh) return
    setRefreshDataKey(Date.now())
  }, [extra?.needRefresh])

  const popupCss = {
    minWidth: 400,
    minHeight: 400,
    borderRadius: 0
  }
  const onMessage = useCallback((data: Bing.onMessageData) => {
    if (data.type === 0) {
      setLoading(false)
      setContent({
        ...content,
        text: data.text
      })
    }
    if (data.type === 1) {
      const coreData = data.arguments?.[0] ?? {}
      const message = coreData.messages?.[0]
      const messageType = message?.messageType
      if (messageType === 'RenderCardRequest') return

      const text = message?.text ?? ''
      const sourceAttributions = message?.sourceAttributions ?? []
      const suggestedResponses = message?.suggestedResponses ?? []
      if (text) {
        setLoading(false)
        setContent({
          text: formatText(text, coreData),
          sourceAttributions,
          suggestedResponses
        })
      }
    }
  }, [])

  useEffect(() => {
    if (!config?.triggerMode) return
    let _needFetch: string | null = `${prompt}${refreshDataKey ? `${refreshDataKey}` : ''}`
    const triggerMode = config.triggerMode

    if (triggerMode === 'Manually') {
      _needFetch = null
      setLoading(false)
    }

    if (triggerMode === 'Questionmark') {
      if (!(prompt.endsWith('?') || prompt.endsWith('？'))) {
        _needFetch = null
      }
      setLoading(false)
    }
    setNeedFecth(_needFetch)
  }, [config, refreshDataKey])

  // console.log('needFetch', needFetch, prompt)

  const { data, error } = useSWR(needFetch, () => createBingChat({ prompt, onMessage, needRefresh: !!refreshDataKey, session }), {
    revalidateOnFocus: false,
    errorRetryCount: 1
  })
  useEffect(() => {
    if (!error) return
    // console.log('%c %s', 'color: red', error)
    setLoading(false)
  }, [error])

  useEffect(() => {
    const coreData = data?.data
    if (!coreData) return
    setLoading(false)
    const message = (coreData.messages ?? []).reverse().find((msg) => !msg.messageType && msg.author === 'bot')
    const text = message?.text ?? ''
    const sourceAttributions = message?.sourceAttributions ?? []
    const suggestedResponses = message?.suggestedResponses ?? []

    if (text) {
      setLoading(false)
      setContent({
        text: formatText(text, coreData),
        sourceAttributions,
        suggestedResponses
      })
    } else {
      // throw new Error('stop')
    }
  }, [data])

  const reportIssues = async (e) => {
    e.preventDefault()
    const conversationOptions = data?.conversationOptions
    const url = await genIssueUrl({
      engine,
      query: prompt,
      stack: (error || '').toString().slice(0, 1000),
      conversation: conversationOptions
        ? 'https://sydney.bing.com/sydney/GetConversation?' +
          `conversationId=${encodeURIComponent(conversationOptions.session?.conversationId ?? '')}&` +
          `source=${encodeURIComponent(conversationOptions.source ?? '')}&` +
          `participantId=${encodeURIComponent(conversationOptions.participantId ?? '')}&` +
          `conversationSignature=${encodeURIComponent(conversationOptions.session?.conversationSignature ?? '')}`
        : undefined
    })
    window.open(url)
  }
  return (
    <>
      {openSettings && (
        <Settings
          open={openSettings}
          onCancel={() => {
            setOpenSettings(false)
            setTimeout(() => {
              location.reload()
            }, 100)
          }}
        />
      )}
      {/* {JSON.stringify(config)}
      <br />
      {JSON.stringify(content.text)} */}
      <div className={[s.wrap, s[config.conversationStyle?.toLowerCase()]].filter(Boolean).join(' ')} style={isPopup ? popupCss : {}}>
        <header>
          <img src="../images/bing_48x48.png" />
          <h1>New Bing Anywhere</h1>
          <div className={s.btns}>
            <Tooltip>
              <Button
                icon={<ReloadOutlined />}
                type="ghost"
                onClick={(e) => {
                  e.preventDefault()
                  setRefreshDataKey(Date.now())
                  setLoading(true)
                  setSession(undefined)
                  setContent({ text: '', sourceAttributions: [], suggestedResponses: [] })
                }}
                href=""
              />
            </Tooltip>

            <Button
              icon={<SettingOutlined />}
              type="ghost"
              href=""
              onClick={(e) => {
                e.preventDefault()
                setOpenSettings(true)
              }}
            />
            <Tooltip title="Report a bug or suggestion">
              <Button icon={<BugOutlined />} type="ghost" onClick={reportIssues} href="" />
            </Tooltip>
            <Tooltip title="Open with Bing.com">
              <Button
                icon={<LinkOutlined />}
                type="ghost"
                href={`https://www.bing.com/search?q=${encodeURIComponent(prompt)}&showconv=1`}
                onClick={async (e) => {
                  e.preventDefault()
                  const url = e.currentTarget.href
                  try {
                    await callBackground('openUrlInSameTab', [{ url }])
                  } catch (e) {
                    window.open(url, '_blank')
                  }
                }}
              />
            </Tooltip>
          </div>
        </header>
        <main>
          <hr />
          <article>
            <div className={s.cont}>
              {(() => {
                const DoChat = () => (
                  <Button
                    type="primary"
                    style={{
                      width: '100%',
                      height: 50
                    }}
                    onClick={() => {
                      setNeedFecth(Date.now().toString())
                    }}
                  >
                    点击加载
                  </Button>
                )
                if (loading) {
                  return (
                    <div className={s.loading}>
                      <Spin size="small" delay={300} />
                    </div>
                  )
                }
                if (error) {
                  return (
                    <div className={s.error}>
                      <p>
                        <span style={{ color: '#ff4d4f' }}>Error</span>: There seem to be some errors{' '}
                        {error ? (
                          <>
                            :<span style={{ color: '#ff4d4f', fontSize: 12 }}>{(error.message as string) ?? error.toString()} </span>
                          </>
                        ) : (
                          ''
                        )}
                      </p>
                      <p>You can try the following methods to fix them:</p>
                      <ul>
                        <li>
                          Make sure you have successfully logged into your Microsoft account on{' '}
                          <a href="https://www.bing.com" target="_blank" rel="nofollow noopener noreferrer">
                            Bing.com
                          </a>
                          . And ensure that the MS account is not banned (able to chat successfully on{' '}
                          <a
                            href="https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx"
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                          >
                            Bing-chat
                          </a>
                          ).
                        </li>

                        <li>
                          If you are using browsers like <em>Brave</em>, please make sure you have allowed third-party cookies for the
                          domain `<span style={{ color: '#ff4d4f' }}>{domain}</span>`.
                        </li>

                        <li>
                          There might be a Network Error, if you are from a country or region that does not support the New Bing Chat. You
                          may need to configure a network proxy correctly. Refer to{' '}
                          <a href="https://github.com/haozi/New-Bing-Anywhere/issues/8" target="_blank" rel="nofollow noopener noreferrer">
                            {' <'}Configure the Network Proxy{'>'}
                          </a>{' '}
                          for more information.
                        </li>
                        <li>Click the force refresh button in the top right corner and try again.</li>
                        <li>
                          If it remains unresolved, please{' '}
                          <Button type="primary" href="https://github.com/haozi/New-Bing-Anywhere/issues" onClick={reportIssues}>
                            Submit an issue
                          </Button>{' '}
                          to us, or{' '}
                          <Button danger type="primary" href="/app/index.html#/options" target="_blank" style={{ marginTop: '0.3em' }}>
                            Disable "Show Bing Chat Sidebar"
                          </Button>
                        </li>
                      </ul>
                    </div>
                  )
                }
                // console.log(content.text, config.triggerMode)
                if (config.triggerMode === 'Manually') {
                  return <DoChat />
                } else if (config.triggerMode === 'Questionmark') {
                  if (content.text) {
                    return <Markdown children={content.text} />
                  } else {
                    return <DoChat />
                  }
                } else if (config.triggerMode === 'Always') {
                  if (content.text) {
                    return <Markdown children={content.text} />
                  }
                }

                return null
              })()}

              {!loading && content.sourceAttributions.length > 0 && (
                <>
                  <hr />
                  <ul className={s.sourceAttributions}>
                    {content.sourceAttributions.map(
                      (item, i) =>
                        item.providerDisplayName &&
                        item.seeMoreUrl && (
                          <li key={i}>
                            <a href={item.seeMoreUrl} target="_blank" title={item.providerDisplayName} rel="nofollow noopener noreferrer">
                              {item.providerDisplayName}
                            </a>
                          </li>
                        )
                    )}
                  </ul>
                </>
              )}
            </div>
          </article>

          {!loading && content.suggestedResponses.length > 0 && (
            <>
              <hr />
              <footer>
                <div className={s.more}>
                  {content.suggestedResponses.map((item, i) => {
                    let searchUrl = ''
                    if (engine === 'google') {
                      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(item.text)}`
                    }
                    if (data?.conversationOptions?.session) {
                      const extraData: Extra = {
                        ...extra,
                        bingSession: data.conversationOptions.session,
                        needRefresh: true
                      }

                      searchUrl += `#?new-bing-anywhere=${encodeURIComponent(JSON.stringify(extraData))}`
                    }

                    return (
                      <a href={searchUrl} target="_top" rel="nofollow noopener" key={i}>
                        {item.text}
                      </a>
                    )
                  })}
                </div>
              </footer>
            </>
          )}
        </main>
      </div>
    </>
  )
}
