import React from 'react'
import ReactDOM from 'react-dom/client'
import css from './.shadow.css?inline'
import ContentApp from './App'
import { $shadowAppRoot, shadowRoot } from './_shadowRoot'
import { ConfigProvider } from 'global/hooks/useConfig'

export default () => {
  // root.id = 'app'
  shadowRoot.appendChild($shadowAppRoot)

  const style = document.createElement('style')
  style.textContent = css
  shadowRoot.appendChild(style)

  ReactDOM.createRoot($shadowAppRoot).render(
    // <React.StrictMode>
    <ConfigProvider>
      <ContentApp />
    </ConfigProvider>
    // </React.StrictMode>
  )
  return $shadowAppRoot
}
