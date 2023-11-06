import { callBackground, unique } from '@ha0z1/extension-utils'
import { Types, methods, type IApis } from '@ha0z1/llama-apis'
import { type CorePageData } from 'global/types'
import unifiedLink from 'global/unifiedLink'
import $ from 'jquery'

export const genLLamaApis = <T = IApis>(apisType?: Types): T | null => {
  const type = Types[apisType!]
  if (!type) return null

  const ret = methods.reduce(
    (pre, method) => ({
      ...pre,
      [method]: (...args: any) => callBackground(`LLaMA.${type}.${method}`, [...args])
    }),
    {
      type
    } as T
  )

  return ret
}

export const getDataFromBingNaturalSearch = async (prompt: string): Promise<Pick<CorePageData, 'links' | 'suggestions'>> => {
  const text = await callBackground('Bing.naturalSearch', [prompt])
  const $dom = $(text)

  let linksList: CorePageData['links']['list'] = Array.from(
    $dom.find('#b_results > li.b_algo').map((_i, el) => {
      const $el = $(el)
      const $h2 = $el.find('h2 a')

      let link: string = $el.find('.b_attribution cite').text().trim()
      link.endsWith('…') && (link = $h2.attr('href')?.trim() ?? '')
      link = unifiedLink(link)

      const title = $h2.text().trim()

      const $slug = $el.find('.b_algoSlug')
      $slug.find('.algoSlug_icon').remove()
      let descriptions = $slug.text().trim().split('·')
      const description = descriptions[descriptions.length - 1].trim()

      return { link, title, description }
    })
  ).filter(({ link, title }) => link && title)

  linksList = unique(linksList, 'link')
  linksList = unique(linksList, 'title')
  linksList = linksList

  let suggestionsList: CorePageData['suggestions']['list'] = Array.from(
    $dom.find('#b_context > .b_ans .richrsrailsugwrapper .richrsrailsuggestion').map((_i, el) => {
      return { title: $(el).text().trim() }
    })
  ).filter(({ title }) => title)

  suggestionsList = unique(suggestionsList, 'title')
  suggestionsList = suggestionsList

  const ret = {
    links: { list: linksList },
    suggestions: { list: suggestionsList }
  }

  return ret
}
