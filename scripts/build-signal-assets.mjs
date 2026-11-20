import {copyFile} from 'node:fs/promises';
import {build} from 'vite';
import {fileURLToPath} from 'node:url';
await build({configFile:false,publicDir:false,build:{lib:{entry:{'code-highlight':fileURLToPath(new URL('../src/code-highlight.js',import.meta.url)),'invoker-polyfill':fileURLToPath(new URL('../src/signal-invoker-fallback.js',import.meta.url)),'focusgroup-polyfill':fileURLToPath(new URL('../src/code-focusgroup-fallback.js',import.meta.url))},formats:['es'],fileName:(_,name)=>`${name}.js`},outDir:'public/scripts/vendor',emptyOutDir:false,minify:true,copyPublicDir:false}});

await copyFile(new URL('../node_modules/highlight.js/LICENSE',import.meta.url),new URL('../public/scripts/vendor/highlightjs-LICENSE.txt',import.meta.url));
