import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
const run=(args)=>spawn('pnpm',args,{stdio:'inherit',env:process.env});
if(!existsSync('dist/extension/manifest.json'))await new Promise((resolve,reject)=>{const p=run(['build:extension']);p.on('exit',code=>code===0?resolve():reject(new Error('Extension build failed')));});
const children=[run(['dev:api']),run(['dev:web'])];
let stopping=false;
const stop=()=>{if(stopping)return;stopping=true;for(const p of children)p.kill('SIGTERM');};
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
for(const child of children)child.on('exit',code=>{if(!stopping){stop();process.exitCode=code||0;}});
