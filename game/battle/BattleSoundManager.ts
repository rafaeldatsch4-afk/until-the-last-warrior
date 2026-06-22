import Phaser from "phaser";

export class BattleSoundManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Helper to play a sound with a slight random pitch variation for natural feel
  private playWithVariation(
    key: string,
    baseVolume: number = 1.0,
    variationRange: number = 200,
    detuneBase: number = 0,
  ) {
    if (!this.scene.cache.audio.exists(key)) return;

    const detune =
      detuneBase + Phaser.Math.Between(-variationRange, variationRange);
    this.scene.sound.play(key, {
      volume: baseVolume,
      detune: detune,
    });
  }

  public playMeleeWhiff() {
    this.playWithVariation("sfx_attack", 0.6, 100, 200);
  }

  public playPunchImpact(isCritical: boolean = false) {
    if (isCritical) {
      this.playWithVariation("sfx_punch_heavy", 1.2, 50, -100);
      this.playWithVariation("sfx_hit", 0.8, 100);
    } else {
      this.playWithVariation("sfx_hit", 0.7, 150);
    }
  }

  public playBlock() {
    this.playWithVariation("sfx_block", 0.8, 100);
  }

  public playClash() {
    this.playWithVariation("sfx_clash", 1.2, 200, -50);
    this.playWithVariation("sfx_block", 1.0, 50, -200);
    this.scene.cameras.main.shake(100, 0.005);
  }

  public playKiBlastFire() {
    this.playWithVariation("sfx_beam_fire", 0.6, 200, 300);
  }

  public playBeamCharge() {
    this.playWithVariation("sfx_beam_charge", 0.7, 50);
  }

  public playBeamFire() {
    this.playWithVariation("sfx_beam_fire", 1.2, 100, -100);
    this.playWithVariation("sfx_beam", 0.9, 0);
  }

  public playExplosion(large: boolean = false) {
    if (large) {
      this.playWithVariation("sfx_explosion", 1.5, 100, -200);
      this.playWithVariation("sfx_punch_heavy", 1.0, 50, -300);
    } else {
      this.playWithVariation("sfx_explosion", 1.0, 200);
    }
  }

  public playTransform(level: number) {
    if (level === 2) {
      // Super saiyan block sound overlay
      this.playWithVariation("sfx_transform", 1.2, 50);
      this.playWithVariation("sfx_beam_charge", 0.8, 0, -200);
      this.playWithVariation("sfx_explosion", 0.6, 100);
    } else if (level === 3) {
      this.playWithVariation("sfx_transform", 1.4, 50, 200);
      this.playWithVariation("sfx_beam_charge", 1.0, 50, 100);
      this.playWithVariation("sfx_explosion", 0.8, 50, 100);
    } else {
      this.playWithVariation("sfx_transform", 1.0, 100);
    }
  }

  public playStep() {
    if (this.scene.cache.audio.exists("sfx_step")) {
      this.playWithVariation("sfx_step", 0.6, 300);
    }
  }
}
