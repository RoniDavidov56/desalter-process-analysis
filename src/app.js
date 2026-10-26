import {project,equipment} from './content.js';
import {labels as labelData,units} from './layout.js';

const $=id=>document.getElementById(id);
const select=$('equipment');
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let selected='all',activeView='overview',playing=!motionPreference.matches,graphics=null;

// Public text is kept out of geometry code to make GitHub edits straightforward.
$('project-summary').textContent=project.summary;
for(const key of ['objectives','assumptions','connections']){
  const ul=$(key==='connections'?'connection-list':key);
  for(const value of project[key]){const li=document.createElement('li');li.textContent=value;ul.append(li);}
}
for(const ref of project.references){
  const li=document.createElement('li'),a=document.createElement('a');a.href=ref.url;a.textContent=ref.title;a.target='_blank';a.rel='noopener noreferrer';li.append(a,document.createTextNode(' — '+ref.note));$('references').append(li);
}
for(const [id,item] of Object.entries(equipment)){const option=document.createElement('option');option.value=id;option.textContent=id==='all'?'Process overview':item.name;select.append(option);}
function choose(id){
  if(!equipment[id])id='all';selected=id;select.value=id;
  const info=equipment[id],panel=$('equipment-detail');panel.replaceChildren();
  const h=document.createElement('h2');h.textContent=info.name;const p=document.createElement('p');p.textContent=info.description;
  const line=document.createElement('div');line.className='connection-note';const tag=document.createElement('strong');tag.textContent='Flow';const text=document.createElement('span');text.textContent=info.connection;line.append(tag,text);panel.append(h,p,line);
  document.querySelectorAll('.model-label').forEach(el=>el.classList.toggle('selected',el.dataset.id===id&&id!=='all'));
}
select.addEventListener('change',()=>choose(select.value));choose('all');

function updatePlay(){
  $('play-text').textContent=playing?'Pause motion':'Play motion';$('play-icon').textContent=playing?'Ⅱ':'▷';$('play').setAttribute('aria-pressed',String(!playing));
}
$('play').addEventListener('click',()=>{playing=!playing;updatePlay();});updatePlay();
motionPreference.addEventListener('change',event=>{if(event.matches){playing=false;updatePlay();}});

function makeFallback(error){
  $('loading').hidden=true;$('fallback').hidden=false;
  document.querySelectorAll('.view-tabs button,.canvas-tools button,#play').forEach(el=>el.disabled=true);
  // Exposed for diagnostics without showing low-level implementation in the UI.
  window.__DESALTER_STATUS__={ready:false,error:String(error)};
  console.error('Desalter viewer:',error);
}

