import React from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../../store'
import s from './suggestions.module.styl'
import { Sites } from '../../../types'

const MAX = 6
export default () => {
  const suggestions = useSelector((state: AppState) => state.app.data.suggestions)
  const site = useSelector((state: AppState) => state.app.props.site)

  const list = suggestions?.list
  if (!(Array.isArray(list) && list.length)) return null

  return (
    <>
      <hr />
      <div className={s.suggestions}>
        {list.slice(0, MAX).map(({ title }) => {
          const q = encodeURIComponent(title)
          const googleHref = `https://www.google.com/search?q=${q}`
          let href = googleHref
          if (site === Sites.Google) {
            href = googleHref
          } else if (site === Sites.Baidu) {
            href = `https://www.baidu.com/s?wd=${q}`
          } else if (site === Sites.Yandex) {
            href = `https://yandex.com/search/?text=${q}`
          } else {
            href = googleHref
          }

          return (
            <a key={title} href={href} rel="nofollow noopener noreferrer">
              {title}
            </a>
          )
        })}
      </div>
    </>
  )
}
