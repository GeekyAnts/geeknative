(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,54249,(e,t,n)=>{"use strict";e.i(19940),Object.defineProperty(n,"__esModule",{value:!0});var r={default:function(){return g},useLinkStatus:function(){return b}};for(var a in r)Object.defineProperty(n,a,{enumerable:!0,get:r[a]});let s=e.r(24930),i=e.r(46882),l=s._(e.r(55118)),o=e.r(23988),c=e.r(35547),d=e.r(40716),u=e.r(23869),h=e.r(22955),f=e.r(97637),p=e.r(58922),m=e.r(67973),x=e.r(31546);function g(t){var n;let r,a,s,[g,b]=(0,l.useOptimistic)(p.IDLE_LINK_STATUS),y=(0,l.useRef)(null),{href:w,as:j,children:k,prefetch:N=null,passHref:S,replace:M,shallow:P,scroll:A,onClick:C,onMouseEnter:_,onTouchStart:E,legacyBehavior:T=!1,onNavigate:R,transitionTypes:$,ref:L,unstable_dynamicOnHover:D,...I}=t;r=k,T&&("string"==typeof r||"number"==typeof r)&&(r=(0,i.jsx)("a",{children:r}));let O=l.default.useContext(c.AppRouterContext),F=!1!==N,z=!1===N?"none":!0===N?"full":"auto",W="none"!==z?"auto"===z?x.FetchStrategy.PPR:x.FetchStrategy.Full:x.FetchStrategy.PPR,B="string"==typeof(n=j||w)?n:(0,o.formatUrl)(n);if(T){if(r?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});a=l.default.Children.only(r)}let V=T?a&&"object"==typeof a&&a.ref:L,H,G=l.default.useCallback(e=>(null!==O&&(y.current=(0,p.mountLinkInstance)(e,B,O,W,F,b,H)),()=>{y.current&&((0,p.unmountLinkForCurrentNavigation)(y.current),y.current=null),(0,p.unmountPrefetchableInstance)(e)}),[F,B,O,W,b,H]),q={ref:(0,d.useMergedRef)(G,V),onClick(t){T||"function"!=typeof C||C(t),T&&a.props&&"function"==typeof a.props.onClick&&a.props.onClick(t),!O||t.defaultPrevented||function(t,n,r,a,s,i,o,c="none"){if("u">typeof window){let d,{nodeName:u}=t.currentTarget;if("A"===u.toUpperCase()&&((d=t.currentTarget.getAttribute("target"))&&"_self"!==d||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,m.isLocalURL)(n)){a&&(t.preventDefault(),location.replace(n));return}if(t.preventDefault(),i){let e=!1;if(i({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:h}=e.r(9697);l.default.startTransition(()=>{h(n,a?"replace":"push",!1===s?f.ScrollBehavior.NoScroll:f.ScrollBehavior.Default,r.current,o,c)})}}(t,B,y,M,A,R,$,z)},onMouseEnter(e){T||"function"!=typeof _||_(e),T&&a.props&&"function"==typeof a.props.onMouseEnter&&a.props.onMouseEnter(e),O&&F&&(0,p.onNavigationIntent)(e.currentTarget,!0===D)},onTouchStart:function(e){T||"function"!=typeof E||E(e),T&&a.props&&"function"==typeof a.props.onTouchStart&&a.props.onTouchStart(e),O&&F&&(0,p.onNavigationIntent)(e.currentTarget,!0===D)}};return(0,u.isAbsoluteUrl)(B)?q.href=B:T&&!S&&("a"!==a.type||"href"in a.props)||(q.href=(0,h.addBasePath)(B)),s=T?l.default.cloneElement(a,q):(0,i.jsx)("a",{...I,...q,children:r}),(0,i.jsx)(v.Provider,{value:g,children:s})}let v=(0,l.createContext)(p.IDLE_LINK_STATUS),b=()=>(0,l.useContext)(v);("function"==typeof n.default||"object"==typeof n.default&&null!==n.default)&&void 0===n.default.__esModule&&(Object.defineProperty(n.default,"__esModule",{value:!0}),Object.assign(n.default,n),t.exports=n.default)},40716,(e,t,n)=>{"use strict";Object.defineProperty(n,"__esModule",{value:!0}),Object.defineProperty(n,"useMergedRef",{enumerable:!0,get:function(){return a}});let r=e.r(55118);function a(e,t){let n=(0,r.useRef)(null),a=(0,r.useRef)(null);return(0,r.useCallback)(r=>{if(null===r){let e=n.current;e&&(n.current=null,e());let t=a.current;t&&(a.current=null,t())}else e&&(n.current=s(e,r)),t&&(a.current=s(t,r))},[e,t])}function s(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let n=e(t);return"function"==typeof n?n:()=>e(null)}}("function"==typeof n.default||"object"==typeof n.default&&null!==n.default)&&void 0===n.default.__esModule&&(Object.defineProperty(n.default,"__esModule",{value:!0}),Object.assign(n.default,n),t.exports=n.default)},23869,(e,t,n)=>{"use strict";e.i(19940),Object.defineProperty(n,"__esModule",{value:!0});var r={DecodeError:function(){return g},MiddlewareNotFoundError:function(){return w},MissingStaticPage:function(){return y},NormalizeError:function(){return v},PageNotFoundError:function(){return b},SP:function(){return m},ST:function(){return x},WEB_VITALS:function(){return s},execOnce:function(){return i},getDisplayName:function(){return u},getLocationOrigin:function(){return c},getURL:function(){return d},isAbsoluteUrl:function(){return o},isResSent:function(){return h},loadGetInitialProps:function(){return p},normalizeRepeatedSlashes:function(){return f},stringifyError:function(){return j}};for(var a in r)Object.defineProperty(n,a,{enumerable:!0,get:r[a]});let s=["CLS","FCP","FID","INP","LCP","TTFB"];function i(e){let t,n=!1;return(...r)=>(n||(n=!0,t=e(...r)),t)}let l=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,o=e=>{let t=e.charCodeAt(0);return!!(t>=65&&t<=90||t>=97&&t<=122)&&l.test(e)};function c(){let{protocol:e,hostname:t,port:n}=window.location;return`${e}//${t}${n?":"+n:""}`}function d(){let{href:e}=window.location,t=c();return e.substring(t.length)}function u(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function h(e){return e.finished||e.headersSent}function f(e){let t=e.split("?");return t[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(t[1]?`?${t.slice(1).join("?")}`:"")}async function p(e,t){let n=t.res||t.ctx&&t.ctx.res;if(!e.getInitialProps)return t.ctx&&t.Component?{pageProps:await p(t.Component,t.ctx)}:{};let r=await e.getInitialProps(t);if(n&&h(n))return r;if(!r)throw Object.defineProperty(Error(`"${u(e)}.getInitialProps()" should resolve to an object. But found "${r}" instead.`),"__NEXT_ERROR_CODE",{value:"E1025",enumerable:!1,configurable:!0});return r}let m="u">typeof performance,x=m&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class g extends Error{}class v extends Error{}class b extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message=`Cannot find module for page: ${e}`}}class y extends Error{constructor(e,t){super(),this.message=`Failed to load static file for page: ${e} ${t}`}}class w extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function j(e){return JSON.stringify({message:e.message,stack:e.stack})}},67973,(e,t,n)=>{"use strict";Object.defineProperty(n,"__esModule",{value:!0}),Object.defineProperty(n,"isLocalURL",{enumerable:!0,get:function(){return s}});let r=e.r(23869),a=e.r(80097);function s(e){if(!(0,r.isAbsoluteUrl)(e))return!0;try{let t=(0,r.getLocationOrigin)(),n=new URL(e,t);return n.origin===t&&(0,a.hasBasePath)(n.pathname)}catch(e){return!1}}},17516,(e,t,n)=>{"use strict";Object.defineProperty(n,"__esModule",{value:!0});var r={assign:function(){return o},searchParamsToUrlQuery:function(){return s},urlQueryToSearchParams:function(){return l}};for(var a in r)Object.defineProperty(n,a,{enumerable:!0,get:r[a]});function s(e){let t={};for(let[n,r]of e.entries()){let e=t[n];void 0===e?t[n]=r:Array.isArray(e)?e.push(r):t[n]=[e,r]}return t}function i(e){return"string"==typeof e?e:("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function l(e){let t=new URLSearchParams;for(let[n,r]of Object.entries(e))if(Array.isArray(r))for(let e of r)t.append(n,i(e));else t.set(n,i(r));return t}function o(e,...t){for(let n of t){for(let t of n.keys())e.delete(t);for(let[t,r]of n.entries())e.append(t,r)}return e}},23988,(e,t,n)=>{"use strict";e.i(19940),Object.defineProperty(n,"__esModule",{value:!0});var r={formatUrl:function(){return l},formatWithValidation:function(){return c},urlObjectKeys:function(){return o}};for(var a in r)Object.defineProperty(n,a,{enumerable:!0,get:r[a]});let s=e.r(24930)._(e.r(17516)),i=/https?|ftp|gopher|file/;function l(e){let{auth:t,hostname:n}=e,r=e.protocol||"",a=e.pathname||"",l=e.hash||"",o=e.query||"",c=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?c=t+e.host:n&&(c=t+(~n.indexOf(":")?`[${n}]`:n),e.port&&(c+=":"+e.port)),o&&"object"==typeof o&&(o=String(s.urlQueryToSearchParams(o)));let d=e.search||o&&`?${o}`||"";return r&&!r.endsWith(":")&&(r+=":"),e.slashes||(!r||i.test(r))&&!1!==c?(c="//"+(c||""),a&&"/"!==a[0]&&(a="/"+a)):c||(c=""),l&&"#"!==l[0]&&(l="#"+l),d&&"?"!==d[0]&&(d="?"+d),a=a.replace(/[?#]/g,encodeURIComponent),d=d.replace("#","%23"),`${r}${c}${a}${d}${l}`}let o=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function c(e){return l(e)}},44852,e=>{"use strict";var t=e.i(46882),n=e.i(55118),r=e.i(55312);let a=e=>e.width>=4&&e.height>=4,s=e=>e+2*Math.round(.3*e);e.s(["ColonyCanvas",0,function(){let i=(0,n.useRef)(null);return(0,n.useEffect)(()=>{let t=i.current;if(!t)return;let n=!1,l=0,o=null,c=[];try{"0"===localStorage.getItem("gn-colony")&&(r.colonyStore.enabled=!1)}catch{}return(async()=>{let[{ColonyEngine:i,MAX_STAGES:d,supportsColony:u},{buildFormation:h}]=await Promise.all([e.A(89547),e.A(98925)]);if(n)return;if(!u())return r.colonyStore.setStatus("unsupported");let f=matchMedia("(max-width: 767px)").matches,p=matchMedia("(prefers-reduced-motion: reduce)"),m=Math.min(window.devicePixelRatio||1,2),x=new Map,g=()=>[...r.colonyStore.stages.values()].slice(0,d).map(e=>({id:e.id,formation:e.formation,rect:e.el.getBoundingClientRect()})),v=e=>e.flatMap((e,t)=>{var n,r,s;let i,l;return a(e.rect)?[{slot:t,formation:(n=e.formation,r=e.rect.width,s=e.rect.height,i=`${n}|${Math.round(r)}x${Math.round(s)}`,(l=x.get(i))||(x.size>=40&&x.clear(),l=h(n,{w:r,h:s,n:16384,mobile:f}),x.set(i,l)),l)}]:[]}),b=g(),y=v(b).reduce((e,t)=>e+t.formation.used,0);try{o=new i(t,{count:Math.max(4096,Math.ceil(1.35*y)),dpr:m,calm:!1})}catch(e){console.warn("[colony] disabled:",e),r.colonyStore.setStatus("unsupported");return}let w=o;w.resize(document.documentElement.clientWidth,s(window.innerHeight),m);let j=e=>{let t=w.setStages(v(e));r.colonyStore.setCounts(new Map(e.map((e,n)=>[e.id,t.get(n)??0])))},k=()=>p.matches||!r.colonyStore.enabled,N=k();w.setCalm(N);let S=()=>{let e=k();e!==N&&(N=e,w.setCalm(N))};p.addEventListener("change",S);let M=r.colonyStore.subscribe(S),P={x:-9999,y:-9999,on:!1},A=e=>{P.x=e.clientX,P.y=e.clientY,P.on=!0},C=()=>P.on=!1,_=e=>{0!==e.button||N||w.kick(e.clientX,e.clientY+window.scrollY,5)};window.addEventListener("pointermove",A,{passive:!0}),window.addEventListener("pointerdown",_,{passive:!0}),document.documentElement.addEventListener("pointerleave",C),c.push(()=>{window.removeEventListener("pointermove",A),window.removeEventListener("pointerdown",_),document.documentElement.removeEventListener("pointerleave",C),p.removeEventListener("change",S),M()});let E=[],T=0;j(b),r.colonyStore.setStatus("running");let R=(e,t)=>e.some((e,n)=>Math.abs(e.rect.width-t[n].rect.width)>2||Math.abs(e.rect.height-t[n].rect.height)>2),$=b,L=0,D=0,I=performance.now(),O=e=>{let n;l=requestAnimationFrame(O);let r=(e-I)/1e3;if(I=e,document.hidden)return;r<.25&&(e=>{if(T>1||(E.push(e),E.length<150))return;let t=[...E].sort((e,t)=>e-t),n=t[t.length>>1];E.length=0,n<.026?T=2:0===T&&m>1?(m=1,w.resize(document.documentElement.clientWidth,s(window.innerHeight),m),T=1):(w.setDensity(.5),T=2)})(r);let i=window.scrollY,o=g();(n=b,o.length===n.length&&o.every((e,t)=>e.id===n[t].id&&e.formation===n[t].formation))?R(o,b)&&(R(o,$)?L=e:e-L>150&&j(b=o)):j(b=o),$=o;let c=window.innerHeight,d=Math.max(0,Math.round(i)-Math.round(.3*c));d!==D&&(t.style.transform=`translate3d(0, ${d}px, 0)`,D=d),w.frame({dt:r,scrollY:i,top:d,width:document.documentElement.clientWidth,height:s(c),mouse:P,stages:o.map(({rect:e})=>a(e)?{x:e.left+e.width/2,y:e.top+e.height/2+i}:null)})};l=requestAnimationFrame(O)})(),()=>{n=!0,cancelAnimationFrame(l),c.forEach(e=>e()),o?.dispose(),r.colonyStore.setStatus("idle")}},[]),(0,t.jsx)("div",{"aria-hidden":!0,className:"pointer-events-none absolute inset-0 z-40 overflow-hidden",children:(0,t.jsx)("canvas",{ref:i,className:"colony-canvas absolute left-0 top-0"})})}])},67755,e=>{"use strict";var t=e.i(46882),n=e.i(55118),r=e.i(55312);e.s(["ColonyStage",0,function({id:e,formation:a,className:s="",children:i}){let l=(0,n.useRef)(null),o=(0,n.useRef)(a);return(0,n.useEffect)(()=>{let t=l.current;if(t)return r.colonyStore.register(e,t,o.current),()=>r.colonyStore.unregister(e,t)},[e]),(0,n.useEffect)(()=>{o.current=a,r.colonyStore.update(e,a)},[e,a]),(0,t.jsx)("div",{ref:l,"data-colony-stage":e,"aria-hidden":!0,className:`${/\b(absolute|fixed|sticky)\b/.test(s)?"":"relative"} ${s}`,children:i?(0,t.jsx)("div",{className:"colony-fallback absolute inset-0",children:i}):null})}])},32151,e=>{"use strict";var t=e.i(46882),n=e.i(55118),r=e.i(54210),a=e.i(19303);function s({children:e,className:r=""}){let[a,i]=function(){let e=(0,n.useRef)(null),[t,r]=(0,n.useState)(null);return(0,n.useEffect)(()=>{let t=e.current;if(!t)return;let n=new ResizeObserver(([e])=>r({w:e.contentRect.width,h:e.contentRect.height}));return n.observe(t),()=>n.disconnect()},[]),[e,t]}();return(0,t.jsx)("div",{ref:a,"aria-hidden":!0,className:`pointer-events-none absolute inset-0 ${r}`,children:i?e(i):null})}let i={ios:["iOS","SwiftUI"],web:["Web","TanStack Start"],android:["Android","Jetpack Compose"]},l=[{key:"prompt",title:"You",note:"A plain prompt"},{key:"agents",title:"AGENTS.md",note:"Triage"},{key:"truth",title:"Spec + contracts",note:"Source of truth"},{key:"ios",title:"iOS",note:"SwiftUI"},{key:"android",title:"Android",note:"Jetpack Compose"},{key:"web",title:"Web",note:"TanStack Start"},{key:"check",title:"make check",note:"Tests and parity"}];e.s(["DeviceLabels",0,function(){return(0,t.jsx)(s,{children:({w:e,h:n})=>(0,a.devicesGeometry)(e,n).map(n=>(0,t.jsxs)("div",{className:"figure-label label absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-muted",style:{left:n.x+n.w/2,top:n.y+n.h+14},children:[(0,t.jsx)("span",{className:"text-ink",children:i[n.kind][0]}),e>=520||"web"===n.kind?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{className:"text-faint",children:"/"}),(0,t.jsx)("span",{children:i[n.kind][1]})]}):null]},n.kind))})},"DevicesFallback",0,function(){return(0,t.jsx)(s,{children:({w:e,h:n})=>(0,t.jsx)("svg",{width:e,height:n,className:"absolute inset-0",children:(0,a.devicesGeometry)(e,n).map(e=>{let n=(0,a.screenOf)(e);return(0,t.jsxs)("g",{fill:"none",stroke:"currentColor",className:"text-ink/70",children:[(0,t.jsx)("rect",{x:e.x,y:e.y,width:e.w,height:e.h,rx:e.r,strokeWidth:1.5}),(0,t.jsx)("rect",{x:n.x+.08*n.w,y:n.y+.12*n.h,width:.5*n.w,height:.045*n.h,rx:4,fill:r.BRAND_RED,stroke:"none"}),(0,t.jsx)("rect",{x:n.x+.08*n.w,y:n.y+.22*n.h,width:.84*n.w,height:.2*n.h,rx:10,fill:r.BRAND_RED,stroke:"none",opacity:.85})]},e.kind)})})})},"FlowLabels",0,function(){return(0,t.jsx)(s,{children:({w:e,h:n})=>{let r=(0,a.flowGeometry)(e,n),s={prompt:r.prompt,agents:r.agents,truth:r.truth,ios:r.apps[0],android:r.apps[1],web:r.apps[2],check:r.check},i=r.apps[1][0]-r.apps[0][0]-12;return l.map(e=>{let[n,a]=s[e.key],l="ios"===e.key||"android"===e.key||"web"===e.key,o=l?1.3*r.r:r.r,c=r.vertical?l?{left:n,top:a+o+10,width:i,transform:"translateX(-50%)"}:{left:n+o+14,top:a,transform:"translateY(-50%)"}:{left:n,top:a+o+12,transform:"translateX(-50%)"},d=r.vertical&&l;return(0,t.jsxs)("div",{className:`figure-label absolute ${d?"":"whitespace-nowrap"} ${r.vertical&&!l?"text-left":"text-center"}`,style:c,children:[(0,t.jsx)("p",{className:"text-[13.5px] font-[650] tracking-[-0.01em] wide",children:e.title}),(0,t.jsx)("p",{className:"label mt-1 text-muted",children:e.note})]},e.key)})}})},"ParityCells",0,function(){return(0,t.jsx)(s,{children:({w:e,h:n})=>{let{label:r,colW:s,rowH:i,cells:l}=(0,a.parityGrid)(e,n,e<560);return(0,t.jsxs)(t.Fragment,{children:[a.PARITY_COLS.map((e,n)=>(0,t.jsx)("span",{className:"label absolute -translate-x-1/2 text-muted",style:{left:r+s*(n+.5),top:-26},children:e},e)),a.PARITY_ROWS.map((e,n)=>(0,t.jsx)("span",{className:"label absolute -translate-y-1/2 tabular-nums text-ink/80",style:{left:0,top:i*(n+.5)},children:e},e)),l.map(e=>e.tested?(0,t.jsx)("span",{className:"colony-fallback absolute rounded-[5px] bg-brand",style:{left:e.x,top:e.y,width:e.w,height:e.h}},`${e.r}-${e.c}`):(0,t.jsx)("span",{className:"absolute flex items-center justify-center rounded-[5px] border border-dashed border-line-strong",style:{left:e.x,top:e.y,width:e.w,height:e.h},children:(0,t.jsx)("span",{className:"label text-faint",children:"not tested"})},`${e.r}-${e.c}`))]})}})}])},36960,e=>{"use strict";var t=e.i(46882),n=e.i(55118);let r=new Set("static let var func enum struct class import val object fun const export return get type as true false nonisolated".split(" ")),a=/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/[^\n]*|<!--[\s\S]*?-->|<\/?[\w-]+|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w]*\b|--[\w-]+)/g;function s({title:e,label:i,code:l,className:o=""}){return(0,t.jsxs)("figure",{className:`flex min-w-0 flex-col overflow-hidden rounded-[14px] bg-mist ring-1 ring-inset ring-line ${o}`,children:[(0,t.jsxs)("figcaption",{className:"label flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-muted",children:[(0,t.jsx)("span",{className:"truncate text-ink",children:e}),i?(0,t.jsx)("span",{className:"shrink-0",children:i}):null]}),(0,t.jsx)("pre",{className:"overflow-x-auto px-4 py-4 text-[12.5px] leading-[1.7] text-ink/80 [scrollbar-width:thin]",children:(0,t.jsx)("code",{children:function(e){let s=[],i=0,l=0;for(let o of e.matchAll(a)){let a=o[0],c=o.index??0;c>i&&s.push(e.slice(i,c));let d="";a.startsWith('"')||a.startsWith("'")?d="text-brand":a.startsWith("//")||a.startsWith("<!--")?d="text-faint":a.startsWith("<")?d="text-ink/55":a.startsWith("--")||/^\d/.test(a)?d="text-ink":r.has(a)&&(d="font-semibold text-ink"),s.push(d?(0,t.jsx)("span",{className:d,children:a},l++):(0,t.jsx)(n.Fragment,{children:a},l++)),i=c+a.length}return i<e.length&&s.push(e.slice(i)),s}(l)})})]})}let i=[{id:"tokens",name:"Design tokens",source:{title:"contracts/tokens.json",code:`"color": {
  "primary": { "light": "#4F46E5", "dark": "#A5B4FC" }
},
"spacing": { "md": 12 },
"typography": {
  "title": { "size": 20, "weight": 600,
             "ios": "title3", "android": "titleLarge" }
}`},outputs:[{title:"Generated/Tokens.swift",label:"iOS",code:`static let primary = Color(light: 0x4F46E5FF,
                           dark: 0xA5B4FCFF)
static let md: CGFloat = 12
static let title: Font = .title3.weight(.semibold)`},{title:"generated/Tokens.kt",label:"Android",code:`primary = Color(0xFF4F46E5),
val md = 12.dp
val title = TextStyle(fontWeight = FontWeight.SemiBold,
  fontSize = 20.sp, lineHeight = 26.sp)`},{title:"generated/tokens.css",label:"Web",code:`--color-primary: #4f46e5;
--spacing-md: 12px;
--text-title: 1.25rem;
.dark { --color-primary: #a5b4fc; }`}]},{id:"strings",name:"Strings",source:{title:"contracts/strings/en.json",code:`"settings.title": "Settings",
"settings.about.version": "Version {version} ({build:int})",
"notes.count": {
  "one": "{count} note",
  "other": "{count} notes"
}`},outputs:[{title:"Generated/Strings.swift",label:"iOS",code:`static var settingsTitle: String
static func settingsAboutVersion(
  version: String, build: Int) -> String
// + Localizable.xcstrings, plurals included`},{title:"res/values/generated_strings.xml",label:"Android",code:`<string name="settings_title">Settings</string>
<string name="settings_about_version">Version %1$s (%2$d)</string>
<plurals name="notes_count">…</plurals>`},{title:"generated/strings.ts",label:"Web",code:`strings.settingsTitle
strings.settingsAboutVersion({ version, build })
strings.notesCount(3) // Intl.PluralRules`}]},{id:"icons",name:"Icons",source:{title:"contracts/icons.json",code:`"settings": {
  "ios": "gearshape",
  "android": "Icons.Filled.Settings",
  "web": "Settings"
}`},outputs:[{title:"Generated/Icons.swift",label:"iOS",code:`static let settings = "gearshape"
// Image(systemName: AppIcon.settings)`},{title:"generated/Icons.kt",label:"Android",code:`val settings: ImageVector
  get() = Icons.Filled.Settings`},{title:"generated/icons.ts",label:"Web",code:`import { Settings } from 'lucide-react'
settings: Settings,`}]},{id:"identity",name:"App identity",source:{title:"contracts/app.json",code:`{
  "name": "My App",
  "id": "com.acme.myapp",
  "version": "1.0.0",
  "build": 1
}`},outputs:[{title:"Config/Identity.xcconfig",label:"iOS",code:`APP_DISPLAY_NAME = My App
APP_BUNDLE_ID = com.acme.myapp
APP_VERSION = 1.0.0`},{title:"app/identity.properties",label:"Android",code:`applicationId=com.acme.myapp
versionName=1.0.0
versionCode=1`},{title:"generated/app.ts",label:"Web",code:`export const AppIdentity = {
  name: "My App",
  version: "1.0.0",
} as const`}]}];e.s(["ContractsShowcase",0,function(){let[e,r]=(0,n.useState)(0),a=i[e];return(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{role:"tablist","aria-label":"Contracts",className:"flex flex-wrap gap-x-8 gap-y-3 border-b border-line",children:i.map((n,a)=>(0,t.jsxs)("button",{role:"tab",type:"button","aria-selected":a===e,onClick:()=>r(a),className:`relative -mb-px pb-4 text-[1.05rem] font-[640] tracking-[-0.02em] transition-colors wide ${a===e?"text-ink":"text-ink/45 hover:text-ink/75"}`,children:[n.name,(0,t.jsx)("span",{className:`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-brand transition-transform duration-500 ease-[var(--ease-expo)] ${a===e?"scale-x-100":"scale-x-0"}`})]},n.id))}),(0,t.jsxs)("div",{role:"tabpanel",className:"mt-8 grid grid-cols-1 animate-[fade-in_0.6s_var(--ease-expo)] gap-4 lg:grid-cols-12",children:[(0,t.jsx)("div",{className:"lg:col-span-5",children:(0,t.jsx)(s,{title:a.source.title,label:"You write",code:a.source.code,className:"h-full"})}),(0,t.jsx)("div",{className:"grid grid-cols-1 gap-4 lg:col-span-7",children:a.outputs.map(e=>(0,t.jsx)(s,{title:e.title,label:e.label,code:e.code},e.title))})]},a.id),(0,t.jsx)("p",{className:"label mt-6 text-muted",children:"Fig. 05 · make gen writes these. Nobody edits them by hand, and make check fails if they drift."})]})}],36960)},80332,e=>{"use strict";var t=e.i(46882),n=e.i(55118);let r=[["home","light"],["settings","light"],["settings","dark"],["home","dark"]];function a({platform:e,screen:n,mode:s,width:i,height:l}){return(0,t.jsx)(t.Fragment,{children:r.map(([r,a],o)=>(0,t.jsx)("img",{src:`/geeknative/screens/${e}-${r}-${a}.webp`,alt:0===o?`${"ios"===e?"iOS":"android"===e?"Android":"Web"} app, ${r} screen`:"","aria-hidden":r!==n||a!==s||void 0,width:i,height:l,loading:"lazy",decoding:"async",className:`screen-layer block h-auto w-full ${0===o?"relative":"absolute inset-0"} ${r===n&&a===s?"opacity-100":"opacity-0"}`},`${r}-${a}`))})}function s({children:e}){return(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)("span",{className:"absolute -left-[1.7%] top-[16.5%] h-[3%] w-[1.7%] rounded-l-[3px] bg-[#38383c]"}),(0,t.jsx)("span",{className:"absolute -left-[1.7%] top-[22.5%] h-[6.2%] w-[1.7%] rounded-l-[3px] bg-[#38383c]"}),(0,t.jsx)("span",{className:"absolute -left-[1.7%] top-[30%] h-[6.2%] w-[1.7%] rounded-l-[3px] bg-[#38383c]"}),(0,t.jsx)("span",{className:"absolute -right-[1.7%] top-[25.5%] h-[9.5%] w-[1.7%] rounded-r-[3px] bg-[#38383c]"}),(0,t.jsx)("div",{className:"device-shadow rounded-[16%/7.4%] bg-[linear-gradient(150deg,#5b5b60_0%,#1d1d20_38%,#2c2c30_72%,#505055_100%)] p-[1.1%]",children:(0,t.jsx)("div",{className:"rounded-[15%/6.95%] bg-[#060607] p-[3.3%]",children:(0,t.jsxs)("div",{className:"relative isolate overflow-hidden rounded-[12%/5.5%] bg-black",children:[e,(0,t.jsx)("span",{className:"absolute left-1/2 top-[1.3%] h-[4.1%] w-[31%] -translate-x-1/2 rounded-full bg-black"})]})})})]})}function i({children:e}){return(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)("span",{className:"absolute -right-[1.6%] top-[18%] h-[7.5%] w-[1.6%] rounded-r-[3px] bg-[#2f3034]"}),(0,t.jsx)("span",{className:"absolute -right-[1.6%] top-[28.5%] h-[12%] w-[1.6%] rounded-r-[3px] bg-[#2f3034]"}),(0,t.jsx)("div",{className:"device-shadow rounded-[12%/5.4%] bg-[linear-gradient(160deg,#47484d_0%,#151517_42%,#2a2b2f_100%)] p-[1%]",children:(0,t.jsx)("div",{className:"rounded-[11%/4.95%] bg-[#070708] p-[2.7%]",children:(0,t.jsxs)("div",{className:"relative isolate overflow-hidden rounded-[8%/3.6%] bg-black",children:[e,(0,t.jsx)("span",{className:"absolute left-1/2 top-[1.25%] aspect-square w-[4.4%] -translate-x-1/2 rounded-full bg-[#050505] ring-[1.5px] ring-[#202024]"})]})})})]})}function l(){return(0,t.jsxs)("svg",{viewBox:"0 0 64 64",className:"size-[14px] shrink-0","aria-hidden":!0,children:[(0,t.jsx)("rect",{width:"64",height:"64",rx:"14",fill:"#4F46E5"}),(0,t.jsx)("circle",{cx:"19",cy:"32",r:"5.5",fill:"#fff"}),(0,t.jsx)("circle",{cx:"32",cy:"32",r:"5.5",fill:"#fff"}),(0,t.jsx)("circle",{cx:"45",cy:"32",r:"5.5",fill:"#fff"})]})}function o({mode:e,path:n,children:r}){let a="dark"===e;return(0,t.jsxs)("div",{className:`device-shadow overflow-hidden rounded-[11px] ring-1 transition-colors duration-500 ${a?"bg-[#202124] ring-white/10":"bg-[#dfe3e8] ring-black/10"}`,children:[(0,t.jsxs)("div",{className:"flex h-[36px] items-end gap-2 pl-3 pr-2",children:[(0,t.jsxs)("div",{className:"flex items-center gap-[7px] self-center pr-3",children:[(0,t.jsx)("span",{className:"size-[11px] rounded-full bg-[#ff5f57]"}),(0,t.jsx)("span",{className:"size-[11px] rounded-full bg-[#febc2e]"}),(0,t.jsx)("span",{className:"size-[11px] rounded-full bg-[#28c840]"})]}),(0,t.jsxs)("div",{className:`flex h-[28px] w-[min(220px,45%)] items-center gap-2 rounded-t-[9px] px-3 text-[12px] transition-colors duration-500 ${a?"bg-[#35363a] text-white/90":"bg-white text-[#3c4043]"}`,children:[(0,t.jsx)(l,{}),(0,t.jsx)("span",{className:"min-w-0 flex-1 truncate",children:"/settings"===n?"Settings · My App":"My App"}),(0,t.jsx)("span",{className:"text-[13px] leading-none opacity-50",children:"×"})]}),(0,t.jsx)("span",{className:`mb-[7px] ml-1 text-[17px] leading-none ${a?"text-white/60":"text-[#5f6368]"}`,children:"+"})]}),(0,t.jsxs)("div",{className:`flex h-[38px] items-center gap-3 px-3 transition-colors duration-500 ${a?"bg-[#35363a] text-white/70":"bg-white text-[#5f6368]"}`,children:[(0,t.jsx)("svg",{viewBox:"0 0 24 24",className:"size-[15px] shrink-0",fill:"none",stroke:"currentColor",strokeWidth:"2","aria-hidden":!0,children:(0,t.jsx)("path",{d:"M19 12H5M11 6l-6 6 6 6",strokeLinecap:"round",strokeLinejoin:"round"})}),(0,t.jsx)("svg",{viewBox:"0 0 24 24",className:"size-[15px] shrink-0 opacity-40",fill:"none",stroke:"currentColor",strokeWidth:"2","aria-hidden":!0,children:(0,t.jsx)("path",{d:"M5 12h14M13 6l6 6-6 6",strokeLinecap:"round",strokeLinejoin:"round"})}),(0,t.jsx)("svg",{viewBox:"0 0 24 24",className:"size-[15px] shrink-0",fill:"none",stroke:"currentColor",strokeWidth:"2","aria-hidden":!0,children:(0,t.jsx)("path",{d:"M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5",strokeLinecap:"round",strokeLinejoin:"round"})}),(0,t.jsxs)("div",{className:`flex h-[28px] min-w-0 flex-1 items-center gap-2 rounded-full px-3.5 text-[12.5px] transition-colors duration-500 ${a?"bg-[#202124] text-white/85":"bg-[#f1f3f4] text-[#202124]"}`,children:[(0,t.jsx)("svg",{viewBox:"0 0 24 24",className:"size-[12px] shrink-0 opacity-70",fill:"currentColor","aria-hidden":!0,children:(0,t.jsx)("path",{d:"M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1Zm2 0h8V8a4 4 0 1 0-8 0v2Z"})}),(0,t.jsxs)("span",{className:"truncate",children:["localhost:3000",(0,t.jsx)("span",{className:"opacity-60",children:n})]})]})]}),(0,t.jsx)("div",{className:"relative isolate",children:r})]})}function c({label:e,value:n,options:r,onChange:a}){return(0,t.jsx)("div",{role:"radiogroup","aria-label":e,className:"inline-flex rounded-full bg-white p-1 ring-1 ring-inset ring-line-strong",children:r.map(([e,r])=>(0,t.jsx)("button",{type:"button",role:"radio","aria-checked":n===e,onClick:()=>a(e),className:`label rounded-full px-4 py-2 transition-colors duration-300 ${n===e?"bg-ink text-white":"text-ink/65 hover:text-ink"}`,children:r},e))})}let d={ios:["iOS 26","SwiftUI"],web:["Chrome","TanStack Start"],android:["Android 15","Jetpack Compose"]};function u({platform:e}){return(0,t.jsxs)("p",{className:"label mt-5 flex items-center justify-center gap-2 text-muted",children:[(0,t.jsx)("span",{className:"text-ink",children:d[e][0]}),(0,t.jsx)("span",{className:"text-faint",children:"/"}),(0,t.jsx)("span",{children:d[e][1]})]})}e.s(["DeviceShowcase",0,function({className:e="",compact:l=!1}){let[d,h]=(0,n.useState)(0),[f,p]=(0,n.useState)(!l),[m,x]=r[d],g=(0,n.useRef)(null);(0,n.useEffect)(()=>{let e=g.current;if(!f||!e||matchMedia("(prefers-reduced-motion: reduce)").matches)return;let t=0,n=new IntersectionObserver(([e])=>{window.clearInterval(t),e.isIntersecting&&(t=window.setInterval(()=>h(e=>(e+1)%r.length),3400))});return n.observe(e),()=>{n.disconnect(),window.clearInterval(t)}},[f]);let v=(e,t)=>{p(!1),h(r.findIndex(([n,r])=>n===e&&r===t))},b="settings"===m?"/settings":"/";return(0,t.jsxs)("div",{ref:g,className:e,children:[(0,t.jsxs)("div",{className:"grid grid-cols-2 items-end gap-x-[6%] gap-y-12 md:flex md:justify-center md:gap-x-[3.2%]",children:[(0,t.jsxs)("div",{className:"md:w-[18.5%]",children:[(0,t.jsx)(s,{children:(0,t.jsx)(a,{platform:"ios",screen:m,mode:x,width:600,height:1304})}),l?null:(0,t.jsx)(u,{platform:"ios"})]}),(0,t.jsxs)("div",{className:"order-first col-span-2 md:order-none md:w-[56%]",children:[(0,t.jsx)(o,{mode:x,path:b,children:(0,t.jsx)(a,{platform:"web",screen:m,mode:x,width:1600,height:1e3})}),l?null:(0,t.jsx)(u,{platform:"web"})]}),(0,t.jsxs)("div",{className:"md:w-[18.5%]",children:[(0,t.jsx)(i,{children:(0,t.jsx)(a,{platform:"android",screen:m,mode:x,width:600,height:1333})}),l?null:(0,t.jsx)(u,{platform:"android"})]})]}),(0,t.jsxs)("div",{className:`flex flex-wrap items-center justify-center gap-3 ${l?"mt-8":"mt-12"}`,children:[(0,t.jsx)(c,{label:"Screen",value:m,options:[["home","Home"],["settings","Settings"]],onChange:e=>v(e,x)}),(0,t.jsx)(c,{label:"Appearance",value:x,options:[["light","Light"],["dark","Dark"]],onChange:e=>v(m,e)})]})]})}])},45057,e=>{"use strict";var t=e.i(46882),n=e.i(54249),r=e.i(55118),a=e.i(54210);function s({className:e="",disc:n=a.BRAND_RED,ant:r="#fff",title:i}){return(0,t.jsxs)("svg",{viewBox:"0 0 24 24",className:e,role:i?"img":void 0,"aria-label":i,"aria-hidden":!i||void 0,children:[(0,t.jsx)("circle",{...a.MARK_DISC,fill:n}),(0,t.jsx)("g",{fill:r,children:a.MARK_SEGMENTS.map((e,n)=>(0,t.jsx)("circle",{...e},n))}),(0,t.jsx)("g",{fill:"none",stroke:r,strokeWidth:a.MARK_STROKE,strokeLinecap:"round",children:a.MARK_ANTENNAE.map((e,n)=>(0,t.jsx)("path",{d:e},n))})]})}function i({className:e="",tone:n="ink"}){return(0,t.jsxs)("span",{className:`inline-flex items-center gap-[0.42em] ${"white"===n?"text-white":"text-ink"} ${e}`,children:[(0,t.jsx)(s,{className:"h-[1.18em] w-[1.18em] shrink-0"}),(0,t.jsx)("span",{className:"text-[1em] font-[760] leading-none tracking-[-0.035em] wide",children:"geeknative"})]})}var l=e.i(42165);let o="https://github.com/GeekyAnts/geeknative",c=[{label:"How it works",href:"/#how-it-works"},{label:"Apps",href:"/#apps"},{label:"Contracts",href:"/#contracts"},{label:"Agents",href:"/#agents"},{label:"Docs",href:"/docs/"}];function d({className:e=""}){return(0,t.jsx)("svg",{viewBox:"0 0 16 16",className:e,"aria-hidden":!0,fill:"currentColor",children:(0,t.jsx)("path",{d:"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"})})}e.s(["GitHubIcon",0,d,"Nav",0,function({solid:e=!1}){let[a,s]=(0,r.useState)(!1),[u,h]=(0,r.useState)(!1);(0,r.useEffect)(()=>{let e=()=>s(window.scrollY>8);return e(),window.addEventListener("scroll",e,{passive:!0}),()=>window.removeEventListener("scroll",e)},[]),(0,r.useEffect)(()=>{document.documentElement.style.overflow=u?"hidden":"";let e=e=>"Escape"===e.key&&h(!1);return window.addEventListener("keydown",e),()=>window.removeEventListener("keydown",e)},[u]);let f=e||a||u;return(0,t.jsxs)("header",{className:`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${f?"bg-white/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl":"bg-transparent"}`,children:[(0,t.jsxs)("div",{className:`${l.wrap} flex h-16 items-center justify-between gap-6 lg:h-[72px]`,children:[(0,t.jsx)(n.default,{href:"/",className:"relative z-10 -m-2 p-2","aria-label":"geeknative home",children:(0,t.jsx)(i,{className:"text-[20px] lg:text-[22px]"})}),(0,t.jsx)("nav",{"aria-label":"Primary",className:"hidden lg:block",children:(0,t.jsx)("ul",{className:"flex items-center gap-9",children:c.map(e=>(0,t.jsx)("li",{children:(0,t.jsxs)(n.default,{href:e.href,className:"group relative py-2 text-[14.5px] font-medium tracking-[-0.005em] text-ink/80 transition-colors hover:text-ink",children:[e.label,(0,t.jsx)("span",{className:"absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-brand transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-x-100"})]})},e.label))})}),(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)("a",{href:o,className:"hidden size-10 items-center justify-center rounded-full text-ink/80 transition-colors hover:text-ink sm:inline-flex","aria-label":"geeknative on GitHub",children:(0,t.jsx)(d,{className:"size-[19px]"})}),(0,t.jsx)("div",{className:"hidden sm:block",children:(0,t.jsx)(l.Button,{href:"/docs/start-here/quick-start/",className:"h-10 px-5 text-[14px]",children:"Get started"})}),(0,t.jsxs)("button",{type:"button",onClick:()=>h(e=>!e),"aria-expanded":u,"aria-controls":"mobile-menu",className:"relative z-10 -mr-2 inline-flex size-11 items-center justify-center lg:hidden",children:[(0,t.jsx)("span",{className:"sr-only",children:u?"Close menu":"Open menu"}),(0,t.jsxs)("span",{className:"relative block h-3 w-6",children:[(0,t.jsx)("span",{className:`absolute left-0 top-0 h-[1.5px] w-6 bg-ink transition-transform duration-500 ease-[var(--ease-expo)] ${u?"translate-y-[5.25px] rotate-45":""}`}),(0,t.jsx)("span",{className:`absolute bottom-0 left-0 h-[1.5px] w-6 bg-ink transition-transform duration-500 ease-[var(--ease-expo)] ${u?"-translate-y-[5.25px] -rotate-45":""}`})]})]})]})]}),(0,t.jsx)("div",{id:"mobile-menu",className:`fixed inset-0 top-16 bg-white transition-[opacity,visibility] duration-500 lg:hidden ${u?"visible opacity-100":"invisible opacity-0"}`,children:(0,t.jsxs)("nav",{"aria-label":"Mobile",className:`${l.wrap} flex h-full flex-col pb-10 pt-6`,children:[(0,t.jsx)("ul",{className:"border-t border-line",children:c.map((e,r)=>(0,t.jsx)("li",{className:"border-b border-line",children:(0,t.jsxs)(n.default,{href:e.href,onClick:()=>h(!1),className:"flex items-center justify-between py-5 text-[1.75rem] font-semibold tracking-[-0.03em] wide",children:[(0,t.jsx)("span",{children:e.label}),(0,t.jsxs)("span",{className:"label text-faint",children:["0",r+1]})]})},e.label))}),(0,t.jsxs)("div",{className:"mt-auto space-y-6",children:[(0,t.jsx)(l.Button,{href:"/docs/start-here/quick-start/",className:"w-full justify-between",children:"Get started"}),(0,t.jsxs)("a",{href:o,className:"flex items-center justify-between text-lg",children:["GitHub ",(0,t.jsx)(l.Arrow,{direction:"up-right"})]})]})]})})]})}],45057)},19332,e=>{"use strict";var t=e.i(46882),n=e.i(55118);e.s(["CopyCommand",0,function({command:e,tone:r="light",className:a=""}){let[s,i]=(0,n.useState)(!1),l=async()=>{try{await navigator.clipboard.writeText(e),i(!0),setTimeout(()=>i(!1),1600)}catch{}};return(0,t.jsxs)("div",{className:`flex min-w-0 items-center gap-3 rounded-full py-2 pl-5 pr-2 ring-1 ring-inset ${{light:"bg-mist text-ink ring-line",dark:"bg-ink text-white ring-white/10",red:"bg-white/10 text-white ring-white/30"}[r]} ${a}`,children:[(0,t.jsx)("span",{"aria-hidden":!0,className:"light"===r?"font-mono text-[13px] text-brand":"font-mono text-[13px] opacity-60",children:"$"}),(0,t.jsx)("code",{className:"min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] [scrollbar-width:none]",children:e}),(0,t.jsx)("button",{type:"button",onClick:l,className:`label shrink-0 rounded-full px-3.5 py-2 transition-colors ${"light"===r?"bg-white text-ink ring-1 ring-inset ring-line hover:bg-ink hover:text-white":"bg-white text-ink hover:bg-ink hover:text-white"}`,"aria-live":"polite",children:s?"Copied":"Copy"})]})}])},46539,e=>{"use strict";var t=e.i(46882),n=e.i(55118);e.s(["Reveal",0,function({as:e="div",className:t="",delay:r=0,children:a,threshold:s=.15}){let[i,l]=(0,n.useState)(null);return(0,n.useEffect)(()=>{if(!i)return;let e=new IntersectionObserver(([t])=>{t.isIntersecting&&(i.classList.add("is-in"),e.disconnect())},{threshold:s,rootMargin:"0px 0px -8% 0px"});return e.observe(i),()=>e.disconnect()},[i,s]),(0,n.createElement)(e,{ref:l,className:`reveal ${t}`,style:{"--d":`${r}ms`}},a)},"Words",0,function({text:e,className:r="",start:a=0}){let s=e.split(" ");return(0,t.jsx)("span",{className:`words ${r}`,children:s.map((e,r)=>(0,t.jsxs)(n.Fragment,{children:[(0,t.jsx)("span",{className:"word",children:(0,t.jsx)("span",{style:{"--i":r+a},children:e})}),r<s.length-1?" ":null]},r))})}])},884,e=>{"use strict";var t=e.i(46882),n=e.i(55118);e.s(["ScrubText",0,function({text:e,className:r="",accentFrom:a,decorative:s=!1}){let i=(0,n.useRef)(null),l=e.split(" ");return(0,n.useEffect)(()=>{let e=i.current;if(!e)return;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return void e.style.setProperty("--p","1");let t=0,n=()=>{t=0;let n=e.getBoundingClientRect(),r=window.innerHeight,a=(.86*r-n.top)/(n.height+.42*r);e.style.setProperty("--p",Math.min(1,Math.max(0,a)).toFixed(4))},r=()=>{t||(t=requestAnimationFrame(n))};return n(),window.addEventListener("scroll",r,{passive:!0}),window.addEventListener("resize",r),()=>{window.removeEventListener("scroll",r),window.removeEventListener("resize",r),cancelAnimationFrame(t)}},[]),(0,t.jsx)("p",{ref:i,"aria-hidden":s||void 0,className:`scrub ${r}`,style:{"--p":1},children:l.map((e,r)=>(0,t.jsxs)(n.Fragment,{children:[(0,t.jsx)("span",{className:void 0!==a&&r>=a?"text-brand":void 0,style:{"--t":(r/l.length).toFixed(4)},children:e}),r<l.length-1?" ":null]},r))})}])},12635,e=>{"use strict";var t=e.i(46882),n=e.i(55118),r=e.i(55312);function a(e,t){return(0,n.useSyncExternalStore)(r.colonyStore.subscribe,()=>e(r.colonyStore),()=>t)}e.s(["ColonyCount",0,function({stage:e,fallback:n}){let r=a(t=>"running"===t.status?t.counts.get(e)??0:0,0);return(0,t.jsx)(t.Fragment,{children:r>0?r.toLocaleString("en-US"):n})},"ColonyHint",0,function({children:e}){let r=a(e=>"running"===e.status&&e.enabled,!1),[s,i]=(0,n.useState)(!1);return((0,n.useEffect)(()=>{let e=matchMedia("(prefers-reduced-motion: reduce)"),t=()=>i(e.matches);return t(),e.addEventListener("change",t),()=>e.removeEventListener("change",t)},[]),!r||s)?null:(0,t.jsx)(t.Fragment,{children:e})},"ColonyToggle",0,function({className:e=""}){let n=a(e=>"unsupported"===e.status,!1),s=a(e=>e.enabled,!0);return n?null:(0,t.jsxs)("button",{type:"button",onClick:()=>r.colonyStore.setEnabled(!s),"aria-pressed":s,className:`group inline-flex items-center gap-3 ${e}`,children:[(0,t.jsx)("span",{className:`relative block h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${s?"bg-brand":"bg-line-strong"}`,children:(0,t.jsx)("span",{className:`absolute left-0.5 top-0.5 block size-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${s?"translate-x-4":"translate-x-0"}`})}),(0,t.jsx)("span",{className:"label",children:s?"Colony on":"Colony resting"})]})},"CountUp",0,function({value:e,suffix:r="",duration:a=1800}){let s=(0,n.useRef)(null),[i,l]=(0,n.useState)(e);return(0,n.useEffect)(()=>{let t=s.current;if(!t||matchMedia("(prefers-reduced-motion: reduce)").matches)return;l(0);let n=0,r=new IntersectionObserver(([t])=>{if(!t.isIntersecting)return;r.disconnect();let s=performance.now(),i=t=>{let r=Math.min(1,(t-s)/a);l(Math.round(e*(1-Math.pow(1-r,4)))),r<1&&(n=requestAnimationFrame(i))};n=requestAnimationFrame(i)},{threshold:.6});return r.observe(t),()=>{r.disconnect(),cancelAnimationFrame(n)}},[e,a]),(0,t.jsxs)("span",{ref:s,className:"tabular-nums",children:[i.toLocaleString("en-US"),r]})},"OfficeClock",0,function({tz:e}){let[r,a]=(0,n.useState)(null);return(0,n.useEffect)(()=>{let t=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",timeZone:e}),n=()=>a(t.format(new Date));n();let r=setInterval(n,2e4);return()=>clearInterval(r)},[e]),(0,t.jsx)("span",{className:"tabular-nums",children:r??"--:--"})}])},42165,e=>{"use strict";var t=e.i(46882),n=e.i(54249);function r({className:e="",direction:n="right"}){return(0,t.jsx)("svg",{viewBox:"0 0 16 16",className:`size-[1em] shrink-0 ${"up-right"===n?"-rotate-45":"down"===n?"rotate-90":""} ${e}`,"aria-hidden":!0,fill:"none",stroke:"currentColor",strokeWidth:"1.6",children:(0,t.jsx)("path",{d:"M1.5 8h12.5M9 3l5 5-5 5",strokeLinecap:"square"})})}let a={ink:"bg-ink text-white hover:bg-brand",white:"bg-white text-brand hover:bg-ink hover:text-white",ghost:"text-ink ring-1 ring-inset ring-line-strong hover:ring-ink","ghost-white":"text-white ring-1 ring-inset ring-white/40 hover:ring-white"};e.s(["Arrow",0,r,"Button",0,function({href:e,children:s,tone:i="ink",arrow:l=!0,className:o="",...c}){let d=e.startsWith("http")||e.startsWith("mailto:"),u=`group inline-flex h-12 items-center gap-3 rounded-full px-6 text-[15px] font-medium tracking-[-0.005em] transition-colors duration-300 ${a[i]} ${o}`,h=(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{children:s}),l?(0,t.jsxs)("span",{className:"relative -mr-1 inline-flex size-4 overflow-hidden",children:[(0,t.jsx)(r,{className:"absolute inset-0 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-full"}),(0,t.jsx)(r,{className:"absolute inset-0 -translate-x-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0"})]}):null]});return d?(0,t.jsx)("a",{href:e,className:u,...c,children:h}):(0,t.jsx)(n.default,{href:e,className:u,children:h})},"Dot",0,function({className:e=""}){return(0,t.jsx)("span",{"aria-hidden":!0,className:`inline-block size-[7px] shrink-0 rounded-full bg-brand ${e}`})},"wrap",0,"mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12"])},54210,e=>{"use strict";e.s(["BRAND_RED",0,"#CA0515","MARK_ANTENNAE",0,["M17.02 7.69C18.05 7.01 19.04 6.87 20.13 6.98","M16.31 6.98C16.99 5.95 17.13 4.96 17.02 3.87"],"MARK_BOX",0,{w:24,h:24},"MARK_DISC",0,{cx:12,cy:12,r:12},"MARK_SEGMENTS",0,[{cx:8.54,cy:15.46,r:3.3},{cx:12.88,cy:11.12,r:2.05},{cx:15.89,cy:8.11,r:1.55}],"MARK_STROKE",0,.8])},19303,e=>{"use strict";var t=e.i(54210),n=e.i(70566);function r(e){let t=e>>>0;return()=>{let e=t=t+0x6d2b79f5>>>0;return e=Math.imul(e^e>>>15,1|e),(((e^=e+Math.imul(e^e>>>7,61|e))^e>>>14)>>>0)/0x100000000}}function a(e,t){for(let n=e.length-1;n>0;n--){let r=Math.floor(t()*(n+1));[e[n],e[r]]=[e[r],e[n]]}return e}let s=(e,t,n)=>Math.min(n,Math.max(t,e));function i(e,t,n,r=800){let a=Math.min(1,r/Math.max(e,t)),s=Math.max(1,Math.round(e*a)),l=Math.max(1,Math.round(t*a)),o=document.createElement("canvas");o.width=s,o.height=l;let c=o.getContext("2d",{willReadFrequently:!0});return c.scale(s/e,l/t),c.fillStyle="#000",c.strokeStyle="#000",n(c),{data:c.getImageData(0,0,s,l).data,cw:s,ch:l,sx:s/e,sy:l/t,w:e,h:t}}function l(e,t,n){let r=Math.floor(t*e.sx),a=Math.floor(n*e.sy);return!(r<0)&&!(a<0)&&!(r>=e.cw)&&!(a>=e.ch)&&e.data[(a*e.cw+r)*4+3]>127}function o(e){let t=0;for(let n=3;n<e.data.length;n+=4)e.data[n]>127&&t++;return t/(e.sx*e.sy)}function c(e,t,n){let r=o(e);if(r<=0||t<=0)return[];let s=.93*Math.sqrt(r/t),i=[],c=0;for(let t=.5*s;t<e.h;t+=.866*s,c++)for(let r=c%2?s:.5*s;r<e.w;r+=s){let a=r+(n()-.5)*s*.55,o=t+(n()-.5)*s*.55;l(e,a,o)&&i.push([a,o])}a(i,n),i.length>t&&(i.length=t);let d=0;for(;i.length<t&&d++<80*t;){let t=n()*e.w,r=n()*e.h;l(e,t,r)&&i.push([t,r])}return i}let d=(e,t,n=1)=>Math.round(e/(t*t*.3)*n);function u(e,t,n,r,a,s){e.beginPath(),e.roundRect(t,n,r,a,s)}class h{n;w;h;a;b;i;paths;raw;constructor(e,t,n){this.n=e,this.w=t,this.h=n,this.i=0,this.paths=[],this.raw=[],this.a=new Float32Array(4*e),this.b=new Float32Array(4*e)}get full(){return this.i>=this.n}get left(){return this.n-this.i}cx(e){return e-this.w/2}cy(e){return this.h/2-e}put(e,t,n,r,a,s,i,l){if(this.full)return;let o=4*this.i;this.a[o]=e,this.a[o+1]=t,this.a[o+2]=n,this.a[o+3]=r,this.b[o]=a,this.b[o+1]=s,this.b[o+2]=i,this.b[o+3]=l,this.i++}point(e,t,n=1){this.put(this.cx(e),this.cy(t),0,0,0,0,0,n)}points(e,t=1){for(let[n,r]of e)this.point(n,r,t)}segment(e,t,n,r,a,s,i,l=1){let o=Math.hypot(n-e,r-t)||1;this.put(this.cx(e),this.cy(t),this.cx(n),this.cy(r),a,s/o,i,l+10)}addPath(e,t){let r=t?[...e,e[0]]:e,a=[0];for(let e=1;e<r.length;e++)a.push(a[e-1]+Math.hypot(r[e][0]-r[e-1][0],r[e][1]-r[e-1][1]));let i=a[a.length-1]||1,l=new Float32Array(2*n.PATH_SAMPLES),o=[],c=0;for(let e=0;e<n.PATH_SAMPLES;e++){let t=e/(n.PATH_SAMPLES-1)*i;for(;c<a.length-2&&a[c+1]<t;)c++;let d=a[c+1]-a[c]||1,u=s((t-a[c])/d,0,1),h=r[c][0]+(r[c+1][0]-r[c][0])*u,f=r[c][1]+(r[c+1][1]-r[c][1])*u;o.push([h,f]),l[2*e]=this.cx(h),l[2*e+1]=this.cy(f)}return this.paths.push({pts:l,closed:t,length:i}),this.raw.push(o),this.paths.length-1}nearestU(e,t,r){let a=this.raw[e],s=0,i=1/0;for(let e=0;e<a.length;e++){let n=(a[e][0]-t)**2+(a[e][1]-r)**2;n<i&&(i=n,s=e)}return s/(n.PATH_SAMPLES-1)}path(e,t,n,r,a=1){let s=this.paths[e];this.put(e,+!!s.closed,s.length,0,(t%1+1)%1,n/s.length,r,a+20)}lane(e,t,n,r,a,s){let i=Math.max(1,Math.floor(this.paths[e].length/t));for(let t=0;t<i&&!this.full;t++)this.path(e,(t+(s()-.5)*.5)/i,n*(.94+.12*s()),r+(s()-.5)*1.6,a)}finish(e,t){let r=this.i,s=a(Array.from({length:r},(e,t)=>t),e),i=new Float32Array(4*r),l=new Float32Array(4*r);return s.forEach((e,t)=>{i.set(this.a.subarray(4*e,4*e+4),4*t),l.set(this.b.subarray(4*e,4*e+4),4*t)}),this.paths.length>n.PATH_ROWS&&(this.paths.length=n.PATH_ROWS),{a:i,b:l,paths:this.paths,antSize:t,used:r}}}function f(e,n,r){let a=Math.min(e/t.MARK_BOX.w,n/t.MARK_BOX.h)*r;return{s:a,ox:(e-t.MARK_BOX.w*a)/2,oy:(n-t.MARK_BOX.h*a)/2}}function p(e,t){if(e/t>=1.6){let n=.9*t,r=.48*n,a=Math.max(.04*e,16),s=Math.min(e-2*r-2*a-8,1.75*n),i=Math.min(.8*n,s/1.45),l=(e-(2*r+s+2*a))/2,o=(t+n)/2;return[{kind:"ios",x:l,y:o-n,w:r,h:n,r:.17*r},{kind:"web",x:l+r+a,y:o-i,w:s,h:i,r:.035*Math.min(s,i)},{kind:"android",x:l+r+a+s+a,y:o-n,w:r,h:n,r:.11*r}]}let n=.94*e,r=Math.min(.34*t,n/1.5),a=Math.min(.48*t,(.8*e-24)/2/.48),s=.48*a,i=Math.min(.14*e,Math.max(24,.94*e-2*s-.3*e)),l=(e-(2*s+i))/2;return[{kind:"web",x:(e-n)/2,y:.04*t,w:n,h:r,r:.04*Math.min(n,r)},{kind:"ios",x:l,y:.96*t-a,w:s,h:a,r:.17*s},{kind:"android",x:l+s+i,y:.96*t-a,w:s,h:a,r:.11*s}]}function m(e){if("web"===e.kind){let t=Math.max(.12*e.h,18),n=.012*e.w;return{x:e.x+n,y:e.y+t,w:e.w-2*n,h:e.h-t-n,r:.6*e.r,bar:t}}let t=.05*e.w;return{x:e.x+t,y:e.y+t,w:e.w-2*t,h:e.h-2*t,r:.8*e.r,bar:0}}function x(e,t){let n=t>1.1*e,r=(r,a)=>n?[e*(.5+(a-.5)*.9),t*r]:[e*r,t*a];return{vertical:n,r:s(.055*Math.min(e,t),12,30),prompt:r(.06,.5),agents:r(.24,.5),truth:r(.42,.5),apps:[r(.68,.17),r(.68,.5),r(.68,.83)],check:r(.93,.5)}}let g=["AC-home-1","AC-home-2","AC-home-3","AC-settings-1","AC-settings-2","AC-settings-3","AC-settings-4"],v=["iOS","Android","Web"],b=[[!1,!1,!0],[!1,!1,!0],[!1,!1,!1],[!0,!0,!0],[!0,!0,!0],[!0,!0,!0],[!0,!0,!0]];function y(e,t,n){let r=n?.36*e:.24*e,a=g.length,s=(e-r)/v.length,i=t/a,l=Math.min(.08*s,10),o=Math.min(.14*i,6),c=b.flatMap((e,t)=>e.map((e,n)=>({x:r+n*s+l,y:t*i+o,w:s-2*l,h:i-2*o,tested:e,r:t,c:n})));return{label:r,colW:s,rowH:i,cells:c}}e.s(["INK",0,0,"PARITY_COLS",0,v,"PARITY_ROWS",0,g,"PARITY_TESTED",0,b,"RED",0,1,"WHITE",0,2,"buildFormation",0,function(e,n){switch(e){case"mark":return function({w:e,h:n,n:a,mobile:l}){let u=r(7),p=s(Math.min(e,n)/(l?44:52),7,12),{s:m,ox:x,oy:g}=f(e,n,.985),v=.45*p/m,b=i(e,n,e=>{for(let n of(e.translate(x,g),e.scale(m,m),e.beginPath(),e.arc(12,12,12,0,2*Math.PI),e.fill(),e.globalCompositeOperation="destination-out",t.MARK_SEGMENTS))e.beginPath(),e.arc(n.cx,n.cy,n.r+v,0,2*Math.PI),e.fill();for(let n of(e.lineWidth=t.MARK_STROKE+2*v,e.lineCap="round",t.MARK_ANTENNAE))e.stroke(new Path2D(n))}),y=new h(a,e,n);return y.points(c(b,Math.min(a,d(o(b),p,1.4)),u),1),y.finish(u,p)}(n);case"markwhite":return function({w:e,h:n,n:a}){let l=r(11),u=s(Math.min(e,n)/52,7,11),{s:p,ox:m,oy:x}=f(e,n,1),g=new h(a,e,n),v=g.addPath(function(e,t,n,r=160){let a=[];for(let s=0;s<r;s++){let i=s/r*Math.PI*2-Math.PI/2;a.push([e+Math.cos(i)*n,t+Math.sin(i)*n])}return a}(m+12*p,x+12*p,12*p,220),!0);g.lane(v,1.35*u,34,-3,2,l),g.lane(v,1.35*u,-30,3.5,2,l);let b=i(e,n,e=>{for(let n of(e.translate(m,x),e.scale(p,p),t.MARK_SEGMENTS))e.beginPath(),e.arc(n.cx,n.cy,n.r,0,2*Math.PI),e.fill();for(let n of(e.lineWidth=1.7*t.MARK_STROKE,e.lineCap="round",t.MARK_ANTENNAE))e.stroke(new Path2D(n))});return g.points(c(b,Math.min(g.left,d(o(b),u,1.05)),l),2),g.finish(l,u)}(n);case"trail":return function({w:e,h:t},n){let a=r(3),i=new h(n,e,t),l=[];for(let n=0;n<=10;n++){let r=n/10;l.push([-.06*e+1.12*r*e,.5*t+Math.sin(r*Math.PI*2.1+.5)*t*.3+Math.sin(9*r)*t*.04])}let o=i.addPath(function(e,t=20,n=!1){let r=[],a=e.length,i=t=>n?e[(t+a)%a]:e[s(t,0,a-1)],l=n?a:a-1;for(let e=0;e<l;e++){let n=i(e-1),a=i(e),s=i(e+1),l=i(e+2);for(let e=0;e<t;e++){let i=e/t,o=i*i,c=o*i;r.push([.5*(2*a[0]+(-n[0]+s[0])*i+(2*n[0]-5*a[0]+4*s[0]-l[0])*o+(-n[0]+3*a[0]-3*s[0]+l[0])*c),.5*(2*a[1]+(-n[1]+s[1])*i+(2*n[1]-5*a[1]+4*s[1]-l[1])*o+(-n[1]+3*a[1]-3*s[1]+l[1])*c)])}}return n||r.push(e[a-1]),r}(l,24),!1);return i.lane(o,17,62,-4.5,1,a),i.lane(o,19,-54,5,1,a),i.finish(a,9)}(n,n.n);case"devices":return function({w:e,h:t,n,mobile:a}){let s=r(31),l=a?6.5:8,f=new h(Math.min(n,a?3136:6400),e,t),x=p(e,t);for(let e of x){let t=f.addPath(function(e,t,n,r,a,s=14){let i=[],l=(e,t,n)=>{for(let r=0;r<=s;r++){let l=n+r/s*(Math.PI/2);i.push([e+Math.cos(l)*a,t+Math.sin(l)*a])}};return l(e+n-a,t+a,-Math.PI/2),l(e+n-a,t+r-a,0),l(e+a,t+r-a,Math.PI/2),l(e+a,t+a,Math.PI),i}(e.x,e.y,e.w,e.h,e.r),!0);f.lane(t,1.45*l,30,-2.6,0,s),f.lane(t,1.45*l,-26,2.6,0,s)}let g=i(e,t,e=>{for(let t of x){let n=m(t);if("ios"===t.kind)u(e,n.x+.33*n.w,n.y+.018*n.h,.34*n.w,.042*n.h,.021*n.h),e.fill();else if("android"===t.kind)e.beginPath(),e.arc(n.x+n.w/2,n.y+.035*n.h,.04*n.w,0,2*Math.PI),e.fill();else{let r=t.y+.5*n.bar;for(let a=0;a<3;a++)e.beginPath(),e.arc(t.x+.035*t.w+a*t.w*.03,r,Math.max(3,.13*n.bar),0,2*Math.PI),e.fill();u(e,t.x+.22*t.w,r-.16*n.bar,.5*t.w,.32*n.bar,.16*n.bar),e.fill()}}}),v=i(e,t,e=>{for(let t of x){let n=m(t),r=n.x+.08*n.w,a=.84*n.w;if("web"===t.kind){let t=n.y+.12*n.h;u(e,r,t,.34*a,.075*n.h,4),e.fill(),u(e,r,t+.13*n.h,.52*a,.035*n.h,3),e.fill();let s=t+.27*n.h,i=.04*a,l=(a-2*i)/3;for(let t=0;t<3;t++)u(e,r+t*(l+i),s,l,.38*n.h,.1*Math.min(l,.38*n.h)),e.fill();continue}let s=n.y+.12*n.h;u(e,r,s,.62*a,.045*n.h,4),e.fill();let i=s+.08*n.h,l=.2*n.h;u(e,r,i,a,l,.12*Math.min(a,l)),e.fill();let o=i+l+.05*n.h;for(let t=0;t<4;t++){let s=o+t*n.h*.075,i=.018*n.h;e.beginPath(),e.arc(r+i,s+i,i,0,2*Math.PI),e.fill(),u(e,r+2.8*i,s+.45*i,a*(.62-t%2*.16),1.1*i,.5*i),e.fill()}}});return f.points(c(g,Math.min(f.left,d(o(g),l,1.3)),s),0),f.points(c(v,f.left,s),1),f.finish(s,l)}(n);case"flow":return function({w:e,h:t,n,mobile:a}){let s=r(29),l=a?6.5:8,u=new h(n,e,t),f=x(e,t),p=1.3*f.r;for(let[e,t,n,r,a]of[[f.prompt,.7*f.r,f.agents,f.r,1],[f.agents,f.r,f.truth,f.r,1],...f.apps.map(e=>[f.truth,f.r,e,p,1]),...f.apps.map(e=>[e,p,f.check,f.r,0])]){let i=n[0]-e[0],o=n[1]-e[1],c=Math.hypot(i,o),d=i/c,h=o/c,f=e[0]+d*t*1.15,p=e[1]+h*t*1.15,m=n[0]-d*r*1.15,x=n[1]-h*r*1.15,g=Math.max(2,Math.floor((c-t-r)/(2.3*l))),v=54+18*s();for(let e=0;e<g;e++)u.segment(f,p,m,x,e/g+.04*s(),v,0,a)}let m=i(e,t,e=>{let t=(t,n)=>{e.beginPath(),e.arc(t[0],t[1],n,0,2*Math.PI),e.fill()};t(f.prompt,.7*f.r),t(f.agents,f.r),t(f.truth,f.r),t(f.check,f.r)}),g=i(e,t,e=>{for(let t of f.apps)e.beginPath(),e.arc(t[0],t[1],p,0,2*Math.PI),e.fill()});return u.points(c(m,Math.min(u.left,d(o(m),l,1.3)),s),0),u.points(c(g,Math.min(u.left,d(o(g),l,1.3)),s),1),u.finish(s,l)}(n);case"parity":return function({w:e,h:t,n,mobile:a}){let l=r(41),{cells:f,rowH:p}=y(e,t,a),m=s(.3*p,5.5,8.5),x=new h(n,e,t),g=i(e,t,e=>{for(let t of f)t.tested&&(u(e,t.x,t.y,t.w,t.h,Math.min(.22*t.h,6)),e.fill())});return x.points(c(g,Math.min(x.left,d(o(g),m,1.1)),l),1),x.finish(l,m)}(n)}},"devicesGeometry",0,p,"flowGeometry",0,x,"mulberry32",0,r,"parityGrid",0,y,"screenOf",0,m])},70566,e=>{"use strict";let t=`
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 permute3(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 curl(vec2 p, float t) {
  const float e = 0.12;
  vec2 o = vec2(t, t * 0.7);
  float n1 = snoise(vec2(p.x, p.y + e) + o);
  float n2 = snoise(vec2(p.x, p.y - e) + o);
  float n3 = snoise(vec2(p.x + e, p.y) + o);
  float n4 = snoise(vec2(p.x - e, p.y) + o);
  return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
}
`,n=`
uniform sampler2D uTA;
uniform sampler2D uTB;
uniform sampler2D uMeta;
uniform sampler2D uPaths;
uniform vec2 uStages[8]; // each stage's centre
uniform float uTime;
uniform float uDtSec;

struct Tgt {
  vec2 pos;
  vec2 vel;
  float vis;
  float type;
  float tint;
  float wrapped;
  int stage;
  float snap;
};

vec2 pathPoint(float row, float u) {
  float fx = clamp(u, 0.0, 1.0) * 511.0;
  float i0 = floor(fx);
  float f = fx - i0;
  float i1 = min(i0 + 1.0, 511.0);
  float v = (row + 0.5) / 16.0;
  vec2 p0 = texture2D(uPaths, vec2((i0 + 0.5) / 512.0, v)).xy;
  vec2 p1 = texture2D(uPaths, vec2((i1 + 0.5) / 512.0, v)).xy;
  return mix(p0, p1, f);
}

Tgt getTarget(vec2 uv, vec2 cur) {
  vec4 a = texture2D(uTA, uv);
  vec4 b = texture2D(uTB, uv);
  vec4 m = texture2D(uMeta, uv);
  float type = floor(b.w / 10.0 + 0.001);
  Tgt t;
  t.type = type;
  t.tint = b.w - type * 10.0;
  t.vis = 1.0;
  t.vel = vec2(0.0);
  t.wrapped = 0.0;
  t.stage = int(clamp(m.x, 0.0, 7.0) + 0.5);
  t.snap = m.z;
  vec2 c = uStages[t.stage];
  t.pos = c + a.xy;
  if (type > 0.5 && type < 1.5) {
    float u = fract(b.x + uTime * b.y);
    float up = fract(b.x + (uTime - uDtSec) * b.y);
    t.wrapped = step(0.5, abs(u - up));
    vec2 d = a.zw - a.xy;
    float len = max(length(d), 0.0001);
    vec2 n = vec2(-d.y, d.x) / len;
    t.pos = c + mix(a.xy, a.zw, u) + n * b.z;
    t.vel = d * b.y / 60.0;
    t.vis = smoothstep(0.0, 0.08, u) * smoothstep(1.0, 0.92, u);
  } else if (type > 1.5 && type < 2.5) {
    float u = fract(b.x + uTime * b.y);
    float up = fract(b.x + (uTime - uDtSec) * b.y);
    vec2 p = pathPoint(a.x, u);
    vec2 tg = pathPoint(a.x, u + 0.002) - pathPoint(a.x, u - 0.002);
    float tl = length(tg);
    vec2 tn = tl > 0.00001 ? tg / tl : vec2(1.0, 0.0);
    vec2 n = vec2(-tn.y, tn.x);
    t.pos = c + p + n * b.z;
    t.vel = tn * sign(b.y) * abs(b.y) * a.z / 60.0;
    if (a.y < 0.5) {
      t.wrapped = step(0.5, abs(u - up));
      t.vis = smoothstep(0.0, 0.025, u) * smoothstep(1.0, 0.975, u);
    }
  } else if (type > 2.5) {
    // A spare ant stays where it is, unseen.
    t.pos = cur;
    t.vis = 0.0;
  }
  return t;
}
`,r=`
${t}
${n}
uniform float uDt;
uniform vec2 uMouse;
uniform float uMouseOn;
uniform vec4 uPulse;
uniform float uMaxSpeed;
uniform float uMaxForce;
uniform float uDamping;
uniform float uWanderRest;
uniform float uWanderTravel;
uniform float uArrive;
uniform float uCalm;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv);
  vec4 V = texture2D(textureVelocity, uv);
  Tgt T = getTarget(uv, P.xy);
  if (T.type > 2.5) {
    // Spare ants slow to a stop and fade out where they are.
    V.xy *= pow(0.8, uDt);
    V.w = mix(V.w, 0.0, 1.0 - pow(0.93, uDt));
    gl_FragColor = V;
    return;
  }
  float seed = hash12(uv * 311.7);

  vec2 to = T.pos - P.xy;
  float d = length(to);
  float ms = uMaxSpeed * mix(0.7, 1.3, seed) * (1.0 + smoothstep(260.0, 1400.0, d) * 1.6);
  vec2 desired = T.vel;
  if (d > 0.001) desired += to / d * ms * smoothstep(0.0, uArrive, d);
  vec2 steer = desired - V.xy;
  float mf = uMaxForce * mix(0.7, 1.3, fract(seed * 13.7));
  float sl = length(steer);
  if (sl > mf) steer *= mf / sl;

  float travel = smoothstep(4.0, 160.0, d);
  vec2 w = curl(P.xy * 0.0042 + seed * 9.0, uTime * 0.22 + seed * 2.0);
  w *= 1.0 / max(length(w), 0.35);
  steer += w * mix(uWanderRest, uWanderTravel, travel) * (1.0 - uCalm);

  vec2 dm = P.xy - uMouse;
  float md = length(dm);
  float fall = 1.0 - smoothstep(0.0, 130.0, md);
  steer += (dm / max(md, 0.001)) * fall * fall * 2.6 * uMouseOn * (1.0 - uCalm);

  if (uPulse.z < 0.4) {
    vec2 dp = P.xy - uPulse.xy;
    float pd = length(dp);
    float ring = 1.0 - smoothstep(0.0, 300.0, pd);
    steer += (dp / max(pd, 0.001)) * ring * uPulse.w * (1.0 - uPulse.z / 0.4);
  }

  V.xy += steer * uDt;
  V.xy *= pow(uDamping, uDt);
  float sp = length(V.xy);
  float cap = ms * 1.8 + length(T.vel);
  if (sp > cap) V.xy *= cap / sp;
  V.w = mix(V.w, T.vis, 1.0 - pow(T.vis > V.w ? 0.9 : 0.93, uDt));
  gl_FragColor = V;
}
`,a=`
${t}
${n}
uniform float uDt;
uniform vec2 uCarry[8]; // how far each stage moved since the last frame
uniform float uSnap;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv);
  vec4 V = texture2D(textureVelocity, uv);
  Tgt T = getTarget(uv, P.xy);

  // Ants ride along when their stage moves.
  if (T.type < 2.5) P.xy += uCarry[T.stage];
  P.xy += V.xy * uDt;
  P.z = mod(P.z + length(V.xy) * uDt * 0.85, 6283.1853);
  P.w = mix(P.w, T.tint, 1.0 - pow(0.95, uDt));

  if (T.wrapped > 0.5) P.xy = T.pos;
  // Placed, not walked: on load, and when a resize moves an ant to another stage.
  if (uSnap > 0.5 && T.snap > 0.5) {
    P.xy = T.pos;
    P.w = T.tint;
  }
  gl_FragColor = P;
}
`,s=`
varying vec2 vLocal;
varying float vPhase;
varying float vTint;
varying vec3 vLight;
varying vec2 vShadow;
varying float vPx;
varying float vVis;
`,i=`
${t}
${s}
uniform sampler2D tPos;
uniform sampler2D tVel;
uniform sampler2D tMeta;
uniform float uDensity;
uniform float uDpr;
uniform float uTime;
attribute vec2 aRef;

void main() {
  vec4 P = texture2D(tPos, aRef);
  vec4 V = texture2D(tVel, aRef);
  vec4 M = texture2D(tMeta, aRef);
  float seed = hash12(aRef * 311.7);
  float sp = length(V.xy);
  float fa = seed * 6.2831 + uTime * (0.08 + seed * 0.1);
  vec2 fallback = vec2(cos(fa), sin(fa));
  vec2 dir = sp > 0.00001 ? V.xy / sp : fallback;
  dir = normalize(mix(fallback, dir, smoothstep(0.015, 0.3, sp)) + vec2(0.00001));
  vec2 perp = vec2(-dir.y, dir.x);
  float vis = clamp(V.w, 0.0, 1.0);
  // Slow devices draw a random share of every stage's ants.
  float drawn = step(hash12(aRef * 57.3), uDensity);
  float size = M.y * mix(0.84, 1.16, seed) * smoothstep(0.0, 1.0, vis) * drawn;
  vec2 q = position.xy * vec2(1.5, 1.24);
  vLocal = q;
  vec2 world = P.xy + (dir * q.x + perp * q.y) * size;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 0.0, 1.0);
  vPhase = P.z + seed * 6.2831;
  vTint = P.w;
  vec3 L = normalize(vec3(-0.42, 0.62, 0.78));
  vLight = vec3(dot(L.xy, dir), dot(L.xy, perp), L.z);
  vec2 sh = vec2(0.07, -0.13);
  vShadow = vec2(dot(sh, dir), dot(sh, perp));
  vPx = max(size * uDpr, 0.0001);
  vVis = vis;
}
`,l=`
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
float sdEl(vec2 p, vec2 c, vec2 r) {
  vec2 q = (p - c) / r;
  return (length(q) - 1.0) * min(r.x, r.y);
}
const vec2 G_C = vec2(-0.265, 0.0);  const vec2 G_R = vec2(0.205, 0.142);
const vec2 N_C = vec2(-0.072, 0.0);  const vec2 N_R = vec2(0.044, 0.036);
const vec2 T_C = vec2(0.075, 0.0);   const vec2 T_R = vec2(0.135, 0.066);
const vec2 H_C = vec2(0.285, 0.0);   const vec2 H_R = vec2(0.098, 0.09);

