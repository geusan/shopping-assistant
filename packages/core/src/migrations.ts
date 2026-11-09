import { AnalysisRecordSchema,ShoppingSessionSchema,type AnalysisRecord,type ShoppingSession } from './contracts';
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
export function migrateCriteria(value:unknown,current=false):unknown {
  if(!Array.isArray(value))return value;
  return value.map(c=>{
    if(!object(c))return c;
    const next={...c,priority:c.priority==='optional'?'optional':'mandatory'};
    if(current&&c.kind==='budget'&&typeof c.label==='string'&&/total|shipping|tax/i.test(`${c.label} ${c.description}`))return{...next,label:'Product price',description:'Listed product price, excluding shipping and taxes.'};
    return next;
  });
}
export function migrateSession(value:unknown,current=false):unknown{return object(value)?{...value,criteria:migrateCriteria(value.criteria,current)}:value;}
export function storedSession(value:unknown):ShoppingSession|null{const parsed=ShoppingSessionSchema.safeParse(migrateSession(value,true));return parsed.success?parsed.data:null;}
export function storedAnalysis(value:unknown):AnalysisRecord|null{
  const parsed=AnalysisRecordSchema.safeParse(object(value)?{...value,session:migrateSession(value.session),scoringMethod:value.scoringMethod||'equal-v1'}:value);
  return parsed.success?parsed.data:null;
}
