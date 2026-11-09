import { useEffect, useRef, useState } from 'react';
import { Globe2, Square, X, Download, Puzzle, ArrowUpRight, RefreshCw, Check } from 'lucide-react';
import { ChatReplySchema, stores, type AppConfig, type ChatReply, type Criterion, type Preferences, type ShoppingSession, type StoreId } from '@fits/core';
import { AssistantMark, CriteriaList, DesignIcon, LoadingDots, Logo } from '@fits/ui';
import { useExtensionBridge } from './bridge';
import './web.css';

type Message={id:string;role:'user'|'assistant';content:string;reply?:ChatReply};
type Conversation={id:string;messages:Message[];preferences:Preferences};
const defaults:Preferences={currency:'USD',destination:'KR'};
const KEY='fits.chat.v1';
function empty():Conversation{return{id:crypto.randomUUID(),messages:[],preferences:defaults};}
function restore():Conversation{
  try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v.id==='string'&&Array.isArray(v.messages)&&v.messages.length<100&&v.messages.every((m:Message)=>['user','assistant'].includes(m.role)&&typeof m.content==='string'))return{...v,preferences:v.preferences||defaults,messages:v.messages.map((m:Message)=>({...m,reply:m.reply&&ChatReplySchema.safeParse(m.reply).success?m.reply:undefined}))};}catch{/* Reset an invalid local record. */}
  return empty();
}
async function getConfig():Promise<AppConfig>{const r=await fetch('/api/config');if(!r.ok)throw new Error('Cannot connect to fits. Start the local API server and try again.');return r.json();}

