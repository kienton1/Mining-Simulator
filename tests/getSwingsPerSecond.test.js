const assert = require('node:assert/strict');
const { test } = require('node:test');

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS' },
});

const { getSwingsPerSecond } = require('../src/Stats/StatCalculator');

const TOLERANCE = 0.01;

const cases = [
  { speed: 0, world: 1, expected: 2 },
  { speed: 0, world: 2, expected: 1 },
  { speed: 0, world: 3, expected: 0.4 },
  { speed: 20.2, world: 1, expected: 3.5853460657573786 },
  { speed: 20.2, world: 2, expected: 1.9991854942670089 },
  { speed: 20.2, world: 3, expected: 0.9992141390339301 },
  { speed: 60, world: 1, expected: 7.544264516725175 },
  { speed: 60, world: 2, expected: 4.000364375432349 },
  { speed: 60, world: 3, expected: 1.1987322516643428 },
];

test('getSwingsPerSecond matches validation points', () => {
  for (const { speed, world, expected } of cases) {
    const actual = getSwingsPerSecond(speed, world);
    assert.ok(
      Math.abs(actual - expected) <= TOLERANCE,
      `speed=${speed}, world=${world}: expected ${expected}, got ${actual}`
    );
  }
});

test('getSwingsPerSecond clamps negative speed to 0', () => {
  const world1 = getSwingsPerSecond(-5, 1);
  const world3 = getSwingsPerSecond(-5, 3);
  assert.ok(Math.abs(world1 - 2) <= TOLERANCE, `world1 expected 2, got ${world1}`);
  assert.ok(Math.abs(world3 - 0.4) <= TOLERANCE, `world3 expected 0.4, got ${world3}`);
});
