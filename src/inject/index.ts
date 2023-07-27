import { genUA } from '@@/utils'
import { MAIN_VERSION } from '@@/constants'

try {
  const ua = genUA()
  Object.defineProperty(navigator, 'userAgent', {
    get: () => ua
  })

  interface NewNavigator extends Navigator {
    userAgentData?: {
      brands?: Array<{
        brand: string
        version: string
      }>
    }
  }
  const userAgentData = (navigator as NewNavigator).userAgentData
  const brands = userAgentData?.brands
  if (Array.isArray(brands)) {
    Object.defineProperty(navigator, 'userAgentData', {
      get: () => {
        const deepClonedUserAgentData = JSON.parse(JSON.stringify(userAgentData))
        return {
          ...deepClonedUserAgentData,
          brands: [
            {
              brand: 'Not.A/Brand',
              version: '8'
            },
            {
              brand: 'Chromium',
              version: MAIN_VERSION
            },
            {
              brand: 'Microsoft Edge',
              version: MAIN_VERSION
            }
          ]
        }
      }
    })
  }

  if (location.pathname === '/search') {
    let count = 0
    const MAX_TRY = 200
    const loopCheck = () => {
      if (count > MAX_TRY) return

      ++count
      const win: any = window
      const config = win._w?._sydConvConfig
      if (config) {
        const extSets = ',iycapbing,iyxapbing'
        if (!(config.sydOptionSets ?? '').includes(extSets)) {
          config.sydOptionSets += extSets
          config.enableVisualSearch = true
        } else {
          requestIdleCallback(loopCheck)
        }
      } else {
        requestIdleCallback(loopCheck)
      }
    }
    loopCheck()
  }
} catch (e) {
  console.error(e)
}
