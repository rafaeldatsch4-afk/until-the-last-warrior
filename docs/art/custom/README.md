# Custom wardrobe redesign

## Visual correction

The reported face flashing was caused by inconsistent idle portrait pixels. `CustomIdlePortrait.ts` stabilizes the portrait across idle frames 0–3, while keeping walking/combat frames and the body outside the portrait unchanged. Modular heads and head accessories also use a stable idle position/source frame. A regression test covers normal/transformed sheets, and the runtime screenshot sheet was checked for zero changed face pixels across idle frames.

Matching complete outfits now reuse their coherent reviewed roster sheet, recolored from saved appearance channels, rather than assembling unrelated body proportions. Mixed outfits keep modular layers with a narrower torso, longer legs, and footwear split at the real transparent gap between boots. Relaxed poses draw the torso as a single piece, preventing shoulder seams. The preview removes the standing oval/ring effects in normal form. `fighter-corrected.png` shows the corrected local result.

The existing wardrobe now uses modular, recolorable raster art for all 10 torsos, 9 leg styles, 9 footwear styles and 6 accessories. No equipment IDs or catalog choices were added. The white mannequin supplied the anatomy reference and the shared face/jaw artwork.

Generated with the built-in image generator. Original PNGs and prompts are preserved here; only packed layers in `game/assets/custom` are shipped. Run `node scripts/pack-custom-art.mjs` to repack the reviewed source regions.

The attempted portrait sheet was declined by the generation service. Goku, Vegeta, Jotaro and Chapolim reuse their already-redesigned roster art, normalized for coloring. Other existing hair/mask designs are preserved, with human faces fitted to the generated base. A completely new portrait sheet is therefore not part of this delivery.

`CustomArt.ts` assembles the same twelve 192×128 frames used by combat, with separate limbs for walking, punch, kick, guard and charge. White/cyan/peach material masks retain the saved clothing and skin channels. Normal, SSJ and UI textures remain available; art-specific attack sockets keep projectiles aligned with the hands. The previous procedural renderer remains a fallback if the art does not load.

Validation: TypeScript, creator save/reopen tests, combat tests, production build, and browser rendering across all existing wardrobe choices. Screenshots and runtime sheets in this directory document the local preview. Deployment is a separate step; these files do not mean production has been updated.
