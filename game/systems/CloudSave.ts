import { doc, getDoc, getDocFromServer, onSnapshot } from "firebase/firestore";
import { writeCloudProgress } from "./CloudSaveTransaction";
import { db, auth } from "../../firebase/init";
import { chooseCoins, cloudCoinRevision, trackCoins, validCoins } from "./CoinSync";

export interface GameStateSave {
  coins: number;
  coinsUpdatedAt?: number;
  stats?: {
    totalWins: number;
    winStreak: number;
    maxWinStreak: number;
    tournamentsWon: number;
    arcadeClears: number;
    charactersUnlocked: number;
  };
  storyState?: {
    level: number;
    exp: number;
    statPoints: number;
    stats: {
      attack: number;
      defense: number;
      ki: number;
      speed: number;
      health: number;
    };
    stage: number;
    customCharacter?: any;
  };
  unlockedTitles?: string[];
  equippedTitle?: string;
  characters?: any[];
  difficulty?: number;
  settings?: any;
  lastSyncedAt?: number | any;
}

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Save Error: ", JSON.stringify(errInfo));
}

// Deep clean undefined and functions before writing to Firestore
function sanitizePayload(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload).filter((item) => item !== undefined);

  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && typeof val !== "function") {
      clean[key] = sanitizePayload(val);
    }
  }
  return clean;
}

/**
 * Salva o progresso completo do usuário (Estatísticas de vitórias, status da campanha, personagens, moedas) no Firestore
 */
export async function saveToCloud(userId: string, saveData: Partial<GameStateSave>): Promise<boolean> {
  if (!userId) return false;
  try {
    const payload = sanitizePayload({
      ...saveData,
      lastSyncedAt: Date.now(),
    });

    await writeCloudProgress(db, userId, payload);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cloud-save-synced", {
          detail: { success: true, timestamp: Date.now() },
        })
      );
    }
    return true;
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `users/${userId}/save/progress`);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cloud-save-synced", {
          detail: { success: false, error: e },
        })
      );
    }
    return false;
  }
}

/**
 * Carrega o progresso salvo na nuvem do Firestore
 */
export async function loadFromCloud(userId: string): Promise<GameStateSave | null> {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db, "users", userId, "save", "progress"));
    if (snap.exists()) {
      return snap.data() as GameStateSave;
    }
    return null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `users/${userId}/save/progress`);
    return null;
  }
}

/**
 * Mescla de forma inteligente os dados da nuvem com o estado local
 */
export function mergeCloudSaveIntoLocal(cloudSave: GameStateSave | null): boolean {
  if (!cloudSave || typeof window === "undefined" || !window.UTLW || !window.UTLW.state) {
    return false;
  }

  const state = window.UTLW.state;
  let changed = false;

  // A lower balance can be newer after a purchase. Never choose by amount.
  const ownerId = auth.currentUser?.uid;
  const remote = ownerId ? cloudCoinRevision(cloudSave, ownerId) : null;
  if (remote) {
    const local = state.coinSync || { balance: state.coins, updatedAt: 0, ownerId: null };
    const tracked = trackCoins(state.coins, local);
    const wallet = chooseCoins(tracked, remote);
    changed = state.coins !== wallet.balance || state.coinSync?.updatedAt !== wallet.updatedAt || state.coinSync?.ownerId !== wallet.ownerId;
    state.coins = wallet.balance;
    state.coinSync = wallet;
  }

  // 2. Estatísticas de Vitórias e Combate
  if (cloudSave.stats) {
    state.stats = state.stats || {
      totalWins: 0,
      winStreak: 0,
      maxWinStreak: 0,
      tournamentsWon: 0,
      arcadeClears: 0,
      charactersUnlocked: 0,
    };
    const prevWins = state.stats.totalWins || 0;
    state.stats.totalWins = Math.max(prevWins, cloudSave.stats.totalWins || 0);
    state.stats.maxWinStreak = Math.max(state.stats.maxWinStreak || 0, cloudSave.stats.maxWinStreak || 0);
    state.stats.tournamentsWon = Math.max(state.stats.tournamentsWon || 0, cloudSave.stats.tournamentsWon || 0);
    state.stats.arcadeClears = Math.max(state.stats.arcadeClears || 0, cloudSave.stats.arcadeClears || 0);
    state.stats.charactersUnlocked = Math.max(state.stats.charactersUnlocked || 0, cloudSave.stats.charactersUnlocked || 0);
    if (state.stats.totalWins !== prevWins) changed = true;
  }

  // 3. Status da Campanha Atual (Modo História)
  if (cloudSave.storyState) {
    const cloudStory = cloudSave.storyState;
    if (!state.storyState) {
      state.storyState = cloudStory;
      changed = true;
    } else {
      const localStage = state.storyState.stage || 1;
      const cloudStage = cloudStory.stage || 1;
      const localLvl = state.storyState.level || 0;
      const cloudLvl = cloudStory.level || 0;

      // Se a nuvem estiver na mesma fase ou mais avançada, preserva o progresso superior
      if (cloudStage > localStage || (cloudStage === localStage && cloudLvl >= localLvl)) {
        state.storyState = {
          ...state.storyState,
          ...cloudStory,
          stats: cloudStory.stats || state.storyState.stats,
          customCharacter: cloudStory.customCharacter || state.storyState.customCharacter,
        };
        changed = true;
      }
    }
  }

  // 4. Conquistas e Títulos Desbloqueados
  if (Array.isArray(cloudSave.unlockedTitles) && cloudSave.unlockedTitles.length > 0) {
    const combinedTitles = Array.from(
      new Set([...(state.unlockedTitles || []), ...cloudSave.unlockedTitles])
    );
    if (combinedTitles.length !== (state.unlockedTitles?.length || 0)) {
      state.unlockedTitles = combinedTitles;
      changed = true;
    }
  }
  if (cloudSave.equippedTitle && !state.equippedTitle) {
    state.equippedTitle = cloudSave.equippedTitle;
    changed = true;
  }

  // 5. Personagens Desbloqueados e Guerreiro Customizado
  if (Array.isArray(cloudSave.characters)) {
    cloudSave.characters.forEach((savedChar: any) => {
      if (!savedChar) return;
      const match = state.characters.find((c) => c.id === savedChar.id);
      if (match) {
        if (savedChar.unlocked && !match.unlocked) {
          match.unlocked = true;
          changed = true;
        }
      } else if (savedChar.id === 999 && savedChar.customData) {
        state.characters.push(savedChar);
        changed = true;
      }
    });
  }

  // 6. Dificuldade & Configurações
  if (typeof cloudSave.difficulty === "number" && state.difficulty === undefined) {
    state.difficulty = cloudSave.difficulty;
  }
  if (cloudSave.settings) {
    state.settings = { ...(state.settings || {}), ...cloudSave.settings };
  }

  if (changed && window.UTLW && window.UTLW.save) {
    window.UTLW.save();
  }

  window.dispatchEvent(
    new CustomEvent("cloud-save-loaded", {
      detail: { cloudSave, merged: changed },
    })
  );

  return changed;
}

