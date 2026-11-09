// Run against the local API. This makes three real, billable OpenAI requests.
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { ChatReplySchema,AnalysisRecordSchema } from '../packages/core/src/contracts';
import { fixtureProduct } from '../tests/fixtures/products';

const origin='http://localhost:4317';
const config=await fetch(`${origin}/api/config`).then(r=>r.json());
assert.equal(config.apiReady,true,'OpenAI key is not configured on the server.');
async function post(path:string,body:unknown){const r=await fetch(`${origin}${path}`,{method:'POST',headers:{'Content-Type':'application/json','X-Fits-Token':config.bridgeToken},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error?.message||`Request failed (${r.status})`);return data;}
const prompt='I need wireless headphones for my subway commute. My final four criteria are: mandatory active noise cancellation; mandatory product price at most USD 150; optional weight at most 250 g; optional battery life at least 30 hours. Shipping and taxes do not matter. Please prepare exactly these four criteria now with these priorities.';
const started=Date.now();
const chat=ChatReplySchema.parse(await post('/api/chat',{messages:[{role:'user',content:prompt}],preferences:{currency:'USD',destination:'KR'},currentCriteria:[]}));
assert.equal(chat.state,'ready');assert.equal(chat.criteria.length,4);assert.equal(chat.criteria.filter(c=>c.priority==='mandatory').length,2);assert.equal(chat.criteria.filter(c=>c.kind==='budget').length,1);assert.ok(chat.title&&chat.searchQuery);
const session={id:'live-smoke-session-0001',title:chat.title,searchQuery:chat.searchQuery,criteria:chat.criteria,preferences:{currency:'USD',destination:'KR'},updatedAt:Date.now()};
const complete=AnalysisRecordSchema.parse(await post('/api/analyze',{session,product:fixtureProduct()}));
const missingOptional=fixtureProduct(false);missingOptional.evidence=missingOptional.evidence.replace('Battery life: 40 hours','Battery life not listed');
const unknown=AnalysisRecordSchema.parse(await post('/api/analyze',{session,product:missingOptional}));
await mkdir('artifacts/live',{recursive:true});
await writeFile('artifacts/live/last-responses.json',JSON.stringify({chat,complete,missingOptional:unknown},null,2));
console.log(JSON.stringify({criteria:chat.criteria.map(c=>({id:c.id,kind:c.kind,target:c.target,unit:c.unit,priority:c.priority})),complete:complete.findings.map(f=>({id:f.criterionId,status:f.status,reason:f.reason})),missingOptionalScore:unknown.score}));
assert.equal(complete.score,100,'All four explicitly evidenced criteria should match.');
assert.equal(unknown.score,83,'A missing optional criterion is one of six weighted points.');
assert.equal(complete.findings.find(f=>f.criterionId===chat.criteria.find(c=>c.kind==='budget')!.id)?.observed,'USD 129.00');
assert.equal(unknown.findings.filter(f=>f.status==='unknown').length,1);
const report={verifiedAt:new Date().toISOString(),provider:'OpenAI',model:config.model,liveRequests:3,elapsedMs:Date.now()-started,chatState:chat.state,criteria:chat.criteria,productFitScore:complete.score,missingOptionalScore:unknown.score,scope:'Real OpenAI API with controlled product evidence, not a live marketplace crawl.'};
await mkdir('artifacts/live',{recursive:true});await writeFile('artifacts/live/openai-verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({liveOpenAI:'passed',model:config.model,criteriaCount:chat.criteria.length,productFitScore:complete.score,missingOptionalScore:unknown.score,elapsedMs:report.elapsedMs}));
