import { readFile } from 'node:fs/promises';
import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { writeCloudProgress } from '../game/systems/CloudSaveTransaction.ts';

let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-utlw-coins', firestore: {
    host: '127.0.0.1', port: 8085,
    rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
  }});
});
beforeEach(async () => { await env.clearFirestore(); });
after(async () => { await env?.cleanup(); });
const read = async db => (await getDoc(doc(db, 'users/alice/save/progress'))).data();

test('delayed old save cannot refund a purchase or remove its unlock', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await writeCloudProgress(db, 'alice', { coins: 400, coinsUpdatedAt: 20, characters: [{ id: 7, unlocked: true }] });
  await writeCloudProgress(db, 'alice', { coins: 1000, coinsUpdatedAt: 10, characters: [{ id: 7, unlocked: false }] });
  assert.equal((await read(db)).coins, 400);
  assert.equal((await read(db)).characters[0].unlocked, true);
  const profile = (await getDoc(doc(db, 'users/alice'))).data();
  assert.equal(profile.coins, 400);
  assert.equal(typeof profile.lastLogin.toMillis(), 'number');
});

test('concurrent transactions converge on latest revision and matching mirror', async () => {
  const desktop = env.authenticatedContext('alice').firestore();
  const mobile = env.authenticatedContext('alice').firestore();
  await Promise.all([
    writeCloudProgress(desktop, 'alice', { coins: 1000, coinsUpdatedAt: 10 }),
    writeCloudProgress(mobile, 'alice', { coins: 0, coinsUpdatedAt: 20 }),
  ]);
  assert.equal((await read(desktop)).coins, 0);
  assert.equal((await getDoc(doc(mobile, 'users/alice'))).data().coins, 0);
});

test('failed transaction writes neither save nor profile', async () => {
  const intruder = env.authenticatedContext('bob').firestore();
  await assert.rejects(writeCloudProgress(intruder, 'alice', { coins: 999, coinsUpdatedAt: 10 }));
  const owner = env.authenticatedContext('alice').firestore();
  assert.equal((await getDoc(doc(owner, 'users/alice'))).exists(), false);
  assert.equal((await getDoc(doc(owner, 'users/alice/save/progress'))).exists(), false);
});

test('legacy cloud balance is not replaced by an unversioned stale upload', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await setDoc(doc(db, 'users/alice/save/progress'), { coins: 25, lastSyncedAt: 100 });
  await writeCloudProgress(db, 'alice', { coins: 1000, coinsUpdatedAt: 0 });
  assert.equal((await read(db)).coins, 25);
});
