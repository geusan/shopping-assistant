import type { AiProvider } from '../../apps/api/src/provider';
import { ServiceError } from '../../apps/api/src/provider';
import type { AnalysisReply, AnalyzeRequest, ChatReply, ChatRequest, Criterion } from '@fits/core';
export const fixtureCriteria:Criterion[]=[
  {id:'anc',label:'Noise cancellation',description:'Reduce subway noise.',priority:'mandatory',kind:'boolean',comparison:'equals',target:'yes',unit:null},
  {id:'weight',label:'Weight',description:'Comfortable for the daily commute.',priority:'optional',kind:'numeric',comparison:'at_most',target:'250',unit:'g'},
  {id:'battery',label:'Battery life',description:'Avoid frequent charging.',priority:'optional',kind:'numeric',comparison:'at_least',target:'30',unit:'h'},
  {id:'budget',label:'Product price',description:'Listed item price only.',priority:'mandatory',kind:'budget',comparison:'at_most',target:'150',unit:'USD'},
];
export class FixtureProvider implements AiProvider {
  async chat(request:ChatRequest):Promise<ChatReply>{
    const turns=request.messages.filter(m=>m.role==='user');const last=turns.at(-1)!.content;
    if(last.includes('__simulate_error__'))throw new ServiceError('AI_UNAVAILABLE','Test provider failure. Please try again.',502,true);
    if(turns.length===1)return{reply:"What's your product-price budget, and which features are must-haves?",state:'question',title:null,searchQuery:null,criteria:[],suggestedReplies:['$150. Noise cancellation is mandatory; weight and battery life are optional.']};
    if(turns.length===2)return{reply:'Great. Where will you use them most?',state:'question',title:null,searchQuery:null,criteria:[],suggestedReplies:['Mostly on the subway. I would prefer something light with a battery that lasts.']};
    const criteria=structuredClone(fixtureCriteria);
    if(last.includes('200 g')){criteria[1].label='Weight ≤ 200 g';criteria[1].target='200';}
    return{reply:'I’ve included product price and marked your must-haves as Mandatory. Weight and battery life are Optional preferences. You can change any priority below.',state:'ready',title:'Commute headphones',searchQuery:'wireless noise cancelling headphones',criteria,suggestedReplies:[]};
  }
  async analyze({session,product}:AnalyzeRequest):Promise<AnalysisReply>{
    const e=product.evidence;
    return{findings:session.criteria.map(c=>{
      if(c.id==='anc'&&e.includes('Active Noise Cancellation'))return{criterionId:c.id,status:'match',observed:'ANC supported',reason:'The feature is explicitly listed.',evidenceQuote:'Active Noise Cancellation'};
      if(c.id==='weight'&&e.includes('240 g'))return{criterionId:c.id,status:Number(c.target)>=240?'match':'not_match',observed:'240 g',reason:'The product weight is listed as 240 g.',evidenceQuote:'240 g'};
      if(c.id==='battery'&&e.includes('40 hours'))return{criterionId:c.id,status:'match',observed:'Up to 40 hours',reason:'The listed battery life exceeds 30 hours.',evidenceQuote:'40 hours'};
      return{criterionId:c.id,status:'unknown',observed:null,reason:'The page does not state this information.',evidenceQuote:null};
    })};
  }
}
