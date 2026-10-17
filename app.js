(()=>{
'use strict';
const P=window.OrbitPhysics,$=id=>document.getElementById(id),stage=$('stage'),canvas=$('sky'),ctx=canvas.getContext('2d'),layer=$('planets');
const colors=['#f1be89','#a7bfcf','#c4b9e6','#a8c8ac','#e4a8a5','#d8ce95'],notes=[261.63,293.66,329.63,392,440,523.25],names=['C4','D4','E4','G4','A4','C5'];
const motion=matchMedia('(prefers-reduced-motion: reduce)'),timer=P.clock(),VIEW=3.5,LAUNCH_SCALE=1.6;
let planets=[],preset='balance',paused=false,muted=false,started=false,audio=null,master=null,testMaster=null,analyser=null,signalBuffer=null,lastSignal=0,peakRms=0,voices=0,calm=motion.matches,size=600,scale=80,last=null,aim=null,noteCount=0,serial=0,simulationTime=0;
const announce=text=>$('announcement').textContent=text;
function count(){const active=planets.filter(p=>p.state==='orbiting').length;$('count').textContent=`${active} ${active===1?'planet':'planets'} · C pentatonic`;$('add').disabled=active>=8;stage.dataset.planetCount=active;stage.dataset.simulationTime=simulationTime.toFixed(4);$('stageStatus').textContent=aim?(aim.moved?'Release to launch · prediction: up to 8s':'Drag an arrow, or release for a circular orbit'):active?'':'An empty sky. Tap or drag to begin.';}
function screen(p){return {x:size/2+p.x*scale,y:size/2+p.y*scale};}
function world(e){const b=stage.getBoundingClientRect();return {x:(e.clientX-b.left-size/2)/scale,y:(e.clientY-b.top-size/2)/scale};}
function safePosition(q){const r=Math.hypot(q.x,q.y),target=Math.max(.36,Math.min(2.65,r));return r<.00001?{x:target,y:0}:{x:q.x*target/r,y:q.y*target/r};}
function tidy(){planets.filter(p=>p.state!=='orbiting').forEach(p=>p.el.remove());planets=planets.filter(p=>p.state==='orbiting');}
function remove(p){p.el.remove();planets=planets.filter(x=>x!==p);if(aim?.planet===p)aim=null;count();}
function add(state,n=serial++%6){tidy();if(planets.length>=8){announce('Eight planets is a full sky. Remove one or clear the scene.');return null;}
 const p={...state,n,trail:[],flash:0,age:0,el:document.createElement('button')};p.el.className='planet';p.el.style.setProperty('--color',colors[n]);p.el.style.setProperty('--size',`${12+n%3*2}px`);p.el.setAttribute('aria-label',`${names[n]} planet. Arrows nudge velocity; Delete removes it.`);
 p.el.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();if(p.state!=='orbiting')return;p.vx+=e.key==='ArrowRight'?.08:e.key==='ArrowLeft'?-.08:0;p.vy+=e.key==='ArrowDown'?.08:e.key==='ArrowUp'?-.08:0;p.trail=[];announce(`${names[n]} launch velocity adjusted`);}if(['Delete','Backspace'].includes(e.key)){e.preventDefault();remove(p);$('add').focus();}});
 layer.append(p.el);planets.push(p);count();return p;
}
function circularAt(q){const r=Math.hypot(q.x,q.y),v=Math.sqrt(P.GM/r);return P.body(q.x,q.y,-q.y/r*v,q.x/r*v);}
function cancelAim(){if(aim?.planet)aim.planet.el.classList.remove('is-aimed');aim=null;count();}
function load(name){cancelAim();planets.forEach(p=>p.el.remove());planets=[];preset=name;timer.reset();last=null;noteCount=0;simulationTime=0;serial=0;stage.dataset.notesPlayed=0;
 if(name==='balance'){add(P.circular(.86,.8),0);add(P.circular(1.38,3.2),3);add(P.circular(2,4.8),4);}
 if(name==='ellipses'){add(P.ellipse(.52,2.1,.7),0);add(P.ellipse(.9,2.5,3),3);add(P.circular(1.7,5.2,-1),5);}
 if(name==='wild'){add(P.circular(1.2,2),3);add(P.body(1.4,.2,-.55,-.08),0);add(P.body(-.9,.5,-1.6,-.3),4);}
 document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===name)));$('lastNote').textContent=started?'Listening…':'Waiting to play';$('outcome').textContent=name==='wild'?'Watch for a starfall and an escape.':'Small worlds. Real curved paths.';announce('Scene ready');count();
}
function level(){if(master){const volume=Number($('volume').value)/100*.42,t=audio.currentTime;master.gain.setTargetAtTime(muted||paused||document.hidden?0:volume,t,.03);testMaster?.gain.setTargetAtTime(muted||document.hidden?0:volume,t,.03);}}
function soundUI(){
 const interrupted=started&&audio?.state!=='running';stage.dataset.audioState=audio?.state||'not-started';
 $('start').textContent=!started?'♪   Start listening':interrupted?'♪   Resume sound':muted?'♪   Unmute sound':'♪   Mute sound';$('start').setAttribute('aria-pressed',String(started&&!muted&&!interrupted));
 $('soundStatus').textContent=!started?'Tap to enable audio. Try a test note.':interrupted?'Audio paused by the browser. Tap Resume sound.':Number($('volume').value)===0?'Listening level is zero. Raise it to hear notes.':muted?'Sound is muted.':paused?'Time is paused. Test sound still works.':'Sound enabled. Notes play at the line.';
}
async function enableAudio(){
 try{
  if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error();audio=new AC({latencyHint:'interactive'});master=audio.createGain();testMaster=audio.createGain();master.gain.value=testMaster.gain.value=0;const compressor=audio.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=5;analyser=audio.createAnalyser();analyser.fftSize=1024;signalBuffer=new Float32Array(analyser.fftSize);master.connect(compressor);testMaster.connect(compressor);compressor.connect(analyser);analyser.connect(audio.destination);audio.onstatechange=soundUI;}
  // resume() is invoked directly within the click's user-activation task, before awaiting it.
  await audio.resume();if(audio.state!=='running')throw Error();started=true;muted=false;level();soundUI();return true;
 }catch{$('soundStatus').textContent='Audio did not start. Tap Test sound to try again.';stage.dataset.audioState=audio?.state||'unavailable';return false;}
}
function synthesize(n,preview=false){
 if(!started||muted||(!preview&&paused)||document.hidden||!audio||audio.state!=='running'||voices>=8)return false;
 const t=audio.currentTime+(preview ? .08 : 0),osc=audio.createOscillator(),overtone=audio.createOscillator(),gain=audio.createGain(),filter=audio.createBiquadFilter();voices++;osc.type='triangle';osc.frequency.value=notes[n];overtone.type='sine';overtone.frequency.value=notes[n]*2;filter.type='lowpass';filter.frequency.setValueAtTime(2200,t);filter.frequency.exponentialRampToValueAtTime(600,t+1);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.17,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+1.7);osc.connect(gain);overtone.connect(gain);gain.connect(filter);filter.connect(preview?testMaster:master);osc.start(t);overtone.start(t);osc.stop(t+1.8);overtone.stop(t+1.8);osc.onended=()=>{voices--;osc.disconnect();overtone.disconnect();gain.disconnect();filter.disconnect();};return true;
}
async function testSound(){if(await enableAudio()){const sent=synthesize(5,true);if(Number($('volume').value)>0&&sent)$('soundStatus').textContent='Test note sent. If silent, check phone volume and audio output.';}}
function pluck(p,crossing){p.flash=1;noteCount++;stage.dataset.notesPlayed=noteCount;p.el.dataset.crossings=String(Number(p.el.dataset.crossings||0)+1);p.el.dataset.crossingY=crossing.y.toFixed(5);p.el.dataset.crossingTime=simulationTime.toFixed(5);$('lastNote').textContent=names[p.n];
 synthesize(p.n);
}

