import{r as m,R as ae,m as re,j as i,L as se,$ as ie,S as Y}from"./app-DP9dkHX6.js";import{A as oe,S as de,c as ne,d as le}from"./app-layout-Bjqdg_aF.js";import{B as Z}from"./button-D9YN_eAK.js";import{C as ce,a as me,b as pe,c as ue}from"./card-BVe_l3G1.js";import{I}from"./input-D2cWxQ17.js";import{L as _}from"./label-8F2RU8Z1.js";import{S as P,a as T,b as L,c as z,d as N}from"./select-DlePk8t0.js";import"./index-UKHHs9Zt.js";import"./createLucideIcon-BDpQS6v7.js";import"./index-Dlmi4Jgv.js";import"./app-logo-icon-CN-McaLz.js";import"./folder-root-CeDQ0Pc3.js";import"./grip-vertical-r4wb2W3f.js";import"./index-Dy-BYE7o.js";import"./index-C-bBHB_2.js";let he={data:""},fe=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||he},xe=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,ye=/\/\*[^]*?\*\/|  +/g,q=/\n+/g,j=(e,t)=>{let a="",d="",o="";for(let n in e){let r=e[n];n[0]=="@"?n[1]=="i"?a=n+" "+r+";":d+=n[1]=="f"?j(r,n):n+"{"+j(r,n[1]=="k"?"":t)+"}":typeof r=="object"?d+=j(r,t?t.replace(/([^,])+/g,s=>n.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,c=>/&/.test(c)?c.replace(/&/g,s):s?s+" "+c:c)):n):r!=null&&(n=/^--/.test(n)?n:n.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=j.p?j.p(n,r):n+":"+r+";")}return a+(t&&o?t+"{"+o+"}":o)+d},v={},K=e=>{if(typeof e=="object"){let t="";for(let a in e)t+=a+K(e[a]);return t}return e},ge=(e,t,a,d,o)=>{let n=K(e),r=v[n]||(v[n]=(c=>{let p=0,u=11;for(;p<c.length;)u=101*u+c.charCodeAt(p++)>>>0;return"go"+u})(n));if(!v[r]){let c=n!==e?e:(p=>{let u,l,h=[{}];for(;u=xe.exec(p.replace(ye,""));)u[4]?h.shift():u[3]?(l=u[3].replace(q," ").trim(),h.unshift(h[0][l]=h[0][l]||{})):h[0][u[1]]=u[2].replace(q," ").trim();return h[0]})(e);v[r]=j(o?{["@keyframes "+r]:c}:c,a?"":"."+r)}let s=a&&v.g?v.g:null;return a&&(v.g=v[r]),((c,p,u,l)=>{l?p.data=p.data.replace(l,c):p.data.indexOf(c)===-1&&(p.data=u?c+p.data:p.data+c)})(v[r],t,d,s),r},ve=(e,t,a)=>e.reduce((d,o,n)=>{let r=t[n];if(r&&r.call){let s=r(a),c=s&&s.props&&s.props.className||/^go/.test(s)&&s;r=c?"."+c:s&&typeof s=="object"?s.props?"":j(s,""):s===!1?"":s}return d+o+(r??"")},"");function A(e){let t=this||{},a=e.call?e(t.p):e;return ge(a.unshift?a.raw?ve(a,[].slice.call(arguments,1),t.p):a.reduce((d,o)=>Object.assign(d,o&&o.call?o(t.p):o),{}):a,fe(t.target),t.g,t.o,t.k)}let Q,M,B;A.bind({g:1});let b=A.bind({k:1});function be(e,t,a,d){j.p=t,Q=e,M=a,B=d}function w(e,t){let a=this||{};return function(){let d=arguments;function o(n,r){let s=Object.assign({},n),c=s.className||o.className;a.p=Object.assign({theme:M&&M()},s),a.o=/ *go\d+/.test(c),s.className=A.apply(a,d)+(c?" "+c:"");let p=e;return e[0]&&(p=s.as||e,delete s.as),B&&p[0]&&B(s),Q(p,s)}return t?t(o):o}}var je=e=>typeof e=="function",$=(e,t)=>je(e)?e(t):e,we=(()=>{let e=0;return()=>(++e).toString()})(),W=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),_e=20,V="default",G=(e,t)=>{let{toastLimit:a}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(r=>r.id===t.toast.id?{...r,...t.toast}:r)};case 2:let{toast:d}=t;return G(e,{type:e.toasts.find(r=>r.id===d.id)?1:0,toast:d});case 3:let{toastId:o}=t;return{...e,toasts:e.toasts.map(r=>r.id===o||o===void 0?{...r,dismissed:!0,visible:!1}:r)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(r=>r.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let n=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(r=>({...r,pauseDuration:r.pauseDuration+n}))}}},k=[],J={toasts:[],pausedAt:void 0,settings:{toastLimit:_e}},g={},X=(e,t=V)=>{g[t]=G(g[t]||J,e),k.forEach(([a,d])=>{a===t&&d(g[t])})},ee=e=>Object.keys(g).forEach(t=>X(e,t)),Ne=e=>Object.keys(g).find(t=>g[t].toasts.some(a=>a.id===e)),F=(e=V)=>t=>{X(t,e)},Ee={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},Se=(e={},t=V)=>{let[a,d]=m.useState(g[t]||J),o=m.useRef(g[t]);m.useEffect(()=>(o.current!==g[t]&&d(g[t]),k.push([t,d]),()=>{let r=k.findIndex(([s])=>s===t);r>-1&&k.splice(r,1)}),[t]);let n=a.toasts.map(r=>{var s,c,p;return{...e,...e[r.type],...r,removeDelay:r.removeDelay||((s=e[r.type])==null?void 0:s.removeDelay)||(e==null?void 0:e.removeDelay),duration:r.duration||((c=e[r.type])==null?void 0:c.duration)||(e==null?void 0:e.duration)||Ee[r.type],style:{...e.style,...(p=e[r.type])==null?void 0:p.style,...r.style}}});return{...a,toasts:n}},Ce=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(a==null?void 0:a.id)||we()}),E=e=>(t,a)=>{let d=Ce(t,e,a);return F(d.toasterId||Ne(d.id))({type:2,toast:d}),d.id},x=(e,t)=>E("blank")(e,t);x.error=E("error");x.success=E("success");x.loading=E("loading");x.custom=E("custom");x.dismiss=(e,t)=>{let a={type:3,toastId:e};t?F(t)(a):ee(a)};x.dismissAll=e=>x.dismiss(void 0,e);x.remove=(e,t)=>{let a={type:4,toastId:e};t?F(t)(a):ee(a)};x.removeAll=e=>x.remove(void 0,e);x.promise=(e,t,a)=>{let d=x.loading(t.loading,{...a,...a==null?void 0:a.loading});return typeof e=="function"&&(e=e()),e.then(o=>{let n=t.success?$(t.success,o):void 0;return n?x.success(n,{id:d,...a,...a==null?void 0:a.success}):x.dismiss(d),o}).catch(o=>{let n=t.error?$(t.error,o):void 0;n?x.error(n,{id:d,...a,...a==null?void 0:a.error}):x.dismiss(d)}),e};var ke=1e3,$e=(e,t="default")=>{let{toasts:a,pausedAt:d}=Se(e,t),o=m.useRef(new Map).current,n=m.useCallback((l,h=ke)=>{if(o.has(l))return;let f=setTimeout(()=>{o.delete(l),r({type:4,toastId:l})},h);o.set(l,f)},[]);m.useEffect(()=>{if(d)return;let l=Date.now(),h=a.map(f=>{if(f.duration===1/0)return;let S=(f.duration||0)+f.pauseDuration-(l-f.createdAt);if(S<0){f.visible&&x.dismiss(f.id);return}return setTimeout(()=>x.dismiss(f.id,t),S)});return()=>{h.forEach(f=>f&&clearTimeout(f))}},[a,d,t]);let r=m.useCallback(F(t),[t]),s=m.useCallback(()=>{r({type:5,time:Date.now()})},[r]),c=m.useCallback((l,h)=>{r({type:1,toast:{id:l,height:h}})},[r]),p=m.useCallback(()=>{d&&r({type:6,time:Date.now()})},[d,r]),u=m.useCallback((l,h)=>{let{reverseOrder:f=!1,gutter:S=8,defaultPosition:H}=h||{},D=a.filter(y=>(y.position||H)===(l.position||H)&&y.height),te=D.findIndex(y=>y.id===l.id),U=D.filter((y,O)=>O<te&&y.visible).length;return D.filter(y=>y.visible).slice(...f?[U+1]:[0,U]).reduce((y,O)=>y+(O.height||0)+S,0)},[a]);return m.useEffect(()=>{a.forEach(l=>{if(l.dismissed)n(l.id,l.removeDelay);else{let h=o.get(l.id);h&&(clearTimeout(h),o.delete(l.id))}})},[a,n]),{toasts:a,handlers:{updateHeight:c,startPause:s,endPause:p,calculateOffset:u}}},Ae=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,Fe=b`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,De=b`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,Oe=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Ae} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${Fe} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${De} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,Ie=b`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,Pe=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${Ie} 1s linear infinite;
`,Te=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,Le=b`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,ze=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Te} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${Le} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Re=w("div")`
  position: absolute;
