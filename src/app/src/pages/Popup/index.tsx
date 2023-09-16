import { InfoCircleOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { isBrave, isChinese } from '@ha0z1/extension-utils'
import { Tooltip } from 'antd'
import PureButton from 'global/components/PureButton'
import { AIPLUS, version } from 'global/constants'
import contextMenus from 'global/contextMenus'
import s from './popup.module.styl'

export default () => {
  const repo = 'https://github.com/ha0z1/New-Bing-Anywhere'
  return (
    <div className={s.warp}>
      <div style={{ width: '100%' }}>
        <header className={s.name}>
          <h1>
            <a href={repo} target="_blank">
              New Bing Anywhere
            </a>
          </h1>{' '}
          <small className={s.small}>
            (
            <a href={`${repo}/releases/tag/v${version}`} target="_blank">
              {version}
            </a>
            )
          </small>
        </header>
        <hr className={s.hr} />

        <ul className={s.nav}>
          {Object.entries(contextMenus).map(([key, value]) => {
            return (
              <li key={key} className={s.item}>
                <a
                  href="###"
                  onClick={(e) => {
                    e.preventDefault()
                    value.onclick()
                  }}
                >
                  {value.title}
                </a>
              </li>
            )
          })}
        </ul>
        <hr className={s.hr} />
        <footer className={s.footer}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.open(`${AIPLUS}?invite_code=b90e84b5`)
            }}
            className={s.ad}
          >
            {isChinese ? <Tooltip title="不限 IP 免封号">高性价比的 GPT-4</Tooltip> : null /*'Fast and affordable GPT-4'*/}
          </a>
          {isBrave && (
            <Tooltip
              title={
                <>
                  Tmp Fix Brave Relaunch{' '}
                  <a href="https://github.com/ha0z1/New-Bing-Anywhere/issues/76#issuecomment-1628103920" target="_blank">
                    <InfoCircleOutlined />
                  </a>
                </>
              }
            >
              <PureButton
                onClick={(e) => {
                  e.preventDefault()
                  chrome.runtime.reload()
                }}
              >
                <ReloadOutlined />
              </PureButton>
            </Tooltip>
          )}
          <PureButton href={`${repo}/issues/8`} target="_blank">
            <InfoCircleOutlined />
          </PureButton>
          <PureButton href="/app/index.html#/options" target="_blank">
            <SettingOutlined />
          </PureButton>
        </footer>
      </div>
    </div>
  )
}
