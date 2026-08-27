export class StoryStatsMath {
  // Bônus de HP máximo: cada ponto de Health = +5 HP
  static getHealthBonus(healthStat: number): number {
    return healthStat * 5;
  }

  // Bônus de velocidade de movimento: cada ponto de Speed = +0.1
  static getSpeedBonus(speedStat: number): number {
    return speedStat * 0.1;
  }

  // Bônus de carga de Ki por delta de frame: cada ponto de Ki = +0.001 por delta
  static getKiChargeBonus(kiStat: number, delta: number): number {
    return (kiStat * 0.001) * delta;
  }

  // Multiplicador de dano por Attack: cada ponto = +3%
  static getAttackDamageMultiplier(attackStat: number): number {
    return 1 + (attackStat * 0.03);
  }

  // Redução de dano recebido por Defense: cada ponto = -2%, cap em 50%
  static getDefenseDamageReduction(defenseStat: number): number {
    return Math.min(0.5, defenseStat * 0.02);
  }

  // Janela de combo ampliada por Speed, cap em 3500ms
  static getComboWindow(speedStat: number, isStoryMode: boolean): number {
    return isStoryMode ? Math.min(3500, 2000 + speedStat * 120) : 2000;
  }

  // Escala de dano por golpe dentro de um combo, baseada em Speed
  static getPerHitScale(speedStat: number): number {
    return 0.15 + (speedStat * 0.02);
  }

  // Bônus de Ki em recompensa pós-batalha, combinando Defense e Ki
  static getKiRewardBonus(defenseStat: number, kiStat: number): number {
    return 20 + Math.floor(defenseStat * 1.5) + (kiStat * 2);
  }
}