export default function App(){
  const [conversation,setConversation]=useState<Conversation>(restore);
  const [draft,setDraft]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);
  const [config,setConfig]=useState<AppConfig|null>(null);const [installStore,setInstallStore]=useState<StoreId|null>(null);
  const [opening,setOpening]=useState<StoreId|null>(null);const [notice,setNotice]=useState<string|null>(null);
  const [settings,setSettings]=useState(false);
  const controller=useRef<AbortController|null>(null);const textarea=useRef<HTMLTextAreaElement>(null);const bottom=useRef<HTMLDivElement>(null);
  const bridge=useExtensionBridge();
  useEffect(()=>{getConfig().then(setConfig,e=>setError(e.message));},[]);
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(conversation));}catch{/* Browsing can continue if storage is full. */}},[conversation]);
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:'smooth',block:'end'});},[conversation.messages,busy,installStore,error]);
  useEffect(()=>{if(textarea.current){textarea.current.style.height='28px';textarea.current.style.height=`${Math.min(168,textarea.current.scrollHeight)}px`;}},[draft]);
  const lastAssistant=[...conversation.messages].reverse().find(m=>m.role==='assistant');
  const currentCriteria=lastAssistant?.reply?.criteria||[];
  const ready=lastAssistant?.reply?.state==='ready'?lastAssistant.reply:null;
  const session:ShoppingSession|null=ready&&ready.title&&ready.searchQuery?{id:conversation.id,title:ready.title,searchQuery:ready.searchQuery,criteria:ready.criteria,preferences:conversation.preferences,updatedAt:Date.now()}:null;
  async function submit(event?:React.FormEvent){
    event?.preventDefault();const content=draft.trim();if(!content||busy)return;
    const user:Message={id:crypto.randomUUID(),role:'user',content};const messages=[...conversation.messages,user];
    setConversation(c=>({...c,messages}));setDraft('');setError(null);setInstallStore(null);setNotice(null);setBusy(true);
    const abort=new AbortController();controller.current=abort;
    try{
      const fresh=await getConfig();setConfig(fresh);
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Fits-Token':fresh.bridgeToken},body:JSON.stringify({messages:messages.slice(-40).map(m=>({role:m.role,content:m.content})),preferences:conversation.preferences,currentCriteria}),signal:abort.signal});
      const data=await response.json();if(!response.ok)throw new Error(data?.error?.message||'The conversation could not continue. Please try again.');
      const reply=ChatReplySchema.parse(data);if(abort.signal.aborted)return;
      setConversation(c=>({...c,messages:[...c.messages,{id:crypto.randomUUID(),role:'assistant',content:reply.reply,reply}]}));
    }catch(e){if(!abort.signal.aborted){setError(e instanceof Error?e.message:'Please try again.');setDraft(content);setConversation(c=>({...c,messages:c.messages.filter(m=>m.id!==user.id)}));}}
    finally{if(controller.current===abort){setBusy(false);controller.current=null;textarea.current?.focus();}}
  }
  function newChat(){controller.current?.abort();controller.current=null;setBusy(false);setConversation(empty());setDraft('');setInstallStore(null);setError(null);setNotice(null);textarea.current?.focus();}
  async function openStore(store:StoreId){
    if(!session||!config||opening)return;setError(null);setNotice(null);
    if(!bridge.connected){setInstallStore(store);return;}
    setOpening(store);const result=await bridge.start(session,store,config);setOpening(null);
    if(!result.ok){setError(result.error||'Could not open the store. Reconnect fits and try again.');return;}
    setInstallStore(null);setNotice(result.panelOpened?'Your criteria are ready in the fits side panel.':'The store is open. Click the fits toolbar icon to show the side panel.');
  }
  async function checkAndOpen(){const found=await bridge.check();if(!found){setError('Not detected yet. Load the extension in Chrome, then refresh this page and try again.');return;}
    if(session&&config&&installStore){setOpening(installStore);const result=await bridge.start(session,installStore,config);setOpening(null);if(result.ok){setInstallStore(null);setNotice('The store is open with your criteria.');}else setError(result.error||'Please reconnect and try again.');}}
  const composer=<form className="composer" onSubmit={submit}><label className="sr-only" htmlFor="message">Message fits</label><textarea id="message" ref={textarea} rows={1} maxLength={4000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={ready?'e.g. Make the weight limit 200 g.':'Tell fits what you have in mind...'} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void submit();}}}/><div className="composer-toolbar"><span>Enter to send · Shift + Enter for a new line</span>{busy?<button type="button" className="send-button" aria-label="Stop response" onClick={()=>{controller.current?.abort();setBusy(false);}}><Square size={15} fill="currentColor"/></button>:<button className="send-button" type="submit" aria-label="Send message" disabled={!draft.trim()}><DesignIcon name="send"/></button>}</div></form>;
  return <div className="web-app"><header className="web-header"><button className="brand-home" onClick={newChat} aria-label="Start a new fits chat"><Logo/></button><div className="header-actions"><button className="icon-button" aria-label="Shopping preferences" aria-expanded={settings} onClick={()=>setSettings(s=>!s)}><Globe2 size={18}/></button><button className="new-chat" onClick={newChat}><DesignIcon name="edit"/>New chat</button></div></header>
    {settings&&<section className="preferences"><div><h2>Shopping preferences</h2><button className="icon-button" aria-label="Close preferences" onClick={()=>setSettings(false)}><X size={18}/></button></div><label>Budget currency<select value={conversation.preferences.currency} disabled={conversation.messages.length>0} onChange={e=>setConversation(c=>({...c,preferences:{...c.preferences,currency:e.target.value}}))}>{['USD','EUR','GBP','KRW','JPY','CAD','AUD'].map(c=><option key={c}>{c}</option>)}</select></label><label>Ship to<select value={conversation.preferences.destination} disabled={conversation.messages.length>0} onChange={e=>setConversation(c=>({...c,preferences:{...c.preferences,destination:e.target.value}}))}>{Object.entries({KR:'South Korea',US:'United States',GB:'United Kingdom',DE:'Germany',JP:'Japan',CA:'Canada',AU:'Australia',FR:'France'}).map(([v,n])=><option value={v} key={v}>{n}</option>)}</select></label>{conversation.messages.length>0&&<p>Start a new chat to change these preferences.</p>}<p>Your conversations stay in this browser. Product information is sent to OpenAI only when you request a check.</p></section>}
    {!conversation.messages.length&&!busy?<main className="welcome"><div className="welcome-inner"><h1>What are you shopping for?</h1><p>Tell us what you have in mind. We’ll work out what to look for.</p>{composer}<div className="suggestion-row">{['Carry-on luggage','Everyday running shoes','Wireless headphones'].map(s=><button key={s} onClick={()=>{setDraft(`I’m looking for ${s.toLowerCase()}.`);textarea.current?.focus();}}>{s}</button>)}</div>{error&&<div className="inline-error" role="alert">{error}</div>}{config&&!config.apiReady&&<p className="setup-note">OpenAI is not configured yet. Add your key to the server’s <code>.env</code> file and restart the API.</p>}</div></main>:<>
      <main className="conversation-scroll"><div className="conversation-thread">{conversation.messages.map(m=><div key={m.id} className={`message ${m.role}`}>{m.role==='assistant'&&<AssistantMark/>}<div className="message-content"><p className="message-text">{m.content}</p>{m.reply?.state==='ready'&&<div className="assistant-result"><CriteriaList criteria={m.reply.criteria}/>{m.id===lastAssistant?.id&&!busy&&<><p className="criteria-note">{m.reply.criteria.length} of 4 criteria · Tell me if you’d like to change one.</p><div className="store-actions"><p>Where would you like to shop?</p><div className="store-buttons">{stores.map(s=><button key={s.id} className="store-button" disabled={!!opening||!config} onClick={()=>void openStore(s.id)}>{opening===s.id?'Opening…':s.name}<DesignIcon name="external"/></button>)}</div><span className="bridge-status">{bridge.connected?<><DesignIcon name="check"/>fits is connected. Your criteria will follow you.</>:<><Puzzle size={14}/>Connect the fits extension when you’re ready to shop.</>}</span></div></>}</div>}{m.reply?.state==='question'&&m.id===lastAssistant?.id&&m.reply.suggestedReplies.length>0&&<div className="quick-replies">{m.reply.suggestedReplies.map(q=><button key={q} onClick={()=>{setDraft(q);textarea.current?.focus();}}>{q}</button>)}</div>}</div></div>)}
      {busy&&<div className="message assistant"><AssistantMark/><LoadingDots/></div>}
      {installStore&&<div className="message assistant"><AssistantMark/><div className="message-content install-chat"><h2>One quick step before {stores.find(s=>s.id===installStore)?.name}.</h2><p>Add fits to Chrome to check products as you browse. Your criteria will be ready when you get there.</p><span className="bridge-status"><Puzzle size={15}/>Extension not connected</span>{config?.extensionStoreUrl?<a className="button primary" href={config.extensionStoreUrl} target="_blank" rel="noreferrer">Add to Chrome<ArrowUpRight size={16}/></a>:<><a className="button primary" href="/extension/fits-extension.zip" download><Download size={17}/>Download extension</a><ol className="install-steps"><li>Unzip the download into a folder you’ll keep.</li><li>Open <code>chrome://extensions</code> and turn on Developer mode.</li><li>Choose <strong>Load unpacked</strong> and select that folder.</li><li>Refresh this page, then check the connection below.</li></ol></>}<div className="install-actions"><button className="button" disabled={!!opening} onClick={()=>void checkAndOpen()}><RefreshCw size={15}/>{opening?'Opening…':'Check connection & open store'}</button><button className="text-button" onClick={()=>setInstallStore(null)}>Cancel</button></div></div></div>}
      {error&&<div className="inline-error" role="alert">{error}</div>}{notice&&<p className="flow-notice" role="status"><Check size={16}/>{notice}</p>}<div ref={bottom}/></div></main><div className="composer-dock">{composer}</div></>}
    <footer className="web-footer">Chat with fits to define up to four shopping criteria.</footer>
  </div>;
}
