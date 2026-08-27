import { describe, it } from "node:test";
import assert from "node:assert";
import { StoryStatsMath } from "./StoryStatsMath";

describe("StoryStatsMath unit tests", () => {
  it("should calculate health bonus correctly", () => {
    assert.strictEqual(StoryStatsMath.getHealthBonus(0), 0);
    assert.strictEqual(StoryStatsMath.getHealthBonus(10), 50);
  });

  it("should calculate speed bonus correctly", () => {
    assert.strictEqual(StoryStatsMath.getSpeedBonus(5), 0.5);
  });

  it("should calculate attack damage multiplier correctly", () => {
    assert.strictEqual(StoryStatsMath.getAttackDamageMultiplier(0), 1);
    assert.strictEqual(StoryStatsMath.getAttackDamageMultiplier(10), 1.3);
  });

  it("should cap defense damage reduction at 50%", () => {
    assert.strictEqual(StoryStatsMath.getDefenseDamageReduction(10), 0.2);
    assert.strictEqual(StoryStatsMath.getDefenseDamageReduction(100), 0.5);
  });

  it("should cap combo window at 3500ms and respect story mode flag", () => {
    assert.strictEqual(StoryStatsMath.getComboWindow(0, false), 2000);
    assert.strictEqual(StoryStatsMath.getComboWindow(0, true), 2000);
    assert.strictEqual(StoryStatsMath.getComboWindow(20, true), 3500);
  });

  it("should calculate ki reward bonus combining defense and ki stats", () => {
    assert.strictEqual(StoryStatsMath.getKiRewardBonus(0, 0), 20);
    assert.strictEqual(StoryStatsMath.getKiRewardBonus(10, 5), 45);
  });
});
