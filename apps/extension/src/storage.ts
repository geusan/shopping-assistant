import { storedAnalysis,storedSession,initialExtensionState, type ExtensionState } from '@fits/core';
export const STATE_KEY='fits.state.v1';
export async function readState():Promise<ExtensionState> {
  const raw=(await chrome.storage.local.get(STATE_KEY))[STATE_KEY] as Partial<ExtensionState>|undefined;
  if(!raw)return structuredClone(initialExtensionState);
  const session=storedSession(raw.session);
  const history=Array.isArray(raw.history)?raw.history.flatMap(r=>{const v=storedAnalysis(r);return v?[v]:[]}).slice(0,100):[];
  const current=storedAnalysis(raw.current);
  const currentResult=current?.scoringMethod==='priority-v2'?current:null;
  return {...initialExtensionState,...raw,session,history,current:currentResult,status:raw.status==='ready'&&!currentResult?(session?'waiting':'idle'):raw.status||'idle'};
}
let queue:Promise<unknown>=Promise.resolve();
export function updateState(change:(state:ExtensionState)=>ExtensionState|Promise<ExtensionState>):Promise<ExtensionState> {
  const work=queue.then(async()=>{const next=await change(await readState());await chrome.storage.local.set({[STATE_KEY]:next});return next;});
  queue=work.catch(()=>undefined);return work;
}
