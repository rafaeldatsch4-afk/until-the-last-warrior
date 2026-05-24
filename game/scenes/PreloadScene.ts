import Phaser from "phaser";
import { CharacterData } from "../types";
import { INITIAL_CHARACTERS } from "../data";
import { generateAllSprites } from "../sprites/SpriteRegistry";

export default class PreloadScene extends Phaser.Scene {
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare load: Phaser.Loader.LoaderPlugin;
  declare textures: Phaser.Textures.TextureManager;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare make: Phaser.GameObjects.GameObjectCreator;
  declare sound:
    | Phaser.Sound.NoAudioSoundManager
    | Phaser.Sound.HTML5AudioSoundManager
    | Phaser.Sound.WebAudioSoundManager;
  declare cache: Phaser.Cache.CacheManager;
  declare anims: Phaser.Animations.AnimationManager;

  constructor() {
    super("PreloadScene");
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // --- Loading UI ---
    const bg = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x0f172a,
    );

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 1);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add
      .text(width / 2, height / 2 - 60, "Desenhando Guerreiros...", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#e2e8f0",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: loadingText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xf59e0b, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      bg.destroy();
    });

    this.load.image("arena", "https://labs.phaser.io/assets/skies/space3.png");
    this.load.image(
      "arena_namek",
      "https://labs.phaser.io/assets/skies/sky4.png",
    );
    this.load.image(
      "arena_city",
      "https://labs.phaser.io/assets/skies/sunset.png",
    );
    this.load.image(
      "arena_tournament",
      "https://labs.phaser.io/assets/skies/clouds.png",
    );
    this.load.image("arena_ice", "https://labs.phaser.io/assets/skies/sky1.png");
    this.load.image("arena_lava", "https://labs.phaser.io/assets/skies/underwater3.png");
    this.load.image("arena_desert", "https://labs.phaser.io/assets/skies/sky2.png");
    this.load.image("arena_dark", "https://labs.phaser.io/assets/skies/deepblue.png");
  }

  create() {
    this.createAudioAssets();
    this.createFXAssets();
    generateAllSprites(this);

    this.time.delayedCall(100, () => {
      const currentState = window.UTLW?.state;
      const chars = currentState?.characters ?? INITIAL_CHARACTERS;

      const charsToGenerate = [...chars];
      const hasGohan = chars.some((c) => c.key === 'gohan');
      const hasGoku = chars.some((c) => c.key === 'goku');
      if (hasGohan && !hasGoku) {
        const gokuData = INITIAL_CHARACTERS.find((c) => c.key === 'goku');
        if (gokuData) charsToGenerate.push(gokuData);
      }

      charsToGenerate.forEach((c) => this.createAnimsFor(c.key));

      if (!this.textures.exists('dummy')) {
        const g = this.make.graphics({ x: 0, y: 0 });
        g.fillStyle(0x555555);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('dummy', 32, 32);
        g.destroy();
      }

      this.scene.start('MenuScene');
    });
  }

  createAnimsFor(key: string) {
    const createAnim = (
      animKey: string,
      texture: string,
      start: number,
      end: number,
      frameRate: number,
      repeat: number = -1,
    ) => {
      if (!this.textures.exists(texture)) return;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(texture, {
            start: start,
            end: end,
          }),
          frameRate: frameRate,
          repeat: repeat,
        });
      }
    };

        const createAllForTex = (baseKey: string, texKey: string) => {
      createAnim(`${baseKey}_idle`, texKey, 0, 3, 10);
      createAnim(`${baseKey}_walk`, texKey, 4, 7, 12);
      createAnim(`${baseKey}_attack`, texKey, 8, 9, 16, 0);
      createAnim(`${baseKey}_special`, texKey, 8, 9, 12, -1);
      createAnim(`${baseKey}_defend`, texKey, 10, 10, 10, -1);
      createAnim(`${baseKey}_transform`, texKey, 0, 3, 24, -1);
    };

    createAllForTex(key, key);
    createAllForTex(`${key}_ssj`, `${key}_ssj`);

    if (key === "goku" || key === "vegeta" || key === "naruto") {
      createAllForTex(`${key}_ui`, `${key}_ui`);
    }
  }

  createFXAssets() {
    // Energy Ball
    const p = this.make.graphics({ x: 0, y: 0 });
    p.fillStyle(0xffffff, 1);
    p.fillCircle(8, 8, 8);
    p.fillStyle(0xaaeeff, 1);
    p.fillCircle(8, 8, 5);
    p.generateTexture("particle", 16, 16);
    p.destroy();

    // Massive Beam (Father-Son Kamehameha)
    const mb = this.make.graphics({ x: 0, y: 0 });
    // Core
    mb.fillStyle(0xffffff, 1);
    mb.fillRect(0, 10, 128, 44);
    // Outer Aura
    mb.fillStyle(0x00ffff, 0.6);
    mb.fillRect(0, 0, 128, 64);
    mb.generateTexture("massive_beam", 128, 64);
    mb.destroy();

    // Mechanical Spark (For Optimus)
    const sp = this.make.graphics({ x: 0, y: 0 });
    sp.fillStyle(0xffaa00, 1);
    sp.fillRect(0, 0, 4, 4);
    sp.fillStyle(0xffffff, 1);
    sp.fillRect(1, 1, 2, 2);
    sp.generateTexture("mech_spark", 4, 4);
    sp.destroy();

    // Missile
    const m = this.make.graphics({ x: 0, y: 0 });
    m.fillStyle(0x555555, 1);
    m.fillRect(0, 6, 24, 10); // Body
    m.fillStyle(0xff0000, 1);
    m.fillTriangle(24, 6, 24, 16, 32, 11); // Head
    m.fillStyle(0xffaa00, 1);
    m.fillTriangle(0, 6, 0, 16, -8, 11); // Fire
    m.generateTexture("missile", 40, 22);
    m.destroy();

    // Shuriken
    const s = this.make.graphics({ x: 0, y: 0 });
    s.fillStyle(0xcccccc, 1);
    s.fillTriangle(16, 0, 20, 16, 12, 16);
    s.fillTriangle(16, 32, 20, 16, 12, 16);
    s.fillTriangle(0, 16, 16, 12, 16, 20);
    s.fillTriangle(32, 16, 16, 12, 16, 20);
    s.fillStyle(0x222222, 1);
    s.fillCircle(16, 16, 2);
    s.generateTexture("shuriken", 32, 32);
    s.destroy();

    // Batarang
    const b = this.make.graphics({ x: 0, y: 0 });
    b.fillStyle(0x111111, 1);
    b.fillTriangle(16, 16, 32, 8, 24, 24);
    b.fillTriangle(16, 16, 0, 8, 8, 24);
    b.generateTexture("batarang", 32, 32);
    b.destroy();
  }

  createAudioAssets() {
    // Check if sound manager is unlocked/available before creating context-dependent audio
    const soundManager = this.sound as Phaser.Sound.WebAudioSoundManager;
    if (!soundManager.context) return;

    // Helper to synthesize sound
    const generateSynthSound = (
      name: string,
      duration: number,
      type: "square" | "sawtooth" | "sine" | "triangle",
      freqStart: number,
      freqEnd: number,
      vol: number = 0.5,
    ) => {
      try {
        const ctx = soundManager.context;
        const sampleRate = ctx.sampleRate;
        const frameCount = duration * sampleRate;
        const buffer = ctx.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate;
          const progress = i / frameCount;
          const currentFreq = freqStart + (freqEnd - freqStart) * progress;

          let val = 0;
          const phase = t * currentFreq * 2 * Math.PI;

          if (type === "sine") val = Math.sin(phase);
          else if (type === "square") val = Math.sin(phase) > 0 ? 1 : -1;
          else if (type === "sawtooth") val = ((t * currentFreq) % 1) * 2 - 1;
          else if (type === "triangle")
            val = Math.abs(((t * currentFreq) % 1) * 4 - 2) - 1;

          // Envelope
          const envelope = 1 - Math.pow(progress, 2);
          data[i] = val * vol * envelope;
        }
        this.cache.audio.add(name, buffer);
      } catch (e) {
        console.warn("Audio synthesis failed", e);
      }
    };

    // Generate SFX
    generateSynthSound("sfx_select", 0.1, "sine", 800, 1200, 0.3);
    generateSynthSound("sfx_attack", 0.1, "square", 200, 50, 0.5);
    generateSynthSound("sfx_hit", 0.15, "sawtooth", 150, 50, 0.6);
    generateSynthSound("sfx_block", 0.1, "sine", 400, 300, 0.4);
    generateSynthSound("sfx_beam", 1.0, "sawtooth", 400, 100, 0.3);
    generateSynthSound("sfx_transform", 1.5, "square", 100, 300, 0.4);
    generateSynthSound("sfx_transform_mech", 1.5, "sawtooth", 50, 600, 0.6);
    generateSynthSound("sfx_error", 0.2, "sawtooth", 150, 100, 0.4);

    // Generate Simple Looping BGM
    const generateLoop = (name: string, pattern: number[]) => {
      try {
        const ctx = soundManager.context;
        const tempo = 0.2; // seconds per note
        const totalDur = pattern.length * tempo;
        const buffer = ctx.createBuffer(
          1,
          totalDur * ctx.sampleRate,
          ctx.sampleRate,
        );
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
          const t = i / ctx.sampleRate;
          const noteIdx = Math.floor(t / tempo);
          const freq = pattern[noteIdx];
          if (freq > 0) {
            const v = (Math.sin(t * freq * 2 * Math.PI) > 0 ? 1 : -1) * 0.1;
            data[i] = v * (1 - (t % tempo) / tempo); // Decay
          }
        }
        this.cache.audio.add(name, buffer);
      } catch (e) {
        console.warn("BGM generation failed", e);
      }
    };

    generateLoop("bgm_menu", [220, 0, 220, 261, 329, 0, 261, 0]);
    generateLoop(
      "bgm_battle",
      [
        110, 110, 130, 110, 146, 110, 164, 110, 82, 82, 98, 82, 110, 82, 130,
        82,
      ],
    );
  }

  // =================================================================================
  // PIXEL ART ENGINE (32x32 GRID SCALED 2x) - LSW / POWER WARRIORS STYLE
  // GENERATES A 4-FRAME SPRITESHEET
  // =================================================================================
 
}
