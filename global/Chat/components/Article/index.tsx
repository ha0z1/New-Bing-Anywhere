import React, { useEffect } from 'react'
import BingArticle from './BingArticle'
import ChatgptArticle from './ChatgptArticle'
import useConfig from 'global/hooks/useConfig'
import { LlamasTypes } from 'global/types/_config'

export default () => {
  const [config] = useConfig()
  if (!config) return null

  const { selectedLlama } = config

  return (
    <>
      <hr />
      <article>
        {selectedLlama === LlamasTypes.Bing && <BingArticle />}
        {selectedLlama === LlamasTypes.Chatgpt && <ChatgptArticle />}
      </article>
      {/* <article> */}

      {/* <div className={s.cont}>
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
      const errorMsg = (error.message as string) ?? error.toString()

      if (errorMsg.includes('CAPTCHA')) {
        return (
          <div className={s.error}>
            <p>
              <span style={{ color: '#ff4d4f' }}>Error</span>: There seem to be some errors{' '}
              {error ? (
                <>
                  :<span style={{ color: '#ff4d4f', fontSize: 12 }}>{errorMsg} </span>
                </>
              ) : (
                ''
              )}
            </p>

            <p>
              Try go to Bing{' '}
              <a
                href="https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx"
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                Bing-chat
              </a>{' '}
              and send any message to resolve CAPTCHA.
              <img
                src="https://github-production-user-asset-6210df.s3.amazonaws.com/4150641/255374853-7a350a7e-29ad-4e89-bace-7edd0f8f3e18.png"
                width={320}
                height={211}
              />
            </p>
          </div>
        )
      }

      return (
        <div className={s.error}>
          <p>
            <span style={{ color: '#ff4d4f' }}>Error</span>: There seem to be some errors{' '}
            {error ? (
              <>
                :<span style={{ color: '#ff4d4f', fontSize: 12 }}>{errorMsg} </span>
              </>
            ) : (
              ''
            )}
          </p>
          <p>You can try the following methods to fix them:</p>
          <ul>
            <li>
              Allow `wss://*.bing.com/` permissions{' '}
              <Button
                type="primary"
                onClick={() => {
                  chrome.permissions.request({
                    origins: ['wss://*.bing.com/']
                  })
                }}
              >
                Allow
              </Button>
            </li>
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
              <a href="https://github.com/ha0z1/New-Bing-Anywhere/issues/8" target="_blank" rel="nofollow noopener noreferrer">
                {' <'}Configure the Network Proxy{'>'}
              </a>{' '}
              for more information.
            </li>
            <li>Click the force refresh button in the top right corner and try again.</li>
            <li>
              If it remains unresolved, please{' '}
              <Button type="primary" href="https://github.com/ha0z1/New-Bing-Anywhere/issues" onClick={reportIssues}>
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
        return <Markdown darkMode={darkMode} children={content.text} />
      } else {
        return <DoChat />
      }
    } else if (config.triggerMode === 'Always') {
      if (content.text) {
        return <Markdown darkMode={darkMode} children={content.text} />
      }
    }

    return null
  })()} */}
      {/* <hr />
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
      </ul> */}
      {/* </article> */}
    </>
  )
}
