import React from 'react'
import { Provider } from 'react-redux'
import ChatApp from 'global/Chat/ChatApp'
import { type IChatAppProps } from 'global/types'
import { ChatAppPropsProvider } from 'global/hooks/useProps'
import store from 'global/Chat/store'

export { IChatAppProps }

export default (props: IChatAppProps) => {
  return (
    <Provider store={store}>
      <ChatAppPropsProvider>
        <ChatApp {...props} />
      </ChatAppPropsProvider>
    </Provider>
  )
}
