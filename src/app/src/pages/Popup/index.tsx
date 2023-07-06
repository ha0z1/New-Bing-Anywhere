import { contextMenus, version } from '@@/utils'
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import s from './popup.module.styl'

export default () => {
  const repo = 'https://github.com/haozi/New-Bing-Anywhere'
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
          <Button icon={<InfoCircleOutlined />} type="ghost" href={`${repo}/issues/8`} target="_blank" />
          <Button icon={<SettingOutlined />} type="ghost" href="/app/index.html#/options" target="_blank" />
        </footer>
      </div>
    </div>
  )
}
