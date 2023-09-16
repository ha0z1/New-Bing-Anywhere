import React from 'react'
import s from './links.module.styl'
import { useSelector } from 'react-redux'
import { getURL } from '@ha0z1/extension-utils'
import { AppState } from '../../store'
import useConfig from '../../../hooks/useConfig'
import { Tooltip } from 'antd'
import DefaultImage from 'global/components/DefaultImage'

const fallbackIcon = chrome.runtime.getURL('/images/web.svg')
export default () => {
  const app = useSelector((state: AppState) => state.app)
  const links = useSelector((state: AppState) => state.app.data.links)
  const list = links?.list
  const MAX = 5
  const [config] = useConfig()

  if (!(config && Array.isArray(list) && list.length)) return null

  const { showLinksIcon } = config

  return (
    <>
      {/* {JSON.stringify(app)} */}
      <hr />
      <ul className={`${s.links} ${showLinksIcon ? s.linksIcon : ''}`}>
        {list.slice(0, MAX).map(({ link, title, description }) => {
          const { origin } = getURL(link)
          const favicon = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${origin}&size=32`
          // const favicon = `https://www.google.com/s2/favicons?domain=${origin}&size=128`
          const tips = description
          return (
            <li key={link + title}>
              {showLinksIcon && (
                <div className={s.iconWrap}>
                  <DefaultImage defaultSrc={fallbackIcon} src={favicon} />
                </div>
              )}
              <Tooltip placement="right" title={description}>
                <a href={link} target="_blank" rel="nofollow noopener noreferrer">
                  {title}
                </a>
              </Tooltip>
            </li>
          )
        })}
      </ul>
    </>
  )
}
