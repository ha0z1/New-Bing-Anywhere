import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import vitePluginImp from 'vite-plugin-imp'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vitePluginImp({
      libList: [
        {
          libName: 'lodash',
          libDirectory: '',
          camel2DashComponentName: false
        },
        {
          libName: 'antd',
          style(name: string) {
            // use less
            return `antd/es/${name}/style/index.js`
          }
        }
      ]
    })
  ]
})
