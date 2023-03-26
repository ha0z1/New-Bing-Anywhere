import esbuild from 'esbuild'

import svgrPlugin from 'esbuild-plugin-svgr'
import stylePlugin from 'esbuild-style-plugin'
import fs from 'fs-extra'
import path from 'path'

// import { stylusLoader } from 'esbuild-stylus-loader'
import pkg from '../package.json'

const isDev = process.argv[2] === 'dev'
const external = [
  ...new Set(
    ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
      .map((o) => Object.keys(pkg[o] ?? {}))
      .flat()
  )
]

const buildFile = async (input, output) => {
  try {
    console.time(`构建用时: ${input} => ${output}`)
    const buildOptions = {
      entryPoints: [input],
      bundle: true,
      external,
      outfile: output,
      minify: !isDev,
      sourcemap: isDev ? 'inline' : (false as any),
      plugins: [svgrPlugin(), stylePlugin()]
    }
    if (!isDev) {
      await esbuild.build(buildOptions)
      return
    }

    const context = await esbuild.context(buildOptions)
    await context.rebuild()
    await context.watch()
    await context.serve()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

const buildManifest = () => {
  const manifest = {
    manifest_version: 3,
    name: '__MSG_appName__',
    description: '__MSG_appDesc__',
    version: pkg.version,
    homepage_url: pkg.homepage,
    default_locale: 'en',
    background: {
      service_worker: 'background.js'
    },

    web_accessible_resources: [
      {
        resources: ['images/*', 'css/*', 'js/*'],
        matches: ['https://www.bing.com/*', 'https://www.google.com/*', 'https://www.google.com.hk/*']
      }
    ],
    permissions: [
      // "storage",
      // "unlimitedStorage",
      // 'cookies',
      // 'tabs',
      // 'activeTab',
      'contextMenus',
      'declarativeNetRequest'
      // "declarativeNetRequestFeedback",
    ],

    host_permissions: [
      // 'notifications',
      // '<all_urls>'
      'http://*.bing.com/*',
      'https://*.bing.com/*',
      'https://www.google.com/search?*',
      'https://www.google.com.hk/search?*'
    ],

    // content_security_policy: {
    //   extension_pages: "script-src 'self'; script-src-elem https://firebasestorage.googleapis.com; object-src 'self'"
    // },
    content_scripts: [
      {
        matches: ['https://www.bing.com/*', 'https://www.google.com/search?*', 'https://www.google.com.hk/search?*'],
        js: ['zepto.min.js', 'content_script.js'],
        run_at: 'document_end'
      }
    ],
    icons: {
      16: 'images/bing_16x16.png',
      32: 'images/bing_32x32.png',
      48: 'images/bing_48x48.png',
      128: 'images/bing_128x128.png'
    }
  }
  fs.outputJSONSync(path.join(__dirname, '../dist/manifest.json'), manifest)
  fs.outputJSONSync(path.join(__dirname, '../dist/_locales/en/messages.json'), {
    appName: {
      message: pkg.extensionName,
      description: pkg.description
    },
    appDesc: {
      message: pkg.description,
      description: pkg.description
    }
  })
  fs.outputJSONSync(path.join(__dirname, '../dist/_locales/zh_CN/messages.json'), {
    appName: {
      message: pkg.extensionName,
      description: pkg.description
    },
    appDesc: {
      message: pkg.extensionName,
      description: pkg.description
    }
  })
  fs.outputJSONSync(path.join(__dirname, '../dist/_locales/zh_TW/messages.json'), {
    appName: {
      message: pkg.extensionName,
      description: pkg.description
    },
    appDesc: {
      message: pkg.extensionName,
      description: pkg.description
    }
  })
}
;(async () => {
  ;[
    ['src/background/index.ts', 'dist/background.js'],
    ['src/content_script/index.ts', 'dist/content_script.js']
    // ['src/popup/index.ts', 'dist/popup.js']
  ].forEach(async ([input, output]) => {
    await buildFile(input, output)
  })

  buildManifest()
})()

export {}
