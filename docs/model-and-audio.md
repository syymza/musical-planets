# Model and audio notes

## Gravity

All bodies, including the star, move under pairwise softened Newtonian gravity in 2D. The model uses G = 1, softening length 0.012 and a fixed velocity-Verlet step of 1/600 second. The camera gently follows the star and fits the active scene, capped at twice the original view width. The small cross still marks the center of mass when it is in view. Off-screen planets remain active and have selectable edge arrows. Sizes are exaggerated for interaction, and radius scales with the cube root of mass.

The controls allow starting star mass from 0.5 to 3 and ordinary planet mass from 0.005 to 0.15, with a total mass budget of 4.2. Mergers preserve mass even when the result exceeds an ordinary control range. Up to 32 planets may be active. With a star of mass 3 and 32 default-mass planets, total mass is 3.384, below the unchanged budget of 4.2. Heavier mass edits can exhaust the budget before the count limit; remove a body or reduce mass to add more.

Bodies merge on contact. A swept-segment collision estimate catches fast crossings. A merger preserves total mass, linear momentum and center of mass. Volumes add; relative angular momentum becomes stored internal spin and relative translational kinetic energy becomes stored heat. Spin and heat are bookkeeping, not rendered rotation or thermodynamics. A change in body count also changes modeled binding energy, so mechanical energy is not conserved during mergers.

The star survives a star/planet merger; otherwise the heavier body retains its note and color. Off-screen bodies remain active. Edits, launches, velocity nudges and deletion are external interventions; conservation expectations apply between interventions and away from mergers.

## Timing and prediction

Aiming freezes the full system. The dotted path uses the same all-body integrator for up to three simulated seconds and stops at the first merger involving the aimed body. Release commits that starting velocity. One to twelve evenly spaced radial note lines move with the star. The first always points upward. Crossings use star-relative positions and are ordered within each integration step, including when a fast segment crosses several rays. Half-open crossing endpoints avoid duplicate notes; the discontinuous position jump at a merger does not emit a crossing note.

Frame timing uses an accumulator. Pause, tab hiding and stalls longer than 100 ms discard backlog rather than simulating a burst of missed time.

Changing line count only replaces the rays: it does not move planets, advance time, play a note or retain a stale flash. Reset and Clear retain the chosen line count, and clear crossing pulses. Rays and planets pulse on real crossings; reduced motion suppresses those pulses.

## Camera

The view half-width ranges from 3.804 to 7.609 model units, with 15% fit padding. Zoom-out eases over a 0.45-second time constant and zoom-in over 1.2 seconds. A small fit hysteresis avoids pumping with tiny orbital changes. A distant body can request the capped view but cannot force unlimited zoom-out or move the camera away from the star.

Screen-to-world mapping is the inverse of rendering. Position and zoom freeze together during aiming; resizing cancels that aim and reprojects the same bodies. Reset restores the curated starting view. Clear leaves the star and smoothly restores the baseline framing. Arrow selection changes selection only, never physical position or velocity.

## Sound

Three scales expose six ascending note positions: C major pentatonic, C minor pentatonic and C whole tone. A scale change keeps each planet's position within the collection and retunes future plucks. Existing tails finish naturally; changing scale is silent. Reset restores the starting scene while retaining the selected scale.

Notes use sine partials with C5–C6 fundamentals. A 160 Hz high-pass and 3.5 kHz voice low-pass shape the output. Note and preview voices share a three-voice pool. Previews occur only when the selected position changes, are limited to one request per 100 ms and can play while time is paused. Mute and volume still apply.

Each actual merger requests a quiet impact: a wooden knock, a deeper tom for a heavier planet pair, or a warm thump for star absorption. Intensity follows dissipated translational kinetic energy per merged mass, with a bounded response. Two concurrent impact voices are allowed. Dense crossings, previews or collisions can be dropped at the limits. No backlog is queued for later playback; adding lines or planets does not increase the voice caps or output gain. Impacts require enabled audio and are suppressed when paused, muted or hidden.

All voices pass through a shared soft limiter. Default volume is 38%. Where supported, the Audio Session API requests a playback route without microphone access; unsupported browsers keep their normal route. Digital amplitude tests cannot establish speaker loudness, Bluetooth routing or physical iPhone audibility.

See [the README](../README.md) for test commands and browser checks.
