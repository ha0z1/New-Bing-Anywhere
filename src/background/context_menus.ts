// import { repository } from '../../package.json'
import { genIssueUrl, isChinese, openPage } from './utils'
// const repositoryUrl: string = repository.url

type Contexts = chrome.contextMenus.ContextType[]
interface IInitContextMenu {
  title: string
  contexts: Contexts
  onclick: (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => void
}

const contextMenus: Record<string, IInitContextMenu> = {
  // version: {
  //   title: `🧃 Version: ${version}`,
  //   contexts: ['action'],
  //   onclick: () => {
  //     openPage(`${repositoryUrl}/releases/tag/${version}`)
  //   }
  // },
  openChat: {
    title: '💬 New Bing',
    contexts: ['action'],
    onclick: (_info) => {
      openPage('https://www.bing.com/search?q=Bing+AI&showconv=1')
    }
  },

  openImageCreate: {
    title: '🖼️ New Bing Image Creator',
    contexts: ['action'],
    onclick: (_info) => {
      openPage('https://www.bing.com/create')
    }
  },

  likeIt: {
    title: '❤️ Like it',
    contexts: ['action'],
    onclick: () => {
      openPage('https://chrome.google.com/webstore/detail/new-bing-anywhere/hceobhjokpdbogjkplmfjeomkeckkngi/reviews')
    }
  },

  reportIssues: {
    title: isChinese ? '🐛 反馈建议' : '🐛 Report issues',
    contexts: ['action'],
    onclick: async (_info) => {
      const url = await genIssueUrl()

      openPage(url)
    }
  }
}

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
