import * as THREE from '../vendor/three.module.min.js';
import {colors, units, ports, streams} from './layout.js';

const V = p => new THREE.Vector3(...p);
const UP = new THREE.Vector3(0,1,0);
const material = (color, options={}) => new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.1,...options});
const M = {
  shell:material(0xc6cec2,{metalness:.55,roughness:.36,side:THREE.DoubleSide}),
  rim:material(0x7a8d79,{metalness:.65,roughness:.3}),
  base:material(0xdce2d5,{roughness:.9}),
  dark:material(0x53695e,{metalness:.55,roughness:.4}),
  grid:material(0x8d927b,{metalness:.7,roughness:.35}),
  ceramic:material(0xece8d8,{metalness:0,roughness:.3}),
  oil:material(colors.oil,{transparent:true,opacity:.15,depthWrite:false,side:THREE.DoubleSide,roughness:.55}),
  oily:material(colors.oily,{transparent:true,opacity:.68,depthWrite:false,side:THREE.DoubleSide}),
  vesselWater:material(colors.oily,{transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide}),
  recycle:material(colors.recycle,{transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide}),
  treated:material(colors.treated,{transparent:true,opacity:.47,depthWrite:false,side:THREE.DoubleSide}),
  rag:material(0xa49e78,{transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide}),
  glass:material(0xc8e1d7,{transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide,roughness:.2}),
  droplet:material(0xb8e4f0,{metalness:.1,roughness:.18}),
  oilDrop:material(0x62533b,{roughness:.85}),
  field:new THREE.MeshBasicMaterial({color:colors.field,transparent:true,opacity:.04,side:THREE.DoubleSide,depthWrite:false}),
  chemical:material(colors.chemical,{roughness:.5}),
};
const sphereGeo = new THREE.SphereGeometry(1,10,7);
const boxGeo = new THREE.BoxGeometry(1,1,1);

function mesh(parent,geo,mat,pos=[0,0,0]) {
  const o=new THREE.Mesh(geo,mat);o.position.copy(V(pos));parent.add(o);return o;
}
function box(parent,pos,size,mat=M.shell){const o=mesh(parent,boxGeo,mat,pos);o.scale.set(...size);return o;}
function sphere(parent,pos,r,mat=M.rim){const o=mesh(parent,sphereGeo,mat,pos);o.scale.setScalar(r);return o;}
function rod(parent,a,b,r,mat=M.rim,segments=12){
  const av=V(a),bv=V(b),d=bv.clone().sub(av);
  const o=mesh(parent,new THREE.CylinderGeometry(r,r,d.length(),segments),mat);
  o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(UP,d.normalize());return o;
}
function ring(parent,pos,r,tube,axis='x',arc=Math.PI*2,start=0,mat=M.rim){
  const geo=new THREE.TorusGeometry(r,tube,6,48,arc);
  // Torus starts in local XY. Convert to YZ (x axis) or XZ (y axis).
  if(axis==='x'){geo.rotateZ(start);geo.rotateY(Math.PI/2);}
  else if(axis==='y'){geo.rotateZ(start);geo.rotateX(Math.PI/2);}
  return mesh(parent,geo,mat,pos);
}
function flange(parent,point,axis='x',r=.14){
  const p=V(point),d=axis==='x'?new THREE.Vector3(1,0,0):axis==='y'?UP:new THREE.Vector3(0,0,1);
  rod(parent,p.clone().addScaledVector(d,-.035).toArray(),p.clone().addScaledVector(d,.035).toArray(),r,M.rim,16);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,off=axis==='x'?[0,Math.cos(a)*r*.8,Math.sin(a)*r*.8]:axis==='y'?[Math.cos(a)*r*.8,0,Math.sin(a)*r*.8]:[Math.cos(a)*r*.8,Math.sin(a)*r*.8,0];
    sphere(parent,p.clone().add(V(off)).toArray(),.018,M.dark);
  }
}

