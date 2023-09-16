import { type IChatAppProps } from 'global/types'
import React, { createContext, useContext, useState } from 'react'

const DEFAULT = {} as unknown as IChatAppProps
const ChatAppPropsContext = createContext(null as unknown as [IChatAppProps, React.Dispatch<React.SetStateAction<IChatAppProps>>])

export const ChatAppPropsProvider = ({ children }) => {
  const [ChatApp, setChatApp] = useState<IChatAppProps>(DEFAULT)

  return <ChatAppPropsContext.Provider value={[ChatApp, setChatApp]}>{children}</ChatAppPropsContext.Provider>
}

export default () => {
  return useContext(ChatAppPropsContext)
}
