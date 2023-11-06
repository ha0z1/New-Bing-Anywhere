import { type IMessage } from '@ha0z1/llama-apis'
import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR from 'swr'

import { genLLamaApis } from 'global/Chat/apis'
import { AppDispatch, AppState } from 'global/Chat/store'
import appSlice from 'global/Chat/store/app.slice'
import useConfig from 'global/hooks/useConfig'
import useProps from 'global/hooks/useProps'
import { LlamasTypes } from 'global/types/_config'

export default () => {
  const dispatch = useDispatch<AppDispatch>()
  const [props] = useProps()
  const [config] = useConfig()
  const { prompt } = props

  const conversationStyle = config.Bing.conversationStyle
  const llamaApis = useMemo(() => genLLamaApis(LlamasTypes.Bing), [])!
  const onMessage = (msg: IMessage) => {
    debugger
    console.log(msg, 1111, 4444444444114)
    // debugger
    dispatch(
      appSlice.actions.setContent({
        llamasType: LlamasTypes.Bing,
        content: msg.msg
      })
    )
  }
  const sendPrompt = async () => {
    const { conversationId } = await llamaApis.createConversation()
    // console.log(111, 222, 'conversationId', conversationId)
    const result = await llamaApis.sendPrompt({
      prompt,
      conversationId,
      onMessage,
      extra: {
        tone: conversationStyle
      }
    })
    console.log(44444, 111, result)
    debugger
    await llamaApis.deleteConversation(conversationId)
    return result
  }

  const { data: finallyData, error: error1 } = useSWR(prompt && `${prompt}createConversation`, () => sendPrompt(), {
    revalidateOnFocus: false,
    errorRetryCount: 0,
    dedupingInterval: 3600 * 1000
  })

  const { text, type } = useSelector((state: AppState) => state.app.data.content[LlamasTypes.Bing])! ?? {}

  let error = error1
  if (type === 'failure') {
    error = new Error(text)
  }

  if (error) {
    return <>error: {error.message}</>
  }
  if (text) {
    return <>pendding: {text}</>
  }
  return <>finallyData: {finallyData?.msg}</>
}
