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

  it("should calculate infinite EXP requirements and level up points", () => {
    const exp1 = StoryStatsMath.getExpNeededForLevel(1);
    const exp10 = StoryStatsMath.getExpNeededForLevel(10);
    const exp100 = StoryStatsMath.getExpNeededForLevel(100);
    assert.ok(exp1 > 0);
    assert.ok(exp10 > exp1);
    assert.ok(exp100 > exp10);

    assert.strictEqual(StoryStatsMath.getStatPointsForLevelUp(2), 2);
    assert.strictEqual(StoryStatsMath.getStatPointsForLevelUp(5), 3);
    assert.strictEqual(StoryStatsMath.getStatPointsForLevelUp(10), 5);
  });

  it("should align enemy level with player level and stage", () => {
    // Player Level 10, Stage 3 (regular stage)
    const enemyLvlRegular = StoryStatsMath.getEnemyLevel(3, 10);
    assert.ok(Math.abs(enemyLvlRegular - 10) <= 2, "Enemy level should be aligned close to player level 10");

    // Player Level 10, Stage 5 (boss stage)
    const enemyLvlBoss = StoryStatsMath.getEnemyLevel(5, 10);
    assert.ok(enemyLvlBoss >= 11, "Boss enemy level should be slightly higher than player level");

    // High level player (Level 85, Stage 42)
    const enemyLvlHigh = StoryStatsMath.getEnemyLevel(42, 85);
    assert.ok(Math.abs(enemyLvlHigh - 85) <= 2, "High level player should face aligned high level enemy");
  });

  it("should generate stage info with infinite chapters and boss metadata", () => {
    const stage1 = StoryStatsMath.getStageInfo(1);
    assert.strictEqual(stage1.chapterNumber, 1);
    assert.strictEqual(stage1.isBoss, false);

    const stage5 = StoryStatsMath.getStageInfo(5);
    assert.strictEqual(stage5.chapterNumber, 1);
    assert.strictEqual(stage5.isBoss, true);
    assert.strictEqual(stage5.threatLevel, "CHEFE LENDÁRIO");

    const stage50 = StoryStatsMath.getStageInfo(50);
    assert.strictEqual(stage50.chapterNumber, 10);
    assert.strictEqual(stage50.isBoss, true);
  });
});
