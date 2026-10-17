# Orbit

A little gravity. A little music. A static browser playground for launching independent planets around one fixed star.

Play at **https://syymza.github.io/musical-planets/**.

## Play

- Tap **Start listening** to enable audio and send a gentle test note. **Test sound** can also enable or resume audio and works while the simulation is paused. It does not advance time or create a fake ray crossing.
- Tap empty space for a circular orbit. Drag from a spot or from an existing planet and release to launch: the arrow shows velocity, with longer arrows meaning faster launches. The dotted prediction follows the next eight simulation seconds, ending early at collision or escape.
- Try **In balance**, **Ellipses**, and **Wild paths**. Wild paths demonstrates a starfall and an escape alongside a bound orbit.
- Each crossing of the upward note ray, in either direction and outside the star, produces a C major pentatonic pluck.
- Use pause/resume, mute, listening level, reset, and clear. Up to eight active planets are supported.
- Keyboard: Tab to a planet; arrow keys apply small velocity impulses; Delete/Backspace removes it. All buttons and volume are native keyboard controls.
- System reduced-motion preferences suppress trails and pulses automatically. There is no extra visuals checkbox.

If the test note is silent, check the phone's media volume and selected audio output. The app reports zero volume, mute, paused time, and a browser-suspended audio context separately. A running audio engine and a generated signal do not establish that a physical speaker is audible. Physical iPhone/Safari listening remains to be checked; no particular phone setting is assumed to be the cause of silence.

## Model

This is a simplified Newtonian test-particle model, not an N-body simulation. One stationary star exerts inverse-square gravity (`GM = 1` in dimensionless units). Planet mass cancels from this model's acceleration, so there is no mass slider. Planets do not pull on one another. There are no slingshots between moving bodies, relativistic corrections, or physical distance/time labels.

Velocity Verlet integration advances at **1/480 simulation second** per fixed step, independently of rendering. The finite star has radius 0.16; collision is detected against a 0.19-radius surface, including segment intersection to prevent tunneling. Positive-energy planets moving outward beyond radius 3.2 are marked escaped. Negative-energy wide paths remain bound even when outside the view. Prediction uses the identical integrator and terminal criteria.

Crossings are segment/ray intersections with half-open endpoint handling, so landing on the line triggers once and departing it does not repeat. Pause, hidden tabs, and stalls longer than 100ms suspend simulation time and discard the frame backlog. This favors stable interactive behavior over catching up to wall time.

Trails sample equal simulation-time intervals: greater spacing near periapsis shows higher speed. Their fading and orbit shape are illustrative. Audio voices are limited to eight and use the existing moderate gain, a compressor, and short pluck envelopes. Audio context creation/resume happens in the explicit click handler; the preview is delayed 80ms to allow the existing gain fade to settle. Preview has a separate volume-controlled bus so it can be tested while time is paused. The small signal indicator samples the post-compressor Web Audio graph, not the physical device output.

## Run and test

Open `index.html` or serve this directory with any static HTTP server. No build or install step is required. GitHub Pages serves the root of `main`. HTML/CSS/JavaScript/SVG are local; no backend, accounts, analytics, external APIs, external assets, or runtime AI.

Run `node tests/gravity.js`. On macOS without Node, `python3 tests/run-macos.py` uses the system JavaScriptCore engine. Tests execute the production physics module and the actual application handlers in a deterministic DOM/audio/frame harness.

Measured regression results:

- 100 circular periods: maximum relative energy drift **4.76e-12** (tolerance 1e-4).
- 60 eccentric periods, periapsis 0.45 / apoapsis 2.3: drift **2.98e-5**, or **0.003%** (tolerance 0.1%).
- 30 near-star eccentric periods, periapsis 0.2 / apoapsis 2.6: drift **9.16e-4**, or **0.092%** (tolerance 0.1%). These bounds describe the tested paths, not every possible launch.
- 30/60/144 Hz rendering: identical states within 1e-12 and identical crossing counts after 30 seconds.
- Predicted samples match independently advanced paths within 1e-12, including collision/escape termination.
- Also checks angular momentum, reversibility, collisions without tunneling, wide bound paths, both crossing directions, no duplicate endpoints, pause/resume, hidden tabs, mute/no replay, launch gestures, keyboard impulses, and reduced motion.

Browser QA verifies the real DOM, canvas, input events, context state, and generated audio signal. Browser touch emulation is not a physical iPhone test. Recordings are silent motion demonstrations; they do not prove audio listening or measure speaker/Bluetooth latency.
