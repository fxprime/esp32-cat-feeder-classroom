import { createLayout } from './model.js';

// Explicit teaching model, not a measurement or the protection rating of an ESP32.
export const circuitModel = Object.freeze({
  supplyVoltage: 3.3, sourceResistance: 0.5, currentLimit: 0.1,
  wireResistance: 0.1, resistorResistance: 330,
  ledForwardVoltage: 2.0, ledDynamicResistance: 10,
  ledWarningCurrent: 0.02, visibleCurrent: 1e-6,
});
const GMIN = 1e-10; // numerical reference for floating nodes; never rendered as flow

function gaussian(a, b) {
  const n=b.length;
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let row=col+1;row<n;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
    if(Math.abs(a[pivot][col])<1e-15)throw Error('Singular circuit');
    [a[col],a[pivot]]=[a[pivot],a[col]];[b[col],b[pivot]]=[b[pivot],b[col]];
    for(let row=col+1;row<n;row++){
      const factor=a[row][col]/a[col][col];if(!factor)continue;
      for(let j=col;j<n;j++)a[row][j]-=factor*a[col][j];
      b[row]-=factor*b[col];
    }
  }
  const result=new Float64Array(n);
  for(let row=n-1;row>=0;row--){let v=b[row];for(let col=row+1;col<n;col++)v-=a[row][col]*result[col];result[row]=v/a[row][row];}
  return result;
}

