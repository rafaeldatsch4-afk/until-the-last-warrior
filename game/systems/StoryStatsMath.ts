export interface StoryEnemyStats {
  attack: number;
  defense: number;
  ki: number;
  speed: number;
  health: number;
}

export interface StoryEnemyScaling {
  enemyLevel: number;
  isBoss: boolean;
  bossTitle?: string;
  stats: StoryEnemyStats;
  hpBonus: number;
  attackMultiplier: number;
  defenseReduction: number;
  kiChargeBonus: number;
  speedBonus: number;
}

export interface StoryStageInfo {
  chapterNumber: number;
  chapterTitle: string;
  stageTitle: string;
  isBoss: boolean;
  bossTitle?: string;
  arenaKey: string;
  threatLevel: "Normal" | "Veterano" | "Elite" | "CHEFE LENDÁRIO";
}

export class StoryStatsMath {
  // Bônus de HP máximo: cada ponto de Health = +5 HP
  static getHealthBonus(healthStat: number): number {
    return Math.max(0, healthStat) * 5;
  }

  // Bônus de velocidade de movimento: cada ponto de Speed = +0.1 (suavemente limitado a 5.0)
  static getSpeedBonus(speedStat: number): number {
    return Math.min(5.0, Math.max(0, speedStat) * 0.1);
  }

  // Bônus de carga de Ki por delta de frame: cada ponto de Ki = +0.001 por delta
  static getKiChargeBonus(kiStat: number, delta: number): number {
    return (Math.max(0, kiStat) * 0.001) * delta;
  }

  // Multiplicador de dano por Attack: cada ponto = +3%
  static getAttackDamageMultiplier(attackStat: number): number {
    return 1 + (Math.max(0, attackStat) * 0.03);
  }

  // Redução de dano recebido por Defense: cada ponto = -2%, cap em 50%
  static getDefenseDamageReduction(defenseStat: number): number {
    return Math.min(0.5, Math.max(0, defenseStat) * 0.02);
  }

  // Janela de combo ampliada por Speed, cap em 3500ms
  static getComboWindow(speedStat: number, isStoryMode: boolean): number {
    return isStoryMode ? Math.min(3500, 2000 + Math.max(0, speedStat) * 120) : 2000;
  }

  // Escala de dano por golpe dentro de um combo, baseada em Speed
  static getPerHitScale(speedStat: number): number {
    return 0.15 + (Math.max(0, speedStat) * 0.02);
  }

  // Bônus de Ki em recompensa pós-batalha, combinando Defense e Ki
  static getKiRewardBonus(defenseStat: number, kiStat: number): number {
    return 20 + Math.floor(Math.max(0, defenseStat) * 1.5) + (Math.max(0, kiStat) * 2);
  }

  // Curva de EXP infinita para cada nível (escala equilibrada sem teto)
  static getExpNeededForLevel(level: number): number {
    const safeLevel = Math.max(0, level);
    return Math.floor(100 + safeLevel * 55 + Math.pow(safeLevel, 1.25) * 18);
  }

  // Pontos de atributo concedidos ao subir de nível
  static getStatPointsForLevelUp(newLevel: number): number {
    let points = 2;
    if (newLevel % 10 === 0) {
      points += 3; // Marco de 10 níveis: +5 pontos no total
    } else if (newLevel % 5 === 0) {
      points += 1; // Marco de 5 níveis: +3 pontos no total
    }
    return points;
  }

  // Alinhamento dinâmico do nível do oponente com o nível do jogador e fase atual
  static getEnemyLevel(stage: number, playerLevel: number): number {
    const safeStage = Math.max(1, stage);
    const safePlayerLvl = Math.max(1, playerLevel || 1);
    const isBoss = safeStage % 5 === 0;

    if (isBoss) {
      // Chefe sempre ligeiramente superior ao nível do jogador (+1 a +3 níveis)
      const bossBonus = 1 + Math.floor(safeStage / 15);
      return Math.max(1, safePlayerLvl + bossBonus);
    }

    // Fases regulares: variam suavemente em torno do nível do jogador (-1, 0, +1)
    const variance = ((safeStage - 1) % 5) - 2; // -2, -1, 0, 1, 2
    const alignedLevel = safePlayerLvl + variance;
    return Math.max(1, alignedLevel);
  }

  // Geração equilibrada de atributos do inimigo alinhados ao nível
  static getEnemyStats(enemyLevel: number, isBoss: boolean): StoryEnemyStats {
    const totalPoints = Math.max(0, (enemyLevel - 1) * 2 + (isBoss ? 8 : 0));
    
    // Distribuição balanceada proporcional
    const baseShare = Math.floor(totalPoints / 5);
    const remainder = totalPoints % 5;

    return {
      attack: baseShare + (remainder > 0 ? 1 : 0) + (isBoss ? 2 : 0),
      defense: baseShare + (remainder > 1 ? 1 : 0) + (isBoss ? 2 : 0),
      ki: baseShare + (remainder > 2 ? 1 : 0),
      speed: baseShare + (remainder > 3 ? 1 : 0),
      health: baseShare + (isBoss ? 3 : 0),
    };
  }

