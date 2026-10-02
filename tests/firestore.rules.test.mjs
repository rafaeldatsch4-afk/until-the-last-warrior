import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import {
  initializeTestEnvironment, assertFails, assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query,
  serverTimestamp, setDoc,
} from 'firebase/firestore';

let env;
const baseline = {
  username: 'Alice',
  avatar: '🥷',
  wins: 0,
  elo: 1000,
  matches: 0,
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-utlw-rules',
    firestore: {
      host: '127.0.0.1',
      port: 8085,
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

after(async () => {
  if (env) await env.cleanup();
});

test('public ranking remains readable, including the game query', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'leaderboard_public/alice'), {
      ...baseline,
      wins: 3,
      matches: 4,
      elo: 1075,
    });
  });

  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'leaderboard_public/alice')));
  await assertSucceeds(
    getDocs(query(
      collection(db, 'leaderboard_public'),
      orderBy('wins', 'desc'),
      limit(30),
    )),
  );
});

test('owner can create a baseline leaderboard entry', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(doc(db, 'leaderboard_public/alice'), {
    ...baseline,
    updatedAt: serverTimestamp(),
  }));
});

test('owner can advance the ranking by exactly one match', async () => {
  const db = env.authenticatedContext('alice').firestore();
  const ref = doc(db, 'leaderboard_public/alice');

  await assertSucceeds(setDoc(ref, {
    ...baseline,
    updatedAt: serverTimestamp(),
  }));

  await assertSucceeds(setDoc(ref, {
    wins: 1,
    matches: 1,
    elo: 1025,
    updatedAt: serverTimestamp(),
  }, { merge: true }));

  const snap = await getDoc(ref);
  const data = snap.data();
  if (data.wins !== 1 || data.matches !== 1 || data.elo !== 1025) {
    throw new Error('ranking did not advance as expected');
  }
});

test('large score jumps and impossible records are rejected', async () => {
  const db = env.authenticatedContext('alice').firestore();
  const ref = doc(db, 'leaderboard_public/alice');

  await assertSucceeds(setDoc(ref, {
    ...baseline,
    updatedAt: serverTimestamp(),
  }));

  await assertFails(setDoc(ref, {
    wins: 20,
    matches: 20,
    elo: 3000,
    updatedAt: serverTimestamp(),
  }, { merge: true }));

  await assertFails(setDoc(ref, {
    wins: 2,
    matches: 1,
    elo: 1000,
    updatedAt: serverTimestamp(),
  }, { merge: true }));
});

test('owner can update public profile metadata without changing score', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'leaderboard_public/alice'), {
      ...baseline,
      wins: 4,
      matches: 7,
      elo: 1100,
    });
  });

  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(
    doc(db, 'leaderboard_public/alice'),
    { username: 'Alice 2', avatar: '⚔️' },
    { merge: true },
  ));
});

test('other users and guests cannot modify or delete ranking entries', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'leaderboard_public/alice'), baseline);
  });

  for (const context of [
    env.authenticatedContext('bob'),
    env.unauthenticatedContext(),
  ]) {
    const ref = doc(context.firestore(), 'leaderboard_public/alice');
    await assertFails(setDoc(ref, {
      wins: 1,
      matches: 1,
      updatedAt: serverTimestamp(),
    }, { merge: true }));
    await assertFails(deleteDoc(ref));
  }
});

test('owner can delete their ranking entry for account deletion', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'leaderboard_public/alice'), baseline);
  });

  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(deleteDoc(doc(db, 'leaderboard_public/alice')));
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
