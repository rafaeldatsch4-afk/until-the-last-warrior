export class CombatMath {
  static getDamageMultiplier(transLevel: number, healthPercent: number, hasRage: boolean = false): number {
    let multiplier = 1.0;
    if (transLevel === 1) multiplier = 1.25;
    else if (transLevel === 2) multiplier = 1.5;

    // Rage boost if health is very low
    if (hasRage && healthPercent < 0.25) {
      multiplier += 0.2;
    }

    return multiplier;
  }

  static calculateDamage(baseDamage: number, multiplier: number, isFinisher: boolean = false): number {
    let finalDamage = baseDamage * multiplier;
    if (isFinisher) {
      finalDamage *= 1.5;
    }
    return Math.floor(finalDamage);
  }

  static getComboScaling(comboCount: number): number {
    // Damage scaling for long combos to prevent infinites
    if (comboCount <= 2) return 1.0;
    if (comboCount <= 5) return 0.9;
    if (comboCount <= 8) return 0.8;
    if (comboCount <= 12) return 0.7;
    return 0.5;
  }
}
