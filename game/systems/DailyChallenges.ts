import { db, auth } from '../../firebase/init';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface ChallengeDef {
  id: string;
  title: string;
  target: number;
  reward: number;
}

export const CHALLENGES: ChallengeDef[] = [
  { id: 'win_3_battles', title: 'Vença 3 batalhas', target: 3, reward: 50 },
  { id: 'use_special_5_times', title: 'Use um especial 5 vezes', target: 5, reward: 30 },
  { id: 'win_no_damage', title: 'Vença sem tomar dano', target: 1, reward: 100 }
];

export interface ChallengeProgress {
  id: string;
  current: number;
  claimed: boolean;
}

export class DailyChallenges {
  static getTodayDateStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  static getDefaultProgress(): Record<string, ChallengeProgress> {
    const progress: Record<string, ChallengeProgress> = {};
    for (const c of CHALLENGES) {
      progress[c.id] = { id: c.id, current: 0, claimed: false };
    }
    return progress;
  }

  static getOfflineQueue() {
    try {
      const stored = localStorage.getItem('utlw_daily_challenge_queue');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }

  static saveOfflineQueue(queue: any[]) {
    try {
      localStorage.setItem('utlw_daily_challenge_queue', JSON.stringify(queue));
    } catch {}
  }

  static queueUpdate(uid: string, dateStr: string, id: string, amount: number) {
    const queue = this.getOfflineQueue();
    const existing = queue.find((q: any) => q.uid === uid && q.dateStr === dateStr && q.id === id);
    if (existing) {
        existing.amount += amount;
    } else {
        queue.push({ uid, dateStr, id, amount });
    }
    this.saveOfflineQueue(queue);
  }

  static async syncOfflineQueue() {
    if (!navigator.onLine) return;
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;
    
    this.saveOfflineQueue([]);
    
    for (const update of queue) {
        if (auth.currentUser?.uid === update.uid) {
            await this.addProgress(update.id, update.amount, true);
        }
    }
  }

  static async getProgress(): Promise<Record<string, ChallengeProgress>> {
    const uid = auth.currentUser?.uid;
    if (!uid) return this.getDefaultProgress();

    // Trigger a sync if possible before fetching
    if (navigator.onLine) this.syncOfflineQueue();
    
    try {
      const dateStr = this.getTodayDateStr();
      const docRef = doc(db, 'users', uid, 'dailyChallenges', dateStr);
      const snap = await getDoc(docRef);
      let prog = this.getDefaultProgress();
      if (snap.exists()) {
        const data = snap.data();
        Object.assign(prog, data);
      } else {
        await setDoc(docRef, prog);
      }
      
      // Apply offline queue to local state so UI updates immediately
      const queue = this.getOfflineQueue();
      for (const update of queue) {
          if (update.uid === uid && update.dateStr === dateStr && prog[update.id]) {
              const challenge = CHALLENGES.find(c => c.id === update.id);
              if (challenge) {
                  prog[update.id].current = Math.min(challenge.target, prog[update.id].current + update.amount);
              }
          }
      }
      
      return prog as Record<string, ChallengeProgress>;
    } catch (e) {
      console.warn("Failed to get daily challenges", e);
      return this.getDefaultProgress();
    }
  }

  static async addProgress(id: string, amount: number, isSyncing = false) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const dateStr = this.getTodayDateStr();

    if (!navigator.onLine && !isSyncing) {
        this.queueUpdate(uid, dateStr, id, amount);
        return;
    }

    try {
      const docRef = doc(db, 'users', uid, 'dailyChallenges', dateStr);
      const snap = await getDoc(docRef);
      
      let currentData = snap.exists() ? snap.data() as Record<string, ChallengeProgress> : this.getDefaultProgress();
      
      if (!currentData[id]) {
         currentData[id] = { id, current: 0, claimed: false };
      }

      const challenge = CHALLENGES.find(c => c.id === id);
      if (!challenge) return; // invalid
      
      if (currentData[id].claimed) return; // already claimed
      
      const maxTarget = challenge.target;
      if (currentData[id].current >= maxTarget) return; // already capped

      currentData[id].current = Math.min(maxTarget, currentData[id].current + amount);

      await setDoc(docRef, currentData, { merge: true });
    } catch (e: any) {
      console.warn("Failed to update daily challenges", e);
      if (!isSyncing && (e.code === 'unavailable' || e.message?.includes('offline') || !navigator.onLine)) {
         this.queueUpdate(uid, dateStr, id, amount);
      }
    }
  }

  static async claimReward(id: string): Promise<boolean> {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    
    try {
      const dateStr = this.getTodayDateStr();
      const docRef = doc(db, 'users', uid, 'dailyChallenges', dateStr);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false;
      
      let currentData = snap.data() as Record<string, ChallengeProgress>;
      const challenge = CHALLENGES.find(c => c.id === id);
      if (!challenge) return false;

      if (currentData[id] && currentData[id].current >= challenge.target && !currentData[id].claimed) {
        currentData[id].claimed = true;
        await setDoc(docRef, currentData, { merge: true });
        
        if (window.UTLW && window.UTLW.state) {
            window.UTLW.state.coins += challenge.reward;
            if(window.UTLW.save) window.UTLW.save();
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Failed to claim challenge reward", e);
      return false;
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    DailyChallenges.syncOfflineQueue();
  });
}

