var Ee=Object.create;var re=Object.defineProperty;var We=Object.getOwnPropertyDescriptor;var Me=Object.getOwnPropertyNames;var $e=Object.getPrototypeOf,Ne=Object.prototype.hasOwnProperty;var Be=(e,o)=>()=>(o||e((o={exports:{}}).exports,o),o.exports);var Je=(e,o,s,n)=>{if(o&&typeof o=="object"||typeof o=="function")for(let i of Me(o))!Ne.call(e,i)&&i!==s&&re(e,i,{get:()=>o[i],enumerable:!(n=We(o,i))||n.enumerable});return e};var q=(e,o,s)=>(s=e!=null?Ee($e(e)):{},Je(o||!e||!e.__esModule?re(s,"default",{value:e,enumerable:!0}):s,e));var P=Be((fo,le)=>{var T={cwd:function(){return"/"},env:{}};function ce(e){let o=typeof e;return o==="object"&&e===null?"null":o}function k(e,o){if(typeof e!="string")throw new TypeError(`[ERR_INVALID_ARG_TYPE]: The "${o}" argument must be of type string. Received ${ce(e)}`)}function b(e){return e===47||e===92}function B(e){return e===47}function C(e){return e>=65&&e<=90||e>=97&&e<=122}function O(e,o,s,n){let i="",r=0,c=-1,t=0,a=0;for(let l=0;l<=e.length;++l){if(l<e.length)a=e.charCodeAt(l);else{if(n(a))break;a=47}if(n(a)){if(!(c===l-1||t===1))if(t===2){if(i.length<2||r!==2||i.charCodeAt(i.length-1)!==46||i.charCodeAt(i.length-2)!==46){if(i.length>2){let g=i.lastIndexOf(s);g===-1?(i="",r=0):(i=i.slice(0,g),r=i.length-1-i.lastIndexOf(s)),c=l,t=0;continue}else if(i.length!==0){i="",r=0,c=l,t=0;continue}}o&&(i+=i.length>0?`${s}..`:"..",r=2)}else i.length>0?i+=`${s}${e.slice(c+1,l)}`:i=e.slice(c+1,l),r=l-c-1;c=l,t=0}else a===46&&t!==-1?++t:t=-1}return i}function ae(e,o){if(o===null||typeof o!="object")throw new TypeError(`[ERR_INVALID_ARG_TYPE]: The "pathObject" argument must be of type object. Received ${ce(o)}`);let s=o.dir||o.root,n=o.base||`${o.name||""}${o.ext||""}`;return s?s===o.root?`${s}${n}`:`${s}${e}${n}`:n}var x={resolve(...e){let o="",s="",n=!1;for(let i=e.length-1;i>=-1;i--){let r;if(i>=0){if(r=e[i],k(r,"path"),r.length===0)continue}else o.length===0?r=T.cwd():(r=T.env[`=${o}`]||T.cwd(),(r===void 0||r.slice(0,2).toLowerCase()!==o.toLowerCase()&&r.charCodeAt(2)===92)&&(r=`${o}\\`));let c=r.length,t=0,a="",l=!1,g=r.charCodeAt(0);if(c===1)b(g)&&(t=1,l=!0);else if(b(g))if(l=!0,b(r.charCodeAt(1))){let p=2,d=p;for(;p<c&&!b(r.charCodeAt(p));)p++;if(p<c&&p!==d){let v=r.slice(d,p);for(d=p;p<c&&b(r.charCodeAt(p));)p++;if(p<c&&p!==d){for(d=p;p<c&&!b(r.charCodeAt(p));)p++;(p===c||p!==d)&&(a=`\\\\${v}\\${r.slice(d,p)}`,t=p)}}}else t=1;else C(g)&&r.charCodeAt(1)===58&&(a=r.slice(0,2),t=2,c>2&&b(r.charCodeAt(2))&&(l=!0,t=3));if(a.length>0)if(o.length>0){if(a.toLowerCase()!==o.toLowerCase())continue}else o=a;if(n){if(o.length>0)break}else if(s=`${r.slice(t)}\\${s}`,n=l,l&&o.length>0)break}return s=O(s,!n,"\\",b),n?`${o}\\${s}`:`${o}${s}`||"."},normalize(e){k(e,"path");let o=e.length;if(o===0)return".";let s=0,n,i=!1,r=e.charCodeAt(0);if(o===1)return B(r)?"\\":e;if(b(r))if(i=!0,b(e.charCodeAt(1))){let t=2,a=t;for(;t<o&&!b(e.charCodeAt(t));)t++;if(t<o&&t!==a){let l=e.slice(a,t);for(a=t;t<o&&b(e.charCodeAt(t));)t++;if(t<o&&t!==a){for(a=t;t<o&&!b(e.charCodeAt(t));)t++;if(t===o)return`\\\\${l}\\${e.slice(a)}\\`;t!==a&&(n=`\\\\${l}\\${e.slice(a,t)}`,s=t)}}}else s=1;else C(r)&&e.charCodeAt(1)===58&&(n=e.slice(0,2),s=2,o>2&&b(e.charCodeAt(2))&&(i=!0,s=3));let c=s<o?O(e.slice(s),!i,"\\",b):"";return c.length===0&&!i&&(c="."),c.length>0&&b(e.charCodeAt(o-1))&&(c+="\\"),n===void 0?i?`\\${c}`:c:i?`${n}\\${c}`:`${n}${c}`},isAbsolute(e){k(e,"path");let o=e.length;if(o===0)return!1;let s=e.charCodeAt(0);return b(s)||o>2&&C(s)&&e.charCodeAt(1)===58&&b(e.charCodeAt(2))},join(...e){if(e.length===0)return".";let o,s;for(let r=0;r<e.length;++r){let c=e[r];k(c,"path"),c.length>0&&(o===void 0?o=s=c:o+=`\\${c}`)}if(o===void 0)return".";let n=!0,i=0;if(b(s.charCodeAt(0))){++i;let r=s.length;r>1&&b(s.charCodeAt(1))&&(++i,r>2&&(b(s.charCodeAt(2))?++i:n=!1))}if(n){for(;i<o.length&&b(o.charCodeAt(i));)i++;i>=2&&(o=`\\${o.slice(i)}`)}return x.normalize(o)},relative(e,o){if(k(e,"from"),k(o,"to"),e===o)return"";let s=x.resolve(e),n=x.resolve(o);if(s===n||(e=s.toLowerCase(),o=n.toLowerCase(),e===o))return"";let i=0;for(;i<e.length&&e.charCodeAt(i)===92;)i++;let r=e.length;for(;r-1>i&&e.charCodeAt(r-1)===92;)r--;let c=r-i,t=0;for(;t<o.length&&o.charCodeAt(t)===92;)t++;let a=o.length;for(;a-1>t&&o.charCodeAt(a-1)===92;)a--;let l=a-t,g=c<l?c:l,p=-1,d=0;for(;d<g;d++){let S=e.charCodeAt(i+d);if(S!==o.charCodeAt(t+d))break;S===92&&(p=d)}if(d!==g){if(p===-1)return n}else{if(l>g){if(o.charCodeAt(t+d)===92)return n.slice(t+d+1);if(d===2)return n.slice(t+d)}c>g&&(e.charCodeAt(i+d)===92?p=d:d===2&&(p=3)),p===-1&&(p=0)}let v="";for(d=i+p+1;d<=r;++d)(d===r||e.charCodeAt(d)===92)&&(v+=v.length===0?"..":"\\..");return t+=p,v.length>0?`${v}${n.slice(t,a)}`:(n.charCodeAt(t)===92&&++t,n.slice(t,a))},toNamespacedPath(e){if(typeof e!="string")return e;if(e.length===0)return"";let o=x.resolve(e);if(o.length<=2)return e;if(o.charCodeAt(0)===92){if(o.charCodeAt(1)===92){let s=o.charCodeAt(2);if(s!==63&&s!==46)return`\\\\?\\UNC\\${o.slice(2)}`}}else if(C(o.charCodeAt(0))&&o.charCodeAt(1)===58&&o.charCodeAt(2)===92)return`\\\\?\\${o}`;return e},dirname(e){k(e,"path");let o=e.length;if(o===0)return".";let s=-1,n=0,i=e.charCodeAt(0);if(o===1)return b(i)?e:".";if(b(i)){if(s=n=1,b(e.charCodeAt(1))){let t=2,a=t;for(;t<o&&!b(e.charCodeAt(t));)t++;if(t<o&&t!==a){for(a=t;t<o&&b(e.charCodeAt(t));)t++;if(t<o&&t!==a){for(a=t;t<o&&!b(e.charCodeAt(t));)t++;if(t===o)return e;t!==a&&(s=n=t+1)}}}}else C(i)&&e.charCodeAt(1)===58&&(s=o>2&&b(e.charCodeAt(2))?3:2,n=s);let r=-1,c=!0;for(let t=o-1;t>=n;--t)if(b(e.charCodeAt(t))){if(!c){r=t;break}}else c=!1;if(r===-1){if(s===-1)return".";r=s}return e.slice(0,r)},basename(e,o){o!==void 0&&k(o,"ext"),k(e,"path");let s=0,n=-1,i=!0;if(e.length>=2&&C(e.charCodeAt(0))&&e.charCodeAt(1)===58&&(s=2),o!==void 0&&o.length>0&&o.length<=e.length){if(o===e)return"";let r=o.length-1,c=-1;for(let t=e.length-1;t>=s;--t){let a=e.charCodeAt(t);if(b(a)){if(!i){s=t+1;break}}else c===-1&&(i=!1,c=t+1),r>=0&&(a===o.charCodeAt(r)?--r===-1&&(n=t):(r=-1,n=c))}return s===n?n=c:n===-1&&(n=e.length),e.slice(s,n)}for(let r=e.length-1;r>=s;--r)if(b(e.charCodeAt(r))){if(!i){s=r+1;break}}else n===-1&&(i=!1,n=r+1);return n===-1?"":e.slice(s,n)},extname(e){k(e,"path");let o=0,s=-1,n=0,i=-1,r=!0,c=0;e.length>=2&&e.charCodeAt(1)===58&&C(e.charCodeAt(0))&&(o=n=2);for(let t=e.length-1;t>=o;--t){let a=e.charCodeAt(t);if(b(a)){if(!r){n=t+1;break}continue}i===-1&&(r=!1,i=t+1),a===46?s===-1?s=t:c!==1&&(c=1):s!==-1&&(c=-1)}return s===-1||i===-1||c===0||c===1&&s===i-1&&s===n+1?"":e.slice(s,i)},format:ae.bind(null,"\\"),parse(e){k(e,"path");let o={root:"",dir:"",base:"",ext:"",name:""};if(e.length===0)return o;let s=e.length,n=0,i=e.charCodeAt(0);if(s===1)return b(i)?(o.root=o.dir=e,o):(o.base=o.name=e,o);if(b(i)){if(n=1,b(e.charCodeAt(1))){let p=2,d=p;for(;p<s&&!b(e.charCodeAt(p));)p++;if(p<s&&p!==d){for(d=p;p<s&&b(e.charCodeAt(p));)p++;if(p<s&&p!==d){for(d=p;p<s&&!b(e.charCodeAt(p));)p++;p===s?n=p:p!==d&&(n=p+1)}}}}else if(C(i)&&e.charCodeAt(1)===58){if(s<=2)return o.root=o.dir=e,o;if(n=2,b(e.charCodeAt(2))){if(s===3)return o.root=o.dir=e,o;n=3}}n>0&&(o.root=e.slice(0,n));let r=-1,c=n,t=-1,a=!0,l=e.length-1,g=0;for(;l>=n;--l){if(i=e.charCodeAt(l),b(i)){if(!a){c=l+1;break}continue}t===-1&&(a=!1,t=l+1),i===46?r===-1?r=l:g!==1&&(g=1):r!==-1&&(g=-1)}return t!==-1&&(r===-1||g===0||g===1&&r===t-1&&r===c+1?o.base=o.name=e.slice(c,t):(o.name=e.slice(c,r),o.base=e.slice(c,t),o.ext=e.slice(r,t))),c>0&&c!==n?o.dir=e.slice(0,c-1):o.dir=o.root,o},sep:"\\",delimiter:";",win32:null,posix:null},R={resolve(...e){let o="",s=!1;for(let n=e.length-1;n>=-1&&!s;n--){let i=n>=0?e[n]:T.cwd();k(i,"path"),i.length!==0&&(o=`${i}/${o}`,s=i.charCodeAt(0)===47)}return o=O(o,!s,"/",B),s?`/${o}`:o.length>0?o:"."},normalize(e){if(k(e,"path"),e.length===0)return".";let o=e.charCodeAt(0)===47,s=e.charCodeAt(e.length-1)===47;return e=O(e,!o,"/",B),e.length===0?o?"/":s?"./":".":(s&&(e+="/"),o?`/${e}`:e)},isAbsolute(e){return k(e,"path"),e.length>0&&e.charCodeAt(0)===47},join(...e){if(e.length===0)return".";let o;for(let s=0;s<e.length;++s){let n=e[s];k(n,"path"),n.length>0&&(o===void 0?o=n:o+=`/${n}`)}return o===void 0?".":R.normalize(o)},relative(e,o){if(k(e,"from"),k(o,"to"),e===o||(e=R.resolve(e),o=R.resolve(o),e===o))return"";let s=1,n=e.length,i=n-s,r=1,c=o.length-r,t=i<c?i:c,a=-1,l=0;for(;l<t;l++){let p=e.charCodeAt(s+l);if(p!==o.charCodeAt(r+l))break;p===47&&(a=l)}if(l===t)if(c>t){if(o.charCodeAt(r+l)===47)return o.slice(r+l+1);if(l===0)return o.slice(r+l)}else i>t&&(e.charCodeAt(s+l)===47?a=l:l===0&&(a=0));let g="";for(l=s+a+1;l<=n;++l)(l===n||e.charCodeAt(l)===47)&&(g+=g.length===0?"..":"/..");return`${g}${o.slice(r+a)}`},toNamespacedPath(e){return e},dirname(e){if(k(e,"path"),e.length===0)return".";let o=e.charCodeAt(0)===47,s=-1,n=!0;for(let i=e.length-1;i>=1;--i)if(e.charCodeAt(i)===47){if(!n){s=i;break}}else n=!1;return s===-1?o?"/":".":o&&s===1?"//":e.slice(0,s)},basename(e,o){o!==void 0&&k(o,"ext"),k(e,"path");let s=0,n=-1,i=!0;if(o!==void 0&&o.length>0&&o.length<=e.length){if(o===e)return"";let r=o.length-1,c=-1;for(let t=e.length-1;t>=0;--t){let a=e.charCodeAt(t);if(a===47){if(!i){s=t+1;break}}else c===-1&&(i=!1,c=t+1),r>=0&&(a===o.charCodeAt(r)?--r===-1&&(n=t):(r=-1,n=c))}return s===n?n=c:n===-1&&(n=e.length),e.slice(s,n)}for(let r=e.length-1;r>=0;--r)if(e.charCodeAt(r)===47){if(!i){s=r+1;break}}else n===-1&&(i=!1,n=r+1);return n===-1?"":e.slice(s,n)},extname(e){k(e,"path");let o=-1,s=0,n=-1,i=!0,r=0;for(let c=e.length-1;c>=0;--c){let t=e.charCodeAt(c);if(t===47){if(!i){s=c+1;break}continue}n===-1&&(i=!1,n=c+1),t===46?o===-1?o=c:r!==1&&(r=1):o!==-1&&(r=-1)}return o===-1||n===-1||r===0||r===1&&o===n-1&&o===s+1?"":e.slice(o,n)},format:ae.bind(null,"/"),parse(e){k(e,"path");let o={root:"",dir:"",base:"",ext:"",name:""};if(e.length===0)return o;let s=e.charCodeAt(0)===47,n;s?(o.root="/",n=1):n=0;let i=-1,r=0,c=-1,t=!0,a=e.length-1,l=0;for(;a>=n;--a){let g=e.charCodeAt(a);if(g===47){if(!t){r=a+1;break}continue}c===-1&&(t=!1,c=a+1),g===46?i===-1?i=a:l!==1&&(l=1):i!==-1&&(l=-1)}if(c!==-1){let g=r===0&&s?1:r;i===-1||l===0||l===1&&i===c-1&&i===r+1?o.base=o.name=e.slice(g,c):(o.name=e.slice(g,i),o.base=e.slice(g,c),o.ext=e.slice(i,c))}return r>0?o.dir=e.slice(0,r-1):s&&(o.dir="/"),o},sep:"/",delimiter:":",win32:null,posix:null};R.win32=x.win32=x;R.posix=x.posix=R;x._makeLong=x.toNamespacedPath;R._makeLong=R.toNamespacedPath;le.exports=T.platform==="win32"?x:R});var Ae=q(P(),1);var pe="Compilation",de="compilation-worker.js",fe=4;var me="https://static.parastorage.com/unpkg/";var z=q(P(),1);async function D(e){try{return await e}catch{return}}function J(e,o,s){return{root:e,async statFile(t){let l=await(await i(t)).getFile();return{size:l.size,lastModified:l.lastModified}},async readFile(t){let g=await(await(await i(t)).getFile()).arrayBuffer();return new Uint8Array(g)},readTextFile:n,async readJSONFile(t){let a=await n(t);return ye(t,a)},async fileExists(t){return!!await r(t)},async directoryExists(t){return!!await c(t)},async openFile(t){let a=await i(t);return ue(a,t)},async openDirectory(t){let a=await c(t);if(!a)throw new Error(`cannot get directory handle for ${t}`);return be(a,t)}};async function n(t){return(await(await i(t)).getFile()).text()}async function i(t){let a=await r(t);if(!a)throw new Error(`cannot get file handle for ${t}`);return a}async function r(t){if(o?.has(t))return o.get(t);let a=z.default.dirname(t),l=await c(a),g=z.default.basename(t),p=await D(l?.getFileHandle(g));return o?.set(t,p),p}async function c(t){if(s?.has(t))return s.get(t);let a=z.default.dirname(t);if(a===t)return e;let l=await c(a),g=z.default.basename(t),p=await D(l?.getDirectoryHandle(g));return s?.set(t,p),p}}function ue(e,o){return{type:"file",name:e.name,path:o,async stat(){let s=await e.getFile();return{size:s.size,lastModified:s.lastModified}},async buffer(){let n=await(await e.getFile()).arrayBuffer();return new Uint8Array(n)},async json(){let n=await(await e.getFile()).text();return ye(o,n)},async text(){return(await e.getFile()).text()}}}function be(e,o){return{type:"directory",name:e.name,path:o,get[Symbol.asyncIterator](){return()=>Ge(e,o)}}}async function*Ge(e,o){for await(let s of Ue(e)){let n=z.default.join(o,s.name);s.kind==="file"?yield ue(s,n):s.kind==="directory"&&(yield be(s,n))}}var ge=(e,o)=>e.name>=o.name?1:-1;async function*Ue(e){let o=[],s=[];for await(let n of e.values())n.kind==="file"?o.push(n):n.kind==="directory"&&s.push(n);s.sort(ge),o.sort(ge),yield*s,yield*o}function ye(e,o){try{return JSON.parse(o)}catch(s){throw new Error(`parsing ${e}`,{cause:s})}}async function E(e){let o=await fetch(e);if(!o.ok)throw new Error(`"HTTP ${o.status}: ${o.statusText}" while fetching ${e.href}`);return o.text()}function ke({analyzeModule:e,resolveRequest:o}){return async s=>{let n=new Map,i=new Map;s=Array.isArray(s)?s:[s];for(let r of s)i.set(r,we(r,e,o,n,i));for(;i.size;){let[r,c]=await Promise.race(i.values());i.delete(r),n.set(r,c)}return n}}async function we(e,o,s,n,i){let{compiledContents:r,requests:c}=await o(e),t=new Map;for(let a of c){if(t.has(a))continue;let l=await s(e,a);t.set(a,l),typeof l=="string"&&!n.has(l)&&!i.has(l)&&i.set(l,we(l,o,s,n,i))}return[e,{compiledContents:r,resolvedRequests:t}]}var K=q(P(),1);var je=q(P(),1);var Ke=q(P(),1);function*G(e){let o;for(;o!==e;)yield e,o=e,e=je.default.dirname(e)}var Ve=["node_modules"],Ze=[".js",".json"],Ye=["browser","import","require"],U=e=>e==="."||e===".."||e.startsWith("./")||e.startsWith("../"),Qe="package.json";function V(e){let{fs:{fileExists:o,directoryExists:s,readFile:n,realpath:i},packageRoots:r=Ve,extensions:c=Ze,conditions:t=Ye,resolvedPacakgesCache:a=new Map,alias:l={},fallback:g={}}=e,{dirname:p,join:d,resolve:v,isAbsolute:S}=K.default,W=new Set(t),I=W.has("browser"),Ce=W.has("import"),M=Xe(Te,a),Se=he(l),Pe=he(g);return ze;async function ze(f,m){let u=new Set;for await(let y of He(f,m,u)){if(y===!1)return{resolvedFile:y,visitedPaths:u};for await(let w of Fe(f,y,u)){if(u.add(w),!await o(w))continue;if(I){let h=await $(p(w));if(h){u.add(h.filePath);let _=h.browserMappings?.[w];if(_!==void 0)return _!==!1&&u.add(_),{resolvedFile:_,originalFilePath:w,visitedPaths:u}}}let j=await se(w);return u.add(j),{resolvedFile:j,visitedPaths:u}}}return{resolvedFile:void 0,visitedPaths:u}}async function*He(f,m,u){let y=Se(m),w=!1;if(y!==void 0&&(w=!0,yield y),!w&&I){let h=await $(f);if(h){u.add(h.filePath);let _=h.browserMappings?.[m];_!==void 0&&(w=!0,yield _)}}w||(yield m);let j=Pe(m);j!==void 0&&(yield j)}async function*Fe(f,m,u){if(U(m)||S(m)){let y=v(f,m);yield*F(y),yield*ee(y,u)}else yield*Le(f,m,u)}function*F(f){yield f;for(let m of c)yield f+m}function*X(f){yield*F(f),yield*F(d(f,"index"))}async function*ee(f,m){if(!await s(f))return;let u=await M(f);u!==void 0&&m.add(u.filePath);let y=u?.mainPath;y!==void 0?yield*X(d(f,y)):yield*F(d(f,"index"))}async function*Le(f,m,u){let[y,w]=so(m);if(!y.length||y.startsWith("@")&&!y.includes("/"))return;let j=await $(f);if(j!==void 0&&(u.add(j.filePath),j.name===y&&j.exports!==void 0)){yield*ne(j.directoryPath,j.exports,w,j.hasPatternExports);return}for(let h of qe(f)){if(!await s(h))continue;let _=d(h,y),A=await M(_);if(A!==void 0&&u.add(A.filePath),A?.exports!==void 0){yield*ne(_,A.exports,w,A.hasPatternExports);return}let L=d(h,m);yield*F(L),yield*ee(L,u)}}function*qe(f){for(let m of r)for(let u of G(f))yield d(u,m)}async function $(f){for(let m of G(f)){let u=await M(m);if(u)return u}}async function Te(f){let m=d(f,Qe),u=await De(m);if(typeof u!="object"||u===null)return;let y=Oe(u),{browser:w}=u,j;if(I&&typeof w=="object"&&w!==null){j=Object.create(null);for(let[A,L]of Object.entries(w)){let te=U(A)?await oe(d(f,A)):A;if(te&&L!==void 0){let ie=await Ie(f,L);ie!==void 0&&(j[te]=ie)}}}let[h,_]=no(u.exports);return{name:u.name,filePath:m,directoryPath:f,mainPath:y,browserMappings:j,exports:h,hasPatternExports:_}}async function Ie(f,m){if(m===!1)return m;if(typeof m=="string")return U(m)?oe(d(f,m)):m}async function oe(f){for(let m of X(f))if(await o(m))return se(m)}async function se(f){try{return await i(f)}catch{return f}}function Oe({main:f,browser:m,module:u}){return I&&typeof m=="string"?m:Ce&&typeof u=="string"?u:typeof f=="string"?f:void 0}async function De(f){try{return JSON.parse(await n(f,"utf8"))}catch{return}}function*ne(f,m,u,y){let w=m[u];if(w!==void 0)yield*N(f,w);else if(y){let j=to(m,u);j!==void 0&&(yield d(f,j))}}function*N(f,m){if(m!==null){if(typeof m=="string")yield d(f,m);else if(typeof m=="object")if(Array.isArray(m))for(let u of m)yield*N(f,u);else for(let[u,y]of Object.entries(m))(u==="default"||W.has(u))&&(yield*N(f,y))}}}function Xe(e,o=new Map){return s=>{if(o.has(s))return o.get(s);{let n=e(s);return o.set(s,n),n}}}function he(e){let o=new Map,s=!1;for(let[n,i]of Object.entries(e)){let r=n,c=i;n.endsWith("/*")&&(s=!0,r={prefix:n.slice(0,-1)},typeof i=="string"&&i.endsWith("/*")&&(c={prefix:i.slice(0,-1)})),o.set(r,c)}return s?n=>eo(o,n):n=>o.get(n)}function eo(e,o){for(let[s,n]of e){let i=typeof s;if(i==="string"){if(o===s)return n}else if(i==="object"){let{prefix:r}=s;if(o.startsWith(r)&&o.length>r.length)return typeof n=="object"?n.prefix+o.slice(r.length):n}}}var oo=Map;function Z(e,o=new oo){return(s,n)=>{let i=`${s}${K.default.delimiter}${n}`,r=o.get(i);if(r)return r;{let c=e(s,n);return o.set(i,c),c}}}function Y(e){return{fileExists:e.fileExists,directoryExists:e.directoryExists,realpath(o){return Promise.resolve(o)},readFile(o){return e.readTextFile(o)}}}function so(e){let o=e.indexOf("/");if(o===-1)return[e,"."];if(e.startsWith("@")){let n=e.indexOf("/",o+1);return n===-1?[e,"."]:[e.slice(0,n),"."+e.slice(n)]}else return[e.slice(0,o),"."+e.slice(o)]}function no(e){let o=!1;if(e==null)e=void 0;else if(typeof e=="string"||Array.isArray(e))e={".":e};else for(let s of Object.keys(e))if(s.includes("*")&&(o=!0),s!=="."&&!s.startsWith("./")){e={".":e},o=!1;break}return[e,o]}function to(e,o){let s;for(let[n,i]of Object.entries(e)){let r=n.indexOf("*");if(r===-1||n.indexOf("*",r+1)!==-1)continue;let c=n.slice(0,r);if(!o.startsWith(c))continue;let t=n.slice(r+1);if(!(t&&!o.endsWith(t))){if(i===null)return;if(s===void 0&&typeof i=="string"){let a=o.slice(c.length,o.length-t.length),l=i.indexOf("*");if(l===-1||i.indexOf("*",l+1)!==-1)continue;let g=i.slice(0,l),p=i.slice(l+1);s=g+a+p}}}return s}function _e({api:e,dispatchResponse:o}){async function s({id:n,methodName:i,args:r,type:c}){if(c!=="call"||typeof i!="string")return;let t=e[i];if(typeof t!="function")o({type:"response",id:n,methodName:i,error:new Error(`${i} is not a function. typeof returned ${typeof t}`)});else try{let a=await t.apply(e,r);o({type:"response",id:n,methodName:i,returnValue:a})}catch(a){o({type:"response",id:n,methodName:i,error:a})}}return{onCall:s}}function ve({dispatchCall:e,signal:o}){let s=new Map,n=new Map,i=0;function r({type:a,id:l,returnValue:g,error:p}){if(a!=="response")return;let d=n.get(l);d&&(n.delete(l),p!==void 0?d.reject(p):d.resolve(g))}let c=new Proxy({},{get(a,l){if(typeof l!="string")throw new Error(`cannot get a remote non-string field: ${String(l)}`);let g=s.get(l);if(g)return g;let p=(...d)=>{if(o?.aborted)throw new Error(`${l} was called after dispatcher was aborted`);let v=i++,S=io();return n.set(v,S),e({id:v,type:"call",methodName:l,args:d}),S.promise};return s.set(l,p),p}}),t=()=>{s.clear(),n.clear()};return o?.addEventListener("abort",t,{once:!0}),{api:c,onResponse:r}}function io(){let e,o;return{promise:new Promise((n,i)=>{e=n,o=i}),resolve:e,reject:o}}function xe(e,o){let s=new AbortController,n=new Worker(e,o),{api:i,onResponse:r}=ve({dispatchCall:c=>n.postMessage(c),signal:s.signal});return n.addEventListener("message",c=>r(c.data),{signal:s.signal}),{api:i,close(){s.abort(),n.terminate()}}}var Re={extensions:[".ts",".tsx",".js",".jsx",".mjs",".cjs",".json"],alias:{"@babel/runtime/helpers/esm/*":"@babel/runtime/helpers/*",tslib:"tslib/tslib.js"},fallback:{"react-dom/client":!1}},{onCall:ro}=_e({api:{resolveSpecifier:ao,calculateModuleGraph:lo,initialize:co},dispatchResponse:e=>globalThis.postMessage(e)});globalThis.addEventListener("message",e=>ro(e.data));var H=[];async function co(e,o){let s=Q("typescript",o.typescript,"lib/typescript.js"),n=Q("sass",o.sass,"sass.dart.js"),i=Q("immutable",o.immutable,"dist/immutable.js"),[r,c,t]=await Promise.all([E(n),E(i),E(s)]),a=new URL(de,import.meta.url),l={rootDirectory:e,immutableLibText:c,immutableURL:i.href,sassLibText:r,sassURL:n.href,typescriptLibText:t,typescriptURL:s.href},g=Math.min(navigator.hardwareConcurrency??fe,12);for(let p=0;p<g;p++){let d=xe(a,{name:`${pe} ${p+1}`,type:"module"});H.push(d)}await Promise.all(H.map(p=>p.api.initialize(l)))}async function ao(e,o,s){let n=J(e),i=Z(V({fs:Y(n),...Re})),{resolvedFile:r}=await i(o,s);return r}async function lo(e,o){if(!H.length)throw new Error("compilation workers are not initialized");let i=J(e,new Map,new Map),r=Z(V({fs:Y(i),...Re}));await Promise.all(H.map(a=>a.api.clearCache()));let c=0;return ke({analyzeModule(a){let l=H[c];return c++,c%=H.length,l.api.analyzeModule(a)},async resolveRequest(a,l){let g=Ae.default.dirname(a),{resolvedFile:p}=await r(g,l);return p}})(o)}function Q(e,o,s){return new URL(`${e}@${o}/${s}`,me)}