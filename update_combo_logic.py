import re

with open('game/scenes/BattleScene.ts', 'r') as f:
    content = f.read()

# 1. Update createFloatingComboMultiplier to show the multiplier
old_combo_text = """    const text = this.add
      .text(x + jitterX, y - 60, `${comboCount}x COMBO!`, {"""
new_combo_text = """    const text = this.add
      .text(x + jitterX, y - 60, `${comboCount} HITS! (x${multiplier})`, {"""
content = content.replace(old_combo_text, new_combo_text)

# 2. Modify takeDamage
old_takeDamage_section = """    // Apply combo multiplier ONLY if the target isn't defending
    const attackerComboCount = isP ? this.p2ComboCount : this.p1ComboCount;
    if (attackerComboCount > 1) {
      const mult = Math.max(0.2, 1 - (attackerComboCount - 1) * 0.1);
      dmg = Math.floor(dmg * mult);
    }"""

new_takeDamage_section = """    // Update hit combo counter (BEFORE damage application)
    const currentTime = this.time.now;
    if (isP) { // Player took damage, so Enemy (P2) gets the combo
      if (currentTime - this.p2LastHitTime < 2000) {
        this.p2HitCombo++;
      } else {
        this.p2HitCombo = 1;
      }
      this.p2LastHitTime = currentTime;
      this.p1HitCombo = 0; // Reset player's combo because they got hit
    } else { // Enemy took damage, Player (P1) gets the combo
      if (currentTime - this.p1LastHitTime < 2000) {
        this.p1HitCombo++;
      } else {
        this.p1HitCombo = 1;
      }
      this.p1LastHitTime = currentTime;
      this.p2HitCombo = 0; // Reset enemy's combo
    }

    // Apply combo multiplier ONLY if the target isn't defending
    const hitComboCount = isP ? this.p2HitCombo : this.p1HitCombo;
    if (hitComboCount > 1) {
      const mult = 1 + (hitComboCount - 1) * 0.1; // Increases damage by 10% per consecutive hit
      dmg = Math.floor(dmg * mult);
    }"""
content = content.replace(old_takeDamage_section, new_takeDamage_section)

# 3. Remove the old hit combo update logic
old_hit_combo_update = """      // Update hit combo counter
      const currentTime = this.time.now;
      if (isP) { // Player took damage, so Enemy (P2) gets the combo
        if (currentTime - this.p2LastHitTime < 2000) {
          this.p2HitCombo++;
        } else {
          this.p2HitCombo = 1;
        }
        this.p2LastHitTime = currentTime;
        this.p1HitCombo = 0; // Reset player's combo because they got hit
      } else { // Enemy took damage, Player (P1) gets the combo
        if (currentTime - this.p1LastHitTime < 2000) {
          this.p1HitCombo++;
        } else {
          this.p1HitCombo = 1;
        }
        this.p1LastHitTime = currentTime;
        this.p2HitCombo = 0; // Reset enemy's combo
      }"""
content = content.replace(old_hit_combo_update, "      // Hit combo already updated above")

with open('game/scenes/BattleScene.ts', 'w') as f:
    f.write(content)
print("Updated BattleScene.ts")
