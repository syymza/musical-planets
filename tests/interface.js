/* Exercise the actual app handlers with a small DOM fixture. Browser QA remains separate. */
(function(root){
root.checkInterface=function(P,ok,close){
 class Element{
  constructor(){this.hidden=false;this.disabled=false;this.style={setProperty(){}};this.dataset={};this.events={};this.children=[];this.attributes={};this.classList={add(){},remove(){}};this.clientWidth=600;}
  addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
  setAttribute(name,value){this.attributes[name]=String(value);}
  append(child){this.children.push(child);child.parent=this;}
  replaceChildren(){this.children=[];}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(p=>p!==this);}
  focus(options){this.focusOptions=options;root.document.activeElement=this;for(const f of this.events.focus||[])f({});}
  getBoundingClientRect(){return {left:0,top:0,width:600,height:600};}
  setPointerCapture(){}
  getContext(){return {setTransform(){}};}
 }
 const elements={};root.window=root;root.document={hidden:false,activeElement:null,getElementById(id){return elements[id]??=new Element();},createElement(){return new Element();},querySelectorAll(){return [];},addEventListener(){}};
 root.matchMedia=()=>({matches:false,addEventListener(){}});root.devicePixelRatio=1;root.ResizeObserver=class{observe(){}};root.requestAnimationFrame=()=>0;
 const source=testFiles['app.js'].replace("load('balance');resize();soundUI();requestAnimationFrame(draw);","globalThis.interfaceApp={get bodies(){return system;},get selected(){return selected;},get scaleIndex(){return scaleIndex;},load,simulate};load('balance');resize();soundUI();requestAnimationFrame(draw);");
 (0,eval)(source);const app=root.interfaceApp,ps=()=>app.bodies.filter(p=>!p.isStar),input=elements.planetNote;
 ok(elements.planetMassControls.hidden&&input.disabled,'no stale initial selection');
 for(let i=0;i<3;i++)elements.add.onclick({detail:1});
 ok(ps().map(p=>p.n).join(',')==='0,1,2,3,4,5','creation covers all six scale stops');ok(new Set(ps().map(p=>p.id)).size===6,'unique ids');ok(ps().at(-1).el.focusOptions.preventScroll,'pointer Add keeps viewport');
 const chosen=ps()[0],color=chosen.colorIndex,physical=[chosen.x,chosen.y,chosen.vx,chosen.vy,chosen.mass];chosen.el.focus();input.oninput({target:{value:'5'}});ok(chosen.n===5&&chosen.colorIndex===color,'note edit independent of color');[chosen.x,chosen.y,chosen.vx,chosen.vy,chosen.mass].forEach((v,i)=>close(v,physical[i],0,'note edit leaves physics untouched'));
 const degrees=ps().map(p=>p.n).join(',');elements.scale.onclick();ok(app.scaleIndex===1&&ps().map(p=>p.n).join(',')===degrees,'scale change preserves degree mapping');elements.scale.onclick();ok(app.scaleIndex===2&&chosen.colorIndex===color,'whole-tone change retains color');
 chosen.el.events.keydown[0]({key:'Enter',preventDefault(){}});ok(root.document.activeElement===elements.planetMass,'Enter reaches mass control intentionally');
 app.load('balance');const [drop,keep]=ps(),s=app.bodies.find(p=>p.isStar);drop.el.focus();input.oninput({target:{value:'5'}});keep.el.focus();input.oninput({target:{value:'2'}});drop.el.focus();drop.x=keep.x=s.x+1.5;drop.y=keep.y=s.y;drop.vx=drop.vy=keep.vx=keep.vy=0;const survivorColor=keep.colorIndex;app.simulate();ok(app.selected===keep.id&&keep.n===2&&keep.colorIndex===survivorColor,'merger retains survivor pitch/color and transfers selection');ok(Number(input.value)===2&&!input.disabled,'pitch control follows surviving body');
 keep.x=s.x;keep.y=s.y;keep.vx=s.vx;keep.vy=s.vy;app.simulate();ok(app.selected===null&&elements.planetMassControls.hidden&&input.disabled,'star absorption clears pitch editor');
 elements.clear.onclick();ok(ps().length===0&&input.disabled,'clear removes pitch target');elements.reset.onclick();ok(ps().length===3&&app.selected===null&&elements.planetMassControls.hidden,'reset clears selection');
};
})(globalThis);
