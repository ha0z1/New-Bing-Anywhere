import { checkIsGoogle, type Config } from '@@/utils'
import $ from 'jquery'
import { $w } from './utils'

const isGoogle = checkIsGoogle()
export default async (config: Config) => {
  let prompt = ''
  let dir = ''
  let darkmode = ''
  const domain = location.hostname
  if (isGoogle) {
    prompt = new URLSearchParams(location.search).get('q') ?? ''
    dir = document.documentElement.dir
    darkmode = (document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement)?.content === 'dark' ? 'dark' : ''
  }

  const extra = new URLSearchParams(location.hash.slice(1)).get('new-bing-anywhere') ?? ''

  const qs = {
    prompt: prompt.trim(),
    dir,
    darkmode,
    domain,
    extra
  }

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

  const chatIframeUrl = chrome.runtime.getURL(`/app/index.html#/chat/iframe?${qsStringify(qs)}`)

  try {
    const $ifame = $(`<iframe src="${chatIframeUrl}" scrolling="no" />`)
    $ifame.css({
      // position: 'fixed',
      // right: '0px',
      // zIndex: '999',
      width: '100%',
      border: 'none',
      overflow: 'hidden',
      boxSizing: 'border-box',
      willChange: 'height',
      transition: 'height .1s cubic-bezier(0, 0, 0, 1.27) 0s',
      borderRadius: '8px'
    })
    // $ifame.prependTo('body')

    // const position = { margin: '0 0 10px' }
    // const $ifame = $(`<iframe src=${chrome.runtime.getURL('/app/index.html#/chat')}/>`).css({
    //   ...position,
    //   width: '100%',
    //   height: '5000',
    //   border: 'none',
    //   overFlow: 'hidden'
    // })
    window.addEventListener('message', (e) => {
      const { type, data } = e.data
      if (type !== 'nba-resize') return
      const { height } = data
      $ifame.css({
        // width,
        height
      })
    })

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
  } catch {}
}