export function roundedPath(points,radius=.13){
  const pts=points.map(V),path=new THREE.CurvePath();let start=pts[0];
  for(let i=1;i<pts.length-1;i++){
    const a=pts[i-1],b=pts[i],c=pts[i+1],incoming=b.clone().sub(a),outgoing=c.clone().sub(b);
    if(incoming.length()<1e-5||outgoing.length()<1e-5)continue;
    const r=Math.min(radius,incoming.length()*.28,outgoing.length()*.28);
    if(incoming.clone().normalize().dot(outgoing.clone().normalize())>.999){continue;}
    const before=b.clone().addScaledVector(incoming.normalize(),-r),after=b.clone().addScaledVector(outgoing.normalize(),r);
    if(start.distanceTo(before)>1e-5)path.add(new THREE.LineCurve3(start,before));
    path.add(new THREE.QuadraticBezierCurve3(before,b,after));start=after;
  }
  if(start.distanceTo(pts.at(-1))>1e-5)path.add(new THREE.LineCurve3(start,pts.at(-1)));
  return path;
}
class CurveSegment extends THREE.Curve {
  constructor(curve,a,b){super();this.curve=curve;this.a=a;this.b=b;}
  getPoint(t,target=new THREE.Vector3()){return target.copy(this.curve.getPointAt(this.a+(this.b-this.a)*t));}
}
function pipe(parent,curve,r,mat,a=0,b=1){
  const c=a===0&&b===1?curve:new CurveSegment(curve,a,b);
  return mesh(parent,new THREE.TubeGeometry(c,Math.max(3,Math.ceil(curve.getLength()*(b-a)*10)),r,8,false),mat);
}
function line(parent,points,color=colors.signal,dashed=false){
  const g=new THREE.BufferGeometry().setFromPoints(points.map(V));
  const mat=dashed?new THREE.LineDashedMaterial({color,dashSize:.08,gapSize:.065,transparent:true,opacity:.8}):new THREE.LineBasicMaterial({color});
  const l=new THREE.Line(g,mat);if(dashed)l.computeLineDistances();parent.add(l);return l;
}

// A true removed shell sector, leaving the viewer-facing upper wall open.
function shellSurface(parent,c,L,r){
  const verts=[],indices=[],segments=42,start=Math.PI*.81,end=Math.PI*2.02;
  for(let j=0;j<=segments;j++){
    const a=start+(end-start)*j/segments;
    for(const x of [-L/2,L/2])verts.push(c[0]+x,c[1]+r*Math.cos(a),c[2]+r*Math.sin(a));
  }
  for(let j=0;j<segments;j++){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();mesh(parent,g,M.shell);
  for(const x of [-L/2,L/2]){
    const vs=[],is=[],N=12;
    for(let k=0;k<=N;k++)for(let j=0;j<=segments;j++){
      const t=k/N*Math.PI/2,a=start+(end-start)*j/segments;
      vs.push(c[0]+x+Math.sign(x)*.28*Math.cos(t),c[1]+r*Math.sin(t)*Math.cos(a),c[2]+r*Math.sin(t)*Math.sin(a));
    }
    for(let k=0;k<N;k++)for(let j=0;j<segments;j++){const n=k*(segments+1)+j;is.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);}
    const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));hg.setIndex(is);hg.computeVertexNormals();mesh(parent,hg,M.shell);
    // Outline each cut edge so the remaining pressure shell is unmistakable.
    const arc=[];for(let j=0;j<=segments;j++){const a=start+(end-start)*j/segments;arc.push([c[0]+x,c[1]+r*Math.cos(a),c[2]+r*Math.sin(a)]);}
    pipe(parent,roundedPath(arc,0),.019,M.rim);
  }
  for(const a of [start,end])rod(parent,[c[0]-L/2,c[1]+r*Math.cos(a),c[2]+r*Math.sin(a)],[c[0]+L/2,c[1]+r*Math.cos(a),c[2]+r*Math.sin(a)],.023,M.rim);
}

