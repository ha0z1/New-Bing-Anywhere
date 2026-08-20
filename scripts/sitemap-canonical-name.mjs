import { rename } from 'node:fs/promises'

/**
 * Astro integration: publish the sitemap under its conventional name.
 *
 * @astrojs/sitemap hardcodes `${filenameBase}-index.xml` for the entry file; `filenameBase` only
 * changes the stem, so no option yields a bare `sitemap.xml`. But /sitemap.xml is the name every
 * tool blind-guesses and the one worth printing, so the entry file is renamed after the build.
 * The index's references to `sitemap-0.xml` are untouched and keep resolving; robots.txt names
 * /sitemap.xml, and the Worker 301s the old /sitemap-index.xml for anything that learned it.
 *
 * Must run after sitemapRootSlash, which rewrites every `sitemap*.xml` in place.
 */
export default function sitemapCanonicalName() {
  return {
    name: 'sitemap-canonical-name',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        try {
          await rename(new URL('sitemap-index.xml', dir), new URL('sitemap.xml', dir))
          logger.info('sitemap-index.xml renamed to sitemap.xml')
        } catch {
          logger.warn('sitemap-index.xml not found — nothing renamed')
        }
      },
    },
  }
}
