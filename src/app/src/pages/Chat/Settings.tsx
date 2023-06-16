import React, { useEffect } from 'react'
import useConfig, { type Config } from '@/hooks/useConfig'
import { Form, Modal, Radio, message, Select, Tooltip } from 'antd'

import s from './chat.module.styl'

const App: React.FC<{
  open: boolean
  onOK?: () => void
  onCancel?: () => void
}> = (props) => {
  useEffect(() => {
    document.body.style.minHeight = '510px'
    return () => {
      document.body.style.minHeight = ''
    }
  }, [])

  const [config, setConfig] = useConfig()
  const [form] = Form.useForm()
  useEffect(() => {
    form.setFieldsValue(config)
  }, [config])

  const [messageApi, contextHolder] = message.useMessage()
  const showSuccess = (content: string) => {
    messageApi.open({
      type: 'success',
      content
    })
  }
  const showError = (content: string) => {
    messageApi.open({
      type: 'error',
      content
    })
  }
  const saveConfig = async (values: Config) => {
    try {
      setConfig(values)
      showSuccess('Saved!')
    } catch (error: any) {
      console.error(error)
      showError(error.message ?? error)
    }
  }

  return (
    <Modal className={s.settings} title="Bing Chat Settings" open={props.open} onOk={props.onOK} onCancel={props.onCancel} footer={null}>
      {/* {JSON.stringify(config)} */}
      {contextHolder}
      <Form
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={config}
        onValuesChange={saveConfig}
        autoComplete="off"
        form={form}
      >
        {/* <Form.Item label="Trigger Mode" name="triggerMode">
          <Select value={'Questionmark'}>
            <Select.Option value="Always">
              Always{' '}
              <Tooltip title="on any search">
                <small className={s.triggerModeSmall}>(on any search)</small>
              </Tooltip>
            </Select.Option>
            <Select.Option value="Questionmark">
              Question Mark{' '}
              <Tooltip title="when query ends with a (?)">
                <small className={s.triggerModeSmall}>(when query ends with a (?))</small>
              </Tooltip>
            </Select.Option>
            <Select.Option value="Manually">
              Manually{' '}
              <Tooltip title="when click">
                <small className={s.triggerModeSmall}>(when click)</small>
              </Tooltip>
            </Select.Option>
          </Select>
        </Form.Item> */}

        <Form.Item label="Conversation Style" name="conversationStyle">
          <Radio.Group>
            <Radio.Button value="Creative">Creative</Radio.Button>
            <Radio.Button value="Balanced">Balanced</Radio.Button>
            <Radio.Button value="Precise">Precise</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Disable Sidebar">
          <span style={{ color: '#999' }}>
            Please go to{' '}
            <a href="/app/index.html#/options" target="_blank" style={{ color: '#8a90f9' }}>
              Options
            </a>
            , and then reload this page.
          </span>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default App
