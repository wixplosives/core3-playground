var Te=Object.create;var V=Object.defineProperty;var Oe=Object.getOwnPropertyDescriptor;var qe=Object.getOwnPropertyNames;var Ce=Object.getPrototypeOf,Le=Object.prototype.hasOwnProperty;var h=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var Fe=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of qe(t))!Le.call(e,o)&&o!==n&&V(e,o,{get:()=>t[o],enumerable:!(r=Oe(t,o))||r.enumerable});return e};var Ee=(e,t,n)=>(n=e!=null?Te(Ce(e)):{},Fe(t||!e||!e.__esModule?V(n,"default",{value:e,enumerable:!0}):n,e));var Y=h(O=>{"use strict";Object.defineProperty(O,"__esModule",{value:!0});O.envGlobal=void 0;O.envGlobal=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:void 0});var E=h((exports,module)=>{"use strict";Object.defineProperty(exports,"__esModule",{value:!0});exports.createBaseCjsModuleSystem=void 0;var global_this_js_1=Y(),falseModule={get exports(){return{}},filename:"",id:"",children:[]};function createBaseCjsModuleSystem(options){let{resolveFrom,dirname,readFileSync,globals={},loadModuleHook}=options,requireCache=new Map,load=loadModuleHook?loadModuleHook(loadModule):loadModule;return{requireModule(e){var t;return e===!1?{}:((t=requireCache.get(e))!==null&&t!==void 0?t:load(e)).exports},requireFrom(e,t){return loadFrom(e,t).exports},resolveFrom,requireCache,globals};function resolveThrow(e,t,n){let r=resolveFrom(e,t,n);if(r===void 0)throw new Error(`Cannot resolve "${t}" in ${n||e}`);return r}function loadFrom(e,t,n){var r;let o=requireCache.get(t);if(o)return o;let a=resolveThrow(e,t,n);return a===!1?falseModule:(r=requireCache.get(a))!==null&&r!==void 0?r:load(a)}function loadModule(filePath){let newModule={exports:{},filename:filePath,id:filePath,children:[]},contextPath=dirname(filePath),fileContents=readFileSync(filePath);if(filePath.endsWith(".json"))return newModule.exports=JSON.parse(fileContents),requireCache.set(filePath,newModule),newModule;let localRequire=e=>{let t=loadFrom(contextPath,e,filePath);return t!==falseModule&&!newModule.children.includes(t)&&newModule.children.push(t),t.exports};localRequire.resolve=e=>resolveThrow(contextPath,e,filePath);let moduleBuiltins={module:newModule,exports:newModule.exports,__filename:filePath,__dirname:contextPath,require:localRequire},injectedGlobals={global:global_this_js_1.envGlobal,...globals},fnArgs=Object.keys(moduleBuiltins).join(", "),globalsArgs=Object.keys(injectedGlobals).join(", "),moduleSource=`${fileContents}
//# sourceURL=${filePath}
`,globalFn=eval(`(function (${globalsArgs}){ return (function (${fnArgs}){${moduleSource}}); })`);requireCache.set(filePath,newModule);try{globalFn(...Object.values(injectedGlobals))(...Object.values(moduleBuiltins))}catch(e){throw requireCache.delete(filePath),e instanceof Error&&!e.filePath&&(e.filePath=filePath),e}return newModule}}exports.createBaseCjsModuleSystem=createBaseCjsModuleSystem});var Z=h(q=>{"use strict";Object.defineProperty(q,"__esModule",{value:!0});q.createDependencyResolver=void 0;var{hasOwnProperty:Ie}=Object.prototype;function De({extractRequests:e,resolveRequest:t}){return(n,r)=>{let o=Object.create(null),a=Array.isArray(n)?[...n]:[n];for(;a.length>0;){let c=a.shift();if(o[c])continue;let f=Object.create(null);o[c]=f;let p=e(c);for(let P of p){if(Ie.call(f,P))continue;let m=t(c,P);f[P]=m,r&&m!==void 0&&m!==!1&&a.push(m)}}return o}}q.createDependencyResolver=De});var ee=h(S=>{"use strict";Object.defineProperty(S,"__esModule",{value:!0});S.createRequestRemapper=S.createRequestResolver=void 0;var We="browser",Ge=["node_modules"],He=[".js",".json"],A=e=>e==="."||e===".."||e.startsWith("./")||e.startsWith("../"),ze="package.json",Ke={throwIfNoEntry:!1};function Ne(e){let{fs:{statSync:t,readFileSync:n,realpathSync:r,dirname:o,join:a,resolve:c,isAbsolute:f},packageRoots:p=Ge,extensions:P=He,target:m=We,moduleField:ye=m==="browser",resolvedPacakgesCache:ge=new Map,alias:me={},fallback:he={}}=e,D=Ve(_e,ge),ve=$(me),be=$(he);return Me;function Me(i,s){var l,d;let u=new Set;for(let y of we(i,s,u)){if(y===!1)return{resolvedFile:y,visitedPaths:u};for(let g of Pe(i,y,u)){if(u.add(g),!(!((l=k(g))===null||l===void 0)&&l.isFile()))continue;if(m==="browser"){let M=H(o(g));if(M){u.add(M.filePath);let R=(d=M.browserMappings)===null||d===void 0?void 0:d[g];if(R!==void 0)return R!==!1&&u.add(R),{resolvedFile:R,originalFilePath:g,visitedPaths:u}}}let b=K(g);return u.add(b),{resolvedFile:b,visitedPaths:u}}}return{resolvedFile:void 0,visitedPaths:u}}function*we(i,s,l){var d;let u=ve(s),y=!1;if(u!==void 0&&(y=!0,yield u),!y&&m==="browser"){let b=H(i);if(b){l.add(b.filePath);let M=(d=b.browserMappings)===null||d===void 0?void 0:d[s];M!==void 0&&(y=!0,yield M)}}y||(yield s);let g=be(s);g!==void 0&&(yield g)}function*Pe(i,s,l){if(A(s)||f(s)){let d=c(i,s);yield*j(d),yield*G(d,l)}else yield*Re(i,s,l)}function*j(i){yield i;for(let s of P)yield i+s}function*W(i){yield*j(i),yield*j(a(i,"index"))}function*G(i,s){var l;if(!(!((l=k(i))===null||l===void 0)&&l.isDirectory()))return;let d=D(i);d!==void 0&&s.add(d.filePath);let u=d?.mainPath;u!==void 0?yield*W(a(i,u)):yield*j(a(i,"index"))}function*Re(i,s,l){var d;for(let u of Se(i)){if(!(!((d=k(u))===null||d===void 0)&&d.isDirectory()))continue;let y=a(u,s);yield*j(y),yield*G(y,l)}}function*Se(i){for(let s of p)for(let l of N(i))yield a(l,s)}function H(i){for(let s of N(i)){let l=D(s);if(l)return l}}function _e(i){let s=a(i,ze),l=ke(s);if(typeof l!="object"||l===null)return;let d=je(l),{browser:u}=l,y;if(m==="browser"&&typeof u=="object"&&u!==null){y=Object.create(null);for(let[g,b]of Object.entries(u)){let M=A(g)?z(a(i,g)):g;if(M&&b!==void 0){let R=xe(i,b);R!==void 0&&(y[M]=R)}}}return{filePath:s,directoryPath:i,mainPath:d,browserMappings:y}}function xe(i,s){if(s===!1)return s;if(typeof s=="string")return A(s)?z(a(i,s)):s}function z(i){var s;for(let l of W(i))if(!((s=k(l))===null||s===void 0)&&s.isFile())return K(l)}function k(i){let{stackTraceLimit:s}=Error;try{return Error.stackTraceLimit=0,t(i,Ke)}catch{return}finally{Error.stackTraceLimit=s}}function K(i){let{stackTraceLimit:s}=Error;try{return Error.stackTraceLimit=0,r(i)}catch{return i}finally{Error.stackTraceLimit=s}}function je({main:i,browser:s,module:l}){if(m==="browser"){if(typeof s=="string")return s;if(ye&&typeof l=="string")return l}return typeof i=="string"?i:void 0}function*N(i){let s;for(;s!==i;)yield i,s=i,i=o(i)}function ke(i){let{stackTraceLimit:s}=Error;try{return Error.stackTraceLimit=0,JSON.parse(n(i,"utf8"))}catch{return}finally{Error.stackTraceLimit=s}}}S.createRequestResolver=Ne;function Ve(e,t=new Map){return n=>{if(t.has(n))return t.get(n);{let r=e(n);return t.set(n,r),r}}}function $(e){let t=new Map,n=!1;for(let[r,o]of Object.entries(e)){let a=r,c=o;r.endsWith("/*")&&(n=!0,a={prefix:r.slice(0,-1)},typeof o=="string"&&o.endsWith("/*")&&(c={prefix:o.slice(0,-1)})),t.set(a,c)}return n?r=>Xe(t,r):r=>t.get(r)}S.createRequestRemapper=$;function Xe(e,t){for(let[n,r]of e){let o=typeof n;if(o==="string"){if(t===n)return r}else if(o==="object"){let{prefix:a}=n;if(t.startsWith(a)&&t.length>a.length)return typeof r=="object"?r.prefix+t.slice(a.length):r}}}});var ne=h(te=>{"use strict";Object.defineProperty(te,"__esModule",{value:!0})});var re=h(w=>{"use strict";var Qe=w&&w.__createBinding||(Object.create?function(e,t,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(t,n);(!o||("get"in o?!t.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,r,o)}:function(e,t,n,r){r===void 0&&(r=n),e[r]=t[n]}),J=w&&w.__exportStar||function(e,t){for(var n in e)n!=="default"&&!Object.prototype.hasOwnProperty.call(t,n)&&Qe(t,e,n)};Object.defineProperty(w,"__esModule",{value:!0});J(Z(),w);J(ee(),w);J(ne(),w)});var oe=h(C=>{"use strict";Object.defineProperty(C,"__esModule",{value:!0});C.createCjsModuleSystem=void 0;var Ye=re(),Ze=E();function et(e){let{fs:t,globals:n}=e,{dirname:r,readFileSync:o}=t,{resolver:a=(0,Ye.createRequestResolver)({fs:t}),loadModuleHook:c}=e;return(0,Ze.createBaseCjsModuleSystem)({resolveFrom:(f,p,P)=>a(f,p,P).resolvedFile,readFileSync:f=>o(f,"utf8"),dirname:r,globals:n,loadModuleHook:c})}C.createCjsModuleSystem=et});var se=h(ie=>{"use strict";Object.defineProperty(ie,"__esModule",{value:!0})});var ae=h(_=>{"use strict";Object.defineProperty(_,"__esModule",{value:!0});_.getModulesTree=_.invalidateModule=void 0;var tt=(e,t)=>{for(let{filename:n}of U(e,t))t.delete(n)};_.invalidateModule=tt;function*U(e,t,n=new Set){if(n.has(e))return;n.add(e);let r=t.get(e);if(r){yield r;for(let[o,a]of t)a.children.includes(r)&&(yield*U(o,t,n))}}_.getModulesTree=U});var le=h(v=>{"use strict";var nt=v&&v.__createBinding||(Object.create?function(e,t,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(t,n);(!o||("get"in o?!t.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,r,o)}:function(e,t,n,r){r===void 0&&(r=n),e[r]=t[n]}),L=v&&v.__exportStar||function(e,t){for(var n in e)n!=="default"&&!Object.prototype.hasOwnProperty.call(t,n)&&nt(t,e,n)};Object.defineProperty(v,"__esModule",{value:!0});L(E(),v);L(oe(),v);L(se(),v);L(ae(),v)});var X="//# sourceMappingURL=",Ae="project://";function Q({transpileModule:e},t,n,r){let{outputText:o,sourceMapText:a}=e(n,{compilerOptions:r,fileName:t});if(a){let c=JSON.parse(a),f=Ae+t,p=Ue(c)?Je(c,f):c;return $e(p,o)}return o}function $e(e,t){let n=t.lastIndexOf(X);if(n!==-1){let r=Be(JSON.stringify(e));return t.slice(0,n+X.length)+r}return t}function Je(e,t){let n={...e};return n.sources=[t],n}function Ue({sources:e}){return Array.isArray(e)&&e.length===1&&typeof e[0]=="string"}function Be(e,t="application/json"){return`data:${t};base64,${btoa(e)}`}async function T(e){let t=await fetch(e);if(!t.ok)throw new Error(`"HTTP ${t.status}: ${t.statusText}" while fetching ${e.href}`);return t.text()}var F=e=>console.log(e);var ce=Ee(le(),1);function ue(e,t,n,r){let a=B("immutable",r,n).requireModule(r),c=B("sass",e,t);c.requireCache.set("util",{id:"util",filename:"util",exports:{inspect:{}},children:[]}),c.requireCache.set("fs",{id:"fs",filename:"fs",exports:{},children:[]}),c.requireCache.set("immutable",{id:"immutable",filename:"immutable",exports:a,children:[]});let f=c.requireModule(e),p={};return f.load({util:{inspect:{}},immutable:a},p),"info"in p?p:f}function de(e,t){return B("typescript",e,t).requireModule(e)}var fe=e=>e.replace(`
//# sourceMappingURL=typescript.js.map`,"").replace("const etwModulePath =","// const etwModulePath =").replace("var etwModulePath =","// var etwModulePath =").replace("require(etwModulePath);","void 0");function B(e,t,n){return(0,ce.createBaseCjsModuleSystem)({dirname(r){if(r===t)return"/";throw new Error(`Unexpected path "${r}" passed to dirname during ${e} evaluation`)},readFileSync(r){if(r===t)return n;throw new Error(`Unexpected file path "${r}" during ${e} evaluation`)},resolveFrom(r,o){throw new Error(`Unexpected request "${o}" during ${e} evaluation`)}})}function pe({api:e,dispatchResponse:t}){async function n({id:r,methodName:o,args:a,type:c}){if(c!=="call"||typeof o!="string")return;let f=e[o];if(typeof f!="function")t({type:"response",id:r,methodName:o,error:new Error(`${o} is not a function. typeof returned ${typeof f}`)});else try{let p=await f.apply(e,a);t({type:"response",id:r,methodName:o,returnValue:p})}catch(p){t({type:"response",id:r,methodName:o,error:p})}}return{onCall:n}}var rt=new URL("https://static.parastorage.com/unpkg/"),{onCall:ot}=pe({api:{compile:st,initialize:it},dispatchResponse:e=>globalThis.postMessage(e)});globalThis.addEventListener("message",e=>ot(e.data));var x;async function it(e){let t=I("typescript",e.typescript,"lib/typescript.js"),n=I("sass",e.sass,"sass.dart.js"),r=I("immutable",e.immutable,"dist/immutable.js"),[o,a,c]=await Promise.all([T(n),T(r),T(t)]);x=de(t.href,fe(c));let f=ue(n.href,o,a,r.href);F(x.version),F(f.info)}function st(e,t){if(x===void 0)throw new Error("typescript was not yet initialized");let n={module:x.ModuleKind.CommonJS,jsx:x.JsxEmit.ReactJSXDev,sourceMap:!0,inlineSources:!0};return Q(x,e,t,n)}function I(e,t,n){return new URL(`${e}@${t}/${n}`,rt)}