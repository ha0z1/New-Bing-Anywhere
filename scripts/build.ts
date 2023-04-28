import { execSync } from 'child_process'
import esbuild, { BuildOptions } from 'esbuild'
import svgrPlugin from 'esbuild-plugin-svgr'
import stylePlugin from 'esbuild-style-plugin'
import fs from 'fs-extra'
// import md5File from 'md5-file'
import path from 'path'
import sortPackageJson from 'sort-package-json'
import pkg from '../package.json'
import staticRules from './static_rules'

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')
const chromiumDir = path.join(dist, 'chromium')
const chromiumCanaryDir = path.join(dist, 'chromium-canary')
const firefoxDir = path.join(dist, 'firefox')

const isDev = process.argv[2] === 'dev'
const external = [
  ...new Set(['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'].map((o) => Object.keys(pkg[o] ?? {})).flat())
]

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
      ...extraBuildOptions
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
        resources: ['images/*', 'css/*', 'js/*'],
        matches: ['https://www.bing.com/*', 'https://www.google.com/*', 'https://www.google.com.hk/*']
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
        run_at: 'document_start'
      }
    ],
    icons: {
      16: 'images/bing_16x16.png',
      32: 'images/bing_32x32.png',
      48: 'images/bing_48x48.png',
      128: 'images/bing_128x128.png'
    }
  }
  fs.outputJSONSync(path.join(chromiumDir, 'manifest.json'), sortManifestJSON(manifest))

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
      homepage_url: 'https://github.com/haozi/New-Bing-Anywhere/tree/canary'
    })
  )
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
      host_permissions: ['<all_urls>'],
      permissions: chromeManifest.permissions.filter((item) => !['declarativeNetRequest'].includes(item)).concat('webRequestBlocking'),
      declarative_net_request: undefined,
      // web_accessible_resources: undefined,
      // host_permissions: undefined,
      content_scripts: undefined,
      options_ui: undefined,
      browser_specific_settings: {
        gecko: {
          id: '{babadada-ce9e-4bc4-a7de-b4f9c2b8918c}'
          // id: 'syntaxright@gmail.com'
        }
      }
    })
  )

  fs.removeSync(path.join(firefoxDir, 'app'))
  fs.removeSync(path.join(firefoxDir, 'content_script.js'))
  fs.removeSync(path.join(firefoxDir, 'zepto.min.js'))
  fs.removeSync(path.join(firefoxDir, 'rules.json'))
}

const zipPkg = async () => {
  type ZipFolder = (target: 'chromium' | 'chromium-canary' | 'firefox' | 'source') => void
  const zipFolder: ZipFolder = (target) => {
    process.chdir(path.join(dist, target))

    const zipPath = `${dist}/${target}.zip`
    execSync(`zip -r -9 ${zipPath} . -x "*.DS_Store"`, { stdio: 'inherit' })
    // const hash = md5File.sync(zipPath)
    // fs.outputFileSync(`${zipPath}.md5`, `version: ${pkg.version}\nmd5: ${hash}\n`)
  }
  zipFolder('chromium')
  zipFolder('chromium-canary')
  zipFolder('firefox')
  zipFolder('source')
}

;(async () => {
  fs.emptyDirSync(path.join(root, 'dist'))
  const files: any = [
    ['src/background/chromium.ts', path.join(chromiumDir, 'background.js')],
    ['src/content_script/index.ts', path.join(chromiumDir, 'content_script.js')],

    [
      'src/background/chromium.ts',
      path.join(chromiumCanaryDir, 'background.js'),
      {
        banner: {
          js: ['globalThis.__NBA_isCanary=1'].join(';') + ';'
        }
      }
    ],

    ['src/background/firefox.ts', path.join(firefoxDir, 'background.js')]
    // ['src/content_script/index.ts', path.join(firefoxDir, 'content_script.js')]
    // ['src/popup/index.ts', 'dist/popup.js']
  ]

  await buildChromiumBase()

  for (let [input, output, extraBuildOptions] of files) {
    await buildFile(input, output, extraBuildOptions)
  }

  if (!isDev) {
    execSync(`pnpm --filter app run build`, { stdio: 'inherit' })
  }

  await Promise.all([buildChromiumCanary(), buildFireFox()])

  for (let [input, output, extraBuildOptions] of files) {
    await buildFile(input, output, extraBuildOptions)
  }

  execSync(`pnpm copy:soruce`, { stdio: 'inherit' })

  await zipPkg()
})()
