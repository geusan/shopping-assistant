import { it,expect } from 'vitest';
import { fixtureProduct,fixtureSession } from '../../../tests/fixtures/products';
import { storedAnalysis,storedSession } from './migrations';
it('keeps older history and its original score while marking the earlier scoring method',()=>{
  const oldSession={...fixtureSession,criteria:fixtureSession.criteria.map(({priority,...rest})=>rest)};
  const old={id:'old-record',session:oldSession,criteriaKey:'old-key',product:fixtureProduct(),findings:fixtureSession.criteria.map(c=>({criterionId:c.id,status:'unknown',observed:null,reason:'Earlier check',evidenceQuote:null})),score:75,checkedAt:100};
  const record=storedAnalysis(old);expect(record).not.toBeNull();expect(record?.score).toBe(75);expect(record?.scoringMethod).toBe('equal-v1');expect(record?.session.criteria.every(c=>c.priority==='mandatory')).toBe(true);
});
it('updates the active price criterion without rewriting saved history',()=>{
  const old={...fixtureSession,criteria:fixtureSession.criteria.map(c=>c.kind==='budget'?{...c,label:'Total including shipping',description:'Shipping and taxes included'}:c)};
  expect(storedSession(old)?.criteria[3].label).toBe('Product price');
});
