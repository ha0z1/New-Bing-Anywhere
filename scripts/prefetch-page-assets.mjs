import { readFile, writeFile } from 'node:fs/promises'

const HOME_PAGES = [
  { file: 'index.html', dashboard: '/dashboard/devices' },
  { file: 'zh-Hant/index.html', dashboard: '/zh-Hant/dashboard/devices' },
  { file: 'ja/index.html', dashboard: '/ja/dashboard/devices' },
  { file: 'ko/index.html', dashboard: '/ko/dashboard/devices' },
]

const DASHBOARD_LOCALES = [
  { dir: '', home: '/' },
  { dir: 'zh-Hant/', home: '/zh-Hant' },
  { dir: 'ja/', home: '/ja' },
  { dir: 'ko/', home: '/ko' },
]
const DASHBOARD_PAGES = ['index', 'devices', 'api-keys', 'membership', 'device']

// Astro records island entry points in component-url/renderer-url attributes rather than
// regular script tags, so collect every fingerprinted CSS/JS URL present in utility HTML.
const BUILD_ASSET = /\/_astro\/[^"'<>\s]+?\.(?:css|js)(?:\?[^"'<>\s]*)?/g
const JS_IMPORT = /(?:from\s*|import\s*)[(']?\s*["']\.\/([^"']+\.js)["']/g

const collectPageAssets = async (dir) => {
  const pages = ['dashboard/devices.html', 'zh-Hant/dashboard/devices.html', 'ja/dashboard/devices.html', 'ko/dashboard/devices.html']
  const assets = new Set()

  for (const page of pages) {
    const html = await readFile(new URL(page, dir), 'utf8')
    for (const match of html.matchAll(BUILD_ASSET)) assets.add(match[0])
  }

  // Prefetch dependencies imported by an island entry point as well as the entry itself.
  const pending = [...assets].filter((asset) => asset.endsWith('.js'))
  for (let i = 0; i < pending.length; i++) {
    const asset = pending[i]
    const source = await readFile(new URL(asset.replace(/^\//, ''), dir), 'utf8')
    for (const match of source.matchAll(JS_IMPORT)) {
      const dependency = `/_astro/${match[1]}`
      if (assets.has(dependency)) continue
      assets.add(dependency)
      pending.push(dependency)
    }
  }

  return [...assets].sort()
}

const injectPrefetch = async (fileUrl, resources) => {
  const html = await readFile(fileUrl, 'utf8')
  const bodyEnd = html.lastIndexOf('</body>')
  if (bodyEnd === -1) return false

  const script = `<script>(() => {
    const resources = ${JSON.stringify(resources)};
    const prefetch = () => {
      if (navigator.connection?.saveData) return;
      for (const href of resources) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        link.fetchPriority = 'low';
        if (href.endsWith('.css')) link.as = 'style';
        else if (href.endsWith('.js')) link.as = 'script';
        else link.as = 'document';
        document.head.append(link);
      }
    };
    if ('requestIdleCallback' in window) requestIdleCallback(prefetch, { timeout: 3000 });
    else setTimeout(prefetch, 1500);
  })();</script>`

  await writeFile(fileUrl, `${html.slice(0, bodyEnd)}${script}${html.slice(bodyEnd)}`)
  return true
}

/** @returns {import('astro').AstroIntegration} */
export default function prefetchPageAssets() {
  return {
    name: 'prefetch-page-assets',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const assets = await collectPageAssets(dir)
        let homePages = 0
        for (const page of HOME_PAGES) {
          if (await injectPrefetch(new URL(page.file, dir), [page.dashboard, ...assets])) homePages++
        }

        let dashboardPages = 0
        for (const locale of DASHBOARD_LOCALES) {
          for (const page of DASHBOARD_PAGES) {
            const file = `${locale.dir}dashboard/${page}.html`
            if (await injectPrefetch(new URL(file, dir), [locale.home])) dashboardPages++
          }
        }
        logger.info(
          `injected ${assets.length + 1} idle prefetches into ${homePages} home page(s) and a home prefetch into ${dashboardPages} dashboard page(s)`,
        )
      },
    },
  }
}
