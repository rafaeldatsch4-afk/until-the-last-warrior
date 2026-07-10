const ANIM_KEYS = [
  "idle", "walk", "attack", "special", "defend", "transform", "jump", "hit", "ko"
];

export function animKeyToId(key: string): number {
  for (const suffix of ANIM_KEYS) {
    if (key.endsWith("_" + suffix)) return ANIM_KEYS.indexOf(suffix);
  }
  return 0;
}

export function animIdToSuffix(id: number): string {
  return ANIM_KEYS[id] ?? "idle";
}