function outcome(p,type){p.el.hidden=true;p.endedAt=simulationTime;$('outcome').textContent=type==='collision'?`${names[p.n]} fell into the star. Try a sideways launch.`:`${names[p.n]} escaped. A little less speed might keep it close.`;announce($('outcome').textContent);count();}
function simulate(){simulationTime+=P.DT;for(const p of planets){if(p.state!=='orbiting'||aim?.planet===p)continue;const event=P.step(p);p.age++;if(event.crossing)pluck(p,event.crossing);if(event.outcome)outcome(p,event.outcome);if(p.age%16===0){p.trail.push({x:p.x,y:p.y});if(p.trail.length>(calm?2:125))p.trail.shift();}p.flash=Math.max(0,p.flash-P.DT*2);}}
function resize(){size=stage.clientWidth;scale=size*.46/VIEW;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=size*dpr;canvas.height=size*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);planets.forEach(p=>p.trail=[]);cancelAim();}
new ResizeObserver(resize).observe(stage);
function updateAim(e){if(!aim||e.pointerId!==aim.id)return;const q=world(e),dx=q.x-aim.anchor.x,dy=q.y-aim.anchor.y;if(Math.hypot(dx,dy)*scale>7)aim.moved=true;const candidate=aim.moved?P.body(aim.position.x,aim.position.y,dx*LAUNCH_SCALE,dy*LAUNCH_SCALE):circularAt(aim.position);const speed=Math.hypot(candidate.vx,candidate.vy);if(speed>3.2){candidate.vx*=3.2/speed;candidate.vy*=3.2/speed;}aim.candidate=candidate;aim.prediction=P.predict(candidate);count();}
stage.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||aim)return;const p=planets.find(p=>p.state==='orbiting'&&(p.el===e.target||p.el.contains(e.target)));if(!p&&planets.filter(p=>p.state==='orbiting').length>=8){announce('The sky is full. Remove a planet first.');return;}const anchor=world(e),position=p?{x:p.x,y:p.y}:safePosition(anchor);aim={id:e.pointerId,planet:p,anchor,position,moved:false,candidate:null,prediction:null};if(p)p.el.classList.add('is-aimed');stage.setPointerCapture(e.pointerId);updateAim(e);});
stage.addEventListener('pointermove',updateAim);
stage.addEventListener('pointerup',e=>{if(!aim||e.pointerId!==aim.id)return;updateAim(e);const current=aim;if(current.planet){if(current.moved){Object.assign(current.planet,current.candidate);current.planet.trail=[];current.planet.flash=0;}current.planet.el.focus();}else{const p=add(current.candidate);if(p)p.el.focus();}cancelAim();announce(paused?'Launch ready. Resume to set it in motion.':'Planet launched');});
stage.addEventListener('pointercancel',cancelAim);stage.addEventListener('lostpointercapture',()=>{if(aim)cancelAim();});
$('start').onclick=()=>{if(!started||audio?.state!=='running')testSound();else{muted=!muted;level();soundUI();}};
$('testSound').onclick=testSound;
$('pause').onclick=()=>{paused=!paused;timer.reset();last=null;$('pause').innerHTML=paused?'▶ &nbsp; Resume':'Ⅱ &nbsp; Pause';$('pause').setAttribute('aria-pressed',String(paused));level();soundUI();};
$('volume').oninput=()=>{level();soundUI();};$('reset').onclick=()=>load(preset);$('clear').onclick=()=>{cancelAim();planets.forEach(p=>p.el.remove());planets=[];noteCount=0;stage.dataset.notesPlayed=0;$('lastNote').textContent='A quiet moment';$('outcome').textContent='Try a sideways launch to find an orbit.';count();announce('Sky cleared');};
$('add').onclick=()=>{const r=.8+(serial%4)*.34,p=add(P.circular(r,1+serial*1.7));if(p){p.el.focus();announce('Planet added. Arrow keys nudge its velocity.');}};
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>load(b.dataset.preset));
motion.addEventListener('change',e=>{calm=e.matches;planets.forEach(p=>p.trail=[]);});
document.addEventListener('visibilitychange',()=>{last=null;timer.reset();cancelAim();level();soundUI();});
function drawPrediction(){if(!aim?.prediction)return;const points=aim.prediction.points;ctx.strokeStyle='#e7ddc07d';ctx.lineWidth=1;ctx.setLineDash([2,6]);ctx.beginPath();points.forEach((p,i)=>{const q=screen(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.stroke();ctx.setLineDash([]);const a=screen(aim.position),v=aim.candidate,end={x:a.x+v.vx*scale/LAUNCH_SCALE,y:a.y+v.vy*scale/LAUNCH_SCALE};ctx.strokeStyle='#f2cb91';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(end.x,end.y);ctx.stroke();const angle=Math.atan2(end.y-a.y,end.x-a.x);ctx.beginPath();ctx.moveTo(end.x-8*Math.cos(angle-.5),end.y-8*Math.sin(angle-.5));ctx.lineTo(end.x,end.y);ctx.lineTo(end.x-8*Math.cos(angle+.5),end.y-8*Math.sin(angle+.5));ctx.stroke();ctx.strokeStyle='#f2cb9180';ctx.beginPath();ctx.arc(a.x,a.y,9,0,Math.PI*2);ctx.stroke();}
function draw(now){if(analyser&&now-lastSignal>100){lastSignal=now;analyser.getFloatTimeDomainData(signalBuffer);const rms=Math.sqrt(signalBuffer.reduce((sum,x)=>sum+x*x,0)/signalBuffer.length);peakRms=Math.max(peakRms,rms);stage.dataset.audioRms=rms.toFixed(6);stage.dataset.audioPeakRms=peakRms.toFixed(6);$('signal').style.opacity=calm?'.5':String(.25+Math.min(1,rms*40)*.75);}
 const seconds=last===null?0:(now-last)/1000;last=now;const steps=timer.advance(seconds,!paused&&!document.hidden);for(let i=0;i<steps;i++)simulate();stage.dataset.simulationTime=simulationTime.toFixed(4);ctx.clearRect(0,0,size,size);const c=size/2;
 const haze=ctx.createRadialGradient(c,c,0,c,c,size*.48);haze.addColorStop(0,'#e2b57411');haze.addColorStop(.6,'#8a98b205');haze.addColorStop(1,'#10151d00');ctx.fillStyle=haze;ctx.fillRect(0,0,size,size);
 for(let i=0;i<70;i++){const x=((Math.sin(i*127.1)*43758.5453)%1+1)%1*size,y=((Math.sin(i*311.7)*17518.3)%1+1)%1*size;if(Math.hypot(x-c,y-c)<size*.47){ctx.fillStyle=i%3?'#b8c5d520':'#b8c5d544';ctx.fillRect(x,y,1,1);}}
 ctx.strokeStyle='#f2cb9133';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(c,c-size*.46);ctx.lineTo(c,c-P.COLLISION_RADIUS*scale);ctx.stroke();
 for(const p of planets){const q=screen(p);p.el.style.left=q.x+'px';p.el.style.top=q.y+'px';p.el.dataset.x=p.x.toFixed(6);p.el.dataset.y=p.y.toFixed(6);p.el.dataset.vx=p.vx.toFixed(6);p.el.dataset.vy=p.vy.toFixed(6);p.el.dataset.energy=P.energy(p).toFixed(6);p.el.dataset.state=p.state;p.el.hidden=p.state!=='orbiting'||Math.abs(p.x)>VIEW||Math.abs(p.y)>VIEW;
  if(!calm&&p.trail.length>1){const fade=p.state==='orbiting'?1:Math.max(0,1-(simulationTime-p.endedAt)/1.5);for(let i=1;i<p.trail.length;i++){const a=screen(p.trail[i-1]),b=screen(p.trail[i]);ctx.strokeStyle=colors[p.n];ctx.globalAlpha=i/p.trail.length*.5*fade;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.globalAlpha=1;}
  if(p.state==='orbiting'){ctx.fillStyle=colors[p.n];ctx.shadowColor=colors[p.n];ctx.shadowBlur=calm?0:14;ctx.beginPath();ctx.arc(q.x,q.y,6+p.n%3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  if(!calm&&p.flash>0&&p.state==='orbiting'){ctx.strokeStyle=colors[p.n];ctx.globalAlpha=p.flash*.3;ctx.beginPath();ctx.arc(q.x,q.y,10+(1-p.flash)*22,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 }
 const sr=Math.max(7,P.STAR_RADIUS*scale),glow=ctx.createRadialGradient(c,c,0,c,c,sr*4);glow.addColorStop(0,'#f5ca9033');glow.addColorStop(1,'#f5ca9000');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(c,c,sr*4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f2cb91';ctx.beginPath();ctx.arc(c,c,sr,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f2cb912b';ctx.beginPath();ctx.arc(c,c,sr+8,0,Math.PI*2);ctx.stroke();drawPrediction();requestAnimationFrame(draw);
}
load('balance');resize();soundUI();requestAnimationFrame(draw);
})();
