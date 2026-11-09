const page=figma.currentPage;
const ready=await figma.getNodeByIdAsync('32:218');
const response=await figma.getNodeByIdAsync('32:247');
const install=await figma.getNodeByIdAsync('17:2');
const header=await figma.getNodeByIdAsync('32:140');
const composer=await figma.getNodeByIdAsync('32:149');
const brand=await figma.variables.getVariableByIdAsync('VariableID:25:4');
const surface=await figma.variables.getVariableByIdAsync('VariableID:25:6');
const currentFonts=new Map();
for(const root of [ready,install,header,composer])for(const t of root.findAllWithCriteria({types:['TEXT']}))for(const seg of t.getStyledTextSegments(['fontName']))currentFonts.set(JSON.stringify(seg.fontName),seg.fontName);
await Promise.all([...currentFonts.values()].map(f=>figma.loadFontAsync(f)));
await Promise.all(['Regular','SemiBold','Bold'].map(style=>figma.loadFontAsync({family:'Pretendard',style})));
const made=[],changed=[],removed=[];
function rgb(hex){return{r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255};}
function paint(hex){let p={type:'SOLID',color:rgb(hex)};if(hex==='#164e39')p=figma.variables.setBoundVariableForPaint(p,'color',brand);if(hex==='#ffffff')p=figma.variables.setBoundVariableForPaint(p,'color',surface);return p;}
function all(n){return[n,...('findAll' in n?n.findAll(()=>true):[])];}
function stack(parent,name,w,d='VERTICAL',gap=0){const n=figma.createAutoLayout(d);parent.appendChild(n);n.name=name;n.resize(w,1);n.fills=[];n.clipsContent=false;n.itemSpacing=gap;n.layoutSizingHorizontal='FIXED';n.layoutSizingVertical='HUG';made.push(n.id);return n;}
function fixed(n,w,h){n.resize(w,h);n.layoutSizingHorizontal='FIXED';n.layoutSizingVertical='FIXED';return n;}
function text(parent,value,size=17,weight='Regular',color='#182c25',width=null,line=28){const t=figma.createText();t.fontName={family:'Pretendard',style:weight};t.fontSize=size;t.lineHeight={unit:'PIXELS',value:line};t.fills=[paint(color)];t.characters=value;t.name=value.slice(0,48);parent.appendChild(t);if(width!==null){t.resize(width,line);t.textAutoResize='HEIGHT';}else t.textAutoResize='WIDTH_AND_HEIGHT';made.push(t.id);return t;}
function svg(parent,kind,color='#164e39',size=18){const paths=kind==='external'?'<path d="M14 3h7v7m0-7L10 14M11 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-7"/>':kind==='check'?'<path d="m5 12 4 4L19 6"/>':'<path d="M12 4v9m0 4v1"/><circle cx="12" cy="12" r="10"/>';const n=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>');parent.appendChild(n);n.name='Icon / '+kind;made.push(...all(n).map(c=>c.id));return n;}
function mark(parent){const n=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M5 9v14h8M19 9h8v14" stroke="#164e39" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="m11 16 4 4 7-9" stroke="#164e39" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>');parent.appendChild(n);n.name='fits / Assistant';made.push(...all(n).map(c=>c.id));}
async function nav(n,id){await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:{type:'DISSOLVE',duration:.2,easing:{type:'EASE_OUT'}},resetScrollPosition:true}]}]);changed.push(n.id);}
async function url(n,value){await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'URL',url:value,openInNewTab:true}]}]);changed.push(n.id);}

// A shared inline action keeps every store in the conversation's visual language.
const base=stack(page,'Button / Inline store',170,'HORIZONTAL',12);fixed(base,170,44);base.paddingLeft=base.paddingRight=16;base.counterAxisAlignItems='CENTER';base.primaryAxisAlignItems='SPACE_BETWEEN';base.cornerRadius=10;base.fills=[paint('#ffffff')];base.strokes=[paint('#cbd7ce')];base.strokeWeight=1;
const label=text(base,'Amazon',15,'SemiBold','#164e39',null,24);label.name='Label';svg(base,'external','#164e39',16);
const button=figma.createComponentFromNode(base);made.push(button.id);button.name='Button / Inline store';button.description='Inline marketplace action in the chat. Label is editable. The store opens directly when fits is connected; missing extension setup stays in the conversation.';button.x=3360;button.y=4500;
const prop=button.addComponentProperty('Label','TEXT','Amazon');label.componentPropertyReferences={characters:prop};
function instance(parent,name,w=170,primary=false){const n=button.createInstance();parent.appendChild(n);n.resize(w,44);n.setProperties({[prop]:name});n.name='Action / '+name;if(primary){n.fills=[paint('#164e39')];n.strokes=[];for(const child of n.findAllWithCriteria({types:['TEXT']}))child.fills=[paint('#ffffff')];for(const child of n.findAllWithCriteria({types:['VECTOR']})){if(child.strokes.length)child.strokes=[paint('#ffffff')];}}made.push(...all(n).map(c=>c.id));return n;}

