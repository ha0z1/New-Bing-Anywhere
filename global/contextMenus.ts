import { openPage } from '@ha0z1/extension-utils'

// const repositoryUrl: string = repository.url
import genGithubIssueUrl from './genGithubIssueUrl'

type Contexts = chrome.contextMenus.ContextType[]
interface IInitContextMenu {
  title: string
  contexts: Contexts
  onclick: (info?: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab | undefined) => void
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
      openPage('https://chrome.google.com/webstore/detail/new-bing-anywhere-bing-ch/hceobhjokpdbogjkplmfjeomkeckkngi/reviews?hl=en')
    }
  },

  reportIssues: {
    title: '🐛 Report issues',
    contexts: ['action'],
    onclick: async (_info) => {
      const url = await genGithubIssueUrl()

      openPage(url)
    }
  }
}

export default contextMenus