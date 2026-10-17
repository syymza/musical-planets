# Orbit

A small, local-synthesis browser instrument. Tap empty space for a circular starting velocity, or drag to launch. Select a planet to change its mass. Every crossing of the upward line from the moving star plays a pentatonic note.

No dependencies, accounts, network calls, tracking or runtime AI. Serve this directory with any static server. Audio requires **Start listening** or **Test sound**; enabling sound is silent. Pause gates the music bus, while the optional test note remains available. Reset restores the chosen preset. Clear removes planets.

## Gravity model

All bodies, including the star, move under pairwise softened Newtonian gravity in 2D. G = 1; softening length = 0.012; fixed velocity-Verlet step = 1/600 second. The camera follows the center of mass; the small cross marks it. Planet radius scales with the cube root of mass. Sizes are exaggerated for interaction. Starting star mass can be adjusted from 0.5 to 3, ordinary planet mass from 0.005 to 0.15, and the total mass budget is 4.2. Merged masses are preserved even when larger than a normal control range.

Finite bodies merge on contact. A swept-segment collision estimate avoids fast bodies passing through each other between steps. The survivor preserves total mass, linear momentum and center of mass; volume is additive. Relative orbital angular momentum is retained as internal spin. Relative translational kinetic energy becomes stored heat. Spin and heat are bookkeeping, not visible rotation or thermodynamics. Changing the number of bodies also changes the modeled binding energy, so mechanical energy is not conserved at mergers. This is a simplified inelastic merger model, not a precision astronomical integrator.

The star survives a star/planet merger; otherwise the heavier body keeps its note and color. No artificial note is emitted for the discontinuous merger jump. Off-screen bodies remain active. Mass edits, launches, velocity nudges and deletions are external interventions, so conservation claims apply between interventions and away from mergers.

Aiming freezes the full system. The dotted path runs the same all-body integrator for up to three simulated seconds and ends at the first merger involving the aimed body. Release commits that starting velocity. The note line is relative to the moving star. Half-open crossing endpoints avoid duplicate notes. Frame timing uses an accumulator; pause, tab hiding and stalls over 100 ms discard backlog.

## Audio

The former default output was weak: the master stage multiplied the 38% setting by another 0.42 and the pluck had a short, low envelope. The revised voices use C5–C6 fundamentals and weighted second/third harmonics, with a slightly longer attack/body for small speakers. A 160 Hz high-pass and 3.5 kHz voice low-pass shape the output. Three concurrent voices are allowed. A bounded soft limiter follows the buses; default volume remains 38%.

Measured in Chrome's OfflineAudioContext using the production graph at 48 kHz:

| Render | Peak | RMS, first 250 ms |
| --- | ---: | ---: |
| Previous highest note, default level | 0.0420 | 0.02125 |
| Revised G5 musical note, default level | 0.2080 | 0.08584 |
| Optional G5 test, default level | 0.2080 | 0.11514 |
| Revised C5/E5/A5 together, maximum level | 0.5599 | 0.29273 |

These are digital amplitude measurements, not loudness readings from a phone speaker. Browser live preview also reached peak 0.2077 and RMS 0.1187. Where supported, the feature-detected Audio Session API requests the `playback` route, appropriate for a music toy without microphone capture. Unsupported browsers retain their normal route. Actual physical iPhone playback remains unverified. The app cannot control hardware volume, Bluetooth routing or browser/OS audio behavior.

## Verification

`python3 tests/run-macos.py` runs the dependency-free JavaScript checks through macOS JavaScriptCore. The latest run passes 831 assertions across 10 test groups: barycentric motion, circular/eccentric/multi-body conservation, mass effects, merger invariants, swept collisions, numerical extremes, prediction equality, moving-star crossings, frame-rate independence and retained distant bodies.

Over 20 seconds, maximum relative energy drift in the eccentric two-body and three-body cases was 0.000724% and 0.000531%. Circular two-body relative drift over 30 seconds was 3.16e-13. The identical fixed-step results were checked at 30, 60 and 144 display Hz.

Browser checks cover 1440 px desktop, 390 px and 320 px mobile widths, touch drag/prediction/release, mass controls at their extremes, visible collision/merger and preserved total mass, pause, silent audio enabling, optional test sound while paused, reduced-motion handling, and no console warnings/errors. Browser emulation and digital audio rendering do not establish physical iPhone speaker audibility.

Keyboard: Tab to a planet; arrow keys nudge velocity, Delete removes it. System reduced-motion preference suppresses trails and pulses. The simulation still moves; Pause stops time.
