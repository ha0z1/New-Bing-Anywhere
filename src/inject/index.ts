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
              brand: 'Microsoft Edge',
              version: MAIN_VERSION
            },
            {
              brand: 'Chromium',
              version: MAIN_VERSION
            },
            {
              brand: 'Not-A.Brand',
              version: '24'
            }
          ]
        }
      }
    })
  }
} catch {}
