import { getConfig } from '@@/utils'
import $ from 'jquery'
import { $w, openUrlInSameTab } from './utils'

export default async () => {
  const config = await getConfig()
  if (!config.showBingButtonOnGoogle) return
  if (location.pathname !== '/search') return
  const isRtl = document.documentElement.dir === 'rtl'
  $w('[action="/search"]').then((form) => {
    if (!form) return
    const $form = $(form)
    const $q = $form.find('[name="q"]')
    const $submit = $form.find('button[type="submit"]')

    const $a = $(`
      <a href="https://www.bing.com/search?q=Bing+AI&showconv=1" rel="noopener noreferrer nofollow" target="bing" title="search with New Bing">
        <img src="${chrome.runtime.getURL('images/bing-chat.png')}" style="display: block; width: 20px; height: 20px" alt="bing" />
      </a>`).css({
      width: '40px',
      display: 'flex',
      position: 'relative',
      'z-index': 900,
      cursor: 'pointer',
      'justify-content': 'center',
      'align-items': 'center',
      margin: '-2px 10px 0 -10px',
      ...(isRtl
        ? {
            marginInlineStart: '-10px',
            marginInlineEnd: '10px'
          }
        : null)
    })

    $submit.after($a)
    $a.on('click', async (e) => {
      const $this = $(e.currentTarget)
      e.preventDefault()
      const url = `https://www.bing.com/search?q=${encodeURIComponent($q.val())}&showconv=1`
      $this.attr('href', url)
      await openUrlInSameTab(url)
    })
  })
}
