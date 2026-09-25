import poses from "./combat-poses.json";
/** Reviewed pixel coordinates in the 192 × 128, untrimmed runtime frames.
 * These sockets belong to the art, not the physics body's empty upper half.
 * 8 = extended hand/weapon, 11 = casting or aura pose, depending on the sheet.
 */
type Point = readonly [number, number];
interface CombatPose { special: number; charge: number; hand: Point; cast: Point }
export const COMBAT_POSES = poses as unknown as Record<string, CombatPose>;

interface TextureLike { key: string; customWardrobeArt?: boolean; customRosterKey?: string; source?: { isCanvas?: boolean; isRenderTexture?: boolean }[] }
/** Generated Canvas/WebGL fallbacks have different artwork; never apply PNG sockets to them. */
export function getCombatPose(texture: TextureLike): CombatPose | undefined {
  if (texture.customRosterKey) return COMBAT_POSES[texture.customRosterKey];
  if (texture.customWardrobeArt) return { special: 8, charge: 11, hand: [149, 64], cast: [120, 85] };
  const source = texture.source?.[0];
  return source && !source.isCanvas && !source.isRenderTexture ? COMBAT_POSES[texture.key] : undefined;
}

export interface CombatSprite {
  x: number; y: number; width: number; height: number;
  originX: number; originY: number; scaleX: number; scaleY: number;
  flipX: boolean; flipY: boolean; rotation: number;
  texture: TextureLike; frame: { name: string | number };
}

export function getAttackSocket(sprite: CombatSprite): { x: number; y: number } {
  const profile = getCombatPose(sprite.texture);
  const frame = Number(sprite.frame.name);
  // Legacy procedural hands use the drawing grid (32px x shift, 32px y shift, scale 2).
  const point: Point = profile
    ? (frame === 11 ? profile.cast : profile.hand)
    : sprite.texture.key.startsWith("spiderman") ? [138, 86]
    : sprite.texture.key.startsWith("batman") ? [134, 90]
    : [132, 94];
  // Phaser mirrors around the frame centre before applying its display origin.
  const px = sprite.flipX ? sprite.width - point[0] : point[0];
  const py = sprite.flipY ? sprite.height - point[1] : point[1];
  const dx = (px - sprite.width * sprite.originX) * sprite.scaleX;
  const dy = (py - sprite.height * sprite.originY) * sprite.scaleY;
  const cos = Math.cos(sprite.rotation), sin = Math.sin(sprite.rotation);
  return { x: sprite.x + dx * cos - dy * sin, y: sprite.y + dx * sin + dy * cos };
}

export function getAttackDirection(sprite: Pick<CombatSprite, 'flipX' | 'scaleX'>): 1 | -1 {
  return (sprite.flipX ? -1 : 1) * Math.sign(sprite.scaleX || 1) as 1 | -1;
}
