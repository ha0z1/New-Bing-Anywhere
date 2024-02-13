import {
  checkIsBaidu,
  checkIsGoogle,
  checkIsYandex,
  // checkIsBing,
  // checkIsBrave,
  // checkIsDuckduckgo,
  // checkIsEcosia,
  // checkIsNaver,
  // checkIsSo,
  // checkIsYahoo,
  type Config
} from '@@/utils'
import $ from 'jquery'
import { $w } from './utils'

const qsStringify = (qs: Record<string, string>) => {
  for (const key in qs) {
    // eslint-disable-next-line no-prototype-builtins
    if (qs.hasOwnProperty(key)) {
      if (!qs[key]) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete qs[key]
      }
    }
  }
  return new URLSearchParams(qs).toString()
}

export default async (_config: Config) => {
  const isGoogle = checkIsGoogle()
  const isBaidu = checkIsBaidu()
  const isYandex = checkIsYandex()
  // const isBing = checkIsBing()
  // const isSo = checkIsSo()
  // const isDuckduckgo = checkIsDuckduckgo()
  // const isBrave = checkIsBrave()
  // const isEcosia = checkIsEcosia()
  // const isNaver = checkIsNaver()
  // const isYahoo = checkIsYahoo()

  if (!((isGoogle || isBaidu || isYandex) /* || isBing ||  || isSo || isDuckduckgo || isNaver || isBrave || isYahoo */)) return

  let prompt = ''
  let dir = ''
  let darkmode = ''
  const domain = location.hostname

  if (isGoogle) {
    prompt = new URLSearchParams(location.search).get('q') ?? ''
    dir = document.documentElement.dir
    darkmode =
      (document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement)?.content === 'dark' ||
      getComputedStyle(document.body || document.documentElement).backgroundColor === 'rgb(32, 33, 36)' ||
      document.querySelector('meta[name="color-scheme"]')
        ? 'dark'
        : ''
  }
  // if (isBing) {
  //   prompt = new URLSearchParams(location.search).get('q') ?? ''
  //   dir = document.documentElement.dir
  //   await $w('body')
  //   darkmode = (document.querySelector('body[class*="b_dark"]') as HTMLBodyElement) ? 'dark' : ''
  // }
  if (isBaidu) {
    prompt = new URLSearchParams(location.search).get('wd') ?? ''
  }
  if (isYandex) {
    prompt = new URLSearchParams(location.search).get('text') ?? ''
    darkmode =
      document.cookie.match(/skin\.([sld])/)?.[1] === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : ''
  }
  // if (isSo) {
  //   prompt = new URLSearchParams(location.search).get('q') ?? ''
  // }
  // if (isDuckduckgo) {
  //   prompt = new URLSearchParams(location.search).get('q') ?? ''
  //   darkmode = document.cookie.includes('ae=d') ? 'dark' : ''
  // }
  // if (isBrave) {
  //   prompt = new URLSearchParams(location.search).get('q') ?? ''
  //   darkmode = document.cookie.includes('theme=dark') ? 'dark' : ''
  // }
  // if (isEcosia) {
  //   prompt = new URLSearchParams(location.search).get('q') ?? ''
  // }
  // if (isNaver) {
  //   prompt = new URLSearchParams(location.search).get('query') ?? ''
  // }
  // if (isYahoo) {
  //   prompt = new URLSearchParams(location.search).get('p') ?? ''
  // }

  const extra = new URLSearchParams(location.hash.slice(1)).get('new-bing-anywhere') ?? ''

  const qs = {
    prompt: prompt.trim(),
    dir,
    darkmode,
    domain,
    extra
  }

  const chatIframeUrl = chrome.runtime.getURL(`/app/index.html#/chat/iframe?${qsStringify(qs)}`)

  try {
    const $ifame = $(`<iframe src="${chatIframeUrl}" scrolling="no" />`)
    $ifame.css({
      display: 'block',
      width: '100%',
      border: 'none',
      overflow: 'hidden',
      boxSizing: 'border-box',
      willChange: 'height',
      transition: 'height .1s cubic-bezier(0, 0, 0, 1.27) 0s',
      borderRadius: '8px',
      marginBottom: '10px',
      visibility: darkmode ? 'hidden' : 'visible'
    })

    window.addEventListener('message', (e) => {
      const { type, data } = e.data
      if (type === 'nba-ready') {
        $ifame.css('visibility', 'visible')
      }
      if (type === 'nba-resize') {
        const { height } = data
        $ifame.css({
          // width,
          height: Math.floor(height) + 1
        })
      }
    })

    if (isGoogle) {
      let $sidebar
      $sidebar = $(await $w('#rhs', 1))
      if (!$sidebar.length) {
        $sidebar = $('<div id="rhs" />').css({
          //  marginBottom: '20px', marginLeft: '30px', height: 'fit-content'
          marginInlineStart: 'var(--rhs-margin)',
          flex: '0 auto',
          width: 'var(--rhs-width)',
          position: 'relative',
          paddingBottom: '15px',
          transition: 'opacity 0.3s'
        })
      }
      const $bestContainer = $(await $w('.liYKde.g.VjDLd', 0.1))
      if ($bestContainer.length) {
        $bestContainer.prepend($ifame)
      } else {
        $sidebar.prepend($ifame)
      }
      const main = await $w('#center_col')
      $sidebar.insertAfter(main)
      $(main).after($sidebar)
    }

    // if (isBing) {
    //   const $sidebar = await $w('#b_context')
    //   $('<li class="b_ans" style="padding:0;margin-bottom:5px" />').prependTo($sidebar).append($ifame)
    // }

    if (isBaidu) {
      const $sidebar = $(await $w('#content_right'))
      $sidebar.prepend($ifame)
    }

    if (isYandex) {
      const $sidebar = $(await $w('.content__right'))
      $sidebar.prepend($ifame)
    }

    // if (isSo) {
    //   const $sidebar = $(await $w('#side'))
    //   $sidebar.prepend($ifame)
    // }

    // if (isDuckduckgo) {
    //   const $sidebar = $(await $w('[data-area="sidebar"]'))
    //   $sidebar.prepend($ifame)
    // }

    // if (isNaver) {
    //   const $sidebar = $(await $w('#sub_pack'))
    //   $sidebar.prepend(
    //     $ifame.css({
    //       margin: '0 0 18px 16px',
    //       'padding-inline-end': '46px'
    //     })
    //   )
    // }

    // if (isBrave) {
    //   const $sidebar = $(await $w('#side-right'))
    //   $sidebar.prepend($ifame)
    // }

    // if (isYahoo) {
    //   if (domain === 'search.yahoo.co.jp') {
    //     $(async () => {
    //       const $sidebar = $(await $w('#contents__wrap .Contents__innerSubGroupBody'))
    //       $sidebar.prepend($ifame.css({ width: 442, marginBottom: 10 }))
    //     })
    //   } else {
    //     const $sidebar = $(await $w('#right'))
    //     $sidebar.prepend($ifame)
    //   }
    // }
  } catch {}
}
