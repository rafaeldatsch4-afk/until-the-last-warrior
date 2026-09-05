import Phaser from "phaser";

export class BattleSoundManager {
  private scene: Phaser.Scene;
  private lastShakeSoundTime: number = 0;
  private lastHitSoundTime: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Helper to play a sound with dynamic volume and random pitch variation for an organic arcade feel
   */
  public playWithVariation(
    key: string,
    baseVolume: number = 1.0,
    variationRange: number = 200,
    detuneBase: number = 0,
  ) {
    if (!this.scene.cache.audio.exists(key)) return;

    const sfxVolume = this.scene.registry.get("sfxVolume") ?? 1.0;
    const detune =
      detuneBase + Phaser.Math.Between(-variationRange, variationRange);

    try {
      this.scene.sound.play(key, {
        volume: Math.min(1.5, baseVolume * sfxVolume),
        detune: detune,
      });
    } catch (e) {
      console.warn(`Error playing SFX '${key}':`, e);
    }
  }

  // =========================================================================
  // DYNAMIC ATTACK SOUNDS
  // =========================================================================

  /**
   * Dynamic sound effect when launching any attack (punches, kicks, ki blasts, or specials)
   */
  public playAttackLaunch(
    attackType: "melee" | "ki" | "heavy" | "special" = "melee",
    comboStep: number = 1
  ) {
    // Escalating pitch with combo progression
    const comboPitchBonus = Math.min((comboStep - 1) * 80, 450);

    if (attackType === "ki") {
      this.playKiBlastFire(comboStep);
    } else if (attackType === "special") {
      this.playBeamFire();
    } else if (attackType === "heavy" || comboStep % 3 === 0) {
      this.playWithVariation("sfx_attack_heavy", 1.0, 100, comboPitchBonus);
      this.playWithVariation("sfx_attack", 0.7, 120, comboPitchBonus + 150);
    } else {
      // Light / medium melee swing
      this.playWithVariation("sfx_attack", 0.75 + Math.min(comboStep * 0.05, 0.3), 120, comboPitchBonus);
    }
  }

  public playMeleeWhiff() {
    this.playWithVariation("sfx_attack", 0.7, 100, 200);
  }

  public playSwordSlash(isCritical: boolean = false) {
    this.playWithVariation("sfx_attack_heavy", 1.0, 120, 300);
    this.playWithVariation("sfx_attack", 0.8, 150, 450);
    this.playPunchImpact(isCritical);
  }

  public playKiBlastFire(variation: number = 0) {
    const pitchOffset = ((variation % 4) * 120) - 100;
    this.playWithVariation("sfx_beam_fire", 0.65, 120, 250 + pitchOffset);
    if (this.scene.cache.audio.exists("sfx_ki_fire")) {
      this.playWithVariation("sfx_ki_fire", 0.85, 150, pitchOffset);
    }
  }

  public playBeamCharge() {
    this.playWithVariation("sfx_beam_charge", 0.8, 50);
  }

  public playBeamFire() {
    this.playWithVariation("sfx_beam_fire", 1.25, 80, -100);
    this.playWithVariation("sfx_beam", 0.95, 40, 0);
    this.playShakeScreenAudio("medium", 300);
  }

  // =========================================================================
  // DYNAMIC DAMAGE & IMPACT SOUNDS
  // =========================================================================

  /**
   * Plays dynamic, layered impact sounds matching the exact damage and severity of the hit
   */
  public playDamageImpact(
    damage: number,
    isCritical: boolean = false,
    isBlock: boolean = false,
    isClash: boolean = false,
    isBeam: boolean = false
  ) {
    const now = Date.now();
    // Throttle duplicate audio triggers within 35ms to keep audio clean and punchy
    if (now - this.lastHitSoundTime < 35 && !isCritical) return;
    this.lastHitSoundTime = now;

    if (isBlock) {
      this.playBlock();
      return;
    }

    if (isClash) {
      this.playClash();
      return;
    }

    if (isCritical || damage >= 30) {
      // Devastating / Critical Hit: Heavy low-end crunch + explosion + critical bass shock
      this.playWithVariation("sfx_punch_heavy", 1.35, 60, -150);
      this.playWithVariation("sfx_hit", 0.9, 100, 50);
      this.playWithVariation("sfx_explosion", 0.7, 80, -100);
      this.playShakeScreenAudio("heavy", 500);
    } else if (damage >= 15 || isBeam) {
      // Medium Heavy Hit: Solid punch impact + sub thump
      this.playWithVariation("sfx_punch_heavy", 1.1, 80, -50);
      this.playWithVariation("sfx_hit", 0.85, 120, 100);
      this.playShakeScreenAudio("medium", 300);
    } else if (damage >= 6) {
      // Normal Hit
      this.playWithVariation("sfx_hit", 0.8, 140, 120);
      this.playShakeScreenAudio("light", 150);
    } else {
      // Light Hit / Rapid Combo Tick
      if (this.scene.cache.audio.exists("sfx_hit_light")) {
        this.playWithVariation("sfx_hit_light", 0.75, 180, 200);
      } else {
        this.playWithVariation("sfx_hit", 0.65, 180, 250);
      }
    }
  }