// Continuous, clipped circular liquid volumes. No gas headspace is modeled.
function liquidSlice(parent,c,L,r,yLow,yHigh,mat){
  const low=Math.max(-r,yLow),high=Math.min(r,yHigh),shape=new THREE.Shape();
  const pts=[];
  for(let i=0;i<=24;i++){const y=low+(high-low)*i/24;pts.push(new THREE.Vector2(-Math.sqrt(Math.max(0,r*r-y*y)),y));}
  for(let i=24;i>=0;i--){const y=low+(high-low)*i/24;pts.push(new THREE.Vector2(Math.sqrt(Math.max(0,r*r-y*y)),y));}
  shape.setFromPoints(pts);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:L,bevelEnabled:false,steps:1});geo.translate(0,0,-L/2);geo.rotateY(Math.PI/2);
  const o=mesh(parent,geo,mat,c);o.renderOrder=1;return o;
}

function controlValve(parent,at,axis='z',small=false){
  const p=V(at),d=axis==='x'?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1),scale=small?.65:1;
  for(const sign of [-1,1]){
    const o=mesh(parent,new THREE.ConeGeometry(.115*scale,.19*scale,12),M.dark,p.clone().addScaledVector(d,sign*.095*scale).toArray());
    o.quaternion.setFromUnitVectors(UP,d.clone().multiplyScalar(-sign));
  }
  rod(parent,[p.x,p.y,p.z],[p.x,p.y+.21*scale,p.z],.025,M.rim);
  rod(parent,[p.x,p.y+.21*scale,p.z],[p.x,p.y+.27*scale,p.z],.12*scale,M.dark);
}

