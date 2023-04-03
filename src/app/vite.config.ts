import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'
import vitePluginImp from 'vite-plugin-imp'
import { ViteMinifyPlugin } from 'vite-plugin-minify'

// import * as url from 'url'
// const __filename = url.fileURLToPath(import.meta.url)
// const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  base: '/app',
  build: {
    outDir: '../../dist/app'
  },
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
    }),

    ViteMinifyPlugin({
      removeAttributeQuotes: true,
      minifyCSS: true,
      minifyJS: true,
      minifyURLs: true
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '/src'),
      '@@': path.resolve(__dirname, '../universe')
    }
  }
})
