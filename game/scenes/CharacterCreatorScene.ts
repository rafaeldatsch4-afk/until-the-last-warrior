import { transitionTo } from "../utils/sceneTransition";
import Phaser from "phaser";
import { INITIAL_CHARACTERS } from "../data";
import { CharacterData } from "../types";
import { CreatorState } from "../creator/CreatorState";
import { CreatorPreview } from "../creator/CreatorPreview";
import { CreatorUI } from "../creator/CreatorUI";
import { auraColors, giColors, hairColors, partOptions, skinColors } from "../creator/CreatorPartOptions";
import { generateCustomSprite } from "../sprites/CustomSprite";

export default class CharacterCreatorScene extends Phaser.Scene {
  private state = new CreatorState();
  private preview!: CreatorPreview;
  private ui!: CreatorUI;

  private currentBaseObjIndex = 0;
  private currentColorIndex = 0;

  private customSp1Id = "";
  private customSp2Id = "";
  private customSp1Name = "";
  private customSp2Name = "";
  private previewIsTransformed = false;

  private builderData = {
    base: INITIAL_CHARACTERS[0],
    auraColor: auraColors[0],
    name: "Custom",
  };

  private AVAILABLE_SPECIALS = [
    { id: "goku", name: "Kamehameha" },
    { id: "vegeta", name: "Galick Gun" },
    { id: "kuririn", name: "Destructo Disc" },
    { id: "piccolo", name: "Special Beam" },
    { id: "trunks", name: "Burning Attack" },
    { id: "freeza", name: "Death Beam" },
    { id: "cell", name: "Kamehameha" },
    { id: "buu", name: "Innocence Cannon" },
    { id: "gohan", name: "Masenko" },
    { id: "naruto", name: "Rasengan" },
    { id: "sasuke", name: "Chidori" },
    { id: "luffy", name: "Gomu Pistol" },
    { id: "zoro", name: "Onigiri" },
    { id: "saitama", name: "Normal Punch" },
    { id: "ichigo", name: "Getsuga Tensho" },
    { id: "jotaro", name: "Ora Ora Punch" },
    { id: "spiderman", name: "Web Shooter" },
    { id: "chapolim", name: "Marreta Bionica" },
  ];

  private AVAILABLE_SUPERS = [
    { id: "goku", name: "Spirit Bomb" },
    { id: "vegeta", name: "Final Flash" },
    { id: "kuririn", name: "Super Disc" },
    { id: "piccolo", name: "Hellzone Grenade" },
    { id: "freeza", name: "Death Ball" },
    { id: "naruto", name: "Rasenshuriken" },
    { id: "sasuke", name: "Kirin" },
    { id: "zoro", name: "Asura" },
    { id: "saitama", name: "Serious Punch" },
    { id: "ichigo", name: "Mugetsu" },
    { id: "jotaro", name: "Star Platinum" },
    { id: "madara", name: "Tengai Shinsei" },
    { id: "obito", name: "Kamui" },
  ];