`,Me=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Be=b`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Ve=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Be} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,He=({toast:e})=>{let{icon:t,type:a,iconTheme:d}=e;return t!==void 0?typeof t=="string"?m.createElement(Ve,null,t):t:a==="blank"?null:m.createElement(Me,null,m.createElement(Pe,{...d}),a!=="loading"&&m.createElement(Re,null,a==="error"?m.createElement(Oe,{...d}):m.createElement(ze,{...d})))},Ue=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ye=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Ze="0%{opacity:0;} 100%{opacity:1;}",qe="0%{opacity:1;} 100%{opacity:0;}",Ke=w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Qe=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,We=(e,t)=>{let a=e.includes("top")?1:-1,[d,o]=W()?[Ze,qe]:[Ue(a),Ye(a)];return{animation:t?`${b(d)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${b(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Ge=m.memo(({toast:e,position:t,style:a,children:d})=>{let o=e.height?We(e.position||t||"top-center",e.visible):{opacity:0},n=m.createElement(He,{toast:e}),r=m.createElement(Qe,{...e.ariaProps},$(e.message,e));return m.createElement(Ke,{className:e.className,style:{...o,...a,...e.style}},typeof d=="function"?d({icon:n,message:r}):m.createElement(m.Fragment,null,n,r))});be(m.createElement);var Je=({id:e,className:t,style:a,onHeightUpdate:d,children:o})=>{let n=m.useCallback(r=>{if(r){let s=()=>{let c=r.getBoundingClientRect().height;d(e,c)};s(),new MutationObserver(s).observe(r,{subtree:!0,childList:!0,characterData:!0})}},[e,d]);return m.createElement("div",{ref:n,className:t,style:a},o)},Xe=(e,t)=>{let a=e.includes("top"),d=a?{top:0}:{bottom:0},o=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:W()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(a?1:-1)}px)`,...d,...o}},et=A`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,C=16,tt=({reverseOrder:e,position:t="top-center",toastOptions:a,gutter:d,children:o,toasterId:n,containerStyle:r,containerClassName:s})=>{let{toasts:c,handlers:p}=$e(a,n);return m.createElement("div",{"data-rht-toaster":n||"",style:{position:"fixed",zIndex:9999,top:C,left:C,right:C,bottom:C,pointerEvents:"none",...r},className:s,onMouseEnter:p.startPause,onMouseLeave:p.endPause},c.map(u=>{let l=u.position||t,h=p.calculateOffset(u,{reverseOrder:e,gutter:d,defaultPosition:t}),f=Xe(l,h);return m.createElement(Je,{id:u.id,key:u.id,onHeightUpdate:p.updateHeight,className:u.visible?et:"",style:f},u.type==="custom"?$(u.message,u):o?o(u):m.createElement(Ge,{toast:u,position:l}))}))},R=x;function yt({fund:e,fundHeads:t}){const a=!!e,d=ae.useMemo(()=>t?Array.isArray(t)?t:Object.entries(t).map(([l,h])=>({id:parseInt(l),name:h})):[],[t]),{data:o,setData:n,processing:r,errors:s,reset:c}=re({amount:(e==null?void 0:e.amount)||0,institute_id:(e==null?void 0:e.institute_id)||0,fund_head_id:(e==null?void 0:e.fund_head_id)||null,added_date:e!=null&&e.added_date?new Date(e.added_date):new Date,status:(e==null?void 0:e.status)||"Pending",description:(e==null?void 0:e.description)||"",type:(e==null?void 0:e.type)||"in"}),p=l=>{l.preventDefault();const h={...o,added_date:o.added_date?o.added_date.toISOString().split("T")[0]:null};a?Y.put(`/funds/${e.id}`,h,{preserveScroll:!0,onError:f=>{R.error("Please check the form for errors.")},onSuccess:()=>{R.success("Fund updated successfully!")}}):Y.post("/funds",h,{preserveScroll:!0,onError:f=>{console.log(f),R.error("Please check the form for errors.")},onSuccess:()=>{c()}})},u=[{title:"Funds",href:"/funds"},{title:a?"Edit Fund":"Add Fund",href:"#"}];return i.jsxs(oe,{breadcrumbs:u,children:[i.jsx(se,{title:a?"Edit Fund":"Add Fund"}),i.jsx(tt,{position:"top-right"}),i.jsx("div",{className:"flex-1 p-4 md:p-6 w-[70vw] mx-auto",children:i.jsxs(ce,{children:[i.jsxs(me,{children:[i.jsx(pe,{className:"text-2xl font-bold",children:a?"Edit Fund":"Add Fund"}),i.jsx("p",{className:"text-sm text-muted-foreground",children:a?"Edit fund details":"Create a new fund"})]}),i.jsx(de,{}),i.jsxs(ue,{className:"pt-6",children:[Object.keys(s).length>0&&i.jsxs("div",{className:"mb-6 p-4 bg-red-100 text-red-700 rounded-md",children:[i.jsx("p",{className:"font-bold",children:"Please fix the following errors:"}),i.jsx("ul",{className:"list-disc pl-5 mt-2",children:Object.entries(s).map(([l,h])=>i.jsx("li",{className:"text-sm",children:h},l))})]}),i.jsxs("form",{onSubmit:p,className:"space-y-6",children:[i.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[i.jsxs("div",{className:"space-y-2",children:[i.jsx(_,{htmlFor:"amount",children:"Amount"}),i.jsx(I,{id:"amount",type:"number",value:o.amount,onChange:l=>n("amount",Number(l.target.value)),placeholder:"Enter Amount","aria-invalid":!!s.amount,"aria-describedby":s.amount?"amount-error":void 0}),s.amount&&i.jsx("p",{id:"amount-error",className:"mt-1 text-sm text-red-600 font-medium",children:s.amount})]}),i.jsxs("div",{className:"space-y-2",children:[i.jsx(_,{htmlFor:"added_date",children:"Date"}),i.jsx(I,{id:"added_date",type:"date",value:o.added_date?o.added_date.toISOString().split("T")[0]:"",onChange:l=>n("added_date",l.target.value?new Date(l.target.value):null),className:"mt-1 block w-full border-gray-300 rounded-md shadow-sm","aria-invalid":!!s.added_date,"aria-describedby":s.added_date?"added_date-error":void 0}),s.added_date&&i.jsx("p",{id:"added_date-error",className:"mt-1 text-sm text-red-600 font-medium",children:s.added_date})]}),i.jsxs("div",{className:"space-y-2",children:[i.jsx(_,{htmlFor:"fund_head_id",children:"Fund Type"}),i.jsxs(P,{value:o.fund_head_id?o.fund_head_id.toString():"",onValueChange:l=>n("fund_head_id",parseInt(l)),children:[i.jsx(T,{"aria-invalid":!!s.fund_head_id,"aria-describedby":s.fund_head_id?"fund_head_id-error":void 0,children:i.jsx(L,{placeholder:"Select fund type"})}),i.jsx(z,{children:d.map(l=>i.jsx(N,{value:l.id.toString(),children:l.name},l.id))})]}),s.fund_head_id&&i.jsx("p",{id:"fund_head_id-error",className:"mt-1 text-sm text-red-600 font-medium",children:s.fund_head_id})]}),i.jsxs("div",{className:"space-y-2",children:[i.jsx(_,{htmlFor:"status",children:"Status"}),i.jsxs(P,{value:o.status,onValueChange:l=>n("status",l),children:[i.jsx(T,{"aria-invalid":!!s.status,"aria-describedby":s.status?"status-error":void 0,children:i.jsx(L,{placeholder:"Select status"})}),i.jsxs(z,{children:[i.jsx(N,{value:"Approved",children:"Approved"}),i.jsx(N,{value:"Pending",children:"Pending"})]})]}),s.status&&i.jsx("p",{id:"status-error",className:"mt-1 text-sm text-red-600 font-medium",children:s.status})]}),i.jsxs("div",{className:"space-y-2",children:[i.jsx(_,{htmlFor:"type",children:"Type"}),i.jsxs(P,{value:o.type,onValueChange:l=>n("type",l),children:[i.jsx(T,{"aria-invalid":!!s.type,"aria-describedby":s.type?"type-error":void 0,children:i.jsx(L,{placeholder:"Select type"})}),i.jsxs(z,{children:[i.jsx(N,{value:"in",children:"In"}),i.jsx(N,{value:"out",children:"Out"}),i.jsx(N,{value:"service",children:"Service"})]})]}),s.type&&i.jsx("p",{id:"type-error",className:"mt-1 text-sm text-red-600 font-medium",children:s.type})]}),i.jsxs("div",{className:"space-y-2 md:col-span-2",children:[i.jsx(_,{htmlFor:"description",children:"Description"}),i.jsx(I,{id:"description",type:"text",value:o.description,onChange:l=>n("description",l.target.value),placeholder:"Enter description","aria-invalid":!!s.description,"aria-describedby":s.description?"description-error":void 0}),s.description&&i.jsx("p",{id:"description-error",className:"mt-1 text-sm text-red-600 font-medium",children:s.description})]})]}),i.jsxs("div",{className:"flex items-center justify-between pt-6",children:[i.jsx(ie,{href:"/funds",children:i.jsxs(Z,{type:"button",variant:"secondary",children:[i.jsx(ne,{className:"mr-2 h-4 w-4"}),"Back"]})}),i.jsxs(Z,{type:"submit",disabled:r,children:[i.jsx(le,{className:"mr-2 h-4 w-4"}),r?a?"Saving...":"Adding...":a?"Save Changes":"Add Fund"]})]})]})]})]})})]})}export{yt as default};
