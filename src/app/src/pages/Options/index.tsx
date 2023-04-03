import { useTitle } from '@/utils/hooks'
import { Config, getConfig, setConfig } from '@@/utils'
import { Form, message, Switch } from 'antd'
import React, { useState } from 'react'
import useSWR from 'swr'
import s from './options.module.styl'

const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage()

  useTitle('Options')
  const { data: config, error } = useSWR<Config>('config', getConfig)

  const [form] = Form.useForm()
  const formItemLayout = { labelCol: { span: 4 }, wrapperCol: { span: 14 } }
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
      await setConfig(values)
      showSuccess('Saved!')
    } catch (error: any) {
      console.error(error)
      showError(error.message ?? error)
    }
  }

  if (!config) return null

  return (
    <div className={s.options}>
      {contextHolder}
      <Form
        {...formItemLayout}
        initialValues={config}
        layout={'horizontal'}
        form={form}
        style={{ width: 600 }}
        labelWrap={true}
        onValuesChange={saveConfig}
      >
        <Form.Item label="Show Google Button On Bing" valuePropName="checked" name="showGoogleButtonOnBing">
          <Switch />
        </Form.Item>
        <Form.Item label="Show Bing Button On Google" valuePropName="checked" name="showBingButtonOnGoogle">
          <Switch />
        </Form.Item>

        {/* <Select style={{ width: 220 }} /> */}
      </Form>
    </div>
  )
}

export default App
