function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
const randomId = () => (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)).replace(/\d/g, '')

const tagName = '1'
  .repeat(getRandomInt(2, 20))
  .split('')
  .map((item) => randomId())
  .join('-')

export const $shadowRootWrap = document.createElement(tagName)
export const $shadowAppRoot = document.createElement('new-bing-anywhere-root')
export const shadowRoot = $shadowRootWrap.attachShadow({ mode: 'closed' })

// shadowRootWrap.style.all = 'unset'
