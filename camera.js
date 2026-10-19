/* View-only framing and projection; never changes a body's dynamics. */
(function(root){
'use strict';
const BASE_HALF=3.5/.92,MAX_HALF=BASE_HALF*2,PADDING=.15;
function create(star={x:0,y:0}){return {x:star.x,y:star.y,half:BASE_HALF,goal:BASE_HALF};}
function target(system){
 const active=system.filter(p=>p.state==='orbiting'),star=active.find(p=>p.isStar);
 if(!star)return {x:0,y:0,half:BASE_HALF};
 let extent=0;for(const p of active)extent=Math.max(extent,Math.abs(p.x-star.x)+(p.radius||0),Math.abs(p.y-star.y)+(p.radius||0));
 return {x:star.x,y:star.y,half:Math.max(BASE_HALF,Math.min(MAX_HALF,extent/(1-PADDING)))};
}
function update(view,system,seconds,frozen=false){
 if(frozen)return view;const wanted=target(system),dt=Number.isFinite(seconds)?Math.max(0,Math.min(.1,seconds)):0;
 // Hysteresis keeps small orbital changes from continually reversing the zoom.
 if(wanted.half===BASE_HALF||wanted.half===MAX_HALF||wanted.half>view.goal+.1||wanted.half<view.goal-.2)view.goal=wanted.half;
 const position=1-Math.exp(-dt/.35),zoom=1-Math.exp(-dt/(view.goal>view.half?.45:1.2));
 view.x+=(wanted.x-view.x)*position;view.y+=(wanted.y-view.y)*position;
 view.half=Math.max(BASE_HALF,Math.min(MAX_HALF,view.half+(view.goal-view.half)*zoom));return view;
}
const scale=(view,size)=>size/(view.half*2);
function toScreen(p,view,size){const s=scale(view,size);return {x:size/2+(p.x-view.x)*s,y:size/2+(p.y-view.y)*s};}
function toWorld(p,view,size){const s=scale(view,size);return {x:(p.x-size/2)/s+view.x,y:(p.y-size/2)/s+view.y};}
function edge(p,size,padding=28,topPadding=padding){
 const outside=p.x<0||p.x>size||p.y<0||p.y>size;if(!outside)return {...p,outside:false,angle:0};
 const c=size/2,dx=p.x-c,dy=p.y-c,inset=Math.min(padding,size*.35),top=Math.min(topPadding,size*.35);
 const tx=dx>0?(size-inset-c)/dx:dx<0?(inset-c)/dx:Infinity,ty=dy>0?(size-inset-c)/dy:dy<0?(top-c)/dy:Infinity,t=Math.min(tx,ty);
 return {x:c+dx*t,y:c+dy*t,outside:true,angle:Math.atan2(dy,dx)};
}
const api={BASE_HALF,MAX_HALF,PADDING,create,target,update,scale,toScreen,toWorld,edge};root.OrbitCamera=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
