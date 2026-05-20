import Phaser from 'phaser';
import { AttackParams, AttackResult } from './FighterTypes';

export abstract class Fighter {
  abstract readonly key: string;
  abstract readonly specialName: string;
  abstract readonly superName: string;
  abstract readonly specialColor: number;

  abstract performAttack(params: AttackParams): AttackResult;
  abstract performSpecial(params: AttackParams): AttackResult;
  abstract performSuper(params: AttackParams): AttackResult;
  abstract performTransform(scene: Phaser.Scene, isPlayer: boolean, level: number): void;
}
