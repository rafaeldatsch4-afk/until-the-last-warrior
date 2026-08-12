import { describe, it } from "node:test";
import assert from "node:assert";
import { CombatMath } from "./CombatMath";

describe("CombatMath unit tests", () => {
  it("should calculate base damage multiplier based on transformation level", () => {
    assert.strictEqual(CombatMath.getDamageMultiplier(0, 1.0), 1.0);
    assert.strictEqual(CombatMath.getDamageMultiplier(1, 1.0), 1.25);
    assert.strictEqual(CombatMath.getDamageMultiplier(2, 1.0), 1.5);
  });

  it("should apply rage boost when health is low", () => {
    assert.strictEqual(CombatMath.getDamageMultiplier(0, 0.2, true), 1.2);
    assert.strictEqual(CombatMath.getDamageMultiplier(1, 0.2, true), 1.45);
  });

  it("should not apply rage boost when health is above threshold", () => {
    assert.strictEqual(CombatMath.getDamageMultiplier(0, 0.5, true), 1.0);
  });

  it("should calculate final damage with combo finisher", () => {
    // 10 * 1.0 * 1.5 = 15
    assert.strictEqual(CombatMath.calculateDamage(10, 1.0, true), 15);
    
    // 10 * 1.25 * 1.0 (no finisher) = 12 (floor)
    assert.strictEqual(CombatMath.calculateDamage(10, 1.25, false), 12);
  });

  it("should return correct combo scaling", () => {
    assert.strictEqual(CombatMath.getComboScaling(1), 1.0);
    assert.strictEqual(CombatMath.getComboScaling(3), 0.9);
    assert.strictEqual(CombatMath.getComboScaling(6), 0.8);
    assert.strictEqual(CombatMath.getComboScaling(10), 0.7);
    assert.strictEqual(CombatMath.getComboScaling(15), 0.5);
  });
});
