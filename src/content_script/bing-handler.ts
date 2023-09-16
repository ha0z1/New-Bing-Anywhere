import { $w, callBackground, escapeHtml, isEdge } from '@ha0z1/extension-utils'
import { getConfig, setConfig } from 'global/config'
import $ from 'jquery'
import { mutationConfig, openUrlInSameTab } from './_utils'

export default async () => {
  if (!isEdge) {
    const document = window.document
    const s = document.createElement('script')
    s.src = chrome.runtime.getURL('inject.js')
    s.onload = s.remove
    document.documentElement.appendChild(s)
  }
  const isRtl = document.documentElement.dir === 'rtl'

  // $(() => {
  //   (async () => {
  //     const { showGuideToGithub } = await getConfig()
  //     if (!showGuideToGithub) return
  //     const $esatSwitch = $('#est_switch')
  //     if ($.trim($esatSwitch.text()) !== '国内版国际版') return
  //     setTimeout(() => {
  //       const $a = $(
  //         '<a href="https://github.com/ha0z1/New-Bing-Anywhere/issues/8" title="查看如何正确配置网络代理" target="_blank" rel="noopener noreferrer nofollow">依然出现国内版/国际版？</a>'
  //       )
  //         .css({
  //           color: '#E89ABE',
  //           background: '#f00',
  //           fontSize: '12px',
  //           fontWeight: 'lighter'
  //         })
  //         .click(() => {
  //           setConfig({ showGuideToGithub: false })
  //         })

  //       $('#est_switch').append($a).css('width', 'auto')
  //     }, 2000)
  //   })()
  // })

  if (!location.href.startsWith('https://www.bing.com/search?')) return
  const config = await getConfig()

  $w('#sb_form').then(async () => {
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
        zIndex: 999999,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        display: 'block !important',
        transition: 'all .3s'
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
      </a>`)
      .css({
        position: 'absolute',
        left: 0,
        top: 0,
        width: '70px',
        height: '23px',
        display: 'block',
        'z-index': 999,
        transform: `translate3d(0,0,0)`,
        'will-change': 'transform',
        cursor: 'pointer'
      })
      .appendTo('body')

    $a.on('click', async (e) => {
      const $this = $(e.currentTarget)
      e.preventDefault()
      let val = ''
      if (!val) {
        val = String($q.val()).trim()
      }
      const url = `https://www.google.com/search?q=${encodeURIComponent(val)}`
      $this.attr('href', url)
      await openUrlInSameTab(url)
    })

    const changeGoogleLinkPosition = async () => {
      const $searchboxForm = $((await $w('.b_searchboxForm'))!)
      const $conv = $('#b-scopeListItem-conv')
      const isNewBingOpen = $conv.hasClass('b_active')
      const $bingIcon = $('.b_phead_chat_link')

      const isFixed = $('#id_phead').hasClass('phead_border')
      const hasBingIcon = $bingIcon.length && (isFixed ? window.innerWidth >= 840 : window.innerWidth >= 1164)

      let left = 0
      let top = 0

      if (isNewBingOpen) {
        left = $conv.offset()!.left + $conv.width()! + 30 + (isRtl ? -200 : 0)
        top = 33
        $a.css({
          position: 'absolute',
          transform: `translate3d(${left}px, ${top}px, 0)`
        })
        return
      }

      if (isFixed) {
        if (hasBingIcon) {
          left = $bingIcon.offset()!.left + $bingIcon.width()! + 10 + (isRtl ? -145 : 0)
        } else {
          left = $searchboxForm.offset()!.left + $searchboxForm.width()! + 10 + (isRtl ? -670 : 0)
        }
        top = 15
        $a.css({
          position: 'fixed',
          transform: `translate3d(${left}px, ${top}px, 0)`
        })
        return
      }

      if (hasBingIcon) {
        left = $bingIcon.offset()!.left + $bingIcon.width()! + 10 + (isRtl ? -140 : 0)
      } else {
        left = $searchboxForm.offset()!.left + $searchboxForm.width()! + 10 + (isRtl ? -740 : 0)
      }
      top = 32

      $a.css({
        position: 'absolute',
        transform: `translate3d(${left}px, ${top}px, 0)`
      })
    }

    changeGoogleLinkPosition()

    new MutationObserver((mutationList, _observer) => {
      for (const mutation of mutationList) {
        const target = mutation.target
        if (!target) continue
        if ((target as HTMLElement).id === 'b-scopeListItem-conv') {
          changeGoogleLinkPosition()
        }
        if ((target as HTMLElement).classList.contains('b_searchboxForm')) {
          changeGoogleLinkPosition()
        }
        if ((target as HTMLElement).id === 'id_phead') {
          changeGoogleLinkPosition()
        }
      }
    }).observe(document.getElementById('b_header')!, mutationConfig)
  })
}
