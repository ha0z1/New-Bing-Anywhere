import { Navigate } from 'react-router-dom'

export default () => {
  // hack chrome extension options link not redirect hash
  if (location.search === '?options') {
    setTimeout(() => {
      history.replaceState(null, '', `${location.pathname}#/options`)
    }, 300)
    return <Navigate to="/options" replace />
  }

  return <Navigate to="/chat/newtab" replace />
}
