import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import sortPackageJson from 'sort-package-json'

export const __dirname = fileURLToPath(new URL('.', import.meta.url))
export const root = path.join(__dirname, '..')
export const src = path.join(root, 'src')
export const dist = path.join(root, 'dist')
export const i18Dir = path.join(root, 'global/i18n')

export const chromiumDir = path.join(dist, 'chromium')
export const chromiumCanaryDir = path.join(dist, 'chromium-canary')
export const edgeDir = path.join(dist, 'edge')
export const firefoxDir = path.join(dist, 'firefox')

export const md5 = (data: crypto.BinaryLike) => {
  const hash = crypto.createHash('md5')
  hash.update(data)
  const md5 = hash.digest('hex')
  return md5
}

export const sortManifestJSON = (json: object) => {
  return sortPackageJson(json, {
    sortOrder: ['manifest_version', 'version']
  })
}
