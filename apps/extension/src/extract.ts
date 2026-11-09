import { canonicalProductUrl, identifyStore, safeProductImage, type Money, type ProductSnapshot } from '@fits/core';

type Json = Record<string,unknown>;
function object(v:unknown):v is Json {return typeof v==='object'&&v!==null&&!Array.isArray(v);}
function text(value:unknown):string {return typeof value==='string'?value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim():'';}
function productNodes(value:unknown,depth=0):Json[] {
  if(depth>8)return[];
  if(Array.isArray(value))return value.flatMap(v=>productNodes(v,depth+1));
  if(!object(value))return[];
  const type=value['@type'];const found=(type==='Product'||Array.isArray(type)&&type.includes('Product'))?[value]:[];
  return [...found,...Object.entries(value).filter(([k])=>['@graph','mainEntity','itemListElement','item'].includes(k)).flatMap(([,v])=>productNodes(v,depth+1))];
}
export function parseAmount(value:unknown):number|null {
  if(typeof value==='number')return Number.isFinite(value)&&value>=0?value:null;
  if(typeof value!=='string')return null;
  let cleaned=value.trim().replace(/[^\d.,-]/g,'');
  if(!cleaned||cleaned.startsWith('-'))return null;
  const comma=cleaned.lastIndexOf(','),dot=cleaned.lastIndexOf('.');
  if(comma>=0&&dot>=0) cleaned=comma>dot?cleaned.replaceAll('.','').replace(',','.'):cleaned.replaceAll(',','');
  else if(comma>=0)cleaned=/,\d{1,2}$/.test(cleaned)?cleaned.replace(',','.'):cleaned.replaceAll(',','');
  const number=Number(cleaned);return Number.isFinite(number)&&number>=0?number:null;
}
function money(amount:unknown,currency:unknown):Money|null {const n=parseAmount(amount);return n!==null&&typeof currency==='string'&&/^[A-Z]{3}$/.test(currency.toUpperCase())?{amount:n,currency:currency.toUpperCase()}:null;}
function visibleText(root:Element):string {
  const doc=root.ownerDocument,view=doc.defaultView,cache=new WeakMap<Element,boolean>();
  function shown(element:Element):boolean {
    const known=cache.get(element);if(known!==undefined)return known;
    const excluded=element.matches('script,style,noscript,header,footer,nav,form,input,textarea,[aria-hidden="true"],[hidden]');
    const css=view?.getComputedStyle(element);
    const visible=!excluded&&css?.display!=='none'&&css?.visibility!=='hidden'&&(element===root||!element.parentElement||shown(element.parentElement));
    cache.set(element,visible);return visible;
  }
  const walker=doc.createTreeWalker(root,4);const parts:string[]=[];let node:Node|null;let length=0,count=0;
  while((node=walker.nextNode())&&count++<5000&&length<20000){if(node.parentElement&&shown(node.parentElement)){const value=(node.textContent||'').replace(/\s+/g,' ').trim();if(value){parts.push(value);length+=value.length+1;}}}
  return parts.join(' ').slice(0,20000);
}
function firstText(doc:Document,selectors:string[]):string {for(const s of selectors){const n=doc.querySelector(s);if(n){const v=(n.textContent||'').trim();if(v)return v.replace(/\s+/g,' ');}}return '';}
export function extractProduct(doc:Document,pageUrl:string,now=Date.now()):ProductSnapshot|null {
  const store=identifyStore(pageUrl);if(!store)return null;
  const candidates:Json[]=[];
  for(const script of doc.querySelectorAll('script[type="application/ld+json"]')) {try{candidates.push(...productNodes(JSON.parse(script.textContent||'')));}catch{/* Ignore malformed store metadata. */}}
  // Search result ItemLists are not a product detail page.
  const path=new URL(pageUrl).pathname;
  const detailPath=store==='amazon'?/\/(dp|gp\/product)\//.test(path):store==='ebay'?/\/itm\//.test(path):store==='aliexpress'?/\/item\/\d+\.html/.test(path):new URL(pageUrl).hostname==='item.rakuten.co.jp'&&/^\/[^/]+\/[^/]+/.test(path);
  if(!detailPath)return null;
  const titleDom=firstText(doc,['#productTitle','h1.x-item-title__mainTitle','h1[data-pl="product-title"]','h1','[itemprop="name"]']);
  const item=candidates.find(p=>text(p.name)&&titleDom.toLowerCase().includes(text(p.name).toLowerCase().slice(0,30)))||candidates[0];
  const title=(titleDom||text(item?.name)).slice(0,400);if(!title)return null;
  const offerValue=item?.offers;
  const offer=Array.isArray(offerValue)?offerValue.find(object):object(offerValue)?offerValue:null;
  // Aggregate lowPrice is not necessarily the currently selected option.
  const currency=offer?.priceCurrency||doc.querySelector('meta[property="product:price:currency"]')?.getAttribute('content');
  const visiblePrice=firstText(doc,['#corePriceDisplay_desktop_feature_div .a-price .a-offscreen','#corePrice_feature_div .a-price .a-offscreen','.x-price-primary [itemprop="price"]','.x-price-primary .ux-textspans']);
  const visibleCurrency=/\bUS\s*\$/.test(visiblePrice)?'USD':/€/.test(visiblePrice)?'EUR':/£/.test(visiblePrice)?'GBP':String(currency||(new URL(pageUrl).hostname.endsWith('amazon.com')?'USD':''));
  // The displayed selected-variant price wins over potentially stale JSON-LD metadata.
  let price=visiblePrice?money(visiblePrice,visibleCurrency):money(offer?.price,currency);
  if(!price&&!visiblePrice)price=money(doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content'),currency);
  const imageValue=Array.isArray(item?.image)?item.image[0]:object(item?.image)?item.image.url:item?.image;
  const image=safeProductImage(imageValue||doc.querySelector('meta[property="og:image"]')?.getAttribute('content')||doc.querySelector('#landingImage')?.getAttribute('src'),pageUrl);
  const roots=['#dp','#mainContent','main','[itemtype="https://schema.org/Product"]'];
  const main=roots.map(s=>doc.querySelector(s)).find(Boolean)||doc.body;
  const specificationSelectors=store==='amazon'?['#feature-bullets','#productOverview_feature_div','#productDetails_techSpec_section_1','#productDetails_techSpec_section_2','#productDetails_detailBullets_sections1','#detailBullets_feature_div','#productDescription']:[];
  const specificationRoots=specificationSelectors.flatMap(selector=>{const node=doc.querySelector(selector);return node?[node]:[];});
  // Recommendations, ads and delivery widgets change continuously; they are not
  // evidence about the selected product and must not restart every analysis.
  const body=specificationRoots.length?specificationRoots.map(visibleText).filter(Boolean).join('\n'):main?visibleText(main):'';
  const description=text(item?.description).slice(0,6000);
  const properties=Array.isArray(item?.additionalProperty)?item.additionalProperty.filter(object).map(p=>`${text(p.name)}: ${text(String(p.value??''))}`).join('\n'):'';
  const variant=firstText(doc,['#variation_color_name .selection','#variation_size_name .selection','[data-testid="selected-variant"]']).slice(0,300);
  // Retained as a nullable compatibility field; shipping/tax totals are not evaluated.
  const totalPrice:Money|null=null;
  if(!item&&!price&&!doc.querySelector('#productTitle,h1.x-item-title__mainTitle'))return null;
  if(/^(robot check|captcha|verify you are human)/i.test(title))return null;
  const evidence=[`Product: ${title}`,price?`Item price: ${price.currency} ${price.amount.toFixed(2)}`:'',variant?`Selected variant: ${variant}`:'',description,properties.slice(0,6000),body].filter(Boolean).join('\n').slice(0,28000);
  if(evidence.length<5)return null;
  return{url:pageUrl,canonicalUrl:canonicalProductUrl(pageUrl),store,title,image,price,totalPrice,evidence,variant,capturedAt:now};
}
