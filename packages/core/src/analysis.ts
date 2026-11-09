import { MAX_HISTORY, type AnalysisRecord, type AnalysisReply, type Criterion, type CriterionFinding, type ProductSnapshot, type ShoppingSession } from './contracts';

export function stableHash(value: string): string {
  let h = 2166136261; for (let i=0;i<value.length;i++) { h ^= value.charCodeAt(i); h = Math.imul(h,16777619); } return (h>>>0).toString(36);
}
export function criteriaKey(session: ShoppingSession): string { return stableHash(JSON.stringify({ criteria: session.criteria, preferences: session.preferences })); }
export function normalizeEvidence(value: string): string { return value.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase(); }
export function containsEvidence(product: ProductSnapshot, quote: string | null): boolean {
  if (!quote || quote.trim().length < 3) return false;
  return normalizeEvidence(product.evidence).includes(normalizeEvidence(quote));
}
export function scoreFindings(findings: CriterionFinding[],criteria:Criterion[]):number {
  const weight=(id:string)=>criteria.find(c=>c.id===id)?.priority==='mandatory'?2:1;
  const total=criteria.reduce((n,c)=>n+(c.priority==='mandatory'?2:1),0);
  return total?Math.round(findings.filter(f=>f.status==='match').reduce((n,f)=>n+weight(f.criterionId),0)/total*100):0;
}
export function fitSummary(record:Pick<AnalysisRecord,'session'|'findings'>){
  const mandatory=record.session.criteria.filter(c=>c.priority==='mandatory');
  const optional=record.session.criteria.filter(c=>c.priority==='optional');
  const status=(id:string)=>record.findings.find(f=>f.criterionId===id)?.status||'unknown';
  const mandatoryMatched=mandatory.filter(c=>status(c.id)==='match').length;
  const mandatoryFailed=mandatory.filter(c=>status(c.id)==='not_match').length;
  const mandatoryUnknown=mandatory.filter(c=>status(c.id)==='unknown').length;
  const optionalMatched=optional.filter(c=>status(c.id)==='match').length;
  const level=mandatoryFailed?'not_fit':mandatoryUnknown?'verify_mandatory':record.findings.every(f=>f.status==='match')?'all_met':mandatory.length?'must_haves_met':'partial';
  return{mandatoryTotal:mandatory.length,mandatoryMatched,mandatoryFailed,mandatoryUnknown,optionalTotal:optional.length,optionalMatched,level,rank:mandatoryFailed?0:mandatoryUnknown?1:2};
}
const measurementUnits:Record<string,{family:string;factor:number}>={g:{family:'mass',factor:1},kg:{family:'mass',factor:1000},oz:{family:'mass',factor:28.3495},lb:{family:'mass',factor:453.592},h:{family:'time',factor:1},hr:{family:'time',factor:1},hour:{family:'time',factor:1},hours:{family:'time',factor:1},min:{family:'time',factor:1/60},minutes:{family:'time',factor:1/60},mm:{family:'length',factor:.1},cm:{family:'length',factor:1},m:{family:'length',factor:100},in:{family:'length',factor:2.54},inch:{family:'length',factor:2.54},inches:{family:'length',factor:2.54},ml:{family:'volume',factor:.001},l:{family:'volume',factor:1},gb:{family:'storage',factor:1},tb:{family:'storage',factor:1000},w:{family:'power',factor:1},kw:{family:'power',factor:1000},mah:{family:'capacity',factor:1},hz:{family:'frequency',factor:1},khz:{family:'frequency',factor:1000},ghz:{family:'frequency',factor:1e9}};
for(const [unit,names] of Object.entries({g:['gram','grams'],kg:['kilogram','kilograms'],oz:['ounce','ounces'],lb:['pound','pounds'],h:['hrs'],min:['minute'],cm:['centimeter','centimeters'],mm:['millimeter','millimeters'],l:['liter','liters','litre','litres']}))for(const name of names)measurementUnits[name]=measurementUnits[unit];
const measurementPattern=new RegExp('(?<![\\d.,])(\\d+(?:[.,]\\d+)*(?:[ \\u00a0]\\d{3})*)\\s*(?:[-‑–]\\s*)?('+Object.keys(measurementUnits).sort((a,b)=>b.length-a.length).join('|')+')\\b','gi');
function measurementNumber(value:string):number|null {
  let n=value.replace(/[ \u00a0]/g,'');
  const comma=n.lastIndexOf(','),dot=n.lastIndexOf('.');
  if(comma>=0&&dot>=0)n=comma>dot?n.replaceAll('.','').replace(',','.'):n.replaceAll(',','');
  else if(comma>=0)n=/^[1-9]\d{0,2}(?:,\d{3})+$/.test(n)?n.replaceAll(',',''):n.replace(',','.');
  else if(/^[1-9]\d{0,2}\.\d{3}$/.test(n))return null; // Ambiguous decimal/grouping separator.
  const result=Number(n);return Number.isFinite(result)?result:null;
}
export function numericEvidence(quote:string,unit:string|null):number|null {
  const target=unit?measurementUnits[unit.toLowerCase()]:null;if(!target)return null;
  const values=[...quote.matchAll(measurementPattern)].flatMap(m=>{
    const u=measurementUnits[m[2].toLowerCase()],n=measurementNumber(m[1]);return u.family===target.family&&n!==null?[n*u.factor/target.factor]:[];
  });
  const unique=[...new Set(values.map(v=>Math.round(v*10000)/10000))];return unique.length===1?unique[0]:null;
}
export function makeAnalysis(session: ShoppingSession, product: ProductSnapshot, raw: AnalysisReply, now=Date.now()): AnalysisRecord {
  const findings = session.criteria.map(criterion => {
    const provided=raw.findings.filter(f=>f.criterionId===criterion.id);
    let finding: CriterionFinding = provided.length===1 ? { ...provided[0] } : { criterionId:criterion.id,status:'unknown',observed:null,reason:'The page does not provide enough information for this criterion.',evidenceQuote:null };
    if (finding.status !== 'unknown' && !containsEvidence(product,finding.evidenceQuote)) finding={criterionId:criterion.id,status:'unknown',observed:null,reason:'No verifiable passage on this product page supports this result.',evidenceQuote:null};
    if(criterion.kind==='numeric'&&finding.status!=='unknown'&&finding.evidenceQuote){
      const observed=numericEvidence(finding.evidenceQuote,criterion.unit),target=Number(criterion.target);
      if(observed===null||!Number.isFinite(target))finding={criterionId:criterion.id,status:'unknown',observed:null,reason:'The cited measurement or its units are ambiguous.',evidenceQuote:finding.evidenceQuote};
      else{const matched=criterion.comparison==='at_most'?observed<=target:criterion.comparison==='at_least'?observed>=target:observed===target;finding={...finding,status:matched?'match':'not_match',observed:`${observed} ${criterion.unit}`,reason:matched?'The stated measurement meets your target.':'The stated measurement does not meet your target.'};}
    }
    // Product price is the only monetary criterion. Shipping and taxes never affect fit.
    if (criterion.kind==='budget') {
      const limit=Number(criterion.target.replace(/[^\d.]/g,''));
      const currency=criterion.unit?.toUpperCase() || session.preferences.currency;
      const price=product.price,unlimited=/^(any|no limit|unlimited)$/i.test(criterion.target.trim());
      if(price&&(unlimited||Number.isFinite(limit)&&limit>0&&price.currency===currency)){
        const matched=unlimited||price.amount<=limit;
        finding={criterionId:criterion.id,status:matched?'match':'not_match',observed:`${price.currency} ${price.amount.toFixed(2)}`,reason:unlimited?'A product price is listed; you did not set a price limit.':matched?'The listed product price meets your budget.':'The listed product price exceeds your budget.',evidenceQuote:`Item price: ${price.currency} ${price.amount.toFixed(2)}`};
      } else {
        finding={criterionId:criterion.id,status:'unknown',observed:price?`${price.currency} ${price.amount.toFixed(2)}`:null,reason:price&&price.currency!==currency?'The listed currency differs from your budget. No exchange rate has been assumed.':'The product price is not available on this page.',evidenceQuote:null};
      }
    }
    if (finding.status==='unknown') finding.evidenceQuote=containsEvidence(product,finding.evidenceQuote)?finding.evidenceQuote:null;
    return finding;
  });
  const key=criteriaKey(session);
  return { id:stableHash(`${session.id}|${key}|${product.canonicalUrl}|${product.variant}|priority-v2`),session,criteriaKey:key,product,findings,score:scoreFindings(findings,session.criteria),checkedAt:now,scoringMethod:'priority-v2' };
}
export function upsertHistory(history: AnalysisRecord[], record: AnalysisRecord): AnalysisRecord[] {
  return [record,...history.filter(r=>r.id!==record.id)].sort((a,b)=>b.checkedAt-a.checkedAt).slice(0,MAX_HISTORY);
}
export function displayMoney(money: { amount:number;currency:string } | null): string {
  if(!money) return 'Price not listed';
  try{return new Intl.NumberFormat('en',{style:'currency',currency:money.currency,maximumFractionDigits:2}).format(money.amount);}catch{return `${money.currency} ${money.amount.toFixed(2)}`;}
}
