import sharp from 'sharp';
import { GENKI_TORSOS } from '../game/sprites/GenkiTorsoLayout.ts';

for (const [key, pose] of Object.entries(GENKI_TORSOS)) {
  const left = pose.cell % 3 * 512, top = Math.floor(pose.cell / 3) * 512;
  // Transparent gutters exclude generator grid residue, without trimming or
  // relocating the reviewed neck/waist anchors inside the original cell.
  const sprite = await sharp(`docs/art/custom/genki-torsos-${pose.sheet}-source.png`)
    .extract({ left: left + 8, top: top + 8, width: 496, height: 496 }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: sprite, left: 8, top: 8 }]).png()
    .toFile(`game/assets/custom/torso-genki-${key}.png`);
}
