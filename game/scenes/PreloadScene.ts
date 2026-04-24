import Phaser from "phaser";
import { CharacterData } from "../types";
import { INITIAL_CHARACTERS } from "../data";

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
      .text(width / 2, height / 2 - 60, "Drawing Warriors...", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#e2e8f0",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);

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
  }

  create() {
    this.createAudioAssets();
    this.createFXAssets();

    // Load Characters
    const currentState = window.UTLW?.state;
    const chars =
      currentState && currentState.characters
        ? currentState.characters
        : INITIAL_CHARACTERS;

    // Ensure Goku is generated if Gohan is present (for Father-Son Kamehameha)
    const hasGohan = chars.some((c) => c.key === "gohan");
    const hasGoku = chars.some((c) => c.key === "goku");

    const charsToGenerate = [...chars];
    if (hasGohan && !hasGoku) {
      const gokuData = INITIAL_CHARACTERS.find((c) => c.key === "goku");
      if (gokuData) charsToGenerate.push(gokuData);
    }

    charsToGenerate.forEach((c) => {
      // Base Form
      if (this.textures.exists(c.key)) {
        this.textures.remove(c.key);
        // Also remove anims to prevent stale references
        if (this.anims.exists(`${c.key}_idle`))
          this.anims.remove(`${c.key}_idle`);
      }
      this.generateLSWSprite(c.key, 0);

      // Transformation
      if (c.transformAvailable) {
        const keySSJ = `${c.key}_ssj`;
        if (this.textures.exists(keySSJ)) {
          this.textures.remove(keySSJ);
          if (this.anims.exists(`${keySSJ}_idle`))
            this.anims.remove(`${keySSJ}_idle`);
        }
        this.generateLSWSprite(c.key, 1);

        // Add UI/UE/Final transformation for Goku, Vegeta, and Naruto
        if (c.key === "goku" || c.key === "vegeta" || c.key === "naruto") {
          const keyUI = `${c.key}_ui`;
          if (this.textures.exists(keyUI)) {
            this.textures.remove(keyUI);
            if (this.anims.exists(`${keyUI}_idle`))
              this.anims.remove(`${keyUI}_idle`);
          }
          this.generateLSWSprite(c.key, 2);
        }
      }

      this.createAnimsFor(c.key);
    });

    // DUMMY Fallback for potential missing assets
    if (!this.textures.exists("dummy")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x555555);
      g.fillRect(0, 0, 32, 32);
      g.generateTexture("dummy", 32, 32);
      g.destroy();
    }

    this.scene.start("MenuScene");
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
      createAnim(`${baseKey}_attack`, texKey, 4, 5, 16, 0);
      createAnim(`${baseKey}_special`, texKey, 4, 5, 12, -1); // Looping charge/fire
      createAnim(`${baseKey}_defend`, texKey, 6, 6, 10, -1); // Defensive pose
      createAnim(`${baseKey}_transform`, texKey, 0, 3, 24, -1); // Fast idle
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
  generateLSWSprite(key: string, form: number) {
    const isTransformed = form > 0;
    const isUI = form === 2;
    const SCALE = 2;
    // Increased frame width to prevent extended limbs/weapons from bleeding into adjacent frames
    const FRAME_WIDTH = 96;
    const FRAME_HEIGHT = 64; // Taller frame to support big hair
    const DRAW_OFFSET_Y = 32; // Shift body down so feet are at bottom of 64px frame
    const FRAMES = 8;

    // Calculate total dimensions
    const sheetWidth = FRAME_WIDTH * SCALE * FRAMES;
    const sheetHeight = FRAME_HEIGHT * SCALE;

    const canvas = this.make.graphics({ x: 0, y: 0 });

    // Shift sprites horizontally to center them in the new wider frame
    // Standard frame is 96px wide. Local center is 16. Shift by 32 gets to 48 (center).
    const shiftX = 32;

    // Loop to draw 8 frames side by side
    for (let f = 0; f < FRAMES; f++) {
      const offsetX = f * FRAME_WIDTH;
      const isAttack = f === 4 || f === 5;
      const isDefend = f === 6;
      const isCharge = f === 7;

      // ANIMATION LOGIC: Breathing / Bobbing
      // Note: y coordinates below 22 are bobbed. DRAW_OFFSET_Y is added to final position.
      const breatheOffset =
        !isAttack && !isDefend && !isCharge && (f === 1 || f === 3) ? 1 : 0;

      // Pose offsets
      const poseOffsetX = f === 4 ? 2 : f === 5 ? 4 : f === 6 ? -2 : 0;
      const poseOffsetY = f === 4 ? -1 : f === 5 ? -2 : f === 6 ? 2 : f === 7 ? -1 : 0;

      const dot = (x: number, y: number, color: number) => {
        const finalY = y < 24 ? y + breatheOffset : y;
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX;
        const finalYPose =
          isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY;
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + DRAW_OFFSET_Y) * SCALE,
          SCALE,
          SCALE,
        );
      };

      const alphaBox = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: number,
        alpha: number,
      ) => {
        const finalY = y < 24 ? y + breatheOffset : y;
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX;
        const finalYPose =
          isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY;
        canvas.fillStyle(color, alpha);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + DRAW_OFFSET_Y) * SCALE,
          w * SCALE,
          h * SCALE,
        );
      };

      const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: number,
      ) => {
        const finalY = y < 24 ? y + breatheOffset : y;
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX;
        const finalYPose =
          isAttack || isDefend || isCharge ? finalY + poseOffsetY / 2 : finalY;
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + DRAW_OFFSET_Y) * SCALE,
          w * SCALE,
          h * SCALE,
        );
      };

      const headBox = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: number,
      ) => {
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX;
        const finalYPose = isAttack || isDefend ? y + poseOffsetY / 2 : y;
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE,
          w * SCALE,
          h * SCALE,
        );
      };
      const headDot = (x: number, y: number, color: number) => {
        const finalX =
          (isAttack || isDefend || isCharge ? x + poseOffsetX / 2 : x) + shiftX;
        const finalYPose = isAttack || isDefend ? y + poseOffsetY / 2 : y;
        canvas.fillStyle(color, 1);
        canvas.fillRect(
          (offsetX + finalX) * SCALE,
          (finalYPose + breatheOffset + DRAW_OFFSET_Y) * SCALE,
          SCALE,
          SCALE,
        );
      };

      const SKIN = 0xffcc99;
      const WHITE = 0xffffff;
      const BLACK = 0x111111;

      switch (key) {
        case "goku": {
          // DBZ PALETTE
          const GI_ORANGE = 0xff5a00; // Vibrant orange
          const GI_SHADOW = 0xcc3300;
          const GI_BLUE = 0x003399; // Vibrant blue
          const SASH_BLUE = 0x003399;
          const SKIN_TONE = 0xffce9e;
          const SKIN_SHADOW = 0xe0ac7d;
          const BOOT_RED = 0xd92525;
          const BOOT_ROPE = 0xeaddcf;
          const HAIR_BLACK = 0x1a1a1a;

          // SSJ PALETTE
          const HAIR_SSJ_GOLD = 0xffea00; // Vibrant gold
          const HAIR_SSJ_SHADOW = 0xd4a000;
          const HAIR_SSJ_LIGHT = 0xfff599;
          const EYE_SSJ_TEAL = 0x00f2ff;

          // ULTRA INSTINCT PALETTE
          const HAIR_UI_SILVER = 0xe0e0e0;
          const HAIR_UI_SHADOW = 0x9e9e9e;
          const HAIR_UI_LIGHT = 0xffffff;
          const EYE_UI_SILVER = 0xcccccc;

          let hairColor = HAIR_BLACK;
          let eyeColor = 0x111111;
          let eyebrowColor = HAIR_BLACK;

          if (isUI) {
            hairColor = HAIR_UI_SILVER;
            eyeColor = EYE_UI_SILVER;
            eyebrowColor = HAIR_UI_SHADOW;
          } else if (isTransformed) {
            hairColor = HAIR_SSJ_GOLD;
            eyeColor = EYE_SSJ_TEAL;
            eyebrowColor = HAIR_SSJ_SHADOW;
          }

          // --- BODY ---
          // Legs
          box(10, 23, 4, 6, GI_ORANGE);
          box(18, 23, 4, 6, GI_ORANGE);
          // Gi folds on legs
          box(10, 23, 1, 6, GI_SHADOW);
          box(21, 23, 1, 6, GI_SHADOW);
          box(12, 24, 1, 4, GI_SHADOW);
          box(19, 24, 1, 4, GI_SHADOW);
          // Boots (Classic Z style)
          box(10, 29, 4, 3, GI_BLUE);
          box(18, 29, 4, 3, GI_BLUE);
          box(10, 29, 4, 1, BOOT_ROPE);
          box(18, 29, 4, 1, BOOT_ROPE);
          box(12, 29, 1, 3, BOOT_RED);
          box(20, 29, 1, 3, BOOT_RED); // Vertical stripe
          box(10, 31, 4, 1, GI_BLUE);
          box(18, 31, 4, 1, GI_BLUE);
          // Boot shadows
          box(10, 30, 1, 2, 0x001133);
          box(18, 30, 1, 2, 0x001133);

          // Torso
          box(11, 14, 10, 9, GI_ORANGE);
          box(13, 14, 6, 4, GI_BLUE); // Undershirt
          // Undershirt shadow
          box(13, 14, 1, 4, 0x001133);
          box(18, 14, 1, 4, 0x001133);
          box(14, 14, 4, 2, SKIN_TONE); // Neck
          // Neck shadow
          box(14, 15, 4, 1, SKIN_SHADOW);
          dot(15, 16, SKIN_TONE); // V-neck dip
          // Gi folds on torso
          box(19, 17, 2, 6, GI_SHADOW); // Shading right
          box(11, 17, 1, 5, GI_SHADOW); // Shading left
          box(14, 18, 1, 4, GI_SHADOW);
          box(17, 18, 1, 4, GI_SHADOW); // Inner folds
          box(12, 19, 8, 1, GI_SHADOW); // Horizontal fold

          // Sash with knot
          box(11, 22, 10, 2, SASH_BLUE);
          // Sash shadow
          box(11, 23, 10, 1, 0x001133);
          const knotY = f % 2 === 0 ? 23 : 24;
          box(11, 23, 2, 4, SASH_BLUE);
          dot(12, 27, SASH_BLUE);
          box(11, 24, 1, 3, 0x001133); // Knot shadow

          if (!isUI) {
            // Kanji Symbol (Turtle/Kai)
            box(17, 16, 3, 3, 0xffffff);
            dot(18, 17, 0x111111);
          }

          // Arms (Wristbands)
          if (isCharge) {
              // Genki Dama charge: both arms raised straight up
              // Right arm
              box(18, 4, 3, 10, SKIN_TONE); 
              box(18, 14, 3, 3, GI_ORANGE); // shoulder
              box(18, 4, 3, 3, GI_BLUE); // wristband
              box(18, 2, 3, 3, SKIN_TONE); // fist
              // Left arm
              box(11, 4, 3, 10, SKIN_TONE); 
              box(11, 14, 3, 3, GI_ORANGE); // shoulder
              box(11, 4, 3, 3, GI_BLUE); // wristband
              box(11, 2, 3, 3, SKIN_TONE); // fist
          } else if (isAttack) {
            // Right arm punch straight out (muscular)
            box(21, 13, 5, 4, SKIN_TONE); // bicep
            box(21, 13, 3, 4, GI_ORANGE); // shoulder/sleeve
            box(21, 13, 1, 4, GI_SHADOW);
            box(26, 14, 5, 3, SKIN_TONE); // forearm
            box(30, 14, 2, 3, GI_BLUE); // wristband
            box(31, 13, 4, 4, SKIN_TONE); // fist (larger)
            box(31, 13, 2, 2, 0xffffff); // fist highlight
            // Motion blur for punch
            alphaBox(33, 13, 6, 4, SKIN_TONE, 0.4);
            // Left arm pulled back
            box(6, 15, 4, 5, SKIN_TONE);
            box(7, 14, 4, 3, GI_ORANGE);
            box(6, 18, 4, 2, GI_BLUE);
          } else {
            box(8, 14, 3, 4, GI_ORANGE);
            box(21, 14, 3, 4, GI_ORANGE);
            // Shoulder gi folds
            box(8, 15, 1, 3, GI_SHADOW);
            box(23, 15, 1, 3, GI_SHADOW);

            box(8, 18, 3, 3, SKIN_TONE);
            box(21, 18, 3, 3, SKIN_TONE);
            // Arm muscle shading
            box(8, 18, 1, 3, SKIN_SHADOW);
            box(23, 18, 1, 3, SKIN_SHADOW);
            box(9, 19, 1, 2, SKIN_SHADOW);
            box(22, 19, 1, 2, SKIN_SHADOW); // Bicep definition

            box(8, 20, 3, 3, GI_BLUE);
            box(21, 20, 3, 3, GI_BLUE); // Wristband
            // Wristband shadow
            box(8, 20, 1, 3, 0x001133);
            box(23, 20, 1, 3, 0x001133);

            box(8, 23, 3, 2, SKIN_TONE);
            box(21, 23, 3, 2, SKIN_TONE); // Hands
            // Knuckles
            box(8, 24, 3, 1, SKIN_SHADOW);
            box(21, 24, 3, 1, SKIN_SHADOW);
          }

          // Head
          headBox(12, 6, 8, 7, SKIN_TONE);
          headDot(11, 9, SKIN_TONE);
          headDot(20, 9, SKIN_TONE); // Ears
          headDot(11, 10, SKIN_SHADOW);
          headDot(20, 10, SKIN_SHADOW); // Ear shadows
          headBox(13, 12, 6, 1, SKIN_SHADOW); // Jaw shadow

          // Face
          headDot(13, 9, WHITE);
          headDot(18, 9, WHITE);
          headDot(14, 9, eyeColor);
          headDot(17, 9, eyeColor);
          headDot(13, 8, eyebrowColor);
          headDot(14, 8, eyebrowColor);
          headDot(17, 8, eyebrowColor);
          headDot(18, 8, eyebrowColor);
          // Angry brow furrow
          headDot(15, 8, SKIN_SHADOW);
          headDot(16, 8, SKIN_SHADOW);
          headDot(15, 11, 0xdca880); // Nose
          // Cheek lines (iconic DBZ style)
          headDot(13, 11, SKIN_SHADOW);
          headDot(18, 11, SKIN_SHADOW);

          // Subtle Expressions
          if (isAttack) {
            headBox(15, 12, 2, 1, 0x440000); // Small open mouth
          } else if (isDefend) {
            headBox(15, 12, 2, 1, WHITE); // Clenched teeth
          } else {
            headDot(16, 12, 0x222222); // Smirk corner
          }

          canvas.fillStyle(hairColor, 1);

          if (isTransformed && !isUI) {
            // SSJ Hair - Standing straight up, dynamic flame-like
            headBox(11, 0, 10, 6, hairColor); // Main block
            // Left side spikes
            headBox(9, -2, 2, 6, hairColor);
            headBox(7, 0, 2, 4, hairColor);
            // Right side spikes
            headBox(21, -2, 2, 6, hairColor);
            headBox(23, 0, 2, 4, hairColor);
            // Top spikes (tall and sharp)
            headBox(11, -6, 2, 6, hairColor); // Far left top
            headBox(14, -8, 3, 8, hairColor); // Center top (tallest)
            headBox(18, -5, 2, 5, hairColor); // Far right top

            // Hair shading
            headBox(11, -2, 1, 6, HAIR_SSJ_SHADOW);
            headBox(20, -2, 1, 6, HAIR_SSJ_SHADOW);
            headBox(12, -6, 1, 6, HAIR_SSJ_SHADOW);
            headBox(18, -5, 1, 5, HAIR_SSJ_SHADOW);
            headBox(15, -8, 1, 8, HAIR_SSJ_SHADOW); // Middle spike shadow
            // Hair highlights
            headBox(13, -4, 1, 4, HAIR_SSJ_LIGHT);
            headBox(19, -3, 1, 4, HAIR_SSJ_LIGHT);
            headBox(16, -6, 1, 4, HAIR_SSJ_LIGHT);
            // Bangs (SSJ has fewer bangs, mostly one or two sharp ones, lifted)
            headBox(14, 6, 2, 2, hairColor);
            headBox(17, 6, 1, 1, hairColor);
            headBox(14, 7, 1, 1, HAIR_SSJ_SHADOW); // Bang shadow
          } else if (isUI) {
            // UI Hair - Similar to base but more raised/flowing
            headBox(11, 1, 10, 7, hairColor);
            headBox(14, -1, 4, 3, hairColor); // Top bump
            headBox(9, 2, 2, 5, hairColor);
            headDot(8, 4, hairColor);
            headBox(7, 3, 2, 4, hairColor);
            headBox(21, 2, 2, 4, hairColor);
            headDot(23, 4, hairColor);
            // Hair shading
            headBox(11, 3, 1, 5, HAIR_UI_SHADOW);
            headBox(20, 3, 1, 5, HAIR_UI_SHADOW);
            headBox(14, 1, 1, 3, HAIR_UI_SHADOW);
            // Hair highlights
            headBox(12, 2, 1, 4, HAIR_UI_LIGHT);
            headBox(19, 2, 1, 4, HAIR_UI_LIGHT);
            headBox(15, 0, 1, 3, HAIR_UI_LIGHT);
            // Bangs
            headBox(13, 6, 2, 3, hairColor);
            headBox(16, 6, 3, 3, hairColor);
            headBox(11, 6, 1, 2, hairColor);
            headBox(20, 6, 1, 2, hairColor);
            headBox(13, 7, 1, 2, HAIR_UI_SHADOW);
            headBox(17, 7, 1, 2, HAIR_UI_SHADOW); // Bang shadows
          } else {
            // Base Hair - Classic Goku (Palm tree look)
            headBox(11, 1, 10, 5, hairColor); // Main base
            // Top spikes
            headBox(13, -2, 3, 3, hairColor);
            headBox(16, -1, 3, 2, hairColor);
            // Left spikes (curving up and out)
            headBox(9, 0, 2, 4, hairColor);
            headBox(7, 1, 2, 3, hairColor);
            headBox(5, 3, 2, 2, hairColor);
            // Right spikes (curving up and out)
            headBox(21, 1, 2, 4, hairColor);
            headBox(23, 2, 2, 3, hairColor);
            headBox(25, 4, 2, 2, hairColor);
            // Hair shading (greyish for black hair)
            headBox(12, 2, 1, 4, 0x333333);
            headBox(19, 2, 1, 4, 0x333333);
            headBox(14, 0, 1, 2, 0x333333);
            // Bangs (Base) - Lifted
            headBox(13, 6, 2, 2, hairColor); // Left bang
            headBox(16, 6, 2, 2, hairColor); // Right bang
            headBox(18, 6, 1, 1, hairColor); // Small side bang
          }

          break;
        }
        case "vegeta": {
          const SUIT_BLUE = 0x1f3c88; // Deeper, more vibrant blue
          const SUIT_SHADOW = 0x0f1e44;
          const SUIT_LIGHT = 0x2e57c6;
          const ARMOR_WHITE = 0xfafafa;
          const ARMOR_SHADOW = 0xbac3d6; // Slight blueish tint to armor shadows
          const ARMOR_DARK = 0x7b879c;
          const GOLD = 0xffc800; // Richer yellow/gold
          const GOLD_SHADOW = 0xcc9900;
          const SKIN = 0xffce9e;
          const SKIN_SHADOW = 0xe0ac7d;

          let HAIR = BLACK;
          let EYE = BLACK;
          let BROW = BLACK;
          if (isUI) {
            // Ultra Ego
            HAIR = 0x9b59b6; // Purple
            EYE = 0xff00ff; // Magenta
            BROW = 0x9b59b6;
          } else if (isTransformed) {
            // SSJ
            HAIR = 0xffea00; // Vibrant gold
            EYE = 0x00f2ff;
            BROW = 0xffea00;
          }

          // Legs (more shaped, tapering down)
          box(11, 23, 4, 6, SUIT_BLUE);
          box(17, 23, 4, 6, SUIT_BLUE); // Thighs base
          
          // Ribbed bodysuit texture on legs
          for(let ly = 23; ly < 29; ly += 2) {
            box(11, ly, 4, 1, SUIT_SHADOW);
            box(17, ly, 4, 1, SUIT_SHADOW);
          }
          // Leg highlights (muscular curve)
          box(12, 23, 2, 4, SUIT_LIGHT);
          box(18, 23, 2, 4, SUIT_LIGHT); 
          // Inner leg shadow
          box(14, 23, 1, 5, 0x0a142c);
          box(17, 23, 1, 5, 0x0a142c);

          // Boots (Classic white with bold gold tips)
          box(11, 28, 4, 3, ARMOR_WHITE);
          box(17, 28, 4, 3, ARMOR_WHITE);
          box(10, 30, 5, 2, ARMOR_WHITE);
          box(17, 30, 5, 2, ARMOR_WHITE);
          
          // Distinct Gold Tips
          box(9, 31, 5, 1, GOLD);
          box(18, 31, 5, 1, GOLD);
          dot(9, 30, GOLD);
          dot(13, 30, GOLD);
          dot(18, 30, GOLD);
          dot(22, 30, GOLD);
          // Highlight on gold tip
          dot(9, 31, 0xffeb73);
          dot(18, 31, 0xffeb73);

          // Boot shading & folds
          box(12, 28, 2, 3, ARMOR_SHADOW);
          box(18, 28, 2, 3, ARMOR_SHADOW);
          box(11, 29, 4, 1, ARMOR_SHADOW);
          box(17, 29, 4, 1, ARMOR_SHADOW);
          box(10, 32, 5, 1, 0x000000);
          box(17, 32, 5, 1, 0x000000); // Sole shadow

          // Torso (Suit underneath)
          box(12, 19, 8, 4, SUIT_BLUE);
          
          // Bodysuit ribbing on abdomen
          box(12, 20, 8, 1, SUIT_SHADOW);
          box(12, 22, 8, 1, SUIT_SHADOW);
          box(12, 19, 1, 4, 0x0a142c);
          box(19, 19, 1, 4, 0x0a142c); // Side shadow

          // Armor (Segmented Chest Plate)
          // Main armor block
          box(11, 14, 10, 6, ARMOR_WHITE); 
          
          // Armor Abdomen extension (yellow straps wrap)
          box(11, 14, 2, 6, GOLD);
          box(19, 14, 2, 6, GOLD); // Side gold straps
          box(11, 14, 1, 6, GOLD_SHADOW);
          box(20, 14, 1, 6, GOLD_SHADOW); // Gold strap shadow
          
          // Chest segments (Pectorals)
          box(13, 16, 6, 1, ARMOR_SHADOW); // Underside of pecs
          box(15, 14, 2, 2, ARMOR_DARK); // Center division
          
          // Abdomen armor segments (horizontal plates)
          box(13, 17, 6, 1, ARMOR_DARK); 
          box(13, 18, 6, 1, ARMOR_SHADOW); 
          box(13, 19, 6, 1, ARMOR_DARK);
          
          // Armor bright highlights
          box(13, 14, 2, 1, 0xffffff);
          box(17, 14, 2, 1, 0xffffff); // Top chest

          // Shoulders (Iconic pointy pads)
          // Left Pad (overlapping arm and chest)
          box(6, 12, 6, 2, GOLD); // Base gold trim
          box(5, 13, 7, 2, ARMOR_WHITE); // White pad overlapping
          dot(6, 11, GOLD); // Peak point gold
          dot(5, 12, ARMOR_WHITE); // Peak point white
          box(6, 14, 6, 1, ARMOR_SHADOW); // Underside shadow
          box(6, 13, 1, 1, 0xffffff); // Glint
          
          // Right Pad
          box(20, 12, 6, 2, GOLD);
          box(20, 13, 7, 2, ARMOR_WHITE);
          dot(25, 11, GOLD); 
          dot(26, 12, ARMOR_WHITE); 
          box(20, 14, 6, 1, ARMOR_SHADOW);
          box(25, 13, 1, 1, 0xffffff);

          // --- ARMS ---
          if (isAttack) {
            box(21, 13, 6, 4, SUIT_BLUE); // Bicep extended
            box(21, 14, 6, 1, SUIT_SHADOW); // Ribbing
            box(27, 14, 6, 3, SUIT_BLUE); // Forearm
            // Glove
            box(31, 14, 5, 4, ARMOR_WHITE); 
            box(31, 14, 2, 2, ARMOR_SHADOW); // Knuckles
            box(34, 13, 3, 4, ARMOR_WHITE); // Extended fist
            alphaBox(36, 13, 4, 4, ARMOR_WHITE, 0.5); // Blur
            box(6, 15, 4, 5, SUIT_BLUE); // Left arm back
            box(6, 18, 4, 3, ARMOR_WHITE); // Left glove
          } else {
            // Resting arms with Suit Ribbing
            box(8, 16, 3, 4, SUIT_BLUE);
            box(21, 16, 3, 4, SUIT_BLUE);
            // Arm ribbed shading
            box(8, 16, 3, 1, SUIT_SHADOW);
            box(21, 16, 3, 1, SUIT_SHADOW);
            box(8, 18, 3, 1, SUIT_SHADOW);
            box(21, 18, 3, 1, SUIT_SHADOW);
            box(9, 17, 1, 2, SUIT_LIGHT);
            box(22, 17, 1, 2, SUIT_LIGHT); // Bicep curve

            // Gloves (White, flared top)
            box(7, 20, 5, 4, ARMOR_WHITE);
            box(20, 20, 5, 4, ARMOR_WHITE);
            box(8, 20, 3, 4, ARMOR_SHADOW); // Cylinder shadow
            box(21, 20, 3, 4, ARMOR_SHADOW);
            // Glove folds
            box(7, 21, 4, 1, ARMOR_SHADOW);
            box(21, 21, 4, 1, ARMOR_SHADOW);
            box(7, 23, 4, 1, ARMOR_DARK);
            box(21, 23, 4, 1, ARMOR_DARK); 
          }

          // --- HEAD & FACE ---
          headBox(11, 6, 10, 6, SKIN); // Face base (a bit wider)
          headBox(13, 12, 6, 1, SKIN); // Pointed chin

          // Angular cheek shading (Vegeta's gaunt look)
          headBox(11, 6, 1, 6, SKIN_SHADOW);
          headBox(20, 6, 1, 6, SKIN_SHADOW);
          headBox(13, 10, 1, 2, SKIN_SHADOW);
          headBox(18, 10, 1, 2, SKIN_SHADOW); // Cheekbone hollows
          headBox(13, 12, 6, 1, SKIN_SHADOW); // Chin shadow

          // Eyes & Angry Brow (Heavy furrow)
          headBox(12, 8, 3, 1, WHITE);
          headBox(17, 8, 3, 1, WHITE);
          headDot(14, 8, EYE);
          headDot(17, 8, EYE);
          
          // Sharp, angled eyebrows
          headBox(12, 7, 3, 1, BROW);
          headBox(17, 7, 3, 1, BROW); 
          headDot(15, 8, BROW); // Deep furrow
          headDot(16, 8, BROW); 
          // Angle cutoff to make them slant aggressively
          headDot(12, 8, SKIN);
          headDot(19, 8, SKIN);
          headDot(14, 7, SKIN);
          headDot(17, 7, SKIN);

          // Expressions
          if (isAttack) {
            headBox(15, 11, 2, 1, 0x440000); // Shouting
          } else if (isDefend) {
            headBox(15, 11, 2, 1, WHITE); // Grit teeth
          } else {
            headDot(15, 11, 0x222222); // Smirk (Vegeta's signature)
          }

          // --- HAIR (Iconic Flame & Widow's Peak) ---
          // Deep Widow's Peak
          headBox(14, 5, 4, 3, SKIN); 
          headDot(15, 4, SKIN); // Point
          headDot(16, 4, SKIN); 
          
          // Sideburns
          headBox(10, 5, 1, 3, HAIR);
          headBox(21, 5, 1, 3, HAIR);

          // Main Hair Volume
          headBox(10, 1, 12, 4, HAIR);
          headBox(9, -2, 14, 3, HAIR);
          headBox(10, -6, 12, 4, HAIR);
          headBox(11, -9, 10, 3, HAIR);
          headBox(13, -12, 6, 3, HAIR);
          headBox(14, -15, 4, 3, HAIR); 
          
          // Tallest tip
          headBox(15, -17, 2, 2, HAIR);

          // Side flame flares
          headBox(8, 0, 2, 2, HAIR);
          headBox(7, -3, 2, 2, HAIR);
          headBox(8, -5, 2, 3, HAIR);
          headBox(9, -8, 2, 3, HAIR);
          headBox(10, -11, 2, 3, HAIR);
          
          headBox(22, 0, 2, 2, HAIR);
          headBox(23, -3, 2, 2, HAIR);
          headBox(22, -5, 2, 3, HAIR);
          headBox(21, -8, 2, 3, HAIR);
          headBox(20, -11, 2, 3, HAIR);

          // Hair Texture & Shading (Striated upwards lines)
          const hairShadowC = HAIR === BLACK ? 0x222222 : isUI ? 0x732d91 : 0xd4a000;
          
          // Vertical shadow streaks
          headBox(11, -11, 1, 12, hairShadowC);
          headBox(20, -11, 1, 12, hairShadowC);
          headBox(14, -15, 1, 15, hairShadowC);
          headBox(17, -15, 1, 15, hairShadowC);

          if (isTransformed) {
            // Super Saiyan Bright Highlights
            const hairLight = isUI ? 0xd2b4de : 0xffffff;
            headBox(13, -14, 1, 14, hairLight);
            headBox(16, -14, 1, 14, hairLight);
            headBox(15, -16, 1, 6, hairLight); // Center flash
          }
          break;
        }
        case "piccolo": {
          // Brighter green skin, darker purple gi for DBS look
          const GREEN_SKIN = 0x66e044;
          const GREEN_SHADOW = 0x3b9e23;
          const MUSCLE_PINK = 0xf08090;
          const MUSCLE_SHADOW = 0xc05060;
          const GI_PURPLE = 0x2a164d;
          const GI_SHADOW = 0x150b26;
          const SASH_BLUE = 0x2980b9;
          const SHOE_BROWN = 0x6b4a23;
          const WHITE_CAPE = 0xf8f8f8;
          const CAPE_SHADOW = 0xdcdcdc;
          const ORANGE_SKIN = 0xff9900;
          const ORANGE_SHADOW = 0xcc7700;
          const RED_EYES = 0xff0000;

          const skin = isTransformed ? ORANGE_SKIN : GREEN_SKIN;
          const skinShadow = isTransformed ? ORANGE_SHADOW : GREEN_SHADOW;
          const eyeColor = isTransformed ? RED_EYES : BLACK;

          // Legs
          box(10, 23, 4, 7, GI_PURPLE);
          box(18, 23, 4, 7, GI_PURPLE);
          // Gi folds/shadows on legs
          box(10, 23, 1, 7, GI_SHADOW);
          box(21, 23, 1, 7, GI_SHADOW);
          box(12, 24, 1, 5, GI_SHADOW);
          box(19, 24, 1, 5, GI_SHADOW); // Extra folds
          // Shoes
          box(10, 30, 4, 2, SHOE_BROWN);
          box(18, 30, 4, 2, SHOE_BROWN);
          dot(11, 30, 0x4a3010);
          dot(12, 30, 0x4a3010);

          // Torso
          if (isTransformed) {
            // Bulkier torso for Orange Piccolo
            box(10, 14, 12, 9, GI_PURPLE);
            // Gi folds
            box(11, 15, 1, 6, GI_SHADOW);
            box(20, 15, 1, 6, GI_SHADOW);
            box(13, 17, 1, 4, GI_SHADOW);
            box(18, 17, 1, 4, GI_SHADOW);

            box(10, 21, 12, 3, SASH_BLUE);
            box(14, 22, 4, 2, 0x1f618d);
            box(12, 13, 8, 3, skin); // Exposed chest
            // Chest muscle definition
            box(15, 14, 2, 2, skinShadow); // Cleavage
            box(13, 15, 2, 1, skinShadow);
            box(17, 15, 2, 1, skinShadow); // Pecs lower line
          } else {
            box(11, 14, 10, 9, GI_PURPLE);
            // Gi folds
            box(12, 15, 1, 6, GI_SHADOW);
            box(19, 15, 1, 6, GI_SHADOW);
            box(14, 17, 1, 4, GI_SHADOW);
            box(17, 17, 1, 4, GI_SHADOW);

            box(11, 21, 10, 3, SASH_BLUE);
            box(14, 22, 4, 2, 0x1f618d);
            box(13, 13, 6, 3, skin);
            // Chest muscle definition
            box(15, 14, 2, 2, skinShadow); // Cleavage
          }

          // Arms
          if (isAttack) {
            const armCol = skin;
            const patchCol = isTransformed ? skin : MUSCLE_PINK;
            box(21, 14, 16, 3, armCol); // Stretchy arm right
            box(21, 14, 16, 1, patchCol);
            box(35, 14, 2, 3, 0xbb3333); // Wristband stretched arm
            box(37, 14, 4, 4, armCol); // Fist
            box(37, 14, 2, 2, 0xffeebb); // Knuckles
            box(6, 15, 3, 6, armCol); // Left arm back
            box(6, 19, 3, 2, 0xbb3333); // Wristband left
          } else {
            if (isTransformed) {
              // Bulkier arms
              box(5, 15, 5, 9, skin);
              box(22, 15, 5, 9, skin);
              // Muscle lines (Orange Piccolo has distinct arm lines)
              box(6, 17, 3, 1, skinShadow);
              box(6, 20, 3, 1, skinShadow);
              box(23, 17, 3, 1, skinShadow);
              box(23, 20, 3, 1, skinShadow);
              // Bicep/Tricep definition
              box(5, 16, 1, 3, skinShadow);
              box(9, 16, 1, 3, skinShadow);
              box(22, 16, 1, 3, skinShadow);
              box(26, 16, 1, 3, skinShadow);
              // Wristbands
              box(5, 22, 4, 2, 0xbb3333);
              box(23, 22, 4, 2, 0xbb3333);
              // Hands
              box(5, 24, 4, 3, skin);
              box(23, 24, 4, 3, skin);
              // Knuckles
              box(5, 26, 4, 1, skinShadow);
              box(23, 26, 4, 1, skinShadow);
            } else {
              box(7, 15, 4, 8, skin);
              box(21, 15, 4, 8, skin);
              // Refined muscle patches
              const patchColor = MUSCLE_PINK;
              box(8, 16, 2, 3, patchColor);
              box(8, 16, 1, 3, MUSCLE_SHADOW);
              box(22, 16, 2, 3, patchColor);
              box(23, 16, 1, 3, MUSCLE_SHADOW);
              // Bicep/Tricep definition
              box(7, 16, 1, 3, skinShadow);
              box(10, 16, 1, 3, skinShadow);
              box(21, 16, 1, 3, skinShadow);
              box(24, 16, 1, 3, skinShadow);
              // Wristbands
              box(8, 21, 3, 2, 0xbb3333);
              box(21, 21, 3, 2, 0xbb3333);
              // Hands
              box(8, 23, 3, 2, skin);
              box(21, 23, 3, 2, skin);
              // Knuckles
              box(8, 24, 3, 1, skinShadow);
              box(21, 24, 3, 1, skinShadow);
            }
          }

          // Head
          if (isTransformed) {
            // Bulkier head, prominent jaw
            headBox(11, 5, 10, 8, skin);
            headBox(11, 8, 10, 2, skinShadow); // Brow shadow
            // Distinctive antennae (taller and thicker)
            headBox(12, 3, 2, 2, skin);
            headBox(13, 1, 1, 2, skin);
            headBox(18, 3, 2, 2, skin);
            headBox(18, 1, 1, 2, skin);
          } else {
            headBox(12, 6, 8, 7, skin);
            headBox(12, 8, 8, 1, skinShadow); // Brow shadow
          }

          // Facial features
          const hx = isTransformed ? 11 : 12;
          const hw = isTransformed ? 10 : 8;
          headDot(hx + 1, 12, skinShadow);
          headDot(hx + 2, 12, skinShadow); // Cheek lines
          headDot(hx + hw - 2, 12, skinShadow);
          headDot(hx + hw - 3, 12, skinShadow); // Cheek lines right
          headDot(hx - 1, 8, skin);
          headDot(hx - 1, 9, skin); // Left ear
          headDot(hx + hw, 8, skin);
          headDot(hx + hw, 9, skin); // Right ear

          // Eyes
          if (isTransformed) {
            headDot(12, 9, WHITE);
            headDot(13, 9, eyeColor);
            headDot(18, 9, eyeColor);
            headDot(19, 9, WHITE);
          } else {
            headDot(13, 9, WHITE);
            headDot(14, 9, eyeColor);
            headDot(17, 9, eyeColor);
            headDot(18, 9, WHITE);
          }

          // Mouth
          headDot(15, 11, 0xaa6655);

          // Cape and Turban (Base form only)
          if (!isTransformed) {
            // Turban
            headBox(11, 3, 10, 5, WHITE_CAPE);
            // Turban folds
            headBox(11, 5, 10, 1, CAPE_SHADOW);
            headBox(12, 4, 8, 1, CAPE_SHADOW);
            headBox(13, 6, 6, 1, CAPE_SHADOW);
            headBox(13, 2, 6, 2, GI_PURPLE);
            headBox(14, 2, 4, 1, GI_SHADOW); // Turban gem/knot shadow

            // Cape shoulders
            headBox(5, 13, 7, 4, WHITE_CAPE);
            headDot(5, 12, WHITE_CAPE);
            headBox(20, 13, 7, 4, WHITE_CAPE);
            headDot(26, 12, WHITE_CAPE);
            // Cape shoulder pads definition
            headBox(6, 14, 5, 1, CAPE_SHADOW);
            headBox(7, 16, 3, 1, CAPE_SHADOW);
            headBox(21, 14, 5, 1, CAPE_SHADOW);
            headBox(22, 16, 3, 1, CAPE_SHADOW);

            // Cape back
            box(11, 13, 10, 3, WHITE_CAPE);
            // Cape back folds
            box(12, 14, 1, 2, CAPE_SHADOW);
            box(15, 14, 2, 2, CAPE_SHADOW);
            box(19, 14, 1, 2, CAPE_SHADOW);
          }
          break;
        }
        case "gohan": {
          const GI_PURPLE = 0x5b2c6f; // Deep violet/purple (Piccolo's Gi)
          const GI_SHADOW = 0x4a235a;
          const SASH_RED = 0xc0392b; // Red sash
          const SASH_SHADOW = 0x922b21;
          const SHOE_BROWN = 0xa0522d; // Tan/brown shoes
          const WRISTBAND_RED = 0xc0392b; // Super Hero wristbands are red
          const WRISTBAND_SHADOW = 0x922b21;

          const HAIR_BASE = BLACK;
          const HAIR_BEAST = 0xf8f9fa; // Bright silver/white
          const HAIR_SHADOW = 0xced4da;
          const EYE_BEAST = 0xff0000; // Red eyes

          const hairColor = isTransformed ? HAIR_BEAST : HAIR_BASE;
          const eyeColor = isTransformed ? EYE_BEAST : BLACK;

          if (isTransformed) {
            // Layered Violet/Magenta/Red/Blue Aura (Beast aura is wild)
            const AURA_VIOLET = 0x8a2be2;
            const AURA_MAGENTA = 0xff00ff;
            const AURA_RED = 0xff3333;
            const AURA_LIGHT = 0xddaaff;

            const drawAura = (x: number, y: number, w: number, h: number) => {
              canvas.fillRect(
                (offsetX + x) * SCALE,
                (breatheOffset + y + DRAW_OFFSET_Y) * SCALE,
                w * SCALE,
                h * SCALE,
              );
            };

            // Outer violet aura (jagged)
            canvas.fillStyle(AURA_VIOLET, 0.3);
            drawAura(0, -30, 32, 62);
            drawAura(2, -36, 28, 68);
            drawAura(6, -42, 20, 74);

            // Inner magenta aura
            canvas.fillStyle(AURA_MAGENTA, 0.5);
            drawAura(3, -20, 26, 52);
            drawAura(5, -26, 22, 58);
            drawAura(8, -32, 16, 64);

            // Reddish inner core
            canvas.fillStyle(AURA_RED, 0.4);
            drawAura(6, -10, 20, 42);
            drawAura(10, -18, 12, 50);

            // Core light aura
            canvas.fillStyle(AURA_LIGHT, 0.6);
            drawAura(8, -4, 16, 36);
            drawAura(12, -12, 8, 44);

            // Aura lightning / energy sparks (Blue/Purple lightning)
            canvas.fillStyle(0x00ffff, 0.8);
            if (f % 3 === 0) {
              drawAura(4, 10, 2, 12);
              drawAura(6, 16, 6, 2);
              drawAura(10, 18, 2, 8);
              drawAura(26, -10, 2, 10);
              drawAura(22, 0, 6, 2);
            } else if (f % 3 === 1) {
              drawAura(28, 15, 2, 10);
              drawAura(22, 21, 8, 2);
              drawAura(20, 23, 2, 8);
              drawAura(4, -15, 2, 12);
              drawAura(6, -5, 6, 2);
            } else {
              drawAura(2, -5, 2, 10);
              drawAura(4, 2, 6, 2);
              drawAura(26, 25, 2, 12);
              drawAura(20, 31, 8, 2);
            }

            // Subtle purple/white aura particles
            canvas.fillStyle(0xffffff, 0.9);
            if (f % 4 === 0) {
              drawAura(-5, 5, 3, 3);
              drawAura(35, -15, 3, 3);
              drawAura(15, -50, 3, 3);
            } else if (f % 4 === 2) {
              drawAura(-8, -25, 3, 3);
              drawAura(40, 15, 3, 3);
              drawAura(10, -45, 3, 3);
            }
            canvas.fillStyle(0xddaaff, 0.9);
            if (f % 5 === 0) {
              drawAura(8, -10, 3, 3);
              drawAura(30, -30, 3, 3);
              drawAura(25, -55, 3, 3);
            } else if (f % 5 === 2) {
              drawAura(-10, -15, 3, 3);
              drawAura(35, 5, 3, 3);
              drawAura(12, -52, 3, 3);
            }
          }

          // --- BODY ---
          // Legs
          box(10, 23, 4, 6, GI_PURPLE);
          box(18, 23, 4, 6, GI_PURPLE);
          // Gi folds on legs
          box(10, 23, 1, 6, GI_SHADOW);
          box(21, 23, 1, 6, GI_SHADOW);
          box(12, 24, 1, 4, GI_SHADOW);
          box(19, 24, 1, 4, GI_SHADOW);
          // Shoes (Brown)
          box(10, 29, 4, 3, SHOE_BROWN);
          box(18, 29, 4, 3, SHOE_BROWN);
          box(10, 29, 4, 1, 0xcd853f);
          box(18, 29, 4, 1, 0xcd853f); // Shoe highlight
          box(10, 31, 4, 1, 0x5c4033);
          box(18, 31, 4, 1, 0x5c4033); // Sole
          // Shoe shadows
          box(10, 30, 1, 2, 0x8b4513);
          box(18, 30, 1, 2, 0x8b4513);

          // Torso
          box(11, 14, 10, 9, GI_PURPLE);
          box(14, 14, 4, 2, SKIN); // Neck/Chest opening
          // Neck shadow
          box(14, 15, 4, 1, 0xe0ac7d);
          dot(15, 16, SKIN); // V-neck dip
          // Gi folds on torso
          box(19, 17, 2, 6, GI_SHADOW); // Shading right
          box(11, 17, 1, 5, GI_SHADOW); // Shading left
          box(14, 18, 1, 4, GI_SHADOW);
          box(17, 18, 1, 4, GI_SHADOW); // Inner folds
          box(12, 19, 8, 1, GI_SHADOW); // Horizontal fold

          // Sash with knot (Red)
          box(11, 22, 10, 2, SASH_RED);
          // Sash shadow
          box(11, 23, 10, 1, SASH_SHADOW);
          const knotY = f % 2 === 0 ? 23 : 24;
          box(11, 23, 2, 4, SASH_RED);
          dot(12, 27, SASH_RED);
          box(11, 24, 1, 3, SASH_SHADOW); // Knot shadow

          // Arms (Wristbands)
          if (isAttack) {
            // Kamehameha hands together forward
            box(21, 13, 5, 4, GI_PURPLE); // Bicep
            box(21, 13, 1, 4, GI_SHADOW);
            box(26, 14, 5, 3, GI_PURPLE); // Forearm
            box(30, 14, 2, 3, WRISTBAND_RED); // wristbands
            box(32, 13, 4, 4, SKIN); // Hands together firing
            box(32, 13, 2, 4, 0xffeebb); // Hands highlight
            alphaBox(34, 13, 4, 4, SKIN, 0.4); // blur
            box(6, 15, 4, 5, GI_PURPLE); // left arm back
            box(6, 19, 4, 2, WRISTBAND_RED);
          } else {
            box(8, 14, 3, 4, GI_PURPLE);
            box(21, 14, 3, 4, GI_PURPLE);
            // Shoulder gi folds
            box(8, 15, 1, 3, GI_SHADOW);
            box(23, 15, 1, 3, GI_SHADOW);

            box(8, 18, 3, 3, SKIN);
            box(21, 18, 3, 3, SKIN);
            // Arm muscle shading
            box(8, 18, 1, 3, 0xe0ac7d);
            box(23, 18, 1, 3, 0xe0ac7d);
            box(9, 19, 1, 2, 0xe0ac7d);
            box(22, 19, 1, 2, 0xe0ac7d); // Bicep definition

            box(8, 20, 3, 3, WRISTBAND_RED);
            box(21, 20, 3, 3, WRISTBAND_RED); // Wristband
            // Wristband shadow
            box(8, 20, 1, 3, WRISTBAND_SHADOW);
            box(23, 20, 1, 3, WRISTBAND_SHADOW);

            box(8, 23, 3, 2, SKIN);
            box(21, 23, 3, 2, SKIN); // Hands
            // Knuckles
            box(8, 24, 3, 1, 0xe0ac7d);
            box(21, 24, 3, 1, 0xe0ac7d);
          }

          // Head
          headBox(12, 6, 8, 7, SKIN);
          headDot(11, 9, SKIN);
          headDot(20, 9, SKIN); // Ears
          headDot(11, 10, 0xe0ac7d);
          headDot(20, 10, 0xe0ac7d); // Ear shadows
          headBox(13, 12, 6, 1, 0xe0ac7d); // Jaw shadow

          // Face
          headDot(13, 9, WHITE);
          headDot(17, 9, WHITE); // Sclera
          headDot(14, 9, eyeColor);
          headDot(18, 9, eyeColor); // Pupils
          headDot(13, 8, hairColor);
          headDot(14, 8, hairColor);
          headDot(17, 8, hairColor);
          headDot(18, 8, hairColor);
          // Angry brow furrow
          headDot(15, 8, 0xe0ac7d);
          headDot(16, 8, 0xe0ac7d);
          headDot(15, 11, 0xcc8866); // Nose
          // Cheek lines (iconic DBZ style)
          headDot(13, 11, 0xe0ac7d);
          headDot(18, 11, 0xe0ac7d);

          // Subtle Expressions
          if (isAttack) {
            headBox(15, 12, 2, 1, 0x440000); // Small open mouth
          } else if (isDefend) {
            headBox(15, 12, 2, 1, WHITE); // Clenched teeth
          } else {
            headDot(16, 12, 0x222222); // Smirk corner
          }

          if (isTransformed) {
            // Beast Hair (Spiky, tall, but within bounds)
            headBox(11, 0, 10, 6, hairColor); // Base
            headBox(10, -2, 2, 6, hairColor); // Left side
            headBox(20, -2, 2, 6, hairColor); // Right side
            headBox(12, -4, 2, 6, hairColor); // Top spike left
            headBox(15, -6, 3, 8, hairColor); // Top spike middle (tallest)
            headBox(18, -3, 2, 5, hairColor); // Top spike right
            headBox(8, 2, 2, 4, hairColor); // Far left spike
            headBox(22, 2, 2, 4, hairColor); // Far right spike

            // The iconic Beast bang
            headBox(14, 6, 2, 3, hairColor);
            headBox(15, 9, 1, 2, hairColor);

            // Hair shading
            headBox(11, -2, 1, 6, HAIR_SHADOW);
            headBox(20, -2, 1, 6, HAIR_SHADOW);
            headBox(12, -4, 1, 6, HAIR_SHADOW);
            headBox(18, -3, 1, 5, HAIR_SHADOW);
            headBox(15, -6, 1, 8, HAIR_SHADOW); // Middle spike shadow
            headBox(14, 6, 1, 3, HAIR_SHADOW); // Bang shadow
          } else {
            // Ultimate Gohan hair (spiky but normal length, one bang)
            headBox(11, 1, 10, 5, hairColor);
            headBox(10, -1, 2, 4, hairColor); // Left side
            headBox(20, -1, 2, 4, hairColor); // Right side
            headBox(12, -3, 2, 4, hairColor); // Top spike left
            headBox(15, -4, 2, 5, hairColor); // Top spike middle
            headBox(18, -2, 2, 3, hairColor); // Top spike right

            // Bang
            headBox(14, 6, 2, 3, hairColor);
            headBox(15, 9, 1, 2, hairColor);

            // Hair shading
            const hairShadow = 0x333333;
            headBox(11, -1, 1, 4, hairShadow);
            headBox(20, -1, 1, 4, hairShadow);
            headBox(12, -3, 1, 4, hairShadow);
            headBox(18, -2, 1, 3, hairShadow);
            headBox(15, -4, 1, 5, hairShadow); // Middle spike shadow
            headBox(14, 6, 1, 3, hairShadow); // Bang shadow
          }
          break;
        }
        case "madara": {
          if (isTransformed) {
            // PERFECT SUSANOO - Minimalist Block-Style

            const S_DARK = 0x1e40af; // Deep blue
            const S_MID = 0x3b82f6; // Vibrant blue
            const S_NEON = 0x60a5fa; // Neon blue glow
            const S_EYE = 0xff0000; // Glowing red eyes

            const animY = !isAttack && f % 2 === 0 ? 1 : 0;

            // SUSANOO BACK WINGS / AURA
            alphaBox(2, -10 + animY, 28, 42, S_MID, 0.2);
            alphaBox(0, -5 + animY, 32, 30, S_NEON, 0.15);

            // Wings
            alphaBox(1, -12 + animY, 8, 24, S_DARK, 0.5);
            alphaBox(23, -12 + animY, 8, 24, S_DARK, 0.5);
            alphaBox(0, -8 + animY, 6, 18, S_NEON, 0.4);
            alphaBox(26, -8 + animY, 6, 18, S_NEON, 0.4);

            // MINI MADARA (Core)
            const mX = 13;
            const mY = 16 + animY;

            // Hair back
            box(mX - 3, mY - 2, 12, 12, 0x111111);
            // Body (Red armor)
            box(mX, mY + 4, 6, 7, 0xc53030);
            // Armor plates
            box(mX - 1, mY + 8, 8, 3, 0x742a2a);
            // Legs
            box(mX + 1, mY + 11, 4, 5, 0x1a202c);
            // Arms
            box(mX - 2, mY + 4, 2, 6, 0xc53030);
            box(mX + 6, mY + 4, 2, 6, 0xc53030);
            // Face
            box(mX + 1, mY, 4, 4, 0xffebcb);
            // Hair front
            box(mX, mY - 1, 6, 2, 0x111111);
            box(mX - 1, mY + 1, 2, 3, 0x111111); // Left bang
            box(mX + 5, mY + 1, 2, 3, 0x111111); // Right bang

            // Four Arms
            if (isAttack) {
              // Upper Left (Striking)
              alphaBox(4, -2 + animY, 5, 14, S_MID, 0.7);
              // Giant Sword Left
              alphaBox(1, -16, 4, 30, S_NEON, 0.8);
              alphaBox(2, -14, 2, 26, 0xffffff, 0.9);

              // Lower Left
              alphaBox(3, 10 + animY, 5, 12, S_DARK, 0.7);
              // Sword Lower Left
              alphaBox(0, 4, 3, 20, S_NEON, 0.8);

              // Upper Right (Raised)
              alphaBox(23, -6 + animY, 5, 14, S_MID, 0.7);
              // Giant Sword Right
              alphaBox(27, -20, 4, 32, S_NEON, 0.8);
              alphaBox(28, -18, 2, 28, 0xffffff, 0.9);

              // Lower Right
              alphaBox(24, 10 + animY, 5, 12, S_DARK, 0.7);
              // Sword Lower Right
              alphaBox(29, 4, 3, 20, S_NEON, 0.8);
            } else {
              // Upper Left
              alphaBox(4, 2 + animY, 5, 14, S_MID, 0.7);
              // Sword Left
              alphaBox(2, -8, 3, 24, S_NEON, 0.6);

              // Lower Left
              alphaBox(3, 12 + animY, 5, 12, S_DARK, 0.7);
              // Sword Lower Left
              alphaBox(0, 8, 3, 20, S_NEON, 0.5);

              // Upper Right
              alphaBox(23, 2 + animY, 5, 14, S_MID, 0.7);
              // Sword Right
              alphaBox(27, -8, 3, 24, S_NEON, 0.6);

              // Lower Right
              alphaBox(24, 12 + animY, 5, 12, S_DARK, 0.7);
              // Sword Lower Right
              alphaBox(29, 8, 3, 20, S_NEON, 0.5);
            }

            // SUSANOO FRONT (Semi-transparent blocks)
            // Torso/Ribcage
            alphaBox(8, 4 + animY, 16, 18, S_MID, 0.6);
            alphaBox(9, 6 + animY, 14, 3, S_NEON, 0.8); // Rib 1
            alphaBox(10, 11 + animY, 12, 3, S_NEON, 0.8); // Rib 2
            alphaBox(11, 16 + animY, 10, 3, S_NEON, 0.8); // Rib 3

            // Skirt/Lower armor
            alphaBox(6, 22 + animY, 20, 10, S_DARK, 0.7);
            alphaBox(8, 24 + animY, 16, 8, S_MID, 0.7);

            // Head (Samurai Helmet)
            alphaBox(10, -10 + animY, 12, 14, S_DARK, 0.85);
            alphaBox(11, -4 + animY, 10, 6, 0x0f172a, 0.9); // Face Mask

            // Glowing Red Eyes
            alphaBox(12, -3 + animY, 3, 2, S_EYE, 1);
            alphaBox(17, -3 + animY, 3, 2, S_EYE, 1);

            // Helmet Horns / Crest
            alphaBox(8, -14 + animY, 3, 8, S_NEON, 0.9);
            alphaBox(21, -14 + animY, 3, 8, S_NEON, 0.9);
            alphaBox(13, -16 + animY, 6, 6, S_NEON, 0.9); // Center crest
          } else {
            // BASE MADARA - 16-bit Vibrant, Menacing Pose
            const ARMOR_RED = 0xc53030; // Vibrant crimson red
            const ARMOR_DARK = 0x742a2a; // Deep red shadow
            const ARMOR_TRIM = 0x1a202c; // Dark trim
            const CLOTHES = 0x2d3748; // Dark grey/blue suit
            const CLOTHES_DARK = 0x1a202c;
            const SKIN = 0xffebcb; // Pale skin
            const SKIN_SHADE = 0xd6bc98;
            const HAIR = 0x111111; // Almost black
            const HAIR_SHADE = 0x2d3748; // Dark grey highlights
            const SHARINGAN = 0xff0000; // Bright red eyes
            const GUNBAI_BROWN = 0x7b341e;
            const GUNBAI_CREAM = 0xfbd38d;

            // 1. MASSIVE SPIKY BACK HAIR
            // Base volume
            headBox(8, 2, 16, 18, HAIR);

            // Left side spikes (flowing out and down)
            headBox(6, 4, 2, 14, HAIR);
            headBox(4, 6, 2, 10, HAIR);
            headBox(2, 8, 2, 6, HAIR);
            // Left lower spikes
            headBox(7, 18, 2, 4, HAIR);
            headBox(5, 16, 2, 4, HAIR);

            // Right side spikes
            headBox(24, 4, 2, 14, HAIR);
            headBox(26, 6, 2, 10, HAIR);
            headBox(28, 8, 2, 6, HAIR);
            // Right lower spikes
            headBox(23, 18, 2, 4, HAIR);
            headBox(25, 16, 2, 4, HAIR);

            // Top spikes (wild and voluminous)
            headBox(10, -1, 3, 3, HAIR);
            headBox(14, -2, 4, 4, HAIR);
            headBox(19, -1, 3, 3, HAIR);

            // Hair highlights/shading for texture
            headBox(10, 4, 1, 12, HAIR_SHADE);
            headBox(14, 2, 1, 14, HAIR_SHADE);
            headBox(21, 4, 1, 12, HAIR_SHADE);
            headBox(7, 8, 1, 6, HAIR_SHADE);
            headBox(25, 8, 1, 6, HAIR_SHADE);

            // Gunbai (Fan) on back
            if (isAttack) {
              box(23, 6, 8, 14, GUNBAI_CREAM); // Fan body
              box(23, 6, 2, 14, ARMOR_TRIM); // Fan edge
              box(25, 10, 4, 4, ARMOR_RED); // Tomoe
              box(22, 20, 2, 8, GUNBAI_BROWN); // Handle
            } else {
              box(5, 8, 7, 18, GUNBAI_CREAM); // Fan body
              box(10, 8, 2, 18, ARMOR_TRIM); // Fan edge
              box(6, 13, 3, 3, ARMOR_RED); // Tomoe
            }

            // 2. LEGS (Ninja pants and sandals)
            box(11, 24, 4, 6, CLOTHES);
            box(17, 24, 4, 6, CLOTHES);
            box(11, 24, 1, 6, CLOTHES_DARK);
            box(20, 24, 1, 6, CLOTHES_DARK); // Shading
            // Bandages
            box(11, 30, 4, 2, 0xe2e8f0);
            box(17, 30, 4, 2, 0xe2e8f0);
            // Sandals (Open toe)
            box(11, 32, 4, 1, ARMOR_TRIM);
            box(17, 32, 4, 1, ARMOR_TRIM);
            dot(11, 31, ARMOR_TRIM);
            dot(17, 31, ARMOR_TRIM); // Straps

            // 3. TORSO & SAMURAI ARMOR
            // Black suit base
            box(12, 14, 8, 10, CLOTHES);

            // Chest Plate (Do)
            box(11, 14, 10, 7, ARMOR_RED);
            box(11, 14, 10, 1, ARMOR_TRIM); // Top trim
            box(11, 17, 10, 1, ARMOR_DARK); // Plate line
            box(11, 20, 10, 1, ARMOR_TRIM); // Bottom trim
            box(15, 14, 2, 7, ARMOR_DARK); // Center split

            // Armor Skirts (Kusazuri) - Flared out slightly for menacing stance
            // Left skirt
            box(9, 21, 4, 6, ARMOR_RED);
            box(9, 21, 4, 1, ARMOR_TRIM);
            box(9, 23, 4, 1, ARMOR_DARK);
            box(9, 25, 4, 1, ARMOR_DARK);
            box(9, 26, 4, 1, ARMOR_TRIM);
            // Right skirt
            box(19, 21, 4, 6, ARMOR_RED);
            box(19, 21, 4, 1, ARMOR_TRIM);
            box(19, 23, 4, 1, ARMOR_DARK);
            box(19, 25, 4, 1, ARMOR_DARK);
            box(19, 26, 4, 1, ARMOR_TRIM);
            // Center skirt
            box(14, 21, 4, 5, ARMOR_RED);
            box(14, 21, 4, 1, ARMOR_TRIM);
            box(14, 23, 4, 1, ARMOR_DARK);
            box(14, 25, 4, 1, ARMOR_TRIM);

            // 4. ARMS & SHOULDERS (Crossed or ready stance)
            const armY = isAttack ? -4 : 0;

            // Massive Shoulder Guards (Sode)
            box(7, 13 + armY, 4, 6, ARMOR_RED);
            box(21, 13 + armY, 4, 6, ARMOR_RED);
            box(7, 13 + armY, 4, 1, ARMOR_TRIM);
            box(21, 13 + armY, 4, 1, ARMOR_TRIM);
            box(7, 15 + armY, 4, 1, ARMOR_DARK);
            box(21, 15 + armY, 4, 1, ARMOR_DARK);
            box(7, 17 + armY, 4, 1, ARMOR_DARK);
            box(21, 17 + armY, 4, 1, ARMOR_DARK);
            box(7, 18 + armY, 4, 1, ARMOR_TRIM);
            box(21, 18 + armY, 4, 1, ARMOR_TRIM);

            // Sleeves
            box(9, 19 + armY, 3, 4, CLOTHES);
            box(20, 19 + armY, 3, 4, CLOTHES);
            // Gloves/Hands
            box(9, 23 + armY, 3, 2, ARMOR_TRIM);
            box(20, 23 + armY, 3, 2, ARMOR_TRIM);

            // 5. HEAD & FACE
            headBox(12, 6, 8, 7, SKIN);
            headBox(12, 6, 1, 7, SKIN_SHADE); // Face shading
            headBox(13, 12, 6, 1, SKIN_SHADE); // Jaw shading

            // Eyes (Sharingan) - Piercing and menacing
            headBox(13, 9, 2, 1, 0xffffff); // Sclera left
            headDot(14, 9, SHARINGAN); // Red pupil left
            headBox(17, 9, 2, 1, 0xffffff); // Sclera right
            headDot(17, 9, SHARINGAN); // Red pupil right

            // Angry Eyebrows
            headBox(13, 8, 2, 1, HAIR); // Left
            headBox(17, 8, 2, 1, HAIR); // Right
            headDot(15, 8, SKIN_SHADE);
            headDot(16, 8, SKIN_SHADE); // Furrowed brow

            // Mouth (Slight smirk or grimace)
            headBox(14, 11, 3, 1, ARMOR_TRIM);

            // 6. FRONT HAIR (Bangs covering right eye partially)
            // Right bang (viewer's right, Madara's left)
            headBox(18, 5, 3, 8, HAIR);
            headBox(19, 5, 1, 6, HAIR_SHADE); // Highlight
            headBox(17, 5, 1, 4, HAIR);

            // Left bang (viewer's left, Madara's right)
            headBox(11, 5, 2, 6, HAIR);
            headBox(12, 5, 1, 4, HAIR_SHADE);
          }
          break;
        }
        case "cell": {
          const GREEN = 0x66bb66;
          const DARK_GREEN = 0x448844;
          const BLACK_S = 0x112211;
          const SPOT = 0x002200; // Darker green/black for bio-armor spots
          const PALE = 0xeeeeee;
          const ORANGE = 0xffaa00;
          const PURPLE = 0xaa44cc;
          const PINK_EYE = 0xff00cc;

          // Wings (Beetle-like, drawn first so they are behind)
          const wingSpread = isAttack || isDefend ? 2 : f % 2 === 0 ? 0 : 1;

          // Left wing (tapered insectoid shape)
          box(3 - wingSpread, 10, 8, 12, BLACK_S);
          box(4 - wingSpread, 22, 6, 6, BLACK_S);
          box(5 - wingSpread, 28, 4, 4, BLACK_S);
          // Left wing highlight/texture
          box(4 - wingSpread, 11, 6, 10, 0x223322);
          box(5 - wingSpread, 21, 4, 6, 0x223322);

          // Right wing (tapered insectoid shape)
          box(21 + wingSpread, 10, 8, 12, BLACK_S);
          box(22 + wingSpread, 22, 6, 6, BLACK_S);
          box(23 + wingSpread, 28, 4, 4, BLACK_S);
          // Right wing highlight/texture
          box(22 + wingSpread, 11, 6, 10, 0x223322);
          box(23 + wingSpread, 21, 4, 6, 0x223322);

          // Legs (Thighs and Calves)
          box(10, 23, 4, 6, GREEN);
          box(18, 23, 4, 6, GREEN);
          box(10, 23, 1, 6, DARK_GREEN);
          box(21, 23, 1, 6, DARK_GREEN); // Leg shadow
          box(11, 23, 1, 6, 0x88dd88);
          box(19, 23, 1, 6, 0x88dd88); // Leg highlight
          // Accurate spots on legs
          dot(11, 24, SPOT);
          dot(13, 26, SPOT);
          dot(10, 27, SPOT);
          dot(12, 28, SPOT);
          dot(19, 25, SPOT);
          dot(21, 24, SPOT);
          dot(18, 27, SPOT);
          dot(20, 28, SPOT);

          // Boots
          box(10, 29, 4, 3, BLACK_S);
          box(18, 29, 4, 3, BLACK_S);
          box(10, 31, 4, 2, ORANGE);
          box(18, 31, 4, 2, ORANGE);
          box(10, 32, 4, 1, 0xcc8800);
          box(18, 32, 4, 1, 0xcc8800); // Boot shadow

          // Torso (Chest and Abdomen)
          // Black upper chest/neck area
          box(11, 14, 10, 4, BLACK_S);
          box(12, 14, 8, 3, 0x223322); // Chest highlight
          // Green center chest plate
          box(14, 15, 4, 3, GREEN);
          dot(15, 16, SPOT);
          dot(16, 17, SPOT);

          // Green abdomen
          box(12, 18, 8, 4, GREEN);
          box(12, 18, 1, 4, DARK_GREEN);
          box(19, 18, 1, 4, DARK_GREEN); // Abdomen shadow
          // Ribbed texture on abdomen
          box(12, 19, 8, 1, DARK_GREEN);
          box(12, 21, 8, 1, DARK_GREEN);
          // Black pelvis area
          box(11, 22, 10, 2, BLACK_S);
          box(12, 22, 8, 1, 0x223322); // Pelvis highlight

          // Arms
          if (isAttack) {
            box(21, 14, 12, 3, GREEN); // Right arm extended
            box(31, 14, 2, 3, BLACK_S); // Lower arm band
            box(33, 14, 4, 4, PALE); // Hand fist
            box(33, 14, 2, 2, 0xffffff); // Knuckle
            box(6, 15, 3, 5, GREEN); // Left arm pulled
          } else {
            // Shoulders
            box(7, 14, 4, 3, GREEN);
            box(21, 14, 4, 3, GREEN);
            box(7, 14, 1, 3, DARK_GREEN);
            box(24, 14, 1, 3, DARK_GREEN); // Shoulder shadow
            box(8, 14, 1, 3, 0x88dd88);
            box(22, 14, 1, 3, 0x88dd88); // Shoulder highlight
            // Spots on shoulders
            dot(8, 15, SPOT);
            dot(10, 14, SPOT);
            dot(9, 16, SPOT);
            dot(22, 15, SPOT);
            dot(21, 14, SPOT);
            dot(23, 16, SPOT);

            // Upper arms
            box(8, 17, 3, 5, GREEN);
            box(21, 17, 3, 5, GREEN);
            box(8, 17, 1, 5, DARK_GREEN);
            box(23, 17, 1, 5, DARK_GREEN); // Arm shadow
            // Spots on arms
            dot(9, 18, SPOT);
            dot(8, 20, SPOT);
            dot(10, 21, SPOT);
            dot(22, 19, SPOT);
            dot(23, 17, SPOT);
            dot(21, 21, SPOT);

            // Lower arms/Hands
            box(8, 21, 3, 2, BLACK_S);
            box(21, 21, 3, 2, BLACK_S);
            box(8, 23, 3, 2, PALE);
            box(21, 23, 3, 2, PALE);
            box(8, 24, 3, 1, 0xcccccc);
            box(21, 24, 3, 1, 0xcccccc); // Hand shadow
          }

          // Head
          // Base face
          headBox(12, 6, 8, 7, GREEN);
          headBox(12, 6, 1, 7, DARK_GREEN);
          headBox(19, 6, 1, 7, DARK_GREEN); // Face side shadow

          // Crown (Refined shape)
          headBox(11, 0, 2, 8, GREEN); // Left tall prong
          headBox(19, 0, 2, 8, GREEN); // Right tall prong
          headBox(11, 0, 1, 8, DARK_GREEN);
          headBox(20, 0, 1, 8, DARK_GREEN); // Prong shadow
          headBox(13, 2, 6, 4, GREEN); // Center crown base
          headBox(14, 1, 4, 2, GREEN); // Center crown peak
          headBox(13, 2, 6, 1, 0x88dd88); // Crown highlight

          // Crown spots
          headDot(11, 2, SPOT);
          headDot(12, 5, SPOT);
          headDot(11, 7, SPOT);
          headDot(20, 3, SPOT);
          headDot(19, 6, SPOT);
          headDot(20, 7, SPOT);
          headDot(15, 3, SPOT);
          headDot(16, 4, SPOT);
          headDot(14, 5, SPOT);

          // Pale face plate
          headBox(13, 8, 6, 5, PALE);
          headBox(13, 12, 6, 1, 0xcccccc); // Jaw shadow

          // Purple cheek lines
          headBox(12, 9, 1, 3, PURPLE);
          headBox(19, 9, 1, 3, PURPLE);

          // Eyes
          headBox(13, 9, 2, 1, WHITE);
          headBox(17, 9, 2, 1, WHITE);
          headDot(14, 9, PINK_EYE);
          headDot(17, 9, PINK_EYE);

          // Eyeliner / Brow ridge
          headBox(13, 8, 2, 1, BLACK_S);
          headBox(17, 8, 2, 1, BLACK_S);

          // Mouth
          headBox(15, 12, 2, 1, BLACK_S);

          break;
        }
        case "minipekka": {
          const METAL_LIGHT = isTransformed ? 0x333333 : 0xd5dbdb;
          const METAL_DARK = isTransformed ? 0x111111 : 0x7f8c8d;
          const METAL_JOINT = isTransformed ? 0x1a1a1a : 0x2c3e50;
          const ACCENT = isTransformed ? 0x9b59b6 : 0x3498db; // Blue vs Purple
          const EYE = isTransformed ? 0xff33cc : 0x00ffff; // Cyan vs Pinkish-Purple

          // Legs
          box(10, 29, 5, 3, METAL_DARK);
          box(17, 29, 5, 3, METAL_DARK); // Feet
          box(10, 27, 5, 2, METAL_LIGHT);
          box(17, 27, 5, 2, METAL_LIGHT); // Lower leg
          box(11, 25, 3, 2, METAL_JOINT);
          box(18, 25, 3, 2, METAL_JOINT); // Joint
          // Leg shading
          box(10, 29, 1, 3, 0x111111);
          box(17, 29, 1, 3, 0x111111);
          box(10, 27, 1, 2, METAL_DARK);
          box(17, 27, 1, 2, METAL_DARK);

          const offY = 6;
          // Torso
          box(11, 19 + offY, 10, 3, METAL_JOINT); // Waist
          box(9, 13 + offY, 14, 7, METAL_LIGHT); // Chest
          box(9, 18 + offY, 14, 2, METAL_DARK); // Lower chest
          box(13, 14 + offY, 6, 5, METAL_DARK); // Chest plate
          box(14, 15 + offY, 4, 3, ACCENT); // Chest core
          // Torso shading
          box(9, 13 + offY, 1, 7, METAL_DARK);
          box(22, 13 + offY, 1, 7, METAL_DARK);
          box(13, 14 + offY, 1, 5, 0x111111);
          box(18, 14 + offY, 1, 5, 0x111111);

          // Arms
          box(7, 15 + offY, 2, 6, METAL_LIGHT);
          box(23, 15 + offY, 2, 6, METAL_LIGHT); // Upper arm
          box(7, 21 + offY, 2, 2, METAL_DARK);
          box(23, 21 + offY, 2, 2, METAL_DARK); // Hand
          // Arm shading
          box(7, 15 + offY, 1, 6, METAL_DARK);
          box(24, 15 + offY, 1, 6, METAL_DARK);

          // Sword
          const swordY = f % 2 === 0 ? 14 + offY : 15 + offY;
          headBox(6, swordY + 6, 2, 4, 0x555555); // Hilt
          headBox(5, swordY + 5, 4, 1, METAL_DARK); // Guard
          headBox(5, swordY - 2, 4, 7, 0xecf0f1); // Blade
          headBox(6, swordY - 3, 2, 1, 0xecf0f1); // Tip
          // Sword shading
          headBox(7, swordY - 2, 2, 7, 0xbdc3c7);
          headBox(7, swordY - 3, 1, 1, 0xbdc3c7);

          // Head
          headBox(11, 10 + offY, 10, 3, METAL_LIGHT); // Lower head
          headBox(11, 6 + offY, 10, 4, METAL_LIGHT); // Upper head
          headBox(11, 9 + offY, 10, 2, 0x000000); // Visor slit
          headBox(14, 9 + offY, 4, 2, EYE); // Eye
          headBox(9, 5 + offY, 2, 4, ACCENT);
          headBox(21, 5 + offY, 2, 4, ACCENT); // Horns
          headDot(9, 4 + offY, ACCENT);
          headDot(21, 4 + offY, ACCENT); // Horn tips
          // Head shading
          headBox(11, 6 + offY, 1, 7, METAL_DARK);
          headBox(20, 6 + offY, 1, 7, METAL_DARK);
          headBox(9, 5 + offY, 1, 4, 0x111111);
          headBox(22, 5 + offY, 1, 4, 0x111111);
          break;
        }
        case "cyberninja": {
          const SUIT_MAIN = isTransformed ? 0x222222 : 0x2d3436; // Darker when transformed
          const SUIT_DARK = 0x111111;
          const SCARF = isTransformed ? 0xff0055 : 0x00d2d3; // Red vs Cyan
          const VISOR = isTransformed ? 0xff0000 : 0x00eaff;
          const SKIN_PALE = 0xffeebb;

          // Legs (Baggy ninja pants)
          box(10, 24, 4, 6, SUIT_MAIN);
          box(18, 24, 4, 6, SUIT_MAIN);
          box(10, 24, 1, 6, SUIT_DARK);
          box(21, 24, 1, 6, SUIT_DARK); // Leg shadow
          box(10, 30, 4, 2, SUIT_DARK);
          box(18, 30, 4, 2, SUIT_DARK); // Boots
          box(10, 31, 4, 1, 0x000000);
          box(18, 31, 4, 1, 0x000000); // Boot shadow

          // Torso (Armor vest)
          box(11, 14, 10, 10, SUIT_MAIN);
          box(11, 14, 1, 10, SUIT_DARK);
          box(20, 14, 1, 10, SUIT_DARK); // Torso shadow
          box(12, 15, 8, 5, SUIT_DARK); // Chest plate
          box(12, 15, 8, 1, 0x333333); // Chest highlight

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, SUIT_MAIN); // Right arm out
            box(30, 14, 2, 3, SKIN_PALE); // bare lower arm
            box(32, 14, 4, 4, SUIT_DARK); // Right glove/fist
            box(32, 14, 2, 2, 0xaaaaaa); // Knuckle
            box(6, 15, 3, 5, SUIT_MAIN); // Left arm pulled
            box(6, 19, 3, 3, SUIT_DARK); // Left glove
          } else {
            box(8, 14, 3, 5, SUIT_MAIN);
            box(21, 14, 3, 5, SUIT_MAIN);
            box(8, 14, 1, 5, SUIT_DARK);
            box(23, 14, 1, 5, SUIT_DARK); // Arm shadow
            box(8, 19, 3, 4, SKIN_PALE);
            box(21, 19, 3, 4, SKIN_PALE); // Bare arms/gloves
            box(8, 19, 1, 4, 0xccbb99);
            box(23, 19, 1, 4, 0xccbb99); // Skin shadow
            box(8, 21, 3, 2, SUIT_DARK);
            box(21, 21, 3, 2, SUIT_DARK); // Gloves
            box(8, 22, 3, 1, 0x000000);
            box(21, 22, 3, 1, 0x000000); // Glove shadow
          }

          // Head
          headBox(12, 6, 8, 8, SUIT_MAIN); // Hood
          headBox(12, 6, 1, 8, SUIT_DARK);
          headBox(19, 6, 1, 8, SUIT_DARK); // Hood shadow
          headBox(13, 8, 6, 3, SKIN_PALE); // Face opening
          headBox(13, 10, 6, 1, 0xccbb99); // Face shadow
          headBox(13, 8, 6, 1, VISOR); // Visor eye
          headBox(13, 8, 2, 1, 0xffffff); // Visor highlight

          // Scarf Animation (Flowing in wind)
          // Base position neck
          headBox(11, 13, 10, 2, SCARF);
          headBox(11, 14, 10, 1, 0x880022); // Scarf shadow

          // Tail of scarf
          let scarfLen = 0;
          let scarfY = 0;

          if (f === 0) {
            scarfLen = 8;
            scarfY = 13;
          } else if (f === 1) {
            scarfLen = 10;
            scarfY = 12;
          } else if (f === 2) {
            scarfLen = 12;
            scarfY = 14;
          } else if (f === 3) {
            scarfLen = 10;
            scarfY = 13;
          }

          // Draw scarf tail to the left (wind blowing right to left conceptually, or just flow)
          // Let's draw it flowing behind (left side of sprite)
          // Ensure it doesn't go below x=0 to avoid bleeding into previous frame
          const scarfStartX = Math.max(0, 11 - scarfLen);
          const actualScarfLen = 11 - scarfStartX;
          if (actualScarfLen > 0) {
            headBox(scarfStartX, scarfY, actualScarfLen, 3, SCARF);
          }

          // Katana Handle on back (left side since facing right)
          headBox(9, 4, 2, 6, 0x555555);
          break;
        }
        case "leonardo": {
          const GREEN = 0x2ecc71;
          const GREEN_SHADOW = 0x27ae60;
          const SHELL_FRONT = 0xf1c40f;
          const SHELL_BACK = 0x1e8449;
          const BANDANA = 0x3498db;
          const BELT = 0x5c4033;
          const PAD = 0x5c4033;
          const STEEL = 0xbdc3c7;

          // Katanas on back (drawn first to be behind)
          if (isAttack) {
            box(9, 12, 2, 10, STEEL); // Only one katana on back
            box(9, 12, 1, 10, 0x7f8c8d);
          } else {
            box(9, 12, 2, 10, STEEL);
            box(21, 12, 2, 10, STEEL); // Blades crossing
            box(9, 12, 1, 10, 0x7f8c8d);
            box(22, 12, 1, 10, 0x7f8c8d); // Blade shadow
          }

          // Legs
          box(10, 24, 4, 6, GREEN);
          box(18, 24, 4, 6, GREEN);
          box(10, 24, 1, 6, GREEN_SHADOW);
          box(21, 24, 1, 6, GREEN_SHADOW); // Leg shadow
          box(10, 27, 4, 2, PAD);
          box(18, 27, 4, 2, PAD); // Knee pads
          box(10, 28, 4, 1, 0x3e2723);
          box(18, 28, 4, 1, 0x3e2723); // Pad shadow

          // Torso
          box(11, 14, 10, 10, GREEN);
          box(11, 14, 1, 10, GREEN_SHADOW);
          box(20, 14, 1, 10, GREEN_SHADOW); // Torso shadow
          box(12, 15, 8, 8, SHELL_FRONT); // Front shell
          box(14, 15, 4, 8, 0xe6b800); // Shell detail
          box(12, 15, 8, 1, 0xffeb3b); // Shell highlight
          box(11, 21, 10, 2, BELT); // Belt
          box(11, 22, 10, 1, 0x3e2723); // Belt shadow
          dot(15, 21, 0xaaaaaa);
          dot(16, 21, 0xaaaaaa); // Belt buckle

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, GREEN); // Right arm striking
            box(28, 14, 3, 3, PAD); // Wrist wraps stretched
            // Katana extended in hand!
            box(31, 14, 14, 2, STEEL); // Blade out
            box(31, 15, 14, 1, 0x7f8c8d); // Blade shading
            box(31, 14, 4, 4, GREEN); // Fist holding sword
            box(31, 14, 2, 2, 0xaaffaa); // Knuckles
            box(6, 15, 3, 5, GREEN); // left arm back
          } else {
            box(8, 14, 3, 8, GREEN);
            box(21, 14, 3, 8, GREEN);
            box(8, 14, 1, 8, GREEN_SHADOW);
            box(23, 14, 1, 8, GREEN_SHADOW); // Arm shadow
            box(8, 18, 3, 2, PAD);
            box(21, 18, 3, 2, PAD); // Elbow pads
            box(8, 19, 3, 1, 0x3e2723);
            box(21, 19, 3, 1, 0x3e2723); // Pad shadow
            box(8, 21, 3, 2, PAD);
            box(21, 21, 3, 2, PAD); // Wrist wraps
            box(8, 22, 3, 1, 0x3e2723);
            box(21, 22, 3, 1, 0x3e2723); // Wrap shadow
          }

          // Head
          headBox(12, 6, 8, 8, GREEN);
          headBox(12, 6, 1, 8, GREEN_SHADOW);
          headBox(19, 6, 1, 8, GREEN_SHADOW); // Head shadow
          headBox(11, 9, 10, 2, BANDANA); // Bandana
          headBox(11, 10, 10, 1, 0x2980b9); // Bandana shadow
          headBox(10, 10, 2, 4, BANDANA); // Bandana knot tail
          headBox(10, 10, 1, 4, 0x2980b9); // Knot tail shadow
          headDot(13, 9, WHITE);
          headDot(17, 9, WHITE); // Eyes
          break;
        }
        case "frieren": {
          const HAIR = 0xecf0f1;
          const HAIR_SHADOW = 0xbdc3c7;
          const COAT = 0xffffff;
          const COAT_SHADOW = 0xe0e0e0;
          const SCARF = 0x2c3e50; // Dark blue/black collar
          const GOLD = 0xf1c40f;
          const SKIN = 0xffeebb;
          const TIGHTS = 0x111111;
          const BOOTS = 0x8b4513;

          // Staff (drawn first to be behind)
          if (!isAttack) {
            box(23, 10, 2, 20, 0x8b4513); // Staff pole
            box(22, 8, 4, 3, GOLD); // Staff top
            dot(23, 7, 0xe74c3c); // Red gem
            box(24, 10, 1, 20, 0x5d4037); // Staff shadow
          }

          // Legs
          box(12, 24, 3, 6, TIGHTS);
          box(17, 24, 3, 6, TIGHTS);
          box(12, 24, 1, 6, 0x000000);
          box(17, 24, 1, 6, 0x000000); // Tights shadow
          box(11, 28, 4, 3, BOOTS);
          box(17, 28, 4, 3, BOOTS);
          box(11, 28, 1, 3, 0x5d4037);
          box(17, 28, 1, 3, 0x5d4037); // Boots shadow

          // Torso
          box(11, 14, 10, 10, COAT);
          box(11, 14, 1, 10, COAT_SHADOW);
          box(20, 14, 1, 10, COAT_SHADOW); // Coat shadow
          box(11, 14, 10, 3, SCARF); // Collar
          box(11, 16, 10, 1, 0x1a252f); // Collar shadow
          box(15, 14, 2, 10, GOLD); // Center trim
          box(11, 22, 10, 2, 0x222222); // Belt
          box(11, 23, 10, 1, 0x000000); // Belt shadow

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, COAT); // Right arm
            box(21, 14, 10, 1, COAT_SHADOW);
            box(29, 14, 2, 3, TIGHTS); // Cuff
            box(31, 14, 4, 4, SKIN); // Hand fist
            box(31, 14, 2, 2, 0xffeebb); // Knuckles

            // Staff in front
            box(32, 2, 2, 20, 0x8b4513); // Staff pole front
            box(31, 0, 4, 3, GOLD); // Staff top
            dot(32, -1, 0xe74c3c); // Red gem

            box(6, 15, 3, 6, COAT); // Left arm back
          } else {
            box(8, 14, 3, 8, COAT);
            box(21, 14, 3, 8, COAT);
            box(8, 14, 1, 8, COAT_SHADOW);
            box(23, 14, 1, 8, COAT_SHADOW); // Arm shadow
            box(8, 20, 3, 2, TIGHTS);
            box(21, 20, 3, 2, TIGHTS); // Gloves/cuffs
            box(8, 21, 3, 1, 0x000000);
            box(21, 21, 3, 1, 0x000000); // Cuff shadow
          }

          // Head
          headBox(12, 6, 8, 8, SKIN);
          headBox(12, 6, 1, 8, 0xccbb99);
          headBox(19, 6, 1, 8, 0xccbb99); // Face shadow

          // Elf Ears
          headBox(8, 9, 4, 2, SKIN);
          headBox(20, 9, 4, 2, SKIN);
          headBox(8, 10, 4, 1, 0xccbb99);
          headBox(20, 10, 4, 1, 0xccbb99); // Ear shadow

          // Hair
          headBox(11, 4, 10, 4, HAIR); // Hair top
          headBox(13, 4, 6, 1, HAIR_SHADOW);
          // Twintails
          headBox(9, 6, 3, 12, HAIR);
          headBox(20, 6, 3, 12, HAIR);
          headBox(9, 6, 1, 12, HAIR_SHADOW);
          headBox(22, 6, 1, 12, HAIR_SHADOW); // Twintail shadow
          headBox(10, 18, 2, 2, 0xcc0000);
          headBox(20, 18, 2, 2, 0xcc0000); // Red hair ties

          // Face
          headDot(14, 9, 0x27ae60);
          headDot(17, 9, 0x27ae60); // Eyes
          headDot(13, 8, HAIR_SHADOW);
          headDot(18, 8, HAIR_SHADOW); // Eyebrows
          break;
        }
        case "optimus": {
          const RED = 0xe74c3c;
          const RED_SHADOW = 0xc0392b;
          const BLUE = 0x2980b9;
          const BLUE_SHADOW = 0x1f618d;
          const SILVER = 0xbdc3c7;
          const DARK_METAL = 0x7f8c8d;
          const YELLOW = 0xf1c40f;
          const WINDOW = 0x87ceeb;
          const TIRE = 0x111111;

          if (isTransformed) {
            // TRUCK MODE REMASTER
            // Tires (more rounded)
            box(6, 24, 4, 8, TIRE);
            box(22, 24, 4, 8, TIRE); // Front
            box(6, 16, 4, 8, TIRE);
            box(22, 16, 4, 8, TIRE); // Back
            box(7, 25, 2, 6, DARK_METAL);
            box(23, 25, 2, 6, DARK_METAL); // Hubcaps
            box(7, 17, 2, 6, DARK_METAL);
            box(23, 17, 2, 6, DARK_METAL); // Hubcaps

            // Trailer connection / back legs area (Blue)
            box(10, 18, 12, 10, BLUE);
            box(11, 19, 10, 8, BLUE_SHADOW);

            // Main Cab (Red)
            box(8, 8, 16, 14, RED);
            box(9, 9, 14, 12, RED_SHADOW);
            box(10, 10, 12, 10, RED);

            // Windshield (split and angled)
            box(9, 10, 6, 5, WINDOW);
            box(17, 10, 6, 5, WINDOW);
            box(10, 11, 4, 3, 0xffffff);
            box(18, 11, 4, 3, 0xffffff); // Glint

            // Grill (detailed)
            box(13, 15, 6, 10, SILVER);
            box(14, 16, 1, 8, DARK_METAL);
            box(17, 16, 1, 8, DARK_METAL);

            // Bumper
            box(7, 25, 18, 4, SILVER);
            box(8, 26, 16, 2, DARK_METAL);

            // Headlights
            box(8, 25, 3, 3, YELLOW);
            box(21, 25, 3, 3, YELLOW);
            dot(9, 26, 0xffffff);
            dot(22, 26, 0xffffff);

            // Smokestacks
            box(5, 2, 2, 12, SILVER);
            box(25, 2, 2, 12, SILVER);
            box(6, 2, 1, 12, 0xffffff);
            box(26, 2, 1, 12, 0xffffff); // Highlight

            // Top lights
            box(10, 7, 12, 2, SILVER);
            dot(11, 7, YELLOW);
            dot(15, 7, YELLOW);
            dot(16, 7, YELLOW);
            dot(20, 7, YELLOW);
          } else {
            // ROBOT MODE REMASTER
            // Legs (Blue with silver thighs)
            box(10, 24, 5, 8, BLUE);
            box(17, 24, 5, 8, BLUE);
            box(10, 24, 1, 8, BLUE_SHADOW);
            box(21, 24, 1, 8, BLUE_SHADOW); // Leg shading
            box(11, 22, 3, 3, SILVER);
            box(18, 22, 3, 3, SILVER); // Thighs
            box(11, 22, 1, 3, DARK_METAL);
            box(18, 22, 1, 3, DARK_METAL); // Thigh shading
            box(10, 30, 5, 2, BLUE_SHADOW);
            box(17, 30, 5, 2, BLUE_SHADOW); // Feet
            box(10, 31, 5, 1, 0x111111);
            box(17, 31, 5, 1, 0x111111); // Foot shadow

            // Torso (Red cab)
            box(9, 12, 14, 10, RED);
            box(9, 12, 1, 10, RED_SHADOW);
            box(22, 12, 1, 10, RED_SHADOW); // Torso shadow
            box(10, 13, 12, 8, RED_SHADOW);
            box(11, 14, 10, 6, RED);

            // Windshield Windows (Chest)
            box(10, 13, 5, 5, WINDOW);
            box(17, 13, 5, 5, WINDOW);
            box(11, 14, 3, 2, 0xffffff);
            box(18, 14, 3, 2, 0xffffff); // Glint

            // Center grill (Abdomen)
            box(13, 18, 6, 4, SILVER);
            box(14, 18, 1, 4, DARK_METAL);
            box(17, 18, 1, 4, DARK_METAL);

            // Waist/Bumper
            box(10, 21, 12, 3, SILVER);
            box(10, 23, 12, 1, DARK_METAL); // Bumper shadow
            box(11, 21, 2, 2, YELLOW);
            box(19, 21, 2, 2, YELLOW); // Headlights

            // Arms
            if (isAttack) {
              // Right arm blasting / punching
              box(21, 12, 12, 4, RED); // Arm extended
              box(21, 12, 12, 1, RED_SHADOW);
              box(33, 12, 4, 4, BLUE); // Fist/cannon
              box(33, 12, 2, 2, 0x88ccff); // Glow detail

              box(6, 13, 4, 6, RED); // Left arm back
              box(6, 18, 3, 3, BLUE);
            } else {
              box(5, 12, 4, 8, RED);
              box(23, 12, 4, 8, RED);
              box(4, 11, 6, 4, RED_SHADOW);
              box(22, 11, 6, 4, RED_SHADOW); // Shoulders
              box(4, 14, 6, 1, 0x880000);
              box(22, 14, 6, 1, 0x880000); // Shoulder shadow
              box(5, 18, 4, 5, BLUE);
              box(23, 18, 4, 5, BLUE); // Forearms
              box(5, 18, 1, 5, BLUE_SHADOW);
              box(26, 18, 1, 5, BLUE_SHADOW); // Forearm shading
              box(5, 22, 4, 2, BLUE_SHADOW);
              box(23, 22, 4, 2, BLUE_SHADOW); // Hands
              box(5, 23, 4, 1, 0x111111);
              box(23, 23, 4, 1, 0x111111); // Hand shadow
            }

            // Smokestacks (Shoulders)
            box(4, 5, 2, 7, SILVER);
            box(26, 5, 2, 7, SILVER);
            box(5, 5, 1, 7, DARK_METAL);
            box(27, 5, 1, 7, DARK_METAL); // Stack shadow

            // Head
            headBox(13, 5, 6, 7, BLUE);
            headBox(13, 5, 1, 7, BLUE_SHADOW);
            headBox(18, 5, 1, 7, BLUE_SHADOW); // Head shadow
            headBox(14, 5, 4, 2, SILVER); // Crest
            headBox(14, 5, 4, 1, 0xffffff); // Crest highlight
            headBox(12, 6, 1, 4, BLUE);
            headBox(19, 6, 1, 4, BLUE); // Antennae
            headBox(14, 8, 4, 4, SILVER); // Faceplate
            headBox(14, 11, 4, 1, DARK_METAL); // Faceplate shadow
            headBox(15, 9, 2, 3, DARK_METAL); // Mouthplate detail
            headDot(14, 7, 0x00ffff);
            headDot(17, 7, 0x00ffff); // Eyes
          }
          break;
        }
        case "naruto": {
          const SKIN = 0xffccaa;
          const ORANGE = 0xff8800;
          const BLACK = 0x111111;
          const BLUE = 0x2244aa;
          const YELLOW_HAIR = 0xffdd00;
          const RED_COAT = 0xcc0000;

          const K_ORANGE = 0xffaa00; // Kurama mode base
          const K_YELLOW = 0xffff00; // Kurama mode glow
          const K_BLACK = 0x000000; // Markings

          const isSageMode = form === 1;
          const isKuramaMode = form === 2;

          if (isKuramaMode) {
            // Truth-Seeking Orbs (floating behind)
            const orbY = breatheOffset - 4 + Math.sin(f * Math.PI) * 2;
            box(4, orbY, 4, 4, K_BLACK);
            box(24, orbY + 4, 4, 4, K_BLACK);
            box(6, orbY + 12, 4, 4, K_BLACK);
            box(22, orbY + 16, 4, 4, K_BLACK);
          }

          const suitColor = isKuramaMode ? K_ORANGE : ORANGE;
          const detailColor = isKuramaMode ? K_BLACK : BLACK;
          const skinColor = isKuramaMode ? K_YELLOW : SKIN;
          const hairColor = isKuramaMode ? K_YELLOW : YELLOW_HAIR;
          const suitShadow = isKuramaMode ? 0xcc8800 : 0xcc6600;
          const SAGE_ORANGE = 0xff4400;

          // Scroll on back (drawn before torso so it's behind)
          if (isSageMode) {
            box(8, 15, 16, 8, 0xdddddd); // Scroll base
            box(7, 16, 18, 6, 0x880000); // Scroll ends
            box(10, 15, 12, 8, 0xeeeeee); // Scroll inner
            box(8, 23, 16, 1, 0xaaaaaa); // Scroll shadow
          }

          // Legs
          box(10, 24, 4, 6, suitColor);
          box(18, 24, 4, 6, suitColor);
          box(10, 24, 1, 6, suitShadow);
          box(21, 24, 1, 6, suitShadow); // Leg shadow
          // Shoes/Sandals
          box(10, 30, 4, 2, detailColor);
          box(18, 30, 4, 2, detailColor);
          box(10, 31, 4, 1, 0x000000);
          box(18, 31, 4, 1, 0x000000); // Shoe shadow
          if (!isKuramaMode) {
            // Bandages on right leg
            box(10, 26, 4, 2, 0xeeeeee);
            box(10, 27, 4, 1, 0xcccccc); // Bandage shadow
            // Holster on right leg
            box(13, 25, 2, 3, BLACK);
          }

          // Torso
          box(11, 14, 10, 10, suitColor);
          box(11, 14, 1, 10, suitShadow);
          box(20, 14, 1, 10, suitShadow); // Torso shadow
          if (isKuramaMode) {
            // Magatama markings on chest
            box(13, 16, 2, 2, K_BLACK);
            box(17, 16, 2, 2, K_BLACK);
            box(15, 18, 2, 2, K_BLACK);
            // Center line
            box(15, 20, 2, 4, K_BLACK);
          } else {
            // Jacket zipper/black details
            box(15, 14, 2, 10, BLACK);
            box(11, 14, 10, 3, BLACK); // Shoulders
            box(11, 16, 10, 1, 0x000000); // Shoulder shadow
            // Orange collar
            box(11, 13, 10, 2, ORANGE);
            box(11, 14, 10, 1, 0xcc6600); // Collar shadow
            // White swirl on left arm
            box(21, 16, 2, 2, 0xeeeeee);

            if (isSageMode) {
              // Red Coat (Open in the front)
              // Left side
              box(9, 14, 4, 12, RED_COAT);
              box(9, 14, 1, 12, 0x880000); // Coat shadow
              box(9, 24, 4, 2, BLACK); // Flames
              // Right side
              box(19, 14, 4, 12, RED_COAT);
              box(22, 14, 1, 12, 0x880000); // Coat shadow
              box(19, 24, 4, 2, BLACK); // Flames
            }
          }

          // Arms
          if (isAttack) {
            if (isSageMode) {
              box(21, 13, 6, 5, RED_COAT); // thick coat upper arm
              box(21, 13, 1, 5, 0x880000);
              box(27, 14, 5, 3, RED_COAT); // coat lower arm
              box(31, 14, 2, 3, suitColor); // undershirt
              box(32, 14, 4, 4, skinColor); // fist
              box(32, 14, 2, 2, 0xffeebb); // Knuckles
              alphaBox(34, 14, 4, 3, skinColor, 0.4); // blur
              box(5, 15, 4, 5, RED_COAT);
            } else {
              box(21, 13, 6, 4, suitColor); // Right upper arm
              box(21, 13, 1, 4, suitShadow);
              box(27, 14, 5, 3, suitColor); // Right lower arm
              box(31, 14, 4, 4, skinColor); // Hand out
              box(31, 14, 2, 2, 0xffeebb); // Knuckles
              alphaBox(33, 14, 4, 3, skinColor, 0.4); // blur
              box(5, 15, 4, 5, suitColor); // Left held back
            }
          } else {
            if (isSageMode) {
              box(6, 14, 4, 6, RED_COAT);
              box(22, 14, 4, 6, RED_COAT); // Coat sleeves
              box(6, 14, 1, 6, 0x880000);
              box(25, 14, 1, 6, 0x880000); // Sleeve shadow
              box(7, 20, 3, 3, skinColor);
              box(22, 20, 3, 3, skinColor); // Hands
              box(7, 22, 3, 1, 0xcc9977);
              box(22, 22, 3, 1, 0xcc9977); // Hand shadow
            } else {
              box(8, 14, 3, 6, suitColor);
              box(21, 14, 3, 6, suitColor);
              box(8, 14, 1, 6, suitShadow);
              box(23, 14, 1, 6, suitShadow); // Arm shadow
              box(8, 20, 3, 3, skinColor);
              box(21, 20, 3, 3, skinColor); // Hands
              box(8, 22, 3, 1, 0xcc9977);
              box(21, 22, 3, 1, 0xcc9977); // Hand shadow
            }
          }

          // Head
          headBox(12, 6, 8, 7, skinColor);
          headBox(12, 6, 1, 7, 0xcc9977);
          headBox(19, 6, 1, 7, 0xcc9977); // Face shadow

          // Headband
          if (isKuramaMode) {
            headBox(11, 5, 10, 2, suitColor);
            headBox(13, 5, 6, 2, K_BLACK); // Plate
          } else {
            headBox(11, 5, 10, 2, BLUE); // Blue headband
            headBox(13, 5, 6, 2, 0xaaaaaa); // Metal plate
          }

          // Eyes
          if (isKuramaMode) {
            headBox(13, 8, 2, 2, K_ORANGE);
            headBox(17, 8, 2, 2, K_ORANGE);
            headDot(13, 8, K_BLACK);
            headDot(17, 8, K_BLACK); // Cross/slit pupils
          } else if (isSageMode) {
            // Orange pigmentation around eyes (subtle border)
            headBox(12, 7, 4, 3, SAGE_ORANGE);
            headBox(16, 7, 4, 3, SAGE_ORANGE);
            // Yellow eyes
            headBox(13, 8, 2, 2, K_YELLOW);
            headBox(17, 8, 2, 2, K_YELLOW);
            // Horizontal slit pupils
            headBox(13, 8, 2, 1, BLACK);
            headBox(17, 8, 2, 1, BLACK);
          } else {
            headBox(13, 8, 2, 2, WHITE);
            headBox(17, 8, 2, 2, WHITE);
            headDot(14, 8, BLUE);
            headDot(17, 8, BLUE);
          }

          // Whisker marks
          const whiskerColor = isKuramaMode ? K_BLACK : 0x884422;
          // Thicker whiskers for Kurama mode
          if (isKuramaMode) {
            headBox(11, 10, 3, 1, whiskerColor);
            headBox(11, 12, 3, 1, whiskerColor);
            headBox(18, 10, 3, 1, whiskerColor);
            headBox(18, 12, 3, 1, whiskerColor);
          } else {
            headBox(12, 10, 2, 1, whiskerColor);
            headBox(12, 12, 2, 1, whiskerColor);
            headBox(18, 10, 2, 1, whiskerColor);
            headBox(18, 12, 2, 1, whiskerColor);
          }

          // Subtle Expressions
          if (isAttack) {
            headBox(15, 11, 2, 1, 0x440000); // Small open mouth
          } else if (isDefend) {
            headBox(15, 11, 2, 1, WHITE); // Clenched teeth
          } else {
            headDot(16, 11, 0x222222); // Smirk corner
          }

          // Spiky Hair
          if (isKuramaMode) {
            // Even more massive spiky hair
            headBox(10, 0, 12, 5, hairColor);
            headBox(12, -4, 3, 4, hairColor);
            headBox(17, -4, 3, 4, hairColor);
            headBox(14, -6, 4, 6, hairColor);
            headBox(8, 2, 3, 4, hairColor);
            headBox(21, 2, 3, 4, hairColor);
            // Horn-like chakra spikes
            headBox(10, -8, 2, 6, hairColor);
            headBox(20, -8, 2, 6, hairColor);
          } else {
            headBox(11, 2, 10, 3, hairColor);
            headBox(12, -1, 3, 3, hairColor);
            headBox(17, -1, 3, 3, hairColor);
            headBox(14, -3, 4, 5, hairColor);
            headBox(9, 3, 3, 3, hairColor);
            headBox(20, 3, 3, 3, hairColor);
            // Sideburns
            headBox(11, 5, 1, 3, hairColor);
            headBox(20, 5, 1, 3, hairColor);
          }
          break;
        }
        case "chapolim": {
          // ==========================================
          // === EL CHAPULIN COLORADO (CLASSIC REMASTER 2) ===
          // ==========================================
          const RED_DK = 0x8a0000;
          const RED_MD = 0xcc0000;
          const RED_LT = 0xff1a1a;
          
          const YELLOW_DK = 0xc29900;
          const YELLOW_MD = 0xffcc00;
          const YELLOW_LT = 0xffeb66;
          
          const SKIN_DK = 0xc48f6c;
          const SKIN_MD = 0xeabb96;
          const SKIN_LT = 0xffdbb8;
          
          const BLACK = 0x111111;
          const WHITE = 0xffffff;

          // 1. CHIPOTE CHILLÓN (Mallet) - Back Layer
          const malletY = isAttack ? 12 : (f % 2 === 0 ? 14 : 15);
          if (isAttack) {
            // Huge Swinging Mallet - Forward smash position
            box(22, 13, 14, 3, YELLOW_DK); // Handle shadow
            box(22, 14, 14, 2, YELLOW_MD); // Handle swinging horizontally
            box(24, 14, 12, 1, YELLOW_LT); // Handle highlight
            
            // Hammer head smashing forward
            box(34, 8, 10, 14, RED_DK); // Hammer body shadow
            box(35, 9, 8, 12, RED_MD); // Hammer body
            box(35, 9, 8, 2, RED_LT); // Upper Highlight
            box(35, 11, 2, 8, RED_LT); // Side highlight
            
            box(34, 12, 2, 6, YELLOW_DK); // Left cap shadow
            box(35, 12, 1, 6, YELLOW_MD); // Left cap
            box(42, 12, 3, 6, YELLOW_DK); // Right cap (Smash point) shadow
            box(43, 12, 2, 6, YELLOW_MD); // Right cap (Smash point)
          } else {
            // Resting Mallet on his back (Fixed position)
            box(23, 6, 3, 15, YELLOW_DK); // Handle shadow
            box(24, 6, 2, 15, YELLOW_MD); // Handle
            box(25, 6, 1, 15, YELLOW_LT); // Handle highlight
            
            box(18, 1, 12, 10, RED_DK); // Base Hammer shadow
            box(19, 2, 10, 8, RED_MD); // Hammer Core
            box(19, 2, 10, 2, RED_LT); // Highlight top
            box(19, 4, 2, 4, RED_LT); // Highlight side
            
            box(16, 4, 3, 4, YELLOW_DK); // Left cap shadow
            box(17, 4, 2, 4, YELLOW_MD); // Left cap
            box(29, 4, 3, 4, YELLOW_DK); // Right cap shadow
            box(29, 4, 2, 4, YELLOW_MD); // Right cap
          }

          // 2. LEGS & SHORTS
          // Shorts (Yellow shorts)
          box(10, 21, 12, 5, YELLOW_MD);
          box(11, 25, 10, 1, YELLOW_DK); // Short edge shadow
          
          // Legs (Red Tights)
          box(11, 26, 3, 4, RED_MD); // Left leg
          box(10, 26, 1, 4, RED_DK); 
          
          box(18, 26, 3, 4, RED_MD); // Right leg
          box(20, 26, 1, 4, RED_DK); 
          
          // 3. ICONIC YELLOW CONVERSE SHOES
          // Left Shoe
          box(8, 30, 6, 4, YELLOW_MD); // High-top canvas
          box(9, 31, 5, 3, YELLOW_LT); // Canvas highlight
          box(8, 34, 7, 2, WHITE); // White Sole thick
          box(8, 35, 7, 1, 0xdddddd); // Sole shadow
          box(13, 32, 2, 2, WHITE); // White Toe Cap
          box(10, 31, 1, 3, WHITE); // Laces
          box(12, 31, 1, 3, WHITE); // Laces
          dot(11, 32, RED_DK); // Red Star
          // Right Shoe
          box(17, 30, 6, 4, YELLOW_MD); // High-top canvas
          box(18, 31, 5, 3, YELLOW_LT); // Canvas highlight
          box(17, 34, 7, 2, WHITE); // White Sole thick
          box(17, 35, 7, 1, 0xdddddd); // Sole shadow
          box(17, 32, 2, 2, WHITE); // White Toe Cap
          box(19, 31, 1, 3, WHITE); // Laces
          box(21, 31, 1, 3, WHITE); // Laces
          dot(20, 32, RED_DK); // Red Star

          // 4. TORSO (Red Suit)
          box(9, 13, 14, 8, RED_DK); // Base shadow
          box(10, 13, 12, 8, RED_MD); // Core uniform
          box(10, 14, 3, 6, RED_LT); // Chest highlight left
          
          // 5. HEART BADGE (Simbolo do Coração - Updated Proportion)
          box(12, 15, 8, 5, YELLOW_MD); // Top width (wider for centering)
          box(13, 20, 6, 1, YELLOW_MD); // Lower taper
          box(15, 21, 2, 1, YELLOW_MD); // Bottom point
          
          // The "CH" (Classic Red Letters - perfectly centered)
          // C
          box(13, 16, 2, 1, RED_DK);
          box(13, 17, 1, 2, RED_DK);
          box(13, 19, 2, 1, RED_DK);
          // H
          box(16, 16, 1, 4, RED_DK);
          box(18, 16, 1, 4, RED_DK);
          box(17, 17, 1, 2, RED_DK);

          // 6. ARMS
          if (isAttack) {
            box(21, 14, 10, 4, RED_MD); // Right arm forward
            box(21, 17, 10, 1, RED_DK); // Bottom arm shadow
            box(30, 13, 4, 4, SKIN_MD); // Hand holding mallet
            box(30, 14, 2, 2, SKIN_LT); // Knuckles
            
            box(5, 15, 4, 5, RED_DK);   // Left arm back
            box(6, 15, 3, 5, RED_MD); 
            box(5, 20, 4, 3, SKIN_MD); 
          } else {
            // Resting arms
            box(7, 14, 4, 7, RED_DK); // L Arm Shadow
            box(8, 14, 3, 7, RED_MD); // L Arm
            box(8, 15, 1, 5, RED_LT); // L Arm highlight
            
            box(21, 14, 4, 7, RED_DK); // R Arm Shadow
            box(21, 14, 3, 7, RED_MD); 
            
            // Hands
            box(6, 21, 5, 3, SKIN_DK); 
            box(7, 21, 3, 2, SKIN_MD); // L Hand
            
            box(21, 21, 5, 3, SKIN_DK); 
            box(22, 21, 3, 2, SKIN_MD); // R Hand
          }

          // 7. CABESTRO / CAPUZ (The Red Hood)
          headBox(10, 4, 12, 10, RED_DK); // Hood shadow
          headBox(11, 3, 10, 10, RED_MD); // Hood base
          headBox(11, 4, 3, 4, RED_LT);  // Hood highlight

          // 8. FACE (Rosto Serio/Nobre - Menos Engraçado)
          headBox(12, 6, 8, 6, SKIN_MD); // Face core
          headBox(12, 11, 8, 1, SKIN_DK); // Chin shadow
          headBox(13, 6, 6, 2, SKIN_LT); // Forehead light
          
          // Eyes (Normal, strong look)
          headBox(13, 8, 2, 1, WHITE);
          headBox(17, 8, 2, 1, WHITE);
          headDot(14, 8, BLACK); // Pupil L
          headDot(17, 8, BLACK); // Pupil R
          
          // Nose
          headBox(15, 9, 2, 1, SKIN_DK);
          
          // Mouth (Determined, smaller)
          headBox(15, 11, 2, 1, 0x8a0000); // 2px wide, determined smirk

          // 9. ANTENINHAS DE VINIL (The Antennas!)
          const jiggle = (f % 4 < 2) ? 1 : 0;
          // Stems
          headBox(12, 0, 1, 3, RED_DK); // Left Stem
          headBox(19, 0, 1, 3, RED_DK); // Right Stem
          
          // Pompoms (Yellow fuzzy balls)
          headBox(11 - jiggle, -2, 3, 3, YELLOW_MD); // L Pompom
          headDot(12 - jiggle, -2, YELLOW_LT); // L highlight
          
          headBox(18 + jiggle, -2, 3, 3, YELLOW_MD); // R Pompom
          headDot(19 + jiggle, -2, YELLOW_LT); // R highlight
          break;
        }
        case "batman": {
          const isArmored = form === 1;
          const SUIT_GREY = isArmored ? 0x2c3e50 : 0x34495e;
          const SUIT_SHADOW = isArmored ? 0x1a252f : 0x2c3e50;
          const BLACK = 0x111111;
          const YELLOW = 0xf1c40f;
          const SKIN = 0xffce9e;
          const ARMOR_GLOW = 0x00ffff; // Cyan glow for armored eyes

          // Cape (Drawn first to be behind)
          const capeColor = isArmored ? 0x1a1a1a : 0x000000;
          box(6, 14, 20, 18, capeColor);
          box(5, 16, 22, 14, capeColor);
          // Scalloped edges
          dot(7, 32, capeColor);
          dot(11, 32, capeColor);
          dot(15, 32, capeColor);
          dot(19, 32, capeColor);
          dot(23, 32, capeColor);

          // Legs
          box(11, 24, 4, 6, SUIT_GREY);
          box(17, 24, 4, 6, SUIT_GREY);
          box(11, 24, 1, 6, SUIT_SHADOW);
          box(20, 24, 1, 6, SUIT_SHADOW); // Leg shadow
          // Boots
          box(10, 28, 5, 4, BLACK);
          box(17, 28, 5, 4, BLACK);
          box(10, 31, 5, 1, 0x000000);
          box(17, 31, 5, 1, 0x000000); // Boot shadow
          if (isArmored) {
            // Armor plates on legs
            box(11, 25, 4, 2, 0x7f8c8d);
            box(17, 25, 4, 2, 0x7f8c8d);
            box(11, 26, 4, 1, 0x556666);
            box(17, 26, 4, 1, 0x556666); // Plate shadow
          }

          // Torso
          box(10, 14, 12, 10, SUIT_GREY);
          box(10, 14, 1, 10, SUIT_SHADOW);
          box(21, 14, 1, 10, SUIT_SHADOW); // Torso shadow
          // Bat Symbol
          box(13, 16, 6, 3, BLACK);
          dot(12, 16, BLACK);
          dot(19, 16, BLACK); // Wings
          dot(15, 15, BLACK);
          dot(16, 15, BLACK); // Ears of the bat

          // Utility Belt
          box(10, 22, 12, 2, YELLOW);
          box(10, 23, 12, 1, 0xccaa00); // Belt shadow
          box(11, 22, 2, 2, 0xd4ac0d); // Pouches
          box(15, 22, 2, 2, 0xd4ac0d);
          box(19, 22, 2, 2, 0xd4ac0d);

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, SUIT_GREY); // Right arm throwing
            box(21, 14, 10, 1, SUIT_SHADOW);
            box(28, 14, 3, 3, BLACK); // Gauntlet
            box(31, 14, 4, 4, BLACK); // Glove Fist
            box(31, 14, 2, 2, 0x444444); // Knuckles
            box(34, 15, 4, 1, 0x555555); // Batarang

            box(6, 15, 3, 5, SUIT_GREY); // Left arm pulled
            box(6, 20, 3, 3, BLACK); // Left glove
          } else {
            box(7, 14, 3, 7, SUIT_GREY);
            box(22, 14, 3, 7, SUIT_GREY);
            box(7, 14, 1, 7, SUIT_SHADOW);
            box(24, 14, 1, 7, SUIT_SHADOW); // Arm shadow
            // Gauntlets
            box(6, 18, 4, 5, BLACK);
            box(22, 18, 4, 5, BLACK);
            box(6, 22, 4, 1, 0x000000);
            box(22, 22, 4, 1, 0x000000); // Gauntlet shadow
            // Fins on gauntlets
            dot(5, 19, BLACK);
            dot(5, 21, BLACK);
            dot(26, 19, BLACK);
            dot(26, 21, BLACK);
          }

          // Head (Cowl)
          headBox(11, 5, 10, 9, BLACK);
          headBox(11, 5, 1, 9, 0x000000);
          headBox(20, 5, 1, 9, 0x000000); // Cowl shadow
          if (isArmored) {
            headBox(12, 7, 8, 6, 0x34495e); // Metal faceplate
            headBox(12, 7, 1, 6, 0x1a252f);
            headBox(19, 7, 1, 6, 0x1a252f); // Faceplate shadow
            headBox(13, 9, 2, 1, ARMOR_GLOW);
            headBox(17, 9, 2, 1, ARMOR_GLOW); // Glowing eyes
          } else {
            headBox(12, 8, 8, 5, SKIN); // Face opening
            headBox(12, 8, 1, 5, 0xccaa88);
            headBox(19, 8, 1, 5, 0xccaa88); // Face shadow
            headBox(13, 9, 2, 1, 0xffffff);
            headBox(17, 9, 2, 1, 0xffffff); // White eyes
            headBox(12, 11, 8, 2, SKIN); // Chin
          }

          // Bat Ears
          headBox(11, 2, 2, 4, BLACK);
          headBox(19, 2, 2, 4, BLACK);
          break;
        }
        case "thukuna": {
          const isTransformed = form === 1;
          const SKIN = 0xffd3b6;
          const SKIN_SHADOW = 0xe0ac88;
          const HAIR = 0xffa6c9; // Salmon pink
          const HAIR_SHADOW = 0x1a1a1a; // Dark undercut
          const TATTOO = 0x111111;
          const PANTS = 0x1e272e;
          const SHOES = 0x8b0000;

          const ROBE_NORMAL = 0x1e272e;
          const ROBE_NORMAL_SHADOW = 0x0f1417;
          const HOOD = 0xc0392b;

          const ROBE_TRANS = 0xf5f6fa;
          const ROBE_TRANS_SHADOW = 0xdcdde1;
          const SASH = 0x2f3640;

          // Legs
          box(11, 24, 4, 5, PANTS);
          box(17, 24, 4, 5, PANTS);
          box(11, 24, 1, 5, 0x0f1417);
          box(20, 24, 1, 5, 0x0f1417); // Pants shadow

          // Shoes
          box(10, 29, 5, 3, SHOES);
          box(17, 29, 5, 3, SHOES);
          box(10, 31, 5, 1, 0x590000);
          box(17, 31, 5, 1, 0x590000); // Shoe soles

          if (isTransformed) {
            // TRUE FORM (Heian Era)

            // Extra Arms (Lower/Back) - thinner and positioned better
            box(8, 16, 2, 6, SKIN);
            box(22, 16, 2, 6, SKIN); // Extra arms
            box(8, 16, 1, 6, SKIN_SHADOW);
            box(23, 16, 1, 6, SKIN_SHADOW); // Extra arm shadow
            box(8, 20, 2, 2, TATTOO);
            box(22, 20, 2, 2, TATTOO); // Wrist tattoos

            // Main Arms - proportionate
            if (isAttack) {
              box(21, 14, 10, 3, SKIN); // Right main arm extending
              box(21, 14, 10, 1, SKIN_SHADOW);
              box(25, 14, 1, 3, TATTOO);
              box(28, 14, 1, 3, TATTOO);
              box(31, 14, 4, 4, SKIN); // Fist
              box(31, 14, 2, 2, 0xffeebb); // Knuckles
              box(6, 15, 3, 6, SKIN); // Left main arm back
            } else {
              box(9, 14, 3, 7, SKIN);
              box(20, 14, 3, 7, SKIN);
              box(9, 14, 1, 7, SKIN_SHADOW);
              box(22, 14, 1, 7, SKIN_SHADOW); // Main arm shadow
              box(9, 18, 3, 3, SKIN_SHADOW);
              box(20, 18, 3, 3, SKIN_SHADOW); // Forearm shading
              box(9, 16, 3, 1, TATTOO);
              box(20, 16, 3, 1, TATTOO); // Arm bands
              box(9, 19, 3, 1, TATTOO);
              box(20, 19, 3, 1, TATTOO);
            }

            // Torso (Exposed chest) - slimmer
            box(12, 14, 8, 5, SKIN); // Exposed chest
            box(12, 14, 1, 5, SKIN_SHADOW);
            box(19, 14, 1, 5, SKIN_SHADOW); // Chest shadow
            box(14, 17, 4, 1, SKIN_SHADOW); // Abs shading

            // Chest Tattoos
            box(13, 15, 6, 1, TATTOO); // Collarbone line
            box(15, 16, 2, 3, TATTOO); // Center chest

            // Sash (Obi)
            box(11, 18, 10, 3, SASH);
            box(11, 20, 10, 1, 0x1a1a1a); // Sash bottom shadow

            // Sash Knot & Dangle
            box(14, 18, 4, 3, 0x1a1a1a); // Knot
            box(14, 21, 3, 5, SASH); // Dangling fabric
            box(16, 21, 1, 5, 0x1a1a1a); // Dangle shadow

            // White Hakama (Baggy Pants)
            // Left Leg
            box(9, 21, 6, 8, ROBE_TRANS); // Main left leg
            box(8, 25, 2, 4, ROBE_TRANS); // Left flare
            box(9, 21, 1, 8, ROBE_TRANS_SHADOW); // Left outer shadow
            box(11, 22, 1, 7, ROBE_TRANS_SHADOW); // Left fold 1
            box(13, 21, 1, 8, ROBE_TRANS_SHADOW); // Left fold 2
            box(14, 21, 1, 8, 0xc8c9ce); // Left inner deep shadow

            // Right Leg
            box(17, 21, 6, 8, ROBE_TRANS); // Main right leg
            box(22, 25, 2, 4, ROBE_TRANS); // Right flare
            box(22, 21, 1, 8, ROBE_TRANS_SHADOW); // Right outer shadow
            box(20, 22, 1, 7, ROBE_TRANS_SHADOW); // Right fold 1
            box(18, 21, 1, 8, ROBE_TRANS_SHADOW); // Right fold 2
            box(17, 21, 1, 8, 0xc8c9ce); // Right inner deep shadow

            // Crotch connection
            box(15, 21, 2, 4, ROBE_TRANS_SHADOW);
            box(15, 21, 2, 2, ROBE_TRANS);

            // Head - standard size
            headBox(12, 6, 8, 8, SKIN);
            // Right side face deformity (Heian mask)
            headBox(16, 5, 5, 9, SKIN_SHADOW); // Mask base
            headBox(17, 6, 3, 7, 0xcc9977); // Mask detail

            // Hair (Spikier, wilder)
            headBox(11, 2, 10, 4, HAIR);
            headBox(10, 4, 2, 4, HAIR);
            headBox(20, 4, 2, 4, HAIR);
            headBox(12, 0, 2, 3, HAIR);
            headBox(15, -1, 2, 3, HAIR);
            headBox(18, 0, 2, 3, HAIR);

            // Eyebrows
            headBox(13, 8, 2, 1, HAIR);
            headBox(17, 8, 2, 1, HAIR);

            // Eyes (4 eyes)
            headBox(13, 9, 2, 1, 0xffffff);
            headBox(17, 9, 2, 1, 0xffffff); // Main Sclera
            headBox(14, 9, 1, 1, 0xff0000);
            headBox(17, 9, 1, 1, 0xff0000); // Main Pupils

            headBox(17, 11, 2, 1, 0xffffff); // Extra right eye lower
            headBox(17, 11, 1, 1, 0xff0000);
            headBox(17, 7, 2, 1, 0xffffff); // Extra right eye upper
            headBox(17, 7, 1, 1, 0xff0000);

            // Nose
            headBox(15, 11, 2, 1, SKIN_SHADOW);

            // Face Tattoos (Removed under-eye and forehead lines to clean up face)
          } else {
            // YUJI FORM

            // Arms (Uniform sleeves)
            if (isAttack) {
              box(21, 14, 10, 3, ROBE_NORMAL); // Right arm slash
              box(21, 14, 10, 1, ROBE_NORMAL_SHADOW);
              box(31, 14, 4, 4, SKIN); // Fist
              box(31, 14, 2, 2, 0xffeebb); // Knuckles
              box(31, 14, 3, 1, TATTOO); // Fist tattoo

              box(6, 15, 3, 5, ROBE_NORMAL); // Left arm
              box(6, 20, 3, 3, SKIN);
            } else {
              box(7, 14, 3, 7, ROBE_NORMAL);
              box(22, 14, 3, 7, ROBE_NORMAL);
              box(7, 14, 1, 7, ROBE_NORMAL_SHADOW);
              box(24, 14, 1, 7, ROBE_NORMAL_SHADOW);

              // Hands
              box(7, 21, 3, 2, SKIN);
              box(22, 21, 3, 2, SKIN);
              box(7, 21, 3, 1, TATTOO);
              box(22, 21, 3, 1, TATTOO); // Hand tattoos
              box(7, 22, 3, 1, SKIN_SHADOW);
              box(22, 22, 3, 1, SKIN_SHADOW); // Hand shadow
            }

            // Torso (Uniform)
            box(10, 14, 12, 10, ROBE_NORMAL);
            box(10, 14, 2, 10, ROBE_NORMAL_SHADOW);
            box(20, 14, 2, 10, ROBE_NORMAL_SHADOW);

            // Red Hood
            box(11, 13, 10, 3, HOOD);
            box(11, 15, 10, 1, 0x8b0000); // Hood shadow

            // Head
            headBox(11, 5, 10, 9, SKIN);
            headBox(11, 5, 1, 9, SKIN_SHADOW);
            headBox(20, 5, 1, 9, SKIN_SHADOW); // Face shadow

            // Hair (Undercut + Spiky top)
            headBox(10, 5, 1, 4, HAIR_SHADOW);
            headBox(21, 5, 1, 4, HAIR_SHADOW); // Undercut
            headBox(10, 2, 12, 3, HAIR);
            headBox(11, 1, 3, 2, HAIR);
            headBox(15, 0, 2, 2, HAIR);
            headBox(18, 1, 3, 2, HAIR);

            // Face Tattoos (Removed under-eye and forehead lines to clean up face)
            headBox(15, 11, 2, 1, TATTOO); // Chin
            headBox(11, 9, 1, 1, TATTOO);
            headBox(20, 9, 1, 1, TATTOO); // Cheeks

            // Eyes
            headBox(12, 8, 2, 1, 0xffffff);
            headBox(18, 8, 2, 1, 0xffffff); // Sclera
            headBox(13, 8, 1, 1, 0xff0000);
            headBox(18, 8, 1, 1, 0xff0000); // Red pupils
          }
          break;
        }
        case "gojo": {
          const isTransformed = form === 1;
          const SKIN = 0xffeebb;
          const SKIN_SHADOW = 0xccbb99;
          const HAIR = 0xffffff;
          const HAIR_SHADOW = 0xdddddd;
          const JACKET = 0x1a1a24;
          const JACKET_SHADOW = 0x0f0f15;
          const PANTS = 0x1a1a24;
          const PANTS_SHADOW = 0x0f0f15;
          const SHOES = 0x111111;
          const BLINDFOLD = 0x111111;
          const EYE_BLUE = 0x00ffff;
          const EYE_WHITE = 0xffffff;

          // Legs
          box(11, 24, 4, 6, PANTS);
          box(17, 24, 4, 6, PANTS);
          box(11, 24, 1, 6, PANTS_SHADOW);
          box(20, 24, 1, 6, PANTS_SHADOW); // Pants shadow

          // Shoes
          box(10, 30, 5, 2, SHOES);
          box(17, 30, 5, 2, SHOES);

          // Torso (Jacket)
          box(10, 14, 12, 10, JACKET);
          box(10, 14, 2, 10, JACKET_SHADOW);
          box(20, 14, 2, 10, JACKET_SHADOW); // Jacket shadow
          box(15, 14, 2, 10, JACKET_SHADOW); // Zipper line

          // Arms
          if (isAttack) {
            box(21, 14, 10, 3, JACKET); // Right arm out
            box(21, 14, 10, 1, JACKET_SHADOW);
            box(31, 14, 3, 3, SKIN); // Hand points
            box(6, 15, 3, 5, JACKET); // Left arm back
          } else {
            box(7, 14, 3, 8, JACKET);
            box(22, 14, 3, 8, JACKET);
            box(7, 14, 1, 8, JACKET_SHADOW);
            box(24, 14, 1, 8, JACKET_SHADOW); // Arm shadow

            // Hands
            box(7, 22, 3, 2, SKIN);
            box(22, 22, 3, 2, SKIN);
            box(7, 22, 1, 2, SKIN_SHADOW);
            box(24, 22, 1, 2, SKIN_SHADOW); // Hand shadow
          }

          // Head
          headBox(12, 6, 8, 8, SKIN);
          headBox(12, 6, 1, 8, SKIN_SHADOW);
          headBox(19, 6, 1, 8, SKIN_SHADOW); // Face shadow

          // Subtle Expressions
          if (!isTransformed) {
            // Blindfold on, so mouth is key expression
            if (isAttack) {
              headBox(15, 12, 2, 1, 0x440000); // Small open mouth
            } else if (isDefend) {
              headBox(15, 12, 2, 1, EYE_WHITE); // Clenched teeth
            } else {
              headDot(16, 12, 0x222222); // Smirk corner
            }
          }

          if (isTransformed) {
            // LIMITLESS / SIX EYES (Blindfold off, floating hair)

            // Hair (Spiky, floating up)
            headBox(10, 0, 12, 6, HAIR);
            headBox(11, -2, 10, 2, HAIR);
            headBox(12, -4, 8, 2, HAIR);
            headBox(14, -6, 4, 2, HAIR);

            // Hair shadow
            headBox(10, 0, 2, 6, HAIR_SHADOW);
            headBox(20, 0, 2, 6, HAIR_SHADOW);

            // Eyes (Six Eyes) - Better proportions
            headBox(13, 8, 2, 1, EYE_WHITE);
            headBox(17, 8, 2, 1, EYE_WHITE); // Sclera
            headBox(14, 8, 1, 1, EYE_BLUE);
            headBox(18, 8, 1, 1, EYE_BLUE); // Bright blue iris

            // Eyebrows
            headBox(13, 7, 2, 1, HAIR);
            headBox(17, 7, 2, 1, HAIR);

            // Smile
            headBox(15, 11, 2, 1, 0x000000); // Smile
          } else {
            // BASE FORM (Blindfold on, hair down)

            // Hair (Swept down)
            headBox(10, 2, 12, 5, HAIR);
            headBox(11, 0, 10, 2, HAIR);
            headBox(13, -2, 6, 2, HAIR);
            // Bangs over blindfold
            headBox(11, 7, 2, 3, HAIR);
            headBox(14, 7, 4, 2, HAIR);
            headBox(19, 7, 2, 3, HAIR);

            // Hair shadow
            headBox(10, 2, 2, 5, HAIR_SHADOW);
            headBox(20, 2, 2, 5, HAIR_SHADOW);

            // Blindfold
            headBox(11, 8, 10, 3, BLINDFOLD);
            headBox(11, 8, 10, 1, 0x222222); // Blindfold highlight

            // Smile
            headBox(15, 12, 2, 1, SKIN_SHADOW);
          }
          break;
        }
        case "itachi": {
          const isTransformed = form === 1; // Susanoo
          const SKIN = 0xffeebb;
          const SKIN_SHADOW = 0xccbb99;
          const HAIR = 0x111111;
          const HAIR_SHADOW = 0x000000;
          const CLOAK = 0x1a1a1a; // Akatsuki cloak
          const CLOAK_SHADOW = 0x0a0a0a;
          const RED_CLOUD = 0xcc0000;
          const SHARINGAN = 0xff0000;

          if (isTransformed) {
            // PERFECT SUSANOO - Minimalist Block-Style (Itachi)

            const S_DARK = 0x990000; // Deep crimson
            const S_MID = 0xcc0000; // Vibrant red
            const S_NEON = 0xff3333; // Neon red/orange glow
            const S_EYE = 0xffaa00; // Glowing yellow/orange eyes
            const FIRE = 0xff6600; // Totsuka flame
            const YATA = 0xffcc00; // Yata mirror gold

            const animY = !isAttack && f % 2 === 0 ? 1 : 0;

            // SUSANOO BACK WINGS / AURA
            alphaBox(2, -10 + animY, 28, 42, S_MID, 0.2);
            alphaBox(0, -5 + animY, 32, 30, S_NEON, 0.15);

            // Wings / Back Armor
            alphaBox(1, -12 + animY, 8, 24, S_DARK, 0.5);
            alphaBox(23, -12 + animY, 8, 24, S_DARK, 0.5);
            alphaBox(0, -8 + animY, 6, 18, S_NEON, 0.4);
            alphaBox(26, -8 + animY, 6, 18, S_NEON, 0.4);

            // MINI ITACHI (Core)
            const mX = 13;
            const mY = 16 + animY;

            // Hair back
            box(mX - 2, mY - 2, 10, 10, HAIR);
            // Cloak
            box(mX - 1, mY + 4, 8, 9, CLOAK);
            // Red Cloud
            box(mX + 1, mY + 6, 3, 2, RED_CLOUD);
            // Legs
            box(mX + 1, mY + 13, 4, 3, 0x333333);
            // Face
            box(mX + 1, mY, 4, 4, SKIN);
            // Hair front
            box(mX, mY - 1, 6, 2, HAIR);
            box(mX - 1, mY + 1, 2, 4, HAIR); // Left bang
            box(mX + 5, mY + 1, 2, 4, HAIR); // Right bang
            // Headband
            box(mX + 1, mY, 4, 1, 0x333333);

            // Arms & Weapons
            if (isAttack) {
              // Left Arm (Yata Mirror)
              alphaBox(2, 6 + animY, 6, 14, S_MID, 0.7);
              // Yata Mirror (Shield)
              alphaBox(-4, 8, 12, 18, YATA, 0.6);
              alphaBox(-2, 10, 8, 14, 0xffffff, 0.8);

              // Right Arm (Totsuka Blade)
              alphaBox(24, -4 + animY, 6, 14, S_MID, 0.7);
              // Totsuka Blade (Liquid Fire Sword)
              alphaBox(28, -18, 4, 30, FIRE, 0.8);
              alphaBox(29, -16, 2, 26, 0xffffff, 0.9);
              // Gourd (where sword comes from)
              alphaBox(26, 10 + animY, 8, 10, S_DARK, 0.8);
            } else {
              // Left Arm (Yata Mirror)
              alphaBox(4, 10 + animY, 6, 14, S_MID, 0.7);
              // Yata Mirror (Shield)
              alphaBox(0, 12, 10, 16, YATA, 0.5);
              alphaBox(2, 14, 6, 12, 0xffffff, 0.7);

              // Right Arm (Totsuka Blade)
              alphaBox(22, 10 + animY, 6, 14, S_MID, 0.7);
              // Totsuka Blade resting
              alphaBox(26, -4, 4, 24, FIRE, 0.6);
              // Gourd
              alphaBox(24, 18 + animY, 8, 10, S_DARK, 0.8);
            }

            // SUSANOO FRONT (Semi-transparent blocks)
            // Torso/Ribcage
            alphaBox(8, 4 + animY, 16, 18, S_MID, 0.6);
            alphaBox(9, 6 + animY, 14, 3, S_NEON, 0.8); // Rib 1
            alphaBox(10, 11 + animY, 12, 3, S_NEON, 0.8); // Rib 2
            alphaBox(11, 16 + animY, 10, 3, S_NEON, 0.8); // Rib 3

            // Skirt/Lower armor
            alphaBox(6, 22 + animY, 20, 10, S_DARK, 0.7);
            alphaBox(8, 24 + animY, 16, 8, S_MID, 0.7);

            // Head (Armored Humanoid)
            alphaBox(10, -10 + animY, 12, 14, S_DARK, 0.85);
            alphaBox(11, -4 + animY, 10, 6, S_MID, 0.9); // Face Mask

            // Glowing Yellow Eyes
            alphaBox(12, -3 + animY, 3, 2, S_EYE, 1);
            alphaBox(17, -3 + animY, 3, 2, S_EYE, 1);

            // Helmet Crest / Details
            alphaBox(14, -12 + animY, 4, 6, S_NEON, 0.9); // Center crest
            alphaBox(9, -8 + animY, 2, 6, S_NEON, 0.9); // Side guards
            alphaBox(21, -8 + animY, 2, 6, S_NEON, 0.9);
          } else {
            // BASE ITACHI
            // Ponytail (Draw behind body/head)
            box(14, 10, 4, 8, HAIR);

            // Legs (Mesh armor and pants)
            box(12, 22, 3, 6, 0x333333);
            box(17, 22, 3, 6, 0x333333);
            // Feet (Sandals)
            box(11, 28, 4, 4, 0x222222);
            box(17, 28, 4, 4, 0x222222);
            box(11, 28, 2, 2, SKIN);
            box(17, 28, 2, 2, SKIN); // Toes

            // Torso (Akatsuki Cloak)
            box(9, 14, 14, 11, CLOAK);
            box(9, 14, 2, 11, CLOAK_SHADOW);
            box(21, 14, 2, 11, CLOAK_SHADOW);

            // Red Clouds
            box(11, 17, 4, 2, RED_CLOUD);
            box(12, 16, 2, 1, RED_CLOUD);

            box(17, 21, 4, 2, RED_CLOUD);
            box(18, 20, 2, 1, RED_CLOUD);

            // Arms (Wide cloak sleeves)
            if (isAttack) {
              // Right arm extended
              box(21, 14, 10, 3, CLOAK);
              box(31, 14, 4, 4, SKIN); // Hand fist
              box(31, 14, 2, 2, 0xffeebb); // Knuckles
              box(33, 15, 1, 1, 0x4b0082); // Nails
              box(34, 15, 4, 1, 0xcccccc); // Kunai

              // Left arm close
              box(6, 15, 3, 5, CLOAK);
            } else {
              const armY = f % 2 === 0 ? 14 : 15;
              box(6, armY, 4, 9, CLOAK);
              box(22, armY, 4, 9, CLOAK);
              // Hands (with nail polish)
              box(7, armY + 9, 2, 2, SKIN);
              box(23, armY + 9, 2, 2, SKIN);
              box(7, armY + 10, 1, 1, 0x4b0082);
              box(23, armY + 10, 1, 1, 0x4b0082); // Purple nails
            }

            // High Collar
            box(10, 10, 12, 5, CLOAK);
            box(11, 10, 10, 2, 0x880000); // Red inside collar

            // Head
            headBox(12, 4, 8, 8, SKIN);
            headBox(12, 4, 1, 8, SKIN_SHADOW);
            headBox(19, 4, 1, 8, SKIN_SHADOW);

            // Hair (Long, parted down the middle)
            box(11, 2, 10, 3, HAIR);
            box(10, 4, 2, 8, HAIR);
            box(20, 4, 2, 8, HAIR); // Side bangs

            // Headband
            box(12, 5, 8, 2, 0x333333);
            box(14, 5, 4, 2, 0xaaaaaa); // Plate
            box(15, 6, 2, 1, 0x000000); // Scratch

            // Eyes (Sharingan)
            box(13, 8, 2, 1, SHARINGAN);
            box(17, 8, 2, 1, SHARINGAN);
            // Tear troughs (Lines under eyes)
            box(13, 9, 1, 2, 0x444444);
            box(18, 9, 1, 2, 0x444444);
          }

          break;
        }
        case "jotaro": {
          const isTransformed = form > 0;
          
          // --- ULTRA-DETAILED PALETTE ---
          const COAT_DK = 0x0a0a12;
          const COAT_MD = 0x1d1e2c;
          const COAT_LT = 0x2f3042;
          const COAT_HL = 0x4a4b5e;
          
          const SHIRT_DK = 0x240046;
          const SHIRT_MD = 0x5a189a;
          const SHIRT_LT = 0x7b2cbf;
          
          // SKIN: Changed from tan/dark to pale/fair anime skin!
          const SKIN_DK = 0xcdad96;
          const SKIN_MD = 0xffe4c4; 
          const SKIN_LT = 0xfff0e4;
          
          const HAIR_DK = 0x0a0a0f;
          const HAIR_MD = 0x1c1c24;
          const HAIR_LT = 0x333344;
          
          const GOLD_DK = 0xb08d57;
          const GOLD_MD = 0xffd700;
          const GOLD_LT = 0xfffae3;
          const SILVER_DK = 0x6c757d;
          const SILVER_MD = 0xced4da;
          const SILVER_LT = 0xf8f9fa;
          const BELT_GREEN = 0x2d6a4f;
          const BELT_RED = 0x9d0208;

          // SP Palette
          const SP_SKIN_DK = 0x4a0e4e;
          const SP_SKIN_MD = 0x800080;
          const SP_SKIN_LT = 0xb14aed;
          const SP_HAIR = 0x0b090a;
          const SP_ARMOR_DK = 0xb07d00;
          const SP_ARMOR_MD = 0xffb700;
          const SP_ARMOR_LT = 0xffea00;
          const SP_SCARF_DK = 0x660000;
          const SP_SCARF_MD = 0xc1121f;

          const jX = isTransformed ? 10 : 0; 

          // ==========================================
          // === STAR PLATINUM (ANIME ACCURATE REMASTER) ===
          // ==========================================
          if (isTransformed) {
              const spX = isAttack ? 4 : -2; // Stand slightly behind Jotaro
              const spY = (f % 4 < 2) ? -1 : 0; // Floating gently
              
              // True Anime Palette for Star Platinum
              const SP_SKIN_DK = 0x3d2b56; // Deep purple shadows
              const SP_SKIN_MD = 0x614894; // Classic Part 3 purple/blue skin
              const SP_SKIN_LT = 0xa37cf0; // Vivid cyan-purple highlights
              const SP_HAIR = 0x110b1a; // Almost black
              const SP_HAIR_HL = 0x2e1a4a; // Purple hue to the hair
              const SP_ARMOR_DK = 0x997500;
              const SP_ARMOR_MD = 0xd4a017;
              const SP_ARMOR_LT = 0xffe259;
              const SP_SCARF_DK = 0x7a0010;
              const SP_SCARF_MD = 0xcf1b34;
              const SP_SCARF_LT = 0xff3b54;

              // 1. AURA (Subtle purple/blue spiritual fire)
              alphaBox(spX - 4, spY - 6, 36, 42, SP_SKIN_LT, 0.15);
              alphaBox(spX - 2, spY - 2, 32, 36, SP_SKIN_MD, 0.2);

              // 2. WILD GOHAN-STYLE SPIKY HAIR
              // Thick base with tall, rigid, upward-pointing spikes
              headBox(spX - 2, spY - 9, 20, 10, SP_HAIR); // Hair base
              headBox(spX + 8, spY - 14, 4, 8, SP_HAIR);  // Front spike
              headBox(spX + 2, spY - 18, 6, 12, SP_HAIR); // Main tall spike (Gohan style)
              headBox(spX - 4, spY - 16, 6, 10, SP_HAIR); // Middle-back spike
              headBox(spX - 8, spY - 13, 6, 8, SP_HAIR);  // Far-back spike
              // Purple volume highlights
              headBox(spX + 3, spY - 14, 2, 6, SP_HAIR_HL);
              headBox(spX - 3, spY - 13, 2, 5, SP_HAIR_HL);
              
              // 3. STRONG PROPORTIONED HEAD & JAWLINE
              headBox(spX + 7, spY - 1, 9, 8, SP_SKIN_DK); // Jaw/Head outline
              headBox(spX + 8, spY, 8, 7, SP_SKIN_MD);     // Face base
              
              // Cheekbones and Facial Structure
              headBox(spX + 8, spY + 3, 2, 2, SP_SKIN_LT); // Left cheek highlight
              headBox(spX + 13, spY + 3, 2, 2, SP_SKIN_LT); // Right cheek highlight
              headBox(spX + 8, spY + 5, 2, 2, SP_SKIN_DK); // Left cheek shadow
              headBox(spX + 13, spY + 5, 2, 2, SP_SKIN_DK); // Right cheek shadow
              
              // Headband (Classic Golden Tiara)
              headBox(spX + 7, spY - 2, 9, 2, SP_ARMOR_MD);
              headBox(spX + 8, spY - 2, 7, 1, SP_ARMOR_LT); // Tiara highlight
              headDot(spX + 11, spY - 2, 0x00ffff); // Flawless Cyan Center Gem
              
              // Fierce Eyes, Brow & Nose
              headBox(spX + 8, spY + 1, 3, 1, SP_SKIN_DK); // Heavy brow shadow
              headBox(spX + 13, spY + 1, 3, 1, SP_SKIN_DK); 
              headBox(spX + 9, spY + 2, 2, 1, 0xffffff); // Left eye
              headBox(spX + 13, spY + 2, 2, 1, 0xffffff); // Right eye
              headDot(spX + 10, spY + 2, 0xff00ff); // Iris
              headDot(spX + 14, spY + 2, 0xff00ff);
              
              headBox(spX + 11, spY + 4, 3, 2, SP_SKIN_DK); // Nose bridge
              headBox(spX + 11, spY + 6, 3, 1, 0x221133); // Strong mouth line
              
              // 4. ICONIC RED SCARF
              // Wraps thick around the neck
              box(spX + 5, spY + 7, 12, 5, SP_SCARF_DK); 
              box(spX + 6, spY + 8, 10, 2, SP_SCARF_LT); 
              // Flowing trailing scarf behind him
              const flutter = (f % 2 === 0) ? 1 : 0;
              box(spX + 15, spY + 10, 8 + flutter, 10 + flutter, SP_SCARF_DK);
              box(spX + 16, spY + 11, 5 + flutter, 7 + flutter, SP_SCARF_MD);
              
              // 5. MASSIVE TORSO & SHADING
              box(spX + 5, spY + 11, 12, 12, SP_SKIN_DK); 
              box(spX + 6, spY + 11, 10, 11, SP_SKIN_MD); 
              // Pecs (Vivid cyan-purple highlight)
              box(spX + 7, spY + 12, 3, 4, SP_SKIN_LT); 
              box(spX + 11, spY + 12, 3, 4, SP_SKIN_LT); 
              // Abs (The 8-pack lines)
              box(spX + 8, spY + 17, 6, 5, SP_SKIN_LT);
              box(spX + 10, spY + 17, 2, 5, SP_SKIN_DK); // Mid line
              box(spX + 8, spY + 19, 6, 1, SP_SKIN_DK); // Horiz break
              
              // 6. SPHERICAL GOLDEN SHOULDER PADS
              // Left Pad
              box(spX - 2, spY + 7, 7, 7, SP_ARMOR_DK);
              box(spX - 1, spY + 8, 5, 5, SP_ARMOR_MD);
              box(spX, spY + 8, 2, 2, SP_ARMOR_LT); // Specular highlight
              // Right Pad
              box(spX + 17, spY + 7, 7, 7, SP_ARMOR_DK);
              box(spX + 18, spY + 8, 5, 5, SP_ARMOR_MD);
              box(spX + 19, spY + 8, 2, 2, SP_ARMOR_LT);

              // 7. LOINCLOTH AND GOLD BELT (DETAILED WAIST)
              box(spX + 6, spY + 22, 10, 2, SP_SKIN_DK);  // Obliques/Waist tapering
              box(spX + 4, spY + 24, 14, 3, SP_ARMOR_DK); // Thick Belt base
              box(spX + 5, spY + 25, 12, 2, SP_ARMOR_MD); // Gold belt
              box(spX + 6, spY + 25, 4, 1, SP_ARMOR_LT);  // Belt highlight
              box(spX + 12, spY + 25, 4, 1, SP_ARMOR_LT);
              box(spX + 6, spY + 27, 10, 7, 0x111115); // Dark shading undercloth
              box(spX + 7, spY + 27, 8, 6, 0xdcdcdc); // Core white loincloth shadow
              box(spX + 8, spY + 27, 6, 5, 0xffffff); // Core white loincloth highlight
              
              // 8. TALLER LEGS & KNEE GUARDS (DETAILED MUSCLES)
              // Thighs
              box(spX + 5, spY + 26, 4, 6, SP_SKIN_DK); // Left thigh shadow
              box(spX + 6, spY + 26, 3, 5, SP_SKIN_MD); // Left thigh core
              box(spX + 7, spY + 26, 1, 4, SP_SKIN_LT); // Left quad highlight
              
              box(spX + 13, spY + 26, 4, 6, SP_SKIN_DK); // Right thigh shadow
              box(spX + 13, spY + 26, 3, 5, SP_SKIN_MD); // Right thigh core
              box(spX + 14, spY + 26, 1, 4, SP_SKIN_LT); // Right quad highlight
              
              // Boots
              box(spX + 5, spY + 31, 6, 5, 0x0a0a0a); // Left Boot Dk
              box(spX + 6, spY + 31, 4, 5, 0x1a1a1a); // Left Boot Mid
              box(spX + 11, spY + 31, 6, 5, 0x0a0a0a); // Right Boot Dk
              box(spX + 12, spY + 31, 4, 5, 0x1a1a1a); // Right Boot Mid
              
              // Gold Knee Pads over boots (More spherical)
              box(spX + 5, spY + 30, 6, 4, SP_ARMOR_DK); 
              box(spX + 6, spY + 31, 4, 2, SP_ARMOR_MD); 
              box(spX + 6, spY + 31, 1, 1, SP_ARMOR_LT); 
              
              box(spX + 11, spY + 30, 6, 4, SP_ARMOR_DK); 
              box(spX + 12, spY + 31, 4, 2, SP_ARMOR_MD); 
              box(spX + 12, spY + 31, 1, 1, SP_ARMOR_LT); 

              // 9. ARMS AND ATTACK LOGIC (CLOSED FISTS)
              if (isAttack) {
                  // THE ORA ORA RUSH!
                  // Afterimages covering the flurry area
                  alphaBox(spX + 12, spY + 7, 28, 14, SP_SKIN_LT, 0.4); 
                  alphaBox(spX + 16, spY + 9, 24, 10, 0xffffff, 0.2); // Core speed line
                  
                  const shiftY1 = (f % 2) * 4;
                  const shiftY2 = (f % 2 === 0) ? 0 : 4;
                  
                  // Top Punching Arm
                  box(spX + 16, spY + 9 + shiftY1, 14, 5, SP_SKIN_MD); // Arm stretch
                  box(spX + 30, spY + 9 + shiftY1, 6, 5, 0x111111); // Black glove base
                  // Closed fist detail
                  box(spX + 32, spY + 10 + shiftY1, 4, 4, 0x111111); // Fist forward
                  box(spX + 33, spY + 11 + shiftY1, 2, 2, 0x333333); // Knuckle definition
                  box(spX + 33, spY + 10 + shiftY1, 1, 1, SP_ARMOR_LT); // Central gold stud
                  
                  // Bottom Punching Arm
                  box(spX + 18, spY + 15 - shiftY2, 14, 5, SP_SKIN_MD); 
                  box(spX + 32, spY + 15 - shiftY2, 6, 5, 0x111111); 
                  box(spX + 34, spY + 16 - shiftY2, 4, 4, 0x111111); 
                  box(spX + 35, spY + 17 - shiftY2, 2, 2, 0x333333); 
                  box(spX + 35, spY + 16 - shiftY2, 1, 1, SP_ARMOR_LT);
                  
                  // Impact flashes!
                  alphaBox(spX + 36, spY + 10 + shiftY1, 3, 3, SP_ARMOR_LT, 0.8);
                  alphaBox(spX + 38, spY + 16 - shiftY2, 3, 3, SP_ARMOR_LT, 0.8);
                  
                  // Shouting mouth
                  headBox(spX + 10, spY + 6, 3, 2, 0x220000);
                  headBox(spX + 11, spY + 6, 1, 1, 0xffffff);

              } else {
                  // Ready Combat Stance (Bent arms, closed fists)
                  box(spX + 3, spY + 12, 4, 7, SP_SKIN_DK); // L Bicep
                  box(spX + 4, spY + 12, 2, 6, SP_SKIN_MD); 
                  
                  box(spX + 15, spY + 12, 4, 7, SP_SKIN_DK); // R Bicep
                  box(spX + 16, spY + 12, 2, 6, SP_SKIN_MD); 
                  
                  // Black Padded Gloves (Compact closed fists)
                  box(spX + 2, spY + 18, 6, 6, 0x111111); // L Glove
                  box(spX + 3, spY + 19, 4, 4, 0x222222); // L Fist structure
                  box(spX + 4, spY + 20, 2, 2, SP_ARMOR_MD); // Golden knuckle stud
                  
                  box(spX + 14, spY + 18, 6, 6, 0x111111); // R Glove
                  box(spX + 15, spY + 19, 4, 4, 0x222222); // R Fist structure
                  box(spX + 16, spY + 20, 2, 2, SP_ARMOR_MD); // Golden knuckle stud
              }
          }

          // ==========================================
          // === JOTARO KUJO (FIXED SKIN & PANTS) ===
          // ==========================================
          
          // --- PANT & SHOE PROPORTIONS ---
          // Calças finas e elegantes, nunca grossas
          box(jX + 11, 24, 4, 8, COAT_DK); // Perna Esq Escura
          box(jX + 11, 24, 3, 7, COAT_MD); // Perna Esq Interior
          box(jX + 12, 25, 1, 6, COAT_LT); // Highlight Esq
          
          box(jX + 17, 24, 4, 8, COAT_DK); // Perna Dir Escura
          box(jX + 17, 24, 3, 7, COAT_MD); // Perna Dir Interior
          box(jX + 18, 25, 1, 6, COAT_LT); // Highlight Dir

          // Shoes/Loafers curtos e brilhantes
          box(jX + 10, 31, 5, 3, COAT_DK); // Sola Esq
          box(jX + 16, 31, 5, 3, COAT_DK); // Sola Dir
          box(jX + 10, 31, 4, 2, COAT_MD); // Couro Esq
          box(jX + 16, 31, 4, 2, COAT_MD); // Couro Dir
          headDot(jX + 11, 31, COAT_LT); // Brilho Esq
          headDot(jX + 17, 31, COAT_LT); // Brilho Dir

          // --- TRONCO & GAKURAN ---
          // Corpo forte mas na proporção certa
          box(jX + 9, 14, 14, 10, COAT_DK); 
          
          // Camisa Interna 
          box(jX + 12, 14, 8, 9, SHIRT_DK); 
          box(jX + 13, 14, 6, 8, SHIRT_MD); 
          box(jX + 14, 15, 2, 5, SHIRT_LT); // Highlights (Abs/Pecs esq)
          box(jX + 17, 15, 2, 5, SHIRT_LT); // Highlights (Abs/Pecs dir)
          
          // Lapelas Obertas (Gakuran flaps)
          box(jX + 9, 14, 3, 10, COAT_MD); 
          box(jX + 11, 14, 1, 10, COAT_LT); // Borda luz esq
          box(jX + 20, 14, 3, 10, COAT_MD); 
          box(jX + 20, 14, 1, 10, COAT_LT); // Borda luz dir

          // Gola Alta Rigida
          box(jX + 10, 10, 12, 4, COAT_DK); 
          box(jX + 11, 11, 10, 3, COAT_MD); 
          box(jX + 11, 11, 3, 2, COAT_LT); // Brilho gola esq
          box(jX + 18, 11, 3, 2, COAT_LT); // Brilho gola dir
          
          // Pescoço (Pele clara, não morena!)
          box(jX + 14, 12, 4, 2, SKIN_DK); // Sombra do pescoço
          box(jX + 15, 12, 2, 1, SKIN_MD); // Pescoço em si

          // Corrente Metálica em argolas
          box(jX + 19, 12, 2, 5, SILVER_DK); 
          headDot(jX + 19, 12, SILVER_LT); 
          headDot(jX + 20, 13, SILVER_MD); 
          headDot(jX + 19, 14, SILVER_LT); 
          headDot(jX + 20, 15, SILVER_MD); 

          // Botões Dourados do Lado Direito
          headDot(jX + 21, 15, GOLD_MD);
          headDot(jX + 21, 17, GOLD_MD);

          // Cintos Ultra Detalhados
          box(jX + 11, 22, 10, 3, COAT_DK); // Fundo sombreado
          box(jX + 12, 22, 8, 1, BELT_GREEN); // Cinto Cima
          box(jX + 12, 24, 8, 1, BELT_RED); // Cinto Baixo
          
          // Dupla Fivelagem
          box(jX + 13, 22, 3, 3, GOLD_DK); // Fivela Maior Base
          box(jX + 14, 22, 1, 2, GOLD_LT); // Fivela Maior Brilho
          box(jX + 17, 23, 2, 2, SILVER_MD); // Segunda Fivela
          headDot(jX + 17, 23, SILVER_LT); 

          // Abas do Casaco (Movimento das costas)
          const cWave = (f % 4 === 1) ? 1 : (f % 4 === 3) ? -1 : 0;
          box(jX + 6 + cWave, 20, 4, 10, COAT_DK); // Aba Traseira escura
          box(jX + 7 + cWave, 21, 2, 8, COAT_MD); 
          box(jX + 21 + (cWave * -1), 20, 3, 9, COAT_MD); // Aba Frontal
          box(jX + 22 + (cWave * -1), 20, 1, 8, COAT_LT); 

          // --- CHAPÉU & CABELO REFEITOS ---
          // Copa superior do chapéu
          headBox(jX + 10, -2, 9, 5, COAT_MD); 
          headBox(jX + 11, -2, 7, 1, COAT_HL); // Brilho no topo
          
          // Hair removed user request. Only hat remains.
          
          // Aba do Chapéu (Plana e destacada)
          headBox(jX + 9, 3, 14, 2, COAT_DK); // Sombra da aba grossa
          headBox(jX + 10, 3, 13, 1, COAT_LT); // Edge highlight 
          headDot(jX + 22, 3, COAT_HL); // Ponta extrema da aba brilhando
          
          // Emblemas de Ouro (Mão e Âncora isoladas)
          headBox(jX + 12, 1, 2, 2, GOLD_MD); // Mão menor
          headBox(jX + 16, 1, 2, 2, GOLD_MD); // Âncora menor

          // --- ROSTO SUPER CLEAN ANIME ---
          headBox(jX + 11, 5, 8, 7, SKIN_MD); // Rosto base
          
          // Sombra da Aba mais leve e limpa, menos intrusiva
          headBox(jX + 11, 5, 8, 1, SKIN_DK); 
          
          // Olhos limpos (Estilo Jotaro original bem nítido)
          headBox(jX + 12, 7, 2, 1, 0xffffff); // Sclera L
          headBox(jX + 16, 7, 2, 1, 0xffffff); // Sclera R
          headDot(jX + 13, 7, 0x000000); // Íris L olhando frente
          headDot(jX + 16, 7, 0x000000); // Íris R olhando frente
          
          // Sobrancelhas retas e grossas mas sem se unirem bizarramente
          headBox(jX + 12, 6, 2, 1, HAIR_DK); 
          headBox(jX + 16, 6, 2, 1, HAIR_DK); 
          
          // Boca linha reta sutil
          headBox(jX + 13, 10, 4, 1, 0x000000); // Boca super discreta preta ou marrom escuro

          // --- BRAÇOS CROSS/POCKET ---
          box(jX + 8, 14, 3, 3, COAT_MD); // Ombro Trás
          box(jX + 21, 14, 3, 3, COAT_MD); // Ombro Frente
          
          box(jX + 8, 16, 3, 7, COAT_DK); // Braço trás Base
          box(jX + 9, 17, 1, 5, COAT_MD); // Braço trás Volume
          
          box(jX + 21, 16, 3, 7, COAT_DK); // Braço frente Base
          box(jX + 22, 17, 1, 5, COAT_MD); // Braço frente Volume
          
          // Braço de ataque dele
          if (isAttack && !isTransformed) {
              box(jX + 18, 13, 10, 5, COAT_MD); 
              box(jX + 18, 13, 10, 1, COAT_LT); 
              box(jX + 28, 13, 4, 4, SKIN_MD); 
              box(jX + 28, 13, 2, 2, SKIN_LT); 
              box(jX + 8,  14, 4, 8, COAT_DK); 
          }
          
          break;
        }
        case "obito": {
          const isTransformed = form === 1;
          const SKIN = 0xffeebb;
          const SKIN_SHADOW = 0xccbb99;
          const HAIR = 0x111111;
          const HAIR_SHADOW = 0x000000;
          const CLOAK = 0x1a1a1a;
          const CLOAK_SHADOW = 0x0a0a0a;
          const CLOAK_RED = 0xcc0000;
          const MASK = 0xffa500; // Orange mask
          const MASK_SHADOW = 0xcc8400;
          const EYE_SHARINGAN = 0xff0000;
          const EYE_RINNEGAN = 0x9b59b6;
          const TEN_TAILS_SKIN = 0xe0e0e0; // Pale white/grey
          const TEN_TAILS_SHADOW = 0xb0b0b0;
          const MAGATAMA = 0x111111;
          if (isTransformed) {
            // TEN-TAILS JINCHURIKI MODE (Remastered & Animated)

            // Truth-Seeking Orbs (Halo behind him)
            const ORB = 0x111111;
            const ORB_GLOW = 0x444444;

            // Dynamic floating animation for orbs
            const float1 = f === 0 || f === 2 ? 0 : f === 1 ? -1 : 1;
            const float2 = f === 0 || f === 2 ? 0 : f === 1 ? 1 : -1;

            const drawOrb = (ox: number, oy: number, floatOffset: number) => {
              box(ox, oy + floatOffset, 4, 4, ORB);
              box(ox + 1, oy + 1 + floatOffset, 2, 2, ORB_GLOW);
            };

            drawOrb(3, 8, float1);
            drawOrb(25, 8, float2);
            drawOrb(1, 15, float2);
            drawOrb(27, 15, float1);
            drawOrb(3, 22, float1);
            drawOrb(25, 22, float2);
            drawOrb(8, 26, float2);
            drawOrb(20, 26, float1);

            // Lower Body (White Robe/Skirt)
            box(9, 22, 14, 10, 0xffffff); // Wide skirt
            box(9, 22, 2, 10, 0xdddddd);
            box(21, 22, 2, 10, 0xdddddd); // Skirt folds
            box(13, 22, 1, 10, 0xdddddd);
            box(18, 22, 1, 10, 0xdddddd);
            // Belt / Sash
            box(10, 21, 12, 2, 0x111111);

            // Feet (Bare, pale)
            box(10, 32, 4, 2, TEN_TAILS_SKIN);
            box(18, 32, 4, 2, TEN_TAILS_SKIN);

            // Torso (White robe top, open chest)
            box(10, 14, 12, 8, 0xffffff); // Robe base
            box(12, 14, 8, 7, TEN_TAILS_SKIN); // Exposed pale chest

            // Scale pattern on right side of chest (Obito's right = left side of sprite)
            box(12, 14, 4, 7, 0xcccccc);
            box(13, 15, 1, 1, 0x999999);
            box(15, 16, 1, 1, 0x999999);
            box(12, 18, 1, 1, 0x999999);
            box(14, 19, 1, 1, 0x999999);

            // 6 Magatamas on chest
            box(13, 15, 1, 1, MAGATAMA);
            box(15, 15, 1, 1, MAGATAMA);
            box(17, 15, 1, 1, MAGATAMA);
            box(14, 17, 1, 1, MAGATAMA);
            box(16, 17, 1, 1, MAGATAMA);
            box(18, 17, 1, 1, MAGATAMA);

            // Collar with Magatama
            box(10, 12, 12, 2, 0xffffff); // High collar
            box(11, 12, 1, 1, MAGATAMA);
            box(15, 12, 1, 1, MAGATAMA);
            box(19, 12, 1, 1, MAGATAMA); // Magatama on collar

            // Arms
            if (isAttack) {
              box(21, 14, 10, 3, TEN_TAILS_SKIN);
              box(21, 14, 10, 1, TEN_TAILS_SHADOW);
              box(31, 14, 4, 4, TEN_TAILS_SKIN); // Fist
              box(31, 14, 2, 2, 0xffffff); // Knuckles

              box(6, 15, 3, 5, TEN_TAILS_SKIN); // Left arm back
              box(6, 15, 1, 5, TEN_TAILS_SHADOW);

              // Horizontal staff
              box(15, 14, 22, 2, ORB); // Staff pole
              box(15, 14, 22, 1, ORB_GLOW);
              // Ring
              box(36, 11, 2, 8, ORB); // Ring base
              box(38, 9, 4, 2, ORB);
              box(38, 19, 4, 2, ORB); // Ring sides
              box(40, 11, 2, 8, ORB); // Ring front
            } else {
              box(8, 14, 3, 8, TEN_TAILS_SKIN);
              box(21, 14, 3, 8, TEN_TAILS_SKIN);
              box(8, 14, 1, 8, TEN_TAILS_SHADOW);
              box(24, 14, 1, 8, TEN_TAILS_SHADOW);
              box(8, 14, 2, 8, 0xcccccc);
              box(9, 15, 1, 1, 0x999999);
              box(8, 18, 1, 1, 0x999999);
              box(8, 22, 3, 3, TEN_TAILS_SKIN);
              box(21, 22, 3, 3, TEN_TAILS_SKIN);
              // Upright
              const staffY = 0;
              box(23, 2 + staffY, 2, 28, ORB); // Staff pole
              box(24, 2 + staffY, 1, 28, ORB_GLOW); // Staff highlight
              // Top ring
              box(21, 0 + staffY, 6, 2, ORB); // Top ring base
              box(19, -4 + staffY, 2, 6, ORB);
              box(27, -4 + staffY, 2, 6, ORB); // Ring sides
              box(21, -6 + staffY, 6, 2, ORB); // Ring top
              // Inner rings (animated floating)
              const ringFloat = f % 2 === 0 ? 0 : 1;
              box(20, -2 + staffY + ringFloat, 1, 2, ORB);
              box(27, -2 + staffY - ringFloat, 1, 2, ORB);
            }

            // Head (Pale skin)
            headBox(12, 4, 8, 8, TEN_TAILS_SKIN);
            headBox(12, 4, 1, 8, TEN_TAILS_SHADOW);
            headBox(19, 4, 1, 8, TEN_TAILS_SHADOW);

            // Right side face scales
            headBox(12, 4, 3, 8, 0xcccccc);
            headBox(13, 5, 1, 1, 0x999999);
            headBox(12, 8, 1, 1, 0x999999);

            // Hair (White, spiky, swept back)
            // Animate hair slightly
            const hairFloat = f === 1 || f === 3 ? -1 : 0;
            // Base hair
            headBox(9, -1 + hairFloat, 14, 6, 0xffffff);
            // Side spikes
            headBox(7, 1 + hairFloat, 2, 3, 0xffffff);
            headBox(23, 1 + hairFloat, 2, 3, 0xffffff);
            headBox(8, 3 + hairFloat, 2, 2, 0xffffff);
            headBox(22, 3 + hairFloat, 2, 2, 0xffffff);

            // Top spikes (swept back/up)
            headBox(9, -3 + hairFloat, 3, 3, 0xffffff);
            headBox(12, -4 + hairFloat, 3, 4, 0xffffff);
            headBox(15, -5 + hairFloat, 4, 5, 0xffffff); // Central large spike
            headBox(19, -4 + hairFloat, 3, 4, 0xffffff);
            headBox(22, -3 + hairFloat, 2, 3, 0xffffff);

            // Hair shadow
            headBox(9, -1 + hairFloat, 14, 2, 0xdddddd);

            // Eyes (Rinnegan and Sharingan)
            headBox(13, 7, 2, 2, 0xffffff);
            headBox(17, 7, 2, 2, 0xffffff); // Sclera
            headBox(13, 7, 2, 1, EYE_RINNEGAN); // Left eye Rinnegan (purple)
            headBox(17, 7, 2, 1, EYE_SHARINGAN); // Right eye Sharingan (red)

            // Horns (Asymmetrical)
            headBox(11, 2, 2, 3, TEN_TAILS_SKIN); // Left horn (small)
            headBox(18, -1, 3, 6, TEN_TAILS_SKIN); // Right horn (large, covers part of head)
            headBox(19, -3, 2, 2, TEN_TAILS_SKIN); // Right horn tip

            // Chakra Aura (Flames around feet)
            const AURA = 0xffffff;
            if (f % 2 === 0) {
              box(6, 30, 2, 4, AURA);
              box(24, 30, 2, 4, AURA);
              box(8, 28, 2, 6, AURA);
              box(22, 28, 2, 6, AURA);
            } else {
              box(5, 29, 2, 5, AURA);
              box(25, 29, 2, 5, AURA);
              box(7, 27, 2, 7, AURA);
              box(23, 27, 2, 7, AURA);
            }
          } else {
            // BASE FORM (Akatsuki Cloak + Orange Mask - Remastered)

            // Legs (Pants)
            box(11, 24, 4, 6, CLOAK);
            box(17, 24, 4, 6, CLOAK);
            box(11, 24, 1, 6, CLOAK_SHADOW);
            box(20, 24, 1, 6, CLOAK_SHADOW);

            // Shoes
            box(10, 30, 5, 2, 0x111111);
            box(17, 30, 5, 2, 0x111111);

            // Torso (Akatsuki Cloak)
            // Add slight cloak flutter animation
            const flutter = f % 2 === 0 ? 0 : 1;
            box(9 - flutter, 14, 14 + flutter * 2, 12, CLOAK); // Wider cloak
            box(9 - flutter, 14, 2, 12, CLOAK_SHADOW);
            box(21 + flutter, 14, 2, 12, CLOAK_SHADOW);

            // High Collar
            box(10, 11, 12, 4, CLOAK);
            box(10, 11, 2, 4, CLOAK_SHADOW);
            box(20, 11, 2, 4, CLOAK_SHADOW);
            box(10, 11, 12, 1, 0xcc0000); // Red inner lining of collar

            // Red Clouds (More detailed)
            box(11 - flutter, 17, 5, 3, CLOAK_RED);
            box(12 - flutter, 16, 3, 5, CLOAK_RED);
            box(16 + flutter, 21, 5, 3, CLOAK_RED);
            box(17 + flutter, 20, 3, 5, CLOAK_RED);
            box(11 - flutter, 17, 5, 1, 0xffffff); // White outline top
            box(16 + flutter, 21, 5, 1, 0xffffff); // White outline top

            // Arms (Cloak sleeves, wide)
            if (isAttack) {
              box(21, 14, 10, 4, CLOAK);
              box(21, 14, 10, 1, CLOAK_SHADOW);
              box(31, 14, 4, 4, 0x111111); // Glove Fist
              box(31, 14, 2, 2, 0x444444); // Knuckles

              box(6 - flutter, 15, 4, 6, CLOAK);
              box(6 - flutter, 21, 3, 3, 0x111111);
            } else {
              box(5 - flutter, 14, 4, 10, CLOAK);
              box(22 + flutter, 14, 4, 10, CLOAK);
              box(5 - flutter, 14, 1, 10, CLOAK_SHADOW);
              box(25 + flutter, 14, 1, 10, CLOAK_SHADOW);
              box(6 - flutter, 24, 3, 3, 0x111111);
              box(23 + flutter, 24, 3, 3, 0x111111);
            }

            // Head
            headBox(12, 6, 8, 8, SKIN);

            // Orange Spiral Mask (Tobi)
            headBox(11, 4, 10, 10, MASK);
            headBox(11, 4, 2, 10, MASK_SHADOW);
            headBox(19, 4, 2, 10, MASK_SHADOW);

            // Spiral pattern (Radiating from right eye)
            headBox(15, 7, 4, 1, MASK_SHADOW);
            headBox(14, 9, 5, 1, MASK_SHADOW);
            headBox(13, 11, 6, 1, MASK_SHADOW);
            headBox(13, 6, 1, 4, MASK_SHADOW);
            headBox(18, 6, 1, 4, MASK_SHADOW);

            // Eye hole (Right eye only)
            headBox(16, 7, 2, 2, 0x000000); // Hole
            headBox(16, 7, 2, 1, EYE_SHARINGAN); // Sharingan visible

            // Hair (Spiky, black, short, messy)
            const hairFloat = f === 1 || f === 3 ? -1 : 0;
            // Base hair behind mask
            headBox(10, 0 + hairFloat, 12, 5, HAIR);
            // Side spikes pointing outwards and upwards
            headBox(9, 2 + hairFloat, 2, 3, HAIR);
            headBox(21, 2 + hairFloat, 2, 3, HAIR);
            headBox(8, 4 + hairFloat, 2, 2, HAIR);
            headBox(22, 4 + hairFloat, 2, 2, HAIR);

            // Top spikes (messy)
            headBox(10, -2 + hairFloat, 2, 3, HAIR);
            headBox(12, -3 + hairFloat, 3, 4, HAIR);
            headBox(15, -4 + hairFloat, 2, 5, HAIR);
            headBox(17, -3 + hairFloat, 3, 4, HAIR);
            headBox(20, -2 + hairFloat, 2, 3, HAIR);

            // Hair shadow
            headBox(10, 0 + hairFloat, 2, 5, HAIR_SHADOW);
            headBox(20, 0 + hairFloat, 2, 5, HAIR_SHADOW);
          }
          break;
        }

        case "spiderman": {
          const isTransformed = form > 0;

          // CLASSIC SPIDER-MAN PALETTES
          const BASE_RED = 0xcc0000;
          const SHADOW_RED = 0x880000;
          const BASE_BLUE = 0x0033cc;
          const SHADOW_BLUE = 0x001188;
          
          const WEB_COLOR = 0x000000; 

          // MCU NANO IRON SPIDER COLORS
          const IRON_RED = 0xab1414; // High-tech metallic red
          const IRON_BLUE = 0x0c1b33; // Very dark navy/indigo (looks almost black-blue)
          const IRON_GOLD = 0xffd700; // Brilliant gold for nano accents
          const IRON_EYE = 0xccffff; // Cyan glow for nano suit eyes
          
          const RED = isTransformed ? IRON_RED : BASE_RED;
          const S_RED = isTransformed ? 0x730d0d : SHADOW_RED;
          const BLUE = isTransformed ? IRON_BLUE : BASE_BLUE; 
          const S_BLUE = isTransformed ? 0x060d1c : SHADOW_BLUE; 
          const LOGO = isTransformed ? IRON_GOLD : 0x000000;

          const EYE_GLOW = 0xffffff; // Always white, cyan looks green due to yellow contrast
          const EYE_RIM = 0x000000; // Always black border, gold borders look like "yellow glasses"

          const bob = (f === 1 || f === 3) ? 1 : 0;
          const armSway = (f === 1 || f === 3) ? 1 : 0;
          
          // === IRON SPIDER WALDOES (BACK) ===
          if (isTransformed) {
             const isAtk = isAttack ? 1 : 0;
             // High-Tech MCU Nano Waldoes
             // Shifted outwards and downwards to AVOID overlapping the head (no horns/cifres!)
             
             // Top Left Waldo
             box(11, 13 + armSway, 2, 2, IRON_GOLD); // Anchor lower on shoulder blade
             box(5, 12 + armSway, 6, 2, IRON_GOLD);  // Long arm sweeping OUT to the left
             box(3, 13 + armSway, 2, 4, IRON_GOLD);  // Diagonal joint
             box(1, 15 + armSway, 2, 5, IRON_GOLD);  // Blade dropping down
             box(1, 19 + armSway, 2, 2, IRON_EYE);   // Glowing tip

             // Top Right Waldo
             box(19, 13 - armSway, 2, 2, IRON_GOLD); // Anchor
             box(21, 12 - armSway, 6, 2, IRON_GOLD); // Sweeping OUT to the right
             box(27, 13 - armSway, 2, 4, IRON_GOLD); // Diagonal joint
             box(29, 15 - armSway, 2, 5, IRON_GOLD); // Blade dropping down
             box(29, 19 - armSway, 2, 2, IRON_EYE);  // Glowing tip

             // Bottom Left Waldo
             box(12, 17 - armSway, 2, 2, IRON_GOLD); // Anchor lower back
             box(6, 18 - armSway, 6, 2, IRON_GOLD);  // Sweeping OUT and down
             box(4, 20 - armSway, 2, 4, IRON_GOLD);  // Joint
             box(2, 22 - armSway, 2, 5, IRON_GOLD);  // Blade dropping down
             box(2, 26 - armSway, 2, 2, IRON_EYE);   // Glow

             // Bottom Right Waldo
             box(18, 17 + armSway, 2, 2, IRON_GOLD); // Anchor lower back
             box(20, 18 + armSway, 6, 2, IRON_GOLD); // Sweeping OUT and down
             box(26, 20 + armSway, 2, 4, IRON_GOLD); // Joint
             box(28, 22 + armSway, 2, 5, IRON_GOLD); // Blade dropping down
             box(28, 26 + armSway, 2, 2, IRON_EYE);  // Glow
          }

          // === LEGS (Starts at Y=23, same as Goku) ===
          box(10, 23 + bob, 4, 6, BLUE); // Left Thigh
          box(18, 23 + bob, 4, 6, BLUE); // Right Thigh
          // Shading
          box(10, 23 + bob, 1, 6, S_BLUE); 
          box(21, 23 + bob, 1, 6, S_BLUE);

          // Boots (Y=29)
          box(10, 29 + bob, 4, 5, RED);
          box(18, 29 + bob, 4, 5, RED);
          // Boots Details & Shadows
          box(10, 29 + bob, 1, 5, S_RED);
          box(18, 29 + bob, 1, 5, S_RED);
          
          if (isTransformed) {
            // MCU Gold Boot Accents
            box(10, 29 + bob, 4, 1, IRON_GOLD); 
            box(18, 29 + bob, 4, 1, IRON_GOLD);
          } else {
            // Classic Web bands
            box(10, 30 + bob, 4, 1, WEB_COLOR); 
            box(18, 30 + bob, 4, 1, WEB_COLOR);
          }

          // === TORSO (Y=14 to 22) ===
          // Core Red
          box(13, 14 + bob, 6, 9, RED);
          // Blue Sides
          box(11, 14 + bob, 2, 9, BLUE);
          box(19, 14 + bob, 2, 9, BLUE);
          
          // Torso Shadow
          box(13, 14 + bob, 1, 9, S_RED); // red shadow
          if (isTransformed) {
              box(18, 14 + bob, 1, 9, S_RED); // Inner right shadow for MCU armor depth
          }
          box(11, 14 + bob, 1, 9, S_BLUE); // blue left shadow
          box(20, 14 + bob, 1, 9, S_BLUE); // blue right shadow
          
          // Belt
          box(11, 22 + bob, 10, 2, RED);
          if (isTransformed) {
             // MCU Iron Spider Gold Trim around torso
             box(12, 14 + bob, 1, 9, IRON_GOLD); // Separating line left
             box(19, 14 + bob, 1, 9, IRON_GOLD); // Separating line right
             box(11, 21 + bob, 10, 1, IRON_GOLD); // Gold belt rim
          } else {
             box(11, 23 + bob, 10, 1, WEB_COLOR); // Only draw belt web line on classic
             box(13, 17 + bob, 6, 1, WEB_COLOR); // Horizontal web curve
          }

          // MCU Giant Gold Spider Emblem vs Classic Small Black Spider
          if (isTransformed) {
             // Intricate Nano Tech Gold Spider
             // Core Body (Diamond/Tapered shape)
             box(15, 14 + bob, 2, 1, LOGO); // Spider head/neck
             box(14, 15 + bob, 4, 3, LOGO); // Bulbous thorax (chest center)
             box(15, 18 + bob, 2, 4, LOGO); // Tapering abdomen down to the belt
             
             // Four upper legs (wrapping diagonally up the upper pecs/shoulders)
             box(13, 15 + bob, 1, 2, LOGO); // Inner upper L
             box(12, 14 + bob, 1, 2, LOGO); // Outer upper L
             
             box(18, 15 + bob, 1, 2, LOGO); // Inner upper R
             box(19, 14 + bob, 1, 2, LOGO); // Outer upper R
             
             // Four lower legs (wrapping aggressively down the ribs/waist)
             box(13, 18 + bob, 1, 2, LOGO); // Inner lower L
             box(12, 19 + bob, 1, 3, LOGO); // Outer lower L wrap
             
             box(18, 18 + bob, 1, 2, LOGO); // Inner lower R
             box(19, 19 + bob, 1, 3, LOGO); // Outer lower R wrap
          } else {
             box(15, 16 + bob, 2, 3, LOGO); // Classic Body
             box(14, 16 + bob, 4, 1, LOGO); // Classic Upper legs
             box(14, 18 + bob, 4, 1, LOGO); // Classic Lower legs
          }

          // === ARMS ===
          if (isAttack) {
              // Web Shooter Pose (Left arm forward, right arm back)
              // Right Arm
              box(8, 14 + bob, 3, 4, RED);
              box(7, 18 + bob, 4, 4, RED); // fist closed
              box(7, 18 + bob, 2, 2, 0xff8888); // Knuckles
              // Left Arm (Forward / Thrusting)
              box(21, 14 + bob, 6, 3, RED); // shoulder
              box(27, 14 + bob, 5, 3, RED); // forearm
              box(32, 13 + bob, 4, 4, RED); // HAND (FIRES BEAM FROM HERE)
              box(32, 13 + bob, 2, 2, 0xff8888); // Knuckles
              
              if (isTransformed) {
                  box(20, 14 + bob, 1, 3, IRON_GOLD); // Shoulder gold band
                  box(26, 14 + bob, 1, 3, IRON_GOLD); // Forearm gold band
                  box(32, 14 + bob, 4, 1, IRON_GOLD); // Nano tech brace on hand
              } else {
                  box(32, 14 + bob, 4, 1, WEB_COLOR); // hand detail
              }
              box(36, 15 + bob, 2, 1, EYE_GLOW); // web spark
          } else if (isCharge) {
              // Crouch / Prep Pose
              box(8, 15 + bob, 3, 4, BLUE); 
              box(8, 19 + bob, 4, 4, RED); // Glove
              if (isTransformed) box(8, 19 + bob, 4, 1, IRON_GOLD); // Gold bracelet
              else box(8, 19 + bob, 4, 1, WEB_COLOR);
              
              box(21, 15 + bob, 3, 4, BLUE); 
              box(20, 19 + bob, 4, 4, RED); // Glove
              if (isTransformed) box(20, 19 + bob, 4, 1, IRON_GOLD); // Gold bracelet
              else box(20, 19 + bob, 4, 1, WEB_COLOR);
          } else {
              // Idle
              box(8, 15 + bob, 3, 4, BLUE);
              box(8, 19 + bob, 3, 5, RED); // Glove
              if (isTransformed) box(8, 19 + bob, 3, 1, IRON_GOLD); // Gold bracelet
              else box(8, 20 + bob, 3, 1, WEB_COLOR); // Web line
              
              box(21, 15 - bob, 3, 4, BLUE);
              box(21, 19 - bob, 3, 5, RED); // Glove
              if (isTransformed) box(21, 19 - bob, 3, 1, IRON_GOLD); // Gold bracelet
              else box(21, 20 - bob, 3, 1, WEB_COLOR); // Web line
          }

          // === HEAD (Y=6) ===
          // Simple, clean oval
          headBox(12, 6 + bob, 8, 8, RED);
          headBox(12, 6 + bob, 1, 8, S_RED); // shadow left
          
          if (!isTransformed) {
              // Classic Head Webbing (Only on classic)
              // NOTE: User explicitly complained about the vertical line on the face. So I'll remove it 
              // and only leave subtle subtle horizontal curves if anything, or just nothing.
              // Actually they said "risco preto no rosto", I'll just remove both so the face is purely clean.
              // NO WEBBING on face for a perfectly clean mask.
          }

          // Classic / MCU Eyes
          // Left
          headBox(12, 8 + bob, 3, 4, EYE_RIM); 
          headBox(13, 9 + bob, 2, 2, EYE_GLOW); 
          // Right
          headBox(17, 8 + bob, 3, 4, EYE_RIM);
          headBox(17, 9 + bob, 2, 2, EYE_GLOW);

          break;
        }

      }
    } // End Loop

    let textureName = key;
    if (isUI) textureName = `${key}_ui`;
    else if (isTransformed) textureName = `${key}_ssj`;

    canvas.generateTexture(textureName, sheetWidth, sheetHeight);

    // Manually add frame data to the new texture so Phaser knows it's a spritesheet
    if (this.textures.exists(textureName)) {
      const tex = this.textures.get(textureName);
      const fw = FRAME_WIDTH * SCALE;
      const fh = FRAME_HEIGHT * SCALE;
      for (let i = 0; i < FRAMES; i++) {
        tex.add(i.toString(), 0, i * fw, 0, fw, fh);
      }
    }

    canvas.destroy();
  }
}
