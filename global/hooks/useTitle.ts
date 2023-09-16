import { useEffect } from 'react'

export default (title: string) => {
  const DEFAULT_TITLE = 'New Bing Anywhere'

  useEffect(() => {
    document.title = `${title ? `${title} - ` : ''}${DEFAULT_TITLE}`
  }, [title])

  return () => {
    document.title = DEFAULT_TITLE
  }
}
