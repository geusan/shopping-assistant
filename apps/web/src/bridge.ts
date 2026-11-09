import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppConfig, ShoppingSession, StoreId } from '@fits/core';
type BridgeResult={ok:boolean;error?:string;version?:string;panelOpened?:boolean};
export function useExtensionBridge(){
  const [connected,setConnected]=useState(false);
  const pending=useRef(new Map<string,{resolve:(r:BridgeResult)=>void;timer:ReturnType<typeof setTimeout>}>());
  const request=useCallback((type:string,payload?:unknown,timeout=2500)=>new Promise<BridgeResult>(resolve=>{
    const requestId=crypto.randomUUID();const timer=setTimeout(()=>{pending.current.delete(requestId);resolve({ok:false,error:'The fits extension was not detected. Reload the page after installing it.'});},timeout);
    pending.current.set(requestId,{resolve,timer});window.postMessage({source:'fits-web',requestId,type,payload},location.origin);
  }),[]);
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.source!==window||event.origin!==location.origin||event.data?.source!=='fits-extension')return;
      if(event.data.type==='READY'){setConnected(true);return;}
      const item=pending.current.get(event.data.requestId);if(!item)return;
      clearTimeout(item.timer);pending.current.delete(event.data.requestId);item.resolve(event.data.result);
    };
    window.addEventListener('message',receive);
    const ping=()=>{void request('FITS_PING').then(r=>setConnected(r.ok));};ping();const interval=setInterval(ping,5000);
    return()=>{window.removeEventListener('message',receive);clearInterval(interval);for(const p of pending.current.values()){clearTimeout(p.timer);p.resolve({ok:false});}pending.current.clear();};
  },[request]);
  return{connected,check:async()=>{const r=await request('FITS_PING');setConnected(r.ok);return r.ok;},start:(session:ShoppingSession,store:StoreId,config:AppConfig)=>request('FITS_START',{session,store,connection:{token:config.bridgeToken,apiOrigin:config.apiOrigin}},10_000)};
}
