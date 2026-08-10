import re

with open('game/scenes/BattleScene.ts', 'r') as f:
    content = f.read()

# Add combo damage fields
fields_old = """  public p1HitCombo: number = 0;
  public p1LastHitTime: number = 0;
  public p1LastAttackTime: number = 0;
  public p2ComboCount: number = 0;
  public p2HitCombo: number = 0;"""
fields_new = """  public p1HitCombo: number = 0;
  public p1HitComboDamage: number = 0;
  public p1LastHitTime: number = 0;
  public p1LastAttackTime: number = 0;
  public p2ComboCount: number = 0;
  public p2HitCombo: number = 0;
  public p2HitComboDamage: number = 0;"""

if fields_old in content:
    content = content.replace(fields_old, fields_new)

# Reset combo damage fields
reset_old = """    this.p1HitCombo = 0;
    this.p2HitCombo = 0;"""
reset_new = """    this.p1HitCombo = 0;
    this.p2HitCombo = 0;
    this.p1HitComboDamage = 0;
    this.p2HitComboDamage = 0;"""
if reset_old in content:
    content = content.replace(reset_old, reset_new)

# Update damage and reset if needed
dmg_old = """    if (isP) { // Player took damage, so Enemy (P2) gets the combo
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
dmg_new = """    if (isP) { // Player took damage, so Enemy (P2) gets the combo
      if (currentTime - this.p2LastHitTime < 2000) {
        this.p2HitCombo++;
      } else {
        this.p2HitCombo = 1;
        this.p2HitComboDamage = 0;
      }
      this.p2LastHitTime = currentTime;
      this.p1HitCombo = 0; // Reset player's combo because they got hit
    } else { // Enemy took damage, Player (P1) gets the combo
      if (currentTime - this.p1LastHitTime < 2000) {
        this.p1HitCombo++;
      } else {
        this.p1HitCombo = 1;
        this.p1HitComboDamage = 0;
      }
      this.p1LastHitTime = currentTime;
      this.p2HitCombo = 0; // Reset enemy's combo
    }"""
if dmg_old in content:
    content = content.replace(dmg_old, dmg_new)

# Update combo damage when hit is processed
dmg_apply_old = """    if (hitComboCount > 1) {
      const mult = 1 + (hitComboCount - 1) * 0.1; // Increases damage by 10% per consecutive hit
      dmg = Math.floor(dmg * mult);
    }"""
dmg_apply_new = """    if (hitComboCount > 1) {
      const mult = 1 + (hitComboCount - 1) * 0.1; // Increases damage by 10% per consecutive hit
      dmg = Math.floor(dmg * mult);
    }
    if (isP) {
      this.p2HitComboDamage += dmg;
    } else {
      this.p1HitComboDamage += dmg;
    }"""
if dmg_apply_old in content:
    content = content.replace(dmg_apply_old, dmg_apply_new)

# Call UI update with damage
ui_update_old = """        if (isP && this.p2HitCombo > 1) {
          this.battleUI.updateCombo(this.p2HitCombo, false);"""
ui_update_new = """        if (isP && this.p2HitCombo > 1) {
          this.battleUI.updateCombo(this.p2HitCombo, false, this.p2HitComboDamage);"""
if ui_update_old in content:
    content = content.replace(ui_update_old, ui_update_new)

ui_update_old2 = """        } else if (!isP && this.p1HitCombo > 1) {
          this.battleUI.updateCombo(this.p1HitCombo, true);"""
ui_update_new2 = """        } else if (!isP && this.p1HitCombo > 1) {
          this.battleUI.updateCombo(this.p1HitCombo, true, this.p1HitComboDamage);"""
if ui_update_old2 in content:
    content = content.replace(ui_update_old2, ui_update_new2)

with open('game/scenes/BattleScene.ts', 'w') as f:
    f.write(content)

print("Updated BattleScene combos")
