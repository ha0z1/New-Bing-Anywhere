import { Navigate } from 'react-router-dom'

export default () => {
  // hack chrome extension options link not redirect hash
  if (location.search === '?options') {
    history.replaceState(null, '', '/app/index.html#/options')
    return <Navigate to="/options" replace />
  }

  // return <div>Home</div>
  return <Navigate to="/chat/newtab" replace />
}
