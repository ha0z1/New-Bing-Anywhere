import { type Bing } from '@@/types'
import { escapeHtml } from '@@/utils'

type Data = NonNullable<NonNullable<NonNullable<Bing.CoreData['messages']>[0]['groundingInfo']>['web_search_results']>[0]

export const formatText = (text: string, data: Bing.CoreData) => {
  const webSearchResults =
    data.messages?.find((message) => message.messageType === 'InternalSearchResult')?.groundingInfo?.web_search_results ?? []
  const mapping = webSearchResults.reduce((pre, o) => ({ ...pre, [o.index]: o }), {})

  text = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    .replace(/\[\^(\d+)\^\]/g, ($0: string, $1: string) => {
      const data: Data = mapping[$1]
      if (!data) return ''

      const { index, url, title } = data
      return `<sup><a href="${escapeHtml(url)}" target="_blank" title="${escapeHtml(
        title
      )}" rel="noopener noreferrer nofollow">[${escapeHtml(index)}]</a></sup>`
    })

  return text
}
