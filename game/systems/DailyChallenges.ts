import { db, auth } from "../../firebase/init";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AchievementSystem } from "./Achievements";

export type ChallengeCategory = "combat" | "skill" | "defense" | "mastery";

export interface ChallengeDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  category: ChallengeCategory;
  target: number;
  reward: number;
  unit: string;
}

export const ALL_CHALLENGES: ChallengeDef[] = [
  {
    id: "win_3_battles",
    title: "Guerreiro Triunfante",
    desc: "Vença 3 batalhas em qualquer modo",
    icon: "⚔️",
    category: "combat",
    target: 3,
    reward: 60,
    unit: "vitórias",
  },
  {
    id: "use_special_5_times",
    title: "Mestre dos Especiais",
    desc: "Execute 5 Ataques Especiais (50 Ki)",
    icon: "✨",
    category: "skill",
    target: 5,
    reward: 45,
    unit: "especiais",
  },
  {
    id: "use_super_2_times",
    title: "Poder Devastador",
    desc: "Execute 2 Super Ataques Finais (100 Ki)",
    icon: "💥",
    category: "skill",
    target: 2,
    reward: 60,
    unit: "supers",
  },
  {
    id: "perform_parry_3",
    title: "Reflexos de Aço",
    desc: "Execute 3 Parries Perfeitos contra o oponente",
    icon: "⚡",
    category: "defense",
    target: 3,
    reward: 55,
    unit: "parries",
  },
  {
    id: "perfect_dodge_3",
    title: "Passo Fantasma",
    desc: "Realize 3 Esquivas Perfeitas (Dash no tempo certo)",
    icon: "💨",
    category: "defense",
    target: 3,
    reward: 50,
    unit: "esquivas",
  },
  {
    id: "execute_combo_6",
    title: "Frenesi de Golpes",
    desc: "Alcance uma sequência de combo de 6+ acertos",
    icon: "🥊",
    category: "combat",
    target: 1,
    reward: 50,
    unit: "vez",
  },
  {
    id: "transform_2_times",
    title: "Despertar do Poder",
    desc: "Realize 2 Transformações em combate",
    icon: "🌟",
    category: "mastery",
    target: 2,
    reward: 50,
    unit: "transformações",
  },
  {
    id: "win_no_damage",
    title: "Vitória Perfeita",
    desc: "Vença 1 batalha sem sofrer nenhum dano (Flawless)",
    icon: "🛡️",
    category: "mastery",
    target: 1,
    reward: 120,
    unit: "vitória perfeita",
  },
  {
    id: "deal_total_damage",
    title: "Força Destrutiva",
    desc: "Cause um total de 500 de dano acumulado em oponentes",
    icon: "🔥",
    category: "combat",
    target: 500,
    reward: 65,
    unit: "dano",
  },
  {
    id: "charge_ki_total",
    title: "Foco Espiritual",
    desc: "Carregue um total de 200 de Ki em batalhas",
    icon: "🧘",
    category: "skill",
    target: 200,
    reward: 40,
    unit: "Ki",
  },
  {
    id: "win_arcade_or_story",
    title: "Conquistador de Modos",
    desc: "Vença 2 batalhas no Modo Arcade ou História",
    icon: "🏆",
    category: "combat",
    target: 2,
    reward: 70,
    unit: "vitórias",
  },
  {
    id: "combo_rush_10",
    title: "Mestre dos Combos",
    desc: "Atinja um combo impressionante de 10+ acertos",
    icon: "👑",
    category: "mastery",
    target: 1,
    reward: 85,
    unit: "vez",
  },
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  /**
   * Deterministically calculates today's 4 active challenges based on the date.
   * Ensures all players have the exact same curated 4 daily challenges every day,
   * rotating seamlessly at midnight.
   */
  static getTodaysChallenges(dateStr?: string): ChallengeDef[] {
    const targetDate = dateStr || this.getTodayDateStr();
    
    // Hash string date into a numeric seed
    let seed = 0;
    for (let i = 0; i < targetDate.length; i++) {
      seed = (seed * 31 + targetDate.charCodeAt(i)) >>> 0;
    }

    // Pseudorandom generator using seed
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Filter by categories to create a balanced daily pack:
    // 1 Combat, 1 Skill, 1 Defense, 1 Mastery
    const categories: ChallengeCategory[] = ["combat", "skill", "defense", "mastery"];
    const selected: ChallengeDef[] = [];

    for (const cat of categories) {
      const pool = ALL_CHALLENGES.filter((c) => c.category === cat);
      if (pool.length > 0) {
        const index = Math.floor(seededRandom() * pool.length);
        selected.push(pool[index]);
      }
    }

    // Fallback if needed
    if (selected.length < 4) {
      return ALL_CHALLENGES.slice(0, 4);
    }

    return selected;
  }

  static getDefaultProgress(dateStr?: string): Record<string, ChallengeProgress> {
    const challenges = this.getTodaysChallenges(dateStr);
    const progress: Record<string, ChallengeProgress> = {};
    for (const c of challenges) {
      progress[c.id] = { id: c.id, current: 0, claimed: false };
    }
    // Also include bonus master challenge key
    progress["bonus_all_completed"] = { id: "bonus_all_completed", current: 0, claimed: false };
    return progress;
  }

  static getOfflineQueue() {
    try {
      const stored = localStorage.getItem("utlw_daily_challenge_queue");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }

  static saveOfflineQueue(queue: any[]) {
    try {
      localStorage.setItem("utlw_daily_challenge_queue", JSON.stringify(queue));
    } catch {}
  }

  static queueUpdate(uid: string, dateStr: string, id: string, amount: number) {
    const queue = this.getOfflineQueue();
    const existing = queue.find(
      (q: any) => q.uid === uid && q.dateStr === dateStr && q.id === id,
    );
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
    const dateStr = this.getTodayDateStr();

    if (!uid) {
      // Local progress for non-authenticated guests
      try {
        const localKey = `utlw_daily_prog_${dateStr}`;
        const stored = localStorage.getItem(localKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {}
      return this.getDefaultProgress(dateStr);
    }

    // Trigger a sync if possible before fetching
    if (navigator.onLine) this.syncOfflineQueue();

    try {
      const docRef = doc(db, "users", uid, "dailyChallenges", dateStr);
      const snap = await getDoc(docRef);
      let prog = this.getDefaultProgress(dateStr);
      if (snap.exists()) {
        const data = snap.data();
        Object.assign(prog, data);
      } else {
        await setDoc(docRef, prog);
      }

      // Apply offline queue to local state so UI updates immediately
      const queue = this.getOfflineQueue();
      for (const update of queue) {
        if (
          update.uid === uid &&
          update.dateStr === dateStr &&
          prog[update.id]
        ) {
          const challenge = ALL_CHALLENGES.find((c) => c.id === update.id);
          if (challenge) {
            prog[update.id].current = Math.min(
              challenge.target,
              prog[update.id].current + update.amount,
            );
          }
        }
      }

      return prog as Record<string, ChallengeProgress>;
    } catch (e) {
      console.warn("Failed to get daily challenges from cloud, using fallback", e);
      return this.getDefaultProgress(dateStr);
    }
  }

  static async addProgress(id: string, amount: number, isSyncing = false) {
    if (amount <= 0) return;
    const dateStr = this.getTodayDateStr();
    const todays = this.getTodaysChallenges(dateStr);
    const challenge = todays.find((c) => c.id === id) || ALL_CHALLENGES.find((c) => c.id === id);
    if (!challenge) return;

    const uid = auth.currentUser?.uid;

    if (!uid) {
      // Handle local guest progression
      try {
        const localKey = `utlw_daily_prog_${dateStr}`;
        const stored = localStorage.getItem(localKey);
        let prog = stored ? JSON.parse(stored) : this.getDefaultProgress(dateStr);
        if (!prog[id]) prog[id] = { id, current: 0, claimed: false };
        if (!prog[id].claimed && prog[id].current < challenge.target) {
          prog[id].current = Math.min(challenge.target, prog[id].current + amount);
          localStorage.setItem(localKey, JSON.stringify(prog));
        }
      } catch {}
      return;
    }

    if (!navigator.onLine && !isSyncing) {
      this.queueUpdate(uid, dateStr, id, amount);
      return;
    }

    try {
      const docRef = doc(db, "users", uid, "dailyChallenges", dateStr);
      const snap = await getDoc(docRef);

      let currentData = snap.exists()
        ? (snap.data() as Record<string, ChallengeProgress>)
        : this.getDefaultProgress(dateStr);

      if (!currentData[id]) {
        currentData[id] = { id, current: 0, claimed: false };
      }

      if (currentData[id].claimed) return;

      const maxTarget = challenge.target;
      if (currentData[id].current >= maxTarget) return;

      currentData[id].current = Math.min(
        maxTarget,
        currentData[id].current + amount,
      );

      await setDoc(docRef, currentData, { merge: true });
    } catch (e: any) {
      console.warn("Failed to update daily challenges", e);
      if (
        !isSyncing &&
        (e.code === "unavailable" ||
          e.message?.includes("offline") ||
          !navigator.onLine)
      ) {
        this.queueUpdate(uid, dateStr, id, amount);
      }
    }
  }

  static async claimReward(id: string): Promise<boolean> {
    const dateStr = this.getTodayDateStr();
    const challenge = ALL_CHALLENGES.find((c) => c.id === id);
    if (!challenge) return false;

    const uid = auth.currentUser?.uid;

    if (!uid) {
      // Guest claim
      try {
        const localKey = `utlw_daily_prog_${dateStr}`;
        const stored = localStorage.getItem(localKey);
        if (!stored) return false;
        const prog = JSON.parse(stored);
        if (prog[id] && prog[id].current >= challenge.target && !prog[id].claimed) {
          prog[id].claimed = true;
          localStorage.setItem(localKey, JSON.stringify(prog));
          if (window.UTLW && window.UTLW.state) {
            window.UTLW.state.coins += challenge.reward;
            if (window.UTLW.save) window.UTLW.save();
            AchievementSystem.checkAchievements();
          }
          return true;
        }
      } catch {}
      return false;
    }

    try {
      const docRef = doc(db, "users", uid, "dailyChallenges", dateStr);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return false;

      let currentData = snap.data() as Record<string, ChallengeProgress>;

      if (
        currentData[id] &&
        currentData[id].current >= challenge.target &&
        !currentData[id].claimed
      ) {
        currentData[id].claimed = true;
        await setDoc(docRef, currentData, { merge: true });

        if (window.UTLW && window.UTLW.state) {
          window.UTLW.state.coins += challenge.reward;
          if (window.UTLW.save) window.UTLW.save();
          AchievementSystem.checkAchievements();
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Failed to claim challenge reward", e);
      return false;
    }
  }

  static async claimMasterBonus(): Promise<{ success: boolean; reward: number }> {
    const dateStr = this.getTodayDateStr();
    const todays = this.getTodaysChallenges(dateStr);
    const progress = await this.getProgress();
    const masterReward = 100;

    // Verify all todays challenges are completed
    const allDone = todays.every(
      (c) => (progress[c.id]?.current || 0) >= c.target
    );
    if (!allDone) return { success: false, reward: 0 };

    const bonusState = progress["bonus_all_completed"];
    if (bonusState && bonusState.claimed) {
      return { success: false, reward: 0 };
    }

    progress["bonus_all_completed"] = {
      id: "bonus_all_completed",
      current: 1,
      claimed: true,
    };

    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const docRef = doc(db, "users", uid, "dailyChallenges", dateStr);
        await setDoc(docRef, progress, { merge: true });
      } catch (e) {
        console.warn("Failed to save master bonus claim", e);
      }
    } else {
      try {
        localStorage.setItem(`utlw_daily_prog_${dateStr}`, JSON.stringify(progress));
      } catch {}
    }

    if (window.UTLW && window.UTLW.state) {
      window.UTLW.state.coins += masterReward;
      if (window.UTLW.save) window.UTLW.save();
      AchievementSystem.checkAchievements();
    }

    return { success: true, reward: masterReward };
  }

  static async claimAllRewards(): Promise<number> {
    const dateStr = this.getTodayDateStr();
    const todays = this.getTodaysChallenges(dateStr);
    const progress = await this.getProgress();

    let totalReward = 0;
    let claimedCount = 0;

    for (const challenge of todays) {
      const p = progress[challenge.id];
      if (p && p.current >= challenge.target && !p.claimed) {
        p.claimed = true;
        totalReward += challenge.reward;
        claimedCount++;
      }
    }

    if (claimedCount > 0) {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const docRef = doc(db, "users", uid, "dailyChallenges", dateStr);
          await setDoc(docRef, progress, { merge: true });
        } catch (e) {
          console.warn("Failed to sync claim all to Firestore", e);
        }
      } else {
        try {
          localStorage.setItem(`utlw_daily_prog_${dateStr}`, JSON.stringify(progress));
        } catch {}
      }

      if (window.UTLW && window.UTLW.state) {
        window.UTLW.state.coins += totalReward;
        if (window.UTLW.save) window.UTLW.save();
        AchievementSystem.checkAchievements();
      }
    }

    return totalReward;
  }

  // --- STREAK SYSTEM ---

  static getLocalStreakInfo(): DailyStreakInfo {
    try {
      const stored = localStorage.getItem("utlw_daily_streak");
      if (stored) return JSON.parse(stored);
    } catch {}
    return { currentStreak: 0, lastLoginDate: "", lastClaimedDate: "" };
  }

  static saveLocalStreakInfo(info: DailyStreakInfo) {
    try {
      localStorage.setItem("utlw_daily_streak", JSON.stringify(info));
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
        const docRef = doc(db, "users", uid, "dailyStreak", "info");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const dbInfo = snap.data() as DailyStreakInfo;
          if (
            !localInfo.lastLoginDate ||
            dbInfo.lastLoginDate >= localInfo.lastLoginDate
          ) {
            localInfo = dbInfo;
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch streak from Firestore", e);
    }

    if (localInfo.lastLoginDate === "") {
      localInfo.currentStreak = 1;
      localInfo.lastLoginDate = today;
    } else if (localInfo.lastLoginDate !== today) {
      const last = new Date(localInfo.lastLoginDate + "T00:00:00");
      const curr = new Date(today + "T00:00:00");
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
        const docRef = doc(db, "users", uid, "dailyStreak", "info");
        await setDoc(docRef, localInfo, { merge: true });
      } catch (e) {
        console.warn("Could not save streak to Firestore", e);
      }
    }

    return localInfo;
  }

  static getStreakReward(streak: number): number {
    if (streak <= 1) return 20;
    if (streak === 2) return 35;
    if (streak === 3) return 50;
    if (streak === 4) return 75;
    if (streak === 5) return 100;
    if (streak === 6) return 130;
    return 180; // Day 7+ Master Login Bonus
  }

  static async claimStreakReward(): Promise<{
    success: boolean;
    reward: number;
  }> {
    const uid = auth.currentUser?.uid;
    const today = this.getTodayDateStr();
    const info = await this.getStreakInfo();

    if (info.lastClaimedDate === today) {
      return { success: false, reward: 0 };
    }

    const rewardCoins = this.getStreakReward(info.currentStreak);
    info.lastClaimedDate = today;

    this.saveLocalStreakInfo(info);

    if (uid && navigator.onLine) {
      try {
        const docRef = doc(db, "users", uid, "dailyStreak", "info");
        await setDoc(docRef, info, { merge: true });
      } catch (e) {
        console.warn("Failed to update streak claimed status on Firestore", e);
      }
    }

    if (typeof window !== "undefined" && window.UTLW && window.UTLW.state) {
      window.UTLW.state.coins += rewardCoins;
      if (window.UTLW.save) window.UTLW.save();
    }

    return { success: true, reward: rewardCoins };
  }

  // --- MISSION EVENT TRIGGERS (COMBAT HOOKS) ---

  static onBattleWon(gameMode: string, isFlawless: boolean) {
    if (gameMode === "training") return;

    this.addProgress("win_3_battles", 1);

    if (isFlawless) {
      this.addProgress("win_no_damage", 1);
    }

    if (gameMode === "arcade" || gameMode === "story") {
      this.addProgress("win_arcade_or_story", 1);
    }
  }

  static onSpecialUsed(isSuper: boolean) {
    this.addProgress("use_special_5_times", 1);
    if (isSuper) {
      this.addProgress("use_super_2_times", 1);
    }
  }

  static onParry() {
    this.addProgress("perform_parry_3", 1);
  }

  static onDodge() {
    this.addProgress("perfect_dodge_3", 1);
  }

  static onComboHit(hits: number) {
    if (hits >= 6) {
      this.addProgress("execute_combo_6", 1);
    }
    if (hits >= 10) {
      this.addProgress("combo_rush_10", 1);
    }
  }

  static onTransform() {
    this.addProgress("transform_2_times", 1);
  }

  static onDamageDealt(damage: number) {
    if (damage > 0) {
      this.addProgress("deal_total_damage", damage);
    }
  }

  static onKiCharged(amount: number) {
    if (amount > 0) {
      this.addProgress("charge_ki_total", Math.round(amount));
    }
  }

  static getTimeUntilReset(): { hours: number; minutes: number } {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diffMs = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  }
}

// Backward compatibility export
export const CHALLENGES: ChallengeDef[] = ALL_CHALLENGES;

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    DailyChallenges.syncOfflineQueue();
  });
}
