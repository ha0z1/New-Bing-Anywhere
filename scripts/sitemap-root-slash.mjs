import { readdir, readFile, writeFile } from 'node:fs/promises'

/**
 * Astro integration: give the sitemap's root `<loc>` its slash back.
 *
 * `trailingSlash: 'never'` is right for every path this site serves — Cloudflare is configured
 * with `html_handling: "drop-trailing-slash"`, so `/docs/install` is the form that answers 200.
 * The root is the one URL with nothing to strip: a request carries `/` or it is not a request,
 * and the page itself says so in three places (`<link rel="canonical">`, `og:url`, and its own
 * `hreflang="en"`).
 *
 * @astrojs/sitemap applies the rule as a blanket string replace over the finished XML stream
 * (`<loc>${host}/</loc>` → `<loc>${host}</loc>`, see write-sitemap-chunk.js). That replace does
 * not touch the `<xhtml:link>` alternates, which the writer normalises through the URL parser and
 * which therefore keep the slash. The result contradicts itself inside a single element:
 *
 *   <url>
 *     <loc>https://tmux.online</loc>                                        ← rewritten
 *     <xhtml:link rel="alternate" hreflang="en" href="https://tmux.online/"/>  ← untouched
 *
 * A self-referencing hreflang that does not match its own `<loc>` is exactly what Search Console
 * reports as a missing self-reference. The integration's `serialize` hook cannot fix it: the
 * replace runs downstream of it, on the serialized text. So this undoes that one substitution,
 * for the root entry only — every other `<loc>` keeps the slashless form the server answers with.
 */
const restore = (xml, origin) => xml.replaceAll(`<loc>${origin}</loc>`, `<loc>${origin}/</loc>`)

/**
 * @param {string} site the configured `site`, so this cannot drift from astro.config
 * @returns {import('astro').AstroIntegration}
 */
export default function sitemapRootSlash(site) {
  return {
    name: 'sitemap-root-slash',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        // the origin with no path at all — the exact string the library's replace leaves behind
        const origin = new URL(site).origin
        let fixed = 0
        for (const name of await readdir(dir)) {
          if (!name.startsWith('sitemap') || !name.endsWith('.xml')) continue
          const file = new URL(name, dir)
          const xml = await readFile(file, 'utf8')
          const next = restore(xml, origin)
          if (next === xml) continue
          await writeFile(file, next)
          fixed++
        }
        logger.info(fixed ? `root <loc> restored to ${origin}/ in ${fixed} file(s)` : 'no bare-origin <loc> found')
      },
    },
  }
}
