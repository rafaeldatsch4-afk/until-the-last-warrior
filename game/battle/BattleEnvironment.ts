import Phaser from "phaser";
import BattleScene from "../scenes/BattleScene";

export class BattleEnvironment {
  private scene: BattleScene;
  private bgImage: Phaser.GameObjects.Image;
  private weatherParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private timeEvent?: Phaser.Time.TimerEvent;
  private currentTint: {r: number, g: number, b: number} = {r: 255, g: 255, b: 255};
  private targetTint: {r: number, g: number, b: number} = {r: 255, g: 255, b: 255};

  constructor(scene: BattleScene, bgImage: Phaser.GameObjects.Image, arenaId: string) {
    this.scene = scene;
    this.bgImage = bgImage;
    
    this.initWeather(arenaId);
    this.initTimeCycle();
  }

  private initWeather(arenaId: string) {
    // Add particle effects based on arena
    let color = 0xffffff;
    let speedY = { min: 100, max: 200 };
    let speedX = { min: -50, max: 50 };
    let quantity = 0;
    let angle = { min: 0, max: 360 };
    let scale = { start: 0.5, end: 0 };
    let alpha = { start: 0.8, end: 0 };
    let texture = 'particle_star'; // Default if none exists, or create a simple graphics texture

    // Dynamically create a small circle texture if not exists
    if (!this.scene.textures.exists('env_dust')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture('env_dust', 8, 8);
      g.destroy();
    }

    if (!this.scene.textures.exists('env_rock')) {
        const g = this.scene.add.graphics();
        g.fillStyle(0x7f8c8d, 1);
        g.fillRect(0, 0, 10, 10);
        g.generateTexture('env_rock', 10, 10);
        g.destroy();
    }

    switch (arenaId) {
      case "arena_ice":
        color = 0xaaddff; // Snow
        speedY = { min: 50, max: 150 };
        speedX = { min: -100, max: 100 };
        quantity = 2;
        scale = { start: 0.3, end: 0.1 };
        texture = 'env_dust';
        break;
      case "arena_lava":
        color = 0xff5500; // Embers
        speedY = { min: -150, max: -50 }; // Upwards
        speedX = { min: -50, max: 50 };
        quantity = 3;
        scale = { start: 0.4, end: 0 };
        texture = 'env_dust';
        break;
      case "arena_desert":
        color = 0xe6c280; // Sandstorm
        speedY = { min: -20, max: 20 };
        speedX = { min: 300, max: 500 }; // Fast horizontal
        quantity = 5;
        scale = { start: 0.2, end: 0 };
        texture = 'env_dust';
        break;
      case "arena_namek":
      case "arena":
        // Light dust/leaves
        color = 0xa3e4d7;
        speedY = { min: 20, max: 50 };
        speedX = { min: 50, max: 100 };
        quantity = 1;
        scale = { start: 0.2, end: 0 };
        texture = 'env_dust';
        break;
      case "arena_dark":
        color = 0x8e44ad;
        speedY = { min: -50, max: 50 };
        speedX = { min: -50, max: 50 };
        quantity = 1;
        scale = { start: 0.3, end: 0 };
        texture = 'env_dust';
        break;
      case "arena_city":
        // Maybe some rain or smoke
        color = 0x555555;
        speedY = { min: 400, max: 600 }; // Rain moving fast down
        speedX = { min: 0, max: 20 };
        quantity = 4;
        scale = { start: 0.1, end: 0.3 };
        alpha = { start: 0.5, end: 0.1 };
        texture = 'env_dust';
        break;
    }

    if (quantity > 0) {
      this.weatherParticles = this.scene.add.particles(0, 0, texture, {
        x: { min: 0, max: 5000 },
        y: arenaId === 'arena_lava' ? { min: 500, max: 600 } : { min: -100, max: -50 },
        lifespan: arenaId === 'arena_city' ? 1000 : { min: 3000, max: 6000 },
        speedY: speedY,
        speedX: speedX,
        scale: scale,
        alpha: alpha,
        tint: color,
        quantity: quantity,
        blendMode: 'ADD'
      });
      this.weatherParticles.setDepth(-9); // Just in front of the background
    }
  }

  private initTimeCycle() {
    // Start with default tint
    this.currentTint = {r: 255, g: 255, b: 255};
    this.targetTint = {r: 255, g: 255, b: 255};

    // Change time of day every 20-30 seconds
    this.timeEvent = this.scene.time.addEvent({
      delay: 20000 + Math.random() * 10000,
      loop: true,
      callback: () => {
        // Pick a random time-of-day tint
        const tints = [
          {r: 255, g: 255, b: 255}, // Noon/Normal
          {r: 255, g: 204, b: 170}, // Sunset / warm
          {r: 119, g: 136, b: 170}, // Night / cool
          {r: 153, g: 119, b: 136}, // Dusk
          {r: 221, g: 170, b: 170}  // Dawn
        ];
        this.targetTint = Phaser.Utils.Array.GetRandom(tints);
      }
    });

    // Also periodic falling rocks or shooting stars
    this.scene.time.addEvent({
      delay: 15000,
      loop: true,
      callback: () => {
        if (Math.random() > 0.5) return; // 50% chance every 15s
        this.spawnFallingRock();
      }
    });
  }

  private spawnFallingRock() {
    // Spawn a rock that falls across the background
    const x = this.scene.cameras.main.scrollX + Math.random() * 960;
    const y = -100;
    
    if (this.scene.textures.exists('env_rock')) {
        const rock = this.scene.add.sprite(x, y, 'env_rock');
        rock.setTint(0x555555);
        rock.setDepth(-8);
        rock.setScale(Math.random() * 2 + 1);
        
        this.scene.tweens.add({
            targets: rock,
            y: 600,
            x: x + (Math.random() * 200 - 100),
            rotation: Math.random() * Math.PI * 4,
            duration: 1500 + Math.random() * 1000,
            ease: 'Linear',
            onComplete: () => {
                // Rock hit the ground effect
                this.triggerGroundShake(2);
                rock.destroy();
            }
        });
    }
  }

  public triggerGroundShake(intensity: number = 5) {
    if (this.scene.cameras.main) {
      this.scene.cameras.main.shake(200, intensity * 0.001);
    }
  }

  // Called in battle scene's update method
  public update(time: number, delta: number) {
    // Smoothly interpolate background tint
    const r1 = this.currentTint.r;
    const g1 = this.currentTint.g;
    const b1 = this.currentTint.b;

    const r2 = this.targetTint.r;
    const g2 = this.targetTint.g;
    const b2 = this.targetTint.b;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const speed = delta * 0.0005;

    this.currentTint.r = lerp(r1, r2, speed);
    this.currentTint.g = lerp(g1, g2, speed);
    this.currentTint.b = lerp(b1, b2, speed);

    const outR = Math.round(this.currentTint.r);
    const outG = Math.round(this.currentTint.g);
    const outB = Math.round(this.currentTint.b);
    const numericTint = (outR << 16) | (outG << 8) | outB;

    this.bgImage.setTint(numericTint);
  }

  public destroy() {
    if (this.timeEvent) {
      this.timeEvent.destroy();
    }
    if (this.weatherParticles) {
      this.weatherParticles.destroy();
    }
  }
}
