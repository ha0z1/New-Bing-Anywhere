import React, { useEffect, useState, createContext, useContext } from 'react'
import { getConfig as getConfigUtil, setConfig as setConfigUtil, defaultConfig, type Config } from '../config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ConfigContext = createContext(null as unknown as [Config, (newConfig: Partial<Config>) => void])

export const ConfigProvider = ({ children }) => {
  const [config, _setConfig] = useState<Config>(null as unknown as Config)

  useEffect(() => {
    getConfigUtil().then((config) => {
      _setConfig(config)
    })
  }, [])

  useEffect(() => {
    setConfigUtil({ ...config })
  }, [JSON.stringify(config)])

  const setConfig = (newConfig: Partial<Config>) => {
    _setConfig((pre) => {
      return {
        ...pre,
        ...(newConfig as Config)
      }
    })
  }
  if (!config) return null
  return <ConfigContext.Provider value={[config, setConfig]}>{children}</ConfigContext.Provider>
}

export default () => {
  return useContext(ConfigContext)
}
export { type Config }
