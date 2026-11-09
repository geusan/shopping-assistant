// This script is only injected into the configured fits website, not marketplace pages.
const approved=new Set([__FITS_APP_ORIGIN__,__FITS_APP_ORIGIN__.replace('localhost','127.0.0.1')]);
const bridgeWindow=window as Window&{__fitsBridgeInstalled?:boolean};
if(approved.has(location.origin)&&!bridgeWindow.__fitsBridgeInstalled){
  bridgeWindow.__fitsBridgeInstalled=true;
  const respond=(requestId:string,result:unknown)=>window.postMessage({source:'fits-extension',requestId,result},location.origin);
  window.addEventListener('message',event=>{
    if(event.source!==window||event.origin!==location.origin||event.data?.source!=='fits-web')return;
    const {requestId,type,payload}=event.data;
    if(typeof requestId!=='string'||requestId.length>80||!['FITS_PING','FITS_START'].includes(type))return;
    chrome.runtime.sendMessage({type,payload}).then(result=>respond(requestId,result),()=>respond(requestId,{ok:false,error:'Reload this page to reconnect the updated extension.'}));
  });
  window.postMessage({source:'fits-extension',type:'READY',version:__FITS_VERSION__},location.origin);
}
