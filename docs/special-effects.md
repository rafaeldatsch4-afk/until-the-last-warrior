# Special move presentation

The common cast sequence now adds a short, character-colored expanding ring and converging energy streaks for all fighters. It does not change the common cast callback, sprite movement, input, Ki cost or attack dispatch.

Itachi's Amaterasu uses animated curved black flames, rising ash and a compact ignition wave. Tsukuyomi uses a translucent Sharingan with hooked rotating tomoe, an eye outline and eight timed cuts. Both work with the base and Susanoo textures. Preparation uses the existing charge pose, followed by the existing attack animation. The old large filled circles, nearly opaque red overlay and prolonged camera shake were replaced with localized effects and short shake cues.

Gameplay values are preserved: Amaterasu hits at 1000 ms for `floor(40 * multiplier)` and completes at 1300 ms; Tsukuyomi hits and completes at 2200 ms for `floor(100 * multiplier)`. Times are relative to the existing shared cast callback. Tsukuyomi's original tween sequence totaled 250 + 400 + 900 + 650 ms; its gameplay callback now runs on the scene clock independently of the drawing. Player targets, transformation multipliers and action completion remain unchanged.

`SpecialEffects.ts` draws deterministic geometry, follows fighter world coordinates, caps active effects at six and reduces detail using the existing low-performance setting. It uses no gameplay random values. Objects expire and listeners detach on scene shutdown, including interrupted specials. The preview is a render of the production drawing commands against a sprite fixture, not a captured live battle.

Validation: 34 tests covering special damage/timing for both players and all forms, shutdown, deterministic drawing, bounded lifecycle, PC/mobile controls, shared atlases and updates. TypeScript and Vite/PWA build pass. No physical-device or live-browser performance claim is made.

Run tests:
`node --import tsx --test tests/special-effects.test.mjs tests/mobile-input.test.mjs tests/itachi-atlases.test.mjs tests/game-updates.test.mjs`

Render preview frames:
`node scripts/preview-special-effects.mjs /tmp/special-effects`

Encode preview:
`ffmpeg -framerate 20 -i /tmp/special-effects/frame-%03d.png -vf 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse' -loop 0 /tmp/special-effects/preview.gif`