  constructor() {
    super("CharacterCreatorScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    
    const { width, height } = this.cameras.main;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0515, 0x000000, 0x1f0f38, 0x050510, 1);
    bg.fillRect(0, 0, width, height);

    // Grid pattern
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x3498db, 0.1);
    for (let x = 0; x < width; x += 40) grid.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) grid.moveTo(0, y).lineTo(width, y);
    grid.strokePath();

    this.add.image(width / 2, height / 2, "arena").setAlpha(0.15).setBlendMode(Phaser.BlendModes.SCREEN);

    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
    }

    this.preview = new CreatorPreview(this);
    this.ui = new CreatorUI(this, () => this.updatePreview());

    // Back button
    this.createStyledButton(80, 40, 120, 40, "VOLTAR", 0xe74c3c, () => transitionTo(this, "MenuScene"));

    // Title
    this.add.text(480, 50, "CRIAR PERSONAGEM", { fontSize: "32px", fontStyle: "italic bold", color: "#f39c12", fontFamily: "system-ui, sans-serif", stroke: "#000", strokeThickness: 4, shadow: { offsetX: 0, offsetY: 0, color: "#f39c12", blur: 10, fill: true, stroke: true } }).setOrigin(0.5);

    // Build Selectors using the extracted UI
    this.ui.buildAllSelectors(this.state);

    this.setupNamesAndSpecials();
    this.setupSaveButton();

    // Box
    const previewBox = this.add.rectangle(700, 280, 300, 360, 0x1a1a24, 0.8).setStrokeStyle(2, 0x3498db);
    this.tweens.add({ targets: previewBox, alpha: 0.5, yoyo: true, repeat: -1, duration: 2000 });
    this.add.text(700, 130, "PREVIEW", { fontSize: "24px", fontStyle: "italic bold", color: "#3498db", stroke: "#000", strokeThickness: 2, shadow: { offsetX: 0, offsetY: 0, color: "#3498db", blur: 10, fill: true, stroke: true } }).setOrigin(0.5);
    
    // Pedestal
    const pedestal = this.add.ellipse(700, 420, 120, 40, 0x3498db, 0.3);
    this.tweens.add({ targets: pedestal, scaleX: 1.1, scaleY: 1.1, alpha: 0.1, yoyo: true, repeat: -1, duration: 1500 });


    // Randomize button
    this.createStyledButton(880, 40, 150, 40, "ALEATÓRIO", 0x8e44ad, () => {
      // Randomize styles
      this.state.style_idx.head = Phaser.Math.Between(0, partOptions.head.length - 1);
      this.state.style_idx.torso = Phaser.Math.Between(0, partOptions.torso.length - 1);
      this.state.style_idx.legs = Phaser.Math.Between(0, partOptions.legs.length - 1);
      this.state.style_idx.feet = Phaser.Math.Between(0, partOptions.feet.length - 1);
      this.state.style_idx.accessory = Phaser.Math.Between(0, partOptions.accessory.length - 1);
      
      // Randomize colors
      this.state.p_idx.skin = Phaser.Math.Between(0, skinColors.length - 1);
      this.state.p_idx.hair = Phaser.Math.Between(0, hairColors.length - 1);
      this.state.p_idx.torso_1 = Phaser.Math.Between(0, giColors.length - 1);
      this.state.p_idx.torso_2 = Phaser.Math.Between(0, giColors.length - 1);
      this.state.p_idx.legs_1 = Phaser.Math.Between(0, giColors.length - 1);
      this.state.p_idx.legs_2 = Phaser.Math.Between(0, giColors.length - 1);
      this.state.p_idx.feet_1 = Phaser.Math.Between(0, giColors.length - 1);
      this.state.p_idx.feet_2 = Phaser.Math.Between(0, giColors.length - 1);
      this.state.p_idx.head_1 = Phaser.Math.Between(0, giColors.length - 1);
      this.state.p_idx.head_2 = Phaser.Math.Between(0, giColors.length - 1);
      this.state.p_idx.acc_1 = Phaser.Math.Between(0, giColors.length - 1);

      // Randomize special and super
      const sp1 = Phaser.Utils.Array.GetRandom(this.AVAILABLE_SPECIALS);
      const sp2 = Phaser.Utils.Array.GetRandom(this.AVAILABLE_SUPERS);
      this.customSp1Id = sp1.id;
      this.customSp1Name = sp1.name;
      this.customSp2Id = sp2.id;
      this.customSp2Name = sp2.name;

      this.scene.restart(); 
    });

    this.createStyledButton(700, 480, 150, 35, "TRANSFORMAR", 0xf39c12, () => {
      this.previewIsTransformed = !this.previewIsTransformed;
      this.updatePreview();
    });

    this.updatePreview();
  }

  private updatePreview() {
    this.preview.updatePreview(
      this.state,
      this.currentBaseObjIndex,
      this.currentColorIndex,
      this.customSp1Id,
      this.customSp2Id,
      this.previewIsTransformed
    );
  }

  private setupNamesAndSpecials() {
    // Name
    const nameTxt = this.add.text(700, 80, `Nome: ${this.builderData.name}`, { fontSize: "24px", color: "#f1c40f", fontStyle: "bold" }).setOrigin(0.5);
    const editBtn = this.createStyledButton(700, 115, 90, 30, "EDITAR", 0x34495e, () => {
      window.dispatchEvent(
        new CustomEvent("request-text-input", {
          detail: {
            title: "Digite o nome:",
            currentValue: this.builderData.name,
            onComplete: (newName: string) => {
              if (newName && newName.trim().length > 0) {
                this.builderData.name = newName.substring(0, 15);
                nameTxt.setText(`Nome: ${this.builderData.name}`);
              }
            },
          },
        })
      );
    });

    // Special 1
    const sp1Txt = this.add.text(70, 390, `Esp 1: ${this.customSp1Name || this.builderData.base.specialName}`, { fontSize: "16px", color: "#fff" }).setOrigin(0, 0.5);
    const sp1Btn = this.createStyledButton(460, 390, 110, 30, "SELECIONAR", 0x34495e, () => {
      this.ui.showAttackSelectModal(false, this.AVAILABLE_SPECIALS, this.AVAILABLE_SUPERS, (id, name) => {
        this.customSp1Id = id;
        this.customSp1Name = name;
        sp1Txt.setText(`Esp 1: ${name}`);
        this.updatePreview();
      });
    });

    // Special 2
    const sp2Txt = this.add.text(70, 430, `Super: ${this.customSp2Name || this.builderData.base.superName}`, { fontSize: "16px", color: "#fff" }).setOrigin(0, 0.5);
    const sp2Btn = this.createStyledButton(460, 430, 110, 30, "SELECIONAR", 0x34495e, () => {
      this.ui.showAttackSelectModal(true, this.AVAILABLE_SPECIALS, this.AVAILABLE_SUPERS, (id, name) => {
        this.customSp2Id = id;
        this.customSp2Name = name;
        sp2Txt.setText(`Super: ${name}`);
        this.updatePreview();
      });
    });
  }

  private setupSaveButton() {
    this.createStyledButton(300, 490, 350, 50, "SALVAR E EQUIPAR", 0x27ae60, () => {
      const customData = {
        gi1: 0,
        gi2: 0,
        skin: skinColors[this.state.p_idx.skin],
        hair: hairColors[this.state.p_idx.hair],
        color_torso_1: giColors[this.state.p_idx.torso_1],
        color_torso_2: giColors[this.state.p_idx.torso_2],
        color_legs_1: giColors[this.state.p_idx.legs_1],
        color_legs_2: giColors[this.state.p_idx.legs_2],
        color_feet_1: giColors[this.state.p_idx.feet_1],
        color_feet_2: giColors[this.state.p_idx.feet_2],
        color_head_1: giColors[this.state.p_idx.head_1],
        color_head_2: giColors[this.state.p_idx.head_2],
        color_acc_1: giColors[this.state.p_idx.acc_1],
        sp1_id: this.customSp1Id || this.builderData.base.key,
        sp2_id: this.customSp2Id || this.builderData.base.key,
        part_head: partOptions.head[this.state.style_idx.head],
        part_torso: partOptions.torso[this.state.style_idx.torso],
        part_legs: partOptions.legs[this.state.style_idx.legs],
        part_feet: partOptions.feet[this.state.style_idx.feet],
        part_accessory: partOptions.accessory[this.state.style_idx.accessory],
      };

      const customChar: CharacterData = {
        ...this.builderData.base,
        id: 999,
        key: "custom_999",
        baseKey: this.builderData.base.key,
        name: this.builderData.name,
        specialColor: this.builderData.auraColor,
        specialName: this.customSp1Name || this.builderData.base.specialName,
        superName: this.customSp2Name || this.builderData.base.superName,
        price: 0,
        unlocked: true,
        customData: customData,
      };

      generateCustomSprite(this, customChar);

      const createAllForTex = (baseKey: string, texKey: string) => {
        const createAnim = (animKey: string, start: number, end: number, frameRate: number, repeat: number = -1) => {
          if (this.anims.exists(animKey)) this.anims.remove(animKey);
          const frames = [];
          for (let i = start; i <= end; i++) {
            frames.push({ key: texKey, frame: i.toString() });
          }
          if (frames.length > 0) {
            this.anims.create({ key: animKey, frames, frameRate, repeat });
          }
        };
        createAnim(`${baseKey}_idle`, 0, 3, 10, -1);
        createAnim(`${baseKey}_walk`, 4, 7, 12, -1);
        createAnim(`${baseKey}_attack`, 8, 9, 16, 0);
        createAnim(`${baseKey}_special`, 8, 9, 12, -1);
        createAnim(`${baseKey}_defend`, 10, 10, 10, -1);
        createAnim(`${baseKey}_transform`, 0, 3, 24, -1);
        createAnim(`${baseKey}_charge`, 11, 11, 10, -1);
      };

      createAllForTex("custom_999", "custom_999");
      createAllForTex("custom_999_ssj", "custom_999_ssj");
      createAllForTex("custom_999_ui", "custom_999_ui");

      const gameState = this.registry.get("gameState");
      if (gameState) {
        gameState.characters = gameState.characters.filter((c: CharacterData) => c.id !== 999);
        gameState.characters.push(customChar);
        gameState.p1CharacterId = 999;
        this.registry.set("gameState", gameState);
        // @ts-ignore
        if (window.UTLW) window.UTLW.save();
      }

      const confirmTxt = this.add.text(250, 350, "Equipado como Player 1!", { color: "#00ff00", fontSize: "18px", fontStyle: "bold" }).setOrigin(0.5);
      this.tweens.add({ targets: confirmTxt, alpha: 0, y: 320, duration: 2000, onComplete: () => confirmTxt.destroy() });
    });
  }
  createStyledButton(x: number, y: number, width: number, height: number, text: string, color: number, callback: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, height, color).setStrokeStyle(2, 0xffffff);
    const glow = this.add.rectangle(0, 0, width, height, color, 0.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    const txt = this.add.text(0, 0, text, { fontSize: Math.floor(height*0.4) + "px", fontStyle: "bold", fontFamily: "system-ui", color: "#fff", stroke: "#000", strokeThickness: 2 }).setOrigin(0.5);
    
    container.add([bg, glow, txt]);
    
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);
    
    hitArea.on("pointerover", () => {
      this.tweens.add({ targets: glow, alpha: 1, duration: 150 });
      this.tweens.add({ targets: container, scale: 1.05, duration: 150 });
      txt.setColor("#f1c40f");
    });
    hitArea.on("pointerout", () => {
      this.tweens.add({ targets: glow, alpha: 0, duration: 150 });
      this.tweens.add({ targets: container, scale: 1, duration: 150 });
      txt.setColor("#fff");
    });
    hitArea.on("pointerdown", () => {
      this.tweens.add({ targets: container, scale: 0.95, yoyo: true, duration: 50, onComplete: callback });
      if (this.sound && this.cache.audio.exists("sfx_select")) {
        this.sound.play("sfx_select", { volume: 0.5 });
      }
    });
    return container;
  }

}