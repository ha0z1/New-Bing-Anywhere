import fs from 'fs-extra'
import buildEntry from './_build_entry'
import buildManifest from './_build_manifest'
import buildStatic from './_build_static'
import buildApp from './_build_app'
import { chromiumDir, dist, edgeDir, firefoxDir } from './_config'
import buildStaticRules from './static_rules'

const mode = process.argv[2] === 'dev' ? 'development' : 'production'

const buildBase = async () => {
  await buildStatic()

  if (mode === 'production') {
    await Promise.all([buildEntry({ mode }), buildManifest({ mode }), buildStaticRules(), buildApp({ mode })])
    return
  }
  await Promise.all([buildEntry({ mode }), buildManifest({ mode }), buildStaticRules(), buildApp({ mode })])
}
const buildChromium = async () => {
  fs.removeSync(`${chromiumDir}/canary`)
}

const buildFirefox = async () => {
  fs.copy(chromiumDir, firefoxDir)
}

const buildEdge = async () => {
  fs.copy(chromiumDir, edgeDir)
}
;(async () => {
  fs.emptyDirSync(dist)

  await buildBase()
  await Promise.all([buildChromium(), buildFirefox(), buildEdge()])
})()
