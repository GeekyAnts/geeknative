(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,44852,e=>{"use strict";var t=e.i(46882),a=e.i(55118),n=e.i(55312);let i=e=>e.width>=4&&e.height>=4,s=e=>e+2*Math.round(.3*e);e.s(["ColonyCanvas",0,function(){let r=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let t=r.current;if(!t)return;let a=!1,l=0,o=null,c=[];try{"0"===localStorage.getItem("gn-colony")&&(n.colonyStore.enabled=!1)}catch{}return(async()=>{let[{ColonyEngine:r,MAX_STAGES:d,supportsColony:h},{buildFormation:u}]=await Promise.all([e.A(89547),e.A(98925)]);if(a)return;if(!h())return n.colonyStore.setStatus("unsupported");let p=matchMedia("(max-width: 767px)").matches,f=matchMedia("(prefers-reduced-motion: reduce)"),m=Math.min(window.devicePixelRatio||1,2),x=new Map,v=()=>[...n.colonyStore.stages.values()].slice(0,d).map(e=>({id:e.id,formation:e.formation,rect:e.el.getBoundingClientRect()})),g=e=>e.flatMap((e,t)=>{var a,n,s;let r,l;return i(e.rect)?[{slot:t,formation:(a=e.formation,n=e.rect.width,s=e.rect.height,r=`${a}|${Math.round(n)}x${Math.round(s)}`,(l=x.get(r))||(x.size>=40&&x.clear(),l=u(a,{w:n,h:s,n:16384,mobile:p}),x.set(r,l)),l)}]:[]}),y=v(),w=g(y).reduce((e,t)=>e+t.formation.used,0);try{o=new r(t,{count:Math.max(4096,Math.ceil(1.35*w)),dpr:m,calm:!1})}catch(e){console.warn("[colony] disabled:",e),n.colonyStore.setStatus("unsupported");return}let b=o;b.resize(document.documentElement.clientWidth,s(window.innerHeight),m);let M=e=>{let t=b.setStages(g(e));n.colonyStore.setCounts(new Map(e.map((e,a)=>[e.id,t.get(a)??0])))},S=()=>f.matches||!n.colonyStore.enabled,P=S();b.setCalm(P);let k=()=>{let e=S();e!==P&&(P=e,b.setCalm(P))};f.addEventListener("change",k);let T=n.colonyStore.subscribe(k),A={x:-9999,y:-9999,on:!1},C=e=>{A.x=e.clientX,A.y=e.clientY,A.on=!0},N=()=>A.on=!1,_=e=>{0!==e.button||P||b.kick(e.clientX,e.clientY+window.scrollY,5)};window.addEventListener("pointermove",C,{passive:!0}),window.addEventListener("pointerdown",_,{passive:!0}),document.documentElement.addEventListener("pointerleave",N),c.push(()=>{window.removeEventListener("pointermove",C),window.removeEventListener("pointerdown",_),document.documentElement.removeEventListener("pointerleave",N),f.removeEventListener("change",k),T()});let R=[],j=0;M(y),n.colonyStore.setStatus("running");let E=(e,t)=>e.some((e,a)=>Math.abs(e.rect.width-t[a].rect.width)>2||Math.abs(e.rect.height-t[a].rect.height)>2),D=y,F=0,I=0,L=performance.now(),z=e=>{let a;l=requestAnimationFrame(z);let n=(e-L)/1e3;if(L=e,document.hidden)return;n<.25&&(e=>{if(j>1||(R.push(e),R.length<150))return;let t=[...R].sort((e,t)=>e-t),a=t[t.length>>1];R.length=0,a<.026?j=2:0===j&&m>1?(m=1,b.resize(document.documentElement.clientWidth,s(window.innerHeight),m),j=1):(b.setDensity(.5),j=2)})(n);let r=window.scrollY,o=v();(a=y,o.length===a.length&&o.every((e,t)=>e.id===a[t].id&&e.formation===a[t].formation))?E(o,y)&&(E(o,D)?F=e:e-F>150&&M(y=o)):M(y=o),D=o;let c=window.innerHeight,d=Math.max(0,Math.round(r)-Math.round(.3*c));d!==I&&(t.style.transform=`translate3d(0, ${d}px, 0)`,I=d),b.frame({dt:n,scrollY:r,top:d,width:document.documentElement.clientWidth,height:s(c),mouse:A,stages:o.map(({rect:e})=>i(e)?{x:e.left+e.width/2,y:e.top+e.height/2+r}:null)})};l=requestAnimationFrame(z)})(),()=>{a=!0,cancelAnimationFrame(l),c.forEach(e=>e()),o?.dispose(),n.colonyStore.setStatus("idle")}},[]),(0,t.jsx)("div",{"aria-hidden":!0,className:"pointer-events-none absolute inset-0 z-40 overflow-hidden",children:(0,t.jsx)("canvas",{ref:r,className:"colony-canvas absolute left-0 top-0"})})}])},67755,e=>{"use strict";var t=e.i(46882),a=e.i(55118),n=e.i(55312);e.s(["ColonyStage",0,function({id:e,formation:i,className:s="",children:r}){let l=(0,a.useRef)(null),o=(0,a.useRef)(i);return(0,a.useEffect)(()=>{let t=l.current;if(t)return n.colonyStore.register(e,t,o.current),()=>n.colonyStore.unregister(e,t)},[e]),(0,a.useEffect)(()=>{o.current=i,n.colonyStore.update(e,i)},[e,i]),(0,t.jsx)("div",{ref:l,"data-colony-stage":e,"aria-hidden":!0,className:`${/\b(absolute|fixed|sticky)\b/.test(s)?"":"relative"} ${s}`,children:r?(0,t.jsx)("div",{className:"colony-fallback absolute inset-0",children:r}):null})}])},32151,e=>{"use strict";var t=e.i(46882),a=e.i(55118),n=e.i(54210),i=e.i(19303);function s({children:e,className:n=""}){let[i,r]=function(){let e=(0,a.useRef)(null),[t,n]=(0,a.useState)(null);return(0,a.useEffect)(()=>{let t=e.current;if(!t)return;let a=new ResizeObserver(([e])=>n({w:e.contentRect.width,h:e.contentRect.height}));return a.observe(t),()=>a.disconnect()},[]),[e,t]}();return(0,t.jsx)("div",{ref:i,"aria-hidden":!0,className:`pointer-events-none absolute inset-0 ${n}`,children:r?e(r):null})}let r={ios:["iOS","SwiftUI"],web:["Web","TanStack Start"],android:["Android","Jetpack Compose"]},l=[{key:"prompt",title:"You",note:"A plain prompt"},{key:"agents",title:"AGENTS.md",note:"Triage"},{key:"truth",title:"Spec + contracts",note:"Source of truth"},{key:"ios",title:"iOS",note:"SwiftUI"},{key:"android",title:"Android",note:"Jetpack Compose"},{key:"web",title:"Web",note:"TanStack Start"},{key:"check",title:"make check",note:"Tests and parity"}];e.s(["DeviceLabels",0,function(){return(0,t.jsx)(s,{children:({w:e,h:a})=>(0,i.devicesGeometry)(e,a).map(a=>(0,t.jsxs)("div",{className:"figure-label label absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-muted",style:{left:a.x+a.w/2,top:a.y+a.h+14},children:[(0,t.jsx)("span",{className:"text-ink",children:r[a.kind][0]}),e>=520||"web"===a.kind?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{className:"text-faint",children:"/"}),(0,t.jsx)("span",{children:r[a.kind][1]})]}):null]},a.kind))})},"DevicesFallback",0,function(){return(0,t.jsx)(s,{children:({w:e,h:a})=>(0,t.jsx)("svg",{width:e,height:a,className:"absolute inset-0",children:(0,i.devicesGeometry)(e,a).map(e=>{let a=(0,i.screenOf)(e);return(0,t.jsxs)("g",{fill:"none",stroke:"currentColor",className:"text-ink/70",children:[(0,t.jsx)("rect",{x:e.x,y:e.y,width:e.w,height:e.h,rx:e.r,strokeWidth:1.5}),(0,t.jsx)("rect",{x:a.x+.08*a.w,y:a.y+.12*a.h,width:.5*a.w,height:.045*a.h,rx:4,fill:n.BRAND_RED,stroke:"none"}),(0,t.jsx)("rect",{x:a.x+.08*a.w,y:a.y+.22*a.h,width:.84*a.w,height:.2*a.h,rx:10,fill:n.BRAND_RED,stroke:"none",opacity:.85})]},e.kind)})})})},"FlowLabels",0,function(){return(0,t.jsx)(s,{children:({w:e,h:a})=>{let n=(0,i.flowGeometry)(e,a),s={prompt:n.prompt,agents:n.agents,truth:n.truth,ios:n.apps[0],android:n.apps[1],web:n.apps[2],check:n.check},r=n.apps[1][0]-n.apps[0][0]-12;return l.map(e=>{let[a,i]=s[e.key],l="ios"===e.key||"android"===e.key||"web"===e.key,o=l?1.3*n.r:n.r,c=n.vertical?l?{left:a,top:i+o+10,width:r,transform:"translateX(-50%)"}:{left:a+o+14,top:i,transform:"translateY(-50%)"}:{left:a,top:i+o+12,transform:"translateX(-50%)"},d=n.vertical&&l;return(0,t.jsxs)("div",{className:`figure-label absolute ${d?"":"whitespace-nowrap"} ${n.vertical&&!l?"text-left":"text-center"}`,style:c,children:[(0,t.jsx)("p",{className:"text-[13.5px] font-[650] tracking-[-0.01em] wide",children:e.title}),(0,t.jsx)("p",{className:"label mt-1 text-muted",children:e.note})]},e.key)})}})},"ParityCells",0,function(){return(0,t.jsx)(s,{children:({w:e,h:a})=>{let{label:n,colW:s,rowH:r,cells:l}=(0,i.parityGrid)(e,a,e<560);return(0,t.jsxs)(t.Fragment,{children:[i.PARITY_COLS.map((e,a)=>(0,t.jsx)("span",{className:"label absolute -translate-x-1/2 text-muted",style:{left:n+s*(a+.5),top:-26},children:e},e)),i.PARITY_ROWS.map((e,a)=>(0,t.jsx)("span",{className:"label absolute -translate-y-1/2 tabular-nums text-ink/80",style:{left:0,top:r*(a+.5)},children:e},e)),l.map(e=>e.tested?(0,t.jsx)("span",{className:"colony-fallback absolute rounded-[5px] bg-brand",style:{left:e.x,top:e.y,width:e.w,height:e.h}},`${e.r}-${e.c}`):(0,t.jsx)("span",{className:"absolute flex items-center justify-center rounded-[5px] border border-dashed border-line-strong",style:{left:e.x,top:e.y,width:e.w,height:e.h},children:(0,t.jsx)("span",{className:"label text-faint",children:"not tested"})},`${e.r}-${e.c}`))]})}})}])},36960,e=>{"use strict";var t=e.i(46882),a=e.i(55118);let n=new Set("static let var func enum struct class import val object fun const export return get type as true false nonisolated".split(" ")),i=/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/[^\n]*|<!--[\s\S]*?-->|<\/?[\w-]+|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w]*\b|--[\w-]+)/g;function s({title:e,label:r,code:l,className:o=""}){return(0,t.jsxs)("figure",{className:`flex min-w-0 flex-col overflow-hidden rounded-[14px] bg-mist ring-1 ring-inset ring-line ${o}`,children:[(0,t.jsxs)("figcaption",{className:"label flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-muted",children:[(0,t.jsx)("span",{className:"truncate text-ink",children:e}),r?(0,t.jsx)("span",{className:"shrink-0",children:r}):null]}),(0,t.jsx)("pre",{className:"overflow-x-auto px-4 py-4 text-[12.5px] leading-[1.7] text-ink/80 [scrollbar-width:thin]",children:(0,t.jsx)("code",{children:function(e){let s=[],r=0,l=0;for(let o of e.matchAll(i)){let i=o[0],c=o.index??0;c>r&&s.push(e.slice(r,c));let d="";i.startsWith('"')||i.startsWith("'")?d="text-brand":i.startsWith("//")||i.startsWith("<!--")?d="text-faint":i.startsWith("<")?d="text-ink/55":i.startsWith("--")||/^\d/.test(i)?d="text-ink":n.has(i)&&(d="font-semibold text-ink"),s.push(d?(0,t.jsx)("span",{className:d,children:i},l++):(0,t.jsx)(a.Fragment,{children:i},l++)),r=c+i.length}return r<e.length&&s.push(e.slice(r)),s}(l)})})]})}let r=[{id:"tokens",name:"Design tokens",source:{title:"contracts/tokens.json",code:`"color": {
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
} as const`}]}];e.s(["ContractsShowcase",0,function(){let[e,n]=(0,a.useState)(0),i=r[e];return(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{role:"tablist","aria-label":"Contracts",className:"flex flex-wrap gap-x-8 gap-y-3 border-b border-line",children:r.map((a,i)=>(0,t.jsxs)("button",{role:"tab",type:"button","aria-selected":i===e,onClick:()=>n(i),className:`relative -mb-px pb-4 text-[1.05rem] font-[640] tracking-[-0.02em] transition-colors wide ${i===e?"text-ink":"text-ink/45 hover:text-ink/75"}`,children:[a.name,(0,t.jsx)("span",{className:`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-brand transition-transform duration-500 ease-[var(--ease-expo)] ${i===e?"scale-x-100":"scale-x-0"}`})]},a.id))}),(0,t.jsxs)("div",{role:"tabpanel",className:"mt-8 grid grid-cols-1 animate-[fade-in_0.6s_var(--ease-expo)] gap-4 lg:grid-cols-12",children:[(0,t.jsx)("div",{className:"lg:col-span-5",children:(0,t.jsx)(s,{title:i.source.title,label:"You write",code:i.source.code,className:"h-full"})}),(0,t.jsx)("div",{className:"grid grid-cols-1 gap-4 lg:col-span-7",children:i.outputs.map(e=>(0,t.jsx)(s,{title:e.title,label:e.label,code:e.code},e.title))})]},i.id),(0,t.jsx)("p",{className:"label mt-6 text-muted",children:"Fig. 05 · make gen writes these. Nobody edits them by hand, and make check fails if they drift."})]})}],36960)},19332,e=>{"use strict";var t=e.i(46882),a=e.i(55118);e.s(["CopyCommand",0,function({command:e,tone:n="light",className:i=""}){let[s,r]=(0,a.useState)(!1),l=async()=>{try{await navigator.clipboard.writeText(e),r(!0),setTimeout(()=>r(!1),1600)}catch{}};return(0,t.jsxs)("div",{className:`flex min-w-0 items-center gap-3 rounded-full py-2 pl-5 pr-2 ring-1 ring-inset ${{light:"bg-mist text-ink ring-line",dark:"bg-ink text-white ring-white/10",red:"bg-white/10 text-white ring-white/30"}[n]} ${i}`,children:[(0,t.jsx)("span",{"aria-hidden":!0,className:"light"===n?"font-mono text-[13px] text-brand":"font-mono text-[13px] opacity-60",children:"$"}),(0,t.jsx)("code",{className:"min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] [scrollbar-width:none]",children:e}),(0,t.jsx)("button",{type:"button",onClick:l,className:`label shrink-0 rounded-full px-3.5 py-2 transition-colors ${"light"===n?"bg-white text-ink ring-1 ring-inset ring-line hover:bg-ink hover:text-white":"bg-white text-ink hover:bg-ink hover:text-white"}`,"aria-live":"polite",children:s?"Copied":"Copy"})]})}])},46539,e=>{"use strict";var t=e.i(46882),a=e.i(55118);e.s(["Reveal",0,function({as:e="div",className:t="",delay:n=0,children:i,threshold:s=.15}){let[r,l]=(0,a.useState)(null);return(0,a.useEffect)(()=>{if(!r)return;let e=new IntersectionObserver(([t])=>{t.isIntersecting&&(r.classList.add("is-in"),e.disconnect())},{threshold:s,rootMargin:"0px 0px -8% 0px"});return e.observe(r),()=>e.disconnect()},[r,s]),(0,a.createElement)(e,{ref:l,className:`reveal ${t}`,style:{"--d":`${n}ms`}},i)},"Words",0,function({text:e,className:n="",start:i=0}){let s=e.split(" ");return(0,t.jsx)("span",{className:`words ${n}`,children:s.map((e,n)=>(0,t.jsxs)(a.Fragment,{children:[(0,t.jsx)("span",{className:"word",children:(0,t.jsx)("span",{style:{"--i":n+i},children:e})}),n<s.length-1?" ":null]},n))})}])},884,e=>{"use strict";var t=e.i(46882),a=e.i(55118);e.s(["ScrubText",0,function({text:e,className:n="",accentFrom:i,decorative:s=!1}){let r=(0,a.useRef)(null),l=e.split(" ");return(0,a.useEffect)(()=>{let e=r.current;if(!e)return;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return void e.style.setProperty("--p","1");let t=0,a=()=>{t=0;let a=e.getBoundingClientRect(),n=window.innerHeight,i=(.86*n-a.top)/(a.height+.42*n);e.style.setProperty("--p",Math.min(1,Math.max(0,i)).toFixed(4))},n=()=>{t||(t=requestAnimationFrame(a))};return a(),window.addEventListener("scroll",n,{passive:!0}),window.addEventListener("resize",n),()=>{window.removeEventListener("scroll",n),window.removeEventListener("resize",n),cancelAnimationFrame(t)}},[]),(0,t.jsx)("p",{ref:r,"aria-hidden":s||void 0,className:`scrub ${n}`,style:{"--p":1},children:l.map((e,n)=>(0,t.jsxs)(a.Fragment,{children:[(0,t.jsx)("span",{className:void 0!==i&&n>=i?"text-brand":void 0,style:{"--t":(n/l.length).toFixed(4)},children:e}),n<l.length-1?" ":null]},n))})}])},19303,e=>{"use strict";var t=e.i(54210),a=e.i(70566);function n(e){let t=e>>>0;return()=>{let e=t=t+0x6d2b79f5>>>0;return e=Math.imul(e^e>>>15,1|e),(((e^=e+Math.imul(e^e>>>7,61|e))^e>>>14)>>>0)/0x100000000}}function i(e,t){for(let a=e.length-1;a>0;a--){let n=Math.floor(t()*(a+1));[e[a],e[n]]=[e[n],e[a]]}return e}let s=(e,t,a)=>Math.min(a,Math.max(t,e));function r(e,t,a,n=800){let i=Math.min(1,n/Math.max(e,t)),s=Math.max(1,Math.round(e*i)),l=Math.max(1,Math.round(t*i)),o=document.createElement("canvas");o.width=s,o.height=l;let c=o.getContext("2d",{willReadFrequently:!0});return c.scale(s/e,l/t),c.fillStyle="#000",c.strokeStyle="#000",a(c),{data:c.getImageData(0,0,s,l).data,cw:s,ch:l,sx:s/e,sy:l/t,w:e,h:t}}function l(e,t,a){let n=Math.floor(t*e.sx),i=Math.floor(a*e.sy);return!(n<0)&&!(i<0)&&!(n>=e.cw)&&!(i>=e.ch)&&e.data[(i*e.cw+n)*4+3]>127}function o(e){let t=0;for(let a=3;a<e.data.length;a+=4)e.data[a]>127&&t++;return t/(e.sx*e.sy)}function c(e,t,a){let n=o(e);if(n<=0||t<=0)return[];let s=.93*Math.sqrt(n/t),r=[],c=0;for(let t=.5*s;t<e.h;t+=.866*s,c++)for(let n=c%2?s:.5*s;n<e.w;n+=s){let i=n+(a()-.5)*s*.55,o=t+(a()-.5)*s*.55;l(e,i,o)&&r.push([i,o])}i(r,a),r.length>t&&(r.length=t);let d=0;for(;r.length<t&&d++<80*t;){let t=a()*e.w,n=a()*e.h;l(e,t,n)&&r.push([t,n])}return r}let d=(e,t,a=1)=>Math.round(e/(t*t*.3)*a);function h(e,t,a,n,i,s){e.beginPath(),e.roundRect(t,a,n,i,s)}class u{n;w;h;a;b;i;paths;raw;constructor(e,t,a){this.n=e,this.w=t,this.h=a,this.i=0,this.paths=[],this.raw=[],this.a=new Float32Array(4*e),this.b=new Float32Array(4*e)}get full(){return this.i>=this.n}get left(){return this.n-this.i}cx(e){return e-this.w/2}cy(e){return this.h/2-e}put(e,t,a,n,i,s,r,l){if(this.full)return;let o=4*this.i;this.a[o]=e,this.a[o+1]=t,this.a[o+2]=a,this.a[o+3]=n,this.b[o]=i,this.b[o+1]=s,this.b[o+2]=r,this.b[o+3]=l,this.i++}point(e,t,a=1){this.put(this.cx(e),this.cy(t),0,0,0,0,0,a)}points(e,t=1){for(let[a,n]of e)this.point(a,n,t)}segment(e,t,a,n,i,s,r,l=1){let o=Math.hypot(a-e,n-t)||1;this.put(this.cx(e),this.cy(t),this.cx(a),this.cy(n),i,s/o,r,l+10)}addPath(e,t){let n=t?[...e,e[0]]:e,i=[0];for(let e=1;e<n.length;e++)i.push(i[e-1]+Math.hypot(n[e][0]-n[e-1][0],n[e][1]-n[e-1][1]));let r=i[i.length-1]||1,l=new Float32Array(2*a.PATH_SAMPLES),o=[],c=0;for(let e=0;e<a.PATH_SAMPLES;e++){let t=e/(a.PATH_SAMPLES-1)*r;for(;c<i.length-2&&i[c+1]<t;)c++;let d=i[c+1]-i[c]||1,h=s((t-i[c])/d,0,1),u=n[c][0]+(n[c+1][0]-n[c][0])*h,p=n[c][1]+(n[c+1][1]-n[c][1])*h;o.push([u,p]),l[2*e]=this.cx(u),l[2*e+1]=this.cy(p)}return this.paths.push({pts:l,closed:t,length:r}),this.raw.push(o),this.paths.length-1}nearestU(e,t,n){let i=this.raw[e],s=0,r=1/0;for(let e=0;e<i.length;e++){let a=(i[e][0]-t)**2+(i[e][1]-n)**2;a<r&&(r=a,s=e)}return s/(a.PATH_SAMPLES-1)}path(e,t,a,n,i=1){let s=this.paths[e];this.put(e,+!!s.closed,s.length,0,(t%1+1)%1,a/s.length,n,i+20)}lane(e,t,a,n,i,s){let r=Math.max(1,Math.floor(this.paths[e].length/t));for(let t=0;t<r&&!this.full;t++)this.path(e,(t+(s()-.5)*.5)/r,a*(.94+.12*s()),n+(s()-.5)*1.6,i)}finish(e,t){let n=this.i,s=i(Array.from({length:n},(e,t)=>t),e),r=new Float32Array(4*n),l=new Float32Array(4*n);return s.forEach((e,t)=>{r.set(this.a.subarray(4*e,4*e+4),4*t),l.set(this.b.subarray(4*e,4*e+4),4*t)}),this.paths.length>a.PATH_ROWS&&(this.paths.length=a.PATH_ROWS),{a:r,b:l,paths:this.paths,antSize:t,used:n}}}function p(e,a,n){let i=Math.min(e/t.MARK_BOX.w,a/t.MARK_BOX.h)*n;return{s:i,ox:(e-t.MARK_BOX.w*i)/2,oy:(a-t.MARK_BOX.h*i)/2}}function f(e,t){if(e/t>=1.6){let a=.9*t,n=.48*a,i=Math.max(.04*e,16),s=Math.min(e-2*n-2*i-8,1.75*a),r=Math.min(.8*a,s/1.45),l=(e-(2*n+s+2*i))/2,o=(t+a)/2;return[{kind:"ios",x:l,y:o-a,w:n,h:a,r:.17*n},{kind:"web",x:l+n+i,y:o-r,w:s,h:r,r:.035*Math.min(s,r)},{kind:"android",x:l+n+i+s+i,y:o-a,w:n,h:a,r:.11*n}]}let a=.94*e,n=Math.min(.34*t,a/1.5),i=Math.min(.48*t,(.8*e-24)/2/.48),s=.48*i,r=Math.min(.14*e,Math.max(24,.94*e-2*s-.3*e)),l=(e-(2*s+r))/2;return[{kind:"web",x:(e-a)/2,y:.04*t,w:a,h:n,r:.04*Math.min(a,n)},{kind:"ios",x:l,y:.96*t-i,w:s,h:i,r:.17*s},{kind:"android",x:l+s+r,y:.96*t-i,w:s,h:i,r:.11*s}]}function m(e){if("web"===e.kind){let t=Math.max(.12*e.h,18),a=.012*e.w;return{x:e.x+a,y:e.y+t,w:e.w-2*a,h:e.h-t-a,r:.6*e.r,bar:t}}let t=.05*e.w;return{x:e.x+t,y:e.y+t,w:e.w-2*t,h:e.h-2*t,r:.8*e.r,bar:0}}function x(e,t){let a=t>1.1*e,n=(n,i)=>a?[e*(.5+(i-.5)*.9),t*n]:[e*n,t*i];return{vertical:a,r:s(.055*Math.min(e,t),12,30),prompt:n(.06,.5),agents:n(.24,.5),truth:n(.42,.5),apps:[n(.68,.17),n(.68,.5),n(.68,.83)],check:n(.93,.5)}}let v=["AC-home-1","AC-home-2","AC-home-3","AC-settings-1","AC-settings-2","AC-settings-3","AC-settings-4"],g=["iOS","Android","Web"],y=[[!1,!1,!0],[!1,!1,!0],[!1,!1,!1],[!0,!0,!0],[!0,!0,!0],[!0,!0,!0],[!0,!0,!0]];function w(e,t,a){let n=a?.36*e:.24*e,i=v.length,s=(e-n)/g.length,r=t/i,l=Math.min(.08*s,10),o=Math.min(.14*r,6),c=y.flatMap((e,t)=>e.map((e,a)=>({x:n+a*s+l,y:t*r+o,w:s-2*l,h:r-2*o,tested:e,r:t,c:a})));return{label:n,colW:s,rowH:r,cells:c}}e.s(["INK",0,0,"PARITY_COLS",0,g,"PARITY_ROWS",0,v,"PARITY_TESTED",0,y,"RED",0,1,"WHITE",0,2,"buildFormation",0,function(e,a){switch(e){case"mark":return function({w:e,h:a,n:i,mobile:l}){let h=n(7),f=s(Math.min(e,a)/(l?44:52),7,12),{s:m,ox:x,oy:v}=p(e,a,.985),g=.45*f/m,y=r(e,a,e=>{for(let a of(e.translate(x,v),e.scale(m,m),e.beginPath(),e.arc(12,12,12,0,2*Math.PI),e.fill(),e.globalCompositeOperation="destination-out",t.MARK_SEGMENTS))e.beginPath(),e.arc(a.cx,a.cy,a.r+g,0,2*Math.PI),e.fill();for(let a of(e.lineWidth=t.MARK_STROKE+2*g,e.lineCap="round",t.MARK_ANTENNAE))e.stroke(new Path2D(a))}),w=new u(i,e,a);return w.points(c(y,Math.min(i,d(o(y),f,1.4)),h),1),w.finish(h,f)}(a);case"markwhite":return function({w:e,h:a,n:i}){let l=n(11),h=s(Math.min(e,a)/52,7,11),{s:f,ox:m,oy:x}=p(e,a,1),v=new u(i,e,a),g=v.addPath(function(e,t,a,n=160){let i=[];for(let s=0;s<n;s++){let r=s/n*Math.PI*2-Math.PI/2;i.push([e+Math.cos(r)*a,t+Math.sin(r)*a])}return i}(m+12*f,x+12*f,12*f,220),!0);v.lane(g,1.35*h,34,-3,2,l),v.lane(g,1.35*h,-30,3.5,2,l);let y=r(e,a,e=>{for(let a of(e.translate(m,x),e.scale(f,f),t.MARK_SEGMENTS))e.beginPath(),e.arc(a.cx,a.cy,a.r,0,2*Math.PI),e.fill();for(let a of(e.lineWidth=1.7*t.MARK_STROKE,e.lineCap="round",t.MARK_ANTENNAE))e.stroke(new Path2D(a))});return v.points(c(y,Math.min(v.left,d(o(y),h,1.05)),l),2),v.finish(l,h)}(a);case"trail":return function({w:e,h:t},a){let i=n(3),r=new u(a,e,t),l=[];for(let a=0;a<=10;a++){let n=a/10;l.push([-.06*e+1.12*n*e,.5*t+Math.sin(n*Math.PI*2.1+.5)*t*.3+Math.sin(9*n)*t*.04])}let o=r.addPath(function(e,t=20,a=!1){let n=[],i=e.length,r=t=>a?e[(t+i)%i]:e[s(t,0,i-1)],l=a?i:i-1;for(let e=0;e<l;e++){let a=r(e-1),i=r(e),s=r(e+1),l=r(e+2);for(let e=0;e<t;e++){let r=e/t,o=r*r,c=o*r;n.push([.5*(2*i[0]+(-a[0]+s[0])*r+(2*a[0]-5*i[0]+4*s[0]-l[0])*o+(-a[0]+3*i[0]-3*s[0]+l[0])*c),.5*(2*i[1]+(-a[1]+s[1])*r+(2*a[1]-5*i[1]+4*s[1]-l[1])*o+(-a[1]+3*i[1]-3*s[1]+l[1])*c)])}}return a||n.push(e[i-1]),n}(l,24),!1);return r.lane(o,17,62,-4.5,1,i),r.lane(o,19,-54,5,1,i),r.finish(i,9)}(a,a.n);case"devices":return function({w:e,h:t,n:a,mobile:i}){let s=n(31),l=i?6.5:8,p=new u(Math.min(a,i?3136:6400),e,t),x=f(e,t);for(let e of x){let t=p.addPath(function(e,t,a,n,i,s=14){let r=[],l=(e,t,a)=>{for(let n=0;n<=s;n++){let l=a+n/s*(Math.PI/2);r.push([e+Math.cos(l)*i,t+Math.sin(l)*i])}};return l(e+a-i,t+i,-Math.PI/2),l(e+a-i,t+n-i,0),l(e+i,t+n-i,Math.PI/2),l(e+i,t+i,Math.PI),r}(e.x,e.y,e.w,e.h,e.r),!0);p.lane(t,1.45*l,30,-2.6,0,s),p.lane(t,1.45*l,-26,2.6,0,s)}let v=r(e,t,e=>{for(let t of x){let a=m(t);if("ios"===t.kind)h(e,a.x+.33*a.w,a.y+.018*a.h,.34*a.w,.042*a.h,.021*a.h),e.fill();else if("android"===t.kind)e.beginPath(),e.arc(a.x+a.w/2,a.y+.035*a.h,.04*a.w,0,2*Math.PI),e.fill();else{let n=t.y+.5*a.bar;for(let i=0;i<3;i++)e.beginPath(),e.arc(t.x+.035*t.w+i*t.w*.03,n,Math.max(3,.13*a.bar),0,2*Math.PI),e.fill();h(e,t.x+.22*t.w,n-.16*a.bar,.5*t.w,.32*a.bar,.16*a.bar),e.fill()}}}),g=r(e,t,e=>{for(let t of x){let a=m(t),n=a.x+.08*a.w,i=.84*a.w;if("web"===t.kind){let t=a.y+.12*a.h;h(e,n,t,.34*i,.075*a.h,4),e.fill(),h(e,n,t+.13*a.h,.52*i,.035*a.h,3),e.fill();let s=t+.27*a.h,r=.04*i,l=(i-2*r)/3;for(let t=0;t<3;t++)h(e,n+t*(l+r),s,l,.38*a.h,.1*Math.min(l,.38*a.h)),e.fill();continue}let s=a.y+.12*a.h;h(e,n,s,.62*i,.045*a.h,4),e.fill();let r=s+.08*a.h,l=.2*a.h;h(e,n,r,i,l,.12*Math.min(i,l)),e.fill();let o=r+l+.05*a.h;for(let t=0;t<4;t++){let s=o+t*a.h*.075,r=.018*a.h;e.beginPath(),e.arc(n+r,s+r,r,0,2*Math.PI),e.fill(),h(e,n+2.8*r,s+.45*r,i*(.62-t%2*.16),1.1*r,.5*r),e.fill()}}});return p.points(c(v,Math.min(p.left,d(o(v),l,1.3)),s),0),p.points(c(g,p.left,s),1),p.finish(s,l)}(a);case"flow":return function({w:e,h:t,n:a,mobile:i}){let s=n(29),l=i?6.5:8,h=new u(a,e,t),p=x(e,t),f=1.3*p.r;for(let[e,t,a,n,i]of[[p.prompt,.7*p.r,p.agents,p.r,1],[p.agents,p.r,p.truth,p.r,1],...p.apps.map(e=>[p.truth,p.r,e,f,1]),...p.apps.map(e=>[e,f,p.check,p.r,0])]){let r=a[0]-e[0],o=a[1]-e[1],c=Math.hypot(r,o),d=r/c,u=o/c,p=e[0]+d*t*1.15,f=e[1]+u*t*1.15,m=a[0]-d*n*1.15,x=a[1]-u*n*1.15,v=Math.max(2,Math.floor((c-t-n)/(2.3*l))),g=54+18*s();for(let e=0;e<v;e++)h.segment(p,f,m,x,e/v+.04*s(),g,0,i)}let m=r(e,t,e=>{let t=(t,a)=>{e.beginPath(),e.arc(t[0],t[1],a,0,2*Math.PI),e.fill()};t(p.prompt,.7*p.r),t(p.agents,p.r),t(p.truth,p.r),t(p.check,p.r)}),v=r(e,t,e=>{for(let t of p.apps)e.beginPath(),e.arc(t[0],t[1],f,0,2*Math.PI),e.fill()});return h.points(c(m,Math.min(h.left,d(o(m),l,1.3)),s),0),h.points(c(v,Math.min(h.left,d(o(v),l,1.3)),s),1),h.finish(s,l)}(a);case"parity":return function({w:e,h:t,n:a,mobile:i}){let l=n(41),{cells:p,rowH:f}=w(e,t,i),m=s(.3*f,5.5,8.5),x=new u(a,e,t),v=r(e,t,e=>{for(let t of p)t.tested&&(h(e,t.x,t.y,t.w,t.h,Math.min(.22*t.h,6)),e.fill())});return x.points(c(v,Math.min(x.left,d(o(v),m,1.1)),l),1),x.finish(l,m)}(a)}},"devicesGeometry",0,f,"flowGeometry",0,x,"mulberry32",0,n,"parityGrid",0,w,"screenOf",0,m])},70566,e=>{"use strict";let t=`
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
`,a=`
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
`,n=`
${t}
${a}
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
`,i=`
${t}
${a}
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
`,r=`
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
`;e.s(["MAX_STAGES",0,8,"PATH_ROWS",0,16,"PATH_SAMPLES",0,512,"antFragment",0,o,"antVertex",0,r,"positionShader",0,i,"shadowFragment",0,c,"velocityShader",0,n])}]);