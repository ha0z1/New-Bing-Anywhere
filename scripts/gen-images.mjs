// Rasterises the SVG sources in src/assets into the PNGs that public/ ships.
//
// Deliberately NOT part of `build`: the output is committed, so the social card does not
// change shape depending on which fonts the build machine happens to have installed.
// Run it by hand (`pnpm run images`) after editing an SVG, and eyeball the result.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = new URL('../', import.meta.url)
const read = (p) => readFile(fileURLToPath(new URL(p, root)))
const out = (p) => fileURLToPath(new URL(p, root))

const og = await read('src/assets/og.svg')
await sharp(og, { density: 144 }).resize(1200, 630).png({ compressionLevel: 9 }).toFile(out('public/og.png'))

// Raster icons for the web manifest and for iOS, which ignores the SVG favicon.
const mark = await read('public/favicon.svg')
const icons = [
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
]
for (const [file, size] of icons) {
  await sharp(mark, { density: 2400 }).resize(size, size).png({ compressionLevel: 9 }).toFile(out(file))
}

console.log(['public/og.png', ...icons.map(([f]) => f)].join('\n'))
