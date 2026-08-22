import { transitionTo } from "../utils/sceneTransition";
import Phaser from "phaser";
import { GameState } from "../types";

export default class SettingsScene extends Phaser.Scene {
  declare registry: Phaser.Data.DataManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare tweens: Phaser.Tweens.TweenManager;
  declare sound:
    | Phaser.Sound.NoAudioSoundManager
    | Phaser.Sound.HTML5AudioSoundManager
    | Phaser.Sound.WebAudioSoundManager;

  constructor() {
    super("SettingsScene");
  }
  private returnScene: string = "MenuScene";
  init(data: any) {
    if (data && data.fromScene) this.returnScene = data.fromScene;
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const state = this.registry.get("gameState") as GameState;

    this.add.rectangle(480, 270, 960, 540, 0x0f0c29);

    // Add postFX to main camera
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
      const cm = this.cameras.main.postFX.addColorMatrix();
      // saturation removed
    }

    // Back Button (Top Left)
    const backContainer = this.add.container(80, 40);
    const backBtn = this.add
      .rectangle(0, 0, 100, 40, 0xe74c3c)
      .setStrokeStyle(2, 0xffffff);
    const backTxt = this.add
      .text(0, 0, "BACK", {
        fontSize: "18px",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);
    backContainer.add([backBtn, backTxt]);

    backBtn
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => backBtn.setFillStyle(0xc0392b))
      .on("pointerout", () => backBtn.setFillStyle(0xe74c3c))
      .on("pointerdown", () => {
        if (this.returnScene === "PauseScene") {
          this.scene.stop();
          this.scene.wake("PauseScene");
        } else {
          transitionTo(this, "MenuScene");
        }
      });

