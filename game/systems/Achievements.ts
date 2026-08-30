import { auth, db } from "../../firebase/init";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { GameState } from "../types";

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  check: (state: GameState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "lutador",
    name: "Lutador",
    desc: "Vencer a primeira luta.",
    check: (state) => (state.stats?.totalWins || 0) >= 1
  },
  {
    id: "guerreiro_z",
    name: "Guerreiro Z",
    desc: "Vencer 10 lutas.",
    check: (state) => (state.stats?.totalWins || 0) >= 10
  },
  {
    id: "invencivel",
    name: "Invencível",
    desc: "Vencer 5 lutas consecutivas.",
    check: (state) => (state.stats?.maxWinStreak || 0) >= 5
  },
  {
    id: "campeao_torneio",
    name: "Lenda do Torneio",
    desc: "Vencer um torneio.",
    check: (state) => (state.stats?.tournamentsWon || 0) >= 1
  },
  {
    id: "mestre_arcade",
    name: "Mestre Arcade",
    desc: "Zerar o modo Arcade.",
    check: (state) => (state.stats?.arcadeClears || 0) >= 1
  },
  {
    id: "rico",
    name: "Rico",
    desc: "Acumular 2000 moedas.",
    check: (state) => state.coins >= 2000
  },
  {
    id: "colecionador",
    name: "Colecionador",
    desc: "Desbloquear 5 personagens.",
    check: (state) => {
       const unlockedCount = state.characters.filter(c => c.unlocked).length;
       // Initial characters are already unlocked, but let's just count total unlocked
       // If there are 3 initial, then > 8 means unlocked 5 more. But let's just say total >= 5
       return unlockedCount >= 8; 
    }
  }
];

export function normalizeAchievementName(raw: string): string {
  const map: Record<string, string> = {
    "Primeira Vitória!": "Lutador",
    "Primeira Vitória": "Lutador",
    "Lutador Novato": "Lutador",
    "Campeão (10 Vitórias)": "Guerreiro Z",
    "Campeão": "Guerreiro Z",
    "Veterano (50 Partidas)": "Guerreiro Z",
    "Mestre do Arcade": "Mestre Arcade",
    "Campeão do Torneio": "Lenda do Torneio",
  };
  return map[raw] || raw;
}

export function normalizeAchievements(list: string[] = []): string[] {
  const set = new Set<string>();
  for (const item of list) {
    if (typeof item === "string" && item.trim()) {
      set.add(normalizeAchievementName(item.trim()));
    }
  }
  return Array.from(set);
}

export class AchievementSystem {
  static checkAchievements() {
    if (!window.UTLW || !window.UTLW.state) return;
    const state = window.UTLW.state;
    
    if (!state.unlockedTitles) {
      state.unlockedTitles = [];
    } else {
      state.unlockedTitles = normalizeAchievements(state.unlockedTitles);
    }

    let newlyUnlocked = false;

    for (const ach of ACHIEVEMENTS) {
      if (!state.unlockedTitles.includes(ach.name)) {
        if (ach.check(state)) {
          state.unlockedTitles.push(ach.name);
          newlyUnlocked = true;
          
          // Trigger notification
          window.dispatchEvent(new CustomEvent('achievement-unlocked', { 
            detail: { title: ach.name, desc: ach.desc } 
          }));
        }
      }
    }

    if (newlyUnlocked) {
      window.UTLW.save();
      this.syncStatsToCloud();
    }
  }

  static addWin() {
    if (!window.UTLW || !window.UTLW.state || !window.UTLW.state.stats) return;
    const stats = window.UTLW.state.stats;
    stats.totalWins++;
    stats.winStreak++;
    if (stats.winStreak > stats.maxWinStreak) {
      stats.maxWinStreak = stats.winStreak;
    }
    this.checkAchievements();
    this.syncStatsToCloud();
  }

  static resetStreak() {
    if (!window.UTLW || !window.UTLW.state || !window.UTLW.state.stats) return;
    window.UTLW.state.stats.winStreak = 0;
    // We don't save immediately here unless we want to, wait for next win/loss
  }

  static addTournamentWin() {
    if (!window.UTLW || !window.UTLW.state || !window.UTLW.state.stats) return;
    window.UTLW.state.stats.tournamentsWon++;
    this.checkAchievements();
    this.syncStatsToCloud();
  }

  static addArcadeClear() {
    if (!window.UTLW || !window.UTLW.state || !window.UTLW.state.stats) return;
    window.UTLW.state.stats.arcadeClears++;
    this.checkAchievements();
    this.syncStatsToCloud();
  }

  static async syncStatsToCloud() {
    if (!window.UTLW || !window.UTLW.state) return;
    try {
      const user = auth.currentUser;
      if (user) {
        const stats = window.UTLW.state.stats;
        const achievements = window.UTLW.state.unlockedTitles || [];
        await setDoc(doc(db, 'users', user.uid), {
          wins: stats?.totalWins || 0,
          achievements: achievements
        }, { merge: true });
        
        let playerName = user.displayName || "Guerreiro";
        let avatar = "🥷";
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            playerName = userDoc.data().username || playerName;
            avatar = userDoc.data().avatar || avatar;
          }
        } catch (err) {}
        await setDoc(doc(db, "leaderboard_public", user.uid), {
          username: playerName,
          avatar: avatar,
          wins: stats?.totalWins || 0,
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Failed to sync stats", e);
    }
  }
}
