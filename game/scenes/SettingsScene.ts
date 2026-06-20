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

  create() {
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
      .on("pointerdown", () => this.scene.start("MenuScene"));

    // Title
    this.add
      .text(480, 50, "SETTINGS", {
        fontSize: "32px",
        fontStyle: "bold",
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // --- AUDIO SETTING ---
    this.add
      .text(480, 100, "AUDIO", {
        fontSize: "20px",
        color: "#aaa",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    const isMuted = this.sound.mute;
    const soundText = this.add
      .text(480, 130, isMuted ? "SOUND: OFF" : "SOUND: ON", {
        fontSize: "24px",
        color: isMuted ? "#e74c3c" : "#2ecc71", // Red if OFF, Green if ON
        fontStyle: "bold",
        fontFamily:
          "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    soundText.on("pointerdown", () => {
      const newMuteState = !this.sound.mute;
      this.sound.mute = newMuteState;

      soundText.setText(newMuteState ? "SOUND: OFF" : "SOUND: ON");
      soundText.setColor(newMuteState ? "#e74c3c" : "#2ecc71");

      // Visual pop
      this.tweens.add({
        targets: soundText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
      });

      // Auditory confirmation if turning on
      if (!newMuteState) {
        // Check if 'sfx_select' exists as standard practice in this codebase
        if (
          this.sound.getAll("sfx_select").length > 0 ||
          this.sound.get("sfx_select")
        ) {
          this.sound.play("sfx_select");
        }
      }
    });

    // --- DIFFICULTY ---
    this.add
      .text(480, 180, "DIFFICULTY (AI Only)", {
        fontSize: "20px",
        color: "#aaa",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    const difficulties = ["Easy", "Normal", "Hard"];
    difficulties.forEach((diff, i) => {
      const isSelected = state.difficulty === i;
      const color = isSelected ? "#ffd54a" : "#666";
      const y = 220 + i * 40; // Compacted slightly
      const t = this.add
        .text(480, y, diff, {
          fontSize: "24px",
          color: color,
          fontStyle: isSelected ? "bold" : "normal",
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      // Marker
      if (isSelected) {
        this.add
          .text(380, y, "►", {
            fontSize: "24px",
            color: "#ffd54a",
            fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
            resolution: 2,
          })
          .setOrigin(0.5);
      }

      t.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        state.difficulty = i;
        this.scene.restart(); // Restart scene to refresh UI
      });
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

    // --- DATA MANAGEMENT (SAVE/LOAD) ---
    this.add
      .text(480, 350, "DATA MANAGEMENT", {
        fontSize: "20px",
        color: "#aaa",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    // Export Button
    const exportBtn = this.add
      .rectangle(380, 390, 180, 40, 0x3498db)
      .setStrokeStyle(2, 0xffffff);
    const exportTxt = this.add
      .text(380, 390, "DOWNLOAD SAVE", {
        fontSize: "16px",
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
      .rectangle(580, 390, 180, 40, 0xe67e22)
      .setStrokeStyle(2, 0xffffff);
    const importTxt = this.add
      .text(580, 390, "UPLOAD SAVE", {
        fontSize: "16px",
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
        .rectangle(480, 480, 250, 50, 0xf1c40f)
        .setStrokeStyle(3, 0xffffff);
      const installTxt = this.add
        .text(480, 480, "INSTALL OFFLINE GAME", {
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
        "Move: W, A, S, D\n\n" +
          "Attack: E\n" +
          "Ki Blast: C\n" +
          "Defend/Ki: Q\n" +
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
        "Move: Arrows\n\n" +
          "Attack: I\n" +
          "Ki Blast: L\n" +
          "Defend/Ki: O\n" +
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
