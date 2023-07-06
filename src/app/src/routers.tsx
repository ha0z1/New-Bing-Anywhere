import Chat from '@/pages/Chat'
import Home from '@/pages/Home'
import Options from '@/pages/Options'
import Popup from '@/pages/Popup'
import { createHashRouter, Navigate } from 'react-router-dom'

const router: any = createHashRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/options',
    element: <Options />
  },
  {
    path: '/popup',
    element: <Popup />
  },
  {
    path: '/chat',
    element: <Navigate to="/chat/newtab" replace={true} />
  },
  {
    path: '/chat/:scene',
    element: <Chat />
  }
])

export default router