function desalter(root,id,animations,numberAnchors){
  const u=units[id],c=u.center,L=u.length,r=u.radius,g=new THREE.Group();g.userData.equipment=id;root.add(g);
  shellSurface(g,c,L,r);
  box(g,[c[0],.08,c[2]],[L+.6,.16,2.15],M.base);
  for(const dx of [-.98,.98]){
    box(g,[c[0]+dx,.47,c[2]],[.18,.75,.85],M.dark);
    box(g,[c[0]+dx,.88,c[2]],[.24,.18,1.13],M.rim);
    box(g,[c[0]+dx,.2,c[2]],[.5,.12,1.36],M.rim);
  }
  liquidSlice(g,c,L-.02,r-.035,-r+.025,-.57,id==='d1'?M.vesselWater:M.recycle);
  liquidSlice(g,c,L-.02,r-.035,-.57,-.51,M.rag);
  liquidSlice(g,c,L-.02,r-.035,-.51,r-.035,M.oil);
  // Clear boundary line on the open face makes the phase interface legible.
  const zFront=c[2]+Math.sqrt((r-.035)**2-.54**2);
  rod(g,[c[0]-1.43,c[1]-.54,zFront],[c[0]+1.43,c[1]-.54,zFront],.013,M.rim);
  // Lower mixed-feed distributor, branching across the open vessel.
  const yFeed=1.2;
  rod(g,[c[0]-1.82,yFeed,c[2]],[c[0]+1.26,yFeed,c[2]],.075,M.dark);
  for(const dx of [-1,-.5,0,.5,1]){
    rod(g,[c[0]+dx,yFeed,c[2]-.42],[c[0]+dx,yFeed,c[2]+.42],.036,M.rim);
    for(const dz of [-.32,.32])rod(g,[c[0]+dx,yFeed,c[2]+dz],[c[0]+dx,yFeed+.07,c[2]+dz],.028,M.rim);
  }
  flange(g,[c[0]-1.72,yFeed,c[2]]);
  // Upper collector is a separate header with short collection branches.
  rod(g,[c[0]-1.25,2.23,c[2]],[c[0]+1.82,2.23,c[2]],.071,M.dark);
  for(const dx of [-1,-.5,0,.5,1])rod(g,[c[0]+dx,2.23,c[2]-.25],[c[0]+dx,2.23,c[2]+.25],.027,M.rim);
  flange(g,[c[0]+1.72,2.23,c[2]]);
  const collectorCurve=roundedPath([[c[0]-1.15,2.24,c[2]+.02],[c[0]+1.45,2.24,c[2]+.02]]);
  const oilMarkers=[];
  for(let i=0;i<3;i++)oilMarkers.push(mesh(g,new THREE.ConeGeometry(.035,.11,8),material(colors.oil)));
  animations.flows.push({arrows:oilMarkers,curve:collectorCurve,length:collectorCurve.getLength(),r:.028});
  rod(g,[c[0],c[1]-.69,c[2]],[c[0],.8,c[2]],.075,M.rim);flange(g,[c[0],.84,c[2]],'y');
  // Three horizontal grid decks: a coherent generic AC arrangement.
  const gridYs=[1.43,1.72,2.01];
  gridYs.forEach((y,level)=>{
    for(const dz of [-.5,.5])box(g,[c[0],y,c[2]+dz],[2.55,.032,.035],M.grid);
    for(let i=0;i<17;i++)box(g,[c[0]-1.25+i*2.5/16,y,c[2]],[.017,.018,1.0],M.grid);
    box(g,[c[0],y,c[2]],[2.55,.025,.026],M.grid);
    // Ceramic supports suspend each deck. No agitator is installed.
    for(const dx of [-1.13,1.13])for(const dz of [-.46,.46]){
      const top=level===2?2.32:gridYs[level+1]-.02;
      rod(g,[c[0]+dx,y,c[2]+dz],[c[0]+dx,top,c[2]+dz],.012,M.dark);
      rod(g,[c[0]+dx,top-.12,c[2]+dz],[c[0]+dx,top-.035,c[2]+dz],.032,M.ceramic);
      for(let k=0;k<3;k++)rod(g,[c[0]+dx,top-.1+k*.025,c[2]+dz],[c[0]+dx,top-.09+k*.025,c[2]+dz],.042,M.ceramic);
    }
  });
  // External power units, bushings and individual electrical leads.
  for(let j=0;j<3;j++){
    const x=c[0]+(j-1)*.92,z=c[2]-.61;
    box(g,[x,2.83,z],[.47,.46,.36],M.dark);box(g,[x,3.08,z],[.55,.055,.46],M.rim);
    for(let k=0;k<5;k++)box(g,[x-.18+k*.09,2.83,z+.19],[.027,.35,.08],M.rim);
    rod(g,[x,2.37,z+.07],[x,2.63,z+.07],.06,M.ceramic);
    for(let k=0;k<5;k++)rod(g,[x,2.4+k*.04,z+.07],[x,2.413+k*.04,z+.07],.09,M.ceramic);
    flange(g,[x,2.4,z+.07],'y',.12);
    line(g,[[x,2.64,z+.07],[x,2.34,z+.07],[x,gridYs[j],c[2]-.48]],0x6e705d);
    for(const dx of [-.16,.16])rod(g,[x+dx,2.32,z],[x+dx,2.6,z],.025,M.rim);
  }
  const field=new THREE.Group();g.add(field);
  for(let j=0;j<6;j++){
    const x=c[0]-1.05+j*.42;
    const pl=mesh(field,new THREE.PlaneGeometry(.63,.57),M.field,[x,1.72,c[2]]);pl.rotation.y=Math.PI/2;
    line(field,[[x,1.46,c[2]-.32],[x,1.99,c[2]-.32]],0xc8b778,true);
  }
  // Sensing point and dashed signal to the actual water outlet control valve.
  const valve=[c[0],id==='d1'?.29:.61,-1.25];controlValve(g,valve);
  const sensor=[c[0]+1.17,1.11,c[2]+.55];sphere(g,sensor,.07,M.ceramic);
  line(g,[sensor,[c[0]+1.42,1.11,c[2]+.8],[c[0]+1.42,.48,-.95],[c[0],.48,-.95],[valve[0],valve[1]+.28,valve[2]]],colors.signal,true);
  // Small sediment is illustrative and confined to the vessel bottom.
  for(let j=0;j<9;j++)sphere(g,[c[0]-.9+j*.22,.91,c[2]+Math.sin(j*2.8)*.11],.03,M.oilDrop);
  const drops=[];
  for(let j=0;j<9;j++){
    const a=sphere(g,[0,0,0],.04,M.droplet),b=sphere(g,[0,0,0],.04,M.droplet),merged=sphere(g,[0,0,0],.0504,M.droplet);
    drops.push({a,b,merged,x:c[0]-1.06+(j%5)*.51,z:c[2]+.12+(j%2)*.19,phase:j/9});
  }
  animations.droplets.push({drops,field});
  numberAnchors.push(
    {stage:id,n:1,at:[c[0]-.88,1.2,c[2]+.43]},
    {stage:id,n:2,at:[c[0]+.42,1.82,c[2]+.44]},
    {stage:id,n:3,at:[c[0]-.48,2.23,c[2]+.15]},
    {stage:id,n:4,at:[c[0]+.97,1.11,zFront+.03]}
  );
  return g;
}

