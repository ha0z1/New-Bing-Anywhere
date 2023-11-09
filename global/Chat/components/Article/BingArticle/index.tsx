import { type IMessage } from '@ha0z1/llama-apis'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR from 'swr'

import { genLLamaApis } from 'global/Chat/apis'
import { AppDispatch, AppState } from 'global/Chat/store'
import appSlice from 'global/Chat/store/app.slice'
import useConfig from 'global/hooks/useConfig'
import useProps from 'global/hooks/useProps'
import { LlamasTypes } from 'global/types/_config'
import { callBackground } from '@ha0z1/extension-utils/src'
import idmp from 'idmp'

export default () => {
  const dispatch = useDispatch<AppDispatch>()
  const [props] = useProps()
  const [config] = useConfig()
  const { prompt } = props

  const conversationStyle = config.Bing.conversationStyle
  const llamaApis = useMemo(() => genLLamaApis(LlamasTypes.Bing), [])!
  const onMessage = useCallback(({ msg }: IMessage) => {
    console.log(1111, 'BingArticle', msg)
    // debugger
    dispatch(
      appSlice.actions.setContent({
        llamasType: LlamasTypes.Bing,
        content: msg
      })
    )
  }, [])

  const sendPrompt = async () => {
    await callBackground('createOffscreen')
    const { conversationId } = await llamaApis.createConversation()

    // const { conversationId } = {
    //   conversationId: `{"conversationId":"51D|BingProd|57D4F2AEB5C1805B4D29148A2CE075D255C794DF36D359FD223E175F135DCA10","clientId":"844427168919600","encryptedConversationSignature":"5ZzQo+yXXQx/DcT6c9yYLQuyTLUoiEVMU99NeiDp7EdN4Y2ARpinLFLh1rfhV8gaCxWIhwsD46g98eDU8eaORW558qAmDYEjneRzF6HT6kQRnz963APhBk6OZ5CL7LBExZchkukuTZv8eQDSlPd+NDgTjYF5K/GXq5anAM9JJsNGriiAhG/no2nhFb03ILOyUqmMBo2TtgWzs4+7GQODKE6N3RhxrHiXRIrC7Gs8ud2N17rxgT9laTc1ub1edxZ/aLArydj95ZI1XMJJr4X9jLjt7YafR2s/Z/DyaaNO87CvRW4XMnxv/M8x85rppsUMvVAWv61D5rVGQOpwcmvKnSsvdUGSRoa3qdbsFxJpdQIDWJAS9eUWJRtWssvWPPH0r218Fuh2puBLp1mXr7T9MuYZ/2eVqsREWMiZqMptyvSH+upGA3vIkkyD8wawtlXO/i46jst+RHpZyqt1PUxOaHA59JSBfS4xo92uLu0bRZCCVbMczQCJuQCJ4odivGwJ5fcWBgUDWVAo0AelQViYbkIQp3kOy7oG2U9c9KUbfk+jOSsJH1fzlgzKAXELEYAHDk76ecZ1g6hlruTi/jKB5S11m4IGZDxY0NuQoyg8nLaJyg3pLWAMeeCGtlos1QCG/ttR9gzVQOIgwq2abKCDIJOVSoharm3Ol8NIY6QfSspU+c8jTiRvShyfbpla1QnY4jY5hiphMlzY5AjkpSiSguqzZBCRN4ompiFhl/+mLDN0atKzKtBEh/pFVzPK3+w5RfoR6LDQTAUKqvCVeRsiLFllv58Jp7QX0uJb5fWaGMK8vYoCZTveGTZOZQRKwk7RXEYvMRamk+GlFRQ0iMvdnkgYpGdZLWQje5mj1y05P3wJC6gHcNRAYlS/azMyz7MrJs8572gwRCf2/vIZZa6dSs9ua3XFWBComL+PUookESGDtitcAXUmUV78yO93sbKG0ysn8XxHY0RvLAj/autfMDCMD2JhIdV9vqKO9s2vTrTpeZ46m4qm6vc9mexbVkcMcYwqodY+3b0/BEraei+xrZUe25aaMQTez9pMvJwyyfO2WpLNLX48k4j7ONJc+KtuqE2Xnuz5z6bq5/mdpNfjnw=="}`
    // }

    const result = await llamaApis.sendPrompt({
      prompt,
      conversationId,
      onMessage,
      extra: {
        tone: conversationStyle
      }
    })
    // console.log(1111, 'BingArticle', result)
    // debugger
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
    return <>pending: {text}</>
  }
  return <>finallyData: {finallyData?.msg}</>
}
