import { en } from './en'
import { zhHant } from './zh-Hant'

/**
 * English is the default locale and is served without a prefix (`/`). Everything else lives
 * under `/<lang>/…` — matching the app's own locale codes (`zh-Hant`, not `zh-TW`).
 *
 * Adding a locale is three steps:
 *   1. write `src/i18n/<lang>.ts` exporting an object of type `Copy`
 *   2. add it to `copy` below
 *   3. create `src/pages/<lang>/index.astro` rendering `<Home lang="<lang>" />`
 * The language switcher, `<link rel="alternate">` tags and sitemap pick it up from `copy`.
 */
export const languages = {
  en: 'English',
  'zh-Hant': '繁體中文',
} as const

export type Lang = keyof typeof languages
export type Copy = typeof en

export const defaultLang: Lang = 'en'

/** Open Graph wants a territory, which BCP 47 script subtags do not carry. */
export const ogLocales: Record<Lang, string> = {
  en: 'en_US',
  'zh-Hant': 'zh_TW',
}

// Only locales present here are actually shipped; the rest are declared intent.
export const copy: Partial<Record<Lang, Copy>> = { en, 'zh-Hant': zhHant }

export const shippedLangs = Object.keys(copy) as Lang[]

export const useCopy = (lang: Lang): Copy => copy[lang] ?? en

export const getLangFromUrl = (url: URL): Lang => {
  const [, first] = url.pathname.split('/')
  return first in languages ? (first as Lang) : defaultLang
}

/**
 * `/features` → `/zh-Hant/features`; the default locale keeps the bare path.
 *
 * No trailing slash on a locale root (`/zh-Hant`). Cloudflare is configured with
 * `html_handling: "drop-trailing-slash"`, so that is the form that answers 200 — canonical,
 * hreflang and the sitemap must all name it, or every one of them points at a redirect.
 */
export const localizePath = (path: string, lang: Lang): string => {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (lang === defaultLang) return clean
  return `/${lang}${clean === '/' ? '' : clean}`
}
