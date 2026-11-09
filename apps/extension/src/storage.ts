import { AnalysisRecordSchema, ShoppingSessionSchema, initialExtensionState, type ExtensionState } from '@fits/core';
export const STATE_KEY='fits.state.v1';
export async function readState():Promise<ExtensionState> {
  const raw=(await chrome.storage.local.get(STATE_KEY))[STATE_KEY] as Partial<ExtensionState>|undefined;
  if(!raw)return structuredClone(initialExtensionState);
  const session=ShoppingSessionSchema.safeParse(raw.session);
  const history=Array.isArray(raw.history)?raw.history.flatMap(r=>{const v=AnalysisRecordSchema.safeParse(r);return v.success?[v.data]:[]}).slice(0,100):[];
  const current=AnalysisRecordSchema.safeParse(raw.current);
  return {...initialExtensionState,...raw,session:session.success?session.data:null,history,current:current.success?current.data:null};
}
let queue:Promise<unknown>=Promise.resolve();
export function updateState(change:(state:ExtensionState)=>ExtensionState|Promise<ExtensionState>):Promise<ExtensionState> {
  const work=queue.then(async()=>{const next=await change(await readState());await chrome.storage.local.set({[STATE_KEY]:next});return next;});
  queue=work.catch(()=>undefined);return work;
}
