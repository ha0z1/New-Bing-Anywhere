import { getConfig } from '@@/utils'

const escapeHtml = (s: string): string => {
  return s
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2f;')
}

const callMethod = async (method: string, args: any[]) => {
  return await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        method,
        args: [...args]
      },
      (res) => {
        if (!res || res.code !== 200) {
          reject(res?.msg)
        } else {
          resolve(res.data)
        }
      }
    )
  })
}

const openUrlInSameTab = async (url: string) => {
  try {
    return await callMethod('openUrlInSameTab', [{ url }])
  } catch (e) {
    // console.error(e)
    location.href = url
  }
}

;(async ($, document, $root) => {
  const config = await getConfig()
  const mutationConfig = { attributes: true, childList: true, subtree: true }

  // For bing.com
  ;(() => {
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
  })()

  // For google.com google.com.hk
  ;(() => {
    if (!config.showBingButtonOnGoogle) return
    if (
      !(
        location.href.startsWith('https://www.google.com/search?') ||
        location.href.startsWith('https://www.google.com.hk/search?')
      )
    ) {
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
      $a.on('click', async function (e) {
        e.preventDefault()
        const url = `https://www.bing.com/search?q=${encodeURIComponent($q.val())}&showconv=1`
        $(this).attr('href', url)
        await openUrlInSameTab(url)
      })
    }).observe($root, mutationConfig)
  })()
})((window as any).Zepto, document, document.documentElement)