export function analyzeCircuit(wires,count) {
  const layout=createLayout(count), points=new Map(layout.points.map(p=>[p.id,p]));
  const net=id=>points.get(id)?.net||id;
  const validWires=wires.filter(w=>points.has(w.from)&&points.has(w.to));
  const components=[];
  for(let i=1;i<=count;i++){
    components.push({id:`R${i}`,kind:'resistor',from:`R${i}.1`,to:`R${i}.2`,r:circuitModel.resistorResistance});
    components.push({id:`L${i}`,kind:'led',from:`L${i}.A`,to:`L${i}.K`,r:circuitModel.ledDynamicResistance,vf:circuitModel.ledForwardVoltage,bit:i-1});
  }
  const edges=[...validWires.map(w=>({...w,kind:'wire',r:circuitModel.wireResistance})),...components];
  const nodeNames=[...new Set(layout.points.map(p=>net(p.id)))].filter(n=>n!=='rail.N');
  const indices=new Map(nodeNames.map((name,i)=>[name,i]));
  const index=id=>indices.get(net(id));
  function solve(mode,mask){
    const n=nodeNames.length,a=Array.from({length:n},()=>new Float64Array(n)),b=new Float64Array(n);
    for(let i=0;i<n;i++)a[i][i]=GMIN;
    function stamp(from,to,resistance,drop=0){
      const i=index(from),j=index(to),g=1/resistance;
      if(i!==undefined){a[i][i]+=g;b[i]+=drop*g;}
      if(j!==undefined){a[j][j]+=g;b[j]-=drop*g;}
      if(i!==undefined&&j!==undefined){a[i][j]-=g;a[j][i]-=g;}
    }
    for(const edge of edges){
      if(edge.kind==='led'&&!(mask&(1<<edge.bit)))continue;
      stamp(edge.from,edge.to,edge.r,edge.vf||0);
    }
    const p=indices.get('rail.P');
    if(mode==='CV'){a[p][p]+=1/circuitModel.sourceResistance;b[p]+=circuitModel.supplyVoltage/circuitModel.sourceResistance;}
    else b[p]+=circuitModel.currentLimit;
    const values=gaussian(a,b);
    const voltage=id=>net(id)==='rail.N'?0:values[index(id)];
    for(const led of components.filter(c=>c.kind==='led')){
      const drop=voltage(led.from)-voltage(led.to),on=!!(mask&(1<<led.bit));
      if(on&&(drop-led.vf)/led.r < -1e-7)return null;
      if(!on&&drop>led.vf+1e-6)return null;
    }
    const current=mode==='CV'?(circuitModel.supplyVoltage-voltage('rail.P'))/circuitModel.sourceResistance:circuitModel.currentLimit;
    if(mode==='CC'&&(voltage('rail.P')<-.00001||voltage('rail.P')>circuitModel.supplyVoltage-circuitModel.sourceResistance*circuitModel.currentLimit+.00001))return null;
    return {mode,voltage,current:Math.max(0,current),mask};
  }
  function operatingPoint(mode){for(let mask=0;mask<2**count;mask++){const point=solve(mode,mask);if(point)return point;}return null;}
  let point=operatingPoint('CV');
  if(point&&point.current>circuitModel.currentLimit+1e-7)point=operatingPoint('CC');
  if(!point)throw Error('No DC operating point for this circuit');
  const clean=v=>Math.abs(v)<circuitModel.visibleCurrent?0:v;
  const currents=edges.map(edge=>{
    const voltage=point.voltage(edge.from)-point.voltage(edge.to);
    const current=edge.kind==='led'&&!(point.mask&(1<<edge.bit))?0:(voltage-(edge.vf||0))/edge.r;
    const inserted=edge.kind==='wire'||[edge.from,edge.to].every(id=>validWires.some(w=>w.from===id||w.to===id));
    return {...edge,inserted,voltage,current:clean(current),power:Math.max(0,voltage*current)};
  });
  // A wire-only path is a supply short, independent of quiz completeness.
  const graph=new Map();
  for(const w of validWires){const a=net(w.from),b=net(w.to);if(a===b)continue;for(const [x,y] of [[a,b],[b,a]])graph.set(x,[...(graph.get(x)||[]),{to:y,id:w.id}]);}
  const visited=new Set(['rail.P']),queue=['rail.P'],previous=new Map();
  while(queue.length&&!visited.has('rail.N')){const at=queue.shift();for(const edge of graph.get(at)||[])if(!visited.has(edge.to)){visited.add(edge.to);previous.set(edge.to,{from:at,id:edge.id});queue.push(edge.to);}}
  const shortWireIds=[];
  if(visited.has('rail.N'))for(let at='rail.N';at!=='rail.P';){const edge=previous.get(at);shortWireIds.push(edge.id);at=edge.from;}
  // KCL reconstructs current along the actual copper strip between used holes.
  const outflow=new Map(layout.points.filter(p=>p.type==='hole').map(p=>[p.id,0]));
  for(const edge of currents.filter(e=>e.kind==='wire')){
    if(outflow.has(edge.from))outflow.set(edge.from,outflow.get(edge.from)+edge.current);
    if(outflow.has(edge.to))outflow.set(edge.to,outflow.get(edge.to)-edge.current);
  }
  outflow.set('P1',-point.current);outflow.set('N1',point.current);
  const groups=new Map();
  for(const p of layout.points.filter(p=>p.type==='hole'))groups.set(p.net,[...(groups.get(p.net)||[]),p]);
  const copper=[];
  for(const [name,holes] of groups){
    holes.sort((a,b)=>name.startsWith('rail.')?a.x-b.x:a.y-b.y);
    let accumulated=0;
    for(let i=0;i<holes.length-1;i++){
      accumulated-=outflow.get(holes[i].id)||0;
      if(Math.abs(accumulated)>=circuitModel.visibleCurrent)copper.push({from:holes[i],to:holes[i+1],current:accumulated,net:name});
    }
  }
  return {
    model:circuitModel,mode:point.mode,totalCurrent:clean(point.current),railVoltage:point.voltage('rail.P'),
    shortCircuit:shortWireIds.length>0,shortWireIds,
    wires:currents.filter(e=>e.kind==='wire'),leds:currents.filter(e=>e.kind==='led'),resistors:currents.filter(e=>e.kind==='resistor'),copper,
    overcurrent:currents.filter(e=>e.kind==='led'&&e.current>circuitModel.ledWarningCurrent+1e-6).map(e=>e.id),
  };
}
