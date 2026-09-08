/** Phaser Pointer.id is stable for the lifetime of a touch (not the touch-array index). */
export class MobileButtonInput {
  private owners = new Map<number, string>();
  private buttons = new Map<string, { down: () => void; up: (cancelled: boolean) => void }>();

  register(name: string, down: () => void, up: (cancelled: boolean) => void) {
    this.buttons.set(name, { down, up });
  }

  press(id: number, name: string) {
    if (this.owners.has(id) || !this.buttons.has(name)) return;
    const held = [...this.owners.values()].includes(name);
    this.owners.set(id, name);
    if (!held) this.buttons.get(name)!.down();
  }

  release(id: number, cancelled = false) {
    const name = this.owners.get(id);
    if (!name) return;
    this.owners.delete(id);
    if (![...this.owners.values()].includes(name)) this.buttons.get(name)!.up(cancelled);
  }

  reconcile(isDown: (id: number) => boolean) {
    for (const id of this.owners.keys()) if (!isDown(id)) this.release(id, true);
  }

  reset() {
    for (const id of this.owners.keys()) this.release(id, true);
  }
}

export interface ButtonCircle { x: number; y: number; radius: number }
export function buttonsOverlap(a: ButtonCircle, b: ButtonCircle) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius + 4;
}

/** Keep valid custom positions; never load a layout with overlapping touch targets. */
export function safeButtonLayout(defaults: ButtonCircle[], saved: unknown[]) {
  const result = defaults.map(p => ({ ...p }));
  // Unusually large HUD scales can also make default targets overlap.
  result.forEach((p, i) => {
    while (result.slice(0, i).some(other => buttonsOverlap(p, other))) p.y -= p.radius * 2 + 4;
  });
  saved.forEach((value, i) => {
    if (!value || typeof value !== 'object' || i >= result.length) return;
    const { x, y } = value as { x?: unknown; y?: unknown };
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const candidate = { ...result[i], x, y };
    if (!result.some((other, j) => j !== i && buttonsOverlap(candidate, other))) result[i] = candidate;
  });
  return result;
}
