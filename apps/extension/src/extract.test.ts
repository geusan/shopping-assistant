import { describe,it,expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { productHtml,searchHtml } from '../../../tests/fixtures/products';
import { extractProduct,parseAmount } from './extract';
describe('product capture',()=>{
  it('reads visible product facts and price without using shipping totals',()=>{const doc=new JSDOM(productHtml()).window.document;const p=extractProduct(doc,'https://www.amazon.com/dp/B0FITST001?tag=abc')!;expect(p.title).toBe('AURA H1 Wireless Headphones');expect(p.price?.amount).toBe(129);expect(p.totalPrice).toBeNull();expect(p.evidence).toContain('240 g');expect(p.evidence).not.toContain('Secret alternative');expect(p.evidence).not.toContain('Private checkout');});
  it('does not infer a final total from item price',()=>{const p=extractProduct(new JSDOM(productHtml(false)).window.document,'https://www.amazon.com/dp/B0FITST001')!;expect(p.totalPrice).toBeNull();expect(p.price?.amount).toBe(129);});
  it('prefers the displayed variant price over stale structured metadata',()=>{const doc=new JSDOM(productHtml()).window.document;doc.querySelector('.a-offscreen')!.textContent='$179.00';const p=extractProduct(doc,'https://www.amazon.com/dp/B0FITST001')!;expect(p.price?.amount).toBe(179);expect(p.evidence).toContain('Item price: USD 179.00');});
  it('does not analyze search-result pages',()=>expect(extractProduct(new JSDOM(searchHtml).window.document,'https://www.amazon.com/s?k=headphones')).toBeNull());
  it('ignores a malformed JSON-LD block and uses product DOM evidence',()=>{const doc=new JSDOM(productHtml()).window.document;doc.querySelector('script')!.textContent='{bad';expect(extractProduct(doc,'https://www.amazon.com/dp/B0FITST001')?.title).toBe('AURA H1 Wireless Headphones');});
  it('does not add multiple amounts in a total label',()=>{const doc=new JSDOM(productHtml()).window.document;doc.querySelector('[data-fits-total]')!.textContent='Total $143 including $14 shipping';expect(extractProduct(doc,'https://www.amazon.com/dp/B0FITST001')?.totalPrice).toBeNull();});
  it('supports decimal separators without interpreting invalid values',()=>{expect(parseAmount('€1.234,56')).toBe(1234.56);expect(parseAmount('$1,234.56')).toBe(1234.56);expect(parseAmount('unknown')).toBeNull();expect(parseAmount('-40')).toBeNull();});
});
