import {carPose, driveCourse, driveTrack, dropTarget, heightAt, lapLength, trackPoint} from './drive-model.js';

const colors = {
  delay:{top:'#f8b65c', rear:'#c47226', right:'#db8835', front:'#eb9d46', left:'#e4a24f'},
  millis:{top:'#61dfe8', rear:'#16809e', right:'#24a6bd', front:'#42bad0', left:'#379eb8'},
  shade:{top:'#415169', rear:'#182334', right:'#28354a', front:'#29384d', left:'#28354a'},
  glass:{top:'#a6d4e8', rear:'#41697e', right:'#597e99', front:'#6b9db3', left:'#658fa8'},
  crate:{top:'#f6cb83', rear:'#bf8146', right:'#ac6930', front:'#ca8946', left:'#d79b55'},
};

const ground = (x,z) => ({x,y:0,z});

function point(pose, x, y, z) {
  const cos = Math.cos(pose.yaw), sin = Math.sin(pose.yaw);
  return {x:pose.x + x*cos + z*sin, y, z:pose.z - x*sin + z*cos};
}

function projector(width, height, eye, yaw, shake) {
  const focal=Math.max(width*.86,height*.78);
  const pitch=.55, cos=Math.cos(pitch), sin=Math.sin(pitch);
  const forwardX=Math.sin(yaw), forwardZ=Math.cos(yaw);
  const space=({x,y,z})=>{
    const dx=x-eye.x,dz=z-eye.z,up=y-eye.y;
    const forward=dx*forwardX+dz*forwardZ;
    return {x:dx*forwardZ-dz*forwardX, up:up*cos+forward*sin, depth:forward*cos-up*sin};
  };
  const pixel=({x,up,depth})=>({
    x:width*.5+focal*x/Math.max(.75,depth)+shake,
    y:height*.49-focal*up/Math.max(.75,depth),
    depth,
  });
  const project=world=>pixel(space(world));
  project.groundPolygon=points=>{
    const corners=points.map(space), visible=[];
    for (const [index,a] of corners.entries()) {
      const b=corners[(index+1)%corners.length];
      const front=a.depth>=.75, nextFront=b.depth>=.75;
      if (front) visible.push(a);
      if (front!==nextFront) {
        const t=(.75-a.depth)/(b.depth-a.depth);
        visible.push({x:a.x+(b.x-a.x)*t,up:a.up+(b.up-a.up)*t,depth:.75});
      }
    }
    return visible.map(pixel);
  };
  return project;
}

function line(ctx, points, stroke, width = 1) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function polygon(ctx, points, color) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

const faces = [
  ['rear',[0,4,5,1]], ['right',[1,5,6,2]], ['front',[2,6,7,3]],
  ['left',[3,7,4,0]], ['top',[4,7,6,5]],
];

function solid(ctx, project, pose, x, bottom, z, width, length, height, palette, narrowed = 1) {
  const rectangle = [[-1,-1],[1,-1],[1,1],[-1,1]];
  const vertices = [0,1].flatMap(level=>rectangle.map(([dx,dz])=>
    project(point(pose, x+dx*width/2*(level?narrowed:1), bottom+level*height, z+dz*length/2*(level?narrowed:1))),
  ));
  const sides = faces.map(([name,indices])=>{
    const shape = indices.map(index=>vertices[index]);
    const [a,b,c] = shape;
    const visible = (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x) > 0;
    const depth = shape.reduce((sum,p)=>sum+p.depth,0)/4;
    return {shape,depth,visible,color:palette[name]};
  }).filter(side=>side.visible).sort((a,b)=>b.depth-a.depth);
  for (const side of sides) polygon(ctx, side.shape, side.color);
}

function surface(ctx, project, pose, x1, x2, z1, z2, y, color) {
  const corners = [[x1,z1],[x2,z1],[x2,z2],[x1,z2]];
  polygon(ctx, corners.map(([x,z])=>project(point(pose,x,y,z))), color);
}

