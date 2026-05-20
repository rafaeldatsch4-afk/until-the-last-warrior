import Phaser from 'phaser';

export interface AttackParams {
  scene: Phaser.Scene;
  attacker: Phaser.GameObjects.Sprite;
  defender: Phaser.GameObjects.Sprite;
  isPlayer: boolean;
  attackType: 'melee' | 'ki';
  comboCount: number;
  isComboFinisher: boolean;
  transformLevel: number;
}

export interface AttackResult {
  damage: number;
  hitstun: number; // ms
  knockback: number;
  logMessage: string;
  sfxKey?: string;
}
