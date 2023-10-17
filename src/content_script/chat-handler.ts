import { getSiteType } from 'global/check'
import { Sites, type Config } from 'global/config'

import $ from 'jquery'
import { $shadowRootWrap, initApp } from './ChatApp'
import { $w, mutationConfig } from './_utils'
import { throttle } from 'lodash-es'

// const qsStringify = (qs: Record<string, string>) => {
//   for (const key in qs) {
//     // eslint-disable-next-line no-prototype-builtins
//     if (qs.hasOwnProperty(key)) {
//       if (!qs[key]) {
//         // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//         delete qs[key]
//       }
//     }
//   }
//   return new URLSearchParams(qs).toString()
// }

const siteType = getSiteType()

const insertApp2SidebarFirstChild = (isInBody: boolean, $sidebar: Element) => {
  if ($sidebar.firstChild !== $shadowRootWrap || !isInBody) {
    $sidebar.insertBefore($shadowRootWrap, $sidebar.firstChild)
  }
}
const insertApp = throttle(async ($body) => {
  const isInBody = $body.find($shadowRootWrap).length

  if (siteType === Sites.Google) {
    if (!isInBody) {
      let $sidebar = $((await $w('#rhs', 1))!)
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
      const $main = $((await $w('#center_col'))!)
      $main.after($sidebar)
    }

    const $sidebar = $('#rhs')
    $sidebar.length && insertApp2SidebarFirstChild(isInBody, $sidebar[0])

    // const $bestContainer = $((await $w('.liYKde.g.VjDLd', 0.05))!)
    // if ($bestContainer.length) {
    //   // $bestContainer.prepend($shadowRootWrap)
    //   insertApp2SidebarFirstChild(isInBody, $bestContainer[0])
    // } else {
    //   insertApp2SidebarFirstChild(isInBody, $sidebar[0])
    // }

    // if (!$main.find($sidebar[0]).length) {
    //   // $sidebar.insertAfter(main)

    // }
  }

  if (siteType === Sites.Baidu) {
    const $sidebar = (await $w('#content_right'))!
    insertApp2SidebarFirstChild(isInBody, $sidebar)
    return
  }

  if (siteType === Sites.Yandex) {
    if (isInBody) return
    const $sidebar = $((await $w('.content__right'))!)
    $sidebar.prepend($shadowRootWrap)
    return
  }
}, 2000)

export default async (config: Config) => {
  if (!config.sidebarSites.includes(siteType)) return

  initApp()

  const $body = $((await $w('body'))!)
  new MutationObserver((mutationList, _observer) => {
    for (const mutation of mutationList) {
      const target = mutation.target
      if (!target) continue
      insertApp($body)
    }
  }).observe($body[0], {
    ...mutationConfig,
    attributes: false
  })
  // if (isBing) {
  //   const $sidebar = (await $w('#b_context'))!
  //   $('<li class="b_ans" style="padding:0;margin-bottom:5px" />').prependTo($sidebar).append($shadowRootWrap)
  // }
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
}
