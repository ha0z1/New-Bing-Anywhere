// The only reason a Worker exists in front of an otherwise fully static site: sending
// www.tmux.online to the apex with a real 301. A zone-level Redirect Rule would do this
// without running any code, but creating one needs zone write access, which the wrangler
// OAuth token does not carry.
//
// `assets.run_worker_first` is on, so this runs for every request and hands everything
// that is not a www hostname straight to the asset server (which still applies _headers,
// html_handling and the 404 page).
const APEX = 'tmux.online'

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

    return env.ASSETS.fetch(request)
  },
}
