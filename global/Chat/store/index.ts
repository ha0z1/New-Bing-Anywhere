import { configureStore, combineReducers } from '@reduxjs/toolkit'
import app from './app.slice'

const rootReducer = combineReducers({
  app: app.reducer
})

const store = configureStore({
  reducer: rootReducer
})

export type AppDispatch = typeof store.dispatch
export type AppState = ReturnType<typeof rootReducer>

export default store
