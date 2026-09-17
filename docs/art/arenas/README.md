# Illustrated anime arenas

All eight existing arena keys now load WebP illustrations on desktop and mobile. These are generated interpretations of anime settings, not screenshots. Physics, arena selection and controls retain their existing behavior.

## Art direction and asset paths

Shared generation brief: wide 16:9 hand-painted anime fighting-game background, clean cel shading, detailed distant scenery, broad unobstructed foreground fighting plane, no characters or interface.

| Asset under `game/assets/arenas/` | Scene-specific direction |
| --- | --- |
| `arena-v1.webp` | Dragon Ball rocky Earth wilderness; grassy mesas, river, sandy foreground, blue sky. |
| `arena_namek-v1.webp` | Namek; green sky, round blue trees, turquoise water, ivory dome village, blue-green foreground. |
| `arena_city-v1.webp` | Future Trunks-style ruined futuristic city; damaged capsule towers, elevated roads and concrete fighting plane. |
| `arena_tournament-v1.webp` | Tenkaichi Budokai; golden-roofed tournament hall, palms, red perimeter walls and white tiled ring. |
| `arena_ice-v1.webp` | Bright icy continent; white and blue glaciers, clear sky, flat frozen foreground. |
| `arena_lava-v1.webp` | Dying Namek-inspired volcanic battlefield; red sky, distant eruptions, lava at the margins, broad basalt floor. |
| `arena_desert-v1.webp` | Yamcha-era rocky wilderness; warm sandstone pillars and mesas, sandy foreground, blue sky. |
| `arena_dark-v1.webp` | Tournament of Power-inspired void; tiled floating stage, central pillar, distant spectator ledges and purple cosmic sky. |

The generated originals were encoded as WebP at quality 90, effort 5. The eight runtime files total 2,650,876 bytes. Each is 1672 × 941. No source PNG is needed at runtime.

## Loading and effects

`ArenaAtlases.ts` discovers the eight assets through Vite. Preload completes before the Canvas fallback builder runs. Existing textures are preserved; only missing images receive a deterministic scene from `AnimeArenaArt.ts`. PWA precaching includes WebP files for offline reuse.

Background blur is removed and contrast is corrected to preserve illustration detail. Weather emission is bounded, with lower emission in low-performance mode. Falling debris is restricted to lava and void arenas; both environment timers are destroyed on cleanup.

## Verification

- Five arena tests cover image decoding and size budget, shared desktop/mobile loading, cache preservation and load-failure fallback, bounded weather/timer cleanup, and WebP precache configuration.
- Existing 54 regression tests passed; the five arena tests passed after correcting the test double's particle-call signature.
- TypeScript checking and production build passed. The generated service worker contains all eight arena images.
- `node scripts/preview-arenas.mjs <output-directory>` renders the actual images, a contact sheet and existing battle-camera crops. Add `--fallback` for the Canvas alternative. This utility needs `@napi-rs/canvas` or the provided runtime dependency path.
- Illustrations and battle-camera crops were reviewed. Live browser gameplay and physical-device checks were not available in this environment.
