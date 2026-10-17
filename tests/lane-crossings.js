/* Runs the shipped inline app in a deterministic DOM/audio/frame harness. */
'use strict';
const html = typeof require === 'function'
  ? require('node:fs').readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8')
  : globalThis.testHTML;
let assertions = 0;
function check(value, message) { assertions++; if (!value) throw new Error(message); }
class Element {
  constructor() { this.dataset = {}; this.attrs = {}; this.events = {}; this.children = []; this.style = { setProperty() {} }; this.value = '38'; this.clientWidth = 600; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(k, f) { this.events[k] = f; }
  append(el) { this.children.push(el); el.parent = this; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
  contains(el) { return el === this; }
  focus() {}
  setPointerCapture() {}
  getBoundingClientRect() { return { left: 0, top: 0 }; }
}
const elements = new Map(), buttons = ['drift', 'bloom', 'ripple'].map(p => { const e = new Element(); e.dataset.preset = p; return e; });
const get = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
globalThis.document = { hidden: false, events: {}, getElementById: get, createElement: () => new Element(), querySelectorAll: () => buttons, addEventListener(k, f) { this.events[k] = f; } };
const context = new Proxy({}, { get: (_, name) => name === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {} });
get('sky').getContext = () => context;
const motionPreference = { matches: false, events: {}, addEventListener(k, f) { this.events[k] = f; } };
globalThis.matchMedia = () => motionPreference;
globalThis.ResizeObserver = class { observe() {} };
globalThis.devicePixelRatio = 1;
let nextFrame, clock = 1000, audioStarts = 0;
globalThis.requestAnimationFrame = f => { nextFrame = f; };
const parameter = () => ({ value: 0, setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
function audioNode() { return { gain: parameter(), frequency: parameter(), threshold: parameter(), ratio: parameter(), connect() {}, disconnect() {}, start() { audioStarts++; }, stop() {}, set onended(f) { f(); } }; }
globalThis.window = { AudioContext: class { constructor() { this.state = 'running'; this.currentTime = 1; this.destination = {}; } createGain() { return audioNode(); } createOscillator() { return audioNode(); } createBiquadFilter() { return audioNode(); } createDynamicsCompressor() { return audioNode(); } } };
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const instrumented = source.replace(/\}\)\(\);\s*$/, `globalThis.appTest = {normalizeAngle, orbitStep, period, load, addPlanet, removePlanet, planets:()=>planets, audio:()=>audio, enableAudio:()=>{audio=new window.AudioContext();master=audio.createGain();started=true;muted=false;}, state:()=>({paused,muted,drag,noteCount,calm})};})();`);
new Function(instrumented)();
const app = globalThis.appTest, tau = Math.PI * 2;
function tick(dt) { clock += dt * 1000; if (app.audio()) app.audio().currentTime = clock / 1000; const f = nextFrame; nextFrame = null; f(clock); }
function frames(seconds, dt = 1 / 60) { for (let t = 0; t < seconds - 1e-9; t += dt) tick(Math.min(dt, seconds - t)); }
tick(0);
check(!app.orbitStep(0, 0).crossed, 'initial lane position must not pluck');
check(!app.orbitStep(0, .01).crossed, 'leaving the lane must not pluck');
check(app.orbitStep(-.01, .02).crossed, 'negative drag angle crosses correctly');
check(app.orbitStep(tau - .01, .01).crossed, 'exact boundary triggers once');
check(!app.orbitStep(0, .01).crossed, 'next frame does not repeat boundary trigger');
for (const phase of [-12.2, -Math.PI, -.2, 0, .2, 2.4, 4.5, 6.2, 18]) {
  for (const r of [.21, .28, .49, .73, .83]) {
    for (const dt of [1 / 120, 1 / 60, .05]) {
      let angle = phase, crossings = 0, total = 0;
      for (let i = 0; i < 2500; i++) {
        const delta = dt * tau / app.period(r), step = app.orbitStep(angle, delta);
        total += delta; crossings += Number(step.crossed); angle = step.angle;
        if (step.crossed) check(angle <= delta + 1e-9, 'every trigger lies just after the lane');
      }
      check(crossings === Math.floor((app.normalizeAngle(phase) + total) / tau), 'no missed or duplicated laps');
    }
  }
}
for (const name of ['drift', 'bloom', 'ripple']) {
  app.load(name); tick(0);
  let expected = 0;
  const ps = app.planets();
  for (const p of ps) expected += Math.floor((p.angle + 12.2 * tau / app.period(p.r)) / tau);
  frames(12.2);
  check(app.state().noteCount === expected, `${name}: arbitrary preset phases count exactly`);
  get('reset').onclick(); tick(0);
  check(app.state().noteCount === 0, `${name}: reset has no phantom notes`);
}
app.load('drift'); tick(0); frames(2);
get('pause').onclick(); const beforePause = app.planets().map(p => p.angle), countBeforePause = app.state().noteCount;
frames(10);
check(app.planets().every((p, i) => p.angle === beforePause[i]), 'pause freezes phase');
check(app.state().noteCount === countBeforePause, 'pause emits no notes');
get('pause').onclick(); tick(.016);
check(app.planets().every((p, i) => p.angle === beforePause[i]), 'resume resets frame clock without catch-up');
const p = app.planets()[0], stage = get('stage');
function dragNearLane() {
  stage.events.pointerdown({ button: 0, isPrimary: true, pointerId: 1, clientX: 450, clientY: 300, target: p.el });
  stage.events.pointermove({ pointerId: 1, clientX: 299, clientY: 210 });
  stage.events.pointerup({ pointerId: 1, clientX: 299, clientY: 210 });
}
const beforeDrag = app.state().noteCount; dragNearLane();
check(app.state().noteCount === beforeDrag, 'drag relocation itself emits no lap');
tick(.05);
check(app.state().noteCount === beforeDrag + 1, 'post-drag crossing triggers immediately at lane');
tick(.05);
check(app.state().noteCount === beforeDrag + 1, 'post-drag crossing is not duplicated');
app.enableAudio(); get('start').onclick();
check(app.state().muted, 'mute enabled');
dragNearLane(); const mutedStarts = audioStarts; tick(.05);
check(audioStarts === mutedStarts, 'muted crossing schedules no synthesis');
get('start').onclick(); check(audioStarts === mutedStarts, 'unmute does not replay muted crossings');
dragNearLane(); tick(.05);
check(audioStarts === mutedStarts + 2, 'audible crossing starts exactly its two oscillators');
document.hidden = true; document.events.visibilitychange();
const hiddenAngles = app.planets().map(p => p.angle), hiddenNotes = app.state().noteCount, hiddenStarts = audioStarts;
frames(10);
check(app.planets().every((planet, i) => planet.angle === hiddenAngles[i]), 'hidden page does not advance phase');
check(app.state().noteCount === hiddenNotes && audioStarts === hiddenStarts, 'hidden page emits neither notes nor synthesis');
document.hidden = false; document.events.visibilitychange(); tick(.05);
check(app.state().noteCount === hiddenNotes && audioStarts === hiddenStarts, 'returning to page creates no catch-up burst');
stage.events.pointerdown({ button: 0, isPrimary: true, pointerId: 2, clientX: 450, clientY: 300, target: p.el });
app.load('bloom');
check(app.state().drag === null && app.state().noteCount === 0, 'preset change clears stale drag and counter');
check(!app.state().calm, 'normal system preference retains full visuals');
motionPreference.events.change({ matches: true });
check(app.state().calm && app.planets().every(planet => planet.trail.length === 0), 'reduced-motion change clears old trails');
frames(.2);
check(app.planets().every(planet => planet.trail.length <= 2), 'reduced-motion rendering limits trails');
motionPreference.events.change({ matches: false });
frames(.2);
check(!app.state().calm && app.planets().every(planet => planet.trail.length > 2), 'system preference can restore full visuals');
globalThis.testResult = `PASS: ${assertions} assertions; real inline app, preset/drag/pause/mute/hidden behavior and crossing properties.`;
if (typeof console !== 'undefined') console.log(globalThis.testResult);
