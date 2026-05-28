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

export interface DailyStreakInfo {
  currentStreak: number;
  lastLoginDate: string; // YYYY-MM-DD
  lastClaimedDate: string; // YYYY-MM-DD
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

  static async claimAllRewards(): Promise<number> {
    const uid = auth.currentUser?.uid;
    if (!uid) return 0;
    
    try {
      const dateStr = this.getTodayDateStr();
      const docRef = doc(db, 'users', uid, 'dailyChallenges', dateStr);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return 0;
      
      let currentData = snap.data() as Record<string, ChallengeProgress>;
      let totalReward = 0;
      let claimedCount = 0;

      for (const challenge of CHALLENGES) {
        const p = currentData[challenge.id];
        if (p && p.current >= challenge.target && !p.claimed) {
          p.claimed = true;
          totalReward += challenge.reward;
          claimedCount++;
        }
      }

      if (claimedCount > 0) {
        await setDoc(docRef, currentData, { merge: true });
        
        if (window.UTLW && window.UTLW.state) {
            window.UTLW.state.coins += totalReward;
            if(window.UTLW.save) window.UTLW.save();
        }
      }
      return totalReward;
    } catch (e) {
      console.warn("Failed to claim all rewards", e);
      return 0;
    }
  }

  static getLocalStreakInfo(): DailyStreakInfo {
    try {
      const stored = localStorage.getItem('utlw_daily_streak');
      if (stored) return JSON.parse(stored);
    } catch {}
    return { currentStreak: 0, lastLoginDate: '', lastClaimedDate: '' };
  }

  static saveLocalStreakInfo(info: DailyStreakInfo) {
    try {
      localStorage.setItem('utlw_daily_streak', JSON.stringify(info));
    } catch {}
  }

  static async getStreakInfo(): Promise<DailyStreakInfo> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return this.getLocalStreakInfo();
    }

    const today = this.getTodayDateStr();
    let localInfo = this.getLocalStreakInfo();

    try {
      if (navigator.onLine) {
        const docRef = doc(db, 'users', uid, 'dailyStreak', 'info');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const dbInfo = snap.data() as DailyStreakInfo;
          // Merge local and DB (prefer DB or latest)
          if (!localInfo.lastLoginDate || dbInfo.lastLoginDate >= localInfo.lastLoginDate) {
            localInfo = dbInfo;
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch streak from Firestore", e);
    }

    // Process/update streak count based on current date
    if (localInfo.lastLoginDate === '') {
      localInfo.currentStreak = 1;
      localInfo.lastLoginDate = today;
    } else if (localInfo.lastLoginDate !== today) {
      // Check if yesterday
      const last = new Date(localInfo.lastLoginDate + 'T00:00:00');
      const curr = new Date(today + 'T00:00:00');
      const diffTime = curr.getTime() - last.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        localInfo.currentStreak += 1;
      } else if (diffDays > 1) {
        localInfo.currentStreak = 1;
      }
      localInfo.lastLoginDate = today;
    }

    this.saveLocalStreakInfo(localInfo);

    if (uid && navigator.onLine) {
      try {
        const docRef = doc(db, 'users', uid, 'dailyStreak', 'info');
        await setDoc(docRef, localInfo, { merge: true });
      } catch (e) {
        console.warn("Could not save streak to Firestore", e);
      }
    }

    return localInfo;
  }

  static getStreakReward(streak: number): number {
    if (streak <= 1) return 15;
    if (streak === 2) return 25;
    if (streak === 3) return 40;
    if (streak === 4) return 60;
    if (streak === 5) return 80;
    if (streak === 6) return 100;
    return 150; // Day 7 and onwards
  }

  static async claimStreakReward(): Promise<{ success: boolean; reward: number }> {
    const uid = auth.currentUser?.uid;
    const today = this.getTodayDateStr();
    const info = await this.getStreakInfo();

    if (info.lastClaimedDate === today) {
      return { success: false, reward: 0 };
    }

    const rewardCoins = this.getStreakReward(info.currentStreak);
    info.lastClaimedDate = today;

    // Save update
    this.saveLocalStreakInfo(info);

    if (uid && navigator.onLine) {
      try {
        const docRef = doc(db, 'users', uid, 'dailyStreak', 'info');
        await setDoc(docRef, info, { merge: true });
      } catch (e) {
        console.warn("Failed to update streak claimed status on Firestore", e);
      }
    }

    // Add coins
    if (typeof window !== 'undefined' && window.UTLW && window.UTLW.state) {
      window.UTLW.state.coins += rewardCoins;
      if (window.UTLW.save) window.UTLW.save();
    }

    return { success: true, reward: rewardCoins };
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    DailyChallenges.syncOfflineQueue();
  });
}

