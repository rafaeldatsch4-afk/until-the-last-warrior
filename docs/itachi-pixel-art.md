# Itachi pixel art

The base character now loads a complete transparent atlas instead of drawing the old block-shaped body. It includes four idle poses, four walking poses, two attacks, defense and charging, in the existing frame order. The 192×128 frames and foot baseline remain unchanged, preserving display scale, animation timing and combat geometry. Both Susanoo texture keys now load the new `itachi-susanoo-v1.png` atlas (see `susanoo-pixel-art.md`). Their existing gameplay differences remain in the combat systems.

`PreloadScene.ts` calls the shared `ItachiAtlases.ts` loader, which imports the atlas through Vite, producing a content-hashed image URL. `ItachiSprite.ts` preserves that loaded texture and creates only missing forms; procedural base art is a fallback for image-load failure. Repeated character selection must not replace texture objects already used by animations.

The source in `docs/art/itachi-source.png` was generated with ImageGen in generate mode: full-body Itachi Uchiha, recognizable anime features, black hair, scratched Konoha headband, red Sharingan, Akatsuki cloak, crisp 2D pixel-art styling, transparent background, 12 poses in reading order. The packing script isolates connected silhouettes, including the extended sword, so adjacent poses do not leak into each other. Disconnected decorative particles are omitted. It uses nearest-neighbor scaling and a shared scale to match the game's existing pixel density.

Rebuild: `node scripts/pack-itachi-art.mjs`

Validate and preview: `node scripts/preview-itachi.mjs /tmp/itachi-preview`

Validation checks transparency, all 12 base frames, foot alignment, frame boundaries, all 36 base/transformation frames and preservation of the preloaded texture across repeated generation. The mobile/PC regression suite is `node --import tsx --test tests/mobile-input.test.mjs tests/game-updates.test.mjs`. No input, damage, movement, hitbox or balance code changes are included.

Connection audit: GitHub reported a successful Vercel deployment for main commit `255bd203d0f403804edcfd47506be3a075e4f0e3`. Direct Vercel project access returned 403 and the connected account listed no teams, so internal project/domain settings could not be verified through that connection.
