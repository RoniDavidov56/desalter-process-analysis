// Layout units are illustrative. Y is vertical; +Z faces the viewer.
export const colors = {oil:0x785135,treated:0x9dcee3,recycle:0x5e9bb0,oily:0x709985,chemical:0xa47db5,metal:0xbac5ba,dark:0x4c6257,field:0xc9b26e,signal:0x708d6c};
export const units = {
  d1:{center:[-2.6,1.65,-2.3],length:3.1,radius:.8},
  d2:{center:[2.8,1.65,-2.3],length:3.1,radius:.8},
  dirty:{center:[-2.6,.18,2.45],radius:.82,height:1.7},
  clean:{center:[5.6,.18,.9],radius:.72,height:1.65},
  sep:{center:[1.55,.72,3.05],size:[2.3,1.15,1.35]}
};
export const ports = {
  raw:[-9.2,.58,-2.3],pumpIn:[-8.65,.58,-2.3],pumpOut:[-8.15,1.2,-2.3],
  heaterIn:[-7.78,1.2,-2.3],heaterOut:[-6.32,1.2,-2.3],
  demulJ:[-5.95,1.2,-2.3],waterJ1:[-5.45,1.2,-2.3],mix1:[-4.9,1.2,-2.3],d1in:[-4.42,1.2,-2.3],
  d1out:[-.78,2.23,-2.3],d2in:[.98,1.2,-2.3],waterJ2:[.06,1.2,-2.3],mix2:[.57,1.2,-2.3],
  d2out:[4.62,2.23,-2.3],product:[6.6,2.23,-2.3],d1water:[-2.6,.8,-2.3],d2water:[2.8,.8,-2.3],
  dirtyIn:[-2.6,1.52,1.63],dirtyOut:[-1.78,.55,2.45],sepIn:[.4,.55,3.05],sepOut:[2.7,.55,3.05],
  cleanIn:[5.6,1.45,1.62],cleanOut:[4.88,.48,.9],waterPumpIn:[4.74,.48,.9],waterPumpOut:[4.5,.846,.9],
  demulOut:[-6.0,.5,-.1],flocOut:[-4.65,.48,3.25],flocIn:[-2.9,1.92,2.45]
};
const p=ports;
// Every stream has explicit endpoint identities for inspection and validation.
export const streams = [
 {id:'raw',kind:'oil',from:'boundary',to:'pump',points:[p.raw,p.pumpIn]},
 {id:'pump-heater',kind:'oil',from:'pump',to:'heater',points:[p.pumpOut,p.heaterIn]},
 {id:'feed-1',kind:'oil',from:'heater',to:'d1',points:[p.heaterOut,p.demulJ,p.waterJ1,p.mix1,p.d1in]},
 {id:'interstage-crude',kind:'oil',from:'d1',to:'d2',points:[p.d1out,[-.38,2.23,-2.3],[-.38,1.2,-2.3],p.waterJ2,p.mix2,p.d2in]},
 {id:'product',kind:'oil',from:'d2',to:'boundary',points:[p.d2out,p.product]},
 {id:'recycle',kind:'recycle',from:'d2',to:'stage1-water-junction',points:[p.d2water,[2.8,.61,-2.3],[2.8,.61,-.48],[-5.45,.61,-.48],[-5.45,.61,-2.3],p.waterJ1]},
 {id:'effluent',kind:'oily',from:'d1',to:'dirty',points:[p.d1water,[-2.6,.29,-2.3],[-2.6,.29,1.25],[-2.6,1.52,1.25],p.dirtyIn]},
 {id:'to-treatment',kind:'oily',from:'dirty',to:'sep',points:[p.dirtyOut,[-.2,.55,2.45],[-.2,.55,3.05],p.sepIn]},
 {id:'return',kind:'treated',from:'sep',to:'clean',points:[p.sepOut,[5.6,.55,3.05],[5.6,1.45,3.05],p.cleanIn]},
 {id:'tank-to-pump',kind:'treated',from:'clean',to:'wpump',points:[p.cleanOut,p.waterPumpIn]},
 {id:'wash-water',kind:'treated',from:'wpump',to:'stage2-water-junction',points:[p.waterPumpOut,[4.5,.846,-1.1],[.06,.846,-1.1],[.06,.846,-2.3],p.waterJ2]},
 {id:'demulsifier',kind:'chemical',from:'demul',to:'crude-before-stage1',points:[p.demulOut,[-6,.5,-.7],[-5.95,.5,-.7],[-5.95,1.5,-.7],[-5.95,1.5,-2.3],p.demulJ]},
 {id:'flocculant',kind:'chemical',from:'floc',to:'dirty',points:[p.flocOut,[-4.1,.48,3.25],[-4.1,2.12,3.25],[-2.9,2.12,3.25],[-2.9,2.12,2.45],p.flocIn]}
];
export const labels = [
 {id:'d1',text:'Desalter 1',sub:'FIRST STAGE',at:[-2.6,3.2,-2.3],kind:'major'},
 {id:'d2',text:'Desalter 2',sub:'SECOND STAGE',at:[2.8,3.2,-2.3],kind:'major'},
 {id:'dirty',text:'Oily water tank',at:[-2.6,1.95,2.55],offset:[-20,22],kind:'major'},
 {id:'sep',text:'Separators Department',sub:'WATER TREATMENT',at:[1.55,1.45,3.1],offset:[0,20],kind:'major'},
 {id:'clean',text:'Treated water tank',at:[5.6,2.02,.9],kind:'major'},
 {id:'demul',text:'Demulsifier injection',at:[-5.95,1.5,-2.3],offset:[-25,-52],kind:'chemical-label'},
 {id:'floc',text:'Flocculant addition',at:[-3.9,2.12,3.25],offset:[-45,34],kind:'chemical-label'},
 {id:'mix1',text:'Stage 1 mixing valve',at:p.mix1,offset:[-12,48]},
 {id:'mix2',text:'Stage 2 mixing valve',at:p.mix2,offset:[15,57]},
 {id:'heater',text:'Crude preheating',at:[-7.05,1.65,-2.3],offset:[0,-20]},
 {id:'pump',text:'Crude feed pump',at:[-8.32,.85,-2.3],offset:[-12,53]},
 {id:'wpump',text:'Wash water feed pump',at:[4.5,.65,.9],offset:[25,45]},
 {id:'recycle',text:'Interstage water recycle',at:[-1.5,.61,-.48],offset:[0,20]},
 {id:'all',text:'Raw crude inlet',at:p.raw,offset:[-10,-30],kind:'annotation'},
 {id:'all',text:'Treated crude outlet',at:p.product,offset:[-30,-18],kind:'annotation'},
 {id:'heater',text:'Heating utility boundary',at:[-7.06,1.75,-3.1],offset:[0,-22],kind:'annotation'},
 {id:'mix1',text:'Wash water injection',at:p.waterJ1,offset:[-20,20],detail:'d1',kind:'annotation'},
 {id:'mix2',text:'Wash water injection',at:p.waterJ2,offset:[-30,20],detail:'d2',kind:'annotation'},
 {id:'grids',text:'High-voltage power units',at:[-2.6,2.95,-2.9],offset:[-35,-20],detail:'d1',kind:'annotation'},
 {id:'grids',text:'Insulators',at:[-3.4,2.14,-2.0],offset:[-65,-10],detail:'d1',kind:'annotation'},
 {id:'interface',text:'Water outlet control valve',at:[-2.6,.29,-1.25],offset:[20,40],detail:'d1',kind:'annotation'},
 {id:'interface',text:'Narrow emulsion band',at:[-1.7,1.11,-1.75],offset:[70,28],detail:'d1',kind:'annotation'},
 {id:'grids',text:'Schematic electric field',at:[-1.6,1.78,-2.2],offset:[85,-15],detail:'d1',kind:'annotation'},
 {id:'grids',text:'High-voltage power units',at:[2.8,2.95,-2.9],offset:[-35,-20],detail:'d2',kind:'annotation'},
 {id:'grids',text:'Insulators',at:[2,2.14,-2.0],offset:[-65,-10],detail:'d2',kind:'annotation'},
 {id:'interface',text:'Water outlet control valve',at:[2.8,.61,-1.25],offset:[20,40],detail:'d2',kind:'annotation'},
 {id:'grids',text:'Schematic electric field',at:[3.7,1.78,-2.2],offset:[85,-15],detail:'d2',kind:'annotation'}
];
