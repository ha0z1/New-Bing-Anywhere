import '@/App.styl'
import en_US from 'antd/locale/en_US'
import ru_RU from 'antd/locale/ru_RU'
import zhCN from 'antd/locale/zh_CN'
import zhTW from 'antd/locale/zh_TW'

import router from '@/routers'
import { ConfigProvider } from 'antd'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

export default () => {
  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}