/**
 * Dispara uma sincronização imediata do estado atual do jogo para o Firestore
 */
export function syncCloudSaveImmediate(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const user = auth?.currentUser;
  if (user && readyUserId === user.uid && window.UTLW && window.UTLW.state) {
    window.UTLW.save();
    const s = window.UTLW.state;
    return saveToCloud(user.uid, {
      coins: s.coins,
      coinsUpdatedAt: s.coinSync?.updatedAt || 0,
      stats: s.stats,
      storyState: s.storyState,
      unlockedTitles: s.unlockedTitles,
      equippedTitle: s.equippedTitle,
      difficulty: s.difficulty,
      settings: s.settings,
      characters: s.characters?.map((c) => {
        if (c.id === 999) return c; // Salva dados customizados completos do lutador
        return { id: c.id, unlocked: c.unlocked };
      }),
    });
  }
  return Promise.resolve(false);
}

// One authority and one subscription for coins. Uploads wait for initial hydration.
let readyUserId: string | null = null;

export function startCloudSaveSync(): () => void {
  let unsubscribeProgress: (() => void) | undefined;
  let generation = 0;
  const unsubscribeAuth = auth.onAuthStateChanged(user => {
    const currentGeneration = ++generation;
    readyUserId = null;
    unsubscribeProgress?.();
    if (!user) return;
    const isCurrent = () => generation === currentGeneration && auth.currentUser?.uid === user.uid;
    const progressRef = doc(db, 'users', user.uid, 'save', 'progress');
    unsubscribeProgress = onSnapshot(progressRef, { includeMetadataChanges: true }, async snapshot => {
      if (!isCurrent() || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        let save = snapshot.exists() ? snapshot.data() as GameStateSave : null;
        if (!save) {
          // Legacy accounts stored coins only on the profile. Never listen to that mirror.
          const profile = await getDocFromServer(doc(db, 'users', user.uid));
          if (!isCurrent()) return;
          // A progress snapshot may have arrived while the legacy lookup was pending.
          if (readyUserId === user.uid) return;
          const local = window.UTLW.state.coinSync;
          const sameOwner = !local?.ownerId || local.ownerId === user.uid;
          save = { coins: validCoins(profile.data()?.coins) ? profile.data()!.coins : sameOwner ? window.UTLW.state.coins : 1000 };
        }
        if (!isCurrent()) return;
        mergeCloudSaveIntoLocal(save);
        const firstLoad = readyUserId !== user.uid;
        readyUserId = user.uid;
        // Upload a pending offline purchase once after hydration, not on every echo.
        if (firstLoad) void syncCloudSaveImmediate();
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/save/progress`);
      }
    }, error => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/save/progress`));
  });
  const retry = () => { void syncCloudSaveImmediate(); };
  const onHidden = () => { if (document.visibilityState === 'hidden') retry(); };
  window.addEventListener('online', retry);
  document.addEventListener('visibilitychange', onHidden);
  return () => {
    generation++;
    readyUserId = null;
    unsubscribeProgress?.();
    unsubscribeAuth();
    window.removeEventListener('online', retry);
    document.removeEventListener('visibilitychange', onHidden);
  };
}
