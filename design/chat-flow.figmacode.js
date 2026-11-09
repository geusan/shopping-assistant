const page = figma.currentPage;
const roots = await Promise.all(['14:2','15:2'].map(id => figma.getNodeByIdAsync(id)));
const logoSource = await figma.getNodeByIdAsync('25:10');
const brand = await figma.variables.getVariableByIdAsync('VariableID:25:4');
const surface = await figma.variables.getVariableByIdAsync('VariableID:25:6');
const existingFonts = new Map();
for (const root of [...roots, logoSource]) for (const t of root.findAllWithCriteria({types:['TEXT']})) {
  for (const seg of t.getStyledTextSegments(['fontName'])) existingFonts.set(JSON.stringify(seg.fontName), seg.fontName);
}
await Promise.all([...existingFonts.values()].map(f => figma.loadFontAsync(f)));
await Promise.all(['Regular','SemiBold','Bold'].map(style => figma.loadFontAsync({family:'Pretendard',style})));

const created = [], mutated = [], deleted = [];
function rgb(hex) {return {r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255};}
function paint(hex) {
  let p = {type:'SOLID', color:rgb(hex)};
  if (hex==='#164e39') p=figma.variables.setBoundVariableForPaint(p,'color',brand);
  if (hex==='#ffffff') p=figma.variables.setBoundVariableForPaint(p,'color',surface);
  return p;
}
function track(n) {created.push(n.id);return n;}
function stack(parent,name,w,direction='VERTICAL',gap=0) {
  const n=track(figma.createAutoLayout(direction));n.name=name;
  parent.appendChild(n);n.resize(w,1);n.fills=[];
  n.primaryAxisSizingMode=direction==='VERTICAL'?'AUTO':'FIXED';n.counterAxisSizingMode=direction==='VERTICAL'?'FIXED':'AUTO';n.itemSpacing=gap;
  n.layoutSizingHorizontal='FIXED';return n;
}
function text(parent,value,size=17,weight='Regular',color='#182c25',width=null,line=28) {
  const n=track(figma.createText());n.fontName={family:'Pretendard',style:weight};n.fontSize=size;
  n.lineHeight={unit:'PIXELS',value:line};n.fills=[paint(color)];n.characters=value;n.name=value.slice(0,45);
  parent.appendChild(n);
  if(width!==null){n.resize(width,line);n.textAutoResize='HEIGHT';}else n.textAutoResize='WIDTH_AND_HEIGHT';
  return n;
}
const paths={send:'<path d="M12 19V5m-6 6 6-6 6 6"/>',edit:'<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15l-1 5Z"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>'};
function icon(parent,kind,size=20,color='#164e39') {
  const n=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths[kind]+'</svg>');
  n.name='Icon / '+kind;parent.appendChild(n);created.push(n.id,...n.findAll(()=>true).map(c=>c.id));return n;
}
function mark(parent) {
  const n=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M5 9v14h8M19 9h8v14" stroke="#164e39" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="m11 16 4 4 7-9" stroke="#164e39" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  n.name='fits / Assistant';parent.appendChild(n);created.push(n.id,...n.findAll(()=>true).map(c=>c.id));return n;
}
function fixed(n,w,h){n.resize(w,h);n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';return n;}
function pad(n,v,h=v){n.paddingTop=n.paddingBottom=v;n.paddingLeft=n.paddingRight=h;}
async function navigate(n,destination) {
  await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:destination,navigation:'NAVIGATE',transition:{type:'DISSOLVE',duration:0.2,easing:{type:'EASE_OUT'}},resetScrollPosition:true}]}]);mutated.push(n.id);
}

// Build the two repeated primitives once. Their main components sit below the screens.
const headerFrame=stack(page,'Navigation / Chat',1440,'HORIZONTAL');fixed(headerFrame,1440,80);pad(headerFrame,0,48);
headerFrame.counterAxisAlignItems='CENTER';headerFrame.primaryAxisAlignItems='SPACE_BETWEEN';headerFrame.fills=[paint('#ffffff')];
const logo=logoSource.clone();headerFrame.appendChild(logo);logo.rescale(.8);created.push(logo.id,...logo.findAll(()=>true).map(n=>n.id));
const fresh=stack(headerFrame,'Action / 새 대화',110,'HORIZONTAL',9);fixed(fresh,110,40);fresh.counterAxisAlignItems='CENTER';fresh.primaryAxisAlignItems='CENTER';
icon(fresh,'edit',18,'#55675c');text(fresh,'새 대화',14,'Regular','#55675c',null,22);
const header=figma.createComponentFromNode(headerFrame);created.push(header.id);header.name='Navigation / Chat';header.description='대화로 구매 조건을 만드는 화면의 최소 헤더. 새 대화는 첫 입력 화면으로 이동합니다.';header.x=1760;header.y=4360;
await navigate(fresh,'14:2');

