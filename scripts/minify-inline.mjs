import { readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { minify } from 'terser'

/**
 * Astro integration: minify every inline `<script>` in the built HTML.
 *
 * `<script is:inline>` (which `define:vars` forces) is copied into the page verbatim —
 * Astro's bundler never sees it, so it ships with its comments and whitespace intact. All of
 * this site's client JS is inline by necessity (it reads build-time values via `define:vars`
 * and must run without a module graph), so without this step the source comments are served
 * to every visitor. This runs after the build and rewrites those blocks in place.
 *
 * Skips anything that is not executable JS: external scripts (`src`), JSON-LD, import maps.
 */

// Capture the opening tag's attributes and the raw body separately so the attributes survive.
const SCRIPT = /<script(\b[^>]*)>([\s\S]*?)<\/script>/gi

const isInlineJs = (attrs) => {
  if (/\bsrc\s*=/.test(attrs)) return false
  const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase()
  // No type, or an explicit JS type, is executable. Everything else (ld+json, importmap,
  // speculationrules, …) is data and must be left byte-for-byte.
  return !type || type === 'module' || type === 'text/javascript' || type === 'application/javascript'
}

const walk = async (dir) => {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir)
    if (entry.isDirectory()) out.push(...(await walk(path)))
    else if (entry.name.endsWith('.html')) out.push(path)
  }
  return out
}

const minifyFile = async (fileUrl) => {
  const html = await readFile(fileUrl, 'utf8')
  let changed = false
  const parts = []
  let last = 0

  for (const match of html.matchAll(SCRIPT)) {
    const [full, attrs, body] = match
    if (!isInlineJs(attrs) || !body.trim()) continue

    let code
    try {
      const result = await minify(body, {
        // The `define:vars` prelude declares consts in the same scope as the IIFE; keep
        // top-level names and do not treat the block as a module.
        module: false,
        compress: { passes: 2 },
        format: { comments: false },
      })
      code = result.code
    } catch {
      // Minification failed (unexpected syntax) — leave this block untouched.
      continue
    }
    if (code == null || code === body) continue

    parts.push(html.slice(last, match.index), `<script${attrs}>`, code, '</script>')
    last = match.index + full.length
    changed = true
  }

  if (!changed) return 0
  parts.push(html.slice(last))
  const next = parts.join('')
  await writeFile(fileUrl, next)
  return html.length - next.length
}

/** @returns {import('astro').AstroIntegration} */
export default function minifyInlineScripts() {
  return {
    name: 'minify-inline-scripts',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const files = await walk(dir)
        let saved = 0
        for (const file of files) saved += await minifyFile(file)
        logger.info(`minified inline scripts in ${files.length} files, −${(saved / 1024).toFixed(1)} KiB`)
      },
    },
  }
}
