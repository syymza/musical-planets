# Model and audio notes

## Gravity

All bodies, including the star, move under pairwise softened Newtonian gravity in 2D. The model uses G = 1, softening length 0.012 and a fixed velocity-Verlet step of 1/600 second. The camera follows the center of mass; the small cross marks it. Sizes are exaggerated for interaction, and radius scales with the cube root of mass.

The controls allow starting star mass from 0.5 to 3 and ordinary planet mass from 0.005 to 0.15, with a total mass budget of 4.2. Mergers preserve mass even when the result exceeds an ordinary control range.

Bodies merge on contact. A swept-segment collision estimate catches fast crossings. A merger preserves total mass, linear momentum and center of mass. Volumes add; relative angular momentum becomes stored internal spin and relative translational kinetic energy becomes stored heat. Spin and heat are bookkeeping, not rendered rotation or thermodynamics. A change in body count also changes modeled binding energy, so mechanical energy is not conserved during mergers.

The star survives a star/planet merger; otherwise the heavier body retains its note and color. Off-screen bodies remain active. Edits, launches, velocity nudges and deletion are external interventions; conservation expectations apply between interventions and away from mergers.

## Timing and prediction

Aiming freezes the full system. The dotted path uses the same all-body integrator for up to three simulated seconds and stops at the first merger involving the aimed body. Release commits that starting velocity. The upward note line moves with the star. Half-open crossing endpoints avoid duplicate notes; the discontinuous position jump at a merger does not emit a crossing note.

Frame timing uses an accumulator. Pause, tab hiding and stalls longer than 100 ms discard backlog rather than simulating a burst of missed time.

## Sound

Three scales expose six ascending note positions: C major pentatonic, C minor pentatonic and C whole tone. A scale change keeps each planet's position within the collection and retunes future plucks. Existing tails finish naturally; changing scale is silent. Reset restores the starting scene while retaining the selected scale.

Notes use sine partials with C5–C6 fundamentals. A 160 Hz high-pass and 3.5 kHz voice low-pass shape the output. Note and preview voices share a three-voice pool. Previews occur only when the selected position changes, are limited to one request per 100 ms and can play while time is paused. Mute and volume still apply.

Each actual merger requests a quiet impact: a wooden knock, a deeper tom for a heavier planet pair, or a warm thump for star absorption. Intensity follows dissipated translational kinetic energy per merged mass, with a bounded response. Two concurrent impact voices are allowed. Dense previews or collisions can be dropped at the limits. Impacts require enabled audio and are suppressed when paused, muted or hidden.

All voices pass through a shared soft limiter. Default volume is 38%. Where supported, the Audio Session API requests a playback route without microphone access; unsupported browsers keep their normal route. Digital amplitude tests cannot establish speaker loudness, Bluetooth routing or physical iPhone audibility.

See [the README](../README.md) for test commands and browser checks.
