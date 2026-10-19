/* A compact, non-modal reference; opening or dismissing it never changes a scene. */
(()=>{
'use strict';
const trigger=document.getElementById('keysHelp'),panel=document.getElementById('keyboardPanel'),close=document.getElementById('keysClose'),capability=matchMedia('(hover: hover) and (pointer: fine)');
let dismissedPointer=null,dismissedClick=null;
const isOpen=()=>panel.matches(':popover-open');
function position(){const anchor=trigger.getBoundingClientRect(),sidebar=trigger.closest('.sidebar').getBoundingClientRect(),width=panel.offsetWidth,height=panel.offsetHeight;panel.style.left=Math.max(16,Math.min(innerWidth-width-16,sidebar.right-width))+'px';panel.style.top=Math.max(16,Math.min(innerHeight-height-16,anchor.top-height-10))+'px';}
function restoreFocus(){setTimeout(()=>{const active=document.activeElement;if(!trigger.hidden&&(active===document.body||active===trigger||panel.contains(active)))trigger.focus({preventScroll:true});},0);}
function hide(restore=true){if(isOpen())panel.hidePopover();if(restore)restoreFocus();}
function sync(){trigger.hidden=!capability.matches;if(trigger.hidden)hide(false);}
close.addEventListener('click',()=>hide());
panel.addEventListener('toggle',e=>{trigger.setAttribute('aria-expanded',String(e.newState==='open'));if(e.newState==='open'){position();close.focus({preventScroll:true});}if(e.newState==='closed')restoreFocus();});
// Consume the dismissing gesture before it reaches a launch target or scene control.
function consume(e){e.preventDefault();e.stopImmediatePropagation();}
document.addEventListener('pointerdown',e=>{dismissedClick=null;if(isOpen()&&!panel.contains(e.target)&&!trigger.contains(e.target)){dismissedPointer=e.pointerId;consume(e);hide();}},true);
document.addEventListener('pointerup',e=>{if(e.pointerId===dismissedPointer){consume(e);dismissedPointer=null;dismissedClick={x:e.clientX,y:e.clientY,until:performance.now()+500};}},true);
document.addEventListener('pointercancel',e=>{if(e.pointerId===dismissedPointer)dismissedPointer=null;},true);
document.addEventListener('click',e=>{if(dismissedClick&&e.detail>0&&performance.now()<dismissedClick.until&&Math.abs(e.clientX-dismissedClick.x)<2&&Math.abs(e.clientY-dismissedClick.y)<2){consume(e);dismissedClick=null;}},true);
addEventListener('resize',()=>{if(isOpen())position();});addEventListener('scroll',()=>{if(isOpen())position();},{passive:true});capability.addEventListener('change',sync);sync();
})();
