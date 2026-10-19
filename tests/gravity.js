(function(){
'use strict';
(0,eval)(testFiles['physics.js']);(0,eval)(testFiles['camera.js']);const P=OrbitPhysics,C=OrbitCamera;let assertions=0;const receipts=[];
function ok(value,message){assertions++;if(!value)throw Error(message);}
function close(a,b,t=1e-10,message='numeric equality'){ok(Math.abs(a-b)<=t,`${message}: ${a} vs ${b}`);}
function scene(m=.06){const s=P.body('s',0,0,0,0,1,true),p=P.body('p',1.4,0,0,Math.sqrt((1+m)*1.4**2/(1.4**2+P.SOFTENING**2)**1.5),m);return P.recenter([s,p]);}
function group(name,f){f();receipts.push(name);}
group('Barycentric dynamics and conservation over 30 seconds',()=>{const ps=scene(),before=P.totals(ps);let maxDrift=0;for(let i=0;i<18000;i++){P.stepSystem(ps);const t=P.totals(ps);maxDrift=Math.max(maxDrift,Math.abs((t.energy-before.energy)/before.energy));if(i%120===0){close(t.px,0,1e-12);close(t.py,0,1e-12);close(t.x,0,1e-11);close(t.y,0,1e-11);close(t.angular,before.angular,1e-11);}}ok(maxDrift<1e-5,'energy bounded');ok(Math.hypot(ps[0].x,ps[0].y)>.05,'star moves');receipts.push(`Two-body maximum relative energy drift ${maxDrift}`);});
group('Eccentric and multi-body energy stays bounded away from collisions',()=>{for(const multi of [false,true]){const ps=scene(.008);ps[1].vy*=.72;if(multi)ps.push(P.body('outer',-2.6,0,0,-.62,.012));P.recenter(ps);const initial=P.totals(ps);let drift=0,mergers=0;for(let i=0;i<12000;i++){mergers+=P.stepSystem(ps).mergers.length;const t=P.totals(ps);drift=Math.max(drift,Math.abs((t.energy-initial.energy)/initial.energy));}ok(!mergers,'conservation scene has no mergers');ok(drift<.0001,'eccentric energy drift below 0.01%');close(P.totals(ps).px,initial.px,1e-11);close(P.totals(ps).py,initial.py,1e-11);receipts.push(`${multi?'Three':'Two'}-body eccentric energy drift ${drift}`);}});
group('Mutual pulls respond to both masses',()=>{const ps=scene(.01),a=P.accelerations(ps);P.changeMass(ps[1],.15);const b=P.accelerations(ps);close(b[0].x/a[0].x,15,1e-10);P.changeMass(ps[0],3);const c=P.accelerations(ps);close(c[1].x/b[1].x,3,1e-10);});
group('Merger invariants and dissipated kinetic energy',()=>{const a=P.body('a',-1,.1,2,.3,.08),b=P.body('b',1,-.2,-1,.5,.04);a.spin=.03;b.spin=.02;const before=P.totals([a,b]),volume=a.radius**3+b.radius**3,e=P.merge(a,b),after=P.totals([a,b]);close(after.mass,before.mass);close(after.px,before.px);close(after.py,before.py);close(after.x,before.x);close(after.y,before.y);close(after.angular,before.angular);close(before.kinetic-after.kinetic,e.dissipated);close(e.keep.radius**3,volume);ok(e.drop.state==='merged','retired collider');});
group('Swept collisions catch fast crossings and preserve all mass',()=>{const ps=[P.body('a',-1,0,2000,0,.01),P.body('b',1,0,-2000,0,.01)];const e=P.stepSystem(ps);ok(e.mergers.length===1,'no tunneling');close(P.totals(ps).mass,.02);close(P.totals(ps).px,0,1e-9);const overlap=[P.body('s',0,0,0,0,3,true),P.body('a',0,0,0,0,.15),P.body('b',0,0,0,0,.15)];P.stepSystem(overlap);close(P.totals(overlap).mass,3.3);ok(P.active(overlap).length===1,'chain merger');});
group('Finite forces at coincident positions and bounded control extremes',()=>{for(const sm of [.5,3])for(const pm of [.005,.15]){const ps=[P.body('s',0,0,0,0,sm,true),P.body('p',.25,0,0,4,pm)];for(let i=0;i<1800;i++)P.stepSystem(ps);for(const p of P.active(ps))for(const k of ['x','y','vx','vy','mass'])ok(Number.isFinite(p[k]),`finite ${k}`);}const a=P.accelerations([P.body('a',0,0,0,0),P.body('b',0,0,0,0)]);ok(a.every(p=>Number.isFinite(p.x)),'softened singularity');});
group('Prediction uses identical full-system integration and ends at mergers',()=>{const ps=scene(.09),prediction=P.predict(ps,'p'),actual=ps.map(p=>({...p}));for(let i=0;i<1800;i++)P.stepSystem(actual);const end=prediction.points.at(-1);close(end.x,actual[1].x,1e-12);close(end.y,actual[1].y,1e-12);const colliders=[P.body('s',0,0,0,0,1,true),P.body('p',.3,0,-1,0,.012)];ok(P.predict(colliders,'p').merger,'prediction collision');});
group('Moving-star note line and half-open crossings',()=>{ok(P.rayCrossing(-1,-2,0,-2),'arriving crossing');ok(!P.rayCrossing(0,-2,1,-2),'departure no duplicate');ok(!P.rayCrossing(-1,2,1,2),'lower line silent');const ps=[P.body('s',0,0,2,0,1,true),P.body('p',.001,-1,0,0,.01)];ok(P.stepSystem(ps).crossings.length===1,'star-relative moving line');});
group('Fixed time steps produce identical results at 30, 60 and 144 Hz',()=>{const results=[];for(const hz of [30,60,144]){const ps=scene(),clock=P.clock();let steps=0;for(let frame=0;frame<hz*10;frame++){const n=clock.advance(1/hz);steps+=n;for(let i=0;i<n;i++)P.stepSystem(ps);}ok(steps===6000,'same step count');results.push(ps);}for(let j=1;j<results.length;j++)for(let i=0;i<2;i++)for(const k of ['x','y','vx','vy'])close(results[0][i][k],results[j][i][k],1e-12);const clock=P.clock();ok(clock.advance(.05,false)===0,'paused');ok(clock.advance(1)===0,'long stall discarded');});
group('Distant bodies remain active',()=>{const ps=[P.body('s',0,0,0,0,1,true),P.body('p',20,0,3,0,.012)];P.stepSystem(ps);ok(P.active(ps).length===2,'no mass deletion');});

group('Evenly spaced rays and half-open crossings in both directions',()=>{
 for(const count of [1,2,3,4,7,12]){
  const rays=P.noteRays(count);ok(rays.length===count,'requested rays');close(rays[0].x,0);close(rays[0].y,-1);
  for(const ray of rays){close(Math.hypot(ray.x,ray.y),1);const angle=ray.line*Math.PI*2/count;close(ray.x,Math.sin(angle));close(ray.y,-Math.cos(angle));
   for(const sign of [-1,1]){
    const nx=-ray.y,ny=ray.x,s=P.body('s',0,0,0,0,1e-12,true),p=P.body('p',ray.x*2-nx*.1*sign,ray.y*2-ny*.1*sign,nx*sign,ny*sign,1e-12);
    const first=P.stepSystem([s,p],.1,count).crossings.filter(e=>e.line===ray.line);ok(first.length===1,'arrival counts once on any ray in either direction');
    ok(P.stepSystem([s,p],.1,count).crossings.every(e=>e.line!==ray.line),'departure does not double count');
   }
   const still=[P.body('s',0,0,0,0,1e-12,true),P.body('p',ray.x*2,ray.y*2,0,0,1e-12)];ok(P.stepSystem(still,P.DT,count).crossings.length===0,'stationary radial overlap is silent');
  }
 }
});
group('One complete orbit crosses each selected ray exactly once in either direction',()=>{
 for(const count of [1,3,12])for(const sign of [-1,1]){const r=1.5,m=.0001,a=.31,omega=Math.sqrt((1+m)/(r*r+P.SOFTENING**2)**1.5),ps=P.recenter([P.body('s',0,0,0,0,1,true),P.body('p',r*Math.cos(a),r*Math.sin(a),-sign*r*omega*Math.sin(a),sign*r*omega*Math.cos(a),m)]),hits=Array(count).fill(0);for(let i=0;i<Math.ceil(Math.PI*2/omega/P.DT);i++)for(const e of P.stepSystem(ps,P.DT,count).crossings)hits[e.line]++;ok(hits.every(n=>n===1),'each ray fires once per complete clockwise/counterclockwise orbit');}
});
group('Fast segments cross every intersected ray in chronological order',()=>{
 for(const sign of [-1,1]){const ps=[P.body('s',0,0,0,0,1e-12,true),P.body('p',-2*sign,-1,4*sign,0,1e-12)];const events=P.stepSystem(ps,1,12).crossings;ok(events.length===5,'five distinct rays on a fast upper segment');ok(new Set(events.map(e=>e.line)).size===5,'each ray exactly once');for(let i=1;i<events.length;i++)ok(events[i].time>=events[i-1].time,'chronological crossings');}
 const translated=[P.body('s',0,0,20,0,1e-12,true),P.body('p',1,-2,0,0,1e-12)];ok(P.stepSystem(translated,.1,4).crossings.filter(e=>e.line===0).length===1,'rays follow a translating star');
 const center=[P.body('s',0,0,0,0,1,true),P.body('p',-.001,0,2,0,.012)];ok(P.stepSystem(center,P.DT,12).crossings.length===0,'overlap merger does not invent central notes');
});
group('Ray count changes do not affect trajectories, prediction or merger invariants',()=>{
 const one=scene(),many=scene(),before=P.totals(many);for(let i=0;i<1000;i++){P.stepSystem(one);P.stepSystem(many,P.DT,i%12+1);}for(let i=0;i<one.length;i++)for(const k of ['x','y','vx','vy'])close(one[i][k],many[i][k],0,'identical physics with changing ray count');close(P.totals(many).mass,before.mass);
 const ps=scene(),pred=P.predict(ps,'p',.1),actual=ps.map(p=>({...p}));for(let i=0;i<60;i++)P.stepSystem(actual,P.DT,12);close(pred.points.at(-1).x,actual[1].x,1e-12);close(pred.points.at(-1).y,actual[1].y,1e-12);
});

group('Camera bounds, smooth settling, hysteresis and aiming freeze',()=>{
 const ps=[P.body('s',4,-3,0,0,1,true),P.body('p',10004,-3,0,0,.012)],view=C.create(ps[0]);const snapshot=JSON.stringify(ps),before={...view};C.update(view,ps,1/60);ok(view.half>before.half&&view.half<C.MAX_HALF,'gentle first zoom step');for(let i=0;i<900;i++)C.update(view,ps,1/60);close(view.half,C.MAX_HALF,1e-10,'distant escape cannot shrink below cap');close(view.x,4);close(view.y,-3);ok(JSON.stringify(ps)===snapshot,'framing does not alter bodies');
 const frozen=JSON.stringify(view);ps[0].x+=10;for(let i=0;i<60;i++)C.update(view,ps,1/60,true);ok(JSON.stringify(view)===frozen,'aiming freezes position, zoom and target');
 const goal=4.5,jitter=C.create();jitter.goal=jitter.half=goal;const s=P.body('s',0,0,0,0,1,true),p=P.body('p',goal*(1-C.PADDING)-.06,0,0,0,.012);for(let i=0;i<120;i++){p.x=(goal+.01*Math.sin(i))*(1-C.PADDING)-p.radius;C.update(jitter,[s,p],1/60);}close(jitter.half,goal,0,'small orbital jitter does not pump zoom');
 const clear=C.create();clear.half=clear.goal=C.MAX_HALF;C.update(clear,[s],1/60);ok(clear.half<C.MAX_HALF&&clear.half>C.BASE_HALF,'clear eases inward');for(let i=0;i<3000;i++)C.update(clear,[],1/60);close(clear.half,C.BASE_HALF,1e-10,'empty model settles safely');ok([clear.x,clear.y,clear.half].every(Number.isFinite),'empty model finite');
});
group('Camera projection round trips and marker bounds at desktop/mobile sizes',()=>{
 for(const size of [120,320,390,600,1280])for(const half of [C.BASE_HALF,5,C.MAX_HALF]){const view={x:-2.3,y:7.2,half};for(const x of [-100,-1,0,2,100])for(const y of [-100,0,3,100]){const q={x,y},back=C.toWorld(C.toScreen(q,view,size),view,size);close(back.x,x,1e-11,'launch x round trip');close(back.y,y,1e-11,'launch y round trip');}for(const p of [{x:-1000,y:20},{x:10000,y:10000},{x:size/2,y:-1000},{x:0,y:10000}]){const marker=C.edge(p,size,28,100);ok(marker.outside&&marker.x>=0&&marker.x<=size&&marker.y>=0&&marker.y<=size,'edge arrow in bounds');ok(Number.isFinite(marker.angle),'finite marker direction');}}
 const middle=C.edge({x:200,y:200},400);ok(!middle.outside&&middle.x===200&&middle.y===200,'visible body keeps its projection');
});
group('Camera updates preserve escaping trajectories and collision results',()=>{
 const a=scene(),b=scene(),view=C.create();a[1].vx=b[1].vx=3;for(let i=0;i<6000;i++){P.stepSystem(a);P.stepSystem(b);if(i%10===0)C.update(view,b,1/60);}for(let i=0;i<a.length;i++)for(const k of ['x','y','vx','vy','mass','radius'])close(a[i][k],b[i][k],0,'camera cannot change physics');ok(view.half<=C.MAX_HALF,'escaping body respects view cap');ok(P.active(b).length===2,'camera never deletes an escapee');
});

(0,eval)(testFiles['audio.js']);const A=OrbitAudio;
group('Three six-stop scales use exact equal-temperament pitch mapping',()=>{ok(A.SCALES.length===3,'three scales');for(let k=0;k<3;k++){ok(A.SCALES[k].names.length===6,'six labels');for(let n=0;n<6;n++){const f=A.frequency(n,k);ok(Number.isFinite(f)&&f>=523&&f<1047,'phone-friendly frequency range');close(12*Math.log2(f/A.frequency(0,k)),A.SCALES[k].semitones[n],1e-10,'semitone map');if(n)ok(f>A.frequency(n-1,k),'ascending stops');}}});
group('Collision types and intensity are bounded and increase with severity',()=>{for(const [star,mass,kind]of [[false,.024,'small'],[false,.12,'heavy'],[true,1.012,'star']]){let last=0;for(const dissipated of [0,.0001,.01,1,100000]){const p=A.collisionProfile({keep:{isStar:star,mass},dissipated});ok(p.kind===kind,'correct percussion type');ok(p.gain>=.1&&p.gain<=.24,'bounded amplitude');ok(p.gain>=last,'severity monotonic');ok(p.duration>0&&p.duration<.5,'short impact');last=p.gain;}}});
group('Mixed voices retain the shared bounded limiter and explicit caps',()=>{ok(A.MAX_NOTES===3&&A.MAX_HITS===2&&A.MAX_VOICES===5,'separate note and impact voice caps');const curve=A.limiterCurve();ok([...curve].every(Number.isFinite),'finite curve');ok(Math.max(...curve)<.6&&Math.min(...curve)>-.6,'limiter bound');});
(0,eval)(testFiles['tests/interface.js']);group('Actual app scale, pitch, color and merger-selection handlers',()=>checkInterface(P,ok,close));
globalThis.testResult=JSON.stringify({groups:receipts,assertions,status:'PASS'},null,2);
})();
