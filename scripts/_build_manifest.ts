import fs from 'fs-extra'
import { globSync } from 'glob'
import { GOOGLE_DOMAINS, YANDEX_DOMAINS } from 'global/constants'
import path from 'path'
import pkg from '../package.json'
import { chromiumDir, i18Dir, sortManifestJSON } from './_config'
const KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxbxQeSdmZpNR6r8FWS5Xviv8NIKPEB1+UpOLsRJHnroPCOSvgZG9u5hbI2ZN0I7DRBXLO3NCxrqcYIp2d62YCzOO4nfKSwnGlAPMFSYw7jyHq0ITjfGIWkql2GsiwRr6MAEM2ktGthDV3iBuL2lRIYfcIOdIUOccxT+2FpDSsncQUHKxjFEisMExX/AAMSNy79PqDUu/5lbEo8zWNlWza5mD69QRU3fK5WGjqrS5naGJ46kPSbE5WU3NPOtHjldPgRVMTbrg6X2GGDGKPp3ISoqj/joNKBNqsMMKn5SURjvqzvzAyVup1/j9XFQ5bGnZYnJTIZ5mvR0wWXnlgf7+RQIDAQAB'

export default async ({ mode }: { mode: 'development' | 'production' }) => {
  const JSONConfig = mode === 'development' ? { spaces: 2 } : undefined
  const manifest = {
    key: KEY,
    manifest_version: 3,
    name: '__MSG_appName__',
    description: '__MSG_appDesc__',
    version: `${pkg.version}`,
    homepage_url: pkg.homepage,
    default_locale: 'en',
    background: {
      service_worker: 'background.js'
    },

    host_permissions: [
      // 'notifications',
      // '<all_urls>',
      '*://*.google.com/*',
      '*://*.bing.com/*',
      'wss://*.bing.com/*',
      'https://www.baidu.com/*'
      // 'https://www.so.com/*',
      // 'https://*.sogou.com/*',
      // 'https://so.toutiao.com/*',
      // 'https://duckduckgo.com/*',
      // 'https://www.ecosia.org/*',
      // 'https://*.yandex.com.tr/*',
      // 'https://*.mail.ru/*',
      // 'https://www.ask.com/*',
      // 'https://www.startpage.com/*',
      // 'https://search.aol.com/*',
      // 'https://search.seznam.cz/*',
      // 'https://search.brave.com/*',
      // 'https://search.naver.com/*',
      // 'https://*.search.yahoo.com/*',
      // 'https://search.yahoo.co.jp/*',
      // 'https://*.openai.com/*',
      // 'https://*.aiplus.lol/*',
      // ...GOOGLE_DOMAINS.map((google) => `https://www.${google}/search?*`),
      // ...YANDEX_DOMAINS.map((yandex) => `https://*.${yandex}/*`)
    ],
    optional_host_permissions: ['https://*/*', 'wss://*/*'],
    content_scripts: [
      {
        matches: [
          // '<all_urls>'
          '*://www.google.com/*',
          '*://www.bing.com/*',
          '*://www.baidu.com/*'
          // 'https://www.so.com/*',
          // 'https://*.sogou.com/*',
          // 'https://duckduckgo.com/*',
          // 'https://www.ecosia.org/*',
          // 'https://*.mail.ru/*',
          // 'https://search.brave.com/*',
          // 'https://search.naver.com/*',
          // 'https://*.search.yahoo.com/*',
          // 'https://search.yahoo.co.jp/*',
          // 'https://*.aiplus.lol/*',
          // ...GOOGLE_DOMAINS.map((google) => `https://www.${google}/search?*`),
          // ...YANDEX_DOMAINS.map((yandex) => `https://*.${yandex}/search/*`)
        ],
        all_frames: true,
        js: ['content_script.js'],
        run_at: 'document_start'
      }
      // {
      //   all_frames: true,
      //   js: ['src/chat/BingChat/bing-socket.js'],
      //   matches: ['###new-bing-anywhere-offscreen'],
      //   run_at: 'document_start'
      // }
    ],
    web_accessible_resources: [
      {
        resources: ['inject.js', 'app/*', 'images/*'],
        matches: [
          '*://www.bing.com/*',
          '*://www.baidu.com/*',
          '*://www.so.com/*',
          '*://*.sogou.com/*',
          '*://duckduckgo.com/*',
          '*://www.ecosia.org/*',
          '*://*.mail.ru/*',
          '*://search.brave.com/*',
          '*://search.naver.com/*',
          '*://*.search.yahoo.com/*',
          '*://search.yahoo.co.jp/*',
          '*://*.aiplus.lol/*',
          ...GOOGLE_DOMAINS.map((google) => `https://www.${google}/*`),
          ...YANDEX_DOMAINS.map((yandex) => `https://*.${yandex}/*`)
        ],
        use_dynamic_url: true
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
      'offscreen',
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

    // content_security_policy: {
    //   extension_pages: "script-src 'self'; object-src 'self';",
    //   sandbox:
    //     "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' 'unsafe-inline' 'unsafe-eval'; child-src 'self';"
    // },

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

  globSync(`${i18Dir}/**/messages.json`).forEach((src) => {
    const relativePath = path.relative(i18Dir, src)
    fs.outputJSONSync(`${chromiumDir}/_locales/${relativePath}`, fs.readJSONSync(src), JSONConfig)
  })

  fs.outputJSONSync(`${chromiumDir}/manifest.json`, sortManifestJSON(manifest), JSONConfig)
}
