import { extractProduct } from './extract';
import { identifyStore, stableHash } from '@fits/core';

if(identifyStore(location.href)){
  let lastKey='',lastUrl=location.href,timer:ReturnType<typeof setTimeout>|undefined;
  function capture(force=false,forceAnalysis=false){
    try{
      const product=extractProduct(document,location.href);
      const key=product?stableHash(`${product.url}|${product.variant}|${product.evidence}`):`waiting:${location.href}`;
      if(!force&&key===lastKey)return;lastKey=key;
      void chrome.runtime.sendMessage({type:'PRODUCT_CAPTURED',payload:{url:location.href,product,force:forceAnalysis}}).catch(()=>undefined);
    }catch{/* A navigation or extension reload can invalidate the content script. */}
  }
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>capture(),650);};
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  chrome.runtime.onMessage.addListener(message=>{if(message?.type==='FITS_CAPTURE_NOW')capture(true,message.force===true);});
  window.addEventListener('popstate',()=>capture(true));
  setInterval(()=>{if(location.href!==lastUrl){lastUrl=location.href;lastKey='';capture(true);}},700);
  capture();
}