  // Cálculo completo do escalonamento de batalha do inimigo
  static getEnemyScaling(playerLevel: number, enemyLevel: number, isBoss: boolean): StoryEnemyScaling {
    const stats = this.getEnemyStats(enemyLevel, isBoss);
    const hpBonus = this.getHealthBonus(stats.health) + (isBoss ? 60 : 0);
    const attackMultiplier = this.getAttackDamageMultiplier(stats.attack) * (isBoss ? 1.08 : 1.0);
    const defenseReduction = this.getDefenseDamageReduction(stats.defense);
    const kiChargeBonus = (stats.ki * 0.001);
    const speedBonus = this.getSpeedBonus(stats.speed);

    return {
      enemyLevel,
      isBoss,
      stats,
      hpBonus,
      attackMultiplier,
      defenseReduction,
      kiChargeBonus,
      speedBonus,
    };
  }

  // Metadados temáticos e dinâmicos para estágios infinitos
  static getStageInfo(stage: number): StoryStageInfo {
    const safeStage = Math.max(1, stage);
    const chapterNumber = Math.floor((safeStage - 1) / 5) + 1;
    const stageInChapter = ((safeStage - 1) % 5) + 1;
    const isBoss = stageInChapter === 5;

    const chapterTitles = [
      "O Despertar do Guerreiro",
      "Mestres das Artes Marciais",
      "A Saga Intergaláctica",
      "A Batalha em Namekusei",
      "O Torneio dos Deuses",
      "A Ascensão dos Androides",
      "O Reino das Sombras",
      "A Fúria do Universo 7",
      "A Dimensão Esquecida",
      "O Limite do Multiverso",
      "A Era dos Guerreiros Divinos",
      "O Confronto Celestial Infinito",
    ];

    const chapterTitle = chapterTitles[(chapterNumber - 1) % chapterTitles.length] || `Capítulo Cósmico ${chapterNumber}`;

    const arenas = [
      "arena",            // Terra
      "arena_tournament", // Torneio
      "arena_namek",      // Namek
      "arena_city",       // Cidade
      "arena_ice",        // Gelo
      "arena_lava",       // Lava
      "arena_desert",     // Deserto
      "arena_dark",       // Reino Escuro
    ];

    const arenaKey = isBoss ? arenas[(chapterNumber * 3) % arenas.length] : arenas[(safeStage - 1) % arenas.length];

    const bossTitles = [
      "CHEFE LENDÁRIO",
      "MESTRE SUPREMO",
      "IMPERADOR DO MAL",
      "DEUS DA DESTRUIÇÃO",
      "CONQUISTADOR UNIVERSAL",
      "SENHOR DO CAOS",
    ];

    const bossTitle = isBoss ? bossTitles[(chapterNumber - 1) % bossTitles.length] : undefined;

    let threatLevel: "Normal" | "Veterano" | "Elite" | "CHEFE LENDÁRIO" = "Normal";
    if (isBoss) {
      threatLevel = "CHEFE LENDÁRIO";
    } else if (stageInChapter === 4) {
      threatLevel = "Elite";
    } else if (stageInChapter >= 2) {
      threatLevel = "Veterano";
    }

    const stageTitle = isBoss
      ? `👑 LUTA ${safeStage} - CONFRONTO DECISIVO: ${bossTitle}`
      : `LUTA ${safeStage} - Desafio ${stageInChapter}/5: ${chapterTitle}`;

    return {
      chapterNumber,
      chapterTitle,
      stageTitle,
      isBoss,
      bossTitle,
      arenaKey,
      threatLevel,
    };
  }

  // Cálculo de recompensas pós-batalha infinito e progressivo
  static calculateBattleRewards(
    stage: number,
    playerLevel: number,
    enemyLevel: number,
    isBoss: boolean,
    parries: number,
    maxCombo: number,
    win: boolean,
  ) {
    if (!win) {
      // Recompensa de consolação por esforço
      const consolationExp = Math.floor(25 + playerLevel * 8 + (parries * 5));
      const consolationCoins = Math.floor(10 + playerLevel * 3);
      return {
        baseExp: consolationExp,
        parryExp: 0,
        comboExp: 0,
        totalExp: consolationExp,
        baseCoins: consolationCoins,
        comboCoins: 0,
        totalCoins: consolationCoins,
      };
    }

    const baseExp = Math.floor(80 + enemyLevel * 22 + (stage * 5) + (isBoss ? 160 : 0));
    const parryExp = Math.max(0, parries) * 15;
    const comboExp = maxCombo > 1 ? Math.floor(maxCombo * 18) : 0;
    const totalExp = baseExp + parryExp + comboExp;

    const baseCoins = Math.floor(40 + enemyLevel * 8 + (stage * 4) + (isBoss ? 120 : 0));
    const comboCoins = maxCombo > 1 ? Math.floor(maxCombo * 8) : 0;
    const totalCoins = baseCoins + comboCoins;

    return {
      baseExp,
      parryExp,
      comboExp,
      totalExp,
      baseCoins,
      comboCoins,
      totalCoins,
    };
  }
}

