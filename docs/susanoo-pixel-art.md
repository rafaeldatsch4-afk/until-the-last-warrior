# Itachi Susanoo pixel art

Both existing transformation keys (`itachi_ssj`, `itachi_ui`) now use the new orange armored Susanoo atlas. The 12 poses cover idle, movement, sword attack, guarding with the mirror shield and charging. Itachi appears inside the ribcage. The two levels intentionally share this new artwork; their existing combat behavior is unchanged.

`PreloadScene.ts` loads the content-hashed atlas for both keys. Existing procedural drawing remains available only if an asset fails to load. Neither the frame dimensions (192×128) nor the 12-frame order, animation timings, movement, hitboxes, damage or input handling change. A shared scale and bottom baseline keep poses stable, with weapon extents inside each frame.

Source: `docs/art/itachi-susanoo-source.png`, generated with ImageGen (generate mode). Prompt direction: twelve transparent 2D pixel-art poses of Itachi's orange-red armored Susanoo, tengu mask, horns, samurai armor, Totsuka sword, Yata Mirror and Itachi inside the central chamber; four idle, four movement, two attack, one defense and one charge pose, all facing right. The packer isolates connected silhouettes and omits disconnected particles, then uses nearest-neighbor scaling.

Rebuild: `node scripts/pack-susanoo-art.mjs`

Validate: `node scripts/preview-itachi.mjs /tmp/itachi-preview`

The preview script validates all 36 loaded frames, alpha, frame boundaries, bottom alignment, retained texture identities on repeated selection and fallback generation when any one atlas key is missing. TypeScript and the production Vite/PWA build also pass. No physical-phone verification was performed.

## Desktop/mobile delivery

`ItachiAtlases.ts` is the shared preload mapping for both device modes; it runs before mode selection. A deterministic test verifies the exact same base/Susanoo image URLs and frame sizes on PC and mobile. The update monitor now checks every minute while the tab is visible, as well as on focus/visibility changes. Previously it checked only registration/focus/visibility, allowing a continuously focused desktop tab to miss a new deploy notification. Updates still require the player's button click, so battles are not interrupted. This is a confirmed detection gap, not proof of the cache state on any particular user's device.

Regression command: `node --import tsx --test tests/itachi-atlases.test.mjs tests/game-updates.test.mjs tests/mobile-input.test.mjs` (19 tests).
