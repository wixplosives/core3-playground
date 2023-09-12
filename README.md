# core3-playground

code playground, client-only, web application

## react

- v18
- strict mode
- new jsx create element
- naive dumb components

## esbuild

- super fast- less than 1s for development or production builds
- custom build script under `scripts/build.js`
- separate building of external vendors
- injects full reload upon change script to html in dev mode
- auto opens chrome in dev mode

## monaco-editor

- all built-in basic languages activated (syntax highlighting)
- activated full language service for:
  - css, scss, less
  - html, handlebars, razor
  - json, with fetching of schema-store's catalog
- lazily loaded upon first usage
- no errors/warnings about the web worker
- auto-detects language (via usage of model)

## rpc

- isolated, tiny implementation of fully-typed, proxy-based rpc
- helpers to create web workers or iframes that use this to communicate

## code execution

- supports execution of ts/js files within project
- supports preview of Codux boards
- compilation worker supports:
  - typescript
  - javascript
  - css (+modules)
  - sass (+modules)
  - raw assets
- uses custom in-browser commonjs module system to evaluate code in a sandboxed iframe
- uses project's versions of typescript/sass
- loads sourcemaps, inlines sources into them, and inlines them to evaluated code
- evaluated files can be seen in devtools under `iframe` -> `project://<file-path>`
- caches compiled modules from `node_modules` packages to indexeddb

# license

MIT
