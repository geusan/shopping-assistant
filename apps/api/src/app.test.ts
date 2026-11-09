import { describe,it,expect } from 'vitest';
import { createApi } from './app';
import { OpenAiProvider } from './provider';
import { FixtureProvider } from '../../../tests/fixtures/provider';
import { fixtureProduct,fixtureSession } from '../../../tests/fixtures/products';
const token='a'.repeat(64),origin='http://localhost:5173';
function setup(provider=new FixtureProvider(),rateLimit=100){return createApi({provider,token,webOrigins:[origin],apiOrigin:'http://localhost:4317',configured:true,model:'test',rateLimit});}
const headers={'Content-Type':'application/json','X-Fits-Token':token,Origin:origin};
describe('local API boundaries',()=>{
  it('requires pairing on model requests',async()=>{const r=await setup().request('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});expect(r.status).toBe(401);});
  it('rejects cross-site callers even when a request includes a token',async()=>{const r=await setup().request('/api/chat',{method:'POST',headers:{...headers,Origin:'https://example.com'},body:'{}'});expect(r.status).toBe(403);});
  it('does not hand a new token to an unpaired extension',async()=>{const r=await setup().request('/api/config',{headers:{Origin:`chrome-extension://${'a'.repeat(32)}`}});expect(r.status).toBe(403);});
  it('rejects more than four criteria',async()=>{const r=await setup().request('/api/analyze',{method:'POST',headers,body:JSON.stringify({session:{...fixtureSession,criteria:[...fixtureSession.criteria,fixtureSession.criteria[0]]},product:fixtureProduct()})});expect(r.status).toBe(400);});
  it('rejects page URLs outside the selected store',async()=>{const r=await setup().request('/api/analyze',{method:'POST',headers,body:JSON.stringify({session:fixtureSession,product:{...fixtureProduct(),url:'https://example.com/product'}})});expect(r.status).toBe(400);});
  it('returns an evidence-based result with computed score',async()=>{const r=await setup().request('/api/analyze',{method:'POST',headers,body:JSON.stringify({session:fixtureSession,product:fixtureProduct()})});expect(r.status).toBe(200);const data=await r.json();expect(data.score).toBe(100);expect(data.findings).toHaveLength(4);});
  it('reports a missing API key without fabricating a conversation',async()=>{const app=createApi({provider:new OpenAiProvider(undefined,'gpt-4.1-mini'),token,webOrigins:[origin],apiOrigin:'http://localhost:4317',configured:false,model:'gpt-4.1-mini'});const r=await app.request('/api/chat',{method:'POST',headers,body:JSON.stringify({messages:[{role:'user',content:'headphones'}],preferences:fixtureSession.preferences,currentCriteria:[]})});expect(r.status).toBe(503);expect((await r.json()).error.code).toBe('AI_NOT_CONFIGURED');});
  it('rate limits repeated model requests',async()=>{const app=setup(undefined,1);const body=JSON.stringify({messages:[{role:'user',content:'headphones'}],preferences:fixtureSession.preferences,currentCriteria:[]});expect((await app.request('/api/chat',{method:'POST',headers,body})).status).toBe(200);expect((await app.request('/api/chat',{method:'POST',headers,body})).status).toBe(429);});
});
