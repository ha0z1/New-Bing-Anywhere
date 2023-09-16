import { type Claude } from '@ha0z1/llama-apis'
import { Button, Modal, ModalFuncProps } from 'antd'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import genFrontApis from '../apis'
import useConfig from './useConfig'

export default () => {
  const [error, setError] = useState<Error | null>(null)
  const [config] = useConfig()
  const [apis, setApis] = useState<Claude | null>(null)

  useEffect(() => {
    const apis = genFrontApis<Claude>(config.apisType)
    apis && setApis(apis)
  }, [config.apisType])

  const { data: { conversationId = '' } = {}, error: createConversationError } = useSWR(
    apis && 'createConversation',
    () => apis!.createConversation(),
    { revalidateOnFocus: false }
  )

  // const [modal, modalContextHolder] = Modal.useModal()
  {
    useEffect(() => {
      if (!createConversationError) return
      setError(createConversationError)
      // modal.error({
      //   title: 'Error',
      //   content: 'Error1'
      // })
    }, [createConversationError])
  }
  return {
    error,
    conversationId,
    apis: (apis || {}) as Claude
  }
}
