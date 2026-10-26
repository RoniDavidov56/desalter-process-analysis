import {Color,Vector3,SRGBColorSpace} from '../vendor/three.module.min.js';
import {Projector,RenderableFace,RenderableLine} from '../vendor/Projector.js';

// Software projection of the same Three.js scene, used when WebGL is unavailable.
// Geometry, camera controls, hit-testing and animation remain three-dimensional.
// This deliberately omits physical lighting, textures and GPU shadow effects.
export class CanvasRenderer {
  constructor({canvas}){
    this.domElement=canvas;this.ctx=canvas.getContext('2d',{alpha:true});
    if(!this.ctx)throw new Error('Neither WebGL nor Canvas 2D rendering is available.');
    this.projector=new Projector();this.ratio=1;this.isSoftwareRenderer=true;
    this.color=new Color();this.light=new Vector3(-.4,.8,.5).normalize();
    this.info={render:{faces:0}};
  }
  setPixelRatio(ratio){this.ratio=Math.min(ratio,1.5);}
  setSize(w,h){this.width=w;this.height=h;this.domElement.width=Math.round(w*this.ratio);this.domElement.height=Math.round(h*this.ratio);}
  render(scene,camera){
    scene.updateMatrixWorld();camera.updateMatrixWorld();
    const data=this.projector.projectScene(scene,camera,true,true),ctx=this.ctx,w=this.width,h=this.height;
    ctx.setTransform(this.ratio,0,0,this.ratio,0,0);ctx.clearRect(0,0,w,h);ctx.lineJoin='round';
    let faces=0;
    for(const e of data.elements){
      const m=e.material;if(!m||m.opacity===0)continue;
      ctx.globalAlpha=m.opacity;
      if(e instanceof RenderableFace){
        const a=e.v1.positionScreen,b=e.v2.positionScreen,c=e.v3.positionScreen;
        if(a.z < -1||a.z>1||b.z < -1||b.z>1||c.z < -1||c.z>1)continue;
        const ax=(a.x+1)*w/2,ay=(1-a.y)*h/2,bx=(b.x+1)*w/2,by=(1-b.y)*h/2,cx=(c.x+1)*w/2,cy=(1-c.y)*h/2;
        if(Math.max(ax,bx,cx)<0||Math.min(ax,bx,cx)>w||Math.max(ay,by,cy)<0||Math.min(ay,by,cy)>h)continue;
        const shade=m.isMeshBasicMaterial?1:.62+.38*Math.max(0,e.normalModel.dot(this.light));
        this.color.copy(m.color||new Color(0x888888)).multiplyScalar(shade);
        const fill=this.color.getStyle(SRGBColorSpace);ctx.fillStyle=fill;
        ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(cx,cy);ctx.closePath();ctx.fill();
        if(m.opacity>.98){ctx.strokeStyle=fill;ctx.lineWidth=.35;ctx.setLineDash([]);ctx.stroke();}
        faces++;
      }else if(e instanceof RenderableLine){
        const a=e.v1.positionScreen,b=e.v2.positionScreen;
        ctx.strokeStyle=m.color.getStyle(SRGBColorSpace);ctx.lineWidth=m.linewidth||.8;
        ctx.setLineDash(m.isLineDashedMaterial?[3,3]:[]);
        ctx.beginPath();ctx.moveTo((a.x+1)*w/2,(1-a.y)*h/2);ctx.lineTo((b.x+1)*w/2,(1-b.y)*h/2);ctx.stroke();
      }
    }
    ctx.globalAlpha=1;ctx.setLineDash([]);this.info.render.faces=faces;
  }
}
