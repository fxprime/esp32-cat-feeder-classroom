import {sketchLine as line} from './timing-lessons.js';

export const duck = {voice:'Quack',legs:2};
export const functionLessons = [
  {
    id:'function-void', label:'ตักขนมแบบ void', title:'ตักขนมให้โมจิ',
    intro:'ส่งจำนวนขนมให้ giveTreats() แล้วดูชามของโมจิ คำสั่งเรียกครั้งแรกตัก 2 ชิ้น ครั้งต่อไปเติมอีก 1 ชิ้น',
    challenge:'ชามมีขนมกี่ชิ้นหลังเรียก giveTreats() ทั้งสองครั้ง?',
    file:'05a_cat_treats.ino', mode:5,
  },
  {
    id:'function-return', label:'ทายแมวด้วย return', title:'เสียงนี้ใช่แมวไหม?',
    intro:'catVoice() ส่งคำว่า Meaw กลับมา แล้ว checkCat() ดูว่าเสียงตรงกันและมี 4 ขาหรือเปล่า ลองเทียบกับเจ้าเป็ดด้วย',
    challenge:'ดูค่า true หรือ false ตอน return แล้วตามไปดูว่ามันถูกเก็บลงกล่องไหน',
    file:'05b_check_cat.ino', mode:3,
  },
  {
    id:'function-reference', label:'จัดกล่องผ่าน &', title:'จัดกล่องขนมให้โมจิ',
    intro:'ส่งกล่องขนมกับจำนวนชิ้นเข้าไปใน packSnack() เครื่องหมาย & ให้ฟังก์ชันเติมของลงกล่องเดิมได้เลย',
    challenge:'ตอนเปลี่ยนจากกล่องว่างเป็นทูน่า ตัวแปร snack อยู่ฝั่งไหน และจำนวนชิ้นเปลี่ยนแล้วหรือยัง?',
    file:'05c_pack_snack.ino', mode:4,
  },
];

const local=(name,type,constant=false)=>({name,type,scope:constant?'loop / const':'loop'});
const param=(name,type,fn)=>({name,type,scope:`${fn} / parameter`});
const bowl={name:'bowl',type:'int',scope:'global'};
const annotated=(row,flow)=>({...row,flow});

function enter(id,code,fn,variable,{references,extra}={}){
  return annotated(line(id,code,`เข้า ${fn}()`,'รับค่าที่ส่งมาจากบรรทัดที่เรียก','after',variable),{
    enter:fn, references, extra,
    effect:references?{kind:'reference',icon:'branch',label:'snackOut ↔ snack · piecesOut ↔ pieces'}:null,
  });
}

function call(id,code,fn,target,variable,clear){
  const label=variable?`เก็บค่าที่ได้ไว้ใน ${variable.name}`:'กลับไปทำบรรทัดถัดไปใน loop()';
  return annotated(line(id,code,`เรียก ${fn}()`,label,'call',variable),{
    call:{kind:'jump',symbol:fn,icon:'call',label:`เข้า ${fn}()`,target},
    effect:variable
      ? {kind:'assign',symbol:variable.name,icon:'call',label:`return → ${variable.name}`,source:'return',destination:variable.destination,resumed:true}
      : {kind:'jump',icon:'call',label:'กลับมาที่ loop()',resumed:true},
    clear,
  });
}

function returns(id,code,type,explain){
  return annotated(line(id,code,`ส่ง ${type==='string'?'String':type} กลับด้วย return`,explain,'return',{name:'return',type,scope:'ค่าที่ส่งกลับ'}),{
    effect:{kind:'return',symbol:'return',icon:'call'},
  });
}

function updates(id,code,title,explain,variable,symbol,label,destination){
  return annotated(line(id,code,title,explain,'after',variable),{
    effect:{kind:variable.scope==='global'?'scene':'reference',symbol,icon:'branch',label,destination},
  });
}

const feed = {
  helpers:[
    line('cat-bowl','int bowl = 0;','เตรียมชามเปล่า','เริ่มด้วยขนม 0 ชิ้น','global',bowl),
    enter('cat-feed-enter','void giveTreats(int amount) {','giveTreats',param('amount','int','giveTreats')),
    updates('cat-feed-add','  bowl += amount;','เติมขนม','เพิ่มจำนวนที่ส่งมาเข้าไปในชาม',bowl,'bowl','ตักขนมใส่ชาม','cat-bowl'),
    line('cat-feed-end','}','จบ giveTreats()','กลับไปที่ loop() หลังใส่ขนมแล้ว','before'),
  ],
  actions:[
    line('cat-bowl-reset','  bowl = 0;','เริ่มชามใหม่','นับจำนวนขนมในชามจากศูนย์','after',bowl),
    call('cat-call-feed-two','  giveTreats(2);','giveTreats','cat-feed-enter',null,['amount']),
    call('cat-call-feed-one','  giveTreats(1);','giveTreats','cat-feed-enter',null,['amount']),
  ],
};

