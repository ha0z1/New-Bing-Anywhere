"use strict";
(() => {
  // src/universe/constants.ts
  var BING = "https://www.bing.com/";
  var CN_REDIRECT_URL = "https://cn.bing.com/";
  var BAND_MKTS = ["zh-CN", "ru", "ru-ru"];
  var MAIN_VERSION = "113";
  var FULL_VERSION = "113.0.1774.57";
  var ALL_RESOURCE_TYPES = [
    "csp_report",
    "font",
    "image",
    "main_frame",
    "media",
    "object",
    "other",
    "ping",
    "script",
    "stylesheet",
    "sub_frame",
    "webbundle",
    "websocket",
    "webtransport",
    "xmlhttprequest"
  ];

  // package.json
  var version = "2.0.2";
  var repository = {
    type: "git",
    url: "https://github.com/haozi/New-Bing-Anywhere"
  };

  // src/universe/utils.ts
  var checkIsSimpleChinese = () => {
    try {
      const lang = chrome.i18n.getUILanguage().toLowerCase();
      return lang === "zh-cn";
    } catch {
      return false;
    }
  };
  var checkIsChinese = () => {
    try {
      const lang = chrome.i18n.getUILanguage().toLowerCase();
      return lang === "zh-cn" || lang === "zh-tw" || lang === "zh-hk" || lang === "zh";
    } catch {
      return false;
    }
  };
  var CONFIG_KEY = "configV1";
  var getConfig = async () => {
    const config = (await chrome.storage.sync.get(CONFIG_KEY))[CONFIG_KEY];
    return {
      showGoogleButtonOnBing: true,
      showBingButtonOnGoogle: true,
      showGuideToGithub: true,
      showChat: true,
      showRelease: true,
      triggerMode: "Always",
      conversationStyle: "Balanced",
      ...config
    };
  };
  var registryListener = (callMethods) => {
    chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
      ;
      (async () => {
        try {
          const { method, args } = req;
          const data = await callMethods[method](...args);
          sendResponse({ code: 200, msg: "ok", data });
        } catch (e) {
          const err = e ?? {};
          sendResponse({ code: 500, msg: err.stack ?? err.message ?? e });
        }
      })();
      return true;
    });
  };
  var localCache = (() => {
    const v = "v1";
    return {
      get: async (key) => {
        key = `${v}:${key}`;
        const { data, maxAge, lastModified } = (await chrome.storage.local.get(key))?.[key] ?? {};
        if (Date.now() - lastModified > maxAge * 1e3) {
          chrome.storage.local.remove(key);
          return null;
        }
        return data;
      },
      set: async (key, data, maxAge = Infinity) => {
        key = `${v}:${key}`;
        await chrome.storage.local.set({
          [key]: {
            data,
            lastModified: Date.now(),
            maxAge
          }
        });
      }
    };
  })();
  var userAgent = navigator.userAgent;
  var userAgentData = navigator.userAgentData;
  var isMac = userAgent.includes("Macintosh");
  var isFirefox = userAgent.includes("Firefox");
  var isEdge = userAgent.includes("Edg/");
  var isBrave = userAgentData?.brands.findIndex((item) => item.brand === "Brave") > -1;
  var isChinese = checkIsChinese();
  var isSimpleChinese = checkIsSimpleChinese();
  var isCanary = !!globalThis.__NBA_isCanary;
  var version2 = isCanary ? `0.${version}` : version;
  var genUA = () => {
    let ua = userAgent;
    if (!isEdge) {
      if (isMac) {
        ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MAIN_VERSION}.0.0.0 Safari/537.36 Edg/${FULL_VERSION}`;
      } else {
        ua = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MAIN_VERSION}.0.0.0 Safari/537.36 Edg/${FULL_VERSION}`;
      }
    }
    return ua;
  };
  var genIssueUrl = async (extra) => {
    const repositoryUrl = repository.url;
    try {
      const config = await getConfig();
      const url = `${repositoryUrl}/issues/new?title=&body=`;
      let finalUrl = url;
      let comment = "Please write your comment ABOVE this line, provide as much detailed information and screenshots as possible.The UA may not necessarily reflect your actual browser and platform, so please make sure to indicate them clearly.";
      if (isChinese) {
        comment = "\u8BF7\u5728\u6B64\u884C\u4E0A\u65B9\u53D1\u8868\u60A8\u7684\u8BA8\u8BBA\u3002\u8BE6\u5C3D\u7684\u63CF\u8FF0\u548C\u622A\u56FE\u6709\u52A9\u4E8E\u6211\u4EEC\u5B9A\u4F4D\u95EE\u9898\uFF0CUA \u4E0D\u4E00\u5B9A\u771F\u5B9E\u53CD\u6620\u60A8\u7684\u6D4F\u89C8\u5668\u548C\u5E73\u53F0\uFF0C\u8BF7\u5907\u6CE8\u6E05\u695A";
      }
      const body = ` 



<!--  ${comment} -->
` + Object.entries({
        Version: `${version2}${isCanary ? " (Canary)" : ""} `,
        UA: navigator.userAgent,
        Lang: chrome.i18n.getUILanguage(),
        AcceptLangs: (await chrome.i18n.getAcceptLanguages()).join(", "),
        config: JSON.stringify(config),
        ...extra
      }).map(([key, val]) => {
        return val ? `${key}: ${val}` : "";
      }).join("\n");
      finalUrl += encodeURIComponent(body.slice(0, 2e3));
      return finalUrl;
    } catch {
      return repositoryUrl;
    }
  };

  // src/background/utils.ts
  var getURL = (url = "", base) => {
    try {
      return new URL(url, base);
    } catch (e) {
      return {
        searchParams: {
          get: () => null
        }
      };
    }
  };
  var getURLSearchParams = (url) => {
    try {
      return new URLSearchParams(url);
    } catch {
      return {
        get: () => null
      };
    }
  };
  var openPage = async (url) => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const urlObj = getURL(url);
    let tab = tabs.find((tab2) => tab2.url?.startsWith(urlObj.origin));
    if (tab == null) {
      tab = await chrome.tabs.create({ url });
    } else {
      await Promise.all(
        [
          chrome.tabs.move(tab.id, { index: tabs.length - 1 }),
          tab.url !== url && chrome.tabs.update(tab.id, { url }),
          chrome.tabs.update(tab.id, { active: true, url: tab.url !== url ? url : void 0 })
        ].filter(Boolean)
      );
    }
    return tab;
  };
  var setCookie = async (options, cookie = {}) => {
    return await chrome.cookies.set({
      domain: cookie.domain,
      storeId: cookie.storeId,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expirationDate: cookie.expirationDate,
      ...options
    });
  };

  // src/background/context_menus.ts
  var contextMenus = {
    // version: {
    //   title: `🧃 Version: ${version}`,
    //   contexts: ['action'],
    //   onclick: () => {
    //     openPage(`${repositoryUrl}/releases/tag/${version}`)
    //   }
    // },
    openChat: {
      title: "\u{1F4AC} New Bing",
      contexts: ["action"],
      onclick: (_info) => {
        openPage("https://www.bing.com/search?q=Bing+AI&showconv=1");
      }
    },
    openImageCreate: {
      title: "\u{1F5BC}\uFE0F New Bing Image Creator",
      contexts: ["action"],
      onclick: (_info) => {
        openPage("https://www.bing.com/create");
      }
    },
    likeIt: {
      title: "\u2764\uFE0F Like it",
      contexts: ["action"],
      onclick: () => {
        openPage("https://chrome.google.com/webstore/detail/new-bing-anywhere/hceobhjokpdbogjkplmfjeomkeckkngi/reviews");
      }
    },
    reportIssues: {
      title: isChinese ? "\u{1F41B} \u53CD\u9988\u5EFA\u8BAE" : "\u{1F41B} Report issues",
      contexts: ["action"],
      onclick: async (_info) => {
        const url = await genIssueUrl();
        openPage(url);
      }
    }
  };
  var context_menus_default = () => {
    chrome.contextMenus.removeAll(() => {
      for (const [id, menu] of Object.entries(contextMenus)) {
        chrome.contextMenus.create({
          id,
          title: menu.title,
          contexts: menu.contexts
        });
      }
    });
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      const { menuItemId } = info;
      const item = contextMenus[menuItemId];
      if (item?.onclick)
        item.onclick(info, tab);
    });
  };

  // src/background/listeners/_notification.ts
  var MAX_AGE = 1e3 * 60 * 60 * 1;
  var KEY = "notification";
  var FLAG_KEY = "notification:hide";
  var getRemoteNotification = async () => {
    let data;
    try {
      data = await fetch("https://api.github.com/repos/haozi/New-Bing-Anywhere/issues/24").then(async (res) => await res.json());
    } catch {
    }
    return data;
  };
  var getNotification = async () => {
    const { [KEY]: oldData } = await chrome.storage.local.get(KEY);
    if (!oldData || oldData.lastModify && Date.now() - oldData.lastModify > MAX_AGE) {
      await chrome.storage.local.remove(KEY);
      const data = await getRemoteNotification();
      if (data) {
        await chrome.storage.local.set({ [KEY]: { data, lastModify: Date.now() } });
      }
    }
    const { [FLAG_KEY]: flag, [KEY]: newData } = await chrome.storage.local.get([FLAG_KEY, KEY]);
    if (!newData?.data)
      return null;
    if (!(newData.data.title && newData.data.state === "open"))
      return null;
    if (flag === 1 && newData.data.title === oldData.data?.title)
      return null;
    await chrome.storage.local.remove(FLAG_KEY);
    return newData.data;
  };
  var hideNotification = async () => {
    chrome.storage.local.set({ [FLAG_KEY]: 1 });
  };

  // src/background/listeners/index.ts
  var getEnv = async () => {
    return {
      version: version2
    };
  };
  var openUrlInSameTab = async ({ url } = {}) => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const urlObj = getURL(url);
    let tab = tabs.find((tab2) => tab2.url?.startsWith(urlObj.origin));
    if (tab == null) {
      tab = await chrome.tabs.create({ url });
    } else {
      if (tab.id != null) {
        await Promise.all([chrome.tabs.move(tab.id, { index: tabs.length - 1 }), chrome.tabs.update(tab.id, { active: true })]);
      }
    }
    let newUrl = url;
    let query = "";
    let tabQuery = "";
    const isGoogle = urlObj.hostname === "www.google.com";
    const isBing = urlObj.hostname === "www.bing.com";
    if (isGoogle) {
      query = urlObj.searchParams.get("q") ?? "";
      tabQuery = getURL(tab.url).searchParams.get("q") ?? "";
      getURL(tab.url).searchParams.get("q");
    } else if (isBing) {
      query = urlObj.searchParams.get("q") ?? "";
      tabQuery = getURL(tab.url).searchParams.get("q") ?? "";
    }
    query = query.trim();
    tabQuery = tabQuery.trim();
    if (query && query === tabQuery)
      return;
    if (isGoogle) {
      newUrl = `${urlObj.origin}${urlObj.pathname}?q=${encodeURIComponent(query)}`;
    } else if (isBing) {
      newUrl = `${urlObj.origin}${urlObj.pathname}?q=${encodeURIComponent(query)}`;
    }
    await chrome.tabs.update(tab.id, { url: newUrl });
  };
  var listeners_default = {
    getEnv,
    openUrlInSameTab,
    getNotification,
    hideNotification
  };

  // src/background/cross_platform.ts
  var cross_platform_default = () => {
    context_menus_default();
    registryListener(listeners_default);
    chrome.runtime.onInstalled.addListener(async (details) => {
      const config = await getConfig();
      const repositoryUrl = repository.url;
      if (isCanary) {
        openPage(`${repositoryUrl}/tree/canary`);
        return;
      }
      if (details.reason === "install") {
        openPage(repositoryUrl);
      } else if (details.reason === "update" && config.showRelease) {
        openPage(`${repositoryUrl}/releases/tag/v${version2}`);
      }
    });
    chrome.webRequest.onBeforeRequest.addListener(
      () => {
        chrome.cookies.get(
          {
            name: "_EDGE_S",
            url: BING
          },
          (cookie) => {
            const value = cookie?.value;
            if (!value)
              return;
            const valueObj = getURLSearchParams(value);
            const mkt = valueObj.get("mkt")?.toLowerCase() ?? "";
            if (!BAND_MKTS.map((m) => m.toLowerCase()).includes(mkt))
              return;
            if (mkt === "zh-cn") {
              valueObj.set("mkt", "zh-HK");
              valueObj.set("ui", "zh-hans");
            } else {
              valueObj.delete("mkt");
            }
            setCookie(
              {
                url: BING,
                name: cookie.name,
                value: valueObj.toString()
              },
              cookie
            );
          }
        );
        chrome.cookies.get(
          {
            name: "_RwBf",
            url: BING
          },
          (cookie) => {
            const value = cookie?.value;
            if (!value) {
              setCookie({
                url: BING,
                name: "_RwBf",
                value: "wls=2",
                domain: ".bing.com",
                httpOnly: true
              });
              return;
            }
            const valueObj = getURLSearchParams(value);
            const wls = valueObj.get("wls");
            if (wls !== "2" && wls !== "") {
              valueObj.set("wls", "2");
            }
            setCookie(
              {
                url: BING,
                name: "_RwBf",
                domain: ".bing.com",
                httpOnly: true,
                value: valueObj.toString()
              },
              cookie
            );
          }
        );
      },
      { urls: [BING + "*"], types: ["main_frame"] }
    );
  };

  // src/background/dynamic_rules.ts
  var MODIFY_HEADERS_LIST = {
    // 'X-Forwarded-For': '8.8.8.8',
    "User-Agent": genUA()
  };
  var MODIFY_HEADERS = "modifyHeaders";
  var SET = "set";
  var dynamicRules = [
    {
      priority: 2001,
      action: {
        type: MODIFY_HEADERS,
        requestHeaders: Object.entries(MODIFY_HEADERS_LIST).map(([header, value]) => ({
          operation: SET,
          header,
          value
        }))
      },
      condition: {
        requestDomains: ["bing.com", "www.bing.com", "cn.bing.com"],
        resourceTypes: ALL_RESOURCE_TYPES
      }
    }
  ].filter(Boolean).map((rule, index) => ({
    id: index + 1 + 2e3,
    ...rule
  }));
  var dynamic_rules_default = () => {
    if (!dynamicRules.length)
      return;
    chrome.declarativeNetRequest.getDynamicRules((dRules) => {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [.../* @__PURE__ */ new Set([...dynamicRules.map((rule) => rule.id), ...dRules.map((rule) => rule.id)])],
        addRules: dynamicRules
      });
    });
  };

  // src/background/chromium.ts
  cross_platform_default();
  chrome.runtime.onInstalled.addListener((details) => {
    dynamic_rules_default();
  });
  if (isSimpleChinese) {
    chrome.runtime.setUninstallURL(CN_REDIRECT_URL);
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL3VuaXZlcnNlL2NvbnN0YW50cy50cyIsICIuLi8uLi9wYWNrYWdlLmpzb24iLCAiLi4vLi4vc3JjL3VuaXZlcnNlL3V0aWxzLnRzIiwgIi4uLy4uL3NyYy9iYWNrZ3JvdW5kL3V0aWxzLnRzIiwgIi4uLy4uL3NyYy9iYWNrZ3JvdW5kL2NvbnRleHRfbWVudXMudHMiLCAiLi4vLi4vc3JjL2JhY2tncm91bmQvbGlzdGVuZXJzL19ub3RpZmljYXRpb24udHMiLCAiLi4vLi4vc3JjL2JhY2tncm91bmQvbGlzdGVuZXJzL2luZGV4LnRzIiwgIi4uLy4uL3NyYy9iYWNrZ3JvdW5kL2Nyb3NzX3BsYXRmb3JtLnRzIiwgIi4uLy4uL3NyYy9iYWNrZ3JvdW5kL2R5bmFtaWNfcnVsZXMudHMiLCAiLi4vLi4vc3JjL2JhY2tncm91bmQvY2hyb21pdW0udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCBjb25zdCBCSU5HID0gJ2h0dHBzOi8vd3d3LmJpbmcuY29tLydcbmV4cG9ydCBjb25zdCBDTl9SRURJUkVDVF9VUkwgPSAnaHR0cHM6Ly9jbi5iaW5nLmNvbS8nXG5leHBvcnQgY29uc3QgQkFORF9NS1RTID0gWyd6aC1DTicsICdydScsICdydS1ydSddXG5cbmV4cG9ydCBjb25zdCBNQUlOX1ZFUlNJT04gPSAnMTEzJ1xuZXhwb3J0IGNvbnN0IEZVTExfVkVSU0lPTiA9ICcxMTMuMC4xNzc0LjU3J1xuXG5leHBvcnQgY29uc3QgQUxMX1JFU09VUkNFX1RZUEVTID0gW1xuICAnY3NwX3JlcG9ydCcsXG4gICdmb250JyxcbiAgJ2ltYWdlJyxcbiAgJ21haW5fZnJhbWUnLFxuICAnbWVkaWEnLFxuICAnb2JqZWN0JyxcbiAgJ290aGVyJyxcbiAgJ3BpbmcnLFxuICAnc2NyaXB0JyxcbiAgJ3N0eWxlc2hlZXQnLFxuICAnc3ViX2ZyYW1lJyxcbiAgJ3dlYmJ1bmRsZScsXG4gICd3ZWJzb2NrZXQnLFxuICAnd2VidHJhbnNwb3J0JyxcbiAgJ3htbGh0dHByZXF1ZXN0J1xuXSBhcyBjaHJvbWUuZGVjbGFyYXRpdmVOZXRSZXF1ZXN0LlJlc291cmNlVHlwZVtdXG4iLCAie1xuICBcIm5hbWVcIjogXCJuZXctYmluZy1hbnl3aGVyZVwiLFxuICBcInZlcnNpb25cIjogXCIyLjAuMlwiLFxuICBcInByaXZhdGVcIjogdHJ1ZSxcbiAgXCJkZXNjcmlwdGlvblwiOiBcIk5ldyBCaW5nIGlzbid0IGp1c3QgZm9yIEVkZ2UgYW55bW9yZS4gQW55d2hlcmUgeW91IHdhbnRcIixcbiAgXCJob21lcGFnZVwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9oYW96aS9OZXctQmluZy1Bbnl3aGVyZVwiLFxuICBcInJlcG9zaXRvcnlcIjoge1xuICAgIFwidHlwZVwiOiBcImdpdFwiLFxuICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2hhb3ppL05ldy1CaW5nLUFueXdoZXJlXCJcbiAgfSxcbiAgXCJsaWNlbnNlXCI6IFwiR1BMdjNcIixcbiAgXCJhdXRob3JcIjogXCJoYW96aVwiLFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiYnVpbGRcIjogXCJybSAtcmYgZGlzdCAmJiBta2RpciAtcCBkaXN0ICYmIHBucG0gcnVuIGxpbnQgJiYgcG5wbSBydW4gYnVpbGQ6YnVuZGxlXCIsXG4gICAgXCJidWlsZDpidW5kbGVcIjogXCJOT0RFX0VOVj1wcm9kdWN0aW9uIHZpdGUtbm9kZSBzY3JpcHRzL2J1aWxkLnRzIC0tIGJ1aWxkXCIsXG4gICAgXCJjb3B5XCI6IFwicm0gLXJmIGRpc3QgJiYgY3AgLXIgcHVibGljIGRpc3RcIixcbiAgICBcImNvcHk6c29ydWNlXCI6IFwicnN5bmMgLXZocmEgLiBkaXN0L3NvdXJjZSAtLWluY2x1ZGU9JyoqLmdpdGlnbm9yZScgLS1leGNsdWRlPScvLmdpdCcgLS1leGNsdWRlPSdkaXN0JyAgLS1maWx0ZXI9JzotIC5naXRpZ25vcmUnIC0tZGVsZXRlLWFmdGVyXCIsXG4gICAgXCJjb3B5OndhdGNoXCI6IFwicG5wbSBydW4gY29weSAtLSAtLXdhdGNoXCIsXG4gICAgXCJkZXZcIjogXCJwbnBtIHJ1biBsaW50ICYmIHBucG0gcnVuICcvXmRldjouKi8nXCIsXG4gICAgXCJkZXY6YXBwXCI6IFwicG5wbSAtLWZpbHRlciBhcHAgcnVuIGRldlwiLFxuICAgIFwiZGV2OmJ1bmRsZVwiOiBcInZpdGUtbm9kZSBzY3JpcHRzL2J1aWxkLnRzIC0tIGRldlwiLFxuICAgIFwibGludFwiOiBcInBucG0gcnVuIHByZXR0aWVyICYmIHBucG0gcnVuICcvXmxpbnQ6LiovJ1wiLFxuICAgIFwibGludDplc2xpbnRcIjogXCJlc2xpbnQgLS1leHQgLmpzLC50cyAuL3NyYyAtLWZpeCAtLWNhY2hlXCIsXG4gICAgXCJsaW50OnN0eWx1c1wiOiBcInN0eWx1cy1zdXByZW1hY3kgZm9ybWF0IC4vc3JjLyoqLyouc3R5bCAgLS1vcHRpb25zIC4vc3R5bHVzLXN1cHJlbWFjeS5qc29uIC0tcmVwbGFjZVwiLFxuICAgIFwicHJlcGFyZVwiOiBcImh1c2t5IGluc3RhbGwgJiYgcG5wbSBydW4gYnVpbGRcIixcbiAgICBcInByZXR0aWVyXCI6IFwicHJldHRpZXIgLS1jYWNoZSAtLXdyaXRlIC5cIixcbiAgICBcInByZXR0aWVyOndhdGNoXCI6IFwib25jaGFuZ2UgXFxcIioqLypcXFwiIC0tIHByZXR0aWVyIC0tY2FjaGUgLS13cml0ZSAtLWlnbm9yZS11bmtub3duIC0taWdub3JlLXBhdGggLnByZXR0aWVyaWdub3JlIHt7Y2hhbmdlZH19ID4gL2Rldi9udWxsIDI+JjFcIixcbiAgICBcInRlc3RcIjogXCJwbnBtIHJ1biBsaW50XCJcbiAgfSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQHR5cGVzL3plcHRvXCI6IFwiXjEuMC4zM1wiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkB0eXBlcy9jaHJvbWVcIjogXCJeMC4wLjIzN1wiLFxuICAgIFwiQHR5cGVzL2ZzLWV4dHJhXCI6IFwiXjExLjAuMVwiLFxuICAgIFwiQHR5cGVzL25vZGVcIjogXCJeMjAuMy4xXCIsXG4gICAgXCJAdHlwZXNjcmlwdC1lc2xpbnQvZXNsaW50LXBsdWdpblwiOiBcIl41LjU5LjExXCIsXG4gICAgXCJjb3B5LWFuZC13YXRjaFwiOiBcIl4wLjEuNlwiLFxuICAgIFwiZXNidWlsZFwiOiBcIl4wLjE4LjNcIixcbiAgICBcImVzYnVpbGQtcGx1Z2luLXN2Z3JcIjogXCJeMi4wLjBcIixcbiAgICBcImVzYnVpbGQtc3R5bGUtcGx1Z2luXCI6IFwiXjEuNi4yXCIsXG4gICAgXCJlc2xpbnRcIjogXCJeOC40Mi4wXCIsXG4gICAgXCJlc2xpbnQtY29uZmlnLXN0YW5kYXJkLXdpdGgtdHlwZXNjcmlwdFwiOiBcIl4zNS4wLjBcIixcbiAgICBcImVzbGludC1wbHVnaW4taW1wb3J0XCI6IFwiXjIuMjcuNVwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1uXCI6IFwiXjE2LjAuMFwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1ub2RlXCI6IFwiXjExLjEuMFwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1wcmV0dGllclwiOiBcIl40LjIuMVwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1wcm9taXNlXCI6IFwiXjYuMS4xXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLXJlYWN0XCI6IFwiXjcuMzIuMlwiLFxuICAgIFwiZnMtZXh0cmFcIjogXCJeMTEuMS4xXCIsXG4gICAgXCJodXNreVwiOiBcIl44LjAuM1wiLFxuICAgIFwibWQ1LWZpbGVcIjogXCJeNS4wLjBcIixcbiAgICBcIm9uY2hhbmdlXCI6IFwiXjcuMS4wXCIsXG4gICAgXCJwcmV0dGllclwiOiBcIl4yLjguOFwiLFxuICAgIFwic29ydC1wYWNrYWdlLWpzb25cIjogXCJeMi40LjFcIixcbiAgICBcInN0eWx1c1wiOiBcIl4wLjU5LjBcIixcbiAgICBcInN0eWx1cy1zdXByZW1hY3lcIjogXCJeMi4xNy41XCIsXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjUuMS4zXCIsXG4gICAgXCJ2aXRlLW5vZGVcIjogXCJeMC4zMi4xXCJcbiAgfSxcbiAgXCJlbmdpbmVzXCI6IHtcbiAgICBcIm5vZGVcIjogXCJeMjAuMy4wXCIsXG4gICAgXCJwbnBtXCI6IFwiXjguNi4yXCJcbiAgfSxcbiAgXCJleHRlbnNpb24taTE4blwiOiB7XG4gICAgXCJlblwiOiB7XG4gICAgICBcImV4dGVuc2lvbk5hbWVcIjogXCJOZXcgQmluZyBBbnl3aGVyZSAoQmluZyBDaGF0IEdQVC00KVwiLFxuICAgICAgXCJleHRlbnNpb25EZXNjcmlwdGlvblwiOiBcIk5ldyBCaW5nIENoYXQgY2FuIGJlIHVzZWQgaW4gYW55IGJyb3dzZXIsIHdpdGggYW55IHNlYXJjaCBlbmdpbmUsIGFuZCBpbiBhbnkgY291bnRyeS5cIlxuICAgIH0sXG4gICAgXCJ6aF9DTlwiOiB7XG4gICAgICBcImV4dGVuc2lvbk5hbWVcIjogXCJOZXcgQmluZyBBbnl3aGVyZSAoQmluZyBDaGF0IEdQVC00KVwiLFxuICAgICAgXCJleHRlbnNpb25EZXNjcmlwdGlvblwiOiBcIk5ldyBCaW5nIENoYXQgY2FuIGJlIHVzZWQgaW4gYW55IGJyb3dzZXIsIHdpdGggYW55IHNlYXJjaCBlbmdpbmUsIGFuZCBpbiBhbnkgY291bnRyeS4gXHU5NjhGXHU2NUY2XHU5NjhGXHU1NzMwXHVGRjBDXHU2NzA5XHU2QzQyXHU1RkM1XHU1RTk0XHUzMDAyXCJcbiAgICB9LFxuICAgIFwiemhfVFdcIjoge1xuICAgICAgXCJleHRlbnNpb25OYW1lXCI6IFwiTmV3IEJpbmcgQW55d2hlcmUgKEJpbmcgQ2hhdCBHUFQtNClcIixcbiAgICAgIFwiZXh0ZW5zaW9uRGVzY3JpcHRpb25cIjogXCJOZXcgQmluZyBDaGF0IGNhbiBiZSB1c2VkIGluIGFueSBicm93c2VyLCB3aXRoIGFueSBzZWFyY2ggZW5naW5lLCBhbmQgaW4gYW55IGNvdW50cnkuIFx1OTZBOFx1NjY0Mlx1OTZBOFx1NTczMFx1RkYwQ1x1NjcwOVx1NkM0Mlx1NUZDNVx1NjFDOVwiXG4gICAgfSxcbiAgICBcInJ1XCI6IHtcbiAgICAgIFwiZXh0ZW5zaW9uTmFtZVwiOiBcIk5ldyBCaW5nIEFueXdoZXJlIChCaW5nIENoYXQgR1BULTQpXCIsXG4gICAgICBcImV4dGVuc2lvbkRlc2NyaXB0aW9uXCI6IFwiXHUwNDI3XHUwNDMwXHUwNDQyIE5ldyBCaW5nIFx1MDQzQ1x1MDQzRVx1MDQzNlx1MDQzNVx1MDQ0MiBcdTA0MzhcdTA0NDFcdTA0M0ZcdTA0M0VcdTA0M0JcdTA0NENcdTA0MzdcdTA0M0VcdTA0MzJcdTA0MzBcdTA0NDJcdTA0NENcdTA0NDFcdTA0NEYgXHUwNDMyIFx1MDQzQlx1MDQ0RVx1MDQzMVx1MDQzRVx1MDQzQyBcdTA0MzFcdTA0NDBcdTA0MzBcdTA0NDNcdTA0MzdcdTA0MzVcdTA0NDBcdTA0MzUsIFx1MDQ0MSBcdTA0M0JcdTA0NEVcdTA0MzFcdTA0NEJcdTA0M0MgXHUwNDNGXHUwNDNFXHUwNDM4XHUwNDQxXHUwNDNBXHUwNDNFXHUwNDMyXHUwNDRCXHUwNDNDIFx1MDQzNFx1MDQzMlx1MDQzOFx1MDQzNlx1MDQzQVx1MDQzRVx1MDQzQyBcdTA0MzggXHUwNDMyIFx1MDQzQlx1MDQ0RVx1MDQzMVx1MDQzRVx1MDQzOSBcdTA0NDFcdTA0NDJcdTA0NDBcdTA0MzBcdTA0M0RcdTA0MzUuXCJcbiAgICB9XG4gIH0sXG4gIFwiZXh0ZW5zaW9uTmFtZVwiOiBcIk5ldyBCaW5nIEFueXdoZXJlIChCaW5nIENoYXQgR1BULTQpXCJcbn1cbiIsICJpbXBvcnQgeyB2ZXJzaW9uIGFzIHBrZ1ZlcnNpb24sIHJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nXG5pbXBvcnQgeyBGVUxMX1ZFUlNJT04sIE1BSU5fVkVSU0lPTiB9IGZyb20gJy4vY29uc3RhbnRzJ1xuaW1wb3J0IHsgdHlwZSBCaW5nIH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGNvbnN0IGNoZWNrSXNHb29nbGUgPSAoKSA9PiB7XG4gIHJldHVybiBsb2NhdGlvbi5ob3N0bmFtZS5pbmNsdWRlcygnZ29vZ2xlJylcbn1cbmV4cG9ydCBjb25zdCBscyA9IHtcbiAgc2V0OiBhc3luYyA8VCA9IGFueT4oa2V5OiBzdHJpbmcsIHZhbHVlOiBUKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgY29uc3QgS0VZID0gYE5CQUAke2VuY29kZVVSSUNvbXBvbmVudChrZXkpfWBcbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KFxuICAgICAgICB7XG4gICAgICAgICAgW0tFWV06IHZhbHVlXG4gICAgICAgIH0sXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZClcbiAgICAgICAgfVxuICAgICAgKVxuICAgIH0pXG4gIH0sXG4gIGdldDogYXN5bmMgPFQgPSBhbnk+KGtleTogc3RyaW5nKTogUHJvbWlzZTxUIHwgdW5kZWZpbmVkPiA9PiB7XG4gICAgY29uc3QgS0VZID0gYE5CQUAke2VuY29kZVVSSUNvbXBvbmVudChrZXkpfWBcbiAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbS0VZXSwgKHJlc3VsdCkgPT4ge1xuICAgICAgICByZXNvbHZlKHJlc3VsdFtLRVldKVxuICAgICAgfSlcbiAgICB9KVxuICB9LFxuICByZW1vdmU6IGFzeW5jIChrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IEtFWSA9IGBOQkFAJHtlbmNvZGVVUklDb21wb25lbnQoa2V5KX1gXG4gICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnJlbW92ZShbS0VZXSlcbiAgICAgIHJlc29sdmUodW5kZWZpbmVkKVxuICAgIH0pXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGdldEFsbFRhYnMgPSBhc3luYyAocXVlcnlJbmZvOiBjaHJvbWUudGFicy5RdWVyeUluZm8gPSB7IHN0YXR1czogJ2NvbXBsZXRlJyB9KTogUHJvbWlzZTxJVGFiW10+ID0+IHtcbiAgY29uc3QgbmV3VGFiczogSVRhYltdID0gKGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHF1ZXJ5SW5mbykpIGFzIElUYWJbXVxuICBjb25zdCBvbGRUYWJzOiBJVGFiW10gPSB1bmlxdWUoKGF3YWl0IGxzLmdldDxJVGFiW10+KCdjdXJyZW50VGFicycpKSEpXG4gIGZvciAoY29uc3QgbmV3VGFiIG9mIG5ld1RhYnMpIHtcbiAgICBmb3IgKGNvbnN0IG9sZFRhYiBvZiBvbGRUYWJzKSB7XG4gICAgICBpZiAob2xkVGFiLnVybCAhPSBudWxsICYmIG9sZFRhYi51cmwgPT09IG5ld1RhYi51cmwpIHtcbiAgICAgICAgbmV3VGFiLiRleHRyYSA9IG9sZFRhYi4kZXh0cmFcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbGV0IHRhYnMgPSBuZXdUYWJzLmNvbmNhdChvbGRUYWJzKVxuICB0YWJzID0gdGFicy5maWx0ZXIoKHRhYikgPT4ge1xuICAgIGNvbnN0IHVybCA9IHRhYi51cmwgPz8gJydcbiAgICByZXR1cm4gdXJsLnN0YXJ0c1dpdGgoJ2h0dHAnKSB8fCB1cmwuc3RhcnRzV2l0aCgnY2hyb21lLWV4dGVuc2lvbjovLycpXG4gIH0pXG4gIHRhYnMuZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgaWYgKHRhYi51cmwgPT0gbnVsbCkgcmV0dXJuXG4gICAgdGFiLnVybCA9IHRhYi51cmwucmVwbGFjZSgvIy4qJC8sICcnKVxuICB9KVxuICB0YWJzID0gdW5pcXVlKHRhYnMsICd1cmwnKS5zbGljZSgwLCA1MDAwKVxuICByZXR1cm4gdGFic1xufVxuXG5leHBvcnQgY29uc3QgdW5pcXVlID0gPFQ+KGFycjogVFtdLCBrZXk6IHN0cmluZyA9ICd1cmwnKTogVFtdID0+IHtcbiAgY29uc3QgbWFwID0gbmV3IE1hcCgpXG4gIHJldHVybiBhcnIuZmlsdGVyKChpdGVtOiBhbnkpID0+IHtcbiAgICBpZiAobWFwLmhhcyhpdGVtW2tleV0pKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IGVsc2Uge1xuICAgICAgbWFwLnNldChpdGVtW2tleV0sIHRydWUpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfSlcbn1cblxuZXhwb3J0IHR5cGUgSVRhYiA9IGNocm9tZS50YWJzLlRhYiAmIHtcbiAgJGV4dHJhPzoge1xuICAgIGxhc3RNb2RpZmllZDogbnVtYmVyXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGZpbmRTYW1lVXJsVGFiID0gYXN5bmMgKHVybD86IHN0cmluZywgcXVlcnlJbmZvOiBjaHJvbWUudGFicy5RdWVyeUluZm8gPSB7fSk6IFByb21pc2U8Y2hyb21lLnRhYnMuVGFiIHwgbnVsbD4gPT4ge1xuICBpZiAoIXVybCkgcmV0dXJuIG51bGxcbiAgY29uc3Qgb3BlbmVkVGFicyA9IGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHF1ZXJ5SW5mbylcbiAgcmV0dXJuIChcbiAgICBvcGVuZWRUYWJzLmZpbmQoKG9wZW5lZFRhYikgPT4ge1xuICAgICAgaWYgKCFvcGVuZWRUYWIudXJsKSByZXR1cm4gZmFsc2VcbiAgICAgIHJldHVybiBub3JtYWxpemVVcmwob3BlbmVkVGFiLnVybCkgPT09IHVybFxuICAgIH0pID8/IG51bGxcbiAgKVxufVxuXG5leHBvcnQgY29uc3Qgbm9ybWFsaXplVXJsID0gKHVybDogc3RyaW5nID0gJycpOiBzdHJpbmcgPT4ge1xuICByZXR1cm4gdXJsLnJlcGxhY2UoLyMuKiQvLCAnJylcbn1cblxuZXhwb3J0IGNvbnN0IHNsZWVwID0gYXN5bmMgKGRlbGF5OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBzZXRUaW1lb3V0KHJlc29sdmUsIGRlbGF5KVxuICB9KVxufVxuXG4vKipcbiAqIGNoZWNrIGlmIGlzIENoaW5lc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGNoZWNrSXNTaW1wbGVDaGluZXNlID0gKCkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGxhbmcgPSBjaHJvbWUuaTE4bi5nZXRVSUxhbmd1YWdlKCkudG9Mb3dlckNhc2UoKVxuICAgIHJldHVybiBsYW5nID09PSAnemgtY24nXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjaGVja0lzQ2hpbmVzZSA9ICgpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBsYW5nID0gY2hyb21lLmkxOG4uZ2V0VUlMYW5ndWFnZSgpLnRvTG93ZXJDYXNlKClcbiAgICByZXR1cm4gbGFuZyA9PT0gJ3poLWNuJyB8fCBsYW5nID09PSAnemgtdHcnIHx8IGxhbmcgPT09ICd6aC1oaycgfHwgbGFuZyA9PT0gJ3poJ1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG4vKipcbiAqIGNoZWNrIGlmIGluIE1haW5sYW5kIENoaW5hXG4gKi9cbmV4cG9ydCBjb25zdCBpc0NOID0gKCkgPT4ge1xuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgQ09ORklHX0tFWSA9ICdjb25maWdWMSdcbmV4cG9ydCBpbnRlcmZhY2UgQ29uZmlnIHtcbiAgc2hvd0dvb2dsZUJ1dHRvbk9uQmluZzogYm9vbGVhblxuICBzaG93QmluZ0J1dHRvbk9uR29vZ2xlOiBib29sZWFuXG4gIHNob3dHdWlkZVRvR2l0aHViOiBib29sZWFuXG4gIHNob3dDaGF0OiBib29sZWFuXG4gIHRyaWdnZXJNb2RlOiAnQWx3YXlzJyB8ICdRdWVzdGlvbm1hcmsnIHwgJ01hbnVhbGx5J1xuICBjb252ZXJzYXRpb25TdHlsZTogQmluZy5Db252ZXJzYXRpb25TdHlsZVxufVxuZXhwb3J0IGNvbnN0IGdldENvbmZpZyA9IGFzeW5jICgpOiBQcm9taXNlPENvbmZpZz4gPT4ge1xuICBjb25zdCBjb25maWcgPSAoYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoQ09ORklHX0tFWSkpW0NPTkZJR19LRVldXG4gIHJldHVybiB7XG4gICAgc2hvd0dvb2dsZUJ1dHRvbk9uQmluZzogdHJ1ZSxcbiAgICBzaG93QmluZ0J1dHRvbk9uR29vZ2xlOiB0cnVlLFxuICAgIHNob3dHdWlkZVRvR2l0aHViOiB0cnVlLFxuICAgIHNob3dDaGF0OiB0cnVlLFxuICAgIHNob3dSZWxlYXNlOiB0cnVlLFxuICAgIHRyaWdnZXJNb2RlOiAnQWx3YXlzJyxcbiAgICBjb252ZXJzYXRpb25TdHlsZTogJ0JhbGFuY2VkJyxcbiAgICAuLi5jb25maWdcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgc2V0Q29uZmlnID0gYXN5bmMgKHZhbHVlczogUGFydGlhbDxDb25maWc+KSA9PiB7XG4gIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGdldENvbmZpZygpXG4gIGF3YWl0IGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHtcbiAgICBbQ09ORklHX0tFWV06IHtcbiAgICAgIC4uLmNvbmZpZyxcbiAgICAgIC4uLnZhbHVlc1xuICAgIH1cbiAgfSlcbn1cblxuZXhwb3J0IGNvbnN0IGVzY2FwZUh0bWwgPSAoczogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgcmV0dXJuIFN0cmluZyhzKVxuICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgICAucmVwbGFjZSgvXFwvL2csICcmI3gyZjsnKVxufVxuXG50eXBlIElNZXRob2RzID0gUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPGFueT4+XG5leHBvcnQgY29uc3QgcmVnaXN0cnlMaXN0ZW5lciA9IChjYWxsTWV0aG9kczogSU1ldGhvZHMpID0+IHtcbiAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChyZXEsIF9zZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIDsoYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gaWYgbm90IHJldHVybiB0cnVlIGltbWVkaWF0ZWx5XHVGRjBDd2lsbCB0aHJvdyBlcnJvciBgVW5jaGVja2VkIHJ1bnRpbWUubGFzdEVycm9yOiBUaGUgbWVzc2FnZSBwb3J0IGNsb3NlZCBiZWZvcmUgYSByZXNwb25zZSB3YXMgcmVjZWl2ZWQuYFxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBtZXRob2QsIGFyZ3MgfSA9IHJlcVxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2FsbE1ldGhvZHNbbWV0aG9kXSguLi5hcmdzKVxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBjb2RlOiAyMDAsIG1zZzogJ29rJywgZGF0YSB9KVxuICAgICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAgIGNvbnN0IGVyciA9IGUgPz8ge31cbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgY29kZTogNTAwLCBtc2c6IGVyci5zdGFjayA/PyBlcnIubWVzc2FnZSA/PyBlIH0pXG4gICAgICB9XG4gICAgfSkoKVxuICAgIHJldHVybiB0cnVlXG4gIH0pXG59XG5cbmV4cG9ydCBjb25zdCBjYWxsQmFja2dyb3VuZCA9IGFzeW5jIDxUID0gYW55PihtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10gPSBbXSk6IFByb21pc2U8VD4gPT4ge1xuICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKFxuICAgICAge1xuICAgICAgICBtZXRob2QsXG4gICAgICAgIGFyZ3M6IFsuLi5hcmdzXVxuICAgICAgfSxcbiAgICAgIChyZXMpID0+IHtcbiAgICAgICAgaWYgKCFyZXMgfHwgcmVzLmNvZGUgIT09IDIwMCkge1xuICAgICAgICAgIHJlamVjdChyZXM/Lm1zZylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKHJlcy5kYXRhKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9KVxufVxuXG5leHBvcnQgY29uc3QgbG9jYWxDYWNoZSA9ICgoKSA9PiB7XG4gIGNvbnN0IHYgPSAndjEnXG4gIHJldHVybiB7XG4gICAgZ2V0OiBhc3luYyA8VCA9IGFueT4oa2V5OiBzdHJpbmcpOiBQcm9taXNlPG51bGwgfCBUPiA9PiB7XG4gICAgICBrZXkgPSBgJHt2fToke2tleX1gXG4gICAgICBjb25zdCB7IGRhdGEsIG1heEFnZSwgbGFzdE1vZGlmaWVkIH0gPSAoYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KGtleSkpPy5ba2V5XSA/PyB7fVxuICAgICAgaWYgKERhdGUubm93KCkgLSBsYXN0TW9kaWZpZWQgPiBtYXhBZ2UgKiAxMDAwKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnJlbW92ZShrZXkpXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG4gICAgICByZXR1cm4gZGF0YVxuICAgIH0sXG5cbiAgICBzZXQ6IGFzeW5jIDxUID0gb2JqZWN0PihrZXk6IHN0cmluZywgZGF0YTogVCwgbWF4QWdlOiBudW1iZXIgPSBJbmZpbml0eSAvKiBcdTUzNTVcdTRGNERcdTc5RDIgKi8pOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgIGtleSA9IGAke3Z9OiR7a2V5fWBcbiAgICAgIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7XG4gICAgICAgIFtrZXldOiB7XG4gICAgICAgICAgZGF0YSxcbiAgICAgICAgICBsYXN0TW9kaWZpZWQ6IERhdGUubm93KCksXG4gICAgICAgICAgbWF4QWdlXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG59KSgpXG5cbmV4cG9ydCBjb25zdCB0b0RhdGFVcmwgPSBhc3luYyAodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGZldGNoKHVybClcbiAgICAgIC50aGVuKGFzeW5jIChyKSA9PiBhd2FpdCByLmJsb2IoKSlcbiAgICAgIC50aGVuKChibG9iKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQgYXMgc3RyaW5nKVxuICAgICAgICB9XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gcmVqZWN0XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGJsb2IpXG4gICAgICB9KVxuICB9KVxufVxuXG5jb25zdCB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50XG5jb25zdCB1c2VyQWdlbnREYXRhID0gKG5hdmlnYXRvciBhcyBhbnkpLnVzZXJBZ2VudERhdGFcblxuZXhwb3J0IGNvbnN0IGlzTWFjID0gdXNlckFnZW50LmluY2x1ZGVzKCdNYWNpbnRvc2gnKVxuZXhwb3J0IGNvbnN0IGlzRmlyZWZveCA9IHVzZXJBZ2VudC5pbmNsdWRlcygnRmlyZWZveCcpXG5leHBvcnQgY29uc3QgaXNFZGdlID0gdXNlckFnZW50LmluY2x1ZGVzKCdFZGcvJylcbmV4cG9ydCBjb25zdCBpc0JyYXZlID0gdXNlckFnZW50RGF0YT8uYnJhbmRzLmZpbmRJbmRleCgoaXRlbSkgPT4gaXRlbS5icmFuZCA9PT0gJ0JyYXZlJykgPiAtMVxuZXhwb3J0IGNvbnN0IGlzQ2hpbmVzZSA9IGNoZWNrSXNDaGluZXNlKClcbmV4cG9ydCBjb25zdCBpc1NpbXBsZUNoaW5lc2UgPSBjaGVja0lzU2ltcGxlQ2hpbmVzZSgpXG5leHBvcnQgY29uc3QgaXNDYW5hcnk6IGJvb2xlYW4gPSAhIWdsb2JhbFRoaXMuX19OQkFfaXNDYW5hcnlcbmV4cG9ydCBjb25zdCB2ZXJzaW9uOiBzdHJpbmcgPSBpc0NhbmFyeSA/IGAwLiR7cGtnVmVyc2lvbn1gIDogcGtnVmVyc2lvblxuXG5leHBvcnQgY29uc3QgZ2VuVUEgPSAoKSA9PiB7XG4gIGxldCB1YSA9IHVzZXJBZ2VudFxuICBpZiAoIWlzRWRnZSkge1xuICAgIGlmIChpc01hYykge1xuICAgICAgdWEgPSBgTW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLyR7TUFJTl9WRVJTSU9OfS4wLjAuMCBTYWZhcmkvNTM3LjM2IEVkZy8ke0ZVTExfVkVSU0lPTn1gXG4gICAgfSBlbHNlIHtcbiAgICAgIHVhID0gYE1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8ke01BSU5fVkVSU0lPTn0uMC4wLjAgU2FmYXJpLzUzNy4zNiBFZGcvJHtGVUxMX1ZFUlNJT059YFxuICAgIH1cbiAgfVxuICByZXR1cm4gdWFcbn1cblxuZXhwb3J0IGNvbnN0IGdlbklzc3VlVXJsID0gYXN5bmMgKGV4dHJhPzogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZD4pID0+IHtcbiAgY29uc3QgcmVwb3NpdG9yeVVybDogc3RyaW5nID0gcmVwb3NpdG9yeS51cmxcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWcgPSBhd2FpdCBnZXRDb25maWcoKVxuICAgIGNvbnN0IHVybDogc3RyaW5nID0gYCR7cmVwb3NpdG9yeVVybH0vaXNzdWVzL25ldz90aXRsZT0mYm9keT1gXG4gICAgbGV0IGZpbmFsVXJsOiBzdHJpbmcgPSB1cmxcbiAgICBsZXQgY29tbWVudCA9XG4gICAgICAnUGxlYXNlIHdyaXRlIHlvdXIgY29tbWVudCBBQk9WRSB0aGlzIGxpbmUsIHByb3ZpZGUgYXMgbXVjaCBkZXRhaWxlZCBpbmZvcm1hdGlvbiBhbmQgc2NyZWVuc2hvdHMgYXMgcG9zc2libGUuJyArXG4gICAgICAnVGhlIFVBIG1heSBub3QgbmVjZXNzYXJpbHkgcmVmbGVjdCB5b3VyIGFjdHVhbCBicm93c2VyIGFuZCBwbGF0Zm9ybSwgc28gcGxlYXNlIG1ha2Ugc3VyZSB0byBpbmRpY2F0ZSB0aGVtIGNsZWFybHkuJ1xuICAgIGlmIChpc0NoaW5lc2UpIHtcbiAgICAgIGNvbW1lbnQgPSAnXHU4QkY3XHU1NzI4XHU2QjY0XHU4ODRDXHU0RTBBXHU2NUI5XHU1M0QxXHU4ODY4XHU2MEE4XHU3Njg0XHU4QkE4XHU4QkJBXHUzMDAyXHU4QkU2XHU1QzNEXHU3Njg0XHU2M0NGXHU4RkYwXHU1NDhDXHU2MjJBXHU1NkZFXHU2NzA5XHU1MkE5XHU0RThFXHU2MjExXHU0RUVDXHU1QjlBXHU0RjREXHU5NUVFXHU5ODk4XHVGRjBDVUEgXHU0RTBEXHU0RTAwXHU1QjlBXHU3NzFGXHU1QjlFXHU1M0NEXHU2NjIwXHU2MEE4XHU3Njg0XHU2RDRGXHU4OUM4XHU1NjY4XHU1NDhDXHU1RTczXHU1M0YwXHVGRjBDXHU4QkY3XHU1OTA3XHU2Q0U4XHU2RTA1XHU2OTVBJ1xuICAgIH1cblxuICAgIGNvbnN0IGJvZHkgPVxuICAgICAgJyBcXG5cXG5cXG5cXG4nICtcbiAgICAgIGA8IS0tICAke2NvbW1lbnR9IC0tPlxcbmAgK1xuICAgICAgT2JqZWN0LmVudHJpZXM8c3RyaW5nPih7XG4gICAgICAgIFZlcnNpb246IGAke3ZlcnNpb259JHtpc0NhbmFyeSA/ICcgKENhbmFyeSknIDogJyd9IGAsXG4gICAgICAgIFVBOiBuYXZpZ2F0b3IudXNlckFnZW50LFxuICAgICAgICBMYW5nOiBjaHJvbWUuaTE4bi5nZXRVSUxhbmd1YWdlKCksXG4gICAgICAgIEFjY2VwdExhbmdzOiAoYXdhaXQgY2hyb21lLmkxOG4uZ2V0QWNjZXB0TGFuZ3VhZ2VzKCkpLmpvaW4oJywgJyksXG4gICAgICAgIGNvbmZpZzogSlNPTi5zdHJpbmdpZnkoY29uZmlnKSxcbiAgICAgICAgLi4uZXh0cmFcbiAgICAgIH0pXG4gICAgICAgIC5tYXAoKFtrZXksIHZhbF0pID0+IHtcbiAgICAgICAgICByZXR1cm4gdmFsID8gYCR7a2V5fTogJHt2YWx9YCA6ICcnXG4gICAgICAgIH0pXG4gICAgICAgIC5qb2luKCdcXG4nKVxuXG4gICAgZmluYWxVcmwgKz0gZW5jb2RlVVJJQ29tcG9uZW50KGJvZHkuc2xpY2UoMCwgMjAwMCkpXG4gICAgcmV0dXJuIGZpbmFsVXJsXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiByZXBvc2l0b3J5VXJsXG4gIH1cbn1cbiIsICJpbXBvcnQgeyBnZXRBbGxUYWJzLCBscywgdW5pcXVlIH0gZnJvbSAnQEAvdXRpbHMnXG5cbmV4cG9ydCBjb25zdCBkdW1wVGFicyA9IGFzeW5jICh7IHdpbmRvd0lkIH0pOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgY29uc3QgQVBQX1VSTCA9IGNocm9tZS5ydW50aW1lLmdldFVSTCgnYXBwL2luZGV4Lmh0bWwnKVxuXG4gIGNvbnN0IFtjdXJyZW50VGFicywgW2N1cnJlbnRUYWJdXSA9IGF3YWl0IFByb21pc2UuYWxsKFtnZXRBbGxUYWJzKCksIGNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0pXSlcblxuICBhd2FpdCBscy5zZXQoJ2N1cnJlbnRUYWJzJywgdW5pcXVlKGN1cnJlbnRUYWJzLCAndXJsJykpXG5cbiAgY29uc3QgdGFicyA9IGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHtcbiAgICB1cmw6IEFQUF9VUkwsXG4gICAgd2luZG93SWRcbiAgfSlcblxuICBsZXQgQXBwVGFiID0gdGFicy5maW5kKCh0YWIpID0+IHRhYi51cmwgPT09IEFQUF9VUkwpXG4gIGlmIChBcHBUYWIgPT0gbnVsbCkge1xuICAgIEFwcFRhYiA9IGF3YWl0IGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybDogQVBQX1VSTCB9KVxuICB9XG5cbiAgaWYgKEFwcFRhYi5pZCAhPSBudWxsKSB7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoW2Nocm9tZS50YWJzLm1vdmUoQXBwVGFiLmlkLCB7IGluZGV4OiAwIH0pLCBjaHJvbWUudGFicy51cGRhdGUoQXBwVGFiLmlkLCB7IGFjdGl2ZTogdHJ1ZSwgcGlubmVkOiB0cnVlIH0pXSlcbiAgfVxuXG4gIGNvbnN0IG9wZW5lZFRhYnMgPSBhd2FpdCBjaHJvbWUudGFicy5xdWVyeSh7IHdpbmRvd0lkIH0pXG5cbiAgb3BlbmVkVGFicy5mb3JFYWNoKGFzeW5jICh0YWIpID0+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKHRhYi5pZCA9PSBudWxsKSByZXR1cm5cbiAgICAgIGlmICh0YWIudXJsID09IG51bGwpIHJldHVyblxuICAgICAgaWYgKFsnY2hyb21lOi8vbmV3dGFiLyddLmluY2x1ZGVzKHRhYi51cmwpKSB7XG4gICAgICAgIGF3YWl0IGNocm9tZS50YWJzLnJlbW92ZSh0YWIuaWQpXG4gICAgICB9XG4gICAgICBpZiAodGFiLmlkID09PSBBcHBUYWI/LmlkKSByZXR1cm5cbiAgICAgIGlmICh0YWIucGlubmVkKSByZXR1cm5cbiAgICAgIGlmICh0YWIuYXVkaWJsZSA9PT0gdHJ1ZSkgcmV0dXJuXG4gICAgICBpZiAodGFiLmhpZ2hsaWdodGVkKSByZXR1cm5cbiAgICAgIGlmICh0YWIuYWN0aXZlKSByZXR1cm5cblxuICAgICAgaWYgKHRhYi5pZCA9PT0gY3VycmVudFRhYi5pZCkgcmV0dXJuXG5cbiAgICAgIGF3YWl0IGNocm9tZS50YWJzLnJlbW92ZSh0YWIuaWQpXG4gICAgfSBjYXRjaCB7fVxuICB9KVxufVxuXG5leHBvcnQgY29uc3QgZ2V0VVJMID0gKHVybDogc3RyaW5nID0gJycsIGJhc2U/OiBzdHJpbmcpOiBVUkwgPT4ge1xuICB0cnkge1xuICAgIHJldHVybiBuZXcgVVJMKHVybCwgYmFzZSlcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoZSlcbiAgICByZXR1cm4ge1xuICAgICAgc2VhcmNoUGFyYW1zOiB7XG4gICAgICAgIGdldDogKCkgPT4gbnVsbFxuICAgICAgfVxuICAgIH0gYXMgYW55XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGdldFVSTFNlYXJjaFBhcmFtcyA9ICh1cmw6IHN0cmluZyk6IFVSTFNlYXJjaFBhcmFtcyA9PiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG5ldyBVUkxTZWFyY2hQYXJhbXModXJsKVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge1xuICAgICAgZ2V0OiAoKSA9PiBudWxsXG4gICAgfSBhcyBhbnlcbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgb3BlblBhZ2UgPSBhc3luYyAodXJsOiBzdHJpbmcpOiBQcm9taXNlPGNocm9tZS50YWJzLlRhYj4gPT4ge1xuICBjb25zdCB0YWJzID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoeyBjdXJyZW50V2luZG93OiB0cnVlIH0pXG5cbiAgY29uc3QgdXJsT2JqID0gZ2V0VVJMKHVybClcbiAgbGV0IHRhYiA9IHRhYnMuZmluZCgodGFiKSA9PiB0YWIudXJsPy5zdGFydHNXaXRoKHVybE9iai5vcmlnaW4pKVxuXG4gIGlmICh0YWIgPT0gbnVsbCkge1xuICAgIHRhYiA9IGF3YWl0IGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybCB9KVxuICB9IGVsc2Uge1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgW1xuICAgICAgICBjaHJvbWUudGFicy5tb3ZlKHRhYi5pZCEsIHsgaW5kZXg6IHRhYnMubGVuZ3RoIC0gMSB9KSxcbiAgICAgICAgdGFiLnVybCAhPT0gdXJsICYmIGNocm9tZS50YWJzLnVwZGF0ZSh0YWIuaWQhLCB7IHVybCB9KSxcbiAgICAgICAgY2hyb21lLnRhYnMudXBkYXRlKHRhYi5pZCEsIHsgYWN0aXZlOiB0cnVlLCB1cmw6IHRhYi51cmwgIT09IHVybCA/IHVybCA6IHVuZGVmaW5lZCB9KVxuICAgICAgXS5maWx0ZXIoQm9vbGVhbilcbiAgICApXG4gIH1cbiAgcmV0dXJuIHRhYlxufVxuXG5leHBvcnQgY29uc3Qgc2V0Q29va2llID0gYXN5bmMgKG9wdGlvbnM6IGNocm9tZS5jb29raWVzLlNldERldGFpbHMsIGNvb2tpZTogY2hyb21lLmNvb2tpZXMuQ29va2llID0ge30gYXMgYW55KSA9PiB7XG4gIHJldHVybiBhd2FpdCBjaHJvbWUuY29va2llcy5zZXQoe1xuICAgIGRvbWFpbjogY29va2llLmRvbWFpbixcbiAgICBzdG9yZUlkOiBjb29raWUuc3RvcmVJZCxcbiAgICBwYXRoOiBjb29raWUucGF0aCxcbiAgICBodHRwT25seTogY29va2llLmh0dHBPbmx5LFxuICAgIHNlY3VyZTogY29va2llLnNlY3VyZSxcbiAgICBzYW1lU2l0ZTogY29va2llLnNhbWVTaXRlLFxuICAgIGV4cGlyYXRpb25EYXRlOiBjb29raWUuZXhwaXJhdGlvbkRhdGUsXG4gICAgLi4ub3B0aW9uc1xuICB9KVxufVxuIiwgImltcG9ydCB7IGdlbklzc3VlVXJsLCBpc0NoaW5lc2UgfSBmcm9tICdAQC91dGlscydcbmltcG9ydCB7IG9wZW5QYWdlIH0gZnJvbSAnLi91dGlscydcbi8vIGNvbnN0IHJlcG9zaXRvcnlVcmw6IHN0cmluZyA9IHJlcG9zaXRvcnkudXJsXG5cbnR5cGUgQ29udGV4dHMgPSBjaHJvbWUuY29udGV4dE1lbnVzLkNvbnRleHRUeXBlW11cbmludGVyZmFjZSBJSW5pdENvbnRleHRNZW51IHtcbiAgdGl0bGU6IHN0cmluZ1xuICBjb250ZXh0czogQ29udGV4dHNcbiAgb25jbGljazogKGluZm86IGNocm9tZS5jb250ZXh0TWVudXMuT25DbGlja0RhdGEsIHRhYjogY2hyb21lLnRhYnMuVGFiIHwgdW5kZWZpbmVkKSA9PiB2b2lkXG59XG5cbmNvbnN0IGNvbnRleHRNZW51czogUmVjb3JkPHN0cmluZywgSUluaXRDb250ZXh0TWVudT4gPSB7XG4gIC8vIHZlcnNpb246IHtcbiAgLy8gICB0aXRsZTogYFx1RDgzRVx1RERDMyBWZXJzaW9uOiAke3ZlcnNpb259YCxcbiAgLy8gICBjb250ZXh0czogWydhY3Rpb24nXSxcbiAgLy8gICBvbmNsaWNrOiAoKSA9PiB7XG4gIC8vICAgICBvcGVuUGFnZShgJHtyZXBvc2l0b3J5VXJsfS9yZWxlYXNlcy90YWcvJHt2ZXJzaW9ufWApXG4gIC8vICAgfVxuICAvLyB9LFxuICBvcGVuQ2hhdDoge1xuICAgIHRpdGxlOiAnXHVEODNEXHVEQ0FDIE5ldyBCaW5nJyxcbiAgICBjb250ZXh0czogWydhY3Rpb24nXSxcbiAgICBvbmNsaWNrOiAoX2luZm8pID0+IHtcbiAgICAgIG9wZW5QYWdlKCdodHRwczovL3d3dy5iaW5nLmNvbS9zZWFyY2g/cT1CaW5nK0FJJnNob3djb252PTEnKVxuICAgIH1cbiAgfSxcblxuICBvcGVuSW1hZ2VDcmVhdGU6IHtcbiAgICB0aXRsZTogJ1x1RDgzRFx1RERCQ1x1RkUwRiBOZXcgQmluZyBJbWFnZSBDcmVhdG9yJyxcbiAgICBjb250ZXh0czogWydhY3Rpb24nXSxcbiAgICBvbmNsaWNrOiAoX2luZm8pID0+IHtcbiAgICAgIG9wZW5QYWdlKCdodHRwczovL3d3dy5iaW5nLmNvbS9jcmVhdGUnKVxuICAgIH1cbiAgfSxcblxuICBsaWtlSXQ6IHtcbiAgICB0aXRsZTogJ1x1Mjc2NFx1RkUwRiBMaWtlIGl0JyxcbiAgICBjb250ZXh0czogWydhY3Rpb24nXSxcbiAgICBvbmNsaWNrOiAoKSA9PiB7XG4gICAgICBvcGVuUGFnZSgnaHR0cHM6Ly9jaHJvbWUuZ29vZ2xlLmNvbS93ZWJzdG9yZS9kZXRhaWwvbmV3LWJpbmctYW55d2hlcmUvaGNlb2Joam9rcGRib2dqa3BsbWZqZW9ta2Vja2tuZ2kvcmV2aWV3cycpXG4gICAgfVxuICB9LFxuXG4gIHJlcG9ydElzc3Vlczoge1xuICAgIHRpdGxlOiBpc0NoaW5lc2UgPyAnXHVEODNEXHVEQzFCIFx1NTNDRFx1OTk4OFx1NUVGQVx1OEJBRScgOiAnXHVEODNEXHVEQzFCIFJlcG9ydCBpc3N1ZXMnLFxuICAgIGNvbnRleHRzOiBbJ2FjdGlvbiddLFxuICAgIG9uY2xpY2s6IGFzeW5jIChfaW5mbykgPT4ge1xuICAgICAgY29uc3QgdXJsID0gYXdhaXQgZ2VuSXNzdWVVcmwoKVxuXG4gICAgICBvcGVuUGFnZSh1cmwpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgY2hyb21lLmNvbnRleHRNZW51cy5yZW1vdmVBbGwoKCkgPT4ge1xuICAgIGZvciAoY29uc3QgW2lkLCBtZW51XSBvZiBPYmplY3QuZW50cmllcyhjb250ZXh0TWVudXMpKSB7XG4gICAgICBjaHJvbWUuY29udGV4dE1lbnVzLmNyZWF0ZSh7XG4gICAgICAgIGlkLFxuICAgICAgICB0aXRsZTogbWVudS50aXRsZSxcbiAgICAgICAgY29udGV4dHM6IG1lbnUuY29udGV4dHNcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIGNocm9tZS5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKChpbmZvLCB0YWIpID0+IHtcbiAgICBjb25zdCB7IG1lbnVJdGVtSWQgfSA9IGluZm9cbiAgICBjb25zdCBpdGVtID0gY29udGV4dE1lbnVzW21lbnVJdGVtSWRdXG4gICAgaWYgKGl0ZW0/Lm9uY2xpY2spIGl0ZW0ub25jbGljayhpbmZvLCB0YWIpXG4gIH0pXG59XG4iLCAiY29uc3QgTUFYX0FHRSA9IDEwMDAgKiA2MCAqIDYwICogMSAvLyAxIGhvdXJcbmNvbnN0IEtFWSA9ICdub3RpZmljYXRpb24nXG5jb25zdCBGTEFHX0tFWSA9ICdub3RpZmljYXRpb246aGlkZSdcbmNvbnN0IGdldFJlbW90ZU5vdGlmaWNhdGlvbiA9IGFzeW5jICgpID0+IHtcbiAgLy8gY29uc29sZS5sb2coJ2dldFJlbW90ZU5vdGlmaWNhdGlvbicpXG4gIGxldCBkYXRhXG4gIHRyeSB7XG4gICAgZGF0YSA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL2hhb3ppL05ldy1CaW5nLUFueXdoZXJlL2lzc3Vlcy8yNCcpLnRoZW4oYXN5bmMgKHJlcykgPT4gYXdhaXQgcmVzLmpzb24oKSlcbiAgfSBjYXRjaCB7fVxuICByZXR1cm4gZGF0YVxufVxuXG5leHBvcnQgY29uc3QgZ2V0Tm90aWZpY2F0aW9uID0gYXN5bmMgKCkgPT4ge1xuICBjb25zdCB7IFtLRVldOiBvbGREYXRhIH0gPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoS0VZKVxuXG4gIGlmICghb2xkRGF0YSB8fCAob2xkRGF0YS5sYXN0TW9kaWZ5ICYmIERhdGUubm93KCkgLSBvbGREYXRhLmxhc3RNb2RpZnkgPiBNQVhfQUdFKSkge1xuICAgIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnJlbW92ZShLRVkpXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFJlbW90ZU5vdGlmaWNhdGlvbigpXG5cbiAgICBpZiAoZGF0YSkge1xuICAgICAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgW0tFWV06IHsgZGF0YSwgbGFzdE1vZGlmeTogRGF0ZS5ub3coKSB9IH0pXG4gICAgfVxuICB9XG5cbiAgY29uc3QgeyBbRkxBR19LRVldOiBmbGFnLCBbS0VZXTogbmV3RGF0YSB9ID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFtGTEFHX0tFWSwgS0VZXSlcblxuICBpZiAoIW5ld0RhdGE/LmRhdGEpIHJldHVybiBudWxsXG4gIGlmICghKG5ld0RhdGEuZGF0YS50aXRsZSAmJiBuZXdEYXRhLmRhdGEuc3RhdGUgPT09ICdvcGVuJykpIHJldHVybiBudWxsXG4gIGlmIChmbGFnID09PSAxICYmIG5ld0RhdGEuZGF0YS50aXRsZSA9PT0gb2xkRGF0YS5kYXRhPy50aXRsZSkgcmV0dXJuIG51bGxcbiAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwucmVtb3ZlKEZMQUdfS0VZKVxuICByZXR1cm4gbmV3RGF0YS5kYXRhXG59XG5cbmV4cG9ydCBjb25zdCBoaWRlTm90aWZpY2F0aW9uID0gYXN5bmMgKCkgPT4ge1xuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBbRkxBR19LRVldOiAxIH0pXG59XG4iLCAiaW1wb3J0IHsgdmVyc2lvbiB9IGZyb20gJ0BAL3V0aWxzJ1xuaW1wb3J0IHsgZ2V0VVJMIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBnZXROb3RpZmljYXRpb24sIGhpZGVOb3RpZmljYXRpb24gfSBmcm9tICcuL19ub3RpZmljYXRpb24nXG5cbmNvbnN0IGdldEVudiA9IGFzeW5jICgpID0+IHtcbiAgcmV0dXJuIHtcbiAgICB2ZXJzaW9uXG4gIH1cbn1cblxuY29uc3Qgb3BlblVybEluU2FtZVRhYiA9IGFzeW5jICh7IHVybCB9OiB7IHVybDogc3RyaW5nIH0gPSB7fSBhcyBhbnkpID0+IHtcbiAgY29uc3QgdGFicyA9IGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHsgY3VycmVudFdpbmRvdzogdHJ1ZSB9KVxuICBjb25zdCB1cmxPYmogPSBnZXRVUkwodXJsKVxuICBsZXQgdGFiID0gdGFicy5maW5kKCh0YWIpID0+IHRhYi51cmw/LnN0YXJ0c1dpdGgodXJsT2JqLm9yaWdpbikpXG4gIGlmICh0YWIgPT0gbnVsbCkge1xuICAgIHRhYiA9IGF3YWl0IGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybCB9KVxuICB9IGVsc2Uge1xuICAgIGlmICh0YWIuaWQgIT0gbnVsbCkge1xuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW2Nocm9tZS50YWJzLm1vdmUodGFiLmlkLCB7IGluZGV4OiB0YWJzLmxlbmd0aCAtIDEgfSksIGNocm9tZS50YWJzLnVwZGF0ZSh0YWIuaWQsIHsgYWN0aXZlOiB0cnVlIH0pXSlcbiAgICB9XG4gIH1cblxuICBsZXQgbmV3VXJsID0gdXJsXG4gIGxldCBxdWVyeSA9ICcnXG4gIGxldCB0YWJRdWVyeSA9ICcnXG4gIGNvbnN0IGlzR29vZ2xlID0gdXJsT2JqLmhvc3RuYW1lID09PSAnd3d3Lmdvb2dsZS5jb20nXG4gIGNvbnN0IGlzQmluZyA9IHVybE9iai5ob3N0bmFtZSA9PT0gJ3d3dy5iaW5nLmNvbSdcbiAgaWYgKGlzR29vZ2xlKSB7XG4gICAgcXVlcnkgPSB1cmxPYmouc2VhcmNoUGFyYW1zLmdldCgncScpID8/ICcnXG4gICAgdGFiUXVlcnkgPSBnZXRVUkwodGFiLnVybCkuc2VhcmNoUGFyYW1zLmdldCgncScpID8/ICcnXG4gICAgZ2V0VVJMKHRhYi51cmwpLnNlYXJjaFBhcmFtcy5nZXQoJ3EnKVxuICB9IGVsc2UgaWYgKGlzQmluZykge1xuICAgIHF1ZXJ5ID0gdXJsT2JqLnNlYXJjaFBhcmFtcy5nZXQoJ3EnKSA/PyAnJ1xuICAgIHRhYlF1ZXJ5ID0gZ2V0VVJMKHRhYi51cmwpLnNlYXJjaFBhcmFtcy5nZXQoJ3EnKSA/PyAnJ1xuICB9XG5cbiAgcXVlcnkgPSBxdWVyeS50cmltKClcbiAgdGFiUXVlcnkgPSB0YWJRdWVyeS50cmltKClcblxuICBpZiAocXVlcnkgJiYgcXVlcnkgPT09IHRhYlF1ZXJ5KSByZXR1cm4gLy8gXHU0RTBEXHU1MjM3XHU2NUIwXHU5ODc1XHU5NzYyXG5cbiAgaWYgKGlzR29vZ2xlKSB7XG4gICAgbmV3VXJsID0gYCR7dXJsT2JqLm9yaWdpbn0ke3VybE9iai5wYXRobmFtZX0/cT0ke2VuY29kZVVSSUNvbXBvbmVudChxdWVyeSl9YFxuICB9IGVsc2UgaWYgKGlzQmluZykge1xuICAgIG5ld1VybCA9IGAke3VybE9iai5vcmlnaW59JHt1cmxPYmoucGF0aG5hbWV9P3E9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfWBcbiAgICAvLyBuZXdVcmwgPSBgJHt1cmxPYmoub3JpZ2lufSR7dXJsT2JqLnBhdGhuYW1lfT9xPSR7cXVlcnl9JnNob3djb252PTFgXG4gIH1cblxuICBhd2FpdCBjaHJvbWUudGFicy51cGRhdGUodGFiLmlkISwgeyB1cmw6IG5ld1VybCB9KVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGdldEVudixcbiAgb3BlblVybEluU2FtZVRhYixcblxuICBnZXROb3RpZmljYXRpb24sXG4gIGhpZGVOb3RpZmljYXRpb25cbn1cbiIsICJpbXBvcnQgeyBCQU5EX01LVFMsIEJJTkcgfSBmcm9tICdAQC9jb25zdGFudHMnXG5pbXBvcnQgeyBpc0NhbmFyeSwgcmVnaXN0cnlMaXN0ZW5lciwgdmVyc2lvbiwgZ2V0Q29uZmlnIH0gZnJvbSAnQEAvdXRpbHMnXG5cbmltcG9ydCB7IHJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nXG5pbXBvcnQgaW5pdENvbnRleHRNZW51IGZyb20gJy4vY29udGV4dF9tZW51cydcbmltcG9ydCBsaXN0ZW5lcnMgZnJvbSAnLi9saXN0ZW5lcnMnXG5pbXBvcnQgeyBnZXRVUkxTZWFyY2hQYXJhbXMsIG9wZW5QYWdlLCBzZXRDb29raWUgfSBmcm9tICcuL3V0aWxzJ1xuXG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7XG4gIGluaXRDb250ZXh0TWVudSgpXG4gIHJlZ2lzdHJ5TGlzdGVuZXIobGlzdGVuZXJzKVxuXG4gIGNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKGFzeW5jIChkZXRhaWxzKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0gYXdhaXQgZ2V0Q29uZmlnKClcbiAgICBjb25zdCByZXBvc2l0b3J5VXJsOiBzdHJpbmcgPSByZXBvc2l0b3J5LnVybFxuICAgIC8vIGNvbnN0IGRlYnVndXJsID0gJ2h0dHBzOi8vd3d3LmJpbmcuY29tL3NlYXJjaD9xPUVkZ2UlMjAlRTQlQjglOEIlRTglQkQlQkQmc2hvd2NvbnY9MSZGT1JNPWhwY29keCdcbiAgICAvLyBpZiAoZGVidWd1cmwpIHtcbiAgICAvLyAgIG9wZW5QYWdlKGRlYnVndXJsKVxuICAgIC8vICAgcmV0dXJuXG4gICAgLy8gfVxuICAgIGlmIChpc0NhbmFyeSkge1xuICAgICAgb3BlblBhZ2UoYCR7cmVwb3NpdG9yeVVybH0vdHJlZS9jYW5hcnlgKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChkZXRhaWxzLnJlYXNvbiA9PT0gJ2luc3RhbGwnKSB7XG4gICAgICBvcGVuUGFnZShyZXBvc2l0b3J5VXJsKVxuICAgIH0gZWxzZSBpZiAoZGV0YWlscy5yZWFzb24gPT09ICd1cGRhdGUnICYmIGNvbmZpZy5zaG93UmVsZWFzZSkge1xuICAgICAgb3BlblBhZ2UoYCR7cmVwb3NpdG9yeVVybH0vcmVsZWFzZXMvdGFnL3Yke3ZlcnNpb259YClcbiAgICB9XG4gIH0pXG5cbiAgY2hyb21lLndlYlJlcXVlc3Qub25CZWZvcmVSZXF1ZXN0LmFkZExpc3RlbmVyKFxuICAgICgpID0+IHtcbiAgICAgIGNocm9tZS5jb29raWVzLmdldChcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdfRURHRV9TJyxcbiAgICAgICAgICB1cmw6IEJJTkdcbiAgICAgICAgfSxcbiAgICAgICAgKGNvb2tpZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gY29va2llPy52YWx1ZVxuICAgICAgICAgIGlmICghdmFsdWUpIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgdmFsdWVPYmogPSBnZXRVUkxTZWFyY2hQYXJhbXModmFsdWUpXG4gICAgICAgICAgY29uc3QgbWt0ID0gdmFsdWVPYmouZ2V0KCdta3QnKT8udG9Mb3dlckNhc2UoKSA/PyAnJ1xuXG4gICAgICAgICAgaWYgKCFCQU5EX01LVFMubWFwKChtKSA9PiBtLnRvTG93ZXJDYXNlKCkpLmluY2x1ZGVzKG1rdCkpIHJldHVyblxuICAgICAgICAgIGlmIChta3QgPT09ICd6aC1jbicpIHtcbiAgICAgICAgICAgIHZhbHVlT2JqLnNldCgnbWt0JywgJ3poLUhLJylcbiAgICAgICAgICAgIHZhbHVlT2JqLnNldCgndWknLCAnemgtaGFucycpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlT2JqLmRlbGV0ZSgnbWt0JylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZXRDb29raWUoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHVybDogQklORyxcbiAgICAgICAgICAgICAgbmFtZTogY29va2llLm5hbWUsXG4gICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZU9iai50b1N0cmluZygpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29va2llXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICApXG5cbiAgICAgIGNocm9tZS5jb29raWVzLmdldChcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdfUndCZicsXG4gICAgICAgICAgdXJsOiBCSU5HXG4gICAgICAgIH0sXG4gICAgICAgIChjb29raWUpID0+IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGNvb2tpZT8udmFsdWVcbiAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICBzZXRDb29raWUoe1xuICAgICAgICAgICAgICB1cmw6IEJJTkcsXG4gICAgICAgICAgICAgIG5hbWU6ICdfUndCZicsXG4gICAgICAgICAgICAgIHZhbHVlOiAnd2xzPTInLFxuICAgICAgICAgICAgICBkb21haW46ICcuYmluZy5jb20nLFxuICAgICAgICAgICAgICBodHRwT25seTogdHJ1ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHZhbHVlT2JqID0gZ2V0VVJMU2VhcmNoUGFyYW1zKHZhbHVlKVxuICAgICAgICAgIGNvbnN0IHdscyA9IHZhbHVlT2JqLmdldCgnd2xzJylcbiAgICAgICAgICBpZiAod2xzICE9PSAnMicgJiYgd2xzICE9PSAnJykge1xuICAgICAgICAgICAgdmFsdWVPYmouc2V0KCd3bHMnLCAnMicpXG4gICAgICAgICAgfVxuICAgICAgICAgIHNldENvb2tpZShcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdXJsOiBCSU5HLFxuICAgICAgICAgICAgICBuYW1lOiAnX1J3QmYnLFxuICAgICAgICAgICAgICBkb21haW46ICcuYmluZy5jb20nLFxuICAgICAgICAgICAgICBodHRwT25seTogdHJ1ZSxcbiAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlT2JqLnRvU3RyaW5nKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb29raWVcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9LFxuICAgIHsgdXJsczogW0JJTkcgKyAnKiddLCB0eXBlczogWydtYWluX2ZyYW1lJ10gfVxuICApXG59XG4iLCAiaW1wb3J0IHsgQUxMX1JFU09VUkNFX1RZUEVTIH0gZnJvbSAnQEAvY29uc3RhbnRzJ1xuXG5pbXBvcnQgeyBnZW5VQSB9IGZyb20gJ0BAL3V0aWxzJ1xuXG5jb25zdCBNT0RJRllfSEVBREVSU19MSVNUID0ge1xuICAvLyAnWC1Gb3J3YXJkZWQtRm9yJzogJzguOC44LjgnLFxuICAnVXNlci1BZ2VudCc6IGdlblVBKClcbn1cbmNvbnN0IE1PRElGWV9IRUFERVJTID0gJ21vZGlmeUhlYWRlcnMnIGFzIGNocm9tZS5kZWNsYXJhdGl2ZU5ldFJlcXVlc3QuUnVsZUFjdGlvblR5cGUuTU9ESUZZX0hFQURFUlNcbi8vIGNvbnN0IFJFRElSRUNUID0gJ3JlZGlyZWN0JyBhcyBjaHJvbWUuZGVjbGFyYXRpdmVOZXRSZXF1ZXN0LlJ1bGVBY3Rpb25UeXBlLlJFRElSRUNUXG4vLyBjb25zdCBBUFBFTkQgPSAnYXBwZW5kJyBhcyBjaHJvbWUuZGVjbGFyYXRpdmVOZXRSZXF1ZXN0LkhlYWRlck9wZXJhdGlvbi5BUFBFTkRcbi8vIGNvbnN0IFJFTU9WRSA9ICdyZW1vdmUnIGFzIGNocm9tZS5kZWNsYXJhdGl2ZU5ldFJlcXVlc3QuSGVhZGVyT3BlcmF0aW9uLlJFTU9WRVxuY29uc3QgU0VUID0gJ3NldCcgYXMgY2hyb21lLmRlY2xhcmF0aXZlTmV0UmVxdWVzdC5IZWFkZXJPcGVyYXRpb24uU0VUXG5cbmV4cG9ydCBjb25zdCBkeW5hbWljUnVsZXMgPSBbXG4gIHtcbiAgICBwcmlvcml0eTogMjAwMSxcbiAgICBhY3Rpb246IHtcbiAgICAgIHR5cGU6IE1PRElGWV9IRUFERVJTLFxuICAgICAgcmVxdWVzdEhlYWRlcnM6IE9iamVjdC5lbnRyaWVzKE1PRElGWV9IRUFERVJTX0xJU1QpLm1hcCgoW2hlYWRlciwgdmFsdWVdKSA9PiAoe1xuICAgICAgICBvcGVyYXRpb246IFNFVCxcbiAgICAgICAgaGVhZGVyLFxuICAgICAgICB2YWx1ZVxuICAgICAgfSkpXG4gICAgfSxcbiAgICBjb25kaXRpb246IHtcbiAgICAgIHJlcXVlc3REb21haW5zOiBbJ2JpbmcuY29tJywgJ3d3dy5iaW5nLmNvbScsICdjbi5iaW5nLmNvbSddLFxuICAgICAgcmVzb3VyY2VUeXBlczogQUxMX1JFU09VUkNFX1RZUEVTXG4gICAgfVxuICB9XG5dXG4gIC5maWx0ZXIoQm9vbGVhbilcbiAgLm1hcCgocnVsZSwgaW5kZXgpID0+ICh7XG4gICAgaWQ6IGluZGV4ICsgMSArIDIwMDAsXG4gICAgLi4ucnVsZVxuICB9KSkgYXMgY2hyb21lLmRlY2xhcmF0aXZlTmV0UmVxdWVzdC5SdWxlW11cblxuZXhwb3J0IGRlZmF1bHQgKCkgPT4ge1xuICBpZiAoIWR5bmFtaWNSdWxlcy5sZW5ndGgpIHJldHVyblxuXG4gIGNocm9tZS5kZWNsYXJhdGl2ZU5ldFJlcXVlc3QuZ2V0RHluYW1pY1J1bGVzKChkUnVsZXMpID0+IHtcbiAgICAvLyBjb25zb2xlLmxvZygxMTEsIGRSdWxlcylcbiAgICAvLyBjb25zb2xlLmxvZygyMjIsIFsuLi5uZXcgU2V0KFsuLi5ydWxlcy5tYXAoKHJ1bGUpID0+IHJ1bGUuaWQpLCAuLi5kUnVsZXMubWFwKChydWxlKSA9PiBydWxlLmlkKV0pXSlcblxuICAgIGNocm9tZS5kZWNsYXJhdGl2ZU5ldFJlcXVlc3QudXBkYXRlRHluYW1pY1J1bGVzKHtcbiAgICAgIHJlbW92ZVJ1bGVJZHM6IFsuLi5uZXcgU2V0KFsuLi5keW5hbWljUnVsZXMubWFwKChydWxlKSA9PiBydWxlLmlkKSwgLi4uZFJ1bGVzLm1hcCgocnVsZSkgPT4gcnVsZS5pZCldKV0sXG4gICAgICBhZGRSdWxlczogZHluYW1pY1J1bGVzXG4gICAgfSlcbiAgICAvLyAudGhlbigoKSA9PiB7XG4gICAgLy8gICBjaHJvbWUuZGVjbGFyYXRpdmVOZXRSZXF1ZXN0LmdldER5bmFtaWNSdWxlcygoZFJ1bGVzKSA9PiB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKDMzMywgZFJ1bGVzKVxuICAgIC8vICAgfSlcbiAgICAvLyB9KVxuICB9KVxuXG4gIC8vIGNocm9tZS5kZWNsYXJhdGl2ZU5ldFJlcXVlc3Qub25SdWxlTWF0Y2hlZERlYnVnLmFkZExpc3RlbmVyKCguLi5hcmdzKSA9PiB7XG4gIC8vICAgY29uc29sZS5sb2coMTExMSwgLi4uYXJncylcbiAgLy8gfSlcbn1cbiIsICJpbXBvcnQgeyBDTl9SRURJUkVDVF9VUkwgfSBmcm9tICdAQC9jb25zdGFudHMnXG5pbXBvcnQgY3Jvc3NQbGF0Zm9ybSBmcm9tICcuL2Nyb3NzX3BsYXRmb3JtJ1xuaW1wb3J0IGluaXREeW5hbWljUnVsZXMgZnJvbSAnLi9keW5hbWljX3J1bGVzJ1xuaW1wb3J0IHsgaXNTaW1wbGVDaGluZXNlIH0gZnJvbSAnQEAvdXRpbHMnXG5cbmNyb3NzUGxhdGZvcm0oKVxuXG5jaHJvbWUucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoZGV0YWlscykgPT4ge1xuICBpbml0RHluYW1pY1J1bGVzKClcbn0pXG5cbmlmIChpc1NpbXBsZUNoaW5lc2UpIHtcbiAgY2hyb21lLnJ1bnRpbWUuc2V0VW5pbnN0YWxsVVJMKENOX1JFRElSRUNUX1VSTClcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQUFPLE1BQU0sT0FBTztBQUNiLE1BQU0sa0JBQWtCO0FBQ3hCLE1BQU0sWUFBWSxDQUFDLFNBQVMsTUFBTSxPQUFPO0FBRXpDLE1BQU0sZUFBZTtBQUNyQixNQUFNLGVBQWU7QUFFckIsTUFBTSxxQkFBcUI7QUFBQSxJQUNoQztBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjs7O0FDckJFLGdCQUFXO0FBSVgsbUJBQWM7QUFBQSxJQUNaLE1BQVE7QUFBQSxJQUNSLEtBQU87QUFBQSxFQUNUOzs7QUMrRkssTUFBTSx1QkFBdUIsTUFBTTtBQUN4QyxRQUFJO0FBQ0Ys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USxPQUFPLFFBQVEsSUFBSTtBQUM3Qix1QkFBUyxJQUFJLE9BQU8sR0FBRztBQUFBLFlBQ3pCO0FBQ0E7QUFBQSxjQUNFO0FBQUEsZ0JBQ0UsS0FBSztBQUFBLGdCQUNMLE1BQU07QUFBQSxnQkFDTixRQUFRO0FBQUEsZ0JBQ1IsVUFBVTtBQUFBLGdCQUNWLE9BQU8sU0FBUyxTQUFTO0FBQUEsY0FDM0I7QUFBQSxjQUNBO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsRUFBRSxNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRTtBQUFBLElBQzlDO0FBQUEsRUFDRjs7O0FDbEdBLE1BQU0sc0JBQXNCO0FBQUE7QUFBQSxJQUUxQixjQUFjLE1BQU07QUFBQSxFQUN0QjtBQUNBLE1BQU0saUJBQWlCO0FBSXZCLE1BQU0sTUFBTTtBQUVMLE1BQU0sZUFBZTtBQUFBLElBQzFCO0FBQUEsTUFDRSxVQUFVO0FBQUEsTUFDVixRQUFRO0FBQUEsUUFDTixNQUFNO0FBQUEsUUFDTixnQkFBZ0IsT0FBTyxRQUFRLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSyxPQUFPO0FBQUEsVUFDNUUsV0FBVztBQUFBLFVBQ1g7QUFBQSxVQUNBO0FBQUEsUUFDRixFQUFFO0FBQUEsTUFDSjtBQUFBLE1BQ0EsV0FBVztBQUFBLFFBQ1QsZ0JBQWdCLENBQUMsWUFBWSxnQkFBZ0IsYUFBYTtBQUFBLFFBQzFELGVBQWU7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFBQSxFQUNGLEVBQ0csT0FBTyxPQUFPLEVBQ2QsSUFBSSxDQUFDLE1BQU0sV0FBVztBQUFBLElBQ3JCLElBQUksUUFBUSxJQUFJO0FBQUEsSUFDaEIsR0FBRztBQUFBLEVBQ0wsRUFBRTtBQUVKLE1BQU8sd0JBQVEsTUFBTTtBQUNuQixRQUFJLENBQUMsYUFBYTtBQUFRO0FBRTFCLFdBQU8sc0JBQXNCLGdCQUFnQixDQUFDLFdBQVc7QUFJdkQsYUFBTyxzQkFBc0IsbUJBQW1CO0FBQUEsUUFDOUMsZUFBZSxDQUFDLEdBQUcsb0JBQUksSUFBSSxDQUFDLEdBQUcsYUFBYSxJQUFJLENBQUMsU0FBUyxLQUFLLEVBQUUsR0FBRyxHQUFHLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQUEsUUFDdEcsVUFBVTtBQUFBLE1BQ1osQ0FBQztBQUFBLElBTUgsQ0FBQztBQUFBLEVBS0g7OztBQ3JEQSx5QkFBYztBQUVkLFNBQU8sUUFBUSxZQUFZLFlBQVksQ0FBQyxZQUFZO0FBQ2xELDBCQUFpQjtBQUFBLEVBQ25CLENBQUM7QUFFRCxNQUFJLGlCQUFpQjtBQUNuQixXQUFPLFFBQVEsZ0JBQWdCLGVBQWU7QUFBQSxFQUNoRDsiLAogICJuYW1lcyI6IFsidmVyc2lvbiIsICJ0YWIiLCAidmVyc2lvbiIsICJ0YWIiLCAidmVyc2lvbiJdCn0K