function tank(root,id){
  const u=units[id],c=u.center,g=new THREE.Group();g.userData.equipment=id;root.add(g);
  box(g,[c[0],.07,c[2]],[u.radius*2+.35,.14,u.radius*2+.35],M.base);
  const geo=new THREE.CylinderGeometry(u.radius,u.radius,u.height,40,1,true,Math.PI*.28,Math.PI*1.44);
  mesh(g,geo,M.shell,[c[0],c[1]+u.height/2,c[2]]);
  for(const y of [c[1],c[1]+u.height])ring(g,[c[0],y,c[2]],u.radius,.023,'y');
  for(const angle of [Math.PI*.28,Math.PI*1.72])rod(g,[c[0]+u.radius*Math.sin(angle),c[1],c[2]+u.radius*Math.cos(angle)],[c[0]+u.radius*Math.sin(angle),c[1]+u.height,c[2]+u.radius*Math.cos(angle)],.025,M.rim);
  const level=id==='dirty'?1.1:1.15;
  mesh(g,new THREE.CylinderGeometry(u.radius-.045,u.radius-.045,level,36),id==='dirty'?M.oily:M.treated,[c[0],c[1]+level/2,c[2]]).renderOrder=1;
  if(id==='dirty'){
    for(let i=0;i<27;i++){
      const a=i*2.399,rad=.63*Math.sqrt((i+.5)/27),y=c[1]+.2+(i%7)*.13;
      sphere(g,[c[0]+Math.cos(a)*rad,y,c[2]+Math.sin(a)*rad],.027+(i%3)*.012,i%3?M.oilDrop:M.rag);
    }
    for(let i=0;i<5;i++){
      const o=sphere(g,[c[0]-.4+i*.18,c[1]+level+.005,c[2]+Math.sin(i*4)*.25],.1,M.oilDrop);o.scale.y=.06;
    }
  }
  const inlet=id==='dirty'?ports.dirtyIn:ports.cleanIn,outlet=id==='dirty'?ports.dirtyOut:ports.cleanOut;
  flange(g,inlet,'z',.13);flange(g,outlet,'x',.12);
  // Tank total liquid level gauge, distinct from desalter interface sensing.
  rod(g,[c[0]+u.radius*.77,c[1]+.2,c[2]+u.radius*.7],[c[0]+u.radius*.77,c[1]+1.4,c[2]+u.radius*.7],.028,M.ceramic);
  return g;
}

