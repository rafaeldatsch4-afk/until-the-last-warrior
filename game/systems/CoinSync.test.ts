import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseCoins, cloudCoinRevision, trackCoins, validCoins } from './CoinSync';

const wallet = (balance: number, updatedAt: number) => ({ balance, updatedAt, ownerId: 'alice' });

test('newer cloud purchase restores the lower balance, including zero', () => {
  assert.equal(chooseCoins(wallet(1000, 10), wallet(400, 20)).balance, 400);
  assert.equal(chooseCoins(wallet(1000, 10), wallet(0, 20)).balance, 0);
});
test('stale cloud data cannot refund a recent local purchase', () => {
  assert.equal(chooseCoins(wallet(400, 20), wallet(1000, 10)).balance, 400);
});
test('new rewards still increase the balance', () => {
  assert.equal(chooseCoins(wallet(400, 20), wallet(500, 30)).balance, 500);
});
test('autosave does not turn an old balance into a new revision', () => {
  const old = wallet(1000, 10);
  assert.equal(trackCoins(1000, old, 100000), old);
  assert.equal(chooseCoins(trackCoins(1000, old, 100000), wallet(400, 20)).balance, 400);
});
test('offline revision survives localStorage roundtrip and clock rollback', () => {
  const spent = trackCoins(400, wallet(1000, 100), 90);
  assert.equal(spent.updatedAt, 101);
  assert.equal(chooseCoins(JSON.parse(JSON.stringify(spent)), wallet(1000, 100)).balance, 400);
});
test('legacy cloud timestamp migrates without picking the largest balance', () => {
  const remote = cloudCoinRevision({ coins: 40, lastSyncedAt: 123 }, 'alice')!;
  assert.equal(chooseCoins(wallet(1000, 0), remote).balance, 40);
});
test('account change does not import the previous account balance', () => {
  assert.equal(chooseCoins(wallet(9000, 900), { ...wallet(25, 1), ownerId: 'bob' }).balance, 25);
});
test('equal revisions favor canonical cloud balance; invalid balances rejected', () => {
  assert.equal(chooseCoins(wallet(1000, 20), wallet(400, 20)).balance, 400);
  for (const value of [-1, NaN, Infinity, '100', 1.5]) {
    assert.equal(validCoins(value), false);
    assert.equal(cloudCoinRevision({ coins: value }, 'alice'), null);
  }
});
