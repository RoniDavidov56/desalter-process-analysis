import * as THREE from '../vendor/three.module.min.js';
const UP=new THREE.Vector3(0,1,0);
// All timing is illustrative and independent of a process calculation.
export function updateMotion(model,time){
  for(const flow of model.animations.flows){
    const {arrows,curve,length,r}=flow;
    arrows.forEach((arrow,i)=>{
      const t=(i/arrows.length+time*.23/length+.13)%1;
      arrow.position.copy(curve.getPointAt(t));arrow.position.y+=r*1.65;
      arrow.quaternion.setFromUnitVectors(UP,curve.getTangentAt(t).normalize());
    });
  }
  for(const vessel of model.animations.droplets){
    for(const d of vessel.drops){
      const p=(time/11+d.phase)%1,mergeAt=.42;
      const approach=Math.min(1,p/mergeAt),spread=.17*(1-approach);
      d.a.position.set(d.x-spread,1.9-.08*approach,d.z);
      d.b.position.set(d.x+spread,1.86-.04*approach,d.z+.025*(1-approach));
      d.a.visible=d.b.visible=p<mergeAt;
      d.merged.visible=p>=mergeAt;
      const settle=(p-mergeAt)/(1-mergeAt);
      d.merged.position.set(d.x+.09*Math.max(0,settle),1.82-.72*Math.max(0,settle),d.z);
    }
  }
  for(const m of model.animations.mixing){
    m.drops.forEach((d,i)=>{
      const t=(time*.36+i/m.drops.length)%1,a=i*2.399+time*.4;
      d.position.set(m.point[0]+.3*t,m.point[1]+Math.cos(a)*.056,m.point[2]+Math.sin(a)*.056);
    });
  }
}
