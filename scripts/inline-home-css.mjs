import { readFile, writeFile } from 'node:fs/promises'

/**
 * Astro integration: inline the render-blocking stylesheets into the marketing home pages only.
 *
 * The landing page's first paint is gated by its CSS, and Astro serves it as external
 * `<link rel="stylesheet">` chunks (they are past the ~4 KB `inlineStylesheets: 'auto'` floor).
 * Inlining them into `<style>` means the home page's first paint needs the HTML document and
 * nothing else — no second round-trip to discover and fetch the CSS. It matches how the rest of
 * this site already works: every byte of client JS is inline too.
 *
 * Deliberately scoped to the home pages. /account and /device keep their external stylesheet so
 * the shared global chunk stays a single cacheable file across those utility pages; and their
 * first paint is not a metric anyone optimises for. Add a locale's home here when you add the
 * locale — this mirrors the per-route Cache-Control rules in public/_headers.
 */
const HOME_PAGES = ['index.html', 'zh-Hant/index.html']

// Match a whole <link> tag; we then keep only the ones that are local CSS stylesheets.
const LINK = /<link\b[^>]*>/gi

const inlineFile = async (fileUrl, dir) => {
  let html
  try {
    html = await readFile(fileUrl, 'utf8')
  } catch {
    return 0 // page not built for this locale — nothing to do
  }

  const parts = []
  let last = 0
  let inlined = 0

  for (const match of html.matchAll(LINK)) {
    const tag = match[0]
    if (!/\brel=["']stylesheet["']/i.test(tag)) continue
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1]
    // Only our own build output; leave any external stylesheet as a link.
    if (!href || !/^\/_astro\/[^"']+\.css$/.test(href)) continue

    let css
    try {
      css = await readFile(new URL(href.replace(/^\//, ''), dir), 'utf8')
    } catch {
      continue // referenced file missing — safer to leave the link than to drop the styles
    }

    // Replace the <link> in place so the cascade order of the chunks is preserved.
    parts.push(html.slice(last, match.index), '<style>', css, '</style>')
    last = match.index + tag.length
    inlined++
  }

  if (!inlined) return 0
  parts.push(html.slice(last))
  await writeFile(fileUrl, parts.join(''))
  return inlined
}

/** @returns {import('astro').AstroIntegration} */
export default function inlineHomeCss() {
  return {
    name: 'inline-home-css',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let total = 0
        for (const rel of HOME_PAGES) total += await inlineFile(new URL(rel, dir), dir)
        logger.info(`inlined ${total} stylesheet(s) into ${HOME_PAGES.length} home page(s)`)
      },
    },
  }
}
