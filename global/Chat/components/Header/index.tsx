import React from 'react'
import s from './header.module.styl'
import { Button, Spin, Tooltip } from 'antd'
import PureButton from 'global/components/PureButton'
import { BugOutlined, LinkOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { LlamasTypes } from '../../../types/_config'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../store'
import appSlice from '../../store/app.slice'
import useConfig from 'global/hooks/useConfig'

const logo = chrome.runtime.getURL('/images/bing_48x48.png')

export default () => {
  const [config, setConfig] = useConfig()

  const llamasTabsList = [
    {
      value: LlamasTypes.Bing,
      title: 'Bing',
      tips: ''
    },
    {
      value: LlamasTypes.Chatgpt,
      title: 'GPT4',
      tips: '只有官方价格的 1/10'
    }
  ]

  const onMouseEnter = (value: LlamasTypes) => {
    setConfig({
      selectedLlama: value
    })
  }
  const onMouseLeave = (value) => {
    // console.log(222222)
  }
  if (!config) return null
  return (
    <>
      <header className={s.header}>
        <img src={logo} />
        <h1>New Bing Anywhere </h1>
        <div className={s.btns}>
          <Tooltip>
            <PureButton
              size={30}
              onClick={async (e) => {
                // e.preventDefault()
                // await chrome.permissions.request({
                //   origins: ['wss://*.bing.com/']
                // })
                // setRefreshDataKey(Date.now())
                // setLoading(true)
                // setSession(undefined)
                // setContent({ text: '', sourceAttributions: [], suggestedResponses: [] })
              }}
            >
              <ReloadOutlined />
            </PureButton>
          </Tooltip>

          <PureButton size={30}>
            <SettingOutlined />
          </PureButton>
          <Tooltip title="Report a bug or suggestion">
            <PureButton size={30}>
              <BugOutlined />
            </PureButton>
          </Tooltip>
          <Tooltip title="Open with Bing.com">
            <PureButton size={30} href={`https://www.bing.com/search?q=${encodeURIComponent(prompt)}&showconv=1`}>
              <LinkOutlined />
            </PureButton>
          </Tooltip>
        </div>
        <div className={s.llamaTabs}>
          {llamasTabsList.map(({ title, value, tips }) => {
            return (
              <Tooltip title={tips} key={title}>
                <div
                  className={`${s.tab} ${config.selectedLlama === value ? s.active : ''}`}
                  onMouseEnter={() => onMouseEnter(value)}
                  onMouseLeave={() => onMouseLeave(value)}
                >
                  {title}
                </div>
              </Tooltip>
            )
          })}
        </div>
      </header>
    </>
  )
}