  public playPunchImpact(isCritical: boolean = false) {
    if (isCritical) {
      this.playWithVariation("sfx_punch_heavy", 1.3, 50, -100);
      this.playWithVariation("sfx_hit", 0.85, 100);
      this.playShakeScreenAudio("heavy", 350);
    } else {
      this.playWithVariation("sfx_hit", 0.75, 150, 50);
      this.playShakeScreenAudio("light", 120);
    }
  }

  public playBlock() {
    this.playWithVariation("sfx_block", 0.85, 100);
  }

  public playGuardBreak() {
    this.playWithVariation("sfx_guard_break", 1.45, 60, -50);
    this.playWithVariation("sfx_clash", 1.25, 80, 50);
    this.playWithVariation("sfx_punch_heavy", 1.05, 50, -180);
    this.playWithVariation("sfx_metal_sparks", 1.15, 100, 100);
    this.playShakeScreenAudio("heavy", 500);
  }

  public playMetalSparks() {
    this.playWithVariation("sfx_metal_sparks", 0.95, 120, 80);
  }

  public playDizzyStun() {
    this.playWithVariation("sfx_stun_stars", 0.8, 100, 40);
  }

  public playParry() {
    this.playWithVariation("sfx_parry", 1.4, 60, 50);
    this.playWithVariation("sfx_parry_ping", 1.15, 40, 100);
    this.playWithVariation("sfx_clash", 0.95, 100, 150);
    this.playShakeScreenAudio("medium", 250);
  }

  public playDodge() {
    this.playWithVariation("sfx_dodge", 1.2, 80, 100);
    this.playWithVariation("sfx_attack", 0.7, 120, 300);
  }

  public playClash() {
    this.playWithVariation("sfx_clash", 1.3, 150, -50);
    this.playWithVariation("sfx_block", 1.0, 50, -200);
    this.playWithVariation("sfx_punch_heavy", 0.8, 80, -150);
    this.playShakeScreenAudio("heavy", 400);
  }

  public playExplosion(large: boolean = false) {
    if (large) {
      this.playWithVariation("sfx_explosion", 1.5, 80, -200);
      this.playWithVariation("sfx_punch_heavy", 1.1, 50, -300);
      this.playShakeScreenAudio("heavy", 600);
    } else {
      this.playWithVariation("sfx_explosion", 1.05, 150, -50);
      this.playShakeScreenAudio("medium", 300);
    }
  }

  // =========================================================================
  // SHAKE-SCREEN SYNCHRONIZED AUDIO
  // =========================================================================

  /**
   * Synchronizes sound effects with the camera shake and CSS 'shake-screen' animation.
   * Plays a physical low-frequency impact rumble / bass thud scaled to shake intensity.
   */
  public playShakeScreenAudio(
    intensity: "light" | "medium" | "heavy" | "super" | string = "medium",
    durationMs: number = 200
  ) {
    const now = Date.now();
    // Throttle shake sounds slightly so rapid pulses don't cause audio clipping
    const throttleTime = intensity === "heavy" || intensity === "super" ? 100 : 70;
    if (now - this.lastShakeSoundTime < throttleTime) return;
    this.lastShakeSoundTime = now;

    if (intensity === "super" || intensity === "heavy") {
      if (this.scene.cache.audio.exists("sfx_shake_rumble")) {
        this.playWithVariation("sfx_shake_rumble", 1.2, 60, -150);
      }
      this.playWithVariation("sfx_punch_heavy", 0.9, 80, -250);
    } else if (intensity === "medium") {
      if (this.scene.cache.audio.exists("sfx_shake_rumble")) {
        this.playWithVariation("sfx_shake_rumble", 0.7, 80, 0);
      } else {
        this.playWithVariation("sfx_punch_heavy", 0.6, 100, -100);
      }
    } else {
      // Light shake
      if (this.scene.cache.audio.exists("sfx_shake_rumble")) {
        this.playWithVariation("sfx_shake_rumble", 0.45, 100, 150);
      }
    }
  }

  public playTransform(level: number) {
    if (level === 2) {
      this.playWithVariation("sfx_transform", 1.25, 50);
      this.playWithVariation("sfx_beam_charge", 0.85, 0, -200);
      this.playWithVariation("sfx_explosion", 0.65, 100);
      this.playShakeScreenAudio("heavy", 500);
    } else if (level === 3) {
      this.playWithVariation("sfx_transform", 1.45, 50, 200);
      this.playWithVariation("sfx_beam_charge", 1.05, 50, 100);
      this.playWithVariation("sfx_explosion", 0.85, 50, 100);
      this.playShakeScreenAudio("super", 700);
    } else {
      this.playWithVariation("sfx_transform", 1.05, 100);
      this.playShakeScreenAudio("medium", 300);
    }
  }

  public playStep() {
    if (this.scene.cache.audio.exists("sfx_step")) {
      this.playWithVariation("sfx_step", 0.6, 300);
    }
  }
}

