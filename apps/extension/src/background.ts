import { z } from 'zod';
import { AnalysisRecordSchema, ProductSnapshotSchema, ShoppingSessionSchema, StoreIdSchema, criteriaKey, storedSession, identifyStore, stableHash, storeSearchUrl, upsertHistory, type ProductSnapshot, type ExtensionState } from '@fits/core';
import { readState, updateState } from './storage';

const appOrigins=new Set([__FITS_APP_ORIGIN__,__FITS_APP_ORIGIN__.replace('localhost','127.0.0.1')]);
const pairSchema=z.object({session:ShoppingSessionSchema,store:StoreIdSchema,connection:z.object({token:z.string().regex(/^[a-f0-9]{64}$/),apiOrigin:z.literal(__FITS_API_ORIGIN__)})});
const pending=new Map<number,AbortController>();
function isAppSender(sender:chrome.runtime.MessageSender):boolean {try{return Boolean(sender.tab&&sender.url&&appOrigins.has(new URL(sender.url).origin));}catch{return false;}}
function isPanelSender(sender:chrome.runtime.MessageSender):boolean {return Boolean(sender.url?.startsWith(chrome.runtime.getURL('sidepanel.html')));}
function fingerprint(p:ProductSnapshot):string{return stableHash(JSON.stringify([p.canonicalUrl,p.variant,p.title,p.price]));}
async function configure(){await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true});await chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});}
chrome.runtime.onInstalled.addListener(()=>{void configure();void injectOpenAppTabs();});
chrome.runtime.onStartup.addListener(()=>{void configure();});
async function injectOpenAppTabs(){
  for(const tab of await chrome.tabs.query({}))if(tab.id&&tab.url){try{if(appOrigins.has(new URL(tab.url).origin))await chrome.scripting.executeScript({target:{tabId:tab.id},files:['bridge.js']});}catch{/* A tab may have closed. */}}
}
async function startShopping(payload:unknown,sender:chrome.runtime.MessageSender,open:Promise<void>):Promise<{ok:true;panelOpened:boolean}> {
  const input=pairSchema.parse(payload);
  for(const controller of pending.values())controller.abort();pending.clear();
  await updateState(s=>({...s,session:input.session,connection:input.connection,status:'waiting',current:null,product:null,error:null}));
  const panelOpened=await open.then(()=>true,()=>false);
  const tab=await chrome.tabs.create({url:storeSearchUrl(input.store,input.session.searchQuery),active:true});
  await updateState(s=>({...s,activeTabId:tab.id??null}));
  return{ok:true,panelOpened};
}
async function analyze(product:ProductSnapshot,tabId:number,force=false):Promise<void> {
  const state=await readState();if(!state.session||!state.connection)return;
  const key=criteriaKey(state.session);
  const cached=state.history.find(r=>r.scoringMethod==='priority-v2'&&r.session.id===state.session!.id&&r.criteriaKey===key&&r.product.canonicalUrl===product.canonicalUrl&&r.product.variant===product.variant&&fingerprint(r.product)===fingerprint(product)&&Date.now()-r.checkedAt<30*60_000);
  if(cached&&!force){await updateState(s=>({...s,activeTabId:tabId,status:'ready',product,current:cached,error:null}));return;}
  if(!force&&pending.has(tabId)&&state.status==='analyzing'&&state.activeTabId===tabId&&state.product&&fingerprint(state.product)===fingerprint(product))return;
  pending.get(tabId)?.abort();const controller=new AbortController();pending.set(tabId,controller);
  await updateState(s=>({...s,activeTabId:tabId,status:'analyzing',product,current:null,error:null}));
  const timer=setTimeout(()=>controller.abort(),40_000);
  try {
    const response=await fetch(`${state.connection.apiOrigin}/api/analyze`,{method:'POST',headers:{'Content-Type':'application/json','X-Fits-Token':state.connection.token},body:JSON.stringify({session:state.session,product}),signal:controller.signal});
    const body=await response.json();if(!response.ok)throw new Error(body?.error?.message||'The analysis service could not be reached.');
    const record=AnalysisRecordSchema.parse(body);
    if(pending.get(tabId)!==controller)return;
    await updateState(s=>{
      if(s.activeTabId!==tabId||!s.session||criteriaKey(s.session)!==key||s.product?.url!==product.url)return s;
      return{...s,status:'ready',product,current:record,error:null,history:upsertHistory(s.history,record)};
    });
  } catch(error) {
    if(pending.get(tabId)!==controller)return;
    const message=controller.signal.aborted?'The check took too long. Try again.':error instanceof TypeError?'Cannot reach the local fits server. Start the web service and reconnect from fits.':error instanceof Error?error.message:'The product could not be checked.';
    await updateState(s=>s.activeTabId===tabId?{...s,status:'error',error:message,current:null}:s);
  } finally {clearTimeout(timer);if(pending.get(tabId)===controller)pending.delete(tabId);}
}
async function capture(payload:unknown,sender:chrome.runtime.MessageSender):Promise<{ok:true}> {
  if(!sender.tab?.id||!sender.url||!identifyStore(sender.url))throw new Error('Unsupported page.');
  const tab=await chrome.tabs.get(sender.tab.id);if(!tab.active)return{ok:true};
  const data=z.object({url:z.string().url(),product:ProductSnapshotSchema.nullable(),force:z.boolean().optional()}).parse(payload);
  if(new URL(data.url).origin!==new URL(sender.url).origin)throw new Error('Page origin mismatch.');
  const state=await readState();if(!state.session)return{ok:true};
  if(!data.product){pending.get(tab.id!)?.abort();pending.delete(tab.id!);await updateState(s=>({...s,activeTabId:tab.id!,status:'waiting',product:null,current:null,error:null}));return{ok:true};}
  if(new URL(data.product.url).origin!==new URL(sender.url).origin||identifyStore(data.product.url)!==data.product.store)throw new Error('Product origin mismatch.');
  void analyze(data.product,tab.id!,data.force===true);return{ok:true};
}
async function panelAction(type:string,payload:unknown):Promise<unknown> {
  if(type==='STATE_GET')return{ok:true,state:await readState()};
  if(type==='ANALYZE_AGAIN'){
    const state=await readState();if(state.activeTabId)await chrome.tabs.sendMessage(state.activeTabId,{type:'FITS_CAPTURE_NOW',force:true});
    return{ok:true};
  }
  if(type==='OPEN_CHAT'){const tab=await chrome.tabs.create({url:__FITS_APP_ORIGIN__});return{ok:true,tabId:tab.id};}
  if(type==='FOCUS_PRODUCT'){
    const state=await readState();
    if(state.activeTabId){const tab=await chrome.tabs.update(state.activeTabId,{active:true});if(!tab)throw new Error('This product tab has closed.');await chrome.windows.update(tab.windowId,{focused:true});return{ok:true};}
    if(state.current&&identifyStore(state.current.product.url)){await chrome.tabs.create({url:state.current.product.url});return{ok:true};}
    throw new Error('Open a product page to continue.');
  }
  if(type==='HISTORY_REMOVE'){
    const {id}=z.object({id:z.string()}).parse(payload);await updateState(s=>({...s,history:s.history.filter(r=>r.id!==id)}));return{ok:true};
  }
  if(type==='OPEN_PRODUCT'){
    const {id}=z.object({id:z.string()}).parse(payload);const state=await readState();const record=state.history.find(r=>r.id===id);if(!record||!identifyStore(record.product.url))throw new Error('This saved product is no longer available.');
    await updateState(s=>({...s,session:storedSession(record.session),status:'waiting',current:null,product:null,error:null}));
    const tab=await chrome.tabs.create({url:record.product.url});await updateState(s=>({...s,activeTabId:tab.id??null}));return{ok:true};
  }
  if(type==='CLEAR_CURRENT_ERROR'){await updateState(s=>({...s,error:null}));return{ok:true};}
  if(type==='SELECT_PRODUCT'){
    const {id}=z.object({id:z.string()}).parse(payload);const state=await readState();
    const record=state.history.find(r=>r.id===id);
    if(!record||!state.session||criteriaKey(record.session)!==criteriaKey(state.session))throw new Error('Choose a product checked against your current criteria.');
    await updateState(s=>({...s,selectedRecordId:id,current:record,product:record.product,status:'ready',error:null}));
    const tab=state.activeTabId?await chrome.tabs.get(state.activeTabId).catch(()=>null):null;
    if(tab?.id)await chrome.tabs.update(tab.id,{url:record.product.url,active:true});
    else await chrome.tabs.create({url:record.product.url,active:true});
    return{ok:true};
  }
  throw new Error('Unknown action.');
}
chrome.runtime.onMessage.addListener((message:unknown,sender,sendResponse)=>{
  if(!message||typeof message!=='object'||!('type' in message))return false;
  const {type,payload}=message as {type:string;payload:unknown};
  let work:Promise<unknown>;
  if(type==='FITS_PING'&&isAppSender(sender)){sendResponse({ok:true,version:__FITS_VERSION__});return false;}
  if(type==='FITS_START'&&isAppSender(sender)){
    // Invoke synchronously while the content-script user gesture is still available.
    const open=chrome.sidePanel.open({windowId:sender.tab!.windowId});
    work=startShopping(payload,sender,open);
  } else if(type==='PRODUCT_CAPTURED')work=capture(payload,sender);
  else if(isPanelSender(sender))work=panelAction(type,payload);
  else {sendResponse({ok:false,error:'This page is not allowed to send this request.'});return false;}
  work.then(sendResponse,error=>sendResponse({ok:false,error:error instanceof Error?error.message:'Request failed.'}));
  return true;
});
async function followTab(tabId:number,requestCapture:boolean):Promise<void>{
  const tab=await chrome.tabs.get(tabId);if(!tab.active)return;
  // Extension UI tabs are only another view of the current storefront, not a product page.
  if(tab.url?.startsWith(chrome.runtime.getURL('')))return;
  for(const controller of pending.values())controller.abort();pending.clear();
  await updateState(s=>({...s,activeTabId:tabId,status:s.session?'waiting':'idle',product:null,current:null,error:null}));
  if(requestCapture&&tab.url&&identifyStore(tab.url))await chrome.tabs.sendMessage(tabId,{type:'FITS_CAPTURE_NOW'}).catch(()=>undefined);
}
chrome.tabs.onActivated.addListener(({tabId})=>{void followTab(tabId,true).catch(()=>undefined);});
chrome.tabs.onUpdated.addListener((tabId,change,tab)=>{
  if(!tab.active||tab.url?.startsWith(chrome.runtime.getURL('')))return;
  if(change.url||change.status==='loading')void followTab(tabId,change.status==='complete').catch(()=>undefined);
  else if(change.status==='complete'&&tab.url&&identifyStore(tab.url))void chrome.tabs.sendMessage(tabId,{type:'FITS_CAPTURE_NOW'}).catch(()=>undefined);
});
chrome.tabs.onRemoved.addListener(tabId=>{pending.get(tabId)?.abort();pending.delete(tabId);void updateState(s=>s.activeTabId===tabId?{...s,activeTabId:null,status:s.session?'waiting':'idle',product:null,current:null}:s);});
