import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CorePageData } from 'global/types'
import { LlamasTypes } from 'global/types/_config'
import { type IChatAppProps, type Content } from 'global/types'

interface AppData {
  props: IChatAppProps
  data: CorePageData
  state: any
}
const app = createSlice({
  name: 'app',
  initialState: {
    props: {} as IChatAppProps,
    data: {
      content: {},
      links: {},
      suggestions: {}
    } as CorePageData,
    state: {} as any
  } as AppData,
  reducers: {
    setProps: (state, action: PayloadAction<Partial<IChatAppProps>>) => {
      state.props = {
        ...state.props,
        ...action.payload
      }
    },
    setNaturalSearchData: (state, action: PayloadAction<Partial<CorePageData>>) => {
      state.data = {
        ...state.data,
        ...action.payload
      }
    },
    setContent: (
      state,
      action: PayloadAction<{
        llamasType: LlamasTypes
        content: Content
      }>
    ) => {
      const { llamasType, content } = action.payload
      state.data.content[llamasType] = content
    }
  }
})

export default app
