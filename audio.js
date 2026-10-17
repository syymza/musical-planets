/* Local synthesis with bounded voices and a shared soft limiter. */
(function(root){
'use strict';
const SCALES=[
 {label:'C major pentatonic',short:'Major pent.',names:['C5','D5','E5','G5','A5','C6'],semitones:[0,2,4,7,9,12]},
 {label:'C minor pentatonic',short:'Minor pent.',names:['C5','E♭5','F5','G5','B♭5','C6'],semitones:[0,3,5,7,10,12]},
 {label:'C whole tone',short:'Whole tone',names:['C5','D5','E5','F♯5','G♯5','B♭5'],semitones:[0,2,4,6,8,10]}
];
const MAX_NOTES=3,MAX_HITS=2,MAX_VOICES=MAX_NOTES+MAX_HITS,CEILING=.6;
function frequency(n,scale=0){return 523.2511306*2**(SCALES[scale].semitones[n]/12);}
const NOTES=SCALES[0].semitones.map((_,n)=>frequency(n));
function limiterCurve(){const a=new Float32Array(8192);for(let i=0;i<a.length;i++){const x=i/(a.length-1)*2-1;a[i]=CEILING*Math.tanh(x/CEILING);}return a;}
function graph(context,destination){
 const music=context.createGain(),preview=context.createGain(),hits=context.createGain(),filter=context.createBiquadFilter(),limiter=context.createWaveShaper(),analyser=context.createAnalyser();
 music.gain.value=preview.gain.value=hits.gain.value=0;filter.type='highpass';filter.frequency.value=160;limiter.curve=limiterCurve();limiter.oversample='2x';analyser.fftSize=2048;
 music.connect(filter);preview.connect(filter);hits.connect(filter);filter.connect(limiter);limiter.connect(analyser);analyser.connect(destination);return {music,preview,hits,analyser};
}
function note(context,bus,n,preview=false,when=context.currentTime,scale=0){
 const env=context.createGain(),tone=context.createBiquadFilter(),duration=preview?.3:1;
 tone.type='lowpass';tone.frequency.value=3500;env.gain.setValueAtTime(0,when);env.gain.linearRampToValueAtTime(.6,when+.015);env.gain.setValueAtTime(.6,when+(preview?.035:.065));env.gain.exponentialRampToValueAtTime(.006,when+(preview?.22:.85));env.gain.linearRampToValueAtTime(0,when+duration-.01);tone.connect(env);env.connect(bus);
 const oscillators=[.65,.25,.1].map((weight,i)=>{const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=frequency(n,scale)*(i+1);g.gain.value=weight;o.connect(g);g.connect(tone);o.start(when);o.stop(when+duration);return {o,g};});
 return new Promise(resolve=>{oscillators[0].o.onended=()=>{oscillators.forEach(({o,g})=>{o.disconnect();g.disconnect();});tone.disconnect();env.disconnect();resolve();};});
}
function collisionProfile(event){
 const kind=event.keep.isStar?'star':event.keep.mass>=.06?'heavy':'small',specific=Math.max(0,event.dissipated)/Math.max(.001,event.keep.mass),severity=Math.sqrt(specific/(specific+.15));
 return {kind,severity,gain:.10+.14*severity,duration:kind==='star'?.48:kind==='heavy'?.32:.16,start:kind==='star'?160:kind==='heavy'?210:470,end:kind==='star'?75:kind==='heavy'?105:340};
}
function hit(context,bus,event,when=context.currentTime){
 const p=collisionProfile(event),env=context.createGain();env.gain.setValueAtTime(0,when);env.gain.linearRampToValueAtTime(p.gain,when+.006);env.gain.exponentialRampToValueAtTime(.0001,when+p.duration-.01);env.gain.linearRampToValueAtTime(0,when+p.duration);env.connect(bus);
 const parts=p.kind==='small'?[[1,.65],[1.57,.25],[2.32,.1]]:p.kind==='heavy'?[[1,.65],[2.05,.35]]:[[1,.65],[2,.25],[6,.1]];
 const oscillators=parts.map(([multiple,weight])=>{const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.setValueAtTime(p.start*multiple,when);o.frequency.exponentialRampToValueAtTime(p.end*multiple,when+p.duration);g.gain.value=weight;o.connect(g);g.connect(env);o.start(when);o.stop(when+p.duration+.01);return {o,g};});
 return new Promise(resolve=>{oscillators[0].o.onended=()=>{oscillators.forEach(({o,g})=>{o.disconnect();g.disconnect();});env.disconnect();resolve();};});
}
function create(onState=()=>{}){
 let context=null,nodes=null,notes=0,hits=0,enabled=false,muted=false,paused=false,hidden=false,volume=.38,route='default',lastPreview=-Infinity;
 function levels(){if(!nodes)return;const t=context.currentTime;nodes.music.gain.setTargetAtTime(muted||paused||hidden?0:volume,t,.025);nodes.hits.gain.setTargetAtTime(muted||paused||hidden?0:volume,t,.025);nodes.preview.gain.setTargetAtTime(muted||hidden?0:volume,t,.025);}
 async function enable(){try{
  if(!context||context.state==='closed'){const AC=root.AudioContext||root.webkitAudioContext;if(!AC)throw Error('Unsupported');context=new AC({latencyHint:'interactive'});nodes=graph(context,context.destination);context.onstatechange=()=>onState();lastPreview=-Infinity;}
  try{if(root.navigator?.audioSession){root.navigator.audioSession.type='playback';route='playback';}}catch{route='default';}
  const resume=context.resume();await resume;enabled=context.state==='running';if(enabled)muted=false;levels();onState();return enabled;
 }catch{enabled=false;onState();return false;}}
 function ready(preview=false){return enabled&&!muted&&!hidden&&volume>0&&(preview||!paused)&&context.state==='running';}
 function play(n,preview=false,scale=0){if(!ready(preview)||notes>=MAX_NOTES)return false;notes++;note(context,preview?nodes.preview:nodes.music,n,preview,context.currentTime,scale).finally(()=>notes--);return true;}
 return {
  enable,play,
  preview(n,scale=0){if(!ready(true)||context.currentTime-lastPreview<.10||notes>=MAX_NOTES)return false;lastPreview=context.currentTime;return play(n,true,scale);},
  collision(event){if(!ready()||hits>=MAX_HITS)return false;hits++;hit(context,nodes.hits,event).finally(()=>hits--);return true;},
  set(options){({muted=muted,paused=paused,hidden=hidden,volume=volume}=options);levels();onState();},
  status(){return {enabled,muted,paused,hidden,volume,state:context?.state||'not-started',route,voices:notes+hits,notes,hits};},
  signal(){if(!nodes)return {rms:0,peak:0};const a=new Float32Array(nodes.analyser.fftSize);nodes.analyser.getFloatTimeDomainData(a);let sum=0,peak=0;for(const x of a){sum+=x*x;peak=Math.max(peak,Math.abs(x));}return {rms:Math.sqrt(sum/a.length),peak};}
 };
}
root.OrbitAudio={SCALES,NOTES,MAX_NOTES,MAX_HITS,MAX_VOICES,CEILING,frequency,graph,note,collisionProfile,hit,limiterCurve,create};
})(globalThis);
