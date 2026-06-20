import Phaser from "phaser";
import { INITIAL_CHARACTERS } from "../data";
import { CharacterData } from "../types";
import { generateCustomSprite } from "../sprites/CustomSprite";

export default class CharacterCreatorScene extends Phaser.Scene {
  private currentBaseObjIndex = 0;
  private previewSprite!: Phaser.GameObjects.Sprite;
  private previewAura!: Phaser.GameObjects.Shape;
  private auraColors = [
    0xffffff, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff,
    0x000000, 0xff8800,
  ];
  private currentColorIndex = 0;

  private skinColors = [
    0xffce9e, 0x8d5524, 0xe0ac69, 0xf1c27d, 0x5c3a21, 0x4aa37a,
  ];
  private hairColors = [
    0x1a1a1a, 0xe0e0e0, 0xffea00, 0xd92525, 0x003399, 0x2ecc71, 0x9b59b6,
  ];
  private giColors = [
    0xff5a00, 0x003399, 0xd92525, 0x111111, 0x2ecc71, 0xf1c40f, 0x8e44ad,
    0xffffff,
  ];
  private p_idx = {
    skin: 0,
    hair: 0,
    torso_1: 0,
    torso_2: 1,
    legs_1: 0,
    legs_2: 1,
    feet_1: 0,
    feet_2: 1,
    head_1: 0,
    head_2: 1,
    acc_1: 0,
  };

  private partOptions = {
    head: ["goku", "spiderman", "saitama", "chapolim", "vegeta", "jotaro"],
    torso: [
      "goku",
      "spiderman",
      "jotaro",
      "vegeta",
      "saitama",
      "chapolim",
      "muscle",
    ],
    legs: ["goku", "spiderman", "jotaro", "saitama", "vegeta", "chapolim"],
    feet: ["goku", "spiderman", "chapolim", "saitama", "vegeta", "jotaro"],
    accessory: ["none", "sword", "cape"],
  };
  private style_idx = { head: 0, torso: 0, legs: 0, feet: 0, accessory: 0 };

  private customSp1Id = "";
  private customSp2Id = "";
  private customSp1Name = "";
  private customSp2Name = "";

  constructor() {
    super("CharacterCreatorScene");
  }

