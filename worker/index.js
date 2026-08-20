import dashboardApiKeysEn from '../dist/dashboard/api-keys.html'
import dashboardDeviceEn from '../dist/dashboard/device.html'
import dashboardDevicesEn from '../dist/dashboard/devices.html'
import dashboardIndexEn from '../dist/dashboard/index.html'
import dashboardMembershipEn from '../dist/dashboard/membership.html'
import dashboardApiKeysJa from '../dist/ja/dashboard/api-keys.html'
import dashboardDeviceJa from '../dist/ja/dashboard/device.html'
import dashboardDevicesJa from '../dist/ja/dashboard/devices.html'
import dashboardIndexJa from '../dist/ja/dashboard/index.html'
import dashboardMembershipJa from '../dist/ja/dashboard/membership.html'
import dashboardApiKeysKo from '../dist/ko/dashboard/api-keys.html'
import dashboardDeviceKo from '../dist/ko/dashboard/device.html'
import dashboardDevicesKo from '../dist/ko/dashboard/devices.html'
import dashboardIndexKo from '../dist/ko/dashboard/index.html'
import dashboardMembershipKo from '../dist/ko/dashboard/membership.html'
import dashboardApiKeysZhHant from '../dist/zh-Hant/dashboard/api-keys.html'
import dashboardDeviceZhHant from '../dist/zh-Hant/dashboard/device.html'
import dashboardDevicesZhHant from '../dist/zh-Hant/dashboard/devices.html'
import dashboardIndexZhHant from '../dist/zh-Hant/dashboard/index.html'
import dashboardMembershipZhHant from '../dist/zh-Hant/dashboard/membership.html'

// The Worker owns origin canonicalisation, private dashboard documents and 404 status/header
// correction. Everything else goes to Workers Static Assets, which still applies _headers
// and html_handling. `assets.run_worker_first` makes those boundaries apply to every request.
const APEX = 'tmux.online'
const HSTS_POLICY = 'max-age=63072000; includeSubDomains; preload'
const DASHBOARD_HTML = new Map([
  ['/dashboard', dashboardIndexEn],
  ['/dashboard/api-keys', dashboardApiKeysEn],
  ['/dashboard/device', dashboardDeviceEn],
  ['/dashboard/devices', dashboardDevicesEn],
  ['/dashboard/membership', dashboardMembershipEn],
  ['/ja/dashboard', dashboardIndexJa],
  ['/ja/dashboard/api-keys', dashboardApiKeysJa],
  ['/ja/dashboard/device', dashboardDeviceJa],
  ['/ja/dashboard/devices', dashboardDevicesJa],
  ['/ja/dashboard/membership', dashboardMembershipJa],
  ['/ko/dashboard', dashboardIndexKo],
  ['/ko/dashboard/api-keys', dashboardApiKeysKo],
  ['/ko/dashboard/device', dashboardDeviceKo],
  ['/ko/dashboard/devices', dashboardDevicesKo],
  ['/ko/dashboard/membership', dashboardMembershipKo],
  ['/zh-Hant/dashboard', dashboardIndexZhHant],
  ['/zh-Hant/dashboard/api-keys', dashboardApiKeysZhHant],
  ['/zh-Hant/dashboard/device', dashboardDeviceZhHant],
  ['/zh-Hant/dashboard/devices', dashboardDevicesZhHant],
  ['/zh-Hant/dashboard/membership', dashboardMembershipZhHant],
])
const NOT_FOUND_PATHS = new Set(['/404', '/ja/404', '/ko/404', '/zh-Hant/404'])

const DASHBOARD_HEADERS = {
  'Cache-Control': 'private, max-age=600, must-revalidate',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'Content-Type': 'text/html; charset=utf-8',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), interest-cohort=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': HSTS_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow',
}

export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: (request: Request) => Promise<Response> } }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url)
    const isHttps = url.protocol === 'https:'

    const isApex = url.hostname === APEX
    const isWww = url.hostname === `www.${APEX}`
    if ((isApex && url.protocol !== 'https:') || isWww) {
      url.protocol = 'https:'
      url.hostname = APEX
      // The HTTPS apex is the only canonical origin and this redirect should be cached.
      const headers = { Location: url.toString() }
      if (isHttps) headers['Strict-Transport-Security'] = HSTS_POLICY
      return new Response(null, { status: 301, headers })
    }

    // The sitemap now lives at the conventional /sitemap.xml (renamed post-build); anything that
    // learned the old @astrojs/sitemap name from an earlier robots.txt is walked over here.
    if (url.pathname === '/sitemap-index.xml') {
      return new Response(null, { status: 301, headers: { Location: `https://${APEX}/sitemap.xml` } })
    }

    const dashboardHtml = DASHBOARD_HTML.get(url.pathname)
    if (dashboardHtml !== undefined && (request.method === 'GET' || request.method === 'HEAD')) {
      // The HTML is only a CSR shell; account data remains entirely client-fetched.
      return new Response(request.method === 'HEAD' ? null : dashboardHtml, { headers: DASHBOARD_HEADERS })
    }

    const response = await env.ASSETS.fetch(request)
    const isExplicit404 = NOT_FOUND_PATHS.has(url.pathname) && (request.method === 'GET' || request.method === 'HEAD')

    if (!isExplicit404 && response.status !== 404) return response

    const headers = new Headers(response.headers)
    headers.set('X-Robots-Tag', 'noindex, nofollow')
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: 404,
      statusText: 'Not Found',
      headers,
    })
  },
}
