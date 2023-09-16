import React, { FC, PropsWithChildren } from 'react'
import s from './pure-button.module.styl'

interface IProps {
  width?: number
  height?: number
  size?: 'small' | 'middle' | 'large' | number
  onClick?: (e: Event) => void
  href?: string
}
const Comp = (cProps: any) => {
  const isLink = !!cProps.href
  return isLink ? <a {...cProps} /> : <button {...cProps} />
}

const PureButton: FC<PropsWithChildren<IProps>> = (props) => {
  const { children, width, height, size, ...compProps } = props

  let styles = {}
  if (typeof size === 'number' && size > 0) {
    styles = { width: size, height: size }
  } else if (width && height) {
    styles = { width, height }
  } else {
    styles = {
      minWidth: 32,
      minHeight: 32
    }
  }

  return (
    <Comp {...compProps} className={`nba-pure-button ${s.btn}`} style={styles}>
      {children}
    </Comp>
  )
}

export default PureButton