const composerFrame=stack(page,'Composer / Chat',760,'VERTICAL',16);pad(composerFrame,18,20);composerFrame.fills=[paint('#ffffff')];composerFrame.strokes=[paint('#d7dfd8')];composerFrame.strokeWeight=1;composerFrame.cornerRadius=16;
const entry=text(composerFrame,'무엇이든 편하게 말해주세요',17,'Regular','#182c25',720,28);entry.name='Message';
const tools=stack(composerFrame,'Composer actions',720,'HORIZONTAL');fixed(tools,720,36);tools.primaryAxisAlignItems='SPACE_BETWEEN';tools.counterAxisAlignItems='CENTER';
text(tools,'Enter로 보내기',12,'Regular','#69786d',null,20);
const send=stack(tools,'Action / 메시지 보내기',36,'HORIZONTAL');fixed(send,36,36);send.primaryAxisAlignItems='CENTER';send.counterAxisAlignItems='CENTER';send.fills=[paint('#164e39')];send.cornerRadius=18;icon(send,'send',20,'#ffffff');
const composer=figma.createComponentFromNode(composerFrame);created.push(composer.id);composer.name='Composer / Chat';composer.description='사용자 메시지 입력창. Message 텍스트 속성을 바꿀 수 있으며 화면별 전송 버튼에 다음 대화 상태를 연결합니다.';composer.x=1760;composer.y=4500;
const messageProp=composer.addComponentProperty('Message','TEXT','무엇이든 편하게 말해주세요');entry.componentPropertyReferences={characters:messageProp};

function useHeader(root){const n=header.createInstance();root.appendChild(n);n.x=0;n.y=0;created.push(n.id,...n.findAll(()=>true).map(x=>x.id));return n;}
function useComposer(root,value,y,placeholder=false){
  const n=composer.createInstance();root.appendChild(n);n.setProperties({[messageProp]:value});n.x=340;n.y=y;
  const txt=n.findAllWithCriteria({types:['TEXT']}).find(t=>t.name==='Message');
  if(placeholder)txt.fills=[paint('#69786d')];
  const button=n.findOne(x=>x.name==='Action / 메시지 보내기');
  if(placeholder)button.fills=[paint('#dce4dd')];
  created.push(n.id,...n.findAll(()=>true).map(x=>x.id));return {instance:n,send:button};
}
function clearRoot(root,name){
  for(const child of [...root.children]){deleted.push(child.id);child.remove();}
  root.name=name;root.layoutMode='NONE';root.resize(1440,1000);root.fills=[paint('#ffffff')];root.strokes=[];root.effects=[];root.clipsContent=true;
  mutated.push(root.id);useHeader(root);
}
function user(parent,value,width=520){
  const row=stack(parent,'User message',760,'HORIZONTAL');row.primaryAxisAlignItems='MAX';
  const bubble=stack(row,'User bubble',width+40,'VERTICAL');pad(bubble,14,20);bubble.fills=[paint('#f1f4f0')];bubble.cornerRadius=16;
  text(bubble,value,17,'Regular','#182c25',width,28);return row;
}
function assistant(parent,value){
  const row=stack(parent,'fits response',760,'HORIZONTAL',18);row.counterAxisAlignItems='MIN';mark(row);
  const content=stack(row,'Response content',716,'VERTICAL',12);
  if(value)text(content,value,17,'Regular','#182c25',716,28);
  return content;
}
function foot(root){const n=text(root,'대화하며 나에게 맞는 구매 조건을 최대 4개까지 정리해요.',12,'Regular','#69786d',760,20);n.textAlignHorizontal='CENTER';n.x=340;n.y=964;}

clearRoot(roots[0],'01 · 대화 시작');
const welcome=stack(roots[0],'Chat welcome',760,'VERTICAL',14);welcome.x=340;welcome.y=338;
text(welcome,'무엇을 사고 싶으세요?',34,'SemiBold','#182c25',760,46).textAlignHorizontal='CENTER';
text(welcome,'원하는 제품을 말해주시면, 구매 기준부터 함께 정리해요.',17,'Regular','#637568',760,28).textAlignHorizontal='CENTER';
const firstInput=useComposer(roots[0],'출퇴근용 무선 헤드폰을 사고 싶어.',464);
const suggestions=stack(roots[0],'Conversation suggestions',760,'HORIZONTAL',10);suggestions.x=340;suggestions.y=610;suggestions.primaryAxisAlignItems='CENTER';
for(const label of ['기내용 캐리어','매일 신을 러닝화','재택근무용 모니터']){
  const chip=stack(suggestions,'Prompt / '+label,180,'HORIZONTAL');fixed(chip,180,40);chip.primaryAxisAlignItems='CENTER';chip.counterAxisAlignItems='CENTER';chip.strokes=[paint('#e1e7e2')];chip.cornerRadius=10;
  text(chip,label,14,'Regular','#55675c',null,22);
}
foot(roots[0]);await navigate(firstInput.send,'15:2');

clearRoot(roots[1],'02 · 용도와 예산을 대화로 구체화');
const conversation=stack(roots[1],'Conversation',760,'VERTICAL',30);conversation.x=340;conversation.y=144;
user(conversation,'출퇴근용 무선 헤드폰을 사고 싶어.',338);
assistant(conversation,'좋아요. 주로 어디에서 사용하실 예정인가요?');
user(conversation,'지하철에서 쓸 거야. 가볍고,\n충전을 자주 하지 않아도 되면 좋겠어.',500);
assistant(conversation,'그럼 소음 차단, 무게, 배터리를 먼저 볼게요.\n배송비를 포함한 예산은 어느 정도인가요?');
const answerInput=useComposer(roots[1],'20만원까지 생각하고 있어.',824);foot(roots[1]);