float bodyDist(vec2 p) {
  float d = sdEl(p, G_C, G_R);
  d = min(d, sdEl(p, N_C, N_R));
  d = min(d, sdEl(p, T_C, T_R));
  d = min(d, sdEl(p, H_C, H_R));
  return d;
}
`,o=`
${s}
${l}
uniform vec3 uInk;
uniform vec3 uRed;
uniform vec3 uWhite;

vec3 tintColor(float t) {
  return t < 1.0 ? mix(uInk, uRed, clamp(t, 0.0, 1.0)) : mix(uRed, uWhite, clamp(t - 1.0, 0.0, 1.0));
}

vec3 partNormal(vec2 p, vec2 c, vec2 r) {
  vec2 q = (p - c) / r;
  float h = sqrt(max(1.0 - dot(q, q), 0.0));
  return normalize(vec3(q.x / r.x, q.y / r.y, h / r.y));
}

void main() {
  vec2 p = vLocal;
  float aa = 1.0 / vPx;

  float dG = sdEl(p, G_C, G_R);
  float dN = sdEl(p, N_C, N_R);
  float dT = sdEl(p, T_C, T_R);
  float dH = sdEl(p, H_C, H_R);
  float body = min(min(dG, dN), min(dT, dH));

  vec2 q = vec2(p.x, abs(p.y));
  float left = step(0.0, p.y);
  float s1 = sin(vPhase);
  float s2 = -s1;
  float sf = mix(s2, s1, left);
  float sm = -sf;
  float legs = 1e3;
  vec2 k1 = vec2(0.21 + 0.035 * sf, 0.17);
  vec2 f1 = vec2(0.33 + 0.07 * sf, 0.265);
  legs = min(legs, sdSeg(q, vec2(0.13, 0.035), k1));
  legs = min(legs, sdSeg(q, k1, f1));
  vec2 k2 = vec2(0.075 + 0.03 * sm, 0.2);
  vec2 f2 = vec2(0.045 + 0.08 * sm, 0.335);
  legs = min(legs, sdSeg(q, vec2(0.075, 0.045), k2));
  legs = min(legs, sdSeg(q, k2, f2));
  vec2 k3 = vec2(-0.05 + 0.03 * sf, 0.185);
  vec2 f3 = vec2(-0.21 + 0.07 * sf, 0.315);
  legs = min(legs, sdSeg(q, vec2(0.02, 0.045), k3));
  legs = min(legs, sdSeg(q, k3, f3));
  float tw = 0.012 * sin(vPhase * 0.37 + left * 2.0);
  vec2 e1 = vec2(0.425, 0.115 + tw);
  legs = min(legs, sdSeg(q, vec2(0.35, 0.035), e1));
  legs = min(legs, sdSeg(q, e1, vec2(0.545, 0.14 + tw * 2.0)));

  float legW = max(0.017, 0.45 * aa);
  float aBody = 1.0 - smoothstep(-aa, aa, body);
  float aLegs = (1.0 - smoothstep(-aa, aa, legs - legW)) * clamp(legW * vPx * 1.6, 0.35, 1.0);

  vec3 n = partNormal(p, G_C, G_R);
  if (dT < dG && dT < dH && dT < dN) n = partNormal(p, T_C, T_R);
  if (dH < dG && dH < dT && dH < dN) n = partNormal(p, H_C, H_R);
  if (dN < dG && dN < dT && dN < dH) n = partNormal(p, N_C, N_R);

  vec3 L = normalize(vLight);
  float diff = max(dot(n, L), 0.0);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 42.0);
  float rim = pow(1.0 - n.z, 2.0);

  vec3 base = tintColor(vTint);
  float white = clamp(vTint - 1.0, 0.0, 1.0);
  vec3 lit = base * mix(0.5 + 0.62 * diff, 0.84 + 0.18 * diff, white);
  lit *= 1.0 - rim * mix(0.35, 0.12, white);
  lit += vec3(spec) * mix(0.55, 0.25, white);
  vec3 legCol = base * mix(0.62, 0.9, white);

  float alpha = max(aBody, aLegs);
  vec3 col = mix(legCol, lit, aBody);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(col, alpha);
}
`,c=`
${s}
${l}
uniform vec3 uShadowLight;
uniform vec3 uShadowDark;
uniform float uShadowAlpha;

