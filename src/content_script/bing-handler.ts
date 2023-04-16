import { escapeHtml } from '@@/utils'
import { mutationConfig, openUrlInSameTab } from './utils'

export default (config, $, $root) => {
  if (!location.href.startsWith('https://www.bing.com/search?')) return

  new MutationObserver((_mutationList, observer) => {
    if (!document.getElementById('sb_form')) return
    observer.disconnect()

    $(document.body).on('click', 'a.b_logoArea', function (e) {
      const $this = $(this)
      $this.attr('href', '/').attr('target', '_self')
    })

    if (!config.showGoogleButtonOnBing) return

    const $q = $('#sb_form_q')
    const searchQuery: string = $q.val()

    const $a = $(`
      <a href="https://www.google.com/search?q=${encodeURIComponent(
        escapeHtml(searchQuery)
      )}" target="google" tabindex="0" rel="noopener noreferrer nofollow" title="search with Google">
        <img src="${chrome.runtime.getURL('images/google.png')}" alt="google" style="width: 100%;display: block;">
      </a>`).css({
      position: 'absolute',
      left: 0,
      top: 0,
      width: '70px',
      height: '23px',
      display: 'inline-block',
      'z-index': 999,
      transition: 'all .3s',
      transform: 'translate3d(835px, 13px, 0px)',
      'will-change': 'transform',
      cursor: 'pointer'
    })

    $('#sb_form').css('position', 'relative').prepend($a)

    $a.on('click', async function (e) {
      e.preventDefault()
      let val = ''
      // if ($('#b-scopeListItem-conv').hasClass('b_active')) {
      //   val = ($('#searchbox').val() ?? '').trim()
      // }
      if (!val) {
        val = $q.val().trim()
      }
      const url = `https://www.google.com/search?q=${encodeURIComponent(val)}`
      $(this).attr('href', url)
      await openUrlInSameTab(url)
    })

    if (location.search.includes('showconv=1')) {
      $a.css('display', 'none')
      setTimeout(() => {
        $a.css('display', 'inline-block')
      }, 1200)
    }

    const changeGoogleLinkPosition = () => {
      const $conv = $('#b-scopeListItem-conv')
      if ($conv.hasClass('b_active')) {
        let left = 0
        if ($conv.offset()!.left) {
          left = ($conv.offset()!.left as number) + ($conv.width()! as number) + 30
        } else {
          left = 350
        }

        $a.css({
          transform: `translate3d(${left}px, 15px, 0)`
        })
      } else {
        $a.css({
          transform: 'translate3d(835px, 15px, 0)'
        })
      }
    }

    changeGoogleLinkPosition()
    new MutationObserver((mutationList, observer) => {
      for (const mutation of mutationList) {
        if (!mutation.target) continue
        if ((mutation.target as HTMLElement).id === 'b-scopeListItem-conv') {
          changeGoogleLinkPosition()
        }
      }
    }).observe(document.getElementById('b_header')!, mutationConfig)
  }).observe($root, mutationConfig)
}
