import useConfirm from '@/hooks/useConfirm'
import { useTitle } from '@/utils/hooks'
import { getConfig, isChinese, isFirefox, setConfig, type Config } from '@@/utils'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Form, Tooltip, message } from 'antd'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import Switch from './Switch'
import s from './options.module.styl'

const content1 = isChinese
  ? '由于微软经常升级策略，这个扩展需要经常升级和更新。如果您关闭了更新通知，您可能会错过重要的教程。'
  : 'Due to frequent policy updates from Microsoft, this extension requires regular upgrades and updates. If you disabled it, you may miss important tutorials.'
const content2 = 'You may miss important information.'

const content3 = isChinese ? (
  <>
    这是一个危险的实验性能功能，用于解决一些地区不能正常展示 BingChat 的问题。您需要了解它的风险：
    <ul>
      <li>1. 它不适用于中国大陆地区的用户，会造成必应无法访问 </li>
      <li>2. 它可能会使得必应一些基于地理位置的搜索结果不正确 </li>
      <li>3. 非必要不开启，能不开启尽量不开启</li>
    </ul>
  </>
) : (
  <>
    This is a risky experimental performance feature designed to address issues with BingChat not displaying properly in certain regions.
    You need to be aware of the following risks:
    <ul>
      <li>1. It is not suitable for users in mainland China and will result in Bing being inaccessible. </li>
      <li>2. It may lead to inaccurate location-based search results. </li>
      <li>3. If you can access Bing without enabling this feature, please refrain from enabling it.</li>
    </ul>
  </>
)
const content4 = 'It may cause Bing to malfunction. If you encounter any issues, please disable it.'

const App: React.FC = () => {
  useTitle('Options')
  const [config, setStateConfig] = useState<Config>()
  const [form] = Form.useForm()

  useSWR<Config>('config', async () => {
    const config = await getConfig()
    setStateConfig({ ...config })
    form.setFieldsValue({ ...config })
    return config
  })

  const formItemLayout = { labelCol: { span: 4 }, wrapperCol: { span: 14 } }

  const [messageApi, messageContextHolder] = message.useMessage()
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

  const showWarning = (content: string) => {
    messageApi.open({
      type: 'warning',
      content
    })
  }
  const saveConfig = async (values: Config) => {
    try {
      const XFF: boolean = values['X-Forwarded-For'] as unknown as boolean
      if (XFF === true) {
        values['X-Forwarded-For'] = '123.23.12.43'
      } else if (XFF === false) {
        values['X-Forwarded-For'] = undefined
      }
      await setConfig(values)
      setStateConfig((preConfig) => ({ ...preConfig, ...values }))

      showSuccess('Saved!')
      // console.log(JSON.stringify(await getConfig(), null, 2))
    } catch (error: any) {
      console.error(error)
      showError(error.message ?? error)
    }
  }
  const [confirm, confirmModal] = useConfirm()

  useEffect(() => {
    if (isFirefox) return
    const NAME = 'X-Forwarded-For'
    const ID = 3001
    const XFF = config?.[NAME]
    // console.log('XFF', XFF)
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ID],
      addRules: [
        {
          id: ID,
          action: {
            type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
              XFF
                ? {
                    operation: 'set' as chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: NAME,
                    value: XFF
                  }
                : {
                    operation: 'remove' as chrome.declarativeNetRequest.HeaderOperation.REMOVE,
                    header: NAME
                  }
            ]
          },
          condition: {
            requestDomains: ['www.bing.com'],
            resourceTypes: Object.values(chrome.declarativeNetRequest.ResourceType)
          }
        }
      ]
    })
  }, [config?.['X-Forwarded-For']])

  if (!config) return null

  return (
    <div className={s.options}>
      {messageContextHolder}
      {confirmModal}

      <header className={s.header}>
        <h1>
          <img src="../images/bing_48x48.png" /> New Bing Anywhere (Options Page)
        </h1>
        <div className={s.slogn}>New Bing Chat can be used in any browser, with any search engine, and in any country.</div>
      </header>
      <main className={s.body}>
        <Form
          {...formItemLayout}
          initialValues={config}
          layout="horizontal"
          form={form}
          // style={{ width: 600 }}
          labelWrap={true}
          onValuesChange={saveConfig}
          labelAlign="right"
          labelCol={{ span: 10, offset: 3 }}
        >
          <Form.Item label="Show Google Button On Bing" valuePropName="checked" name="showGoogleButtonOnBing">
            <Switch />
          </Form.Item>
          <Form.Item label="Show Bing Button On Google" valuePropName="checked" name="showBingButtonOnGoogle">
            <Switch />
          </Form.Item>
          <Form.Item label="Show Bing Chat Sidebar" valuePropName="checked" name="showChat">
            <Switch />
          </Form.Item>

          <Form.Item
            label={
              <>
                {!config.showRelease && (
                  <Tooltip title={content2}>
                    <ExclamationCircleOutlined style={{ color: 'red', marginInlineEnd: 5 }} />
                  </Tooltip>
                )}{' '}
                <span>Show Release On Upgrade</span>
              </>
            }
            valuePropName="checked"
            name="showRelease"
          >
            <Switch
              onBeforeChange={async (checked) => {
                if (checked === false) {
                  let doNext = false

                  doNext = await confirm({
                    title: 'Are you sure you want to disable the release notes? ',
                    content: content1,
                    okText: 'Yes, I am sure',
                    cancelText: 'No'
                  })
                  if (doNext) {
                    showWarning(content2)
                  }
                  return doNext
                }
                return true
              }}
            />
          </Form.Item>

          {!isFirefox && (
            <Form.Item
              label={
                <>
                  {config['X-Forwarded-For'] && (
                    <Tooltip title={content4}>
                      <ExclamationCircleOutlined style={{ color: 'red', marginInlineEnd: 5 }} />
                    </Tooltip>
                  )}{' '}
                  <span> Dangerous Request Forgery</span>
                </>
              }
              valuePropName="checked"
              name="X-Forwarded-For"
            >
              <Switch
                onBeforeChange={async (checked) => {
                  // console.log('onBeforeChange', checked)
                  if (checked === false) return true

                  const cf1 = await confirm({
                    title: 'Dangerous Request Forgery',
                    content: content3,
                    okText: 'Yes, I am sure',
                    cancelText: 'No'
                  })
                  if (!cf1) return false

                  const cf2 = await confirm({
                    title: 'Dangerous Request Forgery',
                    content: (
                      <>
                        <strong>You may not really understand the risks, please read the tips again:</strong>
                        <br />
                        {content3}
                      </>
                    ),
                    okText: 'OK',
                    cancelText: 'No'
                  })

                  return cf2
                }}
              />
            </Form.Item>
          )}
        </Form>
      </main>
    </div>
  )
}

export default App
