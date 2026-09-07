import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import {
  initializeTestEnvironment, assertFails, assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, increment,
  limit, orderBy, query, setDoc, updateDoc, writeBatch,
} from 'firebase/firestore';

// initializeTestEnvironment requires the emulator; these tests never use production.
let env;
const score = { username: 'Alice', avatar: '🥷', wins: 3, elo: 1075, matches: 4 };
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-utlw-rules',
    firestore: {
      host: '127.0.0.1', port: 8085,
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'leaderboard_public/alice'), score);
  });
});
after(async () => { if (env) await env.cleanup(); });

test('public ranking remains readable, including the game query', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'leaderboard_public/alice')));
  await assertSucceeds(getDocs(query(collection(db, 'leaderboard_public'), orderBy('wins', 'desc'), limit(30))));
});

test('even the owner cannot change scores, increment wins or replace their entry', async () => {
  const ref = doc(env.authenticatedContext('alice').firestore(), 'leaderboard_public/alice');
  await assertFails(updateDoc(ref, { elo: 999999, wins: 999999 }));
  await assertFails(updateDoc(ref, { wins: increment(1) }));
  await assertFails(setDoc(ref, score));
  await assertFails(setDoc(ref, { username: 'New name' }, { merge: true }));
});

test('new users cannot create entries, even with zero wins and baseline Elo', async () => {
  const ref = doc(env.authenticatedContext('bob').firestore(), 'leaderboard_public/bob');
  await assertFails(setDoc(ref, { ...score, wins: 0, elo: 1000, matches: 0 }));
});

test('other users and guests cannot alter or delete a ranking entry', async () => {
  for (const context of [env.authenticatedContext('bob'), env.unauthenticatedContext()]) {
    const ref = doc(context.firestore(), 'leaderboard_public/alice');
    await assertFails(updateDoc(ref, { wins: 9 }));
    await assertFails(deleteDoc(ref));
  }
});

test('owner can remove their entry for account deletion but cannot recreate it', async () => {
  const ref = doc(env.authenticatedContext('alice').firestore(), 'leaderboard_public/alice');
  await assertSucceeds(deleteDoc(ref));
  await assertFails(setDoc(ref, { ...score, wins: 999999 }));
});

test('editing private stats does not authorize publishing them, including in a batch', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(doc(db, 'users/alice'), { wins: 999999, elo: 999999 }));
  await assertFails(updateDoc(doc(db, 'leaderboard_public/alice'), { wins: 999999 }));
  const batch = writeBatch(db);
  batch.set(doc(db, 'users/alice'), { wins: 999999 });
  batch.update(doc(db, 'leaderboard_public/alice'), { wins: 999999 });
  await assertFails(batch.commit());
});

test('private save access remains restricted to its owner', async () => {
  const ownerDb = env.authenticatedContext('alice').firestore();
  const path = 'users/alice/save/progress';
  await assertSucceeds(setDoc(doc(ownerDb, path), { coins: 100 }));
  await assertSucceeds(getDoc(doc(ownerDb, path)));
  const otherDb = env.authenticatedContext('bob').firestore();
  await assertFails(getDoc(doc(otherDb, path)));
  await assertFails(setDoc(doc(otherDb, path), { coins: 0 }));
  await assertSucceeds(deleteDoc(doc(ownerDb, path)));
});

test('unmatched ranking subcollections cannot be used to bypass the restriction', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db, 'leaderboard_public/alice/scores/forged'), score));
});
