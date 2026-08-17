import dashboardApiKeysEn from '../dist/dashboard/api-keys.html'
import dashboardDeviceEn from '../dist/dashboard/device.html'
import dashboardDevicesEn from '../dist/dashboard/devices.html'
import dashboardIndexEn from '../dist/dashboard/index.html'
import dashboardMembershipEn from '../dist/dashboard/membership.html'
import dashboardApiKeysZhHant from '../dist/zh-Hant/dashboard/api-keys.html'
import dashboardDeviceZhHant from '../dist/zh-Hant/dashboard/device.html'
import dashboardDevicesZhHant from '../dist/zh-Hant/dashboard/devices.html'
import dashboardIndexZhHant from '../dist/zh-Hant/dashboard/index.html'
import dashboardMembershipZhHant from '../dist/zh-Hant/dashboard/membership.html'

// The Worker sends www.tmux.online to the apex with a real 301 and serves dashboard
// documents outside Workers Static Assets. Static Assets are edge-cached automatically;
// returning these build outputs from the Worker keeps them browser-private instead.
//
// `assets.run_worker_first` is on, so this runs for every request and hands everything
// that is not a www hostname straight to the asset server (which still applies _headers,
// html_handling and the 404 page).
const APEX = 'tmux.online'
const DASHBOARD_HTML = new Map([
  ['/dashboard', dashboardIndexEn],
  ['/dashboard/api-keys', dashboardApiKeysEn],
  ['/dashboard/device', dashboardDeviceEn],
  ['/dashboard/devices', dashboardDevicesEn],
  ['/dashboard/membership', dashboardMembershipEn],
  ['/zh-Hant/dashboard', dashboardIndexZhHant],
  ['/zh-Hant/dashboard/api-keys', dashboardApiKeysZhHant],
  ['/zh-Hant/dashboard/device', dashboardDeviceZhHant],
  ['/zh-Hant/dashboard/devices', dashboardDevicesZhHant],
  ['/zh-Hant/dashboard/membership', dashboardMembershipZhHant],
])

const DASHBOARD_HEADERS = {
  'Cache-Control': 'private, max-age=600, must-revalidate',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'Content-Type': 'text/html; charset=utf-8',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), interest-cohort=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow',
}

export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: (request: Request) => Promise<Response> } }} env
   */
  fetch(request, env) {
    const url = new URL(request.url)

    if (url.hostname === `www.${APEX}`) {
      url.hostname = APEX
      // 301 rather than 302: the apex is the canonical host and that should be cached.
      return Response.redirect(url.toString(), 301)
    }

    const dashboardHtml = DASHBOARD_HTML.get(url.pathname)
    if (dashboardHtml !== undefined && (request.method === 'GET' || request.method === 'HEAD')) {
      // The HTML is only a CSR shell; account data remains entirely client-fetched.
      return new Response(request.method === 'HEAD' ? null : dashboardHtml, { headers: DASHBOARD_HEADERS })
    }

    return env.ASSETS.fetch(request)
  },
}
