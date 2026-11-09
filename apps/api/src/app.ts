import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { timingSafeEqual } from 'node:crypto';
import { AnalyzeRequestSchema, ChatRequestSchema, identifyStore, makeAnalysis } from '@fits/core';
import { publicError, ServiceError, type AiProvider } from './provider';

export type ApiOptions = { provider: AiProvider; token: string; webOrigins: string[]; apiOrigin: string; configured: boolean; model: string; extensionStoreUrl?: string; rateLimit?: number };
export function createApi(options: ApiOptions) {
  const app=new Hono();
  const allowed=(origin:string)=>options.webOrigins.includes(origin)||/^chrome-extension:\/\/[a-p]{32}$/.test(origin);
  app.use('/api/*',cors({origin:(origin)=>allowed(origin)?origin:undefined,allowMethods:['GET','POST','OPTIONS'],allowHeaders:['Content-Type','X-Fits-Token'],maxAge:600}));
  app.use('/api/*',bodyLimit({maxSize:150_000,onError:c=>c.json({error:{code:'REQUEST_TOO_LARGE',message:'This page or conversation is too large to analyze.',retryable:false}},413)}));
  app.use('/api/*',async(c,next)=>{
    const origin=c.req.header('Origin');
    if(origin&&!allowed(origin)) return c.json({error:{code:'ORIGIN_NOT_ALLOWED',message:'This application is not allowed to access fits.',retryable:false}},403);
    c.header('Cache-Control','no-store');c.header('X-Content-Type-Options','nosniff');
    await next();
  });
  app.get('/api/health',c=>c.json({ok:true,aiConfigured:options.configured}));
  app.get('/api/config',c=>{
    const origin=c.req.header('Origin');
    if(origin?.startsWith('chrome-extension://')) return c.json({error:{code:'PAIR_IN_WEB',message:'Connect through the fits website first.',retryable:false}},403);
    return c.json({apiReady:options.configured,model:options.model,extensionStoreUrl:options.extensionStoreUrl||null,bridgeToken:options.token,apiOrigin:options.apiOrigin});
  });
  let windowStart=Date.now(), count=0;
  app.use('/api/*',async(c,next)=>{
    if(c.req.method!=='POST') return next();
    const supplied=c.req.header('X-Fits-Token')||'';
    const a=Buffer.from(supplied),b=Buffer.from(options.token);
    if(a.length!==b.length||!timingSafeEqual(a,b)) return c.json({error:{code:'NOT_PAIRED',message:'Open fits and connect the extension again.',retryable:false}},401);
    if(!c.req.header('Content-Type')?.includes('application/json')) return c.json({error:{code:'INVALID_CONTENT_TYPE',message:'A JSON request is required.',retryable:false}},415);
    if(Date.now()-windowStart>60_000){windowStart=Date.now();count=0;}
    if(++count>(options.rateLimit??30)){c.header('Retry-After','60');return c.json({error:{code:'RATE_LIMIT',message:'Too many requests. Please wait a minute and try again.',retryable:true}},429);}
    await next();
  });
  app.post('/api/chat',async c=>{
    const parsed=ChatRequestSchema.safeParse(await c.req.json().catch(()=>null));
    if(!parsed.success||parsed.data.messages.reduce((n,m)=>n+m.content.length,0)>24000) throw new ServiceError('INVALID_REQUEST','Please keep the conversation shorter and use no more than four criteria.',400);
    const answer=await options.provider.chat(parsed.data,c.req.raw.signal);
    return c.json(answer);
  });
  app.post('/api/analyze',async c=>{
    const parsed=AnalyzeRequestSchema.safeParse(await c.req.json().catch(()=>null));
    if(!parsed.success) throw new ServiceError('INVALID_REQUEST','The product information is incomplete. Refresh the page and try again.',400);
    const {session,product}=parsed.data;
    if(identifyStore(product.url)!==product.store||identifyStore(product.canonicalUrl)!==product.store) throw new ServiceError('UNSUPPORTED_STORE','This store is not supported yet.',400);
    if(new Set(session.criteria.map(x=>x.id)).size!==session.criteria.length) throw new ServiceError('INVALID_CRITERIA','The shopping criteria must have unique identifiers.',400);
    return c.json(makeAnalysis(session,product,await options.provider.analyze(parsed.data,c.req.raw.signal)));
  });
  app.onError((error,c)=>{const safe=publicError(error);return c.json({error:{code:safe.code,message:safe.message,retryable:safe.retryable}},safe.status as 400);});
  return app;
}
