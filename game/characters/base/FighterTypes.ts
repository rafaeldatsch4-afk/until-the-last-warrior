import Phaser from "phaser";
import type BattleScene from "../../scenes/BattleScene";

export interface FighterStats {
  hp: number;
  maxHp: number;
  strength: number;
  speed: number;
  ki: number;
  maxKi: number;
  defense: number;
}

export interface CharacterPartOptions {
  head?: string;
  torso?: string;
  legs?: string;
  feet?: string;
  accessory?: string;
}

export interface FighterCustomData {
  gi1: number;
  gi2: number;
  skin: number;
  hair: number;
  sp1_id?: string;
  sp2_id?: string;
  parts?: CharacterPartOptions;
  part_head?: string;
  part_torso?: string;
  part_legs?: string;
  part_feet?: string;
  part_accessory?: string;
  color_torso_1?: number;
  color_torso_2?: number;
  color_legs_1?: number;
  color_legs_2?: number;
  color_feet_1?: number;
  color_feet_2?: number;
  color_head_1?: number;
  color_head_2?: number;
  color_acc_1?: number;
}

export interface FighterConfig {
  id: number;
  key: string;
  name: string;
  description?: string;
  price?: number;
  unlocked?: boolean;
  maxHp: number;
  strength?: number;
  speed?: number;
  transformAvailable: boolean;
  sprite: string;
  frameWidth: number;
  frameHeight: number;
  specialName: string;
  superName: string;
  specialColor: number;
  baseKey?: string;
  form?: number;
  stats?: Partial<FighterStats>;
  customData?: FighterCustomData;
}

export interface AttackParams {
  scene: BattleScene | Phaser.Scene;
  attacker: Phaser.GameObjects.Sprite;
  defender: Phaser.GameObjects.Sprite;
  isPlayer: boolean;
  attackType: "melee" | "ki";
  comboCount: number;
  isComboFinisher: boolean;
  transformLevel: number;
}

export interface AttackResult {
  damage?: number;
  hitstun?: number; // ms
  knockback?: number;
  logMessage?: string;
  sfxKey?: string;
}

export interface SpriteCustomState {
  isAttacking?: boolean;
  isDefending?: boolean;
  isCharging?: boolean;
  isJumping?: boolean;
  isHitStunned?: boolean;
  isGuardBroken?: boolean;
  hollowPurpleTriggered?: boolean;
  transformLevel?: number;
  fighterKey?: string;
}
