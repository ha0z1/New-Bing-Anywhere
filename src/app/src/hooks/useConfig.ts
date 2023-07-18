import { getConfig as getConfigUtil, setConfig as setConfigUtil, type Config } from '@@/utils'
import { useEffect, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultConfig: Config = {} as any

export default () => {
  const [diskConfig, setDistConfig] = useState<Config>(defaultConfig)
  useEffect(() => {
    getConfigUtil().then((config) => {
      setDistConfig(config)
    })
  }, [])

  const [config, _setConfig] = useState<Config>(defaultConfig)
  useEffect(() => {
    _setConfig(diskConfig)
  }, [diskConfig])

  useEffect(() => {
    setConfigUtil(config)
  }, [config])

  const setConfig = (newConfig: Config) => {
    _setConfig((pre) => {
      return {
        ...pre,
        ...newConfig
      }
    })
  }
  return [config, setConfig] as [typeof config, typeof setConfig]
}

export { type Config }