function feedPump(root,id,center,rotation=0,scale=1){
  const g=new THREE.Group();g.userData.equipment=id;root.add(g);
  const body=new THREE.Group();body.position.copy(V(center));body.rotation.y=rotation;body.scale.setScalar(scale);g.add(body);
  box(body,[0,-.36,0],[1.17,.12,.7],M.rim);
  rod(body,[-.14,-.27,-.2],[-.14,-.27,.2],.18,M.dark);
  const housing=mesh(body,new THREE.CylinderGeometry(.255,.255,.23,24),M.shell,[0,0,0]);housing.rotation.x=Math.PI/2;
  ring(body,[0,0,.128],.19,.025,'z');
  rod(body,[-.39,0,0],[-.12,0,0],.09,M.rim);
  rod(body,[0,.1,0],[0,.6,0],.08,M.rim);
  const motor=mesh(body,new THREE.CylinderGeometry(.18,.18,.48,20),M.dark,[.49,-.01,0]);motor.rotation.z=Math.PI/2;
  rod(body,[.1,0,0],[.28,0,0],.055,M.rim);
  for(let i=0;i<7;i++)ring(body,[.31+i*.055,-.01,0],.181,.009,'x');
  box(body,[.48,.19,0],[.22,.1,.2],M.dark);
  return g;
}
function preheater(root){
  const g=new THREE.Group();g.userData.equipment='heater';root.add(g);const c=[-7.05,1.2,-2.3];
  rod(g,[-7.66,1.2,-2.3],[-6.44,1.2,-2.3],.31,M.shell,24);
  for(const x of [-7.65,-6.45]){ring(g,[x,1.2,-2.3],.31,.034,'x');sphere(g,[x,1.2,-2.3],.15,M.rim).scale.x=.7;}
  rod(g,ports.heaterIn,[-7.65,1.2,-2.3],.08,M.rim);rod(g,[-6.45,1.2,-2.3],ports.heaterOut,.08,M.rim);
  for(const x of [-7.45,-6.65])box(g,[x,.6,-2.3],[.13,1.05,.37],M.dark);
  box(g,[-7.05,.08,-2.3],[1.65,.16,.82],M.base);
  // Utility connections end visibly at a boundary; utility identity is unspecified.
  const utility=material(0xb8a381,{roughness:.6});
  for(const x of [-7.36,-6.76]){pipe(g,roundedPath([[x,1.46,-2.3],[x,1.75,-2.3],[x,1.75,-3.1]]),.035,utility);flange(g,[x,1.75,-3.1],'z',.065);}
  return g;
}
function chemicalSupply(root,id,c,animations){
  const g=new THREE.Group();g.userData.equipment=id;root.add(g);
  const radius=.19,h=.5;
  mesh(g,new THREE.CylinderGeometry(radius,radius,h,20),M.ceramic,[c[0],c[1]+h/2,c[2]]);
  ring(g,[c[0],c[1]+h*.7,c[2]],radius+.002,.035,'y',Math.PI*2,0,M.chemical);
  box(g,[c[0],c[1]-.035,c[2]],[.56,.07,.5],M.base);
  rod(g,[c[0],c[1]+h,c[2]],[c[0],c[1]+h+.045,c[2]],.09,M.dark);
  box(g,[c[0]+.33,c[1]+.16,c[2]],[.19,.2,.16],M.chemical);
  rod(g,[c[0]+.1,c[1]+.16,c[2]],[c[0]+.33,c[1]+.16,c[2]],.027,M.chemical);
  const out=id==='demul'?ports.demulOut:ports.flocOut;
  pipe(g,roundedPath([[c[0]+.33,c[1]+.16,c[2]],[c[0]+.33,out[1],c[2]],out]),.024,M.chemical);
  return g;
}

function mixingValve(root,id,point,animations){
  const g=new THREE.Group();g.userData.equipment=id;root.add(g);const [x,y,z]=point;
  controlValve(g,[x-.1,y,z],'x',true);
  rod(g,[x+.04,y,z],[x+.34,y,z],.14,M.glass,20);
  for(const xx of [x+.04,x+.34])flange(g,[xx,y,z],'x',.15);
  const drops=[];
  for(let i=0;i<12;i++)drops.push(sphere(g,[x,y,z],.019,M.droplet));
  animations.mixing.push({drops,point:[x+.04,y,z]});return g;
}