const check = {
  helpers:[
    enter('cat-voice-enter','String catVoice() {','catVoice',null),
    returns('cat-voice-return','  return String("Meaw");','string','ส่งข้อความ Meaw กลับไปเก็บใน voice'),
    line('cat-voice-end','}','จบ catVoice()','ส่งเสียงกลับไปยังคนที่เรียก','none'),
    enter('cat-check-enter','bool checkCat(String sound, int paws) {','checkCat',param('sound','string','checkCat'),{extra:param('paws','int','checkCat')}),
    returns('cat-check-return','  return sound == "Meaw" && paws == 4;','bool','ถ้าเสียงเป็น Meaw และมี 4 ขา จะได้ true เงื่อนไขอื่นจะได้ false'),
    line('cat-check-end','}','จบ checkCat()','ส่งคำตอบกลับไปเก็บในตัวแปร','none'),
  ],
  actions:[
    call('cat-call-voice','  String voice = catVoice();','catVoice','cat-voice-enter',{...local('voice','string'),destination:'cat-voice'},['return']),
    line('cat-legs','  const int legs = 4;','นับขาของโมจิ','เก็บเลข 4 ไว้ใน legs','after',local('legs','int',true)),
    call('cat-call-check','  bool isCat = checkCat(voice, legs);','checkCat','cat-check-enter',{...local('isCat','bool'),destination:'cat-answer'},['sound','paws','return']),
    call('cat-call-duck',`  bool isDuckCat = checkCat("${duck.voice}", ${duck.legs});`,'checkCat','cat-check-enter',{...local('isDuckCat','bool'),destination:'duck-answer'},['sound','paws','return']),
  ],
};

const pack = {
  helpers:[
    enter('cat-pack-enter','void packSnack(String &snackOut, int &piecesOut) {','packSnack',null,{references:{snack:'snackOut',pieces:'piecesOut'}}),
    updates('cat-pack-snack','  snackOut = "Tuna";','ใส่ทูน่าลงกล่อง','snackOut อ้างถึง snack กล่องใน loop() จึงเปลี่ยนทันที',{...local('snack','string'),expression:'snackOut'},'snackOut','ใส่ทูน่าลงกล่องเดิม','cat-snack'),
    updates('cat-pack-pieces','  piecesOut = 2;','ใส่ขนมสองชิ้น','piecesOut ใช้ตัวแปร pieces กล่องเดิมจึงนับได้ 2 ชิ้น',{...local('pieces','int'),expression:'piecesOut'},'piecesOut','อัปเดตจำนวนขนมเป็น 2','cat-pieces'),
    line('cat-pack-end','}','จบ packSnack()','ทูน่าและจำนวนชิ้นยังอยู่ในกล่องเดิม','before'),
  ],
  actions:[
    line('cat-snack-init','  String snack = "Empty";','เปิดกล่องว่าง','ยังไม่มีขนมอยู่ในกล่อง','after',local('snack','string')),
    line('cat-pieces-init','  int pieces = 0;','เริ่มนับที่ศูนย์','ยังไม่มีขนมสักชิ้น','after',local('pieces','int')),
    call('cat-call-pack','  packSnack(snack, pieces);','packSnack','cat-pack-enter',null,[]),
  ],
};

const sketches={'function-void':feed,'function-return':check,'function-reference':pack};
export function functionProgram(id){
  const meta=functionLessons.find(example=>example.id===id);
  const {helpers,actions}=sketches[id];
  return {meta,lines:[
    ...helpers,
    line('setup-open','void setup() {','setup()','เตรียมเริ่มตัวอย่าง'),
    line('setup-close','}','จบ setup()','เริ่มเล่นใน loop() ได้เลย','before'),
    line('loop-open','void loop() {','เริ่มรอบ','ลองตามค่าจากบรรทัดที่เรียกเข้าไปในฟังก์ชัน'),
    ...actions,
    line('wait-on','  delay(1000);','พักสักครู่','รอหนึ่งวินาทีก่อนเริ่มใหม่','sleep'),
    line('loop-close','}','จบ loop()','เริ่มเรื่องใหม่อีกรอบ','before'),
  ]};
}
