import fs from 'fs-extra'
import path from 'path'
import { chromiumDir, root } from './_config'

export default async () => {
  fs.copySync(path.join(root, 'public'), chromiumDir)
}