void main() {
  vec2 p = vLocal - vShadow;
  float d = bodyDist(p * vec2(1.0, 0.94));
  float soft = 0.05 + 1.2 / vPx;
  float a = 1.0 - smoothstep(-soft, soft * 1.6, d);
  float white = clamp(vTint - 1.0, 0.0, 1.0);
  a *= uShadowAlpha * mix(1.0, 1.7, white);
  if (a < 0.003) discard;
  gl_FragColor = vec4(mix(uShadowLight, uShadowDark, white), a);
}
`;e.s(["MAX_STAGES",0,8,"PATH_ROWS",0,16,"PATH_SAMPLES",0,512,"antFragment",0,o,"antVertex",0,i,"positionShader",0,a,"shadowFragment",0,c,"velocityShader",0,r])},55312,e=>{"use strict";class t{stages=new Map;status="idle";enabled=!0;counts=new Map;listeners=new Set;register(e,t,n){this.stages.set(e,{id:e,el:t,formation:n})}update(e,t){let n=this.stages.get(e);n&&(n.formation=t)}unregister(e,t){this.stages.get(e)?.el===t&&this.stages.delete(e)}setStatus(e){this.status=e,document.documentElement.dataset.colony="running"===e?"on":"idle"===e?"":"off",this.emit()}setCounts(e){this.counts=e,this.emit()}setEnabled(e){this.enabled=e;try{localStorage.setItem("gn-colony",e?"1":"0")}catch{}this.emit()}subscribe=e=>(this.listeners.add(e),()=>this.listeners.delete(e));emit(){for(let e of this.listeners)e()}}let n=new t;e.s(["colonyStore",0,n])}]);