  private createAnim = (
    animKey: string,
    texture: string,
    start: number,
    end: number,
    frameRate: number,
    repeat: number = -1,
  ) => {
    if (this.anims.exists(animKey)) this.anims.remove(animKey);
    const tex = this.textures.get(texture);
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = start; i <= end; i++) {
      if (tex && tex.has(i.toString()))
        frames.push({ key: texture, frame: i.toString() });
    }
    if (frames.length > 0) {
      this.anims.create({
        key: animKey,
        frames: frames,
        frameRate: frameRate,
        repeat: repeat,
      });
    }
  };

  create() {
    this.add.rectangle(480, 270, 960, 540, 0x0f0c29);

    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
    }

    const backContainer = this.add.container(80, 40);
    const backBtn = this.add
      .rectangle(0, 0, 100, 40, 0xe74c3c)
      .setStrokeStyle(2, 0xffffff);
    const backTxt = this.add
      .text(0, 0, "VOLTAR", {
        fontSize: "18px",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);
    backContainer.add([backBtn, backTxt]);

    backBtn
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => backBtn.setFillStyle(0xc0392b))
      .on("pointerout", () => backBtn.setFillStyle(0xe74c3c))
      .on("pointerdown", () => this.scene.start("MenuScene"));

    this.add
      .text(480, 50, "CRIAR PERSONAGEM", {
        fontSize: "32px",
        fontStyle: "bold",
        color: "#f39c12",
        fontFamily: "system-ui, -apple-system, 'Arial Black', sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    const builderData = {
      base: INITIAL_CHARACTERS[0],
      auraColor: 0xffffff,
      name: "Meu Guerreiro",
    };

    const getColorName = (hex: number) => {
      const map: { [key: number]: string } = {
        0xffffff: "Branco",
        0xff0000: "Vermelho",
        0x00ff00: "Verde",
        0x0000ff: "Azul",
        0xffff00: "Amarelo",
        0xff00ff: "Rosa",
        0x00ffff: "Ciano",
        0x000000: "Preto",
        0xff8800: "Laranja",
        0xffce9e: "Claro",
        0x8d5524: "Escuro",
        0xe0ac69: "Médio",
        0xf1c27d: "Amarelo",
        0x5c3a21: "Mto Escuro",
        0x4aa37a: "Alien",
        0x1a1a1a: "Preto",
        0xe0e0e0: "Platina",
        0xffea00: "Loiro",
        0xd92525: "Vermelho",
        0x003399: "Azul E.",
        0x2ecc71: "Verde E.",
        0x9b59b6: "Roxo",
        0xff5a00: "Laranja",
        0x111111: "Negro",
        0xf1c40f: "Dourado",
        0x8e44ad: "Roxo E.",
      };
      return map[hex] || `#${hex.toString(16)}`;
    };

    const updatePreview = () => {
      builderData.base = INITIAL_CHARACTERS[this.currentBaseObjIndex];
      builderData.auraColor = this.auraColors[this.currentColorIndex];

      // Generate Custom Sprite Dynamic
      const customData = {
        gi1: 0,
        gi2: 0,
        skin: this.skinColors[this.p_idx.skin],
        hair: this.hairColors[this.p_idx.hair],
        color_torso_1: this.giColors[this.p_idx.torso_1],
        color_torso_2: this.giColors[this.p_idx.torso_2],
        color_legs_1: this.giColors[this.p_idx.legs_1],
        color_legs_2: this.giColors[this.p_idx.legs_2],
        color_feet_1: this.giColors[this.p_idx.feet_1],
        color_feet_2: this.giColors[this.p_idx.feet_2],
        color_head_1: this.giColors[this.p_idx.head_1],
        color_head_2: this.giColors[this.p_idx.head_2],
        color_acc_1: this.giColors[this.p_idx.acc_1],
        sp1_id: this.customSp1Id || builderData.base.key,
        sp2_id: this.customSp2Id || builderData.base.key,
        part_head: this.partOptions.head[this.style_idx.head],
        part_torso: this.partOptions.torso[this.style_idx.torso],
        part_legs: this.partOptions.legs[this.style_idx.legs],
        part_feet: this.partOptions.feet[this.style_idx.feet],
        part_accessory: this.partOptions.accessory[this.style_idx.accessory],
      };

      if (this.previewSprite) {
        this.previewSprite.stop();
        if (this.textures.exists("dummy")) {
          this.previewSprite.setTexture("dummy");
        }
        this.previewSprite.destroy();
      }
      if (this.previewAura) this.previewAura.destroy();

      generateCustomSprite(this, {
        ...builderData.base,
        key: "custom_preview",
        customData: customData,
      });

      this.createAnim("custom_preview_idle", "custom_preview", 0, 3, 10, -1);

      this.previewAura = this.add
        .ellipse(700, 250, 150, 250, builderData.auraColor)
        .setAlpha(0.3)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.previewSprite = this.add
        .sprite(700, 250, "custom_preview")
        .setScale(3.5);
      if (this.textures.exists("custom_preview")) {
        this.previewSprite.play(`custom_preview_idle`);
      }
    };

    // Name Editor
    const y0 = 80;
    const nameX = 700;
    const nameTxt = this.add
      .text(nameX, y0, `Nome: ${builderData.name}`, {
        fontSize: "24px",
        fontFamily: "system-ui",
        color: "#f1c40f",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const editNameBtn = this.add
      .rectangle(nameX, y0 + 35, 80, 30, 0x34495e)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(nameX, y0 + 35, "EDITAR", { fontSize: "14px", fontFamily: "system-ui" })
      .setOrigin(0.5);

    // Add hover effects for the button
    editNameBtn.on("pointerover", () => editNameBtn.setFillStyle(0x2980b9));
    editNameBtn.on("pointerout", () => editNameBtn.setFillStyle(0x34495e));

    editNameBtn.on("pointerdown", () => {
      // Dispatch event to React overlay instead of using prompt() which may not work in iframe
      window.dispatchEvent(
        new CustomEvent("request-text-input", {
          detail: {
            title: "Digite o nome do seu guerreiro:",
            currentValue: builderData.name,
            onComplete: (newName: string) => {
              if (newName && newName.trim().length > 0) {
                builderData.name = newName.substring(0, 15);
                nameTxt.setText(`Nome: ${builderData.name}`);
              }
            },
          },
        }),
      );
    });

    // UI Layout Constants
    const col1X = 140; // Parts
    const col2X = 300; // Col 1
    const col3X = 460; // Col 2

    this.add
      .text(col1X, 100, "PEÇAS", {
        fontSize: "20px",
        fontStyle: "bold",
        fontFamily: "system-ui",
        color: "#f39c12",
      })
      .setOrigin(0.5);
    this.add
      .text(col2X, 100, "COR 1", {
        fontSize: "20px",
        fontStyle: "bold",
        fontFamily: "system-ui",
        color: "#f39c12",
      })
      .setOrigin(0.5);
    this.add
      .text(col3X, 100, "COR 2", {
        fontSize: "20px",
        fontStyle: "bold",
        fontFamily: "system-ui",
        color: "#f39c12",
      })
      .setOrigin(0.5);

    const createSelector = (
      x: number,
      y: number,
      getLabel: () => string,
      onPrev: () => void,
      onNext: () => void,
      width: number = 140,
    ) => {
      this.add.rectangle(x, y, width, 30, 0x1a252f).setStrokeStyle(2, 0x34495e);
      const txt = this.add
        .text(x, y, getLabel(), {
          fontSize: "13px",
          fontFamily: "system-ui",
          color: "#fff",
        })
        .setOrigin(0.5);

      const btnL = this.add
        .text(x - width / 2 + 15, y, "<", {
          fontSize: "18px",
          color: "#3498db",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          onPrev();
          txt.setText(getLabel());
          updatePreview();
        })
        .on("pointerover", () => btnL.setColor("#f1c40f").setScale(1.2))
        .on("pointerout", () => btnL.setColor("#3498db").setScale(1));

      const btnR = this.add
        .text(x + width / 2 - 15, y, ">", {
          fontSize: "18px",
          color: "#3498db",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          onNext();
          txt.setText(getLabel());
          updatePreview();
        })
        .on("pointerover", () => btnR.setColor("#f1c40f").setScale(1.2))
        .on("pointerout", () => btnR.setColor("#3498db").setScale(1));

      return txt;
    };

    const ySpacing = 38;
    let currY = 140;

    // Row 1: Skin, Hair, Aura
    createSelector(
      col1X,
      currY,
      () => `Pele: ${getColorName(this.skinColors[this.p_idx.skin])}`,
      () =>
        (this.p_idx.skin =
          (this.p_idx.skin - 1 + this.skinColors.length) %
          this.skinColors.length),
      () => (this.p_idx.skin = (this.p_idx.skin + 1) % this.skinColors.length),
    );
    createSelector(
      col2X,
      currY,
      () => `Cab.: ${getColorName(this.hairColors[this.p_idx.hair])}`,
      () =>
        (this.p_idx.hair =
          (this.p_idx.hair - 1 + this.hairColors.length) %
          this.hairColors.length),
      () => (this.p_idx.hair = (this.p_idx.hair + 1) % this.hairColors.length),
    );
    createSelector(
      col3X,
      currY,
      () => `Aura: ${getColorName(this.auraColors[this.currentColorIndex])}`,
      () =>
        (this.currentColorIndex =
          (this.currentColorIndex - 1 + this.auraColors.length) %
          this.auraColors.length),
      () =>
        (this.currentColorIndex =
          (this.currentColorIndex + 1) % this.auraColors.length),
    );

    currY += ySpacing;
    // Row 2: Head
    createSelector(
      col1X,
      currY,
      () => `Cabç: ${this.partOptions.head[this.style_idx.head]}`,
      () =>
        (this.style_idx.head =
          (this.style_idx.head - 1 + this.partOptions.head.length) %
          this.partOptions.head.length),
      () =>
        (this.style_idx.head =
          (this.style_idx.head + 1) % this.partOptions.head.length),
    );
    createSelector(
      col2X,
      currY,
      () => `C1: ${getColorName(this.giColors[this.p_idx.head_1])}`,
      () =>
        (this.p_idx.head_1 =
          (this.p_idx.head_1 - 1 + this.giColors.length) %
          this.giColors.length),
      () =>
        (this.p_idx.head_1 = (this.p_idx.head_1 + 1) % this.giColors.length),
    );
    createSelector(
      col3X,
      currY,
      () => `C2: ${getColorName(this.giColors[this.p_idx.head_2])}`,
      () =>
        (this.p_idx.head_2 =
          (this.p_idx.head_2 - 1 + this.giColors.length) %
          this.giColors.length),
      () =>
        (this.p_idx.head_2 = (this.p_idx.head_2 + 1) % this.giColors.length),
    );

    currY += ySpacing;
    // Row 3: Torso
    createSelector(
      col1X,
      currY,
      () => `Tro: ${this.partOptions.torso[this.style_idx.torso]}`,
      () =>
        (this.style_idx.torso =
          (this.style_idx.torso - 1 + this.partOptions.torso.length) %
          this.partOptions.torso.length),
      () =>
        (this.style_idx.torso =
          (this.style_idx.torso + 1) % this.partOptions.torso.length),
    );
    createSelector(
      col2X,
      currY,
      () => `C1: ${getColorName(this.giColors[this.p_idx.torso_1])}`,
      () =>
        (this.p_idx.torso_1 =
          (this.p_idx.torso_1 - 1 + this.giColors.length) %
          this.giColors.length),
      () =>
        (this.p_idx.torso_1 = (this.p_idx.torso_1 + 1) % this.giColors.length),
    );
    createSelector(
      col3X,
      currY,
      () => `C2: ${getColorName(this.giColors[this.p_idx.torso_2])}`,
      () =>
        (this.p_idx.torso_2 =
          (this.p_idx.torso_2 - 1 + this.giColors.length) %
          this.giColors.length),
      () =>
        (this.p_idx.torso_2 = (this.p_idx.torso_2 + 1) % this.giColors.length),
    );

    currY += ySpacing;
    // Row 4: Legs
    createSelector(
      col1X,
      currY,
      () => `Cal: ${this.partOptions.legs[this.style_idx.legs]}`,
      () =>
        (this.style_idx.legs =
          (this.style_idx.legs - 1 + this.partOptions.legs.length) %
          this.partOptions.legs.length),
      () =>
        (this.style_idx.legs =
          (this.style_idx.legs + 1) % this.partOptions.legs.length),
    );
    createSelector(
      col2X,
      currY,
      () => `C1: ${getColorName(this.giColors[this.p_idx.legs_1])}`,
      () =>
        (this.p_idx.legs_1 =
          (this.p_idx.legs_1 - 1 + this.giColors.length) %
          this.giColors.length),
      () =>
        (this.p_idx.legs_1 = (this.p_idx.legs_1 + 1) % this.giColors.length),
    );
    createSelector(
      col3X,
      currY,
      () => `C2: ${getColorName(this.giColors[this.p_idx.legs_2])}`,
      () =>
        (this.p_idx.legs_2 =
          (this.p_idx.legs_2 - 1 + this.giColors.length) %
          this.giColors.length),
      () =>
        (this.p_idx.legs_2 = (this.p_idx.legs_2 + 1) % this.giColors.length),
    );

    currY += ySpacing;
    // Row 5: Feet
    createSelector(
      col1X,
      currY,
      () => `Bot: ${this.partOptions.feet[this.style_idx.feet]}`,
      () =>
        (this.style_idx.feet =
          (this.style_idx.feet - 1 + this.partOptions.feet.length) %
          this.partOptions.feet.length),
      () =>
        (this.style_idx.feet =
          (this.style_idx.feet + 1) % this.partOptions.feet.length),
    );
    createSelector(
      col2X,
      currY,
      () => `C1: ${getColorName(this.giColors[this.p_idx.feet_1])}`,
      () =>
        (this.p_idx.feet_1 =
          (this.p_idx.feet_1 - 1 + this.giColors.length) %
          this.giColors.length),
      () =>
        (this.p_idx.feet_1 = (this.p_idx.feet_1 + 1) % this.giColors.length),
    );
    createSelector(
      col3X,
      currY,
      () => `C2: ${getColorName(this.giColors[this.p_idx.feet_2])}`,
      () =>
        (this.p_idx.feet_2 =
          (this.p_idx.feet_2 - 1 + this.giColors.length) %
          this.giColors.length),
      () =>
        (this.p_idx.feet_2 = (this.p_idx.feet_2 + 1) % this.giColors.length),
    );

    currY += ySpacing;
    // Row 6: Accessory
    createSelector(
      col1X,
      currY,
      () => `Acs: ${this.partOptions.accessory[this.style_idx.accessory]}`,
      () =>
        (this.style_idx.accessory =
          (this.style_idx.accessory - 1 + this.partOptions.accessory.length) %
          this.partOptions.accessory.length),
      () =>
        (this.style_idx.accessory =
          (this.style_idx.accessory + 1) % this.partOptions.accessory.length),
    );
    createSelector(
      col2X,
      currY,
      () => `C1: ${getColorName(this.giColors[this.p_idx.acc_1])}`,
      () =>
        (this.p_idx.acc_1 =
          (this.p_idx.acc_1 - 1 + this.giColors.length) % this.giColors.length),
      () => (this.p_idx.acc_1 = (this.p_idx.acc_1 + 1) % this.giColors.length),
    );

    // Ensure we replace all the old `addArrowBtn` references.

    const AVAILABLE_SPECIALS = [
      { id: "goku", name: "Kamehameha" },
      { id: "vegeta", name: "Galick Gun" },
      { id: "piccolo", name: "Makankosappo" },
      { id: "gohan", name: "Masenko" },
      { id: "naruto", name: "Rasengan" },
      { id: "gojo", name: "Vazio Roxo" },
      { id: "saitama", name: "Soco Sério" },
      { id: "spiderman", name: "Teia de Aranha" },
      { id: "cyberninja", name: "Plasma Dash" },
      { id: "thukuna", name: "Flecha de Fogo" },
      { id: "jotaro", name: "Ora Ora" },
      { id: "optimus", name: "Tiro de Ion" },
      { id: "cell", name: "Kamehameha Perfeito" },
      { id: "frieren", name: "Zoltraak" },
      { id: "itachi", name: "Amaterasu" },
      { id: "leonardo", name: "Corte Duplo" },
      { id: "batman", name: "Batarangue" },
      { id: "chapolim", name: "Marreta Biônica" },
      { id: "obito", name: "Katon" },
    ];

    const AVAILABLE_SUPERS = [
      { id: "goku", name: "Genki Dama" },
      { id: "vegeta", name: "Final Flash" },
      { id: "piccolo", name: "Hellzone Grenade" },
      { id: "gohan", name: "Kamehameha Pai-Filho" },
      { id: "naruto", name: "Rasenshuriken" },
      { id: "gojo", name: "Expansão de Domínio" },
      { id: "saitama", name: "Soco Muito Sério" },
      { id: "madara", name: "Meteoro" },
      { id: "thukuna", name: "Santuário Malevolente" },
      { id: "cyberninja", name: "Cyber Overdrive" },
      { id: "jotaro", name: "Star Platinum: Za Warudo" },
      { id: "optimus", name: "Ataque Veicular" },
      { id: "cell", name: "Absorção" },
      { id: "frieren", name: "Magia Oculta" },
      { id: "itachi", name: "Tsukuyomi" },
      { id: "leonardo", name: "Fúria Ninja" },
      { id: "batman", name: "Batmovel" },
      { id: "chapolim", name: "Pílulas de Nanicolina" },
      { id: "obito", name: "Kamui" },
    ];

    const showAttackSelectModal = (
      isSuper: boolean,
      onSelect: (id: string, name: string) => void,
    ) => {
      const bg = this.add
        .rectangle(480, 270, 960, 540, 0x000000, 0.8)
        .setInteractive();
      const panel = this.add
        .rectangle(480, 270, 560, 480, 0x2c3e50)
        .setStrokeStyle(4, 0x34495e);
      const title = this.add
        .text(
          480,
          60,
          isSuper ? "Selecionar Especial 2 (Super)" : "Selecionar Especial 1",
          { fontSize: "24px", fontStyle: "bold", fontFamily: "system-ui" },
        )
        .setOrigin(0.5);

      const listContainer = this.add.container(230, 100);
      const list = isSuper ? AVAILABLE_SUPERS : AVAILABLE_SPECIALS;

      let currentPage = 0;
      const itemsPerPage = 14;
      const totalPages = Math.ceil(list.length / itemsPerPage);

      let cancelBtn: Phaser.GameObjects.Rectangle;
      let cancelTxt: Phaser.GameObjects.Text;
      let prevBtn: Phaser.GameObjects.Rectangle | undefined;
      let prevTxt: Phaser.GameObjects.Text | undefined;
      let nextBtn: Phaser.GameObjects.Rectangle | undefined;
      let nextTxt: Phaser.GameObjects.Text | undefined;
      let pageTxt: Phaser.GameObjects.Text | undefined;

      const cleanup = () => {
        bg.destroy();
        panel.destroy();
        title.destroy();
        listContainer.destroy();
        cancelBtn.destroy();
        cancelTxt.destroy();
        if (prevBtn) {
          prevBtn.destroy();
          prevTxt!.destroy();
          nextBtn!.destroy();
          nextTxt!.destroy();
          pageTxt!.destroy();
        }
      };

      const renderPage = () => {
        listContainer.removeAll(true);
        const startStr = currentPage * itemsPerPage;
        const pageItems = list.slice(startStr, startStr + itemsPerPage);

        pageItems.forEach((atk, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const btn = this.add
            .rectangle(col * 260 + 120, row * 45, 240, 35, 0x34495e)
            .setInteractive({ useHandCursor: true });
          const txt = this.add
            .text(col * 260 + 120, row * 45, atk.name, {
              fontSize: "14px",
              fontFamily: "system-ui",
            })
            .setOrigin(0.5);

          btn.on("pointerover", () => btn.setFillStyle(0x2980b9));
          btn.on("pointerout", () => btn.setFillStyle(0x34495e));
          btn.on("pointerdown", () => {
            onSelect(atk.id, atk.name);
            cleanup();
          });

          listContainer.add([btn, txt]);
        });
      };

      cancelBtn = this.add
        .rectangle(480, 490, 200, 30, 0xe74c3c)
        .setInteractive({ useHandCursor: true });
      cancelTxt = this.add
        .text(480, 490, "CANCELAR", {
          fontSize: "18px",
          fontStyle: "bold",
          fontFamily: "system-ui",
        })
        .setOrigin(0.5);
      cancelBtn.on("pointerdown", cleanup);

      prevBtn = this.add
        .rectangle(330, 440, 80, 30, 0x7f8c8d)
        .setInteractive({ useHandCursor: true });
      prevTxt = this.add
        .text(330, 440, "< ANT", { fontSize: "16px", fontFamily: "system-ui" })
        .setOrigin(0.5);
      nextBtn = this.add
        .rectangle(630, 440, 80, 30, 0x7f8c8d)
        .setInteractive({ useHandCursor: true });
      nextTxt = this.add
        .text(630, 440, "PROX >", { fontSize: "16px", fontFamily: "system-ui" })
        .setOrigin(0.5);
      pageTxt = this.add
        .text(480, 440, `Pág 1/${totalPages}`, {
          fontSize: "16px",
          fontFamily: "system-ui",
        })
        .setOrigin(0.5);

      prevBtn.on("pointerdown", () => {
        if (currentPage > 0) {
          currentPage--;
          renderPage();
          pageTxt!.setText(`Pág ${currentPage + 1}/${totalPages}`);
        }
      });
      nextBtn.on("pointerdown", () => {
        if (currentPage < totalPages - 1) {
          currentPage++;
          renderPage();
          pageTxt!.setText(`Pág ${currentPage + 1}/${totalPages}`);
        }
      });

      renderPage();
    };

    // Specials Edit
    const special1Txt = this.add
      .text(
        70,
        390,
        `Esp 1: ${this.customSp1Name || builderData.base.specialName}`,
        { fontSize: "16px", fontFamily: "system-ui", color: "#fff" },
      )
      .setOrigin(0, 0.5);
    const editSp1Btn = this.add
      .rectangle(460, 390, 100, 30, 0x34495e)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(460, 390, "SELECIONAR", {
        fontSize: "11px",
        fontStyle: "bold",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5);

    editSp1Btn.on("pointerover", () => editSp1Btn.setFillStyle(0x2980b9));
    editSp1Btn.on("pointerout", () => editSp1Btn.setFillStyle(0x34495e));

    editSp1Btn.on("pointerdown", () => {
      showAttackSelectModal(false, (id, name) => {
        this.customSp1Id = id;
        this.customSp1Name = name;
        special1Txt.setText(`Esp 1: ${name}`);
        updatePreview();
      });
    });

    const special2Txt = this.add
      .text(
        70,
        430,
        `Super: ${this.customSp2Name || builderData.base.superName}`,
        { fontSize: "16px", fontFamily: "system-ui", color: "#fff" },
      )
      .setOrigin(0, 0.5);
    const editSp2Btn = this.add
      .rectangle(460, 430, 100, 30, 0x34495e)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(460, 430, "SELECIONAR", {
        fontSize: "11px",
        fontStyle: "bold",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5);

    editSp2Btn.on("pointerover", () => editSp2Btn.setFillStyle(0x2980b9));
    editSp2Btn.on("pointerout", () => editSp2Btn.setFillStyle(0x34495e));

    editSp2Btn.on("pointerdown", () => {
      showAttackSelectModal(true, (id, name) => {
        this.customSp2Id = id;
        this.customSp2Name = name;
        special2Txt.setText(`Super: ${name}`);
        updatePreview();
      });
    });

    // Save Button
    const saveBtn = this.add
      .rectangle(300, 490, 350, 50, 0x27ae60)
      .setStrokeStyle(2, 0xffffff);
    const saveTxt = this.add
      .text(300, 490, "SALVAR & EQUIPAR PERSONALIZADO", {
        fontSize: "16px",
        fontStyle: "bold",
        color: "#000",
        fontFamily: "system-ui, sans-serif",
      })
      .setOrigin(0.5);

    saveBtn
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => saveBtn.setFillStyle(0x2ecc71))
      .on("pointerout", () => saveBtn.setFillStyle(0x27ae60))
      .on("pointerdown", () => {
        const customChar: CharacterData = {
          ...builderData.base,
          id: 999,
          key: "custom_999",
          baseKey: builderData.base.key,
          name: builderData.name,
          specialColor: builderData.auraColor,
          specialName: this.customSp1Name || builderData.base.specialName,
          superName: this.customSp2Name || builderData.base.superName,
          price: 0,
          unlocked: true,
          customData: {
            gi1: 0,
            gi2: 0,
            skin: this.skinColors[this.p_idx.skin],
            hair: this.hairColors[this.p_idx.hair],
            color_torso_1: this.giColors[this.p_idx.torso_1],
            color_torso_2: this.giColors[this.p_idx.torso_2],
            color_legs_1: this.giColors[this.p_idx.legs_1],
            color_legs_2: this.giColors[this.p_idx.legs_2],
            color_feet_1: this.giColors[this.p_idx.feet_1],
            color_feet_2: this.giColors[this.p_idx.feet_2],
            color_head_1: this.giColors[this.p_idx.head_1],
            color_head_2: this.giColors[this.p_idx.head_2],
            color_acc_1: this.giColors[this.p_idx.acc_1],
            sp1_id: this.customSp1Id || builderData.base.key,
            sp2_id: this.customSp2Id || builderData.base.key,
            part_head: this.partOptions.head[this.style_idx.head],
            part_torso: this.partOptions.torso[this.style_idx.torso],
            part_legs: this.partOptions.legs[this.style_idx.legs],
            part_feet: this.partOptions.feet[this.style_idx.feet],
            part_accessory:
              this.partOptions.accessory[this.style_idx.accessory],
          },
        };

        generateCustomSprite(this, customChar);

        const createAllForTex = (baseKey: string, texKey: string) => {
          this.createAnim(`${baseKey}_idle`, texKey, 0, 3, 10);
          this.createAnim(`${baseKey}_walk`, texKey, 4, 7, 12);
          this.createAnim(`${baseKey}_attack`, texKey, 8, 9, 16, 0);
          this.createAnim(`${baseKey}_special`, texKey, 8, 9, 12, -1);
          this.createAnim(`${baseKey}_defend`, texKey, 10, 10, 10, -1);
          this.createAnim(`${baseKey}_transform`, texKey, 0, 3, 24, -1);
          this.createAnim(`${baseKey}_charge`, texKey, 11, 11, 10, -1);
        };
        createAllForTex("custom_999", "custom_999");
        createAllForTex("custom_999_ssj", "custom_999_ssj");
        createAllForTex("custom_999_ui", "custom_999_ui");

        const gameState = this.registry.get("gameState");
        if (gameState) {
          // Remove existing custom character if any
          gameState.characters = gameState.characters.filter(
            (c: CharacterData) => c.id !== 999,
          );
          gameState.characters.push(customChar);
          gameState.p1CharacterId = 999;
          this.registry.set("gameState", gameState);

          if (window.UTLW) window.UTLW.save(); // trigger save
        }

        const confirmTxt = this.add
          .text(250, 350, "Equipado como Player 1!", {
            color: "#00ff00",
            fontSize: "18px",
            fontStyle: "bold",
            fontFamily: "system-ui",
          })
          .setOrigin(0.5);
        this.tweens.add({
          targets: confirmTxt,
          alpha: 0,
          y: 320,
          duration: 2000,
          onComplete: () => confirmTxt.destroy(),
        });
      });

    // Character Preview Box
    this.add
      .rectangle(700, 280, 300, 360, 0x1a1a24)
      .setStrokeStyle(2, 0x34495e);
    this.add
      .text(700, 130, "PREVIEW", {
        fontSize: "24px",
        fontStyle: "bold",
        color: "#3498db",
      })
      .setOrigin(0.5);

    updatePreview();
  }
}
