"use strict";
(() => {
  // package.json
  var version = "2.0.2";
  var extensionName = "New Bing Anywhere (Bing Chat GPT-4)";

  // src/universe/utils.ts
  var checkIsGoogle = () => {
    return location.hostname.includes("google");
  };
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
  var setConfig = async (values) => {
    const config = await getConfig();
    await chrome.storage.sync.set({
      [CONFIG_KEY]: {
        ...config,
        ...values
      }
    });
  };
  var escapeHtml = (s) => {
    return String(s).replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\//g, "&#x2f;");
  };
  var callBackground = async (method, args = []) => {
    return await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          method,
          args: [...args]
        },
        (res) => {
          if (!res || res.code !== 200) {
            reject(res?.msg);
          } else {
            resolve(res.data);
          }
        }
      );
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

  // src/content_script/utils.ts
  var openUrlInSameTab = async (url) => {
    try {
      return await callBackground("openUrlInSameTab", [{ url }]);
    } catch (e) {
      location.href = url;
    }
  };
  var mutationConfig = { attributes: true, childList: true, subtree: true };
  var $ = (s, parent = document) => parent.querySelector(s);
  var $w = async (domSelector, timeout = 30, parent = document) => {
    return await new Promise((resolve) => {
      const $dom = $(domSelector, parent);
      if ($dom) {
        resolve($dom);
        return;
      }
      const observer = new MutationObserver((_mutationList, observer2) => {
        const $dom2 = $(domSelector, parent);
        if ($dom2) {
          observer2.disconnect();
          resolve($dom2);
        }
      });
      observer.observe(document, mutationConfig);
      setTimeout(() => {
        const $dom2 = $(domSelector, parent);
        observer.disconnect();
        resolve($dom2);
      }, timeout * 1e3);
    });
  };

  // src/content_script/bing-handler.ts
  var bing_handler_default = async ($2) => {
    if (!isEdge) {
      const document2 = window.document;
      const s = document2.createElement("script");
      s.src = chrome.runtime.getURL("inject.js");
      s.onload = s.remove;
      document2.documentElement.appendChild(s);
    }
    $2(() => {
      ;
      (async () => {
        const { showGuideToGithub } = await getConfig();
        if (!showGuideToGithub)
          return;
        const $esatSwitch = $2("#est_switch");
        if ($2.trim($esatSwitch.text()) !== "\u56FD\u5185\u7248\u56FD\u9645\u7248")
          return;
        setTimeout(() => {
          const $a = $2(
            '<a href="https://github.com/haozi/New-Bing-Anywhere/issues/8" title="\u67E5\u770B\u5982\u4F55\u6B63\u786E\u914D\u7F6E\u7F51\u7EDC\u4EE3\u7406" target="_blank" rel="noopener noreferrer nofollow">\u4F9D\u7136\u51FA\u73B0\u56FD\u5185\u7248/\u56FD\u9645\u7248\uFF1F</a>'
          ).css({
            color: "#E89ABE",
            textShadow: "0.5px 0.1px 1px #58070D",
            fontSize: "12px",
            fontWeight: "lighter"
          }).click(() => {
            setConfig({ showGuideToGithub: false });
          });
          $2("#est_switch").append($a).css("width", "auto");
        }, 2e3);
      })();
    });
    if (!location.href.startsWith("https://www.bing.com/search?"))
      return;
    const config = await getConfig();
    $w("#sb_form").then(() => {
      callBackground("getNotification").then((note) => {
        if (!note)
          return;
        const $body = $2(document.body);
        const $div = $2("<div/>").css({
          width: "100%",
          height: 40,
          border: "1px solid #590727",
          background: "#58070d",
          position: "fixed",
          top: 0,
          fontSize: "12px",
          lineHeight: "40px",
          textAlign: "center",
          zIndex: 99999,
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          display: "block !important"
        });
        const close = () => {
          $div.remove();
          $body.css("padding-top", null);
        };
        const $a2 = $2(
          `<a style="color:#fff; background:url(${chrome.runtime.getURL(
            "images/bing_32x32.png"
          )}) no-repeat left 0; background-size: 12px; padding-left: 20px" href="${note.html_url}" target="_blank" rel="noopener noreferrer nofollow">${note.title}</a>`
        ).on("click", close);
        const $close = $2(
          '<a href="#" style="background:#58070d; color:#fff; cursor:pointer;padding: 0 68px 0 18px;position: absolute;right:0" title="no reminder">\u2715</a>'
        ).on("click", (e) => {
          e.preventDefault();
          confirm("Are you sure never see this notice again?") && callBackground("hideNotification");
          close();
        });
        $div.append($a2).append($close);
        $body.append($div).css("padding-top", 40);
      });
      $2(document.body).on("click", "a.b_logoArea", (e) => {
        const $this = $2(e.currentTarget);
        $this.attr("href", "/").attr("target", "_self");
      });
      if (!config.showGoogleButtonOnBing)
        return;
      const $q = $2("#sb_form_q");
      const searchQuery = $q.val();
      const $a = $2(`
      <a href="https://www.google.com/search?q=${encodeURIComponent(
        escapeHtml(searchQuery)
      )}" target="google" tabindex="10" rel="noopener noreferrer nofollow" title="search with Google">
        <img src="${chrome.runtime.getURL("images/google.png")}" alt="google" style="width: 100%;display: block;">
      </a>`).css({
        position: "absolute",
        left: 0,
        top: 0,
        width: "70px",
        height: "23px",
        display: "inline-block",
        "z-index": 999,
        transition: "all .3s",
        transform: "translate3d(835px, 13px, 0px)",
        "will-change": "transform",
        cursor: "pointer"
      });
      $2("#sb_form").css("position", "relative").prepend($a);
      $a.on("click", async (e) => {
        const $this = $2(e.currentTarget);
        e.preventDefault();
        let val = "";
        if (!val) {
          val = $q.val().trim();
        }
        const url = `https://www.google.com/search?q=${encodeURIComponent(val)}`;
        $this.attr("href", url);
        await openUrlInSameTab(url);
      });
      if (location.search.includes("showconv=1")) {
        $a.css("display", "none");
        setTimeout(() => {
          $a.css("display", "inline-block");
        }, 1200);
      }
      const changeGoogleLinkPosition = () => {
        const $conv = $2("#b-scopeListItem-conv");
        const isNewBingOpen = $conv.hasClass("b_active");
        if (isNewBingOpen) {
          let left = 0;
          if ($conv.offset().left) {
            left = $conv.offset().left + $conv.width() + 30;
          } else {
            left = 350;
          }
          $a.css({
            transform: `translate3d(${left}px, 15px, 0)`
          });
        } else {
          $a.css({
            transform: "translate3d(835px, 15px, 0)"
          });
        }
        if (!isNewBingOpen && $2(".b_searchboxForm").hasClass("as_rsform")) {
          $a.css({
            transform: "translate3d(1155px, 15px, 0)"
          });
        }
      };
      changeGoogleLinkPosition();
      new MutationObserver((mutationList, observer) => {
        for (const mutation of mutationList) {
          const target = mutation.target;
          if (!target)
            continue;
          if (target.id === "b-scopeListItem-conv") {
            changeGoogleLinkPosition();
          }
          if (target.classList.contains("b_searchboxForm")) {
            changeGoogleLinkPosition();
          }
        }
      }).observe(document.getElementById("b_header"), mutationConfig);
    });
  };

  // src/content_script/chat-handler.ts
  var isGoogle = checkIsGoogle();
  var chat_handler_default = async ($2, config) => {
    let prompt = "";
    if (isGoogle) {
      prompt = new URLSearchParams(location.search).get("q") ?? "";
    }
    const extra = new URLSearchParams(location.hash.slice(1)).get("new-bing-anywhere") ?? "";
    const qs = {
      prompt: prompt.trim(),
      extra
    };
    const chatIframeUrl = chrome.runtime.getURL(`/app/index.html#/chat/iframe?${new URLSearchParams(qs).toString()}`);
    try {
      const $ifame = $2(`<iframe src="${chatIframeUrl}" scrolling="no" />`);
      $ifame.css({
        // position: 'fixed',
        // right: '0px',
        // zIndex: '999',
        width: "100%",
        border: "none",
        overflow: "hidden",
        boxSizing: "border-box",
        willChange: "height",
        transition: "height .1s cubic-bezier(0, 0, 0, 1.27) 0s",
        borderRadius: "12px"
      });
      window.addEventListener("message", (e) => {
        const { type, data } = e.data;
        if (type !== "nba-resize")
          return;
        const { height } = data;
        $ifame.css({
          // width,
          height
        });
      });
      let $sidebar;
      $sidebar = $2(await $w("#rhs", 1));
      if (!$sidebar.length) {
        $sidebar = $2('<div id="rhs" />').css({
          //  marginBottom: '20px', marginLeft: '30px', height: 'fit-content'
          marginLeft: "var(--rhs-margin)",
          flex: "0 auto",
          width: "var(--rhs-width)",
          position: "relative",
          paddingBottom: "15px",
          transition: "opacity 0.3s"
        });
      }
      const $bestContainer = $2(await $w(".liYKde.g.VjDLd", 0.1));
      if ($bestContainer.length) {
        $bestContainer.prepend($ifame);
      } else {
        $sidebar.prepend($ifame);
      }
      const main = await $w("#center_col");
      $sidebar.insertAfter(main);
      $2(main).after($sidebar);
    } catch {
    }
  };

  // src/content_script/google-handler.ts
  var google_handler_default = async ($2) => {
    const config = await getConfig();
    if (!config.showBingButtonOnGoogle)
      return;
    if (!(location.href.startsWith("https://www.google.com/search?") || location.href.startsWith("https://www.google.com.hk/search?"))) {
      return;
    }
    $w('[action="/search"]').then((form) => {
      if (!form)
        return;
      const $form = $2(form);
      const $q = $form.find('[name="q"]');
      const $submit = $form.find('button[type="submit"]');
      const $a = $2(`
      <a href="https://www.bing.com/search?q=Bing+AI&showconv=1" rel="noopener noreferrer nofollow" target="bing" title="search with New Bing">
        <img src="${chrome.runtime.getURL("images/bing-chat.svg")}" style="display: block; width: 24px;" alt="bing" />
      </a>`).css({
        width: "40px",
        display: "flex",
        position: "relative",
        "z-index": 999,
        cursor: "pointer",
        "justify-content": "center",
        margin: "0 10px 0 -10px"
      });
      $submit.after($a);
      $a.on("click", async (e) => {
        const $this = $2(e.currentTarget);
        e.preventDefault();
        const url = `https://www.bing.com/search?q=${encodeURIComponent($q.val())}&showconv=1`;
        $this.attr("href", url);
        await openUrlInSameTab(url);
      });
    });
  };

  // src/content_script/index.ts
  (async ($2) => {
    const $document = $2(document.documentElement);
    if ($document.find(`meta[name="${extensionName}"]`).length)
      return;
    const $meta = $2(`<meta name="${extensionName}" />`);
    $document.prepend($meta);
    callBackground("getEnv").then((env) => {
      $meta.attr("content", env.version);
    });
    getConfig().then((config) => {
      if (config.showChat) {
        chat_handler_default($2, config);
      }
    });
    if (location.hostname === "www.bing.com") {
      bing_handler_default($2);
    }
    if (location.hostname.startsWith("www.google.")) {
      google_handler_default($2);
    }
  })(window.Zepto);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vcGFja2FnZS5qc29uIiwgIi4uLy4uL3NyYy91bml2ZXJzZS91dGlscy50cyIsICIuLi8uLi9zcmMvY29udGVudF9zY3JpcHQvdXRpbHMudHMiLCAiLi4vLi4vc3JjL2NvbnRlbnRfc2NyaXB0L2JpbmctaGFuZGxlci50cyIsICIuLi8uLi9zcmMvY29udGVudF9zY3JpcHQvY2hhdC1oYW5kbGVyLnRzIiwgIi4uLy4uL3NyYy9jb250ZW50X3NjcmlwdC9nb29nbGUtaGFuZGxlci50cyIsICIuLi8uLi9zcmMvY29udGVudF9zY3JpcHQvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcbiAgXCJuYW1lXCI6IFwibmV3LWJpbmctYW55d2hlcmVcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMi4wLjJcIixcbiAgXCJwcml2YXRlXCI6IHRydWUsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJOZXcgQmluZyBpc24ndCBqdXN0IGZvciBFZGdlIGFueW1vcmUuIEFueXdoZXJlIHlvdSB3YW50XCIsXG4gIFwiaG9tZXBhZ2VcIjogXCJodHRwczovL2dpdGh1Yi5jb20vaGFvemkvTmV3LUJpbmctQW55d2hlcmVcIixcbiAgXCJyZXBvc2l0b3J5XCI6IHtcbiAgICBcInR5cGVcIjogXCJnaXRcIixcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9oYW96aS9OZXctQmluZy1Bbnl3aGVyZVwiXG4gIH0sXG4gIFwibGljZW5zZVwiOiBcIkdQTHYzXCIsXG4gIFwiYXV0aG9yXCI6IFwiaGFvemlcIixcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImJ1aWxkXCI6IFwicm0gLXJmIGRpc3QgJiYgbWtkaXIgLXAgZGlzdCAmJiBwbnBtIHJ1biBsaW50ICYmIHBucG0gcnVuIGJ1aWxkOmJ1bmRsZVwiLFxuICAgIFwiYnVpbGQ6YnVuZGxlXCI6IFwiTk9ERV9FTlY9cHJvZHVjdGlvbiB2aXRlLW5vZGUgc2NyaXB0cy9idWlsZC50cyAtLSBidWlsZFwiLFxuICAgIFwiY29weVwiOiBcInJtIC1yZiBkaXN0ICYmIGNwIC1yIHB1YmxpYyBkaXN0XCIsXG4gICAgXCJjb3B5OnNvcnVjZVwiOiBcInJzeW5jIC12aHJhIC4gZGlzdC9zb3VyY2UgLS1pbmNsdWRlPScqKi5naXRpZ25vcmUnIC0tZXhjbHVkZT0nLy5naXQnIC0tZXhjbHVkZT0nZGlzdCcgIC0tZmlsdGVyPSc6LSAuZ2l0aWdub3JlJyAtLWRlbGV0ZS1hZnRlclwiLFxuICAgIFwiY29weTp3YXRjaFwiOiBcInBucG0gcnVuIGNvcHkgLS0gLS13YXRjaFwiLFxuICAgIFwiZGV2XCI6IFwicG5wbSBydW4gbGludCAmJiBwbnBtIHJ1biAnL15kZXY6LiovJ1wiLFxuICAgIFwiZGV2OmFwcFwiOiBcInBucG0gLS1maWx0ZXIgYXBwIHJ1biBkZXZcIixcbiAgICBcImRldjpidW5kbGVcIjogXCJ2aXRlLW5vZGUgc2NyaXB0cy9idWlsZC50cyAtLSBkZXZcIixcbiAgICBcImxpbnRcIjogXCJwbnBtIHJ1biBwcmV0dGllciAmJiBwbnBtIHJ1biAnL15saW50Oi4qLydcIixcbiAgICBcImxpbnQ6ZXNsaW50XCI6IFwiZXNsaW50IC0tZXh0IC5qcywudHMgLi9zcmMgLS1maXggLS1jYWNoZVwiLFxuICAgIFwibGludDpzdHlsdXNcIjogXCJzdHlsdXMtc3VwcmVtYWN5IGZvcm1hdCAuL3NyYy8qKi8qLnN0eWwgIC0tb3B0aW9ucyAuL3N0eWx1cy1zdXByZW1hY3kuanNvbiAtLXJlcGxhY2VcIixcbiAgICBcInByZXBhcmVcIjogXCJodXNreSBpbnN0YWxsICYmIHBucG0gcnVuIGJ1aWxkXCIsXG4gICAgXCJwcmV0dGllclwiOiBcInByZXR0aWVyIC0tY2FjaGUgLS13cml0ZSAuXCIsXG4gICAgXCJwcmV0dGllcjp3YXRjaFwiOiBcIm9uY2hhbmdlIFxcXCIqKi8qXFxcIiAtLSBwcmV0dGllciAtLWNhY2hlIC0td3JpdGUgLS1pZ25vcmUtdW5rbm93biAtLWlnbm9yZS1wYXRoIC5wcmV0dGllcmlnbm9yZSB7e2NoYW5nZWR9fSA+IC9kZXYvbnVsbCAyPiYxXCIsXG4gICAgXCJ0ZXN0XCI6IFwicG5wbSBydW4gbGludFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkB0eXBlcy96ZXB0b1wiOiBcIl4xLjAuMzNcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAdHlwZXMvY2hyb21lXCI6IFwiXjAuMC4yMzdcIixcbiAgICBcIkB0eXBlcy9mcy1leHRyYVwiOiBcIl4xMS4wLjFcIixcbiAgICBcIkB0eXBlcy9ub2RlXCI6IFwiXjIwLjMuMVwiLFxuICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L2VzbGludC1wbHVnaW5cIjogXCJeNS41OS4xMVwiLFxuICAgIFwiY29weS1hbmQtd2F0Y2hcIjogXCJeMC4xLjZcIixcbiAgICBcImVzYnVpbGRcIjogXCJeMC4xOC4zXCIsXG4gICAgXCJlc2J1aWxkLXBsdWdpbi1zdmdyXCI6IFwiXjIuMC4wXCIsXG4gICAgXCJlc2J1aWxkLXN0eWxlLXBsdWdpblwiOiBcIl4xLjYuMlwiLFxuICAgIFwiZXNsaW50XCI6IFwiXjguNDIuMFwiLFxuICAgIFwiZXNsaW50LWNvbmZpZy1zdGFuZGFyZC13aXRoLXR5cGVzY3JpcHRcIjogXCJeMzUuMC4wXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLWltcG9ydFwiOiBcIl4yLjI3LjVcIixcbiAgICBcImVzbGludC1wbHVnaW4tblwiOiBcIl4xNi4wLjBcIixcbiAgICBcImVzbGludC1wbHVnaW4tbm9kZVwiOiBcIl4xMS4xLjBcIixcbiAgICBcImVzbGludC1wbHVnaW4tcHJldHRpZXJcIjogXCJeNC4yLjFcIixcbiAgICBcImVzbGludC1wbHVnaW4tcHJvbWlzZVwiOiBcIl42LjEuMVwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1yZWFjdFwiOiBcIl43LjMyLjJcIixcbiAgICBcImZzLWV4dHJhXCI6IFwiXjExLjEuMVwiLFxuICAgIFwiaHVza3lcIjogXCJeOC4wLjNcIixcbiAgICBcIm1kNS1maWxlXCI6IFwiXjUuMC4wXCIsXG4gICAgXCJvbmNoYW5nZVwiOiBcIl43LjEuMFwiLFxuICAgIFwicHJldHRpZXJcIjogXCJeMi44LjhcIixcbiAgICBcInNvcnQtcGFja2FnZS1qc29uXCI6IFwiXjIuNC4xXCIsXG4gICAgXCJzdHlsdXNcIjogXCJeMC41OS4wXCIsXG4gICAgXCJzdHlsdXMtc3VwcmVtYWN5XCI6IFwiXjIuMTcuNVwiLFxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjEuM1wiLFxuICAgIFwidml0ZS1ub2RlXCI6IFwiXjAuMzIuMVwiXG4gIH0sXG4gIFwiZW5naW5lc1wiOiB7XG4gICAgXCJub2RlXCI6IFwiXjIwLjMuMFwiLFxuICAgIFwicG5wbVwiOiBcIl44LjYuMlwiXG4gIH0sXG4gIFwiZXh0ZW5zaW9uLWkxOG5cIjoge1xuICAgIFwiZW5cIjoge1xuICAgICAgXCJleHRlbnNpb25OYW1lXCI6IFwiTmV3IEJpbmcgQW55d2hlcmUgKEJpbmcgQ2hhdCBHUFQtNClcIixcbiAgICAgIFwiZXh0ZW5zaW9uRGVzY3JpcHRpb25cIjogXCJOZXcgQmluZyBDaGF0IGNhbiBiZSB1c2VkIGluIGFueSBicm93c2VyLCB3aXRoIGFueSBzZWFyY2ggZW5naW5lLCBhbmQgaW4gYW55IGNvdW50cnkuXCJcbiAgICB9LFxuICAgIFwiemhfQ05cIjoge1xuICAgICAgXCJleHRlbnNpb25OYW1lXCI6IFwiTmV3IEJpbmcgQW55d2hlcmUgKEJpbmcgQ2hhdCBHUFQtNClcIixcbiAgICAgIFwiZXh0ZW5zaW9uRGVzY3JpcHRpb25cIjogXCJOZXcgQmluZyBDaGF0IGNhbiBiZSB1c2VkIGluIGFueSBicm93c2VyLCB3aXRoIGFueSBzZWFyY2ggZW5naW5lLCBhbmQgaW4gYW55IGNvdW50cnkuIFx1OTY4Rlx1NjVGNlx1OTY4Rlx1NTczMFx1RkYwQ1x1NjcwOVx1NkM0Mlx1NUZDNVx1NUU5NFx1MzAwMlwiXG4gICAgfSxcbiAgICBcInpoX1RXXCI6IHtcbiAgICAgIFwiZXh0ZW5zaW9uTmFtZVwiOiBcIk5ldyBCaW5nIEFueXdoZXJlIChCaW5nIENoYXQgR1BULTQpXCIsXG4gICAgICBcImV4dGVuc2lvbkRlc2NyaXB0aW9uXCI6IFwiTmV3IEJpbmcgQ2hhdCBjYW4gYmUgdXNlZCBpbiBhbnkgYnJvd3Nlciwgd2l0aCBhbnkgc2VhcmNoIGVuZ2luZSwgYW5kIGluIGFueSBjb3VudHJ5LiBcdTk2QThcdTY2NDJcdTk2QThcdTU3MzBcdUZGMENcdTY3MDlcdTZDNDJcdTVGQzVcdTYxQzlcIlxuICAgIH0sXG4gICAgXCJydVwiOiB7XG4gICAgICBcImV4dGVuc2lvbk5hbWVcIjogXCJOZXcgQmluZyBBbnl3aGVyZSAoQmluZyBDaGF0IEdQVC00KVwiLFxuICAgICAgXCJleHRlbnNpb25EZXNjcmlwdGlvblwiOiBcIlx1MDQyN1x1MDQzMFx1MDQ0MiBOZXcgQmluZyBcdTA0M0NcdTA0M0VcdTA0MzZcdTA0MzVcdTA0NDIgXHUwNDM4XHUwNDQxXHUwNDNGXHUwNDNFXHUwNDNCXHUwNDRDXHUwNDM3XHUwNDNFXHUwNDMyXHUwNDMwXHUwNDQyXHUwNDRDXHUwNDQxXHUwNDRGIFx1MDQzMiBcdTA0M0JcdTA0NEVcdTA0MzFcdTA0M0VcdTA0M0MgXHUwNDMxXHUwNDQwXHUwNDMwXHUwNDQzXHUwNDM3XHUwNDM1XHUwNDQwXHUwNDM1LCBcdTA0NDEgXHUwNDNCXHUwNDRFXHUwNDMxXHUwNDRCXHUwNDNDIFx1MDQzRlx1MDQzRVx1MDQzOFx1MDQ0MVx1MDQzQVx1MDQzRVx1MDQzMlx1MDQ0Qlx1MDQzQyBcdTA0MzRcdTA0MzJcdTA0MzhcdTA0MzZcdTA0M0FcdTA0M0VcdTA0M0MgXHUwNDM4IFx1MDQzMiBcdTA0M0JcdTA0NEVcdTA0MzFcdTA0M0VcdTA0MzkgXHUwNDQxXHUwNDQyXHUwNDQwXHUwNDMwXHUwNDNEXHUwNDM1LlwiXG4gICAgfVxuICB9LFxuICBcImV4dGVuc2lvbk5hbWVcIjogXCJOZXcgQmluZyBBbnl3aGVyZSAoQmluZyBDaGF0IEdQVC00KVwiXG59XG4iLCAiaW1wb3J0IHsgdmVyc2lvbiBhcyBwa2dWZXJzaW9uLCByZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuaW1wb3J0IHsgRlVMTF9WRVJTSU9OLCBNQUlOX1ZFUlNJT04gfSBmcm9tICcuL2NvbnN0YW50cydcbmltcG9ydCB7IHR5cGUgQmluZyB9IGZyb20gJy4vdHlwZXMnXG5cbmV4cG9ydCBjb25zdCBjaGVja0lzR29vZ2xlID0gKCkgPT4ge1xuICByZXR1cm4gbG9jYXRpb24uaG9zdG5hbWUuaW5jbHVkZXMoJ2dvb2dsZScpXG59XG5leHBvcnQgY29uc3QgbHMgPSB7XG4gIHNldDogYXN5bmMgPFQgPSBhbnk+KGtleTogc3RyaW5nLCB2YWx1ZTogVCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IEtFWSA9IGBOQkFAJHtlbmNvZGVVUklDb21wb25lbnQoa2V5KX1gXG4gICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldChcbiAgICAgICAge1xuICAgICAgICAgIFtLRVldOiB2YWx1ZVxuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpXG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9KVxuICB9LFxuICBnZXQ6IGFzeW5jIDxUID0gYW55PihrZXk6IHN0cmluZyk6IFByb21pc2U8VCB8IHVuZGVmaW5lZD4gPT4ge1xuICAgIGNvbnN0IEtFWSA9IGBOQkFAJHtlbmNvZGVVUklDb21wb25lbnQoa2V5KX1gXG4gICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoW0tFWV0sIChyZXN1bHQpID0+IHtcbiAgICAgICAgcmVzb2x2ZShyZXN1bHRbS0VZXSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSxcbiAgcmVtb3ZlOiBhc3luYyAoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICBjb25zdCBLRVkgPSBgTkJBQCR7ZW5jb2RlVVJJQ29tcG9uZW50KGtleSl9YFxuICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5yZW1vdmUoW0tFWV0pXG4gICAgICByZXNvbHZlKHVuZGVmaW5lZClcbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBnZXRBbGxUYWJzID0gYXN5bmMgKHF1ZXJ5SW5mbzogY2hyb21lLnRhYnMuUXVlcnlJbmZvID0geyBzdGF0dXM6ICdjb21wbGV0ZScgfSk6IFByb21pc2U8SVRhYltdPiA9PiB7XG4gIGNvbnN0IG5ld1RhYnM6IElUYWJbXSA9IChhd2FpdCBjaHJvbWUudGFicy5xdWVyeShxdWVyeUluZm8pKSBhcyBJVGFiW11cbiAgY29uc3Qgb2xkVGFiczogSVRhYltdID0gdW5pcXVlKChhd2FpdCBscy5nZXQ8SVRhYltdPignY3VycmVudFRhYnMnKSkhKVxuICBmb3IgKGNvbnN0IG5ld1RhYiBvZiBuZXdUYWJzKSB7XG4gICAgZm9yIChjb25zdCBvbGRUYWIgb2Ygb2xkVGFicykge1xuICAgICAgaWYgKG9sZFRhYi51cmwgIT0gbnVsbCAmJiBvbGRUYWIudXJsID09PSBuZXdUYWIudXJsKSB7XG4gICAgICAgIG5ld1RhYi4kZXh0cmEgPSBvbGRUYWIuJGV4dHJhXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGxldCB0YWJzID0gbmV3VGFicy5jb25jYXQob2xkVGFicylcbiAgdGFicyA9IHRhYnMuZmlsdGVyKCh0YWIpID0+IHtcbiAgICBjb25zdCB1cmwgPSB0YWIudXJsID8/ICcnXG4gICAgcmV0dXJuIHVybC5zdGFydHNXaXRoKCdodHRwJykgfHwgdXJsLnN0YXJ0c1dpdGgoJ2Nocm9tZS1leHRlbnNpb246Ly8nKVxuICB9KVxuICB0YWJzLmZvckVhY2goKHRhYikgPT4ge1xuICAgIGlmICh0YWIudXJsID09IG51bGwpIHJldHVyblxuICAgIHRhYi51cmwgPSB0YWIudXJsLnJlcGxhY2UoLyMuKiQvLCAnJylcbiAgfSlcbiAgdGFicyA9IHVuaXF1ZSh0YWJzLCAndXJsJykuc2xpY2UoMCwgNTAwMClcbiAgcmV0dXJuIHRhYnNcbn1cblxuZXhwb3J0IGNvbnN0IHVuaXF1ZSA9IDxUPihhcnI6IFRbXSwga2V5OiBzdHJpbmcgPSAndXJsJyk6IFRbXSA9PiB7XG4gIGNvbnN0IG1hcCA9IG5ldyBNYXAoKVxuICByZXR1cm4gYXJyLmZpbHRlcigoaXRlbTogYW55KSA9PiB7XG4gICAgaWYgKG1hcC5oYXMoaXRlbVtrZXldKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSBlbHNlIHtcbiAgICAgIG1hcC5zZXQoaXRlbVtrZXldLCB0cnVlKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH0pXG59XG5cbmV4cG9ydCB0eXBlIElUYWIgPSBjaHJvbWUudGFicy5UYWIgJiB7XG4gICRleHRyYT86IHtcbiAgICBsYXN0TW9kaWZpZWQ6IG51bWJlclxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBmaW5kU2FtZVVybFRhYiA9IGFzeW5jICh1cmw/OiBzdHJpbmcsIHF1ZXJ5SW5mbzogY2hyb21lLnRhYnMuUXVlcnlJbmZvID0ge30pOiBQcm9taXNlPGNocm9tZS50YWJzLlRhYiB8IG51bGw+ID0+IHtcbiAgaWYgKCF1cmwpIHJldHVybiBudWxsXG4gIGNvbnN0IG9wZW5lZFRhYnMgPSBhd2FpdCBjaHJvbWUudGFicy5xdWVyeShxdWVyeUluZm8pXG4gIHJldHVybiAoXG4gICAgb3BlbmVkVGFicy5maW5kKChvcGVuZWRUYWIpID0+IHtcbiAgICAgIGlmICghb3BlbmVkVGFiLnVybCkgcmV0dXJuIGZhbHNlXG4gICAgICByZXR1cm4gbm9ybWFsaXplVXJsKG9wZW5lZFRhYi51cmwpID09PSB1cmxcbiAgICB9KSA/PyBudWxsXG4gIClcbn1cblxuZXhwb3J0IGNvbnN0IG5vcm1hbGl6ZVVybCA9ICh1cmw6IHN0cmluZyA9ICcnKTogc3RyaW5nID0+IHtcbiAgcmV0dXJuIHVybC5yZXBsYWNlKC8jLiokLywgJycpXG59XG5cbmV4cG9ydCBjb25zdCBzbGVlcCA9IGFzeW5jIChkZWxheTogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0VGltZW91dChyZXNvbHZlLCBkZWxheSlcbiAgfSlcbn1cblxuLyoqXG4gKiBjaGVjayBpZiBpcyBDaGluZXNlXG4gKi9cbmV4cG9ydCBjb25zdCBjaGVja0lzU2ltcGxlQ2hpbmVzZSA9ICgpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBsYW5nID0gY2hyb21lLmkxOG4uZ2V0VUlMYW5ndWFnZSgpLnRvTG93ZXJDYXNlKClcbiAgICByZXR1cm4gbGFuZyA9PT0gJ3poLWNuJ1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY2hlY2tJc0NoaW5lc2UgPSAoKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgbGFuZyA9IGNocm9tZS5pMThuLmdldFVJTGFuZ3VhZ2UoKS50b0xvd2VyQ2FzZSgpXG4gICAgcmV0dXJuIGxhbmcgPT09ICd6aC1jbicgfHwgbGFuZyA9PT0gJ3poLXR3JyB8fCBsYW5nID09PSAnemgtaGsnIHx8IGxhbmcgPT09ICd6aCdcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuLyoqXG4gKiBjaGVjayBpZiBpbiBNYWlubGFuZCBDaGluYVxuICovXG5leHBvcnQgY29uc3QgaXNDTiA9ICgpID0+IHtcbiAgcmV0dXJuIGZhbHNlXG59XG5cbmNvbnN0IENPTkZJR19LRVkgPSAnY29uZmlnVjEnXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZyB7XG4gIHNob3dHb29nbGVCdXR0b25PbkJpbmc6IGJvb2xlYW5cbiAgc2hvd0JpbmdCdXR0b25Pbkdvb2dsZTogYm9vbGVhblxuICBzaG93R3VpZGVUb0dpdGh1YjogYm9vbGVhblxuICBzaG93Q2hhdDogYm9vbGVhblxuICB0cmlnZ2VyTW9kZTogJ0Fsd2F5cycgfCAnUXVlc3Rpb25tYXJrJyB8ICdNYW51YWxseSdcbiAgY29udmVyc2F0aW9uU3R5bGU6IEJpbmcuQ29udmVyc2F0aW9uU3R5bGVcbn1cbmV4cG9ydCBjb25zdCBnZXRDb25maWcgPSBhc3luYyAoKTogUHJvbWlzZTxDb25maWc+ID0+IHtcbiAgY29uc3QgY29uZmlnID0gKGF3YWl0IGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KENPTkZJR19LRVkpKVtDT05GSUdfS0VZXVxuICByZXR1cm4ge1xuICAgIHNob3dHb29nbGVCdXR0b25PbkJpbmc6IHRydWUsXG4gICAgc2hvd0JpbmdCdXR0b25Pbkdvb2dsZTogdHJ1ZSxcbiAgICBzaG93R3VpZGVUb0dpdGh1YjogdHJ1ZSxcbiAgICBzaG93Q2hhdDogdHJ1ZSxcbiAgICBzaG93UmVsZWFzZTogdHJ1ZSxcbiAgICB0cmlnZ2VyTW9kZTogJ0Fsd2F5cycsXG4gICAgY29udmVyc2F0aW9uU3R5bGU6ICdCYWxhbmNlZCcsXG4gICAgLi4uY29uZmlnXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHNldENvbmZpZyA9IGFzeW5jICh2YWx1ZXM6IFBhcnRpYWw8Q29uZmlnPikgPT4ge1xuICBjb25zdCBjb25maWcgPSBhd2FpdCBnZXRDb25maWcoKVxuICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7XG4gICAgW0NPTkZJR19LRVldOiB7XG4gICAgICAuLi5jb25maWcsXG4gICAgICAuLi52YWx1ZXNcbiAgICB9XG4gIH0pXG59XG5cbmV4cG9ydCBjb25zdCBlc2NhcGVIdG1sID0gKHM6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIHJldHVybiBTdHJpbmcocylcbiAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1xcLy9nLCAnJiN4MmY7Jylcbn1cblxudHlwZSBJTWV0aG9kcyA9IFJlY29yZDxzdHJpbmcsICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxhbnk+PlxuZXhwb3J0IGNvbnN0IHJlZ2lzdHJ5TGlzdGVuZXIgPSAoY2FsbE1ldGhvZHM6IElNZXRob2RzKSA9PiB7XG4gIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigocmVxLCBfc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICA7KGFzeW5jICgpID0+IHtcbiAgICAgIC8vIGlmIG5vdCByZXR1cm4gdHJ1ZSBpbW1lZGlhdGVseVx1RkYwQ3dpbGwgdGhyb3cgZXJyb3IgYFVuY2hlY2tlZCBydW50aW1lLmxhc3RFcnJvcjogVGhlIG1lc3NhZ2UgcG9ydCBjbG9zZWQgYmVmb3JlIGEgcmVzcG9uc2Ugd2FzIHJlY2VpdmVkLmBcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgbWV0aG9kLCBhcmdzIH0gPSByZXFcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNhbGxNZXRob2RzW21ldGhvZF0oLi4uYXJncylcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgY29kZTogMjAwLCBtc2c6ICdvaycsIGRhdGEgfSlcbiAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICBjb25zdCBlcnIgPSBlID8/IHt9XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IGNvZGU6IDUwMCwgbXNnOiBlcnIuc3RhY2sgPz8gZXJyLm1lc3NhZ2UgPz8gZSB9KVxuICAgICAgfVxuICAgIH0pKClcbiAgICByZXR1cm4gdHJ1ZVxuICB9KVxufVxuXG5leHBvcnQgY29uc3QgY2FsbEJhY2tncm91bmQgPSBhc3luYyA8VCA9IGFueT4obWV0aG9kOiBzdHJpbmcsIGFyZ3M6IGFueVtdID0gW10pOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kLFxuICAgICAgICBhcmdzOiBbLi4uYXJnc11cbiAgICAgIH0sXG4gICAgICAocmVzKSA9PiB7XG4gICAgICAgIGlmICghcmVzIHx8IHJlcy5jb2RlICE9PSAyMDApIHtcbiAgICAgICAgICByZWplY3QocmVzPy5tc2cpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzb2x2ZShyZXMuZGF0YSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfSlcbn1cblxuZXhwb3J0IGNvbnN0IGxvY2FsQ2FjaGUgPSAoKCkgPT4ge1xuICBjb25zdCB2ID0gJ3YxJ1xuICByZXR1cm4ge1xuICAgIGdldDogYXN5bmMgPFQgPSBhbnk+KGtleTogc3RyaW5nKTogUHJvbWlzZTxudWxsIHwgVD4gPT4ge1xuICAgICAga2V5ID0gYCR7dn06JHtrZXl9YFxuICAgICAgY29uc3QgeyBkYXRhLCBtYXhBZ2UsIGxhc3RNb2RpZmllZCB9ID0gKGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChrZXkpKT8uW2tleV0gPz8ge31cbiAgICAgIGlmIChEYXRlLm5vdygpIC0gbGFzdE1vZGlmaWVkID4gbWF4QWdlICogMTAwMCkge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5yZW1vdmUoa2V5KVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfVxuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9LFxuXG4gICAgc2V0OiBhc3luYyA8VCA9IG9iamVjdD4oa2V5OiBzdHJpbmcsIGRhdGE6IFQsIG1heEFnZTogbnVtYmVyID0gSW5maW5pdHkgLyogXHU1MzU1XHU0RjREXHU3OUQyICovKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgICBrZXkgPSBgJHt2fToke2tleX1gXG4gICAgICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe1xuICAgICAgICBba2V5XToge1xuICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgbGFzdE1vZGlmaWVkOiBEYXRlLm5vdygpLFxuICAgICAgICAgIG1heEFnZVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxufSkoKVxuXG5leHBvcnQgY29uc3QgdG9EYXRhVXJsID0gYXN5bmMgKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBmZXRjaCh1cmwpXG4gICAgICAudGhlbihhc3luYyAocikgPT4gYXdhaXQgci5ibG9iKCkpXG4gICAgICAudGhlbigoYmxvYikgPT4ge1xuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgICAgIHJlYWRlci5vbmxvYWRlbmQgPSAoKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0IGFzIHN0cmluZylcbiAgICAgICAgfVxuICAgICAgICByZWFkZXIub25lcnJvciA9IHJlamVjdFxuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKVxuICAgICAgfSlcbiAgfSlcbn1cblxuY29uc3QgdXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudFxuY29uc3QgdXNlckFnZW50RGF0YSA9IChuYXZpZ2F0b3IgYXMgYW55KS51c2VyQWdlbnREYXRhXG5cbmV4cG9ydCBjb25zdCBpc01hYyA9IHVzZXJBZ2VudC5pbmNsdWRlcygnTWFjaW50b3NoJylcbmV4cG9ydCBjb25zdCBpc0ZpcmVmb3ggPSB1c2VyQWdlbnQuaW5jbHVkZXMoJ0ZpcmVmb3gnKVxuZXhwb3J0IGNvbnN0IGlzRWRnZSA9IHVzZXJBZ2VudC5pbmNsdWRlcygnRWRnLycpXG5leHBvcnQgY29uc3QgaXNCcmF2ZSA9IHVzZXJBZ2VudERhdGE/LmJyYW5kcy5maW5kSW5kZXgoKGl0ZW0pID0+IGl0ZW0uYnJhbmQgPT09ICdCcmF2ZScpID4gLTFcbmV4cG9ydCBjb25zdCBpc0NoaW5lc2UgPSBjaGVja0lzQ2hpbmVzZSgpXG5leHBvcnQgY29uc3QgaXNTaW1wbGVDaGluZXNlID0gY2hlY2tJc1NpbXBsZUNoaW5lc2UoKVxuZXhwb3J0IGNvbnN0IGlzQ2FuYXJ5OiBib29sZWFuID0gISFnbG9iYWxUaGlzLl9fTkJBX2lzQ2FuYXJ5XG5leHBvcnQgY29uc3QgdmVyc2lvbjogc3RyaW5nID0gaXNDYW5hcnkgPyBgMC4ke3BrZ1ZlcnNpb259YCA6IHBrZ1ZlcnNpb25cblxuZXhwb3J0IGNvbnN0IGdlblVBID0gKCkgPT4ge1xuICBsZXQgdWEgPSB1c2VyQWdlbnRcbiAgaWYgKCFpc0VkZ2UpIHtcbiAgICBpZiAoaXNNYWMpIHtcbiAgICAgIHVhID0gYE1vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzE1XzcpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8ke01BSU5fVkVSU0lPTn0uMC4wLjAgU2FmYXJpLzUzNy4zNiBFZGcvJHtGVUxMX1ZFUlNJT059YFxuICAgIH0gZWxzZSB7XG4gICAgICB1YSA9IGBNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvJHtNQUlOX1ZFUlNJT059LjAuMC4wIFNhZmFyaS81MzcuMzYgRWRnLyR7RlVMTF9WRVJTSU9OfWBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVhXG59XG5cbmV4cG9ydCBjb25zdCBnZW5Jc3N1ZVVybCA9IGFzeW5jIChleHRyYT86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ+KSA9PiB7XG4gIGNvbnN0IHJlcG9zaXRvcnlVcmw6IHN0cmluZyA9IHJlcG9zaXRvcnkudXJsXG4gIHRyeSB7XG4gICAgY29uc3QgY29uZmlnID0gYXdhaXQgZ2V0Q29uZmlnKClcbiAgICBjb25zdCB1cmw6IHN0cmluZyA9IGAke3JlcG9zaXRvcnlVcmx9L2lzc3Vlcy9uZXc/dGl0bGU9JmJvZHk9YFxuICAgIGxldCBmaW5hbFVybDogc3RyaW5nID0gdXJsXG4gICAgbGV0IGNvbW1lbnQgPVxuICAgICAgJ1BsZWFzZSB3cml0ZSB5b3VyIGNvbW1lbnQgQUJPVkUgdGhpcyBsaW5lLCBwcm92aWRlIGFzIG11Y2ggZGV0YWlsZWQgaW5mb3JtYXRpb24gYW5kIHNjcmVlbnNob3RzIGFzIHBvc3NpYmxlLicgK1xuICAgICAgJ1RoZSBVQSBtYXkgbm90IG5lY2Vzc2FyaWx5IHJlZmxlY3QgeW91ciBhY3R1YWwgYnJvd3NlciBhbmQgcGxhdGZvcm0sIHNvIHBsZWFzZSBtYWtlIHN1cmUgdG8gaW5kaWNhdGUgdGhlbSBjbGVhcmx5LidcbiAgICBpZiAoaXNDaGluZXNlKSB7XG4gICAgICBjb21tZW50ID0gJ1x1OEJGN1x1NTcyOFx1NkI2NFx1ODg0Q1x1NEUwQVx1NjVCOVx1NTNEMVx1ODg2OFx1NjBBOFx1NzY4NFx1OEJBOFx1OEJCQVx1MzAwMlx1OEJFNlx1NUMzRFx1NzY4NFx1NjNDRlx1OEZGMFx1NTQ4Q1x1NjIyQVx1NTZGRVx1NjcwOVx1NTJBOVx1NEU4RVx1NjIxMVx1NEVFQ1x1NUI5QVx1NEY0RFx1OTVFRVx1OTg5OFx1RkYwQ1VBIFx1NEUwRFx1NEUwMFx1NUI5QVx1NzcxRlx1NUI5RVx1NTNDRFx1NjYyMFx1NjBBOFx1NzY4NFx1NkQ0Rlx1ODlDOFx1NTY2OFx1NTQ4Q1x1NUU3M1x1NTNGMFx1RkYwQ1x1OEJGN1x1NTkwN1x1NkNFOFx1NkUwNVx1Njk1QSdcbiAgICB9XG5cbiAgICBjb25zdCBib2R5ID1cbiAgICAgICcgXFxuXFxuXFxuXFxuJyArXG4gICAgICBgPCEtLSAgJHtjb21tZW50fSAtLT5cXG5gICtcbiAgICAgIE9iamVjdC5lbnRyaWVzPHN0cmluZz4oe1xuICAgICAgICBWZXJzaW9uOiBgJHt2ZXJzaW9ufSR7aXNDYW5hcnkgPyAnIChDYW5hcnkpJyA6ICcnfSBgLFxuICAgICAgICBVQTogbmF2aWdhdG9yLnVzZXJBZ2VudCxcbiAgICAgICAgTGFuZzogY2hyb21lLmkxOG4uZ2V0VUlMYW5ndWFnZSgpLFxuICAgICAgICBBY2NlcHRMYW5nczogKGF3YWl0IGNocm9tZS5pMThuLmdldEFjY2VwdExhbmd1YWdlcygpKS5qb2luKCcsICcpLFxuICAgICAgICBjb25maWc6IEpTT04uc3RyaW5naWZ5KGNvbmZpZyksXG4gICAgICAgIC4uLmV4dHJhXG4gICAgICB9KVxuICAgICAgICAubWFwKChba2V5LCB2YWxdKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHZhbCA/IGAke2tleX06ICR7dmFsfWAgOiAnJ1xuICAgICAgICB9KVxuICAgICAgICAuam9pbignXFxuJylcblxuICAgIGZpbmFsVXJsICs9IGVuY29kZVVSSUNvbXBvbmVudChib2R5LnNsaWNlKDAsIDIwMDApKVxuICAgIHJldHVybiBmaW5hbFVybFxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gcmVwb3NpdG9yeVVybFxuICB9XG59XG4iLCAiaW1wb3J0IHsgY2FsbEJhY2tncm91bmQgfSBmcm9tICdAQC91dGlscydcblxuZXhwb3J0IGNvbnN0IG9wZW5VcmxJblNhbWVUYWIgPSBhc3luYyAodXJsOiBzdHJpbmcpID0+IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXdhaXQgY2FsbEJhY2tncm91bmQoJ29wZW5VcmxJblNhbWVUYWInLCBbeyB1cmwgfV0pXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBjb25zb2xlLmVycm9yKGUpXG4gICAgbG9jYXRpb24uaHJlZiA9IHVybFxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBtdXRhdGlvbkNvbmZpZyA9IHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH1cblxuY29uc3QgJCA9IChzLCBwYXJlbnQgPSBkb2N1bWVudCkgPT4gcGFyZW50LnF1ZXJ5U2VsZWN0b3IocylcblxuZXhwb3J0IGNvbnN0ICR3ID0gYXN5bmMgKGRvbVNlbGVjdG9yOiBzdHJpbmcsIHRpbWVvdXQ6IG51bWJlciA9IDMwIC8qIHNlY29uZCAqLywgcGFyZW50ID0gZG9jdW1lbnQpOiBQcm9taXNlPEVsZW1lbnQgfCBudWxsPiA9PiB7XG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGNvbnN0ICRkb20gPSAkKGRvbVNlbGVjdG9yLCBwYXJlbnQpXG4gICAgaWYgKCRkb20pIHtcbiAgICAgIHJlc29sdmUoJGRvbSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKF9tdXRhdGlvbkxpc3QsIG9ic2VydmVyKSA9PiB7XG4gICAgICBjb25zdCAkZG9tID0gJChkb21TZWxlY3RvciwgcGFyZW50KVxuICAgICAgaWYgKCRkb20pIHtcbiAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG4gICAgICAgIHJlc29sdmUoJGRvbSlcbiAgICAgIH1cbiAgICB9KVxuICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQsIG11dGF0aW9uQ29uZmlnKVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zdCAkZG9tID0gJChkb21TZWxlY3RvciwgcGFyZW50KVxuICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG4gICAgICByZXNvbHZlKCRkb20pXG4gICAgfSwgdGltZW91dCAqIDEwMDApXG4gIH0pXG59XG4iLCAiaW1wb3J0IHsgY2FsbEJhY2tncm91bmQsIGVzY2FwZUh0bWwsIGdldENvbmZpZywgaXNFZGdlLCBzZXRDb25maWcgfSBmcm9tICdAQC91dGlscydcbmltcG9ydCB7ICR3LCBtdXRhdGlvbkNvbmZpZywgb3BlblVybEluU2FtZVRhYiB9IGZyb20gJy4vdXRpbHMnXG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jICgkOiBaZXB0b1N0YXRpYykgPT4ge1xuICBpZiAoIWlzRWRnZSkge1xuICAgIGNvbnN0IGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50XG4gICAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgcy5zcmMgPSBjaHJvbWUucnVudGltZS5nZXRVUkwoJ2luamVjdC5qcycpXG4gICAgcy5vbmxvYWQgPSBzLnJlbW92ZVxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChzKVxuICB9XG5cbiAgJCgoKSA9PiB7XG4gICAgOyhhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB7IHNob3dHdWlkZVRvR2l0aHViIH0gPSBhd2FpdCBnZXRDb25maWcoKVxuICAgICAgaWYgKCFzaG93R3VpZGVUb0dpdGh1YikgcmV0dXJuXG4gICAgICBjb25zdCAkZXNhdFN3aXRjaCA9ICQoJyNlc3Rfc3dpdGNoJylcbiAgICAgIGlmICgkLnRyaW0oJGVzYXRTd2l0Y2gudGV4dCgpKSAhPT0gJ1x1NTZGRFx1NTE4NVx1NzI0OFx1NTZGRFx1OTY0NVx1NzI0OCcpIHJldHVyblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnN0ICRhID0gJChcbiAgICAgICAgICAnPGEgaHJlZj1cImh0dHBzOi8vZ2l0aHViLmNvbS9oYW96aS9OZXctQmluZy1Bbnl3aGVyZS9pc3N1ZXMvOFwiIHRpdGxlPVwiXHU2N0U1XHU3NzBCXHU1OTgyXHU0RjU1XHU2QjYzXHU3ODZFXHU5MTREXHU3RjZFXHU3RjUxXHU3RURDXHU0RUUzXHU3NDA2XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlciBub2ZvbGxvd1wiPlx1NEY5RFx1NzEzNlx1NTFGQVx1NzNCMFx1NTZGRFx1NTE4NVx1NzI0OC9cdTU2RkRcdTk2NDVcdTcyNDhcdUZGMUY8L2E+J1xuICAgICAgICApXG4gICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICBjb2xvcjogJyNFODlBQkUnLFxuICAgICAgICAgICAgdGV4dFNoYWRvdzogJzAuNXB4IDAuMXB4IDFweCAjNTgwNzBEJyxcbiAgICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgICAgICBmb250V2VpZ2h0OiAnbGlnaHRlcidcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jbGljaygoKSA9PiB7XG4gICAgICAgICAgICBzZXRDb25maWcoeyBzaG93R3VpZGVUb0dpdGh1YjogZmFsc2UgfSlcbiAgICAgICAgICB9KVxuXG4gICAgICAgICQoJyNlc3Rfc3dpdGNoJykuYXBwZW5kKCRhKS5jc3MoJ3dpZHRoJywgJ2F1dG8nKVxuICAgICAgfSwgMjAwMClcbiAgICB9KSgpXG4gIH0pXG5cbiAgaWYgKCFsb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vd3d3LmJpbmcuY29tL3NlYXJjaD8nKSkgcmV0dXJuXG4gIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGdldENvbmZpZygpXG5cbiAgJHcoJyNzYl9mb3JtJykudGhlbigoKSA9PiB7XG4gICAgdHlwZSBOb3RlID0ge1xuICAgICAgaHRtbF91cmw6IHN0cmluZ1xuICAgICAgdGl0bGU6IHN0cmluZ1xuICAgIH0gfCBudWxsXG4gICAgY2FsbEJhY2tncm91bmQoJ2dldE5vdGlmaWNhdGlvbicpLnRoZW4oKG5vdGU6IE5vdGUpID0+IHtcbiAgICAgIGlmICghbm90ZSkgcmV0dXJuXG4gICAgICBjb25zdCAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcbiAgICAgIGNvbnN0ICRkaXYgPSAkKCc8ZGl2Lz4nKS5jc3Moe1xuICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICBoZWlnaHQ6IDQwLFxuICAgICAgICBib3JkZXI6ICcxcHggc29saWQgIzU5MDcyNycsXG4gICAgICAgIGJhY2tncm91bmQ6ICcjNTgwNzBkJyxcbiAgICAgICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgbGluZUhlaWdodDogJzQwcHgnLFxuICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgICAgICB6SW5kZXg6IDk5OTk5LFxuICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcbiAgICAgICAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLFxuICAgICAgICBkaXNwbGF5OiAnYmxvY2sgIWltcG9ydGFudCdcbiAgICAgIH0pXG4gICAgICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICAgICAgJGRpdi5yZW1vdmUoKVxuICAgICAgICAkYm9keS5jc3MoJ3BhZGRpbmctdG9wJywgbnVsbClcbiAgICAgIH1cbiAgICAgIGNvbnN0ICRhID0gJChcbiAgICAgICAgYDxhIHN0eWxlPVwiY29sb3I6I2ZmZjsgYmFja2dyb3VuZDp1cmwoJHtjaHJvbWUucnVudGltZS5nZXRVUkwoXG4gICAgICAgICAgJ2ltYWdlcy9iaW5nXzMyeDMyLnBuZydcbiAgICAgICAgKX0pIG5vLXJlcGVhdCBsZWZ0IDA7IGJhY2tncm91bmQtc2l6ZTogMTJweDsgcGFkZGluZy1sZWZ0OiAyMHB4XCIgaHJlZj1cIiR7XG4gICAgICAgICAgbm90ZS5odG1sX3VybFxuICAgICAgICB9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlciBub2ZvbGxvd1wiPiR7bm90ZS50aXRsZX08L2E+YFxuICAgICAgKS5vbignY2xpY2snLCBjbG9zZSlcbiAgICAgIGNvbnN0ICRjbG9zZSA9ICQoXG4gICAgICAgICc8YSBocmVmPVwiI1wiIHN0eWxlPVwiYmFja2dyb3VuZDojNTgwNzBkOyBjb2xvcjojZmZmOyBjdXJzb3I6cG9pbnRlcjtwYWRkaW5nOiAwIDY4cHggMCAxOHB4O3Bvc2l0aW9uOiBhYnNvbHV0ZTtyaWdodDowXCIgdGl0bGU9XCJubyByZW1pbmRlclwiPlx1MjcxNTwvYT4nXG4gICAgICApLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBjb25maXJtKCdBcmUgeW91IHN1cmUgbmV2ZXIgc2VlIHRoaXMgbm90aWNlIGFnYWluPycpICYmIGNhbGxCYWNrZ3JvdW5kKCdoaWRlTm90aWZpY2F0aW9uJylcbiAgICAgICAgY2xvc2UoKVxuICAgICAgfSlcbiAgICAgICRkaXYuYXBwZW5kKCRhKS5hcHBlbmQoJGNsb3NlKVxuICAgICAgJGJvZHkuYXBwZW5kKCRkaXYpLmNzcygncGFkZGluZy10b3AnLCA0MClcbiAgICB9KVxuXG4gICAgJChkb2N1bWVudC5ib2R5KS5vbignY2xpY2snLCAnYS5iX2xvZ29BcmVhJywgKGUpID0+IHtcbiAgICAgIGNvbnN0ICR0aGlzID0gJChlLmN1cnJlbnRUYXJnZXQpXG4gICAgICAkdGhpcy5hdHRyKCdocmVmJywgJy8nKS5hdHRyKCd0YXJnZXQnLCAnX3NlbGYnKVxuICAgIH0pXG5cbiAgICBpZiAoIWNvbmZpZy5zaG93R29vZ2xlQnV0dG9uT25CaW5nKSByZXR1cm5cblxuICAgIGNvbnN0ICRxID0gJCgnI3NiX2Zvcm1fcScpXG4gICAgY29uc3Qgc2VhcmNoUXVlcnk6IHN0cmluZyA9ICRxLnZhbCgpXG5cbiAgICBjb25zdCAkYSA9ICQoYFxuICAgICAgPGEgaHJlZj1cImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICAgIGVzY2FwZUh0bWwoc2VhcmNoUXVlcnkpXG4gICAgICApfVwiIHRhcmdldD1cImdvb2dsZVwiIHRhYmluZGV4PVwiMTBcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyIG5vZm9sbG93XCIgdGl0bGU9XCJzZWFyY2ggd2l0aCBHb29nbGVcIj5cbiAgICAgICAgPGltZyBzcmM9XCIke2Nocm9tZS5ydW50aW1lLmdldFVSTCgnaW1hZ2VzL2dvb2dsZS5wbmcnKX1cIiBhbHQ9XCJnb29nbGVcIiBzdHlsZT1cIndpZHRoOiAxMDAlO2Rpc3BsYXk6IGJsb2NrO1wiPlxuICAgICAgPC9hPmApLmNzcyh7XG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICB0b3A6IDAsXG4gICAgICB3aWR0aDogJzcwcHgnLFxuICAgICAgaGVpZ2h0OiAnMjNweCcsXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgICd6LWluZGV4JzogOTk5LFxuICAgICAgdHJhbnNpdGlvbjogJ2FsbCAuM3MnLFxuICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoODM1cHgsIDEzcHgsIDBweCknLFxuICAgICAgJ3dpbGwtY2hhbmdlJzogJ3RyYW5zZm9ybScsXG4gICAgICBjdXJzb3I6ICdwb2ludGVyJ1xuICAgIH0pXG5cbiAgICAkKCcjc2JfZm9ybScpLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKS5wcmVwZW5kKCRhKVxuXG4gICAgJGEub24oJ2NsaWNrJywgYXN5bmMgKGUpID0+IHtcbiAgICAgIGNvbnN0ICR0aGlzID0gJChlLmN1cnJlbnRUYXJnZXQpXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGxldCB2YWwgPSAnJ1xuICAgICAgLy8gaWYgKCQoJyNiLXNjb3BlTGlzdEl0ZW0tY29udicpLmhhc0NsYXNzKCdiX2FjdGl2ZScpKSB7XG4gICAgICAvLyAgIHZhbCA9ICgkKCcjc2VhcmNoYm94JykudmFsKCkgPz8gJycpLnRyaW0oKVxuICAgICAgLy8gfVxuICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgdmFsID0gJHEudmFsKCkudHJpbSgpXG4gICAgICB9XG4gICAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudCh2YWwpfWBcbiAgICAgICR0aGlzLmF0dHIoJ2hyZWYnLCB1cmwpXG4gICAgICBhd2FpdCBvcGVuVXJsSW5TYW1lVGFiKHVybClcbiAgICB9KVxuXG4gICAgaWYgKGxvY2F0aW9uLnNlYXJjaC5pbmNsdWRlcygnc2hvd2NvbnY9MScpKSB7XG4gICAgICAkYS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgJGEuY3NzKCdkaXNwbGF5JywgJ2lubGluZS1ibG9jaycpXG4gICAgICB9LCAxMjAwKVxuICAgIH1cblxuICAgIGNvbnN0IGNoYW5nZUdvb2dsZUxpbmtQb3NpdGlvbiA9ICgpID0+IHtcbiAgICAgIGNvbnN0ICRjb252ID0gJCgnI2Itc2NvcGVMaXN0SXRlbS1jb252JylcbiAgICAgIGNvbnN0IGlzTmV3QmluZ09wZW4gPSAkY29udi5oYXNDbGFzcygnYl9hY3RpdmUnKVxuICAgICAgaWYgKGlzTmV3QmluZ09wZW4pIHtcbiAgICAgICAgbGV0IGxlZnQgPSAwXG4gICAgICAgIGlmICgkY29udi5vZmZzZXQoKSEubGVmdCkge1xuICAgICAgICAgIGxlZnQgPSAkY29udi5vZmZzZXQoKSEubGVmdCArICRjb252LndpZHRoKCkhICsgMzBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZWZ0ID0gMzUwXG4gICAgICAgIH1cblxuICAgICAgICAkYS5jc3Moe1xuICAgICAgICAgIHRyYW5zZm9ybTogYHRyYW5zbGF0ZTNkKCR7bGVmdH1weCwgMTVweCwgMClgXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkYS5jc3Moe1xuICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKDgzNXB4LCAxNXB4LCAwKSdcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgaWYgKCFpc05ld0JpbmdPcGVuICYmICQoJy5iX3NlYXJjaGJveEZvcm0nKS5oYXNDbGFzcygnYXNfcnNmb3JtJykpIHtcbiAgICAgICAgJGEuY3NzKHtcbiAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZCgxMTU1cHgsIDE1cHgsIDApJ1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGNoYW5nZUdvb2dsZUxpbmtQb3NpdGlvbigpXG4gICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9uTGlzdCwgb2JzZXJ2ZXIpID0+IHtcbiAgICAgIGZvciAoY29uc3QgbXV0YXRpb24gb2YgbXV0YXRpb25MaXN0KSB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IG11dGF0aW9uLnRhcmdldFxuICAgICAgICBpZiAoIXRhcmdldCkgY29udGludWVcbiAgICAgICAgaWYgKCh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmlkID09PSAnYi1zY29wZUxpc3RJdGVtLWNvbnYnKSB7XG4gICAgICAgICAgY2hhbmdlR29vZ2xlTGlua1Bvc2l0aW9uKClcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHRhcmdldCBhcyBIVE1MRWxlbWVudCkuY2xhc3NMaXN0LmNvbnRhaW5zKCdiX3NlYXJjaGJveEZvcm0nKSkge1xuICAgICAgICAgIGNoYW5nZUdvb2dsZUxpbmtQb3NpdGlvbigpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS5vYnNlcnZlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiX2hlYWRlcicpISwgbXV0YXRpb25Db25maWcpXG4gIH0pXG59XG4iLCAiaW1wb3J0IHsgdHlwZSBDb25maWcsIGNoZWNrSXNHb29nbGUgfSBmcm9tICdAQC91dGlscydcbmltcG9ydCB7ICR3IH0gZnJvbSAnLi91dGlscydcblxuY29uc3QgaXNHb29nbGUgPSBjaGVja0lzR29vZ2xlKClcbmV4cG9ydCBkZWZhdWx0IGFzeW5jICgkOiBaZXB0b1N0YXRpYywgY29uZmlnOiBDb25maWcpID0+IHtcbiAgbGV0IHByb21wdCA9ICcnXG4gIGlmIChpc0dvb2dsZSkge1xuICAgIHByb21wdCA9IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKS5nZXQoJ3EnKSA/PyAnJ1xuICB9XG5cbiAgY29uc3QgZXh0cmEgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGxvY2F0aW9uLmhhc2guc2xpY2UoMSkpLmdldCgnbmV3LWJpbmctYW55d2hlcmUnKSA/PyAnJ1xuXG4gIGNvbnN0IHFzID0ge1xuICAgIHByb21wdDogcHJvbXB0LnRyaW0oKSxcbiAgICBleHRyYVxuICB9XG5cbiAgY29uc3QgY2hhdElmcmFtZVVybCA9IGNocm9tZS5ydW50aW1lLmdldFVSTChgL2FwcC9pbmRleC5odG1sIy9jaGF0L2lmcmFtZT8ke25ldyBVUkxTZWFyY2hQYXJhbXMocXMpLnRvU3RyaW5nKCl9YClcblxuICB0cnkge1xuICAgIGNvbnN0ICRpZmFtZSA9ICQoYDxpZnJhbWUgc3JjPVwiJHtjaGF0SWZyYW1lVXJsfVwiIHNjcm9sbGluZz1cIm5vXCIgLz5gKVxuICAgICRpZmFtZS5jc3Moe1xuICAgICAgLy8gcG9zaXRpb246ICdmaXhlZCcsXG4gICAgICAvLyByaWdodDogJzBweCcsXG4gICAgICAvLyB6SW5kZXg6ICc5OTknLFxuICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgIGJvcmRlcjogJ25vbmUnLFxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgICB3aWxsQ2hhbmdlOiAnaGVpZ2h0JyxcbiAgICAgIHRyYW5zaXRpb246ICdoZWlnaHQgLjFzIGN1YmljLWJlemllcigwLCAwLCAwLCAxLjI3KSAwcycsXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMnB4J1xuICAgIH0pXG4gICAgLy8gJGlmYW1lLnByZXBlbmRUbygnYm9keScpXG5cbiAgICAvLyBjb25zdCBwb3NpdGlvbiA9IHsgbWFyZ2luOiAnMCAwIDEwcHgnIH1cbiAgICAvLyBjb25zdCAkaWZhbWUgPSAkKGA8aWZyYW1lIHNyYz0ke2Nocm9tZS5ydW50aW1lLmdldFVSTCgnL2FwcC9pbmRleC5odG1sIy9jaGF0Jyl9Lz5gKS5jc3Moe1xuICAgIC8vICAgLi4ucG9zaXRpb24sXG4gICAgLy8gICB3aWR0aDogJzEwMCUnLFxuICAgIC8vICAgaGVpZ2h0OiAnNTAwMCcsXG4gICAgLy8gICBib3JkZXI6ICdub25lJyxcbiAgICAvLyAgIG92ZXJGbG93OiAnaGlkZGVuJ1xuICAgIC8vIH0pXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZSkgPT4ge1xuICAgICAgY29uc3QgeyB0eXBlLCBkYXRhIH0gPSBlLmRhdGFcbiAgICAgIGlmICh0eXBlICE9PSAnbmJhLXJlc2l6ZScpIHJldHVyblxuICAgICAgY29uc3QgeyBoZWlnaHQgfSA9IGRhdGFcbiAgICAgICRpZmFtZS5jc3Moe1xuICAgICAgICAvLyB3aWR0aCxcbiAgICAgICAgaGVpZ2h0XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBsZXQgJHNpZGViYXJcbiAgICAkc2lkZWJhciA9ICQoYXdhaXQgJHcoJyNyaHMnLCAxKSlcbiAgICBpZiAoISRzaWRlYmFyLmxlbmd0aCkge1xuICAgICAgJHNpZGViYXIgPSAkKCc8ZGl2IGlkPVwicmhzXCIgLz4nKS5jc3Moe1xuICAgICAgICAvLyAgbWFyZ2luQm90dG9tOiAnMjBweCcsIG1hcmdpbkxlZnQ6ICczMHB4JywgaGVpZ2h0OiAnZml0LWNvbnRlbnQnXG4gICAgICAgIG1hcmdpbkxlZnQ6ICd2YXIoLS1yaHMtbWFyZ2luKScsXG4gICAgICAgIGZsZXg6ICcwIGF1dG8nLFxuICAgICAgICB3aWR0aDogJ3ZhcigtLXJocy13aWR0aCknLFxuICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgcGFkZGluZ0JvdHRvbTogJzE1cHgnLFxuICAgICAgICB0cmFuc2l0aW9uOiAnb3BhY2l0eSAwLjNzJ1xuICAgICAgfSlcbiAgICB9XG4gICAgY29uc3QgJGJlc3RDb250YWluZXIgPSAkKGF3YWl0ICR3KCcubGlZS2RlLmcuVmpETGQnLCAwLjEpKVxuICAgIGlmICgkYmVzdENvbnRhaW5lci5sZW5ndGgpIHtcbiAgICAgICRiZXN0Q29udGFpbmVyLnByZXBlbmQoJGlmYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICAkc2lkZWJhci5wcmVwZW5kKCRpZmFtZSlcbiAgICB9XG4gICAgY29uc3QgbWFpbiA9IGF3YWl0ICR3KCcjY2VudGVyX2NvbCcpXG4gICAgJHNpZGViYXIuaW5zZXJ0QWZ0ZXIobWFpbilcbiAgICAkKG1haW4pLmFmdGVyKCRzaWRlYmFyKVxuICB9IGNhdGNoIHt9XG59XG4iLCAiaW1wb3J0IHsgZ2V0Q29uZmlnIH0gZnJvbSAnQEAvdXRpbHMnXG5pbXBvcnQgeyAkdywgb3BlblVybEluU2FtZVRhYiB9IGZyb20gJy4vdXRpbHMnXG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jICgkOiBaZXB0b1N0YXRpYykgPT4ge1xuICBjb25zdCBjb25maWcgPSBhd2FpdCBnZXRDb25maWcoKVxuXG4gIGlmICghY29uZmlnLnNob3dCaW5nQnV0dG9uT25Hb29nbGUpIHJldHVyblxuICBpZiAoIShsb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoPycpIHx8IGxvY2F0aW9uLmhyZWYuc3RhcnRzV2l0aCgnaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS5oay9zZWFyY2g/JykpKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICAkdygnW2FjdGlvbj1cIi9zZWFyY2hcIl0nKS50aGVuKChmb3JtKSA9PiB7XG4gICAgaWYgKCFmb3JtKSByZXR1cm5cbiAgICBjb25zdCAkZm9ybSA9ICQoZm9ybSlcbiAgICBjb25zdCAkcSA9ICRmb3JtLmZpbmQoJ1tuYW1lPVwicVwiXScpXG4gICAgY29uc3QgJHN1Ym1pdCA9ICRmb3JtLmZpbmQoJ2J1dHRvblt0eXBlPVwic3VibWl0XCJdJylcblxuICAgIGNvbnN0ICRhID0gJChgXG4gICAgICA8YSBocmVmPVwiaHR0cHM6Ly93d3cuYmluZy5jb20vc2VhcmNoP3E9QmluZytBSSZzaG93Y29udj0xXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlciBub2ZvbGxvd1wiIHRhcmdldD1cImJpbmdcIiB0aXRsZT1cInNlYXJjaCB3aXRoIE5ldyBCaW5nXCI+XG4gICAgICAgIDxpbWcgc3JjPVwiJHtjaHJvbWUucnVudGltZS5nZXRVUkwoJ2ltYWdlcy9iaW5nLWNoYXQuc3ZnJyl9XCIgc3R5bGU9XCJkaXNwbGF5OiBibG9jazsgd2lkdGg6IDI0cHg7XCIgYWx0PVwiYmluZ1wiIC8+XG4gICAgICA8L2E+YCkuY3NzKHtcbiAgICAgIHdpZHRoOiAnNDBweCcsXG4gICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICd6LWluZGV4JzogOTk5LFxuICAgICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgICAnanVzdGlmeS1jb250ZW50JzogJ2NlbnRlcicsXG4gICAgICBtYXJnaW46ICcwIDEwcHggMCAtMTBweCdcbiAgICB9KVxuXG4gICAgJHN1Ym1pdC5hZnRlcigkYSlcbiAgICAkYS5vbignY2xpY2snLCBhc3luYyAoZSkgPT4ge1xuICAgICAgY29uc3QgJHRoaXMgPSAkKGUuY3VycmVudFRhcmdldClcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vd3d3LmJpbmcuY29tL3NlYXJjaD9xPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCRxLnZhbCgpKX0mc2hvd2NvbnY9MWBcbiAgICAgICR0aGlzLmF0dHIoJ2hyZWYnLCB1cmwpXG4gICAgICBhd2FpdCBvcGVuVXJsSW5TYW1lVGFiKHVybClcbiAgICB9KVxuICB9KVxufVxuIiwgImltcG9ydCB7IGNhbGxCYWNrZ3JvdW5kLCBnZXRDb25maWcgfSBmcm9tICdAQC91dGlscydcbmltcG9ydCB7IGV4dGVuc2lvbk5hbWUgfSBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nXG5pbXBvcnQgYmluZ0hhbmRsZXIgZnJvbSAnLi9iaW5nLWhhbmRsZXInXG5pbXBvcnQgY2hhdEhhbmRsZXIgZnJvbSAnLi9jaGF0LWhhbmRsZXInXG5pbXBvcnQgZ29vZ2xlSGFuZGxlciBmcm9tICcuL2dvb2dsZS1oYW5kbGVyJ1xuOyhhc3luYyAoJCkgPT4ge1xuICBjb25zdCAkZG9jdW1lbnQgPSAkKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudClcbiAgaWYgKCRkb2N1bWVudC5maW5kKGBtZXRhW25hbWU9XCIke2V4dGVuc2lvbk5hbWV9XCJdYCkubGVuZ3RoKSByZXR1cm5cbiAgY29uc3QgJG1ldGEgPSAkKGA8bWV0YSBuYW1lPVwiJHtleHRlbnNpb25OYW1lfVwiIC8+YClcblxuICAkZG9jdW1lbnQucHJlcGVuZCgkbWV0YSlcblxuICBjYWxsQmFja2dyb3VuZCgnZ2V0RW52JykudGhlbigoZW52KSA9PiB7XG4gICAgJG1ldGEuYXR0cignY29udGVudCcsIGVudi52ZXJzaW9uKVxuICB9KVxuXG4gIGdldENvbmZpZygpLnRoZW4oKGNvbmZpZykgPT4ge1xuICAgIGlmIChjb25maWcuc2hvd0NoYXQpIHtcbiAgICAgIGNoYXRIYW5kbGVyKCQsIGNvbmZpZylcbiAgICB9XG4gIH0pXG5cbiAgaWYgKGxvY2F0aW9uLmhvc3RuYW1lID09PSAnd3d3LmJpbmcuY29tJykge1xuICAgIGJpbmdIYW5kbGVyKCQpXG4gIH1cblxuICBpZiAobG9jYXRpb24uaG9zdG5hbWUuc3RhcnRzV2l0aCgnd3d3Lmdvb2dsZS4nKSkge1xuICAgIGdvb2dsZUhhbmRsZXIoJClcbiAgfVxufSkod2luZG93LlplcHRvIGFzIFplcHRvU3RhdGljKVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBRUUsZ0JBQVc7QUFnRlgsc0JBQWlCOzs7QUM5RVosTUFBTSxnQkFBZ0IsTUFBTTtBQUNqQyxXQUFPLFNBQVMsU0FBUyxTQUFTLFFBQVE7QUFBQSxFQUM1QztBQWtHTyxNQUFNLHVCQUF1QixNQUFNO0FBQ3hDLFFBQUk7QUFDRixZQUFNLE9BQU8sT0FBTyxLQUFLLGNBQWMsRUFBRSxZQUFZO0FBQ3JELGFBQU8sU0FBUztBQUFBLElBQ2xCLFFBQUU7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFFTyxNQUFNLGlCQUFpQixNQUFNO0FBQ2xDLFFBQUk7QUFDRixZQUFNLE9BQU8sT0FBTyxLQUFLLGNBQWMsRUFBRSxZQUFZO0FBQ3JELGFBQU8sU0FBUyxXQUFXLFNBQVMsV0FBVyxTQUFTLFdBQVcsU0FBUztBQUFBLElBQzlFLFFBQUU7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFTQSxNQUFNLGFBQWE7QUFTWixNQUFNLFlBQVksWUFBNkI7QUFDcEQsVUFBTSxVQUFVLE1BQU0sT0FBTyxRQUFRLEtBQUssSUFBSSxVQUFVLEdBQUcsVUFBVTtBQUNyRSxXQUFP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QUUsSUFBSTtBQUNwQixZQUFNLEtBQUssTUFBTSxLQUFLLFlBQVk7QUFDbEMsWUFBTSxVQUFVLE1BQU0sS0FBSyx1QkFBdUI7QUFFbEQsWUFBTSxLQUFLQSxHQUFFO0FBQUE7QUFBQSxvQkFFRyxPQUFPLFFBQVEsT0FBTyxzQkFBc0I7QUFBQSxXQUNyRCxFQUFFLElBQUk7QUFBQSxRQUNYLE9BQU87QUFBQSxRQUNQLFNBQVM7QUFBQSxRQUNULFVBQVU7QUFBQSxRQUNWLFdBQVc7QUFBQSxRQUNYLFFBQVE7QUFBQSxRQUNSLG1CQUFtQjtBQUFBLFFBQ25CLFFBQVE7QUFBQSxNQUNWLENBQUM7QUFFRCxjQUFRLE1BQU0sRUFBRTtBQUNoQixTQUFHLEdBQUcsU0FBUyxPQUFPLE1BQU07QUFDMUIsY0FBTSxRQUFRQSxHQUFFLEVBQUUsYUFBYTtBQUMvQixVQUFFLGVBQWU7QUFDakIsY0FBTSxNQUFNLGlDQUFpQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7QUFDeEUsY0FBTSxLQUFLLFFBQVEsR0FBRztBQUN0QixjQUFNLGlCQUFpQixHQUFHO0FBQUEsTUFDNUIsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUFBLEVBQ0g7OztBQ2xDQyxHQUFDLE9BQU9DLE9BQU07QUFDYixVQUFNLFlBQVlBLEdBQUUsU0FBUyxlQUFlO0FBQzVDLFFBQUksVUFBVSxLQUFLLGNBQWMsaUJBQWlCLEVBQUU7QUFBUTtBQUM1RCxVQUFNLFFBQVFBLEdBQUUsZUFBZSxtQkFBbUI7QUFFbEQsY0FBVSxRQUFRLEtBQUs7QUFFdkIsbUJBQWUsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO0FBQ3JDLFlBQU0sS0FBSyxXQUFXLElBQUksT0FBTztBQUFBLElBQ25DLENBQUM7QUFFRCxjQUFVLEVBQUUsS0FBSyxDQUFDLFdBQVc7QUFDM0IsVUFBSSxPQUFPLFVBQVU7QUFDbkIsNkJBQVlBLElBQUcsTUFBTTtBQUFBLE1BQ3ZCO0FBQUEsSUFDRixDQUFDO0FBRUQsUUFBSSxTQUFTLGFBQWEsZ0JBQWdCO0FBQ3hDLDJCQUFZQSxFQUFDO0FBQUEsSUFDZjtBQUVBLFFBQUksU0FBUyxTQUFTLFdBQVcsYUFBYSxHQUFHO0FBQy9DLDZCQUFjQSxFQUFDO0FBQUEsSUFDakI7QUFBQSxFQUNGLEdBQUcsT0FBTyxLQUFvQjsiLAogICJuYW1lcyI6IFsidmVyc2lvbiIsICJvYnNlcnZlciIsICIkZG9tIiwgIiQiLCAiZG9jdW1lbnQiLCAiJGEiLCAiJCIsICIkIiwgIiQiXQp9Cg==