for(const id of ['32:267','32:271']){const n=await figma.getNodeByIdAsync(id);n.remove();removed.push(id);}
const stores=stack(response,'Stores / Inline in chat',716,'VERTICAL',12);
text(stores,'Where would you like to shop?',17,'Regular','#182c25',716,28);
const row=stack(stores,'Store buttons',716,'HORIZONTAL',12);
const amazon=instance(row,'Amazon');const ali=instance(row,'AliExpress');const ebay=instance(row,'eBay');const rakuten=instance(row,'Rakuten');
await nav(amazon,'18:2');
await url(ali,'https://www.aliexpress.com/w/wholesale-wireless-noise-cancelling-headphones.html');
await url(ebay,'https://www.ebay.com/sch/i.html?_nkw=wireless+noise+cancelling+headphones');
await url(rakuten,'https://search.rakuten.co.jp/search/mall/wireless+noise+cancelling+headphones/');
const connected=stack(stores,'Connection status',716,'HORIZONTAL',7);connected.counterAxisAlignItems='CENTER';svg(connected,'check','#4c7b4e',15);text(connected,'fits is connected. Your 4 criteria will follow you.',12,'Regular','#637568',null,20);
ready.name='03 · Pick a store in chat';changed.push(ready.id,response.id);

// Exceptional state: the missing extension is explained in the same chat shell.
for(const child of [...install.children]){removed.push(child.id);child.remove();}
install.layoutMode='NONE';install.resize(1440,1000);install.fills=[paint('#ffffff')];install.strokes=[];install.effects=[];install.clipsContent=true;install.name='07 · Extension setup in chat';changed.push(install.id);
const top=header.createInstance();install.appendChild(top);top.x=0;top.y=0;made.push(...all(top).map(n=>n.id));
const thread=stack(install,'Conversation / Extension needed',760,'VERTICAL',30);thread.x=340;thread.y=144;
const user=stack(thread,'User message',760,'HORIZONTAL');user.primaryAxisAlignItems='MAX';
const bubble=stack(user,'User bubble',226);bubble.paddingTop=bubble.paddingBottom=14;bubble.paddingLeft=bubble.paddingRight=20;bubble.cornerRadius=16;bubble.fills=[paint('#f1f4f0')];text(bubble,"Let's search on Amazon.",17,'Regular','#182c25',186,28);
const reply=stack(thread,'fits response',760,'HORIZONTAL',18);reply.counterAxisAlignItems='MIN';mark(reply);
const body=stack(reply,'Response content',716,'VERTICAL',16);
text(body,'One quick step before Amazon.',20,'SemiBold','#182c25',716,30);
text(body,'Add fits to Chrome to check products as you browse.\nYour four criteria will be ready when you get there.',17,'Regular','#182c25',716,28);
const status=stack(body,'Extension not connected',716,'HORIZONTAL',8);status.counterAxisAlignItems='CENTER';svg(status,'info','#7c6d45',16);text(status,'Extension not connected',13,'Regular','#7c6d45',null,22);
const actions=stack(body,'Install and continue',716,'HORIZONTAL',12);
const add=instance(actions,'Add to Chrome',188,true);
const check=instance(actions,'Check & open Amazon',232);
await nav(check,'18:2');
text(body,'Install in Chrome, then return here and check the connection.',13,'Regular','#637568',716,22);
text(body,'Your 4 criteria are saved. No need to start over.',13,'Regular','#637568',716,22);
const input=composer.createInstance();install.appendChild(input);input.x=340;input.y=824;input.setProperties({'Message#32:0':'Ask about your criteria...'});const inputText=input.findAllWithCriteria({types:['TEXT']}).find(t=>t.name==='Message');inputText.fills=[paint('#69786d')];const send=input.findOne(n=>n.name==='Action / 메시지 보내기');send.fills=[paint('#dce4dd')];await send.setReactionsAsync([]);made.push(...all(input).map(n=>n.id));
const foot=text(install,'Chat with fits to define up to four shopping criteria.',12,'Regular','#69786d',760,20);foot.textAlignHorizontal='CENTER';foot.x=340;foot.y=964;

// Remove the obsolete separate chooser and arrange the remaining journey.
const old=await figma.getNodeByIdAsync('16:2');old.remove();removed.push(old.id);
const order=['14:2','15:2','32:218','18:2','19:2','20:2','17:2','21:2'];
const names=['01 · Start a conversation','02 · Talk through your needs','03 · Pick a store in chat','04 · Browse with fits','05 · Product match / 100%','06 · Product match / 75% · Unknown cost','07 · Extension setup in chat','08 · Extension / Loading · Empty · Access'];
for(let i=0;i<order.length;i++){const n=await figma.getNodeByIdAsync(order[i]);n.name=names[i];n.x=200+(i%3)*1560;n.y=740+Math.floor(i/3)*1180;changed.push(n.id);}
page.flowStartingPoints=[{nodeId:'14:2',name:'fits · Chat to store'},{nodeId:'17:2',name:'Extension missing · Inline setup'}];changed.push(page.id);figma.viewport.scrollAndZoomIntoView([ready]);
return {createdNodeIds:made,mutatedNodeIds:[...new Set(changed)],deletedNodeIds:removed,component:{id:button.id,name:button.name,labelProperty:prop},inlineStores:{frameId:ready.id,container:stores.id,buttons:[{id:amazon.id,label:'Amazon',destination:'18:2'},{id:ali.id,label:'AliExpress',url:'https://www.aliexpress.com/w/wholesale-wireless-noise-cancelling-headphones.html'},{id:ebay.id,label:'eBay',url:'https://www.ebay.com/sch/i.html?_nkw=wireless+noise+cancelling+headphones'},{id:rakuten.id,label:'Rakuten',url:'https://search.rakuten.co.jp/search/mall/wireless+noise+cancelling+headphones/'}]},installChat:{frameId:install.id,installButton:add.id,continueButton:check.id},remainingFrameIds:['13:2',...order],readyContentBottom:(await figma.getNodeByIdAsync('32:230')).y+(await figma.getNodeByIdAsync('32:230')).height,composerTop:824};
