import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'
import vitePluginImp from 'vite-plugin-imp'
import { ViteMinifyPlugin } from 'vite-plugin-minify'

// import * as url from 'url'
// const __filename = url.fileURLToPath(import.meta.url)
// const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env.NODE_ENV = mode
  return {
    base: '/app',
    build: {
      minify: mode !== 'development',
      sourcemap: mode === 'development' ? 'inline' : false,
      outDir: '../../dist/chromium/app',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    },
    esbuild:
      mode !== 'development'
        ? {
            drop: ['console', 'debugger']
          }
        : null,
    server: {
      host: '0.0.0.0'
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
  }
})
