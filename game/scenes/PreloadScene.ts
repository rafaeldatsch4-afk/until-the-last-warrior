import { transitionTo } from "../utils/sceneTransition";
import Phaser from "phaser";
import { CharacterData } from "../types";
import { INITIAL_CHARACTERS } from "../data";
import {
  generateAllSprites,
  SPRITE_GENERATORS,
} from "../sprites/SpriteRegistry";
import { generateCustomSprite } from "../sprites/CustomSprite";
import { generateItachiSprite } from "../sprites/ItachiSprite";
import { ArenaTextureBuilder } from "../battle/ArenaTextureBuilder";
import { LogoTextureBuilder } from "../utils/LogoTextureBuilder";
import { HighResTextureManager } from "../utils/HighResTextureManager";

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

  progressBar!: Phaser.GameObjects.Graphics;
  progressBox!: Phaser.GameObjects.Graphics;
  loadingText!: Phaser.GameObjects.Text;
  preloadBg!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("PreloadScene");
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // --- Loading UI ---
    this.preloadBg = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x0f172a,
    );

    this.progressBar = this.add.graphics();
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x1e293b, 1);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const textResolution = HighResTextureManager.getTextResolution(2);
    this.loadingText = this.add
      .text(width / 2, height / 2 - 60, "Desenhando Guerreiros...", {
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        fontSize: "20px",
        color: "#e2e8f0",
        fontStyle: "bold",
        resolution: textResolution,
      })
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: this.loadingText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.load.on("progress", (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0xf59e0b, 1);
      // Carregamento de imagens ocupa os primeiros 10% da barra
      const ratio = value * 0.1;
      this.progressBar.fillRect(
        width / 2 - 150,
        height / 2 - 15,
        300 * ratio,
        30,
      );
    });

    this.load.on("complete", () => {
      // Deixamos a limpeza da UI para ser feita no final do processo em finishPreload()
    });

    this.load.on("loaderror", (fileObj: Phaser.Loader.File) => {
      console.warn("Preload non-fatal asset notice, fallback enabled:", fileObj?.key);
    });

    // Proactively load high-resolution textures based on devicePixelRatio (if available)
    this.loadHighResTexturesIfAvailable();

    // Build ultra-crisp procedural logo texture without relying on network loading
    LogoTextureBuilder.ensureLogoTexture(this);

    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture("hit_spark", 16, 16);
    graphics.destroy();

    const graphicsStreak = this.make.graphics({ x: 0, y: 0 });
    graphicsStreak.fillStyle(0xffffff, 1);
    graphicsStreak.fillRect(0, 7, 24, 2);
    graphicsStreak.generateTexture("hit_spark_streak", 24, 16);
    graphicsStreak.destroy();

    // Metallic shard texture for Guard Break visual shatter
    const graphicsShard = this.make.graphics({ x: 0, y: 0 });
    graphicsShard.fillStyle(0xffffff, 1);
    graphicsShard.beginPath();
    graphicsShard.moveTo(0, 8);
    graphicsShard.lineTo(12, 0);
    graphicsShard.lineTo(24, 6);
    graphicsShard.lineTo(16, 16);
    graphicsShard.lineTo(4, 14);
    graphicsShard.closePath();
    graphicsShard.fillPath();
    graphicsShard.generateTexture("metal_shard", 24, 16);
    graphicsShard.destroy();

    // Dizzy 4-pointed star texture for Stun visual effect
    const graphicsStar = this.make.graphics({ x: 0, y: 0 });
    graphicsStar.fillStyle(0xffffff, 1);
    graphicsStar.beginPath();
    graphicsStar.moveTo(8, 0);
    graphicsStar.lineTo(10, 6);
    graphicsStar.lineTo(16, 8);
    graphicsStar.lineTo(10, 10);
    graphicsStar.lineTo(8, 16);
    graphicsStar.lineTo(6, 10);
    graphicsStar.lineTo(0, 8);
    graphicsStar.lineTo(6, 6);
    graphicsStar.closePath();
    graphicsStar.fillPath();
    graphicsStar.generateTexture("dizzy_star", 16, 16);
    graphicsStar.destroy();

    // Generate all 8 high-definition detailed battle arena backgrounds
    ArenaTextureBuilder.buildAllArenaTextures(this);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.createAudioAssets();
    this.createFXAssets();

    LogoTextureBuilder.ensureLogoTexture(this);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Se as texturas do goku já existirem, finaliza o preload imediatamente.
    if (this.textures.exists("goku")) {
      this.finishPreload();
      return;
    }

    let currentGeneratorIndex = 0;

    const generateNext = () => {
      if (currentGeneratorIndex >= SPRITE_GENERATORS.length) {
        this.finishPreload();
        return;
      }

      const item = SPRITE_GENERATORS[currentGeneratorIndex];
      if (this.loadingText && this.loadingText.active) {
        this.loadingText.setText(
          `Desenho: ${item.name} (${currentGeneratorIndex + 1}/${SPRITE_GENERATORS.length})`,
        );
      }

      // Progresso: 10% fixo para imagens + 90% proporcional dos guerreiros renderizados
      const ratio =
        0.1 + (currentGeneratorIndex / SPRITE_GENERATORS.length) * 0.9;
      if (this.progressBar && this.progressBar.active) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xf59e0b, 1);
        this.progressBar.fillRect(
          width / 2 - 150,
          height / 2 - 15,
          300 * ratio,
          30,
        );
      }

      // Yield de 20ms para permitir que o navegador atualize a UI de progresso
      this.time.delayedCall(20, () => {
        try {
          item.fn(this);
        } catch (e) {
          console.error(`Erro ao gerar ${item.name}:`, e);
        }
        currentGeneratorIndex++;
        generateNext();
      });
    };

    generateNext();
  }

  finishPreload() {
    const currentState = window.UTLW?.state;
    const chars = currentState?.characters ?? INITIAL_CHARACTERS;

    const customChar = chars.find((c: any) => c.key === "custom_999");
    if (customChar) {
      generateCustomSprite(this, customChar as any);
    }
    generateItachiSprite(this);

    const charsToGenerate = [...chars];
    const hasGohan = chars.some((c) => c.key === "gohan");
    const hasGoku = chars.some((c) => c.key === "goku");
    if (hasGohan && !hasGoku) {
      const gokuData = INITIAL_CHARACTERS.find((c) => c.key === "goku");
      if (gokuData) charsToGenerate.push(gokuData);
    }

    charsToGenerate.forEach((c) => {
      if (c && typeof c.key === "string" && c.key !== "undefined") {
        this.createAnimsFor(c.key);
      }
    });

    if (!this.textures.exists("dummy")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false } as any);
      g.fillStyle(0x555555);
      g.fillRect(0, 0, 32, 32);
      g.generateTexture("dummy", 32, 32);
      g.destroy();
    }

    // Wait 150ms to allow WebGL rendering pipeline to completely compile textures
    this.time.delayedCall(150, () => {
      if (this.progressBar) this.progressBar.destroy();
      if (this.progressBox) this.progressBox.destroy();
      if (this.loadingText) this.loadingText.destroy();
      if (this.preloadBg) this.preloadBg.destroy();

      transitionTo(this, "MenuScene");
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
      if (!this.textures.exists(texture)) {
        return;
      }
      if (this.anims.exists(animKey)) {
        this.anims.remove(animKey);
      }

      const tex = this.textures.get(texture);
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = start; i <= end; i++) {
        if (!tex.has(i.toString())) {
          // Fallback to frame "0" or bypass to prevent crash, though it will still cause flickering if this fails
          frames.push({ key: texture, frame: "0" });
        } else {
          frames.push({ key: texture, frame: i.toString() });
        }
      }
      this.anims.create({
        key: animKey,
        frames: frames,
        frameRate: frameRate,
        repeat: repeat,
      });
    };

    const createAllForTex = (baseKey: string, texKey: string) => {
      createAnim(`${baseKey}_idle`, texKey, 0, 3, 10);
      createAnim(`${baseKey}_walk`, texKey, 4, 7, 12);
      createAnim(`${baseKey}_attack`, texKey, 8, 9, 16, 0);
      createAnim(`${baseKey}_punch`, texKey, 8, 8, 12, 0);
      createAnim(`${baseKey}_kick`, texKey, 9, 9, 12, 0);
      createAnim(`${baseKey}_special`, texKey, 8, 9, 12, -1);
      createAnim(`${baseKey}_defend`, texKey, 10, 10, 10, -1);
      createAnim(`${baseKey}_transform`, texKey, 0, 3, 24, -1);
      createAnim(`${baseKey}_charge`, texKey, 11, 11, 10, -1);
    };

    createAllForTex(key, key);
    createAllForTex(`${key}_ssj`, `${key}_ssj`);

    if (
      key === "goku" ||
      key === "vegeta" ||
      key === "naruto" ||
      key === "custom_999"
    ) {
      createAllForTex(`${key}_ui`, `${key}_ui`);
    }
  }

  /**
   * Loads high-resolution textures based on devicePixelRatio (if available),
   * ensuring the game doesn't look pixelated on Retina and high-DPI screens.
   */
  private loadHighResTexturesIfAvailable() {
    const isRetina = HighResTextureManager.isRetina();
    const dpr = HighResTextureManager.getResolutionMultiplier();

    // Candidate textures with possible high-resolution variants
    const highResAssets = [
      { key: "icon_app", defaultUrl: "/icon-192-any.png", highResUrl: "/icon-512-any.png" },
      { key: "icon_maskable", defaultUrl: "/icon-192-maskable.png", highResUrl: "/icon-512-maskable.png" },
    ];

    for (const asset of highResAssets) {
      if (!this.textures.exists(asset.key)) {
        HighResTextureManager.loadHighResImage(this.load, asset.key, asset.defaultUrl, {
          highResUrl: isRetina ? asset.highResUrl : asset.defaultUrl,
          resolution: isRetina ? dpr : 1,
          filterMode: Phaser.Textures.FilterMode.LINEAR,
        });
      }
    }
  }

  createFXAssets() {
    if (this.textures.exists("particle")) {
      console.log("FX Assets already constructed. Skipping.");
      return;
    }

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
    if (this.cache.audio.exists("sfx_select")) {
      console.log("Audio Assets already synthesized. Skipping.");
      return;
    }
    // Check if sound manager is unlocked/available before creating context-dependent audio
    const soundManager = this.sound as Phaser.Sound.WebAudioSoundManager;
    if (!soundManager.context) return;

    // Advanced Helper to synthesize rich sound effects with multi-wave mixing, frequency sweeps, and noise
    const generateSynthSound = (
      name: string,
      duration: number,
      type: "square" | "sawtooth" | "sine" | "triangle" | "noise" | "hybrid",
      freqStart: number,
      freqEnd: number,
      vol: number = 0.5,
      noiseAmount: number = 0,
      subBassFreq: number = 0
    ) => {
      try {
        const ctx = soundManager.context;
        const sampleRate = ctx.sampleRate;
        const frameCount = Math.floor(duration * sampleRate);
        const buffer = ctx.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate;
          const progress = i / frameCount;
          // Exponential pitch drop for natural impact punch
          const currentFreq = freqStart * Math.pow(freqEnd / Math.max(1, freqStart), progress);

          let val = 0;
          const phase = t * currentFreq * 2 * Math.PI;

          if (type === "sine") val = Math.sin(phase);
          else if (type === "square") val = Math.sin(phase) > 0 ? 1 : -1;
          else if (type === "sawtooth") val = ((t * currentFreq) % 1) * 2 - 1;
          else if (type === "triangle")
            val = Math.abs(((t * currentFreq) % 1) * 4 - 2) - 1;
          else if (type === "noise")
            val = (Math.random() * 2 - 1);
          else if (type === "hybrid")
            val = 0.5 * Math.sin(phase) + 0.5 * (((t * currentFreq) % 1) * 2 - 1);

          // Add dynamic noise texture (punch crunch / whoosh friction)
          if (noiseAmount > 0) {
            const noise = (Math.random() * 2 - 1) * noiseAmount;
            val = val * (1 - noiseAmount) + noise;
          }

          // Add sub-bass resonant punch
          if (subBassFreq > 0) {
            const subPhase = t * subBassFreq * 2 * Math.PI;
            val += Math.sin(subPhase) * 0.45;
          }

          // Dynamic attack and decay envelope
          let envelope = 1 - Math.pow(progress, 1.8);
          // 5ms rapid attack to avoid click
          const attackSamples = Math.min(220, frameCount * 0.05);
          if (i < attackSamples) {
            envelope *= (i / attackSamples);
          }

          data[i] = Math.max(-1, Math.min(1, val * vol * envelope));
        }
        this.cache.audio.add(name, buffer);
      } catch (e) {
        console.warn(`Audio synthesis failed for ${name}`, e);
      }
    };

    // Generate SFX Palette
    generateSynthSound("sfx_select", 0.1, "sine", 800, 1200, 0.35);
    generateSynthSound("sfx_attack", 0.12, "hybrid", 280, 60, 0.55, 0.3);
    generateSynthSound("sfx_attack_heavy", 0.18, "sawtooth", 180, 40, 0.7, 0.4, 60);
    generateSynthSound("sfx_hit_light", 0.08, "triangle", 320, 100, 0.55, 0.35);
    generateSynthSound("sfx_hit", 0.16, "sawtooth", 220, 45, 0.7, 0.45, 75);
    generateSynthSound("sfx_punch_heavy", 0.28, "square", 120, 25, 0.9, 0.4, 50);
    generateSynthSound("sfx_block", 0.12, "sine", 500, 320, 0.45, 0.15);
    generateSynthSound("sfx_clash", 0.24, "sawtooth", 900, 180, 0.8, 0.4, 80);
    generateSynthSound("sfx_parry", 0.3, "sawtooth", 1800, 400, 0.85, 0.2);
    generateSynthSound("sfx_parry_ping", 0.38, "sine", 2400, 700, 0.8);
    generateSynthSound("sfx_dodge", 0.22, "sine", 1600, 200, 0.75, 0.25);
    generateSynthSound("sfx_ki_fire", 0.15, "triangle", 1200, 250, 0.65, 0.2);
    generateSynthSound("sfx_beam", 1.0, "sawtooth", 450, 120, 0.35, 0.25, 60);
    generateSynthSound("sfx_beam_charge", 1.2, "sine", 120, 700, 0.35);
    generateSynthSound("sfx_beam_fire", 0.65, "square", 850, 90, 0.6, 0.35, 65);
    generateSynthSound("sfx_explosion", 0.85, "sawtooth", 240, 20, 0.75, 0.6, 45);
    generateSynthSound("sfx_shake_rumble", 0.35, "sine", 85, 25, 0.85, 0.2, 40);
    generateSynthSound("sfx_transform", 1.5, "square", 100, 320, 0.45, 0.3);
    generateSynthSound("sfx_transform_mech", 1.5, "sawtooth", 60, 650, 0.65, 0.4);
    generateSynthSound("sfx_error", 0.2, "sawtooth", 160, 90, 0.4);
    generateSynthSound("sfx_step", 0.08, "triangle", 140, 50, 0.45, 0.5);
    generateSynthSound("sfx_guard_break", 0.42, "sawtooth", 1950, 85, 0.95, 0.45, 80);
    generateSynthSound("sfx_metal_sparks", 0.22, "hybrid", 2400, 320, 0.85, 0.35);
    generateSynthSound("sfx_stun_stars", 0.35, "sine", 1350, 800, 0.7, 0.1);

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
