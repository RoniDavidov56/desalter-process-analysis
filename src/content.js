// Public project text.
export const project = {
  "summary": "An interactive engineering visualization of a two-stage desalting system, connecting equipment functions, process flows, and control principles in one accessible model.",
  "objectives": [
    "Explain the roles of the main equipment and the connections between process stages.",
    "Illustrate crude flow, water reuse, chemical addition, and interface control.",
    "Communicate engineering principles through interactive exploration and visible equipment internals."
  ],
  "assumptions": [
    "Equipment geometry, dimensions, pipe routing, liquid levels, and the displayed feed sequence are illustrative.",
    "Vessel internals represent a generic AC electrostatic arrangement informed by public technical references.",
    "The Separators Department is shown as a general water-treatment boundary. Its internal operations and the complete water balance are outside the model scope.",
    "Colors, droplets, and motion explain process mechanisms. Chemical addition points provide context without specifying products, dosages, or treatment performance."
  ],
  "connections": [
    "Desalter 2 → Wash water injection before stage 1.",
    "Desalter 1 → Oily water tank → Separators Department.",
    "Separators Department → Treated water tank → Wash water feed pump → Water injection before stage 2."
  ],
  "references": [
    {
      "title": "Axsia Howmar — Electrostatic coalescers",
      "url": "https://axsiahowmar.com/solutions/crude-oil-treatment/electrostatic-coalescers/",
      "note": "Internal equipment arrangement, coalescence, and interface control."
    },
    {
      "title": "SLB / Schlumberger — BILECTRIC HF product sheet",
      "url": "https://www.gmsthailand.com/wp-content/uploads/2021/09/brochure.pdf",
      "note": "Desalter components and process operation. Manufacturer-authored document hosted by GMS."
    },
    {
      "title": "Shell — WO2018081214A1",
      "url": "https://patents.google.com/patent/WO2018081214A1/en",
      "note": "A published example of desalter emulsion detection and control."
    },
    {
      "title": "Alfa Laval — Crude oil desalting",
      "url": "https://www.alfalaval.us/industries/energy-and-utilities/crude-oil-refinery/crude-oil-processing/crude-oil-desalting/",
      "note": "Heat-exchange context for desalting systems."
    }
  ]
};

export const equipment = {
  all:{name:'Two stages, connected by water',tag:'Process overview',description:'Crude flows left to right through two electrostatic desalters. Wash water contacts the crude before each stage; the field encourages droplets to merge and gravity separates the water. Both cutaways are always open.',connection:'Stage 2 water → Stage 1; treated supply → Stage 2.'},
  d1:{name:'Desalter 1',tag:'First separation stage',description:'A lower distributor spreads the crude–water mixture beneath three electrode grids. The illustrative AC field encourages water droplets to merge; larger drops settle below the interface. The upper collector sends crude to stage 2.',connection:'Water from stage 2 enters upstream. Bottom water → oily water tank.'},
  d2:{name:'Desalter 2',tag:'Second separation stage',description:'Treated wash water is mixed into the incoming crude before this vessel. The same generic AC arrangement separates coalesced water from the upper crude phase. Treated crude remains crude oil; perfect purification is not implied.',connection:'Upper crude → downstream process. Bottom water → Stage 1 feed.'},
  dirty:{name:'Oily water tank',tag:'Aqueous treatment context',description:'Receives the aqueous effluent from stage 1. Cloudy blue-green liquid, oil droplets and suspended particles distinguish it from the treated supply. The flocculant evaluation is associated with this aqueous stream.',connection:'Desalter 1 water → this tank → Separators Department.'},
  sep:{name:'Separators Department — Water Treatment',tag:'Outside the study boundary',description:'This is an entire water-treatment department, represented as one general process block. The owner’s work did not cover its internal treatment operations. No particular separator, filter, flotation unit or treatment performance is assumed.',connection:'Oily water tank → department → treated water tank.'},
  clean:{name:'Treated water tank',tag:'Wash water supply',description:'Holds the treated water returning from the Separators Department. Its pale-blue appearance distinguishes it from oily water; it does not mean potable or salt-free water. A feed pump supplies the stage 2 injection junction.',connection:'Department return → tank → wash water feed pump → Stage 2.'},
  pump:{name:'Crude feed pump',tag:'Hydraulic energy',description:'The schematic pump and motor explain how hydraulic energy is supplied to the crude stream. Flow depends on the resulting pressure distribution, piping resistance and equipment losses. The electric field inside a desalter does not pump crude through the system.',connection:'Raw crude inlet → feed pump → crude preheater.'},
  heater:{name:'Crude preheating',tag:'Schematic heat exchanger',description:'Preheating reduces crude viscosity and supports separation under suitable operating conditions. A generic heat exchanger is shown before stage 1. Heating-utility connections end at the model boundary; no utility identity or temperature is assigned.',connection:'Feed pump → preheater → demulsifier injection.'},
  mix1:{name:'Stage 1 mixing valve',tag:'Wash water mixing',description:'Water reused from stage 2 enters the crude before this valve. Pressure drop and shear disperse it into droplets for contact with the crude. The enlarged transparent section illustrates dispersion, with no rotating impeller.',connection:'Crude + Stage 2 water → mixing valve → Desalter 1 distributor.'},
  mix2:{name:'Stage 2 mixing valve',tag:'Wash water mixing',description:'Treated supply water joins the interstage crude before this mixing valve. Dispersion creates contact between the phases; the downstream desalter then promotes droplet coalescence and separation. More intense mixing is not automatically better.',connection:'Stage 1 crude + treated water → mixing valve → Desalter 2.'},
  demul:{name:'Demulsifier injection',tag:'Chemical evaluation context',description:'A demulsifier can help weaken the stabilizing films around water droplets in crude and aid emulsion separation. The addition point is shown after the schematic preheater, before stage 1. This order is an illustrative assumption; products, doses and trial outcomes are unspecified.',connection:'Generic dosing line → crude feed before Stage 1 mixing.'},
  floc:{name:'Flocculant addition',tag:'Oily-water evaluation context',description:'The flocculant evaluation belongs to the oily-water stream. Flocculation can bring dispersed material together; its mechanism and outcome depend on the treatment. The model makes no claim that a particular floc settles, floats or is removed by a specified downstream device.',connection:'Generic dosing line → oily water tank → water-treatment department.'},
  wpump:{name:'Wash water feed pump',tag:'Hydraulic energy',description:'This schematic pump supplies the stage 2 wash-water injection point from the treated water tank. It is included to explain the driving force, not to specify an installed pump or its duty.',connection:'Treated water tank → pump → Stage 2 water injection.'},
  recycle:{name:'Interstage water recycle',tag:'Countercurrent stage-to-stage use',description:'Water from the lower region of stage 2 returns to the crude feed before stage 1 mixing. This interstage aqueous stream is distinct from the treated supply; its composition and recovery fraction are not specified.',connection:'Desalter 2 bottom water → Stage 1 wash water injection.'},
  grids:{name:'Electrode grids & electrical supply',tag:'Generic three-grid AC arrangement',description:'Three horizontal grids are supported on insulators and supplied through entrance bushings by external power units. Physical grid bars are separate from the faint field overlay. The field promotes droplet coalescence; gravity supplies the downward settling force.',connection:'External power units → insulated bushings → electrode grids.'},
  interface:{name:'Oil-water interface control',tag:'Water withdrawal',description:'A schematic interface instrument sends a dashed control signal to the water-outlet valve. Water withdrawal regulates the separation interface beneath the electrodes. This is an internal phase interface, not a storage tank’s total liquid level.',connection:'Interface measurement → water outlet control valve.'}
};
