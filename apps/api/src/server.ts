import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApi } from './app';
import { OpenAiProvider } from './provider';

const port=Number(process.env.API_PORT||4317);
const webOrigin=process.env.WEB_ORIGIN||'http://localhost:5173';
const model=process.env.OPENAI_MODEL||'gpt-4.1-mini';
let provider=new OpenAiProvider(process.env.OPENAI_API_KEY,model);
let configured=Boolean(process.env.OPENAI_API_KEY?.trim());
// Only the dedicated test process can load the deterministic fixture provider.
if(process.env.NODE_ENV==='test'&&process.env.FITS_TEST_MODE==='1') {
  const { FixtureProvider }=await import('../../../tests/fixtures/provider');
  provider=new FixtureProvider() as unknown as OpenAiProvider;configured=true;
}
const app=createApi({provider,token:randomBytes(32).toString('hex'),webOrigins:[webOrigin,webOrigin.replace('localhost','127.0.0.1')],apiOrigin:`http://localhost:${port}`,configured,model,extensionStoreUrl:process.env.EXTENSION_STORE_URL});
app.use('*',serveStatic({root:'./dist/web'}));
app.get('*',serveStatic({path:'./dist/web/index.html'}));
const server=serve({fetch:app.fetch,port,hostname:'127.0.0.1'},()=>console.log(`fits API: http://localhost:${port} (${configured?'AI configured':'OPENAI_API_KEY not configured'})`));
for(const signal of ['SIGTERM','SIGINT'] as const) process.on(signal,()=>server.close(()=>process.exit(0)));
