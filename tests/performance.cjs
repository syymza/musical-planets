// Optional local benchmark, not a CI timing gate. Uses off-screen bodies to
// retain the full population instead of letting early collisions reduce work.
'use strict';
const P = require('../physics.js');
const { performance } = require('node:perf_hooks');
function scene(count) {
  const ps = [P.body('star', 0, 0, 0, 0, 1, true)];
  for (let i = 0; i < count; i++) {
    const r = 8 + i * .45, a = i * 2.399963229728653, speed = Math.sqrt(1 / r);
    ps.push(P.body(`p${i}`, Math.cos(a)*r, Math.sin(a)*r, -Math.sin(a)*speed, Math.cos(a)*speed));
  }
  return P.recenter(ps);
}
const percentile = (values, p) => values.slice().sort((a,b) => a-b)[Math.floor((values.length-1)*p)];
const rows = [];
for (const count of [8, 24, 32, 48]) {
  const ps = scene(count), frames = [], prediction = [];
  for (let frame = 0; frame < 350; frame++) {
    const start = performance.now();
    for (let step = 0; step < 10; step++) P.stepSystem(ps, P.DT, P.MAX_NOTE_LINES);
    if (frame >= 50) frames.push(performance.now() - start);
  }
  if (P.active(ps).length !== count + 1) throw new Error('Benchmark lost bodies');
  for (let i = 0; i < 7; i++) {
    const start = performance.now(); P.predict(ps, 'p0'); prediction.push(performance.now() - start);
  }
  rows.push({planets:count, rays:P.MAX_NOTE_LINES, totalMass:P.center(ps).mass,
    physicsPer60HzFrameMs:{p50:percentile(frames,.5),p95:percentile(frames,.95),max:Math.max(...frames)},
    fullThreeSecondPredictionMs:{p50:percentile(prediction,.5),max:Math.max(...prediction)}});
}
console.log(JSON.stringify({runtime:process.version,platform:process.platform,architecture:process.arch,rows},null,2));