const ready=track(figma.createFrame());ready.name='03 · 대화 안에서 구매 조건 정리';ready.resize(1440,1000);ready.fills=[paint('#ffffff')];ready.clipsContent=true;ready.x=3320;ready.y=740;useHeader(ready);
const resultThread=stack(ready,'Conversation / Criteria ready',760,'VERTICAL',24);resultThread.x=340;resultThread.y=112;
user(resultThread,'지하철에서 쓸 거야. 가볍고,\n충전을 자주 하지 않아도 되면 좋겠어.',500);
assistant(resultThread,'배송비를 포함한 예산은 어느 정도인가요?');
user(resultThread,'20만원까지 생각하고 있어.',246);
const answer=assistant(resultThread,'좋아요. 아래 네 가지를 기준으로 확인할게요.');
const rules=stack(answer,'Criteria / max 4',716,'VERTICAL');
const rows=[['1','노이즈 캔슬링','지원'],['2','가벼운 무게','250g 이하'],['3','넉넉한 배터리','30시간 이상'],['4','배송비를 포함한 총액','20만원 이하']];
for(const [num,name,value] of rows){
  const row=stack(rules,'Criterion / '+name,716,'HORIZONTAL',14);fixed(row,716,46);row.counterAxisAlignItems='CENTER';
  text(row,num,13,'Regular','#69786d',20,22);text(row,name,16,'Regular','#182c25',420,26);
  const val=text(row,value,16,'SemiBold','#164e39',248,26);val.textAlignHorizontal='RIGHT';
  row.strokes=[paint('#e6ebe5')];row.strokeTopWeight=0;row.strokeLeftWeight=0;row.strokeRightWeight=0;row.strokeBottomWeight=1;
}
text(answer,'250g·30시간은 추천 기준이에요. 원하시는 기준으로 바꿀 수 있어요.',13,'Regular','#637568',716,22);
const confirm=stack(answer,'Action / 이 조건으로 쇼핑몰 선택',268,'HORIZONTAL',18);fixed(confirm,268,48);pad(confirm,0,20);confirm.counterAxisAlignItems='CENTER';confirm.primaryAxisAlignItems='SPACE_BETWEEN';confirm.cornerRadius=10;confirm.fills=[paint('#164e39')];text(confirm,'이 조건으로 쇼핑몰 선택',15,'SemiBold','#ffffff',null,24);icon(confirm,'arrow',18,'#ffffff');
text(answer,'조건 4개 / 최대 4개 · 바꾸고 싶은 조건은 아래에서 말해주세요.',12,'Regular','#69786d',716,20);
useComposer(ready,'예: 무게를 200g 이하로 바꿔줘',824,true);foot(ready);
await navigate(answerInput.send,ready.id);await navigate(confirm,'16:2');
const edit=await figma.getNodeByIdAsync('18:238');await navigate(edit,ready.id);

const ordered=[roots[0],roots[1],ready,...await Promise.all(['16:2','17:2','18:2','19:2','20:2','21:2'].map(id=>figma.getNodeByIdAsync(id)))];
const labels=['01 · 대화 시작','02 · 용도와 예산을 대화로 구체화','03 · 대화 안에서 구매 조건 정리','04 · 쇼핑몰 선택','05 · 확장 프로그램 설치 안내','06 · 쇼핑몰 탐색 / 확장 프로그램 연결','07 · 상품 분석 / 100% 충족','08 · 상품 분석 / 75% · 정보 부족','09 · 확장 프로그램 / 로딩 · 미감지 · 권한'];
for(let i=0;i<ordered.length;i++){const n=ordered[i];n.name=labels[i];n.x=200+(i%3)*1560;n.y=740+Math.floor(i/3)*1180;mutated.push(n.id);}
const cover=await figma.getNodeByIdAsync('13:2');const coverText=cover.findAllWithCriteria({types:['TEXT']}).find(t=>t.characters==='제품 입력');
if(coverText){for(const seg of coverText.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);coverText.characters='대화 시작';mutated.push(coverText.id);}
page.flowStartingPoints=[{nodeId:'14:2',name:'fits · 대화로 구매 조건 만들기'}];mutated.push(page.id);figma.viewport.scrollAndZoomIntoView([roots[1]]);
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],deletedNodeIds:deleted,chatFrames:[...roots,ready].map(r=>({id:r.id,name:r.name,x:r.x,y:r.y,width:r.width,height:r.height,textCount:r.findAllWithCriteria({types:['TEXT']}).length})),components:[{id:header.id,name:header.name},{id:composer.id,name:composer.name,messageProperty:messageProp}],actions:{start:firstInput.send.id,answer:answerInput.send.id,confirm:confirm.id},readyFrameId:ready.id,allFrameIds:ordered.map(n=>n.id)};
