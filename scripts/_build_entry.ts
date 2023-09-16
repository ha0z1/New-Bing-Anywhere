import fs from 'fs-extra'
import { build } from 'vite'
import vitePluginImp from 'vite-plugin-imp'
import { chromiumDir, md5, root, src } from './_config'

// import copy from 'rollup-plugin-copy'
// import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

const buildFile = async (entries: Record<string, string>, mode: string) => {
  const isDev = mode === 'development'
  const tasks: Array<Promise<any>> = []
  for (let [key, src] of Object.entries(entries)) {
    if (!fs.existsSync(src)) continue
    tasks.push(
      build({
        //   root,
        plugins: [
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
          //     copy({
          //       targets: [
          //         {
          //           src: `${chromiumDir}/style.css`,
          //           dest: `${root}/raw`
          //         }
          //       ],
          //       hook: 'buildEnd'
          //     })
          // cssInjectedByJsPlugin({
          //   topExecutionPriority: false,
          //   injectCodeFunction: (cssCode, options) => {
          //     debugger
          //     // try {
          //     if (typeof document != 'undefined') {
          //       const elementStyle = document.createElement('style')
          //       elementStyle.appendChild(document.createTextNode(`${cssCode}`))
          //       document.head.appendChild(elementStyle)
          //     }
          //     // } catch (e) {
          //     //   console.error('vite-plugin-css-injected-by-js', e)
          //     // }
          //   }
          // })
        ],
        define: {
          'process.env.NODE_ENV': JSON.stringify(mode)
        },
        esbuild: isDev
          ? undefined
          : {
              drop: ['console', 'debugger']
            },
        build: {
          emptyOutDir: false,
          watch: isDev ? {} : null,
          minify: !isDev,
          sourcemap: isDev ? 'inline' : false,
          outDir: chromiumDir,
          lib: {
            entry: {
              [key]: src
            },
            name: 'lib',
            formats: ['iife'],
            fileName: (_format, entryName) => entryName
          }
        }
      })
    )
  }
  await Promise.all(tasks)
}
export default async ({ mode }: { mode: 'development' | 'production' }) => {
  const isDev = mode === 'development'

  const cssSrc = `${chromiumDir}/style.css`
  const cssDest = `${root}/src/content_script/ChatApp/.shadow.css`
  fs.ensureFileSync(cssDest)
  if (isDev) {
    fs.watch(`${chromiumDir}`, (eventType, filename) => {
      if (!(filename === 'style.css' && (eventType === 'change' || eventType === 'rename'))) return
      if (md5(fs.readFileSync(cssSrc)) === md5(fs.readFileSync(cssDest))) return

      fs.copyFileSync(cssSrc, cssDest)
    })
  }

  await buildFile(
    {
      'content_script.js': `${src}/content_script/index.ts`,
      'background.js': `${src}/background/index.ts`,
      'inject.js': `${src}/inject/index.ts`,
      'offscreen/index.js': `${src}/offscreen/index.ts`
    },
    mode
  )

  if (!isDev) {
    fs.existsSync(cssSrc) && fs.moveSync(cssSrc, cssDest, { overwrite: true })
    await buildFile(
      {
        'content_script.js': `${src}/content_script/index.ts`
      },
      mode
    )
    fs.removeSync(cssSrc)
    fs.removeSync(cssDest)
  } else {
    fs.existsSync(cssSrc) && fs.copyFileSync(cssSrc, cssDest)
  }
}
