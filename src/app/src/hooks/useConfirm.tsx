import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Modal, ModalFuncProps, Button } from 'antd'
import { useCallback } from 'react'

export default () => {
  const [modal, modalContextHolder] = Modal.useModal()
  const confirm = useCallback((props?: ModalFuncProps): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      modal.confirm({
        type: 'error',
        title: 'Confirm',
        icon: <ExclamationCircleOutlined />,
        footer: (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: 20 }}>
            <Button
              onClick={() => {
                resolve(false)
                Modal.destroyAll()
              }}
              style={{ marginInlineEnd: 10 }}
            >
              {props?.cancelText || 'Cancel'}
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => {
                resolve(true)
                Modal.destroyAll()
              }}
            >
              {props?.okText || 'OK'}
            </Button>
          </div>
        ),
        onOk: () => {
          resolve(true)
        },
        onCancel: () => {
          resolve(false)
        },
        ...props
      })
    })
  }, [])
  return [confirm, modalContextHolder] as [typeof confirm, typeof modalContextHolder]
}