export function buildModel(scene){
  const root=new THREE.Group();scene.add(root);
  const animations={flows:[],droplets:[],mixing:[]},numberAnchors=[],objects={};
  const ground=mesh(root,new THREE.PlaneGeometry(18.1,8.4),material(0xeef2e8,{roughness:1}),[-1.05,-.025,.22]);ground.rotation.x=-Math.PI/2;ground.renderOrder=-10;
  const grid=new THREE.GridHelper(20,40,0xd3ddcc,0xdfe6d9);grid.position.set(-1.2,-.015,.3);grid.material.transparent=true;grid.material.opacity=.52;grid.renderOrder=-9;root.add(grid);
  for(const id of ['d1','d2'])objects[id]=desalter(root,id,animations,numberAnchors);
  objects.dirty=tank(root,'dirty');objects.clean=tank(root,'clean');
  const sep=new THREE.Group();sep.userData.equipment='sep';root.add(sep);objects.sep=sep;
  const su=units.sep;box(sep,su.center,su.size,material(0xd0ddd1,{metalness:.2,roughness:.7}));
  box(sep,[1.55,1.31,3.05],[2.4,.075,1.44],M.rim);box(sep,[1.55,.12,3.05],[2.55,.15,1.65],M.base);
  box(sep,[1.55,.77,3.735],[1.65,.37,.018],material(0x52715f));
  for(let i=0;i<3;i++)box(sep,[1.1+i*.44,.77,3.751],[.23,.023,.01],M.ceramic);
  flange(sep,ports.sepIn,'x');flange(sep,ports.sepOut,'x');
  objects.pump=feedPump(root,'pump',[-8.25,.58,-2.3]);
  // Complete physical nozzle-to-pump connections.
  rod(objects.pump,ports.pumpIn,[-8.64,.58,-2.3],.08,M.rim);
  rod(objects.pump,[-8.25,1.18,-2.3],ports.pumpOut,.08,M.rim);
  objects.wpump=feedPump(root,'wpump',[4.5,.48,.9],Math.PI,.61);
  rod(objects.wpump,ports.waterPumpIn,[4.5,.48,.9],.065,M.rim);
  objects.heater=preheater(root);
  objects.demul=chemicalSupply(root,'demul',[-6.33,.2,-.1],animations);
  objects.floc=chemicalSupply(root,'floc',[-4.98,.18,3.25],animations);
  objects.mix1=mixingValve(root,'mix1',ports.mix1,animations);
  objects.mix2=mixingValve(root,'mix2',ports.mix2,animations);
  const streamObjects=[];
  for(const stream of streams){
    const group=new THREE.Group();group.userData.equipment=stream.id==='recycle'?'recycle':stream.from==='boundary'?'pump':stream.from;root.add(group);
    const curve=roundedPath(stream.points),r=stream.kind==='chemical'?.026:stream.kind==='oil'?.073:.057;
    const fluid=material(colors[stream.kind],{roughness:.45}),window=material(0xc4d4ca,{metalness:.25,transparent:true,opacity:.22,depthWrite:false});
    // Metallic pipe lengths alternate with a restrained inspection window.
    if(curve.getLength()>.8 && stream.kind!=='chemical'){
      pipe(group,curve,r,M.rim,0,.32);pipe(group,curve,r,window,.32,.58);pipe(group,curve,r*.73,fluid,.32,.58);pipe(group,curve,r,M.rim,.58,1);
    }else pipe(group,curve,r,stream.kind==='chemical'?M.chemical:M.rim);
    const count=Math.max(1,Math.min(5,Math.ceil(curve.getLength()/2.5))),arrows=[];
    for(let i=0;i<count;i++){
      const arrow=mesh(group,new THREE.ConeGeometry(r*.75,r*2.8,8),fluid);arrows.push(arrow);
    }
    animations.flows.push({arrows,curve,phase:.1,length:curve.getLength(),r});
    streamObjects.push({id:stream.id,curve,group});
    // Restrained supports beneath long water corridor pipes.
    if(['recycle','wash-water','to-treatment','return'].includes(stream.id)){
      for(const f of [.25,.65]){const p=curve.getPointAt(f);if(p.y<1){rod(group,[p.x,.05,p.z],[p.x,p.y-.05,p.z],.021,M.rim);box(group,[p.x,.035,p.z],[.23,.06,.24],M.base);}}
    }
  }
  // Actual water and chemical junctions have small collars at their connection.
  for(const point of [ports.waterJ1,ports.waterJ2,ports.demulJ])flange(root,point,'x',.105);
  for(const o of Object.values(objects))o.traverse(child=>{if(child.isMesh)child.userData.equipment=o.userData.equipment;});
  return {root,objects,animations,numberAnchors,streamObjects};
}
