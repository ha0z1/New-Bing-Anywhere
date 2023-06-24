import { type Config, checkIsGoogle } from '@@/utils'
import { $w } from './utils'

const isGoogle = checkIsGoogle()
export default async ($: ZeptoStatic, config: Config) => {
  let prompt = ''
  if (isGoogle) {
    prompt = new URLSearchParams(location.search).get('q') ?? ''
  }

  const extra = new URLSearchParams(location.hash.slice(1)).get('new-bing-anywhere') ?? ''

  const qs = {
    prompt: prompt.trim(),
    extra
  }

  const chatIframeUrl = chrome.runtime.getURL(`/app/index.html#/chat/iframe?${new URLSearchParams(qs).toString()}`)

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
        marginLeft: 'var(--rhs-margin)',
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
