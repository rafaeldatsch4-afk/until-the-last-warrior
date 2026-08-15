import Phaser from "phaser";
import {
  AttackParams,
  AttackResult,
  FighterStats,
  FighterConfig,
  CharacterPartOptions,
  SpriteCustomState,
} from "./FighterTypes";
import type BattleScene from "../../scenes/BattleScene";

export abstract class Fighter {
  abstract readonly key: string;
  abstract readonly specialName: string;
  abstract readonly superName: string;
  abstract readonly specialColor: number;

  /**
   * Estatísticas base padrão do lutador
   */
  public getBaseStats(): FighterStats {
    return {
      hp: 100,
      maxHp: 100,
      strength: 10,
      speed: 10,
      ki: 0,
      maxKi: 100,
      defense: 5,
    };
  }

  /**
   * Configura propriedades dinâmicas do sprite usando o Data Manager nativo do Phaser
   */
  public initializeSpriteData(
    sprite: Phaser.GameObjects.Sprite,
    initialState?: SpriteCustomState,
  ): void {
    sprite.setData("fighterKey", this.key);
    sprite.setData("isAttacking", initialState?.isAttacking ?? false);
    sprite.setData("isDefending", initialState?.isDefending ?? false);
    sprite.setData("isCharging", initialState?.isCharging ?? false);
    sprite.setData("isJumping", initialState?.isJumping ?? false);
    sprite.setData("isHitStunned", initialState?.isHitStunned ?? false);
    sprite.setData("transformLevel", initialState?.transformLevel ?? 0);

    if (initialState) {
      Object.entries(initialState).forEach(([k, v]) => {
        sprite.setData(k, v);
      });
    }
  }

  /**
   * Acessa de maneira fortemente tipada um valor do Data Manager do Phaser
   */
  public static getSpriteState<K extends keyof SpriteCustomState>(
    sprite: Phaser.GameObjects.Sprite,
    key: K,
  ): SpriteCustomState[K] {
    return sprite.getData(key) as SpriteCustomState[K];
  }

  /**
   * Define de maneira fortemente tipada um valor no Data Manager do Phaser
   */
  public static setSpriteState<K extends keyof SpriteCustomState>(
    sprite: Phaser.GameObjects.Sprite,
    key: K,
    value: SpriteCustomState[K],
  ): void {
    sprite.setData(key, value);
  }

  abstract performAttack(params: AttackParams): AttackResult | void;
  abstract performSpecial(params: AttackParams): AttackResult | void;
  abstract performSuper(params: AttackParams): AttackResult | void;
  abstract performTransform(
    scene: BattleScene | Phaser.Scene,
    isPlayer: boolean,
    level: number,
  ): void;
}

export type {
  FighterStats,
  FighterConfig,
  CharacterPartOptions,
  SpriteCustomState,
  AttackParams,
  AttackResult,
};
