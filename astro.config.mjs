// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'
import minifyInlineScripts from './scripts/minify-inline.mjs'
import inlineHomeCss from './scripts/inline-home-css.mjs'
import prefetchPageAssets from './scripts/prefetch-page-assets.mjs'

const SITE = 'https://tmux.online'

// English is the default locale and gets no prefix (`/`). Every other locale is served
// under its own prefix (`/zh-Hant/…`, `/ja/…`, `/ko/…`) — see src/i18n/index.ts.
export default defineConfig({
  site: SITE,
  // Matches `html_handling: "drop-trailing-slash"` in wrangler.jsonc, so the sitemap names
  // the same URLs the site actually answers with a 200.
  trailingSlash: 'never',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hant', 'ja', 'ko'],
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },
  integrations: [
    // Islands only. Every page is prerendered to HTML at build time; React hydrates the two
    // stateful dashboard surfaces and nothing else, so the marketing pages still
    // ship no framework at all.
    react(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', 'zh-Hant': 'zh-Hant', ja: 'ja', ko: 'ko' } },
      // The .txt endpoints are for crawlers to fetch, not for search engines to list.
      // Dashboard and compatibility routes are per-user utilities rather than content. They carry
      // `noindex` in their <head> and in public/_headers, this just keeps them out of the
      // sitemap in the first place.
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '')
        return !path.includes('/404') && !path.endsWith('.txt') && !/\/(account|device)$/.test(path) && !/\/dashboard(?:\/|$)/.test(path)
      },
      changefreq: 'weekly',
      priority: 1,
      lastmod: new Date(),
    }),
    // Fold the landing page's stylesheets into the HTML so its first paint needs no second
    // round-trip. Home pages only — see the integration for why the utility pages stay external.
    inlineHomeCss(),
    // Once the landing page is idle, warm the localized devices document and its static CSS/JS.
    prefetchPageAssets(),
    // Last: minify the inline scripts the bundler leaves verbatim. Runs on the finished HTML.
    minifyInlineScripts(),
  ],
  build: {
    inlineStylesheets: 'auto',
    // `preserve` mirrors src/pages into dist, so `zh-Hant/404.astro` lands at
    // `dist/zh-Hant/404.html`. The default `directory` format would emit
    // `zh-Hant/404/index.html`, which Cloudflare's `not_found_handling: "404-page"` does
    // not look for — the localized 404 would silently fall back to the English one.
    format: 'preserve',
  },
  devToolbar: { enabled: false },
})