    // Title
    this.add
      .text(480, 45, "SETTINGS", {
        fontSize: "32px",
        fontStyle: "bold",
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // --- AUDIO SETTING ---
    this.add
      .text(480, 90, "AUDIO SETTINGS", {
        fontSize: "20px",
        color: "#aaa",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // Helper for sliders
    const createSlider = (x: number, y: number, label: string, key: string, defaultVal: number, isBgm: boolean) => {
      let val = this.registry.get(key);
      if (val === undefined) {
        val = defaultVal;
        this.registry.set(key, val);
      }
      
      this.add.text(x - 120, y, label, { fontSize: "18px", color: "#fff", fontFamily: "system-ui" }).setOrigin(1, 0.5);
      
      const track = this.add.rectangle(x - 100, y, 200, 8, 0x555555).setOrigin(0, 0.5);
      const fill = this.add.rectangle(x - 100, y, 200 * val, 8, 0x3498db).setOrigin(0, 0.5);
      const handle = this.add.circle(x - 100 + 200 * val, y, 10, 0xffffff).setInteractive({ draggable: true, useHandCursor: true });
      
      let lastSfxPlay = 0;
      const updateVolume = (v: number, playSound = false) => {
        val = Phaser.Math.Clamp(v, 0, 1);
        this.registry.set(key, val);
        fill.width = 200 * val;
        handle.x = (x - 100) + 200 * val;
        
        if (isBgm) {
           this.sound.getAll("bgm_menu").forEach(s => (s as any).setVolume(val));
           this.sound.getAll("bgm_battle").forEach(s => (s as any).setVolume(val));
        } else if (playSound) {
           const now = Date.now();
           if (now - lastSfxPlay > 150) {
               lastSfxPlay = now;
               if (this.cache.audio.exists("sfx_select") || this.sound.get("sfx_select")) {
                   this.sound.play("sfx_select", { volume: val });
               }
           }
        }
      };

      handle.on('drag', (pointer: any, dragX: number) => {
         const pct = (dragX - (x - 100)) / 200;
         updateVolume(pct, true);
         if (isBgm && onBgmDragCallback) onBgmDragCallback(pct);
      });
      
      // Click on track to set value
      track.setInteractive({ useHandCursor: true }).on('pointerdown', (pointer: any) => {
         const pct = (pointer.x - (x - 100)) / 200;
         updateVolume(pct, true);
         if (isBgm && onBgmDragCallback) onBgmDragCallback(pct);
      });
      fill.setInteractive({ useHandCursor: true }).on('pointerdown', (pointer: any) => {
         const pct = (pointer.x - (x - 100)) / 200;
         updateVolume(pct, true);
         if (isBgm && onBgmDragCallback) onBgmDragCallback(pct);
      });

      return updateVolume;
    };

    let onBgmDragCallback: ((vol: number) => void) | null = null;
    let cachedBgmVolume = this.registry.get("bgmVolume") ?? 0.5;
    if (cachedBgmVolume === 0) cachedBgmVolume = 0.5;

    const updateBgmSlider = createSlider(480, 165, "Music Vol", "bgmVolume", 0.5, true);
    createSlider(480, 200, "SFX Vol", "sfxVolume", 1.0, false);

    // BGM Toggle
    let bgmEnabled = this.registry.get("bgmEnabled") !== false;
    if (!bgmEnabled) {
      updateBgmSlider(0, false);
    }

    const bgmToggleText = this.add
      .text(480, 125, bgmEnabled ? "MUSIC: ON" : "MUSIC: OFF", {
        fontSize: "22px",
        color: bgmEnabled ? "#2ecc71" : "#e74c3c",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    onBgmDragCallback = (vol: number) => {
      const shouldBeEnabled = vol > 0;
      if (shouldBeEnabled !== bgmEnabled) {
         bgmEnabled = shouldBeEnabled;
         this.registry.set("bgmEnabled", bgmEnabled);
         bgmToggleText.setText(bgmEnabled ? "MUSIC: ON" : "MUSIC: OFF");
         bgmToggleText.setColor(bgmEnabled ? "#2ecc71" : "#e74c3c");
      }
      if (vol > 0) {
         cachedBgmVolume = vol;
      }
    };

    bgmToggleText.on("pointerdown", () => {
      bgmEnabled = !bgmEnabled;
      this.registry.set("bgmEnabled", bgmEnabled);
      bgmToggleText.setText(bgmEnabled ? "MUSIC: ON" : "MUSIC: OFF");
      bgmToggleText.setColor(bgmEnabled ? "#2ecc71" : "#e74c3c");
      
      const newVol = bgmEnabled ? cachedBgmVolume : 0;
      updateBgmSlider(newVol, false);
      
      this.tweens.add({ targets: bgmToggleText, scaleX: 1.1, scaleY: 1.1, duration: 100, yoyo: true });
      if (bgmEnabled && (this.cache.audio.exists("sfx_select") || this.sound.get("sfx_select"))) {
         this.sound.play("sfx_select", { volume: this.registry.get("sfxVolume") ?? 1.0 });
      }
    });

    // --- CONTROLS ---
    const controlsBtn = this.add
      .rectangle(850, 40, 180, 40, 0x9b59b6)
      .setStrokeStyle(2, 0xffffff);
    const controlsTxt = this.add
      .text(850, 40, "PC CONTROLS", {
        fontSize: "18px",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    controlsBtn
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => controlsBtn.setFillStyle(0x8e44ad))
      .on("pointerout", () => controlsBtn.setFillStyle(0x9b59b6))
      .on("pointerdown", () => this.showControlsOverlay());

    // --- DISPLAY / PERFORMANCE ---
    this.add
      .text(480, 248, "DISPLAY & PERFORMANCE", {
        fontSize: "18px",
        color: "#aaa",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    let potatoMode = state.settings?.lowPerformanceMode || false;
    const perfBtn = this.add
      .rectangle(480, 282, 260, 36, potatoMode ? 0xe74c3c : 0x2ecc71)
      .setStrokeStyle(2, 0xffffff);
    const perfTxt = this.add
      .text(480, 282, potatoMode ? "POTATO MODE: ON" : "POTATO MODE: OFF", {
        fontSize: "15px",
        fontStyle: "bold",
        color: "#000",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5);
    perfBtn.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      potatoMode = !potatoMode;
      if (!state.settings) state.settings = {};
      state.settings.lowPerformanceMode = potatoMode;
      window.UTLW.save();
      perfBtn.setFillStyle(potatoMode ? 0xe74c3c : 0x2ecc71);
      perfTxt.setText(potatoMode ? "POTATO MODE: ON" : "POTATO MODE: OFF");
    });

    const isMobile = this.sys.game.device.input.touch || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      const hudBtn = this.add
        .rectangle(480, 330, 260, 36, 0xf39c12)
        .setStrokeStyle(2, 0xffffff);
      const hudTxt = this.add
        .text(480, 330, "CUSTOMIZE MOBILE HUD", {
          fontSize: "14px",
          fontStyle: "bold",
          color: "#000",
          fontFamily: "system-ui",
        })
        .setOrigin(0.5);
      hudBtn.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        this.showHudEditor();
      });
    }

    // --- DATA MANAGEMENT (SAVE/LOAD) ---
    const dataY = isMobile ? 385 : 345;
    this.add
      .text(480, dataY, "DATA MANAGEMENT", {
        fontSize: "18px",
        color: "#aaa",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // Export Button
    const exportBtn = this.add
      .rectangle(380, dataY + 36, 180, 36, 0x3498db)
      .setStrokeStyle(2, 0xffffff);
    const exportTxt = this.add
      .text(380, dataY + 36, "DOWNLOAD SAVE", {
        fontSize: "15px",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    exportBtn
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => exportBtn.setFillStyle(0x2980b9))
      .on("pointerout", () => exportBtn.setFillStyle(0x3498db))
      .on("pointerdown", () => this.downloadSaveData());

    // Import Button
    const importBtn = this.add
      .rectangle(580, dataY + 36, 180, 36, 0xe67e22)
      .setStrokeStyle(2, 0xffffff);
    const importTxt = this.add
      .text(580, dataY + 36, "UPLOAD SAVE", {
        fontSize: "15px",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    importBtn
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => importBtn.setFillStyle(0xd35400))
      .on("pointerout", () => importBtn.setFillStyle(0xe67e22))
      .on("pointerdown", () => this.triggerImportSave());

    // --- APP INSTALLATION ---
    if ((window as any).deferredPWAInstallPrompt) {
      const installBtn = this.add
        .rectangle(480, dataY + 85, 250, 44, 0xf1c40f)
        .setStrokeStyle(3, 0xffffff);
      const installTxt = this.add
        .text(480, dataY + 85, "INSTALL OFFLINE GAME", {
          fontSize: "18px",
          color: "#000",
          fontStyle: "bold",
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      // Add a pulsing effect to grab attention
      this.tweens.add({
        targets: installBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });

      installBtn
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => installBtn.setFillStyle(0xf39c12))
        .on("pointerout", () => installBtn.setFillStyle(0xf1c40f))
        .on("pointerdown", () => {
          window.dispatchEvent(new Event("request-pwa-install"));
          this.time.delayedCall(2000, () => {
            if (!(window as any).deferredPWAInstallPrompt) {
              installBtn.destroy();
              installTxt.destroy();
            }
          });
        });
    }
  }

  
  showHudEditor() {
    const overlay = this.add.container(0, 0);
    overlay.setDepth(200);

    // Dark background
    const bg = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.95);
    bg.setInteractive();

    const state = this.registry.get("gameState") as GameState;
    if (!state.settings) state.settings = {};
    if (!state.settings.hudConfig) {
       state.settings.hudConfig = {
         dpadPos: { x: 150, y: 380 },
         dpadScale: 1,
         buttonsPos: { x: 810, y: 380 },
         buttonsScale: 1,
         opacity: 0.5
       };
    }
    const cfg = state.settings.hudConfig;

    // Title
    const title = this.add.text(480, 30, "HUD EDITOR (DRAG ELEMENTS)", { fontSize: "24px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);

    // Draggable D-Pad representation
    const dpadCont = this.add.container(cfg.dpadPos.x, cfg.dpadPos.y);
    const dpadBg = this.add.circle(0, 0, 75, 0x3498db, cfg.opacity).setStrokeStyle(3, 0xffffff);
    dpadCont.add([dpadBg, this.add.text(0, 0, "JOYSTICK", { fontSize: "16px", color: "#fff" }).setOrigin(0.5)]);
    dpadCont.setScale(cfg.dpadScale);
    dpadBg.setInteractive({ draggable: true });
    
    // Draggable Action Buttons representation
    const btnCont = this.add.container(cfg.buttonsPos.x, cfg.buttonsPos.y);
    const btnBg = this.add.circle(0, 0, 100, 0xe74c3c, cfg.opacity).setStrokeStyle(3, 0xffffff);
    btnCont.add([btnBg, this.add.text(0, 0, "ACTION\nBUTTONS", { fontSize: "16px", color: "#fff", align: "center" }).setOrigin(0.5)]);
    btnCont.setScale(cfg.buttonsScale);
    btnBg.setInteractive({ draggable: true });

    this.input.setDraggable(dpadBg);
    this.input.setDraggable(btnBg);

    this.input.on('drag', (pointer: any, gameObject: any, dragX: number, dragY: number) => {
        const parent = gameObject.parentContainer;
        parent.x = dragX;
        parent.y = dragY;
    });

    // Sliders
    let sOpacity = cfg.opacity;
    let sScale = cfg.dpadScale; // using same scale for both for simplicity

    const createSlider = (x: number, y: number, label: string, initVal: number, min: number, max: number, onChange: (val: number) => void) => {
        const c = this.add.container(x, y);
        c.add(this.add.text(-120, 0, label, { fontSize: "16px", color: "#fff" }).setOrigin(1, 0.5));
        const track = this.add.rectangle(0, 0, 200, 8, 0x555555).setOrigin(0, 0.5);
        const percent = (initVal - min) / (max - min);
        const fill = this.add.rectangle(0, 0, 200 * percent, 8, 0x2ecc71).setOrigin(0, 0.5);
        const handle = this.add.circle(200 * percent, 0, 10, 0xffffff).setInteractive({ draggable: true });
        c.add([track, fill, handle]);
        
        handle.on('drag', (pointer: any, dragX: number) => {
           let nx = Math.max(0, Math.min(200, dragX));
           handle.x = nx;
           fill.width = nx;
           let p = nx / 200;
           let v = min + p * (max - min);
           onChange(v);
        });
        return c;
    };

    const s1 = createSlider(380, 430, "OPACITY", sOpacity, 0.1, 1.0, (v) => {
       sOpacity = v;
       dpadBg.setAlpha(v);
       btnBg.setAlpha(v);
    });

    const s2 = createSlider(380, 470, "SCALE", sScale, 0.5, 2.0, (v) => {
       sScale = v;
       dpadCont.setScale(v);
       btnCont.setScale(v);
    });

    // Save & Close Button
    const saveBtn = this.add.rectangle(480, 510, 150, 40, 0x2ecc71).setInteractive({ useHandCursor: true });
    const saveTxt = this.add.text(480, 510, "SAVE", { fontSize: "18px", color: "#000", fontStyle: "bold" }).setOrigin(0.5);

    saveBtn.on("pointerdown", () => {
       cfg.dpadPos = { x: dpadCont.x, y: dpadCont.y };
       cfg.buttonsPos = { x: btnCont.x, y: btnCont.y };
       cfg.dpadScale = sScale;
       cfg.buttonsScale = sScale;
       cfg.opacity = sOpacity;
       window.UTLW.save();
       
       overlay.destroy();
       
       // Remove drag event listeners to avoid memory leaks
       this.input.off('drag');
    });

    overlay.add([bg, title, dpadCont, btnCont, s1, s2, saveBtn, saveTxt]);
  }


  showControlsOverlay() {
    const overlay = this.add.container(0, 0);
    overlay.setDepth(100);

    // Dark background
    const bg = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.85);
    bg.setInteractive(); // Block clicks

    // Modal Background
    const modal = this.add
      .rectangle(480, 270, 700, 400, 0x1f1f1f)
      .setStrokeStyle(4, 0xffd54a);

    const title = this.add
      .text(480, 110, "PC CONTROLS", {
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffd54a",
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // Player 1 Controls
    const p1Title = this.add
      .text(260, 160, "PLAYER 1", {
        fontSize: "22px",
        fontStyle: "bold",
        color: "#3498db",
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);
    const p1Controls = this.add
      .text(
        260,
        260,
        "Move: W, A, S, D\n" +
          "Dash: Double A or D\n\n" +
          "Attack: E\n" +
          "Ki Blast: C\n" +
          "Defend: Q\n" +
          "Charge Ki: R\n" +
          "Special: V\n" +
          "Transform: X",
        {
          fontSize: "18px",
          align: "center",
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
          resolution: 2,
        },
      )
      .setOrigin(0.5);

    // Player 2 Controls
    const p2Title = this.add
      .text(700, 160, "PLAYER 2", {
        fontSize: "22px",
        fontStyle: "bold",
        color: "#e74c3c",
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);
    const p2Controls = this.add
      .text(
        700,
        260,
        "Move: Arrows\n" +
          "Dash: Double Left/Right\n\n" +
          "Attack: I\n" +
          "Ki Blast: L\n" +
          "Defend: O\n" +
          "Charge Ki: U\n" +
          "Special: K\n" +
          "Transform: P",
        {
          fontSize: "18px",
          align: "center",
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
          resolution: 2,
        },
      )
      .setOrigin(0.5);

    // Divider
    const divider = this.add.rectangle(480, 260, 2, 220, 0xffffff, 0.3);

    // Close Button
    const closeBtn = this.add
      .rectangle(480, 420, 150, 40, 0xe74c3c)
      .setStrokeStyle(2, 0xffffff);
    const closeTxt = this.add
      .text(480, 420, "CLOSE", {
        fontSize: "18px",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    closeBtn
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => closeBtn.setFillStyle(0xc0392b))
      .on("pointerout", () => closeBtn.setFillStyle(0xe74c3c))
      .on("pointerdown", () => {
        overlay.destroy();
      });

    overlay.add([
      bg,
      modal,
      title,
      p1Title,
      p1Controls,
      p2Title,
      p2Controls,
      divider,
      closeBtn,
      closeTxt,
    ]);
  }

  downloadSaveData() {
    // 1. Get data from local storage or current state
    window.UTLW.save(); // Ensure latest state is saved
    const saveData = localStorage.getItem("utlw_save_v1");

    if (!saveData) {
      console.error("No save data found");
      return;
    }

    // 2. Create a Blob
    const blob = new Blob([saveData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // 3. Create invisible anchor and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `utlw_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();

    // 4. Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Feedback
    const txt = this.add
      .text(380, 430, "DOWNLOADED!", { color: "#00ff00", fontSize: "14px" })
      .setOrigin(0.5);
    this.tweens.add({
      targets: txt,
      alpha: 0,
      duration: 2000,
      onComplete: () => txt.destroy(),
    });
  }

  triggerImportSave() {
    // 1. Create invisible file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";
    document.body.appendChild(input);

    // 2. Listen for change
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const json = event.target.result;
          const parsed = JSON.parse(json);

          // Simple validation
          if (parsed.coins !== undefined && Array.isArray(parsed.characters)) {
            localStorage.setItem("utlw_save_v1", json);

            // Feedback
            const txt = this.add
              .text(580, 430, "SUCCESS! RELOADING...", {
                color: "#00ff00",
                fontSize: "14px",
              })
              .setOrigin(0.5);

            setTimeout(() => {
              window.location.reload(); // Reload to apply new save state cleanly
            }, 1000);
          } else {
            throw new Error("Invalid Save File");
          }
        } catch (err) {
          console.error("Import Failed", err);
          const txt = this.add
            .text(580, 430, "INVALID FILE!", {
              color: "#ff0000",
              fontSize: "14px",
            })
            .setOrigin(0.5);
          this.tweens.add({
            targets: txt,
            alpha: 0,
            duration: 2000,
            onComplete: () => txt.destroy(),
          });
        }
      };
      reader.readAsText(file);
      document.body.removeChild(input);
    };

    // 3. Trigger click
    input.click();
  }
}
