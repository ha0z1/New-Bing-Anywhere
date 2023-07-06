import { contextMenus } from '@@/utils'

export default () => {
  chrome.contextMenus.removeAll(() => {
    for (const [id, menu] of Object.entries(contextMenus)) {
      chrome.contextMenus.create({
        id,
        title: menu.title,
        contexts: menu.contexts
      })
    }
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const { menuItemId } = info
    const item = contextMenus[menuItemId]
    if (item?.onclick) item.onclick(info, tab)
  })
}
