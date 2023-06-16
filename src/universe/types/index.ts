import * as Bing from './_bing'

export interface Extra {
  bingSession?: Bing.Session
  // if need reload the data
  needRefresh?: boolean
}

export { Bing }