const trackPaint=[];
const groundQuad=(x1,x2,z1,z2)=>[ground(x1,z1),ground(x2,z1),ground(x2,z2),ground(x1,z2)];
function put(points,color) {
  trackPaint.push({points,color});
}
function strip(from,to,left,right,color) {
  put([trackPoint(from,left),trackPoint(from,right),trackPoint(to,right),trackPoint(to,left)]
    .map(({x,z})=>ground(x,z)),color);
}
function fieldStroke(x,z,toX,toZ,width=.065) {
  const length=Math.hypot(toX-x,toZ-z);
  const offsetX=-(toZ-z)*width/(2*length), offsetZ=(toX-x)*width/(2*length);
  put([ground(x+offsetX,z+offsetZ),ground(toX+offsetX,toZ+offsetZ),
    ground(toX-offsetX,toZ-offsetZ),ground(x-offsetX,z-offsetZ)],'#eef9e8');
}
function drawFieldGeometry() {
  for (let i=0;i<8;i++) put(groundQuad(-5.65,5.65,-12+i*3,-9+i*3),i%2?'#72a66d':'#7bad72');
  for (const x of [-5.65,5.65]) fieldStroke(x,-12,x,12);
  for (const z of [-12,0,12]) fieldStroke(-5.65,z,5.65,z);
  for (let i=0;i<36;i++) {
    const turn=i*Math.PI/18,next=(i+1)*Math.PI/18;
    fieldStroke(Math.cos(turn)*1.45,Math.sin(turn)*1.45,Math.cos(next)*1.45,Math.sin(next)*1.45);
  }
  for (const sign of [-1,1]) {
    for (const [width,depth] of [[3,2.8],[1.5,1.1]]) {
      for (const x of [-width,width]) fieldStroke(x,sign*12,x,sign*(12-depth));
      fieldStroke(-width,sign*(12-depth),width,sign*(12-depth));
    }
  }
}
drawFieldGeometry();
const halfTrack=driveTrack.laneWidth*driveTrack.lanes/2;
const pieces=Math.ceil(lapLength/1.25);
for (let i=0;i<pieces;i++) {
  const a=lapLength*i/pieces,b=lapLength*(i+1)/pieces;
  strip(a,b,-halfTrack-.18,halfTrack+.18,'#404955');
  strip(a,b,-halfTrack,halfTrack,'#303c4c');
  const curb=i%2?'#edf1ef':'#cf5f50';
  strip(a,b,-halfTrack-.18,-halfTrack+.04,curb);
  strip(a,b,halfTrack-.04,halfTrack+.18,curb);
  for (const divider of [-2.2,0,2.2]) {
    strip(a,a+(b-a)*(divider===0?1:.55),divider-.027,divider+.027,divider===0?'#a4b9c7':'#d6e1e7');
  }
}
for (let column=0;column<28;column++) {
  const left=-halfTrack+column*halfTrack/14,right=left+halfTrack/14;
  const s=driveTrack.start;
  strip(s-.28,s,left,right,column%2?'#eceff4':'#18232b');
  strip(s,s+.28,left,right,column%2?'#18232b':'#eceff4');
}

function shadow(ctx, project, pose, width, length, opacity) {
  const samples = 20;
  const ring = Array.from({length:samples},(_,i)=>{
    const turn=i/samples*Math.PI*2;
    return project(point(pose,Math.cos(turn)*width,0.023,Math.sin(turn)*length));
  });
  polygon(ctx,ring,`rgba(13,34,52,${opacity})`);
}

function car(ctx, project, kind, pose, braking) {
  const palette = colors[kind];
  shadow(ctx,project,pose,1.06,1.5,.27);
  for (const x of [-.77,.77]) {
    for (const z of [-.76,.77]) {
      solid(ctx,project,pose,x,.06,z,.39,.57,.46,colors.shade,.87);
    }
  }
  solid(ctx,project,pose,0,.3,-.01,1.64,2.38,.47,palette,.95);
  solid(ctx,project,pose,0,.77,-.2,1.22,1.2,.48,colors.glass,.76);
  surface(ctx,project,pose,-.37,.37,-.62,.24,1.254,palette.top);
  surface(ctx,project,pose,-.09,.09,-.6,.22,1.258,'#eaf9ff');
  surface(ctx,project,pose,-.55,.55,.56,1.05,.774,palette.top);
  for (const x of [-.55,.55]) {
    const lamp = [[x-.16,.55],[x+.16,.55],[x+.16,.7],[x-.16,.7]];
    polygon(ctx,lamp.map(([lx,y])=>project(point(pose,lx,y,-1.16))),braking?'#fff0b2':'#f5a280');
  }
}

function crate(ctx,project,pose,lift) {
  shadow(ctx,project,pose,.67,.64,lift>.3?.12:.29);
  const width=driveCourse.boxHalf*2;
  solid(ctx,project,pose,0,lift,0,width,width,1.05,colors.crate);
  surface(ctx,project,pose,-.12,.12,-.53,.53,lift+1.055,'#fff0b8');
  const rear = [[-.12,lift+.65],[.12,lift+.65],[.12,lift+1.05],[-.12,lift+1.05]];
  polygon(ctx,rear.map(([x,y])=>project(point(pose,x,y,-.535))),'#edd2a0');
}

function dropMarker(ctx,project,pose) {
  surface(ctx,project,pose,-.67,.67,-.67,.67,.025,'#fbbf2440');
  const outline = [[-.67,-.67],[.67,-.67],[.67,.67],[-.67,.67],[-.67,-.67]];
  ctx.setLineDash([5,4]);
  line(ctx,outline.map(([x,z])=>project(point(pose,x,.035,z))),'#ffcf70',1.7);
  ctx.setLineDash([]);
}

