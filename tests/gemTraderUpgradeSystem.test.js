const assert = require('node:assert/strict');
const { test } = require('node:test');

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS' },
});

const { GemTraderUpgradeSystem, UpgradeType } = require('../src/Shop/GemTraderUpgradeSystem');

function createSystemWithData(overrides = {}) {
  const player = { id: 'player-1', username: 'tester' };
  const data = {
    gems: 1_000_000_000,
    moreGemsLevel: 0,
    moreRebirthsLevel: 0,
    moreCoinsLevel: 0,
    moreDamageLevel: 0,
    ...overrides,
  };

  const system = new GemTraderUpgradeSystem();
  system.setGetPlayerDataCallback(() => data);
  system.setUpdatePlayerDataCallback((_player, nextData) => Object.assign(data, nextData));

  return { system, player, data };
}

test('gem upgrades apply to the expected gameplay multipliers', () => {
  const { system, player } = createSystemWithData();

  assert.equal(system.getMoreGemsMultiplier(player), 1);
  assert.equal(system.getMoreCoinsMultiplier(player), 1);
  assert.equal(system.getMoreDamageMultiplier(player), 1);

  assert.equal(system.purchaseUpgrade(player, UpgradeType.MORE_GEMS).success, true);
  assert.equal(system.purchaseUpgrade(player, UpgradeType.MORE_COINS).success, true);
  assert.equal(system.purchaseUpgrade(player, UpgradeType.MORE_DAMAGE).success, true);

  assert.equal(system.getMoreGemsMultiplier(player), 2);
  assert.equal(system.getMoreCoinsMultiplier(player), 1.1);
  assert.equal(system.getMoreDamageMultiplier(player), 1.1);
});

test('more rebirths expands package options and caps explicitly at the final unlock tier', () => {
  const { system, player, data } = createSystemWithData({ gems: Number.POSITIVE_INFINITY });

  const startPackages = system.getAvailableRebirthPackages(player);
  assert.deepEqual(startPackages, [1, 5, 20]);

  let successCount = 0;
  let maxLevelFailures = 0;
  for (let i = 0; i < 60; i++) {
    const result = system.purchaseUpgrade(player, UpgradeType.MORE_REBIRTHS);
    if (result.success) {
      successCount++;
    } else if (result.error === 'Upgrade already at max level') {
      maxLevelFailures++;
    }
  }

  assert.equal(successCount, 48);
  assert.ok(maxLevelFailures > 0);
  assert.equal(data.moreRebirthsLevel, 48);

  const finalPackages = system.getAvailableRebirthPackages(player);
  assert.ok(finalPackages.includes(2.5e46));
  assert.ok(finalPackages.includes(2.5e47));
  assert.ok(finalPackages.includes(50_000_000_000));
});

test('all gem upgrades expose expected max levels', () => {
  const { system } = createSystemWithData();

  assert.equal(system.getUpgradeMaxLevel(UpgradeType.MORE_GEMS), 50);
  assert.equal(system.getUpgradeMaxLevel(UpgradeType.MORE_REBIRTHS), 48);
  assert.equal(system.getUpgradeMaxLevel(UpgradeType.MORE_COINS), 160);
  assert.equal(system.getUpgradeMaxLevel(UpgradeType.MORE_DAMAGE), 50);
});

test('more rebirths level 47 cost is tuned to 233.7k gems', () => {
  const { system } = createSystemWithData();
  assert.equal(system.calculateMoreRebirthsCost(47), 233700);
});

test('more gems level 49 cost is tuned to 25.2k gems', () => {
  const { system } = createSystemWithData();
  assert.equal(system.calculateMoreGemsCost(49), 25200);
});

test('non-rebirth upgrades stop at max level and return max-level error', () => {
  const { system, player, data } = createSystemWithData({
    gems: Number.POSITIVE_INFINITY,
    moreGemsLevel: 50,
    moreCoinsLevel: 160,
    moreDamageLevel: 50,
  });

  const gemsRes = system.purchaseUpgrade(player, UpgradeType.MORE_GEMS);
  const coinsRes = system.purchaseUpgrade(player, UpgradeType.MORE_COINS);
  const damageRes = system.purchaseUpgrade(player, UpgradeType.MORE_DAMAGE);

  assert.equal(gemsRes.success, false);
  assert.equal(coinsRes.success, false);
  assert.equal(damageRes.success, false);
  assert.equal(gemsRes.error, 'Upgrade already at max level');
  assert.equal(coinsRes.error, 'Upgrade already at max level');
  assert.equal(damageRes.error, 'Upgrade already at max level');
  assert.equal(data.moreGemsLevel, 50);
  assert.equal(data.moreCoinsLevel, 160);
  assert.equal(data.moreDamageLevel, 50);
});

test('over-cap saved upgrade levels are clamped to configured max levels', () => {
  const { system, player } = createSystemWithData({
    moreGemsLevel: 109,
    moreRebirthsLevel: 99,
    moreCoinsLevel: 999,
    moreDamageLevel: 500,
  });

  assert.equal(system.getUpgradeLevel(player, UpgradeType.MORE_GEMS), 50);
  assert.equal(system.getUpgradeLevel(player, UpgradeType.MORE_REBIRTHS), 48);
  assert.equal(system.getUpgradeLevel(player, UpgradeType.MORE_COINS), 160);
  assert.equal(system.getUpgradeLevel(player, UpgradeType.MORE_DAMAGE), 50);
  assert.equal(system.getMoreGemsMultiplier(player), 51);
  assert.equal(system.getMoreCoinsMultiplier(player), 17);
  assert.equal(system.getMoreDamageMultiplier(player), 6);
});
