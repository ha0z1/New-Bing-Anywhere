import { Button, Checkbox, Form, Input, Modal, Switch } from 'antd'
import React, { useState } from 'react'

const App: React.FC<{
  open: boolean
}> = (props) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const showModal = () => {
    setIsModalOpen(true)
  }

  const handleOk = () => {
    setIsModalOpen(false)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  return (
    <Modal title="Settings" open={props.open} onOk={handleOk} onCancel={handleCancel} footer={null}>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        // onFinish={onFinish}
        // onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item label="Username" name="username">
          <Switch />
        </Form.Item>

        <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default App
