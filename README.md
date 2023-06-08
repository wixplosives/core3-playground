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
- added plugin for css modules
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
- helper to create web workers that use this to communicate
