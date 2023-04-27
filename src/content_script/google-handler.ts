import { mutationConfig, openUrlInSameTab } from './utils'

export default async (config, $, $document) => {
  if (!config.showBingButtonOnGoogle) return
  if (!(location.href.startsWith('https://www.google.com/search?') || location.href.startsWith('https://www.google.com.hk/search?'))) {
    return
  }

  new MutationObserver((_mutationList, observer) => {
    const searchSelector = '[action="/search"]'
    if (!$(searchSelector).length) return
    observer.disconnect()

    const $form = $(searchSelector)
    const $q = $form.find('[name="q"]')
    const $submit = $form.find('button[type="submit"]')

    const $a = $(`
      <a href="https://www.bing.com/search?q=Bing+AI&showconv=1" rel="noopener noreferrer nofollow" target="bing" title="search with New Bing">
        <img src="${chrome.runtime.getURL('images/bing-chat.svg')}" style="display: block; width: 24px;" alt="bing" />
      </a>`).css({
      width: '40px',
      display: 'flex',
      position: 'relative',
      'z-index': 999,
      cursor: 'pointer',
      'justify-content': 'center',
      margin: '0 10px 0 -10px'
    })

    $submit.after($a)
    $a.on('click', async (e) => {
      const $this = $(e.currentTarget)
      e.preventDefault()
      const url = `https://www.bing.com/search?q=${encodeURIComponent($q.val())}&showconv=1`
      $this.attr('href', url)
      await openUrlInSameTab(url)
    })
  }).observe($document[0], mutationConfig)
}
