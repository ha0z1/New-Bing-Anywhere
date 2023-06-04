"use strict";(()=>{var c="https://www.bing.com/",I="https://cn.bing.com/",T=["zh-CN","ru","ru-ru"],f="113",w="113.0.1774.57",C=["csp_report","font","image","main_frame","media","object","other","ping","script","stylesheet","sub_frame","webbundle","websocket","webtransport","xmlhttprequest"];var y="1.12.0";var m={type:"git",url:"https://github.com/haozi/New-Bing-Anywhere"};var p=navigator.userAgent,D=p.includes("Macintosh"),K=p.includes("Firefox"),O=p.includes("Edg/");var N=()=>chrome.i18n.getUILanguage().toLowerCase()==="zh-cn",L=()=>{let e=chrome.i18n.getUILanguage().toLowerCase();return e==="zh-cn"||e==="zh-tw"||e==="zh-hk"||e==="zh"};var _=()=>{let e=p;return O||(D?e=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${f}.0.0.0 Safari/537.36 Edg/${w}`:e=`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${f}.0.0.0 Safari/537.36 Edg/${w}`),e};var b=L(),E=N(),g=!!globalThis.__NBA_isCanary,h=g?`0.${y}`:y;var l=(e="",t)=>{try{return new URL(e,t)}catch{return{searchParams:{get:()=>null}}}},x=e=>{try{return new URLSearchParams(e)}catch{return{get:()=>null}}},U=e=>{chrome.runtime.onMessage.addListener((t,n,r)=>((async()=>{try{let{method:o,args:s}=t,i=await e[o](...s);r({code:200,msg:"ok",data:i})}catch(o){let s=o??{};r({code:500,msg:s.stack??s.message??o})}})(),!0))},a=async e=>{let t=await chrome.tabs.query({currentWindow:!0}),n=l(e),r=t.find(o=>o.url?.startsWith(n.origin));return r==null?r=await chrome.tabs.create({url:e}):await Promise.all([chrome.tabs.move(r.id,{index:t.length-1}),r.url!==e&&chrome.tabs.update(r.id,{url:e}),chrome.tabs.update(r.id,{active:!0,url:r.url!==e?e:void 0})].filter(Boolean)),r},S=async()=>{let n=`${m.url}/issues/new?title=&body=`,r="Please write your comment ABOVE this line, provide as much detailed information and screenshots as possible.The UA may not necessarily reflect your actual browser and platform, so please make sure to indicate them clearly.";b&&(r="\u8BF7\u5728\u6B64\u884C\u4E0A\u65B9\u53D1\u8868\u60A8\u7684\u8BA8\u8BBA\u3002\u8BE6\u5C3D\u7684\u63CF\u8FF0\u548C\u622A\u56FE\u6709\u52A9\u4E8E\u6211\u4EEC\u5B9A\u4F4D\u95EE\u9898\uFF0CUA \u4E0D\u4E00\u5B9A\u771F\u5B9E\u53CD\u6620\u60A8\u7684\u6D4F\u89C8\u5668\u548C\u5E73\u53F0\uFF0C\u8BF7\u5907\u6CE8\u6E05\u695A");let o=` 



<!--  ${r} -->
Version: ${h}${g?" (Canary)":""} 
UA: ${navigator.userAgent}
Lang: ${chrome.i18n.getUILanguage()}
AcceptLangs: ${(await chrome.i18n.getAcceptLanguages()).join(", ")}`;return n+=encodeURIComponent(o.slice(0,2e3)),n},d=async(e,t={})=>await chrome.cookies.set({domain:t.domain,storeId:t.storeId,path:t.path,httpOnly:t.httpOnly,secure:t.secure,sameSite:t.sameSite,expirationDate:t.expirationDate,...e});var B={openChat:{title:"\u{1F4AC} New Bing",contexts:["action"],onclick:e=>{a("https://www.bing.com/search?q=Bing+AI&showconv=1")}},openImageCreate:{title:"\u{1F5BC}\uFE0F New Bing Image Creator",contexts:["action"],onclick:e=>{a("https://www.bing.com/create")}},likeIt:{title:"\u2764\uFE0F Like it",contexts:["action"],onclick:()=>{a("https://chrome.google.com/webstore/detail/new-bing-anywhere/hceobhjokpdbogjkplmfjeomkeckkngi/reviews")}},reportIssues:{title:b?"\u{1F41B} \u53CD\u9988\u5EFA\u8BAE":"\u{1F41B} Report issues",contexts:["action"],onclick:async e=>{let t=await S();a(t)}}},M=()=>{chrome.contextMenus.removeAll(()=>{for(let[e,t]of Object.entries(B))chrome.contextMenus.create({id:e,title:t.title,contexts:t.contexts})}),chrome.contextMenus.onClicked.addListener((e,t)=>{let{menuItemId:n}=e,r=B[n];r?.onclick&&r.onclick(e,t)})};var k=()=>{M(),U({getEnv:async()=>({version:h}),openUrlInSameTab:async({url:e}={})=>{let t=await chrome.tabs.query({currentWindow:!0}),n=l(e),r=t.find(q=>q.url?.startsWith(n.origin));r==null?r=await chrome.tabs.create({url:e}):r.id!=null&&await Promise.all([chrome.tabs.move(r.id,{index:t.length-1}),chrome.tabs.update(r.id,{active:!0})]);let o=e,s="",i="",u=n.hostname==="www.google.com",R=n.hostname==="www.bing.com";u?(s=n.searchParams.get("q")??"",i=l(r.url).searchParams.get("q")??"",l(r.url).searchParams.get("q")):R&&(s=n.searchParams.get("q")??"",i=l(r.url).searchParams.get("q")??""),s=s.trim(),i=i.trim(),!(s&&s===i)&&(u?o=`${n.origin}${n.pathname}?q=${encodeURIComponent(s)}`:R&&(o=`${n.origin}${n.pathname}?q=${encodeURIComponent(s)}`),await chrome.tabs.update(r.id,{url:o}))},...(()=>{let t="notification",n="notification:hide",r=async()=>{let o;try{o=await fetch("https://api.github.com/repos/haozi/New-Bing-Anywhere/issues/24").then(async s=>await s.json())}catch{}return o};return{getNotification:async()=>{let{[t]:o}=await chrome.storage.local.get(t);if(!o||o.lastModify&&Date.now()-o.lastModify>36e5){await chrome.storage.local.remove(t);let u=await r();u&&await chrome.storage.local.set({[t]:{data:u,lastModify:Date.now()}})}let{[n]:s,[t]:i}=await chrome.storage.local.get([n,t]);return!i?.data||!(i.data.title&&i.data.state==="open")||s===1&&i.data.title===o.data?.title?null:(await chrome.storage.local.remove(n),i.data)},hideNotification:async()=>{chrome.storage.local.set({[n]:1})}}})()}),chrome.runtime.onInstalled.addListener(e=>{let t=m.url;if(g){a(`${t}/tree/canary`);return}e.reason==="install"?a(t):e.reason==="update"&&a(`${t}/releases/tag/v${h}`)}),chrome.webRequest.onBeforeRequest.addListener(()=>{chrome.cookies.get({name:"_EDGE_S",url:c},e=>{let t=e?.value;if(!t)return;let n=x(t),r=n.get("mkt")?.toLowerCase()??"";T.map(o=>o.toLowerCase()).includes(r)&&(r==="zh-cn"?(n.set("mkt","zh-HK"),n.set("ui","zh-hans")):n.delete("mkt"),d({url:c,name:e.name,value:n.toString()},e))}),chrome.cookies.get({name:"_RwBf",url:c},e=>{let t=e?.value;if(!t){d({url:c,name:"_RwBf",value:"wls=2",domain:".bing.com",httpOnly:!0});return}let n=x(t);n.get("wls")!=="2"&&n.set("wls","2"),d({url:c,name:"_RwBf",domain:".bing.com",httpOnly:!0,value:n.toString()},e)})},{urls:[c+"*"],types:["main_frame"]})};var $={"User-Agent":_()},j="modifyHeaders",z="set",v=[{priority:2001,action:{type:j,requestHeaders:Object.entries($).map(([e,t])=>({operation:z,header:e,value:t}))},condition:{requestDomains:["bing.com","www.bing.com","cn.bing.com"],resourceTypes:C}}].filter(Boolean).map((e,t)=>({id:t+1+2e3,...e})),P=()=>{v.length&&chrome.declarativeNetRequest.getDynamicRules(e=>{chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:[...new Set([...v.map(t=>t.id),...e.map(t=>t.id)])],addRules:v})})};k();chrome.runtime.onInstalled.addListener(e=>{P()});E&&chrome.runtime.setUninstallURL(I);})();
