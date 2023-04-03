import Home from '@/pages/Home'
import Options from '@/pages/Options'
import { createHashRouter } from 'react-router-dom'

const router = createHashRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/options',
    element: <Options />
  }
])

export default router