async function init(){
  const [THREE,{OrbitControls},{buildModel},{updateMotion}]=await Promise.all([
    import('three'),import('three/addons/controls/OrbitControls.js'),import('./model.js'),import('./animation.js')
  ]);
  const host=$('viewport'),canvas=$('scene');
  const context=canvas.getContext('webgl2',{antialias:true,alpha:true});
  let renderer;
  if(context)renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:true,powerPreference:'high-performance'});
  else{const {CanvasRenderer}=await import('./canvas-renderer.js');renderer=new CanvasRenderer({canvas});}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;
  const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xfffcf1,0x93aa8a,2.7));
  const sun=new THREE.DirectionalLight(0xfff7df,3.3);sun.position.set(-4,11,8);scene.add(sun);
  const fill=new THREE.DirectionalLight(0xd7ecf3,1.5);fill.position.set(4,6,-5);scene.add(fill);
  const camera=new THREE.OrthographicCamera(-10,10,5,-5,.1,120);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.12;controls.rotateSpeed=.7;controls.zoomSpeed=.75;
  controls.minAzimuthAngle=-.64;controls.maxAzimuthAngle=.64;
  controls.minPolarAngle=.52;controls.maxPolarAngle=1.35;
  controls.minZoom=.7;controls.maxZoom=4;
  controls.screenSpacePanning=true;
  const model=buildModel(scene);
  const placedLabels=[];
  for(const definition of labelData){
    const el=document.createElement('button');el.type='button';el.className='model-label '+(definition.kind||'');el.dataset.id=definition.id;
    const strong=document.createElement('strong');strong.textContent=definition.text;el.append(strong);
    if(definition.sub){const sub=document.createElement('small');sub.textContent=definition.sub;el.append(sub);}
    el.addEventListener('click',()=>choose(definition.id));
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');$('leaders').append(line);$('labels').append(el);
    placedLabels.push({definition,el,line});
  }
  const numberLabels=model.numberAnchors.map(anchor=>{
    const el=document.createElement('span');el.className='model-label number-label';el.textContent=anchor.n;el.setAttribute('aria-hidden','true');$('labels').append(el);return {anchor,el};
  });
  let width=0,height=0,labelDirty=true,elapsed=3,previous=performance.now(),frame=0;
  const state={ready:true,playing,view:activeView,selected,frames:0,threeRevision:THREE.REVISION,streams:model.streamObjects.length,rendering:renderer.isSoftwareRenderer?'software':'webgl2'};
  window.__DESALTER_STATUS__=state;
  function setCamera(view){
    activeView=view;camera.zoom=1;
    const views={overview:{target:[-1.18,1,.3],offset:[-4.2,10.6,18]},d1:{target:[-2.9,1.5,-2.1],offset:[-3.3,8.4,18]},d2:{target:[2.5,1.5,-2.1],offset:[-3.3,8.4,18]},water:{target:[.25,.65,1.15],offset:[-2.5,12.5,18]}};
    const v=views[view]||views.overview;controls.target.set(...v.target);camera.position.copy(controls.target).add(new THREE.Vector3(...v.offset));
    resize();controls.update();labelDirty=true;
    document.querySelectorAll('[data-view]').forEach(el=>{const active=el.dataset.view===activeView;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
    $('scene-mode').textContent='/ '+({overview:'SYSTEM OVERVIEW',d1:'STAGE 1 CUTAWAY',d2:'STAGE 2 CUTAWAY',water:'WATER CIRCUIT'}[view]);
    if(view==='d1'||view==='d2')choose(view);else if(view==='water')choose('recycle');else choose('all');
    state.view=view;
  }
  function resize(){
    width=host.clientWidth;height=host.clientHeight;renderer.setSize(width,height,false);
    const aspect=width/height;
    let worldWidth=activeView==='overview'?(width<700?18.5:19.2):activeView==='water'?13.4:width<700?5.6:7.6;
    const worldHeight=Math.max(activeView==='overview'?7.9:activeView==='water'?6.5:4.6,worldWidth/aspect);
    camera.left=-worldHeight*aspect/2;camera.right=-camera.left;camera.top=worldHeight/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();labelDirty=true;
  }
  function project(point){const v=new THREE.Vector3(...point).project(camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2,z:v.z};}
  function overlaps(a,b){return a.x<b.x+b.w+7&&a.x+a.w+7>b.x&&a.y<b.y+b.h+6&&a.y+a.h+6>b.y;}
  function updateLabels(){
    const occupied=[],viewStage=activeView==='d1'||activeView==='d2'?activeView:null;
    if(width<700&&activeView==='overview'){
      for(const unit of [units.d1,units.d2]){
        const corners=[];
        for(const x of [-1.65,1.65])for(const y of [-.7,.75])for(const z of [-.55,.65])corners.push(project([unit.center[0]+x,unit.center[1]+y,unit.center[2]+z]));
        const x=Math.min(...corners.map(p=>p.x)),y=Math.min(...corners.map(p=>p.y));
        occupied.push({x,y,w:Math.max(...corners.map(p=>p.x))-x,h:Math.max(...corners.map(p=>p.y))-y});
      }
    }
    for(const {definition:d,el,line} of placedLabels){
      const p=project(d.at);
      let visible=!(d.detail&&d.detail!==activeView)&&p.z>-1&&p.z<1&&p.x>-15&&p.x<width+15&&p.y>18&&p.y<height-43;
      if(viewStage&&!d.detail){const context=viewStage==='d1'?['d1','mix1','demul']:['d2','mix2'];visible=visible&&context.includes(d.id);}
      if(activeView==='water'&&['pump','heater','demul','mix1','mix2'].includes(d.id))visible=false;
      el.classList.toggle('hidden',!visible);line.style.display=visible?'':'none';if(!visible)continue;
      const w=el.offsetWidth,h=el.offsetHeight,dx=d.offset?.[0]||0,dy=d.offset?.[1]||0;
      const preferred={x:Math.max(4,Math.min(width-w-4,p.x-w/2+dx)),y:Math.max(34,Math.min(height-h-64,p.y-h+dy)),w,h};
      let best=preferred,bestCost=Infinity;
      // Short leader lines and a collision-aware label stack preserve readable names.
      for(let step=0;step<18;step++){
        for(const sign of step===0?[1]:[-1,1]){
          const q={...preferred,y:Math.max(33,Math.min(height-h-65,preferred.y+step*(h+8)*sign))};
          const collision=occupied.filter(b=>overlaps(q,b)).length;
          const cost=collision*10000+Math.abs(q.y-preferred.y);
          if(cost<bestCost){best=q;bestCost=cost;}
        }
        if(bestCost<10000)break;
      }
      occupied.push(best);el.style.left=(best.x+w/2)+'px';el.style.top=(best.y+h)+'px';
      const endX=Math.max(best.x+5,Math.min(best.x+w-5,p.x)),endY=p.y>best.y+h?best.y+h:best.y;
      line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);line.setAttribute('x2',endX);line.setAttribute('y2',endY);
      line.style.opacity=Math.hypot(endX-p.x,endY-p.y)>12?'1':'0';
    }
    for(const {anchor,el} of numberLabels){
      const p=project(anchor.at);const visible=(!viewStage||anchor.stage===viewStage)&&p.x>5&&p.x<width-5&&p.y>30&&p.y<height-60;
      el.classList.toggle('hidden',!visible);el.style.left=p.x+'px';el.style.top=p.y+'px';
    }
    labelDirty=false;
  }
  function zoom(factor){camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,controls.minZoom,controls.maxZoom);camera.updateProjectionMatrix();labelDirty=true;}
  function rotate(horizontal,vertical=0){
    const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    s.theta=THREE.MathUtils.clamp(s.theta+horizontal,controls.minAzimuthAngle,controls.maxAzimuthAngle);
    s.phi=THREE.MathUtils.clamp(s.phi+vertical,controls.minPolarAngle,controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();labelDirty=true;
  }
  document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>setCamera(el.dataset.view)));
  $('zoom-in').addEventListener('click',()=>zoom(1.2));$('zoom-out').addEventListener('click',()=>zoom(1/1.2));
  $('rotate-left').addEventListener('click',()=>rotate(-.14));$('rotate-right').addEventListener('click',()=>rotate(.14));
  $('reset').addEventListener('click',()=>setCamera('overview'));
  canvas.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft')rotate(-.08);else if(event.key==='ArrowRight')rotate(.08);else if(event.key==='ArrowUp')rotate(0,-.06);else if(event.key==='ArrowDown')rotate(0,.06);else if(event.key==='+'||event.key==='=')zoom(1.12);else if(event.key==='-')zoom(1/1.12);else if(event.key==='Home')setCamera('overview');else return;event.preventDefault();
  });
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  canvas.addEventListener('pointerdown',event=>{down=[event.clientX,event.clientY];});
  canvas.addEventListener('pointerup',event=>{
    if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5){down=null;return;}
    const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/width*2-1,-((event.clientY-rect.top)/height)*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObject(model.root,true);
    for(const hit of hits){let obj=hit.object;while(obj&&!obj.userData.equipment)obj=obj.parent;if(obj?.userData.equipment&&equipment[obj.userData.equipment]){choose(obj.userData.equipment);break;}}
    down=null;
  });
  controls.addEventListener('change',()=>{labelDirty=true;});
  new ResizeObserver(resize).observe(host);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();makeFallback('The graphics context was interrupted. Reload to resume.');});
  setCamera('overview');updateMotion(model,elapsed);renderer.render(scene,camera);updateLabels();$('loading').hidden=true;
  let lastPaint=0;
  function tick(now){
    frame=requestAnimationFrame(tick);const delta=Math.min((now-previous)/1000,.05);previous=now;
    if(document.hidden)return;
    if(playing){elapsed+=delta;updateMotion(model,elapsed);}
    controls.update();
    const shouldPaint=labelDirty||playing;
    if(shouldPaint&&now-lastPaint>(renderer.isSoftwareRenderer?60:20)){
      if(labelDirty)updateLabels();renderer.render(scene,camera);lastPaint=now;
    }
    state.playing=playing;state.selected=selected;state.frames++;state.time=elapsed;state.cameraZoom=camera.zoom;
  }
  frame=requestAnimationFrame(tick);graphics={renderer,scene,camera,controls,model};
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
}
init().catch(makeFallback);
