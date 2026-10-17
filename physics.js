/* Dimensionless Newtonian test particles; fixed star, GM = 1. */
(function(root){
  'use strict';
  const GM=1, DT=1/480, STAR_RADIUS=.16, COLLISION_RADIUS=.19, ESCAPE_RADIUS=3.2;
  function body(x,y,vx,vy){return {x,y,vx,vy,state:'orbiting'};}
  function energy(p){return (p.vx*p.vx+p.vy*p.vy)/2-GM/Math.hypot(p.x,p.y);}
  function circular(r,angle=0,direction=1){const v=Math.sqrt(GM/r)*direction;return body(Math.sin(angle)*r,-Math.cos(angle)*r,Math.cos(angle)*v,Math.sin(angle)*v);}
  function ellipse(peri,apo,angle=0){
    const p=body(0,-peri,Math.sqrt(GM*(2/peri-2/(peri+apo))),0),c=Math.cos(angle),s=Math.sin(angle);
    return body(p.x*c-p.y*s,p.x*s+p.y*c,p.vx*c-p.vy*s,p.vx*s+p.vy*c);
  }
  function rayCrossing(x0,y0,x1,y1){
    if(!((x0<0&&x1>=0)||(x0>0&&x1<=0)))return null;
    const fraction=-x0/(x1-x0),y=y0+(y1-y0)*fraction;
    return y < -COLLISION_RADIUS ? {fraction,y} : null;
  }
  function hitFraction(x,y,nx,ny){
    const c=x*x+y*y-COLLISION_RADIUS*COLLISION_RADIUS;if(c<=0)return 0;
    const dx=nx-x,dy=ny-y,a=dx*dx+dy*dy;if(a===0)return null;
    const b=2*(x*dx+y*dy),d=b*b-4*a*c;if(d<0)return null;
    const t=(-b-Math.sqrt(d))/(2*a);return t>=0&&t<=1?t:null;
  }
  function step(p,dt=DT){
    if(p.state!=='orbiting')return {crossing:null,outcome:null};
    const x=p.x,y=p.y,r=Math.hypot(x,y);
    if(r<=COLLISION_RADIUS){p.state='collision';return {crossing:null,outcome:'collision'};}
    const factor=-GM/(r*r*r),ax=x*factor,ay=y*factor;
    const nx=x+p.vx*dt+.5*ax*dt*dt,ny=y+p.vy*dt+.5*ay*dt*dt;
    const hit=hitFraction(x,y,nx,ny),crossing=rayCrossing(x,y,nx,ny);
    if(hit!==null){p.x=x+(nx-x)*hit;p.y=y+(ny-y)*hit;p.state='collision';return {crossing:crossing&&crossing.fraction<hit?crossing:null,outcome:'collision'};}
    const nr=Math.hypot(nx,ny),nf=-GM/(nr*nr*nr);
    p.x=nx;p.y=ny;p.vx+=(ax+nx*nf)*dt*.5;p.vy+=(ay+ny*nf)*dt*.5;
    if(nr>=ESCAPE_RADIUS&&nx*p.vx+ny*p.vy>0&&energy(p)>=0){p.state='escaped';return {crossing,outcome:'escaped'};}
    return {crossing,outcome:null};
  }
  function predict(p,seconds=8,stride=4){
    const copy={...p,state:'orbiting'},points=[{x:copy.x,y:copy.y}];let outcome=null;
    for(let i=0;i<Math.ceil(seconds/DT);i++){
      const event=step(copy);if(i%stride===stride-1||event.outcome)points.push({x:copy.x,y:copy.y});
      if(event.outcome){outcome=event.outcome;break;}
    }
    return {points,outcome};
  }
  function clock(){let accumulator=0;return {
    reset(){accumulator=0;},
    advance(seconds,active=true){
      // Suspend time across pauses, hidden tabs and long stalls; never replay a backlog.
      if(!active||!Number.isFinite(seconds)||seconds<0||seconds>.1){accumulator=0;return 0;}
      accumulator+=seconds;const steps=Math.floor((accumulator+1e-10)/DT);accumulator-=steps*DT;return steps;
    }
  };}
  const api={GM,DT,STAR_RADIUS,COLLISION_RADIUS,ESCAPE_RADIUS,body,energy,circular,ellipse,rayCrossing,step,predict,clock};
  root.OrbitPhysics=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
