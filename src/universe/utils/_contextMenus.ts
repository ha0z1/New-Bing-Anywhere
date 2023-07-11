import { genIssueUrl, isChinese, openPage } from './_misc'

// const repositoryUrl: string = repository.url

type Contexts = chrome.contextMenus.ContextType[]
interface IInitContextMenu {
  title: string
  contexts: Contexts
  onclick: (info?: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab | undefined) => void
}

export const contextMenus: Record<string, IInitContextMenu> = {
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
      openPage('https://chrome.google.com/webstore/detail/new-bing-anywhere-bing-ch/hceobhjokpdbogjkplmfjeomkeckkngi/reviews?hl=en')
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
