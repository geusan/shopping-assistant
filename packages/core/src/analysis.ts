import { MAX_HISTORY, type AnalysisRecord, type AnalysisReply, type CriterionFinding, type ProductSnapshot, type ShoppingSession } from './contracts';

export function stableHash(value: string): string {
  let h = 2166136261; for (let i=0;i<value.length;i++) { h ^= value.charCodeAt(i); h = Math.imul(h,16777619); } return (h>>>0).toString(36);
}
export function criteriaKey(session: ShoppingSession): string { return stableHash(JSON.stringify({ criteria: session.criteria, preferences: session.preferences })); }
export function normalizeEvidence(value: string): string { return value.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase(); }
export function containsEvidence(product: ProductSnapshot, quote: string | null): boolean {
  if (!quote || quote.trim().length < 3) return false;
  return normalizeEvidence(product.evidence).includes(normalizeEvidence(quote));
}
export function scoreFindings(findings: CriterionFinding[]): number { return findings.length ? Math.round(findings.filter(f=>f.status==='match').length/findings.length*100) : 0; }
export function makeAnalysis(session: ShoppingSession, product: ProductSnapshot, raw: AnalysisReply, now=Date.now()): AnalysisRecord {
  const findings = session.criteria.map(criterion => {
    const provided=raw.findings.filter(f=>f.criterionId===criterion.id);
    let finding: CriterionFinding = provided.length===1 ? { ...provided[0] } : { criterionId:criterion.id,status:'unknown',observed:null,reason:'The page does not provide enough information for this criterion.',evidenceQuote:null };
    if (finding.status !== 'unknown' && !containsEvidence(product,finding.evidenceQuote)) finding={criterionId:criterion.id,status:'unknown',observed:null,reason:'No verifiable passage on this product page supports this result.',evidenceQuote:null};
    // Total-price claims must be computed from a known total, never a currency guess or item subtotal.
    if (criterion.kind==='budget') {
      const limit=Number(criterion.target.replace(/[^\d.]/g,''));
      const currency=criterion.unit?.toUpperCase() || session.preferences.currency;
      const price=product.totalPrice;
      if (Number.isFinite(limit) && limit>0 && price && price.currency===currency) {
        finding={criterionId:criterion.id,status:price.amount<=limit?'match':'not_match',observed:`${currency} ${price.amount.toFixed(2)} total`,reason:price.amount<=limit?'The displayed total is within your budget.':'The displayed total exceeds your budget.',evidenceQuote:`Total: ${price.currency} ${price.amount.toFixed(2)}`};
      } else if (Number.isFinite(limit) && product.price && product.price.currency===currency && product.price.amount>limit) {
        finding={criterionId:criterion.id,status:'not_match',observed:`${currency} ${product.price.amount.toFixed(2)} before shipping`,reason:'The item price already exceeds your budget, before any additional fees.',evidenceQuote:`Item price: ${product.price.currency} ${product.price.amount.toFixed(2)}`};
      } else {
        finding={criterionId:criterion.id,status:'unknown',observed:product.price?`${product.price.currency} ${product.price.amount.toFixed(2)} item price`:null,reason:product.price && product.price.currency!==currency?'The listed currency differs from your budget. No exchange rate has been assumed.':'The final total, including shipping and taxes, is not available on this page.',evidenceQuote:null};
      }
    }
    if (finding.status==='unknown') finding.evidenceQuote=containsEvidence(product,finding.evidenceQuote)?finding.evidenceQuote:null;
    return finding;
  });
  const key=criteriaKey(session);
  return { id:stableHash(`${session.id}|${key}|${product.canonicalUrl}|${product.variant}`),session,criteriaKey:key,product,findings,score:scoreFindings(findings),checkedAt:now };
}
export function upsertHistory(history: AnalysisRecord[], record: AnalysisRecord): AnalysisRecord[] {
  return [record,...history.filter(r=>r.id!==record.id)].sort((a,b)=>b.checkedAt-a.checkedAt).slice(0,MAX_HISTORY);
}
export function displayMoney(money: { amount:number;currency:string } | null): string {
  if(!money) return 'Price not listed';
  try{return new Intl.NumberFormat('en',{style:'currency',currency:money.currency,maximumFractionDigits:2}).format(money.amount);}catch{return `${money.currency} ${money.amount.toFixed(2)}`;}
}
