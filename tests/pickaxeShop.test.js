const assert = require('node:assert/strict');
const { test } = require('node:test');

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS' },
});

const { PickaxeShop } = require('../src/Shop/PickaxeShop');

function createShopWithData(playerData) {
  let attachedTier = null;

  const pickaxeManager = {
    attachPickaxeToPlayer(_player, tier) {
      attachedTier = tier;
    },
  };

  const shop = new PickaxeShop(pickaxeManager);
  shop.setGetPlayerDataCallback(() => playerData);
  shop.setUpdatePlayerDataCallback((_player, updated) => {
    Object.assign(playerData, updated);
  });

  return {
    shop,
    getAttachedTier: () => attachedTier,
  };
}

test('buyPickaxe allows Frostcore -> Violet Wing with enough gold', () => {
  const player = { id: 'player-1' };
  const playerData = {
    gold: 240_000_000,
    currentPickaxeTier: 9,
    ownedPickaxes: Array.from({ length: 10 }, (_, i) => i),
  };

  const { shop, getAttachedTier } = createShopWithData(playerData);
  const result = shop.buyPickaxe(player, 10);

  assert.equal(result.success, true);
  assert.equal(playerData.currentPickaxeTier, 10);
  assert.equal(playerData.gold, 90_000_000);
  assert.ok(playerData.ownedPickaxes.includes(10));
  assert.equal(getAttachedTier(), 10);
});

test('buyPickaxe normalizes malformed saved data and still enforces sequential progression', () => {
  const player = { id: 'player-2' };
  const playerData = {
    gold: '240000000',
    currentPickaxeTier: '8',
    ownedPickaxes: Array.from({ length: 10 }, (_, i) => String(i)),
  };

  const { shop } = createShopWithData(playerData);

  const skipAttempt = shop.buyPickaxe(player, 12);
  assert.equal(skipAttempt.success, false);

  const validAttempt = shop.buyPickaxe(player, 10);
  assert.equal(validAttempt.success, true);
  assert.equal(playerData.currentPickaxeTier, 10);
  assert.ok(playerData.ownedPickaxes.includes(10));
});
