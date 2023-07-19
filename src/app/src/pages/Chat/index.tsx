import React, { useCallback, useEffect, type FC } from 'react'
import { useParams } from 'react-router-dom'
import Core, { type Scene } from './Core'
import s from './chat.module.styl'

interface NewtabWarpProps {
  show: boolean
  children: React.ReactNode
}
const NewtabWarp: FC<NewtabWarpProps> = (props) => {
  if (props.show) {
    return <div className={s.newtabBox}>{props.children}</div>
  }
  return <>{props.children}</>
}

export default () => {
  const { scene = 'newtab' } = useParams<{ scene: Scene }>()

  const isNewtab = scene === 'newtab'
  useEffect(() => {
    ;(top ?? window).postMessage(
      {
        type: 'nba-ready',
        data: true
      },
      '*'
    )
  }, [])
  const sendSize = useCallback(() => {
    const $body = document.body
    if (!$body) return
    const width = $body.scrollWidth
    const height = $body.scrollHeight
    ;(top ?? window).postMessage(
      {
        type: 'nba-resize',
        data: { width, height }
      },
      '*'
    )
  }, [])
  useEffect(() => {
    sendSize()
    window.addEventListener('load', sendSize)
    const observer = new MutationObserver((mutations) => {
      sendSize()
    })
    observer.observe(document, {
      attributeOldValue: true,
      attributes: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true
    })
    return () => {
      observer.disconnect()
    }
  }, [])
  return (
    <NewtabWarp show={isNewtab}>
      <Core />
    </NewtabWarp>
  )
}
