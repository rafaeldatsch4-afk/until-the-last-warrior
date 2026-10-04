/**
 * Wire format for the 30 Hz player-state stream.
 *
 * A positional number array instead of a keyed JSON object roughly halves every packet
 * (no field names), which matters on mobile uplinks. Order is fixed; append new fields
 * at the end so older clients keep decoding the ones they know.
 */
export interface WirePlayerState {
  x: number;
  y: number;
  f: number; // flipX (0 or 1)
  r: number; // rotation, one decimal
  a: number; // animation id
  h: number; // hp
  k: number; // ki
  flags: number; // 1 action, 2 defending, 4 jumping, 8 super
  tl: number; // transform level
  timestamp?: number; // sender clock, ms
}

export type PackedPlayerState = number[];

export function packState(s: WirePlayerState): PackedPlayerState {
  return [
    Math.round(s.x),
    Math.round(s.y),
    s.f ? 1 : 0,
    Math.round((s.r || 0) * 10),
    s.a | 0,
    Math.round(s.h),
    Math.round(s.k),
    s.flags | 0,
    s.tl | 0,
    s.timestamp ?? Date.now(),
  ];
}

/** Accepts the packed array, or the legacy object sent by not-yet-updated clients. */
export function unpackState(raw: unknown): WirePlayerState | null {
  if (Array.isArray(raw)) {
    if (raw.length < 9 || !raw.slice(0, 9).every((v) => typeof v === "number" && Number.isFinite(v))) return null;
    const [x, y, f, r10, a, h, k, flags, tl, timestamp] = raw as number[];
    return { x, y, f, r: r10 / 10, a, h, k, flags, tl, timestamp };
  }
  if (raw && typeof raw === "object" && typeof (raw as WirePlayerState).x === "number") {
    return raw as WirePlayerState;
  }
  return null;
}

/** Everything the receiver renders: any change must go out on the next tick, not the heartbeat. */
export function stateChangeKey(s: WirePlayerState): string {
  return `${Math.round(s.x)},${Math.round(s.y)},${s.f ? 1 : 0},${Math.round((s.r || 0) * 10)},${s.a},${Math.round(s.h)},${Math.round(s.k)},${s.flags},${s.tl}`;
}
