# Orbit

A little space for sound. Add orbiting planets, shape their rhythms, and let a gentle melody unfold.

## Play

- Tap **Start listening** to enable sound. Audio never starts automatically.
- Tap empty space or **Add planet** to add up to eight planets.
- Drag a planet inward for a quicker orbit, outward for a slower one.
- Each clockwise crossing of the top lane plays a note from the C major pentatonic scale. Tapping a planet auditions its note.
- Explore three presets, or use pause, mute, volume, reset, and clear.
- Keyboard: Tab to a planet, arrow keys to change its orbit, Delete/Backspace to remove it.
- **Softer visuals** removes trails and pulse rings. It starts enabled when your device requests reduced motion. **Pause** stops the moving scene and silences output.

## Run

Open `index.html` in a browser, or serve this directory with any static HTTP server. There is no build step or package installation. GitHub Pages serves the root of `main`.

The app is one self-contained HTML file with inline CSS, JavaScript, and canvas graphics. Web Audio generates all sound locally. No accounts, backend, external assets, analytics, runtime APIs, or AI. Scenes last for the current page session.

## Prototype checks

Chrome desktop and 390 × 844 mobile viewport checked for responsive rendering, tap/add, pointer dragging, keyboard orbit changes, presets, pause/resume, mute/unmute, reset/clear, and Web Audio initialization. Touch input was exercised through Chrome's developer input tools. Physical iOS Safari and actual audio listening remain to be checked.

Run deterministic crossing and state-transition checks with `node tests/lane-crossings.js`. On macOS without Node, use `python3 tests/run-macos.py`, which runs the same checks in the system JavaScriptCore engine. The harness executes the shipped inline application with controlled DOM, frame, and audio substitutes. It covers arbitrary phases, exact boundaries, repeated laps, all presets, dragging, pause/resume, muting, and hidden-page transitions. These checks do not measure physical audio output latency.
