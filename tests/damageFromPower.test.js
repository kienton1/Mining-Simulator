const assert = require('node:assert/strict');
const { test } = require('node:test');

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS' },
});

const { damageFromPower } = require('../src/Stats/StatCalculator');

function monotonicCheck(values) {
  let previous = null;
  for (const value of values) {
    const current = damageFromPower(value);
    assert.ok(Number.isFinite(current), `damage should be finite for power=${value}`);
    if (previous !== null) {
      const epsilon = Math.max(1e-9, previous * 1e-12);
      assert.ok(
        current + epsilon >= previous,
        `damage decreased: power=${value}, prev=${previous}, current=${current}`
      );
    }
    previous = current;
  }
}

test('damageFromPower is monotonic on a broad logarithmic range', () => {
  const powers = [];
  for (let exp = 0; exp <= 36; exp += 0.05) {
    powers.push(Math.pow(10, exp));
  }
  monotonicCheck(powers);
});

test('damageFromPower handles extreme values without dropping to 1', () => {
  const huge = damageFromPower(Infinity);
  assert.ok(huge > 1);
  assert.ok(Number.isFinite(huge));

  const nearHuge = damageFromPower(Number.MAX_VALUE);
  assert.ok(nearHuge >= 1);
  assert.ok(Number.isFinite(nearHuge));
  assert.ok(huge >= nearHuge);
});
