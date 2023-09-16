import { spawnSync } from 'child_process'
import path from 'path'
import { root } from './_config'

const appDir = path.join(root, 'src/app')
export default ({ mode }: { mode: 'development' | 'production' }) => {
  console.log(99999999, appDir)
  const script = mode === 'development' ? 'dev' : 'build'
  process.chdir(appDir)
  spawnSync('bun', ['run', script], { stdio: 'inherit' })
}
