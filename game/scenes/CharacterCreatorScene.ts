import Phaser from "phaser";
import { INITIAL_CHARACTERS } from "../data";
import { CharacterData } from "../types";
import { CreatorState } from "../creator/CreatorState";
import { CreatorPreview } from "../creator/CreatorPreview";
import { CreatorUI } from "../creator/CreatorUI";
import { auraColors, giColors, hairColors, partOptions, skinColors } from "../creator/CreatorPartOptions";

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
    this.add.rectangle(480, 270, 960, 540, 0x0f0c29);
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
    }

    this.preview = new CreatorPreview(this);
    this.ui = new CreatorUI(this, () => this.updatePreview());

    // Back button
    const backBtn = this.add.rectangle(80, 40, 100, 40, 0xe74c3c).setStrokeStyle(2, 0xffffff);
    this.add.text(80, 40, "VOLTAR", { fontSize: "18px", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5);
    backBtn.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.scene.start("MenuScene"));

    // Title
    this.add.text(480, 50, "CRIAR PERSONAGEM", { fontSize: "32px", fontStyle: "bold", color: "#f39c12", fontFamily: "system-ui, -apple-system, 'Arial Black', sans-serif" }).setOrigin(0.5);

    // Build Selectors using the extracted UI
    this.ui.buildAllSelectors(this.state);

    this.setupNamesAndSpecials();
    this.setupSaveButton();

    // Box
    this.add.rectangle(700, 280, 300, 360, 0x1a1a24).setStrokeStyle(2, 0x34495e);
    this.add.text(700, 130, "PREVIEW", { fontSize: "24px", fontStyle: "bold", color: "#3498db" }).setOrigin(0.5);

    this.updatePreview();
  }

  private updatePreview() {
    this.preview.updatePreview(
      this.state,
      this.currentBaseObjIndex,
      this.currentColorIndex,
      this.customSp1Id,
      this.customSp2Id
    );
  }

  private setupNamesAndSpecials() {
    // Name
    const nameTxt = this.add.text(700, 80, `Nome: ${this.builderData.name}`, { fontSize: "24px", color: "#f1c40f", fontStyle: "bold" }).setOrigin(0.5);
    const editBtn = this.add.rectangle(700, 115, 80, 30, 0x34495e).setInteractive({ useHandCursor: true });
    this.add.text(700, 115, "EDITAR", { fontSize: "14px" }).setOrigin(0.5);
    
    editBtn.on("pointerdown", () => {
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
    const sp1Btn = this.add.rectangle(460, 390, 100, 30, 0x34495e).setInteractive({ useHandCursor: true });
    this.add.text(460, 390, "SELECIONAR", { fontSize: "11px", fontStyle: "bold" }).setOrigin(0.5);
    sp1Btn.on("pointerdown", () => {
      this.ui.showAttackSelectModal(false, this.AVAILABLE_SPECIALS, this.AVAILABLE_SUPERS, (id, name) => {
        this.customSp1Id = id;
        this.customSp1Name = name;
        sp1Txt.setText(`Esp 1: ${name}`);
        this.updatePreview();
      });
    });

    // Special 2
    const sp2Txt = this.add.text(70, 430, `Super: ${this.customSp2Name || this.builderData.base.superName}`, { fontSize: "16px", color: "#fff" }).setOrigin(0, 0.5);
    const sp2Btn = this.add.rectangle(460, 430, 100, 30, 0x34495e).setInteractive({ useHandCursor: true });
    this.add.text(460, 430, "SELECIONAR", { fontSize: "11px", fontStyle: "bold" }).setOrigin(0.5);
    sp2Btn.on("pointerdown", () => {
      this.ui.showAttackSelectModal(true, this.AVAILABLE_SPECIALS, this.AVAILABLE_SUPERS, (id, name) => {
        this.customSp2Id = id;
        this.customSp2Name = name;
        sp2Txt.setText(`Super: ${name}`);
        this.updatePreview();
      });
    });
  }

  private setupSaveButton() {
    const saveBtn = this.add.rectangle(300, 490, 350, 50, 0x27ae60).setStrokeStyle(2, 0xffffff);
    this.add.text(300, 490, "SALVAR & EQUIPAR PERSONALIZADO", { fontSize: "16px", fontStyle: "bold", color: "#000" }).setOrigin(0.5);

    saveBtn.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
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
}
