var q=Object.create;var E=Object.defineProperty;var U=Object.getOwnPropertyDescriptor;var z=Object.getOwnPropertyNames;var V=Object.getPrototypeOf,G=Object.prototype.hasOwnProperty;var Z=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var J=(e,t,o,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of z(t))!G.call(e,r)&&r!==o&&E(e,r,{get:()=>t[r],enumerable:!(i=U(t,r))||i.enumerable});return e};var Q=(e,t,o)=>(o=e!=null?q(V(e)):{},J(t||!e||!e.__esModule?E(o,"default",{value:e,enumerable:!0}):o,e));var x=Z((re,W)=>{var O={cwd:function(){return"/"},env:{}};function M(e){let t=typeof e;return t==="object"&&e===null?"null":t}function R(e,t){if(typeof e!="string")throw new TypeError(`[ERR_INVALID_ARG_TYPE]: The "${t}" argument must be of type string. Received ${M(e)}`)}function a(e){return e===47||e===92}function v(e){return e===47}function H(e){return e>=65&&e<=90||e>=97&&e<=122}function $(e,t,o,i){let r="",l=0,s=-1,n=0,c=0;for(let f=0;f<=e.length;++f){if(f<e.length)c=e.charCodeAt(f);else{if(i(c))break;c=47}if(i(c)){if(!(s===f-1||n===1))if(n===2){if(r.length<2||l!==2||r.charCodeAt(r.length-1)!==46||r.charCodeAt(r.length-2)!==46){if(r.length>2){let A=r.lastIndexOf(o);A===-1?(r="",l=0):(r=r.slice(0,A),l=r.length-1-r.lastIndexOf(o)),s=f,n=0;continue}else if(r.length!==0){r="",l=0,s=f,n=0;continue}}t&&(r+=r.length>0?`${o}..`:"..",l=2)}else r.length>0?r+=`${o}${e.slice(s+1,f)}`:r=e.slice(s+1,f),l=f-s-1;s=f,n=0}else c===46&&n!==-1?++n:n=-1}return r}function I(e,t){if(t===null||typeof t!="object")throw new TypeError(`[ERR_INVALID_ARG_TYPE]: The "pathObject" argument must be of type object. Received ${M(t)}`);let o=t.dir||t.root,i=t.base||`${t.name||""}${t.ext||""}`;return o?o===t.root?`${o}${i}`:`${o}${e}${i}`:i}var _={resolve(...e){let t="",o="",i=!1;for(let r=e.length-1;r>=-1;r--){let l;if(r>=0){if(l=e[r],R(l,"path"),l.length===0)continue}else t.length===0?l=O.cwd():(l=O.env[`=${t}`]||O.cwd(),(l===void 0||l.slice(0,2).toLowerCase()!==t.toLowerCase()&&l.charCodeAt(2)===92)&&(l=`${t}\\`));let s=l.length,n=0,c="",f=!1,A=l.charCodeAt(0);if(s===1)a(A)&&(n=1,f=!0);else if(a(A))if(f=!0,a(l.charCodeAt(1))){let d=2,u=d;for(;d<s&&!a(l.charCodeAt(d));)d++;if(d<s&&d!==u){let C=l.slice(u,d);for(u=d;d<s&&a(l.charCodeAt(d));)d++;if(d<s&&d!==u){for(u=d;d<s&&!a(l.charCodeAt(d));)d++;(d===s||d!==u)&&(c=`\\\\${C}\\${l.slice(u,d)}`,n=d)}}}else n=1;else H(A)&&l.charCodeAt(1)===58&&(c=l.slice(0,2),n=2,s>2&&a(l.charCodeAt(2))&&(f=!0,n=3));if(c.length>0)if(t.length>0){if(c.toLowerCase()!==t.toLowerCase())continue}else t=c;if(i){if(t.length>0)break}else if(o=`${l.slice(n)}\\${o}`,i=f,f&&t.length>0)break}return o=$(o,!i,"\\",a),i?`${t}\\${o}`:`${t}${o}`||"."},normalize(e){R(e,"path");let t=e.length;if(t===0)return".";let o=0,i,r=!1,l=e.charCodeAt(0);if(t===1)return v(l)?"\\":e;if(a(l))if(r=!0,a(e.charCodeAt(1))){let n=2,c=n;for(;n<t&&!a(e.charCodeAt(n));)n++;if(n<t&&n!==c){let f=e.slice(c,n);for(c=n;n<t&&a(e.charCodeAt(n));)n++;if(n<t&&n!==c){for(c=n;n<t&&!a(e.charCodeAt(n));)n++;if(n===t)return`\\\\${f}\\${e.slice(c)}\\`;n!==c&&(i=`\\\\${f}\\${e.slice(c,n)}`,o=n)}}}else o=1;else H(l)&&e.charCodeAt(1)===58&&(i=e.slice(0,2),o=2,t>2&&a(e.charCodeAt(2))&&(r=!0,o=3));let s=o<t?$(e.slice(o),!r,"\\",a):"";return s.length===0&&!r&&(s="."),s.length>0&&a(e.charCodeAt(t-1))&&(s+="\\"),i===void 0?r?`\\${s}`:s:r?`${i}\\${s}`:`${i}${s}`},isAbsolute(e){R(e,"path");let t=e.length;if(t===0)return!1;let o=e.charCodeAt(0);return a(o)||t>2&&H(o)&&e.charCodeAt(1)===58&&a(e.charCodeAt(2))},join(...e){if(e.length===0)return".";let t,o;for(let l=0;l<e.length;++l){let s=e[l];R(s,"path"),s.length>0&&(t===void 0?t=o=s:t+=`\\${s}`)}if(t===void 0)return".";let i=!0,r=0;if(a(o.charCodeAt(0))){++r;let l=o.length;l>1&&a(o.charCodeAt(1))&&(++r,l>2&&(a(o.charCodeAt(2))?++r:i=!1))}if(i){for(;r<t.length&&a(t.charCodeAt(r));)r++;r>=2&&(t=`\\${t.slice(r)}`)}return _.normalize(t)},relative(e,t){if(R(e,"from"),R(t,"to"),e===t)return"";let o=_.resolve(e),i=_.resolve(t);if(o===i||(e=o.toLowerCase(),t=i.toLowerCase(),e===t))return"";let r=0;for(;r<e.length&&e.charCodeAt(r)===92;)r++;let l=e.length;for(;l-1>r&&e.charCodeAt(l-1)===92;)l--;let s=l-r,n=0;for(;n<t.length&&t.charCodeAt(n)===92;)n++;let c=t.length;for(;c-1>n&&t.charCodeAt(c-1)===92;)c--;let f=c-n,A=s<f?s:f,d=-1,u=0;for(;u<A;u++){let h=e.charCodeAt(r+u);if(h!==t.charCodeAt(n+u))break;h===92&&(d=u)}if(u!==A){if(d===-1)return i}else{if(f>A){if(t.charCodeAt(n+u)===92)return i.slice(n+u+1);if(u===2)return i.slice(n+u)}s>A&&(e.charCodeAt(r+u)===92?d=u:u===2&&(d=3)),d===-1&&(d=0)}let C="";for(u=r+d+1;u<=l;++u)(u===l||e.charCodeAt(u)===92)&&(C+=C.length===0?"..":"\\..");return n+=d,C.length>0?`${C}${i.slice(n,c)}`:(i.charCodeAt(n)===92&&++n,i.slice(n,c))},toNamespacedPath(e){if(typeof e!="string")return e;if(e.length===0)return"";let t=_.resolve(e);if(t.length<=2)return e;if(t.charCodeAt(0)===92){if(t.charCodeAt(1)===92){let o=t.charCodeAt(2);if(o!==63&&o!==46)return`\\\\?\\UNC\\${t.slice(2)}`}}else if(H(t.charCodeAt(0))&&t.charCodeAt(1)===58&&t.charCodeAt(2)===92)return`\\\\?\\${t}`;return e},dirname(e){R(e,"path");let t=e.length;if(t===0)return".";let o=-1,i=0,r=e.charCodeAt(0);if(t===1)return a(r)?e:".";if(a(r)){if(o=i=1,a(e.charCodeAt(1))){let n=2,c=n;for(;n<t&&!a(e.charCodeAt(n));)n++;if(n<t&&n!==c){for(c=n;n<t&&a(e.charCodeAt(n));)n++;if(n<t&&n!==c){for(c=n;n<t&&!a(e.charCodeAt(n));)n++;if(n===t)return e;n!==c&&(o=i=n+1)}}}}else H(r)&&e.charCodeAt(1)===58&&(o=t>2&&a(e.charCodeAt(2))?3:2,i=o);let l=-1,s=!0;for(let n=t-1;n>=i;--n)if(a(e.charCodeAt(n))){if(!s){l=n;break}}else s=!1;if(l===-1){if(o===-1)return".";l=o}return e.slice(0,l)},basename(e,t){t!==void 0&&R(t,"ext"),R(e,"path");let o=0,i=-1,r=!0;if(e.length>=2&&H(e.charCodeAt(0))&&e.charCodeAt(1)===58&&(o=2),t!==void 0&&t.length>0&&t.length<=e.length){if(t===e)return"";let l=t.length-1,s=-1;for(let n=e.length-1;n>=o;--n){let c=e.charCodeAt(n);if(a(c)){if(!r){o=n+1;break}}else s===-1&&(r=!1,s=n+1),l>=0&&(c===t.charCodeAt(l)?--l===-1&&(i=n):(l=-1,i=s))}return o===i?i=s:i===-1&&(i=e.length),e.slice(o,i)}for(let l=e.length-1;l>=o;--l)if(a(e.charCodeAt(l))){if(!r){o=l+1;break}}else i===-1&&(r=!1,i=l+1);return i===-1?"":e.slice(o,i)},extname(e){R(e,"path");let t=0,o=-1,i=0,r=-1,l=!0,s=0;e.length>=2&&e.charCodeAt(1)===58&&H(e.charCodeAt(0))&&(t=i=2);for(let n=e.length-1;n>=t;--n){let c=e.charCodeAt(n);if(a(c)){if(!l){i=n+1;break}continue}r===-1&&(l=!1,r=n+1),c===46?o===-1?o=n:s!==1&&(s=1):o!==-1&&(s=-1)}return o===-1||r===-1||s===0||s===1&&o===r-1&&o===i+1?"":e.slice(o,r)},format:I.bind(null,"\\"),parse(e){R(e,"path");let t={root:"",dir:"",base:"",ext:"",name:""};if(e.length===0)return t;let o=e.length,i=0,r=e.charCodeAt(0);if(o===1)return a(r)?(t.root=t.dir=e,t):(t.base=t.name=e,t);if(a(r)){if(i=1,a(e.charCodeAt(1))){let d=2,u=d;for(;d<o&&!a(e.charCodeAt(d));)d++;if(d<o&&d!==u){for(u=d;d<o&&a(e.charCodeAt(d));)d++;if(d<o&&d!==u){for(u=d;d<o&&!a(e.charCodeAt(d));)d++;d===o?i=d:d!==u&&(i=d+1)}}}}else if(H(r)&&e.charCodeAt(1)===58){if(o<=2)return t.root=t.dir=e,t;if(i=2,a(e.charCodeAt(2))){if(o===3)return t.root=t.dir=e,t;i=3}}i>0&&(t.root=e.slice(0,i));let l=-1,s=i,n=-1,c=!0,f=e.length-1,A=0;for(;f>=i;--f){if(r=e.charCodeAt(f),a(r)){if(!c){s=f+1;break}continue}n===-1&&(c=!1,n=f+1),r===46?l===-1?l=f:A!==1&&(A=1):l!==-1&&(A=-1)}return n!==-1&&(l===-1||A===0||A===1&&l===n-1&&l===s+1?t.base=t.name=e.slice(s,n):(t.name=e.slice(s,l),t.base=e.slice(s,n),t.ext=e.slice(l,n))),s>0&&s!==i?t.dir=e.slice(0,s-1):t.dir=t.root,t},sep:"\\",delimiter:";",win32:null,posix:null},S={resolve(...e){let t="",o=!1;for(let i=e.length-1;i>=-1&&!o;i--){let r=i>=0?e[i]:O.cwd();R(r,"path"),r.length!==0&&(t=`${r}/${t}`,o=r.charCodeAt(0)===47)}return t=$(t,!o,"/",v),o?`/${t}`:t.length>0?t:"."},normalize(e){if(R(e,"path"),e.length===0)return".";let t=e.charCodeAt(0)===47,o=e.charCodeAt(e.length-1)===47;return e=$(e,!t,"/",v),e.length===0?t?"/":o?"./":".":(o&&(e+="/"),t?`/${e}`:e)},isAbsolute(e){return R(e,"path"),e.length>0&&e.charCodeAt(0)===47},join(...e){if(e.length===0)return".";let t;for(let o=0;o<e.length;++o){let i=e[o];R(i,"path"),i.length>0&&(t===void 0?t=i:t+=`/${i}`)}return t===void 0?".":S.normalize(t)},relative(e,t){if(R(e,"from"),R(t,"to"),e===t||(e=S.resolve(e),t=S.resolve(t),e===t))return"";let o=1,i=e.length,r=i-o,l=1,s=t.length-l,n=r<s?r:s,c=-1,f=0;for(;f<n;f++){let d=e.charCodeAt(o+f);if(d!==t.charCodeAt(l+f))break;d===47&&(c=f)}if(f===n)if(s>n){if(t.charCodeAt(l+f)===47)return t.slice(l+f+1);if(f===0)return t.slice(l+f)}else r>n&&(e.charCodeAt(o+f)===47?c=f:f===0&&(c=0));let A="";for(f=o+c+1;f<=i;++f)(f===i||e.charCodeAt(f)===47)&&(A+=A.length===0?"..":"/..");return`${A}${t.slice(l+c)}`},toNamespacedPath(e){return e},dirname(e){if(R(e,"path"),e.length===0)return".";let t=e.charCodeAt(0)===47,o=-1,i=!0;for(let r=e.length-1;r>=1;--r)if(e.charCodeAt(r)===47){if(!i){o=r;break}}else i=!1;return o===-1?t?"/":".":t&&o===1?"//":e.slice(0,o)},basename(e,t){t!==void 0&&R(t,"ext"),R(e,"path");let o=0,i=-1,r=!0;if(t!==void 0&&t.length>0&&t.length<=e.length){if(t===e)return"";let l=t.length-1,s=-1;for(let n=e.length-1;n>=0;--n){let c=e.charCodeAt(n);if(c===47){if(!r){o=n+1;break}}else s===-1&&(r=!1,s=n+1),l>=0&&(c===t.charCodeAt(l)?--l===-1&&(i=n):(l=-1,i=s))}return o===i?i=s:i===-1&&(i=e.length),e.slice(o,i)}for(let l=e.length-1;l>=0;--l)if(e.charCodeAt(l)===47){if(!r){o=l+1;break}}else i===-1&&(r=!1,i=l+1);return i===-1?"":e.slice(o,i)},extname(e){R(e,"path");let t=-1,o=0,i=-1,r=!0,l=0;for(let s=e.length-1;s>=0;--s){let n=e.charCodeAt(s);if(n===47){if(!r){o=s+1;break}continue}i===-1&&(r=!1,i=s+1),n===46?t===-1?t=s:l!==1&&(l=1):t!==-1&&(l=-1)}return t===-1||i===-1||l===0||l===1&&t===i-1&&t===o+1?"":e.slice(t,i)},format:I.bind(null,"/"),parse(e){R(e,"path");let t={root:"",dir:"",base:"",ext:"",name:""};if(e.length===0)return t;let o=e.charCodeAt(0)===47,i;o?(t.root="/",i=1):i=0;let r=-1,l=0,s=-1,n=!0,c=e.length-1,f=0;for(;c>=i;--c){let A=e.charCodeAt(c);if(A===47){if(!n){l=c+1;break}continue}s===-1&&(n=!1,s=c+1),A===46?r===-1?r=c:f!==1&&(f=1):r!==-1&&(f=-1)}if(s!==-1){let A=l===0&&o?1:l;r===-1||f===0||f===1&&r===s-1&&r===l+1?t.base=t.name=e.slice(A,s):(t.name=e.slice(A,r),t.base=e.slice(A,s),t.ext=e.slice(r,s))}return l>0?t.dir=e.slice(0,l-1):o&&(t.dir="/"),t},sep:"/",delimiter:":",win32:null,posix:null};S.win32=_.win32=_;S.posix=_.posix=S;_._makeLong=_.toNamespacedPath;S._makeLong=S.toNamespacedPath;W.exports=O.platform==="win32"?_:S});var p=Q(x(),1);var P={get exports(){return{}},filename:"",id:"",children:[]},k="Failed evaluating: ";function F(e){let{resolveFrom:t,dirname:o,readFileSync:i,globals:r={},loadModuleHook:l}=e,s=new Map,n=new WeakSet,c=l?l(d):d;return{requireModule(u){return u===!1?{}:(s.get(u)??c(u)).exports},requireFrom(u,C){return A(u,C).exports},resolveFrom:t,requireCache:s,globals:r};function f(u,C,h){let m=t(u,C,h);if(m===void 0)throw new Error(`Cannot resolve "${C}" in ${h||u}`);return m}function A(u,C,h){let m=s.get(C);if(m)return m;let w=f(u,C,h);return w===!1?P:s.get(w)??c(w)}function d(u){let C={exports:{},filename:u,id:u,children:[]},h=o(u),m=i(u);if(u.endsWith(".json"))return C.exports=JSON.parse(m),s.set(u,C),C;let w=g=>{let L=A(h,g,u);return L!==P&&!C.children.includes(L)&&C.children.push(L),L.exports};w.resolve=g=>f(h,g,u);let D={module:C,exports:C.exports,__filename:u,__dirname:h,require:w},y={global:globalThis,...r},j=Object.keys(D).join(", "),N=Object.keys(y).join(", "),K=(0,eval)(`(function (${N}){ return (function (${j}){${m}
}); })`);s.set(u,C);try{K(...Object.values(y))(...Object.values(D))}catch(g){if(s.delete(u),g instanceof Error){let L=n.has(g)?g.message.slice(k.length):g.message;g.message=`${k}${u} -> ${L}`,n.add(g)}throw g}return C}}function b(e){return typeof e=="object"&&e!==null}function T({api:e,dispatchResponse:t}){async function o({id:i,methodName:r,args:l,type:s}){if(s!=="call"||typeof r!="string")return;let n=e[r];if(typeof n!="function")t({type:"response",id:i,methodName:r,error:new Error(`${r} is not a function. typeof returned ${typeof n}`)});else try{let c=await n.apply(e,l);t({type:"response",id:i,methodName:r,returnValue:c})}catch(c){t({type:"response",id:i,methodName:r,error:c})}}return{onCall:o}}var B=e=>{if(ee(e.data)&&e.ports[0]){let[t]=e.ports,{onCall:o}=T({api:{evaluateAndRender:Y},dispatchResponse:i=>t.postMessage(i)});t.addEventListener("message",i=>o(i.data)),t.start()}else globalThis.addEventListener("message",B,{once:!0})};globalThis.addEventListener("message",B,{once:!0});async function Y(e,t){t=Array.isArray(t)?t:[t];let o=F({dirname:p.default.dirname,readFileSync(i){let r=e.get(i);if(!r)throw new Error(`Module ${i} not found`);return r.compiledContents},resolveFrom(i,r,l){if(!l)throw new Error(`Cannot resolve ${r} from ${i} without requestOrigin`);let s=e.get(l);if(!s)throw new Error(`Module ${l} not found`);let n=s.resolvedRequests.get(r);if(n===void 0)throw new Error(`Cannot resolve ${r} from ${l}`);return n},globals:{process:{env:{NODE_ENV:"development"},browser:!0}}});for(let i of t){let r=o.requireModule(i);if(X(r)){let l="PREVIEW_ROOT",s=document.getElementById(l)??document.body.appendChild(document.createElement("div"));s.id=l,await r.default.render(s)}}}function X(e){return b(e)&&"default"in e&&b(e.default)&&typeof e.default.render=="function"}function ee(e){return b(e)&&"type"in e&&e.type==="connect"}