import { genIssueUrl, openPage } from './_misc'

// const repositoryUrl: string = repository.url

type Contexts = chrome.contextMenus.ContextType[]
interface IInitContextMenu {
  emoji: string
  icon?: string
  title: string
  contexts: Contexts
  onclick: (info?: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab | undefined) => void
}

export const contextMenus: Record<string, IInitContextMenu> = /* @__PURE__ */ {
  // version: {
  //   title: `🧃 Version: ${version}`,
  //   contexts: ['action'],
  //   onclick: () => {
  //     openPage(`${repositoryUrl}/releases/tag/${version}`)
  //   }
  // },

  openCopilot: {
    emoji: '🚗',
    icon: /* @__PURE__ */ chrome.runtime.getURL('images/copilot.png'),
    title: 'Copilot',
    contexts: ['action'],
    onclick: (_info) => {
      openPage('https://copilot.microsoft.com/')
    }
  },

  openChat: {
    emoji: '💬',
    icon: /* @__PURE__ */ chrome.runtime.getURL('images/bing-chat.png'),
    title: 'New Bing',
    contexts: ['action'],
    onclick: (_info) => {
      openPage('https://www.bing.com/search?q=Bing+AI&showconv=1')
    }
  },

  openImageCreate: {
    emoji: '🖼️',
    icon: /* @__PURE__ */ chrome.runtime.getURL('images/designer.svg'),
    title: 'New Bing Image Creator',
    contexts: ['action'],
    onclick: (_info) => {
      openPage('https://www.bing.com/create')
    }
  },

  likeIt: {
    emoji: '❤️',
    icon: /* @__PURE__ */ chrome.runtime.getURL('images/like.png'),
    title: 'Like it',
    contexts: ['action'],
    onclick: () => {
      openPage('https://chrome.google.com/webstore/detail/new-bing-anywhere-bing-ch/hceobhjokpdbogjkplmfjeomkeckkngi/reviews?hl=en')
    }
  },

  reportIssues: {
    emoji: '🐛',
    icon: /* @__PURE__ */ chrome.runtime.getURL('images/bugs.png'),
    title: 'Report issues',
    contexts: ['action'],
    onclick: async (_info) => {
      const url = await genIssueUrl()

      openPage(url)
    }
  }
}
