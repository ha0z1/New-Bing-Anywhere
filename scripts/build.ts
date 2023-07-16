import { execSync } from 'child_process'
import esbuild, { type BuildOptions } from 'esbuild'
import svgrPlugin from 'esbuild-plugin-svgr'
import stylePlugin from 'esbuild-style-plugin'
import fs from 'fs-extra'
// import md5File from 'md5-file'
import path from 'path'
import sortPackageJson from 'sort-package-json'
import pkg from '../package.json'
import { GOOGLE_DOMAINS } from '../src/universe/constants'
import staticRules from './static_rules'

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')
const chromiumDir = path.join(dist, 'chromium')
const chromiumCanaryDir = path.join(dist, 'chromium-canary')
const edgeDir = path.join(dist, 'edge')
const firefoxDir = path.join(dist, 'firefox')

const isDev = process.argv[2] === 'dev'
const external = [...new Set(['devDependencies', 'optionalDependencies', 'peerDependencies'].map((o) => Object.keys(pkg[o] ?? {})).flat())]

const sortManifestJSON = (json: object) => {
  return sortPackageJson(json, {
    sortOrder: ['manifest_version', 'version']
  })
}

const buildFile = async (input: string, output: string, extraBuildOptions?: BuildOptions) => {
  try {
    const buildOptions: BuildOptions = {
      entryPoints: [input],
      bundle: true,
      external,
      outfile: output,
      minify: !isDev,
      sourcemap: isDev ? 'inline' : (false as any),
      plugins: [svgrPlugin(), stylePlugin()],
      treeShaking: true,
      ...extraBuildOptions
    }
    if (!isDev) {
      await esbuild.build({ ...buildOptions, drop: ['console', 'debugger'] })
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

const buildChromiumBase = async () => {
  fs.copySync(path.join(root, 'public'), chromiumDir)
  const manifest = {
    manifest_version: 3,
    name: '__MSG_appName__',
    description: '__MSG_appDesc__',
    version: `${pkg.version}`,
    homepage_url: pkg.homepage,
    default_locale: 'en',
    background: {
      service_worker: 'background.js'
    },

    web_accessible_resources: [
      {
        resources: ['inject.js', 'app/*', 'images/*'],
        matches: [
          'https://www.bing.com/*',
          'https://www.baidu.com/*',
          'https://www.so.com/*',
          'https://duckduckgo.com/*',
          'https://www.ecosia.org/*',
          'https://*.yandex.com/*',
          'https://search.brave.com/*',
          'https://search.naver.com/*',
          ...GOOGLE_DOMAINS.map((google) => `https://www.${google}/*`)
        ]
      }
    ],
    options_ui: {
      page: 'app/index.html?options',
      open_in_tab: true
    },
    declarative_net_request: {
      rule_resources: [
        {
          enabled: true,
          id: 'new-bing-anywhere',
          path: 'rules.json'
        }
      ]
    },
    permissions: [
      'storage',
      // "unlimitedStorage",
      'cookies',
      'webRequest',
      // 'tabs',
      // 'activeTab',
      'contextMenus',
      'declarativeNetRequest'
      // 'declarativeNetRequestFeedback'
    ],

    host_permissions: [
      // 'notifications',
      // '<all_urls>',
      'http://*.bing.com/*',
      'https://*.bing.com/*',
      'https://www.baidu.com/*',
      'https://www.so.com/*',
      'https://duckduckgo.com/*',
      'https://www.ecosia.org/*',
      'https://*.yandex.com/*',
      'https://search.brave.com/*',
      'https://search.naver.com/*',
      // '*://*/*',
      'https://*.openai.com/*',
      ...GOOGLE_DOMAINS.map((google) => `https://www.${google}/search?*`)
    ],
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxbxQeSdmZpNR6r8FWS5Xviv8NIKPEB1+UpOLsRJHnroPCOSvgZG9u5hbI2ZN0I7DRBXLO3NCxrqcYIp2d62YCzOO4nfKSwnGlAPMFSYw7jyHq0ITjfGIWkql2GsiwRr6MAEM2ktGthDV3iBuL2lRIYfcIOdIUOccxT+2FpDSsncQUHKxjFEisMExX/AAMSNy79PqDUu/5lbEo8zWNlWza5mD69QRU3fK5WGjqrS5naGJ46kPSbE5WU3NPOtHjldPgRVMTbrg6X2GGDGKPp3ISoqj/joNKBNqsMMKn5SURjvqzvzAyVup1/j9XFQ5bGnZYnJTIZ5mvR0wWXnlgf7+RQIDAQAB',
    // content_security_policy: {
    //   extension_pages: "script-src 'self'; object-src 'self';",
    //   sandbox:
    //     "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' 'unsafe-inline' 'unsafe-eval'; child-src 'self';"
    // },

    content_scripts: [
      {
        matches: [
          'https://www.bing.com/*',
          'https://www.baidu.com/*',
          'https://www.so.com/*',
          'https://duckduckgo.com/*',
          'https://www.ecosia.org/*',
          'https://*.yandex.com/*',
          'https://search.brave.com/*',
          'https://search.naver.com/*',
          ...GOOGLE_DOMAINS.map((google) => `https://www.${google}/search?*`)
        ],
        js: ['content_script.js'],
        run_at: 'document_start'
      }
    ],
    icons: {
      16: 'images/bing_16x16.png',
      32: 'images/bing_32x32.png',
      48: 'images/bing_48x48.png',
      128: 'images/bing_128x128.png'
    },
    action: {
      default_popup: 'app/index.html#/popup',
      default_title: 'New Bing Anywhere'
    }
  }
  fs.outputJSONSync(path.join(chromiumDir, 'manifest.json'), sortManifestJSON(manifest), isDev ? { spaces: 2 } : undefined)

  // https://developer.chrome.com/docs/webstore/i18n/
  ;['en', 'zh_CN', 'zh_TW', 'ru'].forEach((locale) => {
    const i18n = pkg['extension-i18n'][locale]
    fs.outputJSONSync(path.join(chromiumDir, `_locales/${locale}/messages.json`), {
      appName: {
        message: i18n.extensionName,
        description: i18n.extensionName
      },
      appDesc: {
        message: i18n.extensionDescription,
        description: i18n.extensionDescription
      }
    })
  })

  fs.outputJSONSync(path.join(chromiumDir, 'rules.json'), staticRules)

  fs.removeSync(path.join(chromiumDir, 'canary'))
}

const buildChromiumCanary = async () => {
  fs.copySync(chromiumDir, chromiumCanaryDir)
  fs.copySync(path.join(root, 'public/canary'), chromiumCanaryDir)
  const chromeManifest = fs.readJSONSync(path.join(chromiumDir, 'manifest.json'))
  fs.outputJSONSync(
    path.join(chromiumCanaryDir, 'manifest.json'),
    sortManifestJSON({
      ...chromeManifest,
      name: `${pkg.extensionName} (Canary)`,
      version: `0.${pkg.version}`,
      homepage_url: 'https://github.com/haozi/New-Bing-Anywhere/tree/canary',
      key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAp2asctK5nmilg+tZyT74rpsgyfAYWl5pRKsoZDMxj97dwu5YMH1AXoE1ItbFCH8ysjWfsPbYfC0fhFcRljCroPxAJoSl73RRX2rFV8g8aSG101QTYTc2tUvw7xPLk0NS9X4bi/zZmlCHmcoxiOaslN8chs3JgOEQSJROu5PrGpahC9SzZh77iQEtOsYR1grEyuRioFi+x+end1X1tMwaJ4/yYTK4jj9PlFnOKDBFYVhGKCHaWkP2Wv4PPabl/nzUo+l/W0B7fkbaSxI8gir42YzA+OJcPQ/H2UMqtROZxqR847uXsAnB5PfPdo4tT5qUfPd16btsbIr9t6YAMMD0mQIDAQAB'
    }),
    isDev ? { spaces: 2 } : undefined
  )
}

const buildEdge = async () => {
  fs.copySync(chromiumDir, edgeDir)
  const chromeManifest = fs.readJSONSync(path.join(chromiumDir, 'manifest.json'))
  fs.outputJSONSync(
    path.join(edgeDir, 'manifest.json'),
    sortManifestJSON({
      ...chromeManifest,
      name: `${pkg.extensionName} (Edge)`,
      key: undefined
    }),
    isDev ? { spaces: 2 } : undefined
  )

  fs.outputJSONSync(
    path.join(edgeDir, 'rules.json'),
    fs
      .readJSONSync(path.join(edgeDir, 'rules.json'))
      .slice(1)
      .map((item, index: number) => {
        item.id = index + 1
        return item
      })
  )

  fs.removeSync(path.join(edgeDir, 'inject.js'))
}

const buildFireFox = async () => {
  fs.copySync(chromiumDir, firefoxDir)
  const chromeManifest = fs.readJSONSync(path.join(chromiumDir, 'manifest.json'))
  fs.outputJSONSync(
    path.join(firefoxDir, 'manifest.json'),
    sortManifestJSON({
      ...chromeManifest,
      manifest_version: 3,
      background: {
        scripts: ['background.js']
      },
      // host_permissions: ['<all_urls>'],
      permissions: chromeManifest.permissions.filter((item) => !['declarativeNetRequest'].includes(item)).concat('webRequestBlocking'),
      declarative_net_request: undefined,
      // web_accessible_resources: undefined,
      // content_scripts: undefined,
      options_ui: undefined,
      key: undefined,
      browser_specific_settings: {
        gecko: {
          id: '{babadada-ce9e-4bc4-a7de-b4f9c2b8918c}'
          // id: 'syntaxright@gmail.com'
        }
      }
    }),
    isDev ? { spaces: 2 } : undefined
  )

  fs.removeSync(path.join(firefoxDir, 'rules.json'))
}

const zipPkg = async () => {
  type ZipFolder = (target: 'chromium' | 'chromium-canary' | 'edge' | 'firefox' | 'source') => void
  const zipFolder: ZipFolder = (target) => {
    process.chdir(path.join(dist, target))

    const zipPath = `${dist}/${target}.zip`
    execSync(`zip -r -9 ${zipPath} . -x "*.DS_Store"`, { stdio: 'inherit' })
    // const hash = md5File.sync(zipPath)
    // fs.outputFileSync(`${zipPath}.md5`, `version: ${pkg.version}\nmd5: ${hash}\n`)
  }
  zipFolder('chromium')
  zipFolder('chromium-canary')
  zipFolder('edge')
  zipFolder('firefox')
  zipFolder('source')
}

;(async () => {
  fs.emptyDirSync(path.join(root, 'dist'))
  const files: any = [
    ['src/background/chromium.ts', path.join(chromiumDir, 'background.js')],
    ['src/content_script/index.ts', path.join(chromiumDir, 'content_script.js')],
    ['src/inject/index.ts', path.join(chromiumDir, 'inject.js')],

    [
      'src/background/chromium.ts',
      path.join(chromiumCanaryDir, 'background.js'),
      {
        banner: {
          js: ['globalThis.__NBA_isCanary=1'].join(';') + ';'
        }
      }
    ],

    ['src/background/firefox.ts', path.join(firefoxDir, 'background.js')],
    ['src/content_script/index.ts', path.join(firefoxDir, 'content_script.js')]
    // ['src/popup/index.ts', 'dist/popup.js']
  ]

  await buildChromiumBase()

  for (const [input, output, extraBuildOptions] of files) {
    await buildFile(input, output, extraBuildOptions)
  }

  if (!isDev) {
    execSync('pnpm --filter app run build', { stdio: 'inherit' })
  }

  await Promise.all([buildChromiumCanary(), buildEdge(), buildFireFox()])

  for (const [input, output, extraBuildOptions] of files) {
    await buildFile(input, output, extraBuildOptions)
  }

  execSync('pnpm copy:soruce', { stdio: 'inherit' })

  await zipPkg()
})()
