/** A wallet revision changes only when its balance changes, not on autosave. */
export interface CoinRevision {
  balance: number;
  updatedAt: number;
  ownerId: string | null;
}

export function validCoins(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function trackCoins(balance: number, previous?: CoinRevision, now = Date.now()): CoinRevision {
  if (!validCoins(balance)) throw new Error('Invalid coin balance');
  if (previous && previous.balance === balance) return previous;
  return { balance, updatedAt: Math.max(now, (previous?.updatedAt || 0) + 1), ownerId: previous?.ownerId ?? null };
}

export function cloudCoinRevision(save: { coins?: unknown; coinsUpdatedAt?: number; lastSyncedAt?: unknown }, ownerId: string): CoinRevision | null {
  if (!validCoins(save.coins)) return null;
  const timestamp = save.coinsUpdatedAt ?? save.lastSyncedAt;
  return { balance: save.coins, updatedAt: typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : 0, ownerId };
}

export function chooseCoins(local: CoinRevision, remote: CoinRevision): CoinRevision {
  // Never carry a different account's wallet into this account.
  if (local.ownerId && local.ownerId !== remote.ownerId) return remote;
  // Equal or unversioned saves favor the canonical cloud value, including zero.
  return local.updatedAt > remote.updatedAt ? { ...local, ownerId: remote.ownerId } : remote;
}
