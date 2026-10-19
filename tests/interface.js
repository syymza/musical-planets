/* Exercise the actual app handlers with a small DOM fixture. Browser QA remains separate. */
(function(root){
root.checkInterface=function(P,ok,close){
 class Element{
  constructor(){this.hidden=false;this.disabled=false;this.style={setProperty(){}};this.dataset={};this.events={};this.children=[];this.attributes={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle:(n,on)=>on?this.classes.add(n):this.classes.delete(n),contains:n=>this.classes.has(n)};this.clientWidth=600;}
  addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
  setAttribute(name,value){this.attributes[name]=String(value);}
  removeAttribute(name){delete this.attributes[name];}
  closest(){return this.editable?this:null;}
  append(child){this.children.push(child);child.parent=this;}
  replaceChildren(){this.children=[];}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(p=>p!==this);}
  focus(options){this.focusOptions=options;root.document.activeElement=this;for(const f of this.events.focus||[])f({});}
  getBoundingClientRect(){return {left:0,top:0,width:600,height:600};}
  setPointerCapture(){}
  getContext(){return {setTransform(){}};}
 }
 const elements={};root.window=root;root.document={hidden:false,activeElement:null,getElementById(id){return elements[id]??=new Element();},createElement(){return new Element();},querySelectorAll(){return [];},querySelector(){return elements.lineLabel??=new Element();},addEventListener(){}};
 const desktopMedia={matches:true,addEventListener(name,fn){this.change=fn;}};root.matchMedia=query=>query.includes('pointer: fine')?desktopMedia:{matches:false,addEventListener(){}};root.devicePixelRatio=1;root.ResizeObserver=class{observe(){}};root.requestAnimationFrame=()=>0;
 const source=testFiles['app.js'].replace("load('balance');resize();soundUI();requestAnimationFrame(draw);","globalThis.interfaceApp={get bodies(){return system;},get selected(){return selected;},get scaleIndex(){return scaleIndex;},get lineCount(){return lineCount;},get noteCount(){return noteCount;},get rayFlashes(){return rayFlashes;},get simulationTime(){return simulationTime;},load,simulate};load('balance');resize();soundUI();requestAnimationFrame(draw);");
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

 app.load('balance');elements.stage.focus();
 function navigate(key,extras={}){let prevented=false;const event={key,target:root.document.activeElement,preventDefault(){prevented=true;},...extras};elements.stage.events.keydown[0](event);return prevented;}
 const initialPositions=ps().map(p=>[p.x,p.y,p.vx,p.vy,p.mass]);
 ok(navigate(']')&&app.selected===ps()[0].id,'next selects first visible planet from sky');ok(ps()[0].el.attributes['aria-pressed']==='true'&&ps()[0].el.classList.contains('is-selected'),'selection has accessible and visual state');ok(root.document.activeElement.focusOptions.preventScroll,'selection never scrolls focus');
 navigate('[');ok(app.selected===ps().at(-1).id,'previous wraps to last');navigate(']');ok(app.selected===ps()[0].id,'next wraps to first');
 for(let i=0;i<65;i++)navigate(']',{repeat:true});ok(app.selected===ps()[2].id,'held/repeated key wraps consistently');ok(JSON.stringify(ps().map(p=>[p.x,p.y,p.vx,p.vy,p.mass]))===JSON.stringify(initialPositions),'selection changes no dynamics');
 ps()[0].el.hidden=true;navigate(']');ok(app.selected===ps()[1].id,'hidden offscreen planets skipped');ps()[0].el.hidden=false;
 for(const extras of [{altKey:true},{ctrlKey:true},{metaKey:true},{shiftKey:true},{isComposing:true},{defaultPrevented:true},{target:{closest(){return {};}}}]){const prior=app.selected;ok(!navigate(']',extras)&&app.selected===prior,'modifiers/composition/consumed/editing events untouched');}
 const prior=app.selected;ok(!navigate('ArrowRight')&&app.selected===prior,'navigation does not capture velocity arrows');
 desktopMedia.matches=false;desktopMedia.change();ok(elements.stage.tabIndex===-1&&elements.keyboardHint.hidden,'mobile gate removes sky tab stop and help');ok(!navigate(']')&&app.selected===prior,'shortcut disabled on mobile');desktopMedia.matches=true;desktopMedia.change();ok(elements.stage.tabIndex===0&&!elements.keyboardHint.hidden,'desktop gate restores focus and help');
 ps()[0].el.focus();ps()[0].el.events.keydown[0]({key:'Delete',preventDefault(){}});ok(ps().length===2&&app.selected===ps()[0].id&&root.document.activeElement===ps()[0].el,'deletion keeps selection/focus on next available planet');navigate(']');ok(app.selected===ps()[1].id,'navigation continues after deletion');
 elements.clear.onclick();elements.stage.focus();ok(navigate(']')&&app.selected===null,'empty sky handled');ok(elements.announcement.textContent==='No planets in view.','empty sky announced');
 app.load('balance');const [victim,survivor]=ps(),sunForKeys=app.bodies.find(p=>p.isStar);victim.el.focus();Object.assign(victim,{x:sunForKeys.x+1.5,y:sunForKeys.y,vx:0,vy:0});Object.assign(survivor,{x:victim.x,y:victim.y,vx:0,vy:0});app.simulate();ok(app.selected===survivor.id&&root.document.activeElement===survivor.el,'merger transfers focused selection to survivor');navigate(']');ok(app.selected!==victim.id,'merged body never revisited');survivor.el.focus();Object.assign(survivor,{x:sunForKeys.x,y:sunForKeys.y,vx:0,vy:0});app.simulate();ok(root.document.activeElement===elements.stage&&app.selected===null,'star absorption returns keyboard focus to sky');
 elements.reset.onclick();ok(app.selected===null&&ps().every(p=>p.el.attributes['aria-pressed']==='false'),'reset clears selected state');
 ok(app.lineCount===1,'one ray remains default');
 for(const paused of [true,false]){elements.pause.onclick();const time=app.simulationTime,notes=app.noteCount,positions=ps().map(p=>[p.x,p.y,p.vx,p.vy]);for(const value of [2,7,12,1]){elements.noteLines.value=value;elements.noteLines.oninput();ok(app.lineCount===value&&Number(elements.lineValue.textContent)===value,'count slider and output agree');ok(app.noteCount===notes&&app.simulationTime===time,'slider alone neither advances time nor invents a note');ok(app.rayFlashes.every(f=>f===0),'new rays do not flash until a crossing');ok(JSON.stringify(ps().map(p=>[p.x,p.y,p.vx,p.vy]))===JSON.stringify(positions),'slider preserves bodies');}}
 elements.noteLines.value=12;elements.noteLines.oninput();elements.reset.onclick();ok(app.lineCount===12&&app.rayFlashes.length===12,'reset retains chosen line count');
 elements.starMass.oninput({target:{value:'3'}});for(let i=ps().length;i<P.MAX_PLANETS;i++)elements.add.onclick({detail:1});ok(P.MAX_PLANETS===32&&ps().length===32,'32 planets reachable even with star mass3');ok(P.center(app.bodies).mass<=P.MASS_BUDGET,'maximum default population respects budget');ok(elements.add.disabled,'button disabled exactly at count limit');elements.add.onclick({detail:1});ok(ps().length===32,'extra Add cannot exceed cap');
 ps()[0].el.events.keydown[0]({key:'Delete',preventDefault(){}});ok(ps().length===31&&!elements.add.disabled,'remove reopens a count slot');elements.add.onclick({detail:1});ok(ps().length===32,'removed slot can be filled');
 elements.clear.onclick();ok(ps().length===0&&app.rayFlashes.every(f=>f===0),'clear removes planets and crossing pulses');elements.reset.onclick();ok(ps().length===3&&app.lineCount===12,'reset returns curated scene and retains ray setting');
 const sun=app.bodies.find(p=>p.isStar),planet=ps()[0];ps().slice(1).forEach(p=>p.el.events.keydown[0]({key:'Delete',preventDefault(){}}));Object.assign(planet,{x:sun.x-.001,y:sun.y-1,vx:sun.vx+2,vy:sun.vy});const notes=app.noteCount;app.simulate();ok(app.noteCount>notes&&app.rayFlashes[0]>0,'actual crossing increments count and pulses matching ray');

};
})(globalThis);
