import { useTitle } from '@/utils/hooks'
import { Button, Form, Select, Switch } from 'antd'
import React, { useState } from 'react'
import s from './options.module.styl'

type LayoutType = Parameters<typeof Form>[0]['layout']

const App: React.FC = () => {
  useTitle('Options')
  const [form] = Form.useForm()

  const formItemLayout = { labelCol: { span: 4 }, wrapperCol: { span: 14 } }

  return (
    <div className={s.options}>
      <Form
        {...formItemLayout}
        layout={'horizontal'}
        form={form}
        initialValues={{ layout: 'horizontal' }}
        style={{ width: 600 }}
      >
        <Form.Item label="show Google" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Select style={{ width: 220 }} />
      </Form>
    </div>
  )
}

export default App