function scanner(ctx,project,pose,length,detected) {
  const nose=driveCourse.nose;
  const p=(x,z)=>project(point(pose,x,.045,z));
  const tip=nose+length;
  polygon(ctx,[p(-.29,nose),p(.29,nose),p(1.1,tip),p(-1.1,tip)],detected?'#53e7f46b':'#53e7f43a');
  line(ctx,[p(-.79,nose+length*.68),p(.79,nose+length*.68)],'#95eff6a8',1);
  line(ctx,[p(-1.1,tip),p(1.1,tip)],'#95eff6c4',1);
}

function burst(ctx,project,pose,ratio) {
  if (ratio <= 0 || ratio >= 1) return;
  const origin = project(point(pose,0,.76,-.46));
  const size = (10 + ratio*28) * 54 / origin.depth;
  ctx.globalAlpha = (1-ratio)*.95;
  for (let i=0;i<6;i++) {
    const angle=i*Math.PI/3;
    const dx=Math.cos(angle)*size, dy=Math.sin(angle)*size;
    line(ctx,[{x:origin.x+dx*.35,y:origin.y+dy*.35},{x:origin.x+dx,y:origin.y+dy}],'#ffc971',2.2);
  }
  ctx.globalAlpha = 1;
}

function scenery(ctx,project,width,height) {
  const fade=ctx.createLinearGradient(0,0,0,height);
  fade.addColorStop(0,'#dfebf7');
  fade.addColorStop(.25,'#b9cfb9');
  fade.addColorStop(1,'#89ad97');
  ctx.fillStyle=fade;
  ctx.fillRect(0,0,width,height);
  for (const patch of trackPaint) {
    const corners=project.groundPolygon(patch.points);
    if (corners.length<3 || corners.every(p=>p.x<0) || corners.every(p=>p.x>width)
      || corners.every(p=>p.y<0) || corners.every(p=>p.y>height)) continue;
    polygon(ctx,corners,patch.color);
  }

  for (const sign of [-1,1]) {
    const goalZ=(12+.16)*sign;
    const points=[{x:-1.35,y:0,z:goalZ},{x:-1.35,y:1.04,z:goalZ},
      {x:1.35,y:1.04,z:goalZ},{x:1.35,y:0,z:goalZ}].map(project);
    if (points.every(p=>p.depth>=1.2)) line(ctx,points,'#f1f7ed',1.8);
  }
}

function drawScene(ctx,width,height,frame,kind) {
  const own=frame[kind];
  const pose=carPose(own);
  const yaw=trackPoint(own.station+1.2,own.offset).yaw;
  const eye={x:pose.x-Math.sin(yaw)*7.45,y:5.95,z:pose.z-Math.cos(yaw)*7.45};
  const impact=own.hitAt===null ? -1 : frame.time-own.hitAt;
  const shake=frame.animate && impact>0 && impact<220 ? Math.sin(impact*.12)*(1-impact/220)*width*.013 : 0;
  const project=projector(width,height,eye,yaw,shake);
  scenery(ctx,project,width,height);
  const braking=own.mode==='braking'||own.mode==='stopped';
  const reading=own.lastReadAt!==null && frame.time-own.lastReadAt<90;
  if ((braking||reading) && own.mode!=='collision') {
    scanner(ctx,project,pose,driveCourse.lookAhead,braking||own.mode==='dodging');
  }
  const objects=[{depth:project(point(pose,0,.55,0)).depth,draw:()=>car(ctx,project,kind,pose,braking)}];
  for (const box of own.boxes) {
    const age=box.hitAt===null ? -1 : frame.time-box.hitAt;
    const slide=age<0 ? 0 : 1-Math.exp(-age/135);
    const parcel=trackPoint(box.station+slide*.55,box.offset-slide*.14);
    parcel.yaw-=slide*.35;
    const lift=heightAt(box,frame.time);
    const depth=project(point(parcel,0,lift+.5,0)).depth;
    if (depth<1.8 || depth>56) continue;
    objects.push({depth,draw:()=>crate(ctx,project,parcel,lift)});
    if (frame.animate && age>=0) objects.push({depth:0,draw:()=>burst(ctx,project,parcel,age/370)});
  }
  if (frame.markers) {
    const target=dropTarget(own);
    const marker=trackPoint(target.station,target.offset);
    if (project(point(marker,0,0,0)).depth>1.75) dropMarker(ctx,project,marker);
  }
  objects.sort((a,b)=>b.depth-a.depth).forEach(object=>object.draw());
}

export function createDriveScene(canvas,kind) {
  const context=canvas.getContext('2d');
  if (!context) return ()=>{};
  let current;
  let width=0,height=0,ratio=1;
  function render() {
    if (!current || !width || !height) return;
    context.setTransform(ratio,0,0,ratio,0,0);
    drawScene(context,width,height,current,kind);
  }
  new ResizeObserver(([entry])=>{
    ({width,height}=entry.contentRect);
    if (!width || !height) return;
    ratio=Math.min(window.devicePixelRatio || 1,2);
    canvas.width=Math.round(width*ratio);
    canvas.height=Math.round(height*ratio);
    render();
  }).observe(canvas);
  return frame=>{
    current=frame;
    render();
  };
}
