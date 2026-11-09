import type { StoreId } from './contracts';
export const stores: { id: StoreId; name: string }[] = [
  { id: 'amazon', name: 'Amazon' }, { id: 'aliexpress', name: 'AliExpress' }, { id: 'ebay', name: 'eBay' }, { id: 'rakuten', name: 'Rakuten' },
];
export const amazonDomains = ['amazon.com','amazon.co.uk','amazon.de','amazon.fr','amazon.it','amazon.es','amazon.ca','amazon.com.au','amazon.co.jp','amazon.in'];
export const ebayDomains = ['ebay.com','ebay.co.uk','ebay.de','ebay.ca','ebay.com.au'];
const domains: Record<StoreId,string[]> = { amazon: amazonDomains, aliexpress: ['aliexpress.com','aliexpress.us'], ebay: ebayDomains, rakuten: ['rakuten.co.jp'] };
export const marketplaceMatches = Object.values(domains).flat().map(d => `https://*.${d}/*`);
export function identifyStore(value: string): StoreId | null {
  try { const u = new URL(value); if (u.protocol !== 'https:' || u.username || u.password) return null;
    for (const [store, hosts] of Object.entries(domains)) if (hosts.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`))) return store as StoreId;
  } catch { /* Not a URL. */ }
  return null;
}
export function storeSearchUrl(store: StoreId, query: string): string {
  const q = encodeURIComponent(query.trim().slice(0,160));
  switch(store) {
    case 'amazon': return `https://www.amazon.com/s?k=${q}`;
    case 'aliexpress': return `https://www.aliexpress.com/w/wholesale-${q.replaceAll('%20','-')}.html`;
    case 'ebay': return `https://www.ebay.com/sch/i.html?_nkw=${q}`;
    case 'rakuten': return `https://search.rakuten.co.jp/search/mall/${q}/`;
  }
}
export function canonicalProductUrl(value: string): string {
  const u = new URL(value); u.hash = '';
  const store = identifyStore(value);
  if (store === 'amazon') { const id = u.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i)?.[1]; if (id) return `${u.origin}/dp/${id.toUpperCase()}`; }
  if (store === 'ebay') { const id = u.pathname.match(/\/itm\/(?:[^/]+\/)?(\d+)/)?.[1]; if (id) return `${u.origin}/itm/${id}`; }
  for (const key of [...u.searchParams.keys()]) if (/^(utm_|ref|tag$|spm|affiliate|camp|creative|tracking)/i.test(key)) u.searchParams.delete(key);
  return u.toString();
}
export function safeProductImage(value: unknown, pageUrl: string): string | null {
  if (typeof value !== 'string' || !value || value.length > 2048) return null;
  try { const url = new URL(value, pageUrl); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}
