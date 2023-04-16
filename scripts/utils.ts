import sortPackageJson from 'sort-package-json'

export const sortManifestJSON = (json: object) => {
  return sortPackageJson(json, {
    sortOrder: ['version']
  })
}
