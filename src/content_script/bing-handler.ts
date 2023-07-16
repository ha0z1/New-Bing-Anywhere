import { callBackground, escapeHtml, getConfig, isEdge, setConfig } from '@@/utils'
import $ from 'jquery'
import { $w, mutationConfig, openUrlInSameTab } from './utils'

export default async () => {
  if (!isEdge) {
    const document = window.document
    const s = document.createElement('script')
    s.src = chrome.runtime.getURL('inject.js')
    s.onload = s.remove
    document.documentElement.appendChild(s)
  }
  const isRtl = document.documentElement.dir === 'rtl'

  $(() => {
    ;(async () => {
      const { showGuideToGithub } = await getConfig()
      if (!showGuideToGithub) return
      const $esatSwitch = $('#est_switch')
      if ($.trim($esatSwitch.text()) !== '国内版国际版') return
      setTimeout(() => {
        const $a = $(
          '<a href="https://github.com/haozi/New-Bing-Anywhere/issues/8" title="查看如何正确配置网络代理" target="_blank" rel="noopener noreferrer nofollow">依然出现国内版/国际版？</a>'
        )
          .css({
            color: '#E89ABE',
            textShadow: '0.5px 0.1px 1px #58070D',
            fontSize: '12px',
            fontWeight: 'lighter'
          })
          .click(() => {
            setConfig({ showGuideToGithub: false })
          })

        $('#est_switch').append($a).css('width', 'auto')
      }, 2000)
    })()
  })

  if (!location.href.startsWith('https://www.bing.com/search?')) return
  const config = await getConfig()

  $w('#sb_form').then(() => {
    type Note = {
      html_url: string
      title: string
    } | null
    callBackground('getNotification').then((note: Note) => {
      if (!note) return
      const $body = $(document.body)
      const $div = $('<div/>').css({
        width: '100%',
        height: 40,
        border: '1px solid #590727',
        background: '#58070d',
        position: 'fixed',
        top: 0,
        fontSize: '12px',
        lineHeight: '40px',
        textAlign: 'center',
        zIndex: 99999,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        display: 'block !important'
      })
      const close = () => {
        $div.remove()
        $body.css('padding-top', '')
      }
      const $a = $(
        `<a style="color:#fff; background:url(${chrome.runtime.getURL(
          'images/bing_32x32.png'
        )}) no-repeat left 0; background-size: 12px; padding-inline-start: 20px" href="${
          note.html_url
        }" target="_blank" rel="noopener noreferrer nofollow">${note.title}</a>`
      ).on('click', close)
      const $close = $(
        '<a href="#" style="background:#58070d; color:#fff; cursor:pointer;padding: 0 68px 0 18px;position: absolute;right:0" title="no reminder">✕</a>'
      ).on('click', (e) => {
        e.preventDefault()
        confirm('Are you sure never see this notice again?') && callBackground('hideNotification')
        close()
      })
      $div.append($a).append($close)
      $body.append($div).css('padding-top', 40)
    })

    $(document.body).on('click', 'a.b_logoArea', (e) => {
      const $this = $(e.currentTarget)
      $this.attr('href', '/').attr('target', '_self')
    })

    if (!config.showGoogleButtonOnBing) return

    const $q = $('#sb_form_q')
    const searchQuery: string = $q.val() as string

    const $a = $(`
      <a href="https://www.google.com/search?q=${encodeURIComponent(
        escapeHtml(searchQuery)
      )}" target="google" tabindex="10" rel="noopener noreferrer nofollow" title="search with Google">
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
      transform: `translate3d(${835 - (isRtl ? 925 : 0)}px, 13px, 0px)`,
      'will-change': 'transform',
      cursor: 'pointer'
    })

    $('#sb_form').css('position', 'relative').prepend($a)

    $a.on('click', async (e) => {
      const $this = $(e.currentTarget)
      e.preventDefault()
      let val = ''
      // if ($('#b-scopeListItem-conv').hasClass('b_active')) {
      //   val = ($('#searchbox').val() ?? '').trim()
      // }
      if (!val) {
        val = String($q.val()).trim()
      }
      const url = `https://www.google.com/search?q=${encodeURIComponent(val)}`
      $this.attr('href', url)
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
      const isNewBingOpen = $conv.hasClass('b_active')
      if (isNewBingOpen) {
        let left = 0
        if ($conv.offset()!.left) {
          left = $conv.offset()!.left + $conv.width()! + 30
        } else {
          left = 350
        }

        $a.css({
          transform: `translate3d(${left - (isRtl ? 925 : 0)}px, 15px, 0)`
        })
      } else {
        $a.css({
          transform: `translate3d(${835 - (isRtl ? 925 : 0)}px, 15px, 0)`
        })
      }

      if (!isNewBingOpen && $('.b_searchboxForm').hasClass('as_rsform')) {
        $a.css({
          transform: `translate3d(${1155 - (isRtl ? -99999 : 0)}px, 15px, 0)`
        })
      }
    }

    changeGoogleLinkPosition()
    new MutationObserver((mutationList, observer) => {
      for (const mutation of mutationList) {
        const target = mutation.target
        if (!target) continue
        if ((target as HTMLElement).id === 'b-scopeListItem-conv') {
          changeGoogleLinkPosition()
        }
        if ((target as HTMLElement).classList.contains('b_searchboxForm')) {
          changeGoogleLinkPosition()
        }
      }
    }).observe(document.getElementById('b_header')!, mutationConfig)
  })
}
