import { build } from 'esbuild';
await build({entryPoints:['apps/api/src/server.ts'],outfile:'dist/api/server.mjs',bundle:true,platform:'node',format:'esm',packages:'external',sourcemap:true});
