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

export const getDataFromBingOrgaincSearch = async (prompt: string): Promise<Pick<CorePageData, 'links' | 'suggestions'>> => {
  const text = await callBackground('Bing.orgaincSearch', [prompt])
  const $dom = $(text)

  let linkslist: CorePageData['links']['list'] = Array.from(
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

  linkslist = unique(linkslist, 'link')
  linkslist = unique(linkslist, 'title')
  linkslist = linkslist

  let suggestionslist: CorePageData['suggestions']['list'] = Array.from(
    $dom.find('#b_context > .b_ans .richrsrailsugwrapper .richrsrailsuggestion').map((_i, el) => {
      return { title: $(el).text().trim() }
    })
  ).filter(({ title }) => title)

  suggestionslist = unique(suggestionslist, 'title')
  suggestionslist = suggestionslist

  const ret = {
    links: { list: linkslist },
    suggestions: { list: suggestionslist }
  }

  return ret
}
