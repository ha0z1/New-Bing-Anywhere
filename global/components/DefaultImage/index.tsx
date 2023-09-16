import React, { FC, useEffect, useState } from 'react'

const DefaultImage: FC<React.ImgHTMLAttributes<HTMLImageElement> & { defaultSrc: string }> = (props) => {
  let { src, defaultSrc, ...restProps } = props
  if (!defaultSrc && src) {
    defaultSrc = src
  }
  const [finallySrc, setFinallySrc] = useState(defaultSrc)

  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.onload = () => {
      setFinallySrc(src!)
    }
    img.src = src
  }, [])

  if (!src || !defaultSrc) return null
  return <img {...restProps} src={finallySrc} />
}
export default DefaultImage
