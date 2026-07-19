import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/init";

export async function saveToCloud(userId: string, saveData: any): Promise<void> {
  try {
    const cleanData = Object.fromEntries(Object.entries(saveData).filter(([_, v]) => v !== undefined));
    await setDoc(doc(db, "users", userId, "save", "progress"), {
      ...cleanData,
      lastSyncedAt: Date.now(),
    }, { merge: true });
  } catch (e) {
    console.error("Cloud save failed:", e);
  }
}

export async function loadFromCloud(userId: string): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, "users", userId, "save", "progress"));
    if (snap.exists()) return snap.data();
    return null;
  } catch (e) {
    console.error("Cloud load failed:", e);
    return null;
  }
}

export function syncCloudSaveImmediate() {
  if (typeof window === "undefined") return;
  const user = auth?.currentUser;
  if (user && window.UTLW && window.UTLW.state) {
    saveToCloud(user.uid, {
      coins: window.UTLW.state.coins,
      stats: window.UTLW.state.stats,
      storyState: window.UTLW.state.storyState,
      unlockedTitles: window.UTLW.state.unlockedTitles,
      equippedTitle: window.UTLW.state.equippedTitle,
      characters: window.UTLW.state.characters,
    });
  }
}
