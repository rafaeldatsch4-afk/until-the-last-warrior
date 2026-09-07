import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import { chooseCoins, cloudCoinRevision } from './CoinSync';

/** Commit wallet and purchased characters together; profile coins are only a mirror. */
export async function writeCloudProgress(db: Firestore, userId: string, payload: Record<string, any>): Promise<void> {
    const progressRef = doc(db, "users", userId, "save", "progress");
    const userRef = doc(db, "users", userId);
    await runTransaction(db, async transaction => {
      const existing = await transaction.get(progressRef);
      const remote = cloudCoinRevision(existing.data() || {}, userId);
      const incoming = cloudCoinRevision(payload, userId);
      const wallet = incoming && remote ? chooseCoins(incoming, remote) : incoming || remote;
      const next = { ...payload };
      if (wallet) {
        next.coins = wallet.balance;
        next.coinsUpdatedAt = wallet.updatedAt;
      }
      // Unlocks and balance are committed together. An older save cannot relock a purchase.
      const savedCharacters = existing.data()?.characters || [];
      if (Array.isArray(next.characters)) {
        next.characters = next.characters.map((character: any) => ({
          ...character,
          unlocked: character.unlocked || savedCharacters.some((c: any) => c.id === character.id && c.unlocked),
        }));
        for (const character of savedCharacters) {
          if (!next.characters.some((c: any) => c.id === character.id)) next.characters.push(character);
        }
      }
      transaction.set(progressRef, next, { merge: true });
      // Profile is a mirror only. Preserve Firestore sentinels (do not sanitize them).
      transaction.set(userRef, {
        lastLogin: serverTimestamp(),
        ...(wallet ? { coins: wallet.balance } : {}),
      }, { merge: true });
    });
}
