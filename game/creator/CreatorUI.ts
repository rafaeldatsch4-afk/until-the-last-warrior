import Phaser from "phaser";
import { CreatorState } from "./CreatorState";
import {
  partOptions,
  getAvailableHeadOptions,
  auraColors,
  skinColors,
  hairColors,
  giColors,
} from "./CreatorPartOptions";
import { AURA_PRESETS, AuraManager, AuraPreset } from "../systems/AuraManager";

export type CreatorTab = "style" | "colors" | "aura" | "skills";

export class CreatorUI {
  private scene: Phaser.Scene;
  private onUpdate: () => void;
  public onTestCharge?: () => void;
  private currentTab: CreatorTab = "style";
  private panelContainer?: Phaser.GameObjects.Container;
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private activeModalContainer?: Phaser.GameObjects.Container;
  private stateRef?: CreatorState;
  private isDestroyed: boolean = false;

  // Attack selection state
  public customSp1Id: string = "";
  public customSp1Name: string = "";
  public customSp2Id: string = "";
  public customSp2Name: string = "";
  public availableSpecials: { id: string; name: string }[] = [];
  public availableSupers: { id: string; name: string }[] = [];

  constructor(scene: Phaser.Scene, onUpdate: () => void) {
    this.scene = scene;
    this.onUpdate = onUpdate;
  }

  public getColorName(hex: number): string {
    const map: { [key: number]: string } = {
      0xffffff: "Branco",
      0xff0000: "Vermelho",
      0x00ff00: "Verde",
      0x0000ff: "Azul",
      0xffff00: "Amarelo",
      0xff00ff: "Magenta",
      0x00ffff: "Ciano",
      0x000000: "Preto",
      0xff8800: "Laranja",
      0xffcfb0: "Clara 1",
      0xffe0c0: "Clara 2",
      0xe0ac88: "Média 1",
      0xd09a7a: "Média 2",
      0x8d5524: "Escura 1",
      0xc68642: "Escura 2",
      0xffce9e: "Claro",
      0xe0ac69: "Médio",
      0xf1c27d: "Bronze",
      0x5c3a21: "Mto Escuro",
      0x4aa37a: "Alien",
      0x1a1a1a: "Preto",
      0xe0e0e0: "Platina",
      0xffea00: "Loiro",
      0xd92525: "Rubi",
      0x003399: "Azul Escuro",
      0x2ecc71: "Verde Esmeralda",
      0x9b59b6: "Púrpura",
      0xff5a00: "Laranja",
      0x111111: "Ônix",
      0xf1c40f: "Dourado",
      0x8e44ad: "Roxo Escuro",
    };
    return map[hex] || `#${hex.toString(16).toUpperCase()}`;
  }

  public initStudioPanel(
    panelX: number,
    panelY: number,
    panelW: number,
    panelH: number,
    state: CreatorState,
    specials: { id: string; name: string }[],
    supers: { id: string; name: string }[]
  ) {
    if (this.isDestroyed || !this.scene || !this.scene.sys) return;

    this.stateRef = state;
    this.availableSpecials = specials;
    this.availableSupers = supers;

    if (this.panelContainer) {
      this.panelContainer.destroy(true);
      this.panelContainer = undefined;
    }

    this.panelContainer = this.scene.add.container(panelX, panelY);

    // 1. Studio Card Glass Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0f1d, 0.88);
    bg.fillRoundedRect(0, 0, panelW, panelH, 12);
    bg.lineStyle(1.5, 0x1e293b, 0.9);
    bg.strokeRoundedRect(0, 0, panelW, panelH, 12);

    // Corner accents
    bg.lineStyle(2, 0x38bdf8, 0.7);
    const bLen = 14;
    // Top-Left
    bg.moveTo(0, bLen).lineTo(0, 0).lineTo(bLen, 0);
    // Top-Right
    bg.moveTo(panelW - bLen, 0).lineTo(panelW, 0).lineTo(panelW, bLen);
    // Bottom-Left
    bg.moveTo(0, panelH - bLen).lineTo(0, panelH).lineTo(bLen, panelH);
    // Bottom-Right
    bg.moveTo(panelW - bLen, panelH).lineTo(panelW, panelH).lineTo(panelW, panelH - bLen);
    bg.strokePath();

    this.panelContainer.add(bg);

    // 2. Tab Switcher Header
    const tabH = 34;
    const tabY = 7;
    const tabs: { key: CreatorTab; label: string; icon: string }[] = [
      { key: "style", label: "ESTILO", icon: "👕" },
      { key: "colors", label: "CORES", icon: "🎨" },
      { key: "aura", label: "AURA", icon: "⚡" },
      { key: "skills", label: "GOLPES", icon: "🔥" },
    ];
    const tabWidth = (panelW - 28) / tabs.length;

    this.tabButtons = [];

    tabs.forEach((tab, index) => {
      const tabX = 14 + index * tabWidth + tabWidth / 2;
      const tabBtn = this.createTabButton(
        tabX,
        tabY + tabH / 2,
        tabWidth - 4,
        tabH,
        `${tab.icon} ${tab.label}`,
        tab.key === this.currentTab,
        () => {
          if (this.currentTab === tab.key) return;
          this.currentTab = tab.key;
          this.refreshTabs(panelW, panelH);
        }
      );
      this.tabButtons.push(tabBtn);
      this.panelContainer!.add(tabBtn);
    });

    // Content container
    this.renderCurrentTabContent(panelW, panelH);
  }

  private createTabButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    isActive: boolean,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    this.drawTabBg(bg, w, h, isActive, false);

    const txt = this.scene.add
      .text(0, 0, label, {
        fontSize: "12px",
        fontStyle: "bold",
        color: isActive ? "#38bdf8" : "#94a3b8",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        letterSpacing: 0.5,
        resolution: 2,
      })
      .setOrigin(0.5);

    const hit = this.scene.add
      .rectangle(0, 0, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hit.on("pointerover", () => {
      if (this.isDestroyed) return;
      if (!isActive) {
        this.drawTabBg(bg, w, h, isActive, true);
        txt.setColor("#ffffff");
      }
    });

    hit.on("pointerout", () => {
      if (this.isDestroyed) return;
      this.drawTabBg(bg, w, h, isActive, false);
      txt.setColor(isActive ? "#38bdf8" : "#94a3b8");
    });

    hit.on("pointerdown", () => {
      if (this.isDestroyed) return;
      onClick();
    });

    container.add([bg, txt, hit]);
    return container;
  }

  private drawTabBg(
    graphics: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
    isActive: boolean,
    isHover: boolean
  ) {
    graphics.clear();
    if (isActive) {
      graphics.fillStyle(0x0f2942, 0.95);
      graphics.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      graphics.lineStyle(1.5, 0x38bdf8, 1);
      graphics.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    } else {
      graphics.fillStyle(isHover ? 0x1e293b : 0x0f172a, 0.8);
      graphics.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      graphics.lineStyle(1, isHover ? 0x475569 : 0x1e293b, 0.8);
      graphics.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    }
  }

  private refreshTabs(panelW: number, panelH: number) {
    if (!this.stateRef || !this.panelContainer) return;
    this.initStudioPanel(
      this.panelContainer.x,
      this.panelContainer.y,
      panelW,
      panelH,
      this.stateRef,
      this.availableSpecials,
      this.availableSupers
    );
  }

  private renderCurrentTabContent(panelW: number, panelH: number) {
    if (!this.stateRef || !this.panelContainer) return;
    const contentContainer = this.scene.add.container(0, 46);
    this.panelContainer.add(contentContainer);

    if (this.currentTab === "style") {
      this.renderStyleTab(contentContainer, panelW, panelH);
    } else if (this.currentTab === "colors") {
      this.renderColorsTab(contentContainer, panelW, panelH);
    } else if (this.currentTab === "aura") {
      this.renderAuraTab(contentContainer, panelW, panelH);
    } else if (this.currentTab === "skills") {
      this.renderSkillsTab(contentContainer, panelW, panelH);
    }
  }

  // --- TAB 1: ESTILO & PEÇAS ---
  private renderStyleTab(
    container: Phaser.GameObjects.Container,
    panelW: number,
    panelH: number
  ) {
    const state = this.stateRef!;

    const getHeadName = (id: string) => {
      const map: { [key: string]: string } = {
        goku: "Goku (Saiyajin)",
        vegeta: "Vegeta (Príncipe)",
        naruto: "Naruto (Shinobi)",
        sasuke: "Sasuke (Uchiha)",
        jotaro: "Jotaro (Gakuran)",
        spiderman: "Spiderman (Aranha)",
        saitama: "Saitama (Careca)",
        chapolim: "Chapolim (Capuz)",
        luffy: "Luffy (Pirata)",
      };
      return map[id] || id;
    };

    const getTorsoName = (id: string) => {
      const map: { [key: string]: string } = {
        goku: "Kimono Z",
        spiderman: "Traje Aranha",
        jotaro: "Sobretudo JoJo",
        vegeta: "Armadura Saiyajin",
        saitama: "Uniforme Herói",
        chapolim: "Uniforme CH",
        muscle: "Sem Camisa (Músculos)",
        naruto: "Jaqueta Shinobi",
        sasuke: "Gola Alta Uchiha",
        luffy: "Colete Pirata",
      };
      return map[id] || id;
    };

    const getLegsName = (id: string) => {
      const map: { [key: string]: string } = {
        goku: "Calça Dogi",
        spiderman: "Lycra Aranha",
        jotaro: "Calça Gakuran",
        saitama: "Calça Herói",
        vegeta: "Spandex Saiyajin",
        chapolim: "Bermuda CH",
        naruto: "Calça Shinobi",
        sasuke: "Hakama Uchiha",
        luffy: "Shorts Jeans Pirata",
      };
      return map[id] || id;
    };

    const getFeetName = (id: string) => {
      const map: { [key: string]: string } = {
        goku: "Botas Z",
        spiderman: "Botas Aranha",
        chapolim: "Tênis Retrô",
        saitama: "Botas Herói",
        vegeta: "Botas Saiyajin",
        jotaro: "Sapatos de Couro",
        naruto: "Sandálias Ninja",
        sasuke: "Sandálias Ninja",
        luffy: "Sandálias de Palha",
      };
      return map[id] || id;
    };

    const getAccName = (id: string) => {
      const map: { [key: string]: string } = {
        none: "Nenhum Acessório",
        straw_hat: "Chapéu de Palha",
        sword: "Katana Suprema",
        headband: "Bandana Ninja",
        cape: "Capa Heroica",
        scouter: "Scouter Saiyajin",
        scarf: "Cachecol Shinobi",
      };
      return map[id] || id;
    };

    const getAvailableHeads = () => {
      const acc = partOptions.accessory[state.style_idx.accessory] || "none";
      return getAvailableHeadOptions(acc);
    };

    let headValTxtRef: Phaser.GameObjects.Text | null = null;

    const rows = [
      {
        id: "head",
        label: "CABEÇA / ROSTO",
        icon: "👤",
        getVal: () => {
          const heads = getAvailableHeads();
          const headId = heads[state.style_idx.head] || "goku";
          return getHeadName(headId);
        },
        onPrev: () => {
          const heads = getAvailableHeads();
          state.prevPart("head", heads);
        },
        onNext: () => {
          const heads = getAvailableHeads();
          state.nextPart("head", heads);
        },
      },
      {
        id: "torso",
        label: "TRONCO / TRAJE",
        icon: "🥋",
        getVal: () => getTorsoName(partOptions.torso[state.style_idx.torso]),
        onPrev: () => state.prevPart("torso", partOptions.torso),
        onNext: () => state.nextPart("torso", partOptions.torso),
      },
      {
        id: "legs",
        label: "PERNAS / CALÇA",
        icon: "👖",
        getVal: () => getLegsName(partOptions.legs[state.style_idx.legs]),
        onPrev: () => state.prevPart("legs", partOptions.legs),
        onNext: () => state.nextPart("legs", partOptions.legs),
      },
      {
        id: "feet",
        label: "PÉS / CALÇADO",
        icon: "🥾",
        getVal: () => getFeetName(partOptions.feet[state.style_idx.feet]),
        onPrev: () => state.prevPart("feet", partOptions.feet),
        onNext: () => state.nextPart("feet", partOptions.feet),
      },
      {
        id: "accessory",
        label: "ACESSÓRIO EXTRA",
        icon: "⚔️",
        getVal: () => getAccName(partOptions.accessory[state.style_idx.accessory]),
        onPrev: () => {
          state.prevPart("accessory", partOptions.accessory);
          state.validateConstraints();
          if (headValTxtRef) {
            const heads = getAvailableHeads();
            const headId = heads[state.style_idx.head] || "goku";
            headValTxtRef.setText(getHeadName(headId));
          }
        },
        onNext: () => {
          state.nextPart("accessory", partOptions.accessory);
          state.validateConstraints();
          if (headValTxtRef) {
            const heads = getAvailableHeads();
            const headId = heads[state.style_idx.head] || "goku";
            headValTxtRef.setText(getHeadName(headId));
          }
        },
      },
    ];

    const availH = panelH - 58;
    const gapY = 8;
    const cardH = Math.min(68, Math.max(54, Math.floor((availH - 4 * gapY - 6) / 5)));
    const startY = 4;

    rows.forEach((row, idx) => {
      const rowY = startY + idx * (cardH + gapY);

      // Row Container
      const rowBox = this.scene.add.graphics();
      rowBox.fillStyle(0x0f172a, 0.7);
      rowBox.fillRoundedRect(14, rowY, panelW - 28, cardH, 6);
      rowBox.lineStyle(1, 0x1e293b, 0.8);
      rowBox.strokeRoundedRect(14, rowY, panelW - 28, cardH, 6);

      // Label
      const txtLabel = this.scene.add
        .text(26, rowY + cardH / 2, `${row.icon} ${row.label}`, {
          fontSize: "12.5px",
          fontStyle: "bold",
          color: "#cbd5e1",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0, 0.5);

      // Selector Pill on the right
      const pillW = Math.min(270, panelW - 180);
      const pillX = panelW - 20 - pillW / 2;
      const pillY = rowY + cardH / 2;
      const pillH = Math.max(38, cardH - 18);

      const pillBg = this.scene.add.graphics();
      pillBg.fillStyle(0x1e293b, 0.95);
      pillBg.fillRoundedRect(pillX - pillW / 2, pillY - pillH / 2, pillW, pillH, 5);
      pillBg.lineStyle(1.5, 0x334155, 0.9);
      pillBg.strokeRoundedRect(pillX - pillW / 2, pillY - pillH / 2, pillW, pillH, 5);

      const valTxt = this.scene.add
        .text(pillX, pillY, row.getVal(), {
          fontSize: "12px",
          fontStyle: "bold",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      if (row.id === "head") {
        headValTxtRef = valTxt;
      }

      // Left Arrow with larger hit area
      const arrowL = this.scene.add
        .text(pillX - pillW / 2 + 16, pillY, "◀", {
          fontSize: "13px",
          color: "#38bdf8",
        })
        .setOrigin(0.5)
        .setPadding(10, 8)
        .setInteractive({ useHandCursor: true });

      arrowL.on("pointerdown", () => {
        if (this.isDestroyed) return;
        row.onPrev();
        valTxt.setText(row.getVal());
        this.onUpdate();
      });
      arrowL.on("pointerover", () => arrowL.setColor("#facc15").setScale(1.2));
      arrowL.on("pointerout", () => arrowL.setColor("#38bdf8").setScale(1));

      // Right Arrow with larger hit area
      const arrowR = this.scene.add
        .text(pillX + pillW / 2 - 16, pillY, "▶", {
          fontSize: "13px",
          color: "#38bdf8",
        })
        .setOrigin(0.5)
        .setPadding(10, 8)
        .setInteractive({ useHandCursor: true });

      arrowR.on("pointerdown", () => {
        if (this.isDestroyed) return;
        row.onNext();
        valTxt.setText(row.getVal());
        this.onUpdate();
      });
      arrowR.on("pointerover", () => arrowR.setColor("#facc15").setScale(1.2));
      arrowR.on("pointerout", () => arrowR.setColor("#38bdf8").setScale(1));

      container.add([rowBox, txtLabel, pillBg, valTxt, arrowL, arrowR]);
    });
  }

  // --- TAB 2: PALETA & CORES ---
  private renderColorsTab(
    container: Phaser.GameObjects.Container,
    panelW: number,
    panelH: number
  ) {
    const state = this.stateRef!;

    const colorItems = [
      {
        label: "Tom de Pele",
        getHex: () => skinColors[state.p_idx.skin],
        onPrev: () => state.prevColor("skin", skinColors),
        onNext: () => state.nextColor("skin", skinColors),
      },
      {
        label: "Cabelo",
        getHex: () => hairColors[state.p_idx.hair],
        onPrev: () => state.prevColor("hair", hairColors),
        onNext: () => state.nextColor("hair", hairColors),
      },
      {
        label: "Tronco - Primária",
        getHex: () => giColors[state.p_idx.torso_1],
        onPrev: () => state.prevColor("torso_1", giColors),
        onNext: () => state.nextColor("torso_1", giColors),
      },
      {
        label: "Tronco - Secundária",
        getHex: () => giColors[state.p_idx.torso_2],
        onPrev: () => state.prevColor("torso_2", giColors),
        onNext: () => state.nextColor("torso_2", giColors),
      },
      {
        label: "Pernas - Primária",
        getHex: () => giColors[state.p_idx.legs_1],
        onPrev: () => state.prevColor("legs_1", giColors),
        onNext: () => state.nextColor("legs_1", giColors),
      },
      {
        label: "Pernas - Secundária",
        getHex: () => giColors[state.p_idx.legs_2],
        onPrev: () => state.prevColor("legs_2", giColors),
        onNext: () => state.nextColor("legs_2", giColors),
      },
      {
        label: "Pés / Botas",
        getHex: () => giColors[state.p_idx.feet_1],
        onPrev: () => state.prevColor("feet_1", giColors),
        onNext: () => state.nextColor("feet_1", giColors),
      },
      {
        label: "Acessório Extra",
        getHex: () => giColors[state.p_idx.acc_1],
        onPrev: () => state.prevColor("acc_1", giColors),
        onNext: () => state.nextColor("acc_1", giColors),
      },
    ];

    const availH = panelH - 58;
    const colGap = 10;
    const gapY = 8;
    const cardH = Math.min(88, Math.max(72, Math.floor((availH - 6 - 3 * gapY) / 4)));
    const startY = 4;
    const colW = Math.floor((panelW - 28 - colGap) / 2);

    colorItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cardX = 14 + col * (colW + colGap);
      const cardY = startY + row * (cardH + gapY);

      const card = this.scene.add.graphics();
      card.fillStyle(0x0f172a, 0.8);
      card.fillRoundedRect(cardX, cardY, colW, cardH, 6);
      card.lineStyle(1, 0x1e293b, 0.8);
      card.strokeRoundedRect(cardX, cardY, colW, cardH, 6);

      // Title
      const titleTxt = this.scene.add
        .text(cardX + 10, cardY + 12, item.label, {
          fontSize: "11px",
          fontStyle: "bold",
          color: "#94a3b8",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0, 0.5);

      const swatchSize = Math.max(24, Math.min(30, cardH - 34));
      const swatchY = cardY + cardH - swatchSize - 10;

      // Color Swatch Box
      const swatch = this.scene.add.graphics();
      const drawSwatch = () => {
        swatch.clear();
        swatch.fillStyle(item.getHex(), 1);
        swatch.fillRoundedRect(cardX + 10, swatchY, swatchSize, swatchSize, 5);
        swatch.lineStyle(1.5, 0xffffff, 0.7);
        swatch.strokeRoundedRect(cardX + 10, swatchY, swatchSize, swatchSize, 5);
      };
      drawSwatch();

      // Color Name & Selector Pill
      const pillW = colW - swatchSize - 26;
      const pillH = Math.max(28, swatchSize);
      const pillCenterX = cardX + swatchSize + 16 + pillW / 2;
      const pillCenterY = swatchY + swatchSize / 2;

      const pillBg = this.scene.add.graphics();
      pillBg.fillStyle(0x1e293b, 0.95);
      pillBg.fillRoundedRect(pillCenterX - pillW / 2, pillCenterY - pillH / 2, pillW, pillH, 5);
      pillBg.lineStyle(1, 0x334155, 0.8);
      pillBg.strokeRoundedRect(pillCenterX - pillW / 2, pillCenterY - pillH / 2, pillW, pillH, 5);

      const colorTxt = this.scene.add
        .text(pillCenterX, pillCenterY, this.getColorName(item.getHex()), {
          fontSize: "11px",
          fontStyle: "bold",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      // Left Arrow
      const arrowL = this.scene.add
        .text(pillCenterX - pillW / 2 + 10, pillCenterY, "◀", {
          fontSize: "11px",
          color: "#38bdf8",
        })
        .setOrigin(0.5)
        .setPadding(8, 6)
        .setInteractive({ useHandCursor: true });

      arrowL.on("pointerdown", () => {
        if (this.isDestroyed) return;
        item.onPrev();
        drawSwatch();
        colorTxt.setText(this.getColorName(item.getHex()));
        this.onUpdate();
      });

      // Right Arrow
      const arrowR = this.scene.add
        .text(pillCenterX + pillW / 2 - 10, pillCenterY, "▶", {
          fontSize: "11px",
          color: "#38bdf8",
        })
        .setOrigin(0.5)
        .setPadding(8, 6)
        .setInteractive({ useHandCursor: true });

      arrowR.on("pointerdown", () => {
        if (this.isDestroyed) return;
        item.onNext();
        drawSwatch();
        colorTxt.setText(this.getColorName(item.getHex()));
        this.onUpdate();
      });

      container.add([card, titleTxt, swatch, pillBg, colorTxt, arrowL, arrowR]);
    });
  }

  // --- TAB 3: COR DA AURA ---
  private renderAuraTab(
    container: Phaser.GameObjects.Container,
    panelW: number,
    panelH: number
  ) {
    const state = this.stateRef!;
    const cardW = panelW - 28;

    const currentPreset =
      AURA_PRESETS.find((p) => p.id === state.aura_preset_id) || AURA_PRESETS[1];
    const auraHex = currentPreset.color !== -1 ? currentPreset.color : 0xffd700;
    const ringHex = currentPreset.ringColor !== -1 ? currentPreset.ringColor : auraHex;

    // 1. Active Aura Showcase Banner Card
    const bannerY = 4;
    const bannerH = 46;
    const bannerCard = this.scene.add.graphics();
    bannerCard.fillStyle(0x0f172a, 0.92);
    bannerCard.fillRoundedRect(14, bannerY, cardW, bannerH, 6);
    bannerCard.lineStyle(1.5, auraHex, 0.9);
    bannerCard.strokeRoundedRect(14, bannerY, cardW, bannerH, 6);

    // Swatch Circle on left of banner
    const bannerSwatch = this.scene.add.graphics();
    bannerSwatch.fillStyle(auraHex, 1);
    bannerSwatch.fillCircle(36, bannerY + bannerH / 2, 13);
    bannerSwatch.lineStyle(2, ringHex, 1);
    bannerSwatch.strokeCircle(36, bannerY + bannerH / 2, 13);

    const bannerTitle = this.scene.add
      .text(56, bannerY + 14, `⚡ AURA: ${currentPreset.name.toUpperCase()}`, {
        fontSize: "13px",
        fontStyle: "900",
        color: `#${auraHex.toString(16).padStart(6, "0")}`,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        letterSpacing: 0.5,
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    const bannerDesc = this.scene.add
      .text(56, bannerY + 31, currentPreset.description || "Aura de energia lendária.", {
        fontSize: "10.5px",
        color: "#94a3b8",
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    // 2. Presets Grid Header
    const gridTitleY = bannerY + bannerH + 8;
    const gridTitle = this.scene.add
      .text(16, gridTitleY, "ESCOLHA UMA AURA LENDÁRIA", {
        fontSize: "10px",
        fontStyle: "bold",
        color: "#94a3b8",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        letterSpacing: 1,
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    // 3. Grid of Aura Presets (3 columns x 4 rows)
    const cols = 3;
    const gridGapX = 8;
    const gridGapY = 5;
    const btnW = Math.floor((cardW - (cols - 1) * gridGapX) / cols);
    const gridStartY = gridTitleY + 14;

    const availH = panelH - 58;
    const testBtnH = 38;
    const remainingH = availH - (gridStartY + testBtnH + 12);
    const btnH = Math.min(42, Math.max(32, Math.floor((remainingH - 3 * gridGapY) / 4)));

    const presetCards: Phaser.GameObjects.Container[] = [];

    AURA_PRESETS.forEach((preset, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const bx = 14 + col * (btnW + gridGapX) + btnW / 2;
      const by = gridStartY + row * (btnH + gridGapY) + btnH / 2;

      const pCont = this.scene.add.container(bx, by);
      const isSelected = preset.id === state.aura_preset_id;
      const pColor = preset.color !== -1 ? preset.color : 0xffffff;
      const pRing = preset.ringColor !== -1 ? preset.ringColor : pColor;

      const pBg = this.scene.add.graphics();
      const drawCard = (hover: boolean) => {
        pBg.clear();
        pBg.fillStyle(isSelected ? 0x1e293b : 0x0f172a, 0.95);
        pBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
        pBg.lineStyle(
          isSelected ? 1.5 : 1,
          isSelected ? 0x38bdf8 : hover ? 0x475569 : 0x1e293b,
          1
        );
        pBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
      };
      drawCard(false);

      const dot = this.scene.add.graphics();
      dot.fillStyle(pColor, 1);
      dot.fillCircle(-btnW / 2 + 12, 0, 5);
      dot.lineStyle(1.5, pRing, 0.9);
      dot.strokeCircle(-btnW / 2 + 12, 0, 5);

      const nameTxt = this.scene.add
        .text(-btnW / 2 + 24, 0, preset.name, {
          fontSize: "11px",
          fontStyle: isSelected ? "bold" : "normal",
          color: isSelected ? "#38bdf8" : "#cbd5e1",
          fontFamily: "system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0, 0.5);

      let checkTxt: Phaser.GameObjects.Text | null = null;
      if (isSelected) {
        checkTxt = this.scene.add
          .text(btnW / 2 - 10, 0, "✓", {
            fontSize: "12px",
            fontStyle: "bold",
            color: "#38bdf8",
          })
          .setOrigin(0.5);
      }

      const hit = this.scene.add
        .rectangle(0, 0, btnW, btnH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on("pointerover", () => {
        if (this.isDestroyed) return;
        drawCard(true);
        this.scene.tweens.add({ targets: pCont, scale: 1.02, duration: 80 });
      });

      hit.on("pointerout", () => {
        if (this.isDestroyed) return;
        drawCard(false);
        this.scene.tweens.add({ targets: pCont, scale: 1, duration: 80 });
      });

      hit.on("pointerdown", () => {
        if (this.isDestroyed) return;
        state.aura_preset_id = preset.id;
        AuraManager.setPreference(preset.id, state.aura_mode);
        if (this.scene.cache.audio.exists("sfx_select")) {
          this.scene.sound.play("sfx_select", { volume: 0.5 });
        }
        this.refreshTabs(panelW, panelH);
        this.onUpdate();
      });

      const elements: Phaser.GameObjects.GameObject[] = [pBg, dot, nameTxt, hit];
      if (checkTxt) elements.push(checkTxt);
      pCont.add(elements);
      presetCards.push(pCont);
    });

    // 4. Bottom Controls: Centered Test Ki Action Button
    const bottomControlsY = gridStartY + 4 * (btnH + gridGapY) + 8;
    const testBtnW = cardW;
    const testBtnX = 14 + testBtnW / 2;
    const testBtnY = bottomControlsY + testBtnH / 2;

    const chargeBtnCont = this.scene.add.container(testBtnX, testBtnY);

    const chargeBtnBg = this.scene.add.graphics();
    const drawChargeBtn = (hover: boolean) => {
      chargeBtnBg.clear();
      chargeBtnBg.fillStyle(hover ? 0x92400e : 0x78350f, hover ? 0.95 : 0.85);
      chargeBtnBg.fillRoundedRect(-testBtnW / 2, -testBtnH / 2, testBtnW, testBtnH, 5);
      chargeBtnBg.lineStyle(
        hover ? 2 : 1.5,
        hover ? 0xfef08a : 0xf59e0b,
        hover ? 1 : 0.85
      );
      chargeBtnBg.strokeRoundedRect(-testBtnW / 2, -testBtnH / 2, testBtnW, testBtnH, 5);
    };
    drawChargeBtn(false);

    const chargeBtnTxt = this.scene.add
      .text(0, 0, "⚡ TESTAR EMANAÇÃO DO KI", {
        fontSize: "12.5px",
        fontStyle: "900",
        color: "#fef3c7",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        letterSpacing: 1,
        resolution: 2,
      })
      .setOrigin(0.5);

    const chargeHit = this.scene.add
      .rectangle(0, 0, testBtnW, testBtnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    chargeHit.on("pointerover", () => {
      if (this.isDestroyed) return;
      drawChargeBtn(true);
      this.scene.tweens.add({ targets: chargeBtnCont, scale: 1.02, duration: 80 });
    });

    chargeHit.on("pointerout", () => {
      if (this.isDestroyed) return;
      drawChargeBtn(false);
      this.scene.tweens.add({ targets: chargeBtnCont, scale: 1, duration: 80 });
    });

    chargeHit.on("pointerdown", () => {
      if (this.isDestroyed) return;
      this.scene.tweens.add({
        targets: chargeBtnCont,
        scale: 0.97,
        yoyo: true,
        duration: 70,
      });
      if (this.onTestCharge) {
        this.onTestCharge();
      }
    });

    chargeBtnCont.add([chargeBtnBg, chargeBtnTxt, chargeHit]);

    container.add([
      bannerCard,
      bannerSwatch,
      bannerTitle,
      bannerDesc,
      gridTitle,
      ...presetCards,
      chargeBtnCont,
    ]);
  }

  // --- TAB 4: GOLPES & MAGIAS ---
  private renderSkillsTab(
    container: Phaser.GameObjects.Container,
    panelW: number,
    panelH: number
  ) {
    const cardW = panelW - 28;
    const availH = panelH - 58;
    const gapY = 12;
    const cardH = Math.min(185, Math.floor((availH - 6 - gapY) / 2));

    // Card 1: Especial 1
    const sp1CardY = 4;
    const sp1Card = this.scene.add.graphics();
    sp1Card.fillStyle(0x0f172a, 0.85);
    sp1Card.fillRoundedRect(14, sp1CardY, cardW, cardH, 6);
    sp1Card.lineStyle(1.5, 0x0284c7, 0.9);
    sp1Card.strokeRoundedRect(14, sp1CardY, cardW, cardH, 6);

    const sp1Tag = this.scene.add
      .text(26, sp1CardY + 22, "⚡ GOLPE ESPECIAL 1", {
        fontSize: "12px",
        fontStyle: "900",
        color: "#38bdf8",
        letterSpacing: 1,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    const sp1NameTxt = this.scene.add
      .text(26, sp1CardY + 54, this.customSp1Name || "Kamehameha", {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    const sp1Desc = this.scene.add
      .text(26, sp1CardY + 84, "Ataque rápido de energia concentrada com dano moderado.", {
        fontSize: "12px",
        color: "#94a3b8",
        fontFamily: "system-ui, sans-serif",
        wordWrap: { width: cardW - 140 },
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    const sp1Btn = this.createCompactButton(
      panelW - 74,
      sp1CardY + cardH / 2,
      96,
      38,
      "ALTERAR",
      0x0284c7,
      () => {
        this.showAttackSelectModal(false, this.availableSpecials, this.availableSupers, (id, name) => {
          this.customSp1Id = id;
          this.customSp1Name = name;
          sp1NameTxt.setText(name);
          this.onUpdate();
        });
      }
    );

    // Card 2: Super Especial 2
    const sp2CardY = sp1CardY + cardH + gapY;
    const sp2Card = this.scene.add.graphics();
    sp2Card.fillStyle(0x0f172a, 0.85);
    sp2Card.fillRoundedRect(14, sp2CardY, cardW, cardH, 6);
    sp2Card.lineStyle(1.5, 0xeab308, 0.9);
    sp2Card.strokeRoundedRect(14, sp2CardY, cardW, cardH, 6);

    const sp2Tag = this.scene.add
      .text(26, sp2CardY + 22, "🔥 SUPER GOLPE SUPREMO (ULTIMATE)", {
        fontSize: "12px",
        fontStyle: "900",
        color: "#facc15",
        letterSpacing: 1,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    const sp2NameTxt = this.scene.add
      .text(26, sp2CardY + 54, this.customSp2Name || "Spirit Bomb", {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fef08a",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    const sp2Desc = this.scene.add
      .text(26, sp2CardY + 84, "Ataque devastador em área consumindo barra cheia de Ki.", {
        fontSize: "12px",
        color: "#94a3b8",
        fontFamily: "system-ui, sans-serif",
        wordWrap: { width: cardW - 140 },
        resolution: 2,
      })
      .setOrigin(0, 0.5);

    const sp2Btn = this.createCompactButton(
      panelW - 74,
      sp2CardY + cardH / 2,
      96,
      38,
      "ALTERAR",
      0xca8a04,
      () => {
        this.showAttackSelectModal(true, this.availableSpecials, this.availableSupers, (id, name) => {
          this.customSp2Id = id;
          this.customSp2Name = name;
          sp2NameTxt.setText(name);
          this.onUpdate();
        });
      }
    );

    container.add([
      sp1Card,
      sp1Tag,
      sp1NameTxt,
      sp1Desc,
      sp1Btn,
      sp2Card,
      sp2Tag,
      sp2NameTxt,
      sp2Desc,
      sp2Btn,
    ]);
  }

  private createCompactButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    colorHex: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    const drawBtn = (isHover: boolean) => {
      bg.clear();
      bg.fillStyle(isHover ? colorHex : 0x1e293b, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      bg.lineStyle(1.5, isHover ? 0xffffff : colorHex, 0.9);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    };
    drawBtn(false);

    const txt = this.scene.add
      .text(0, 0, label, {
        fontSize: "12px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    const hit = this.scene.add
      .rectangle(0, 0, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hit.on("pointerover", () => {
      if (this.isDestroyed) return;
      drawBtn(true);
      this.scene.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });
    hit.on("pointerout", () => {
      if (this.isDestroyed) return;
      drawBtn(false);
      this.scene.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    hit.on("pointerdown", () => {
      if (this.isDestroyed) return;
      onClick();
    });

    container.add([bg, txt, hit]);
    return container;
  }

  public showAttackSelectModal(
    isSuper: boolean,
    specials: { id: string; name: string }[],
    supers: { id: string; name: string }[],
    onSelect: (id: string, name: string) => void
  ) {
    if (this.isDestroyed || !this.scene || !this.scene.sys) return;

    if (this.activeModalContainer) {
      this.activeModalContainer.destroy(true);
      this.activeModalContainer = undefined;
    }

    const { width, height } = this.scene.cameras.main;
    const modalContainer = this.scene.add.container(0, 0).setDepth(1000);
    this.activeModalContainer = modalContainer;

    const backdrop = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setInteractive();

    const panelW = 520;
    const panelH = 370;
    const panelX = width / 2;
    const panelY = height / 2;

    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x0a0f1d, 0.98);
    panelBg.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 10);
    panelBg.lineStyle(2, isSuper ? 0xeab308 : 0x0284c7, 1);
    panelBg.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 10);

    const title = this.scene.add
      .text(
        panelX,
        panelY - panelH / 2 + 22,
        isSuper ? "🔥 SELECIONAR SUPER GOLPE" : "⚡ SELECIONAR GOLPE ESPECIAL",
        {
          fontSize: "15px",
          fontStyle: "900",
          color: isSuper ? "#facc15" : "#38bdf8",
          fontFamily: "system-ui, sans-serif",
          letterSpacing: 1,
          resolution: 2,
        }
      )
      .setOrigin(0.5);

    // Close Button
    const closeBtn = this.scene.add
      .text(panelX + panelW / 2 - 20, panelY - panelH / 2 + 20, "✕", {
        fontSize: "16px",
        fontStyle: "bold",
        color: "#94a3b8",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeBtn.on("pointerover", () => closeBtn.setColor("#ef4444"));
    closeBtn.on("pointerout", () => closeBtn.setColor("#94a3b8"));
    closeBtn.on("pointerdown", () => {
      if (this.activeModalContainer === modalContainer) {
        this.activeModalContainer = undefined;
      }
      modalContainer.destroy(true);
    });

    const list = isSuper ? supers : specials;
    const itemsPerPage = 8;
    let currentPage = 0;
    const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));

    const gridContainer = this.scene.add.container(0, 0);

    const renderGrid = () => {
      gridContainer.removeAll(true);
      const startIdx = currentPage * itemsPerPage;
      const pageItems = list.slice(startIdx, startIdx + itemsPerPage);

      const cols = 2;
      const btnW = 230;
      const btnH = 40;
      const gapX = 14;
      const gapY = 8;
      const gridStartX = panelX - (cols * btnW + (cols - 1) * gapX) / 2 + btnW / 2;
      const gridStartY = panelY - 95;

      pageItems.forEach((item, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        const bx = gridStartX + c * (btnW + gapX);
        const by = gridStartY + r * (btnH + gapY);

        const card = this.scene.add.container(bx, by);

        const bBg = this.scene.add.graphics();
        bBg.fillStyle(0x0f172a, 0.9);
        bBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        bBg.lineStyle(1, 0x1e293b, 0.9);
        bBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);

        const bTxt = this.scene.add
          .text(0, 0, item.name, {
            fontSize: "12px",
            fontStyle: "bold",
            color: "#f8fafc",
            fontFamily: "system-ui, sans-serif",
            resolution: 2,
          })
          .setOrigin(0.5);

        const hit = this.scene.add
          .rectangle(0, 0, btnW, btnH, 0x000000, 0)
          .setInteractive({ useHandCursor: true });

        hit.on("pointerover", () => {
          bBg.clear();
          bBg.fillStyle(isSuper ? 0x2e2008 : 0x0c2742, 1);
          bBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
          bBg.lineStyle(1.5, isSuper ? 0xfacc15 : 0x38bdf8, 1);
          bBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
          bTxt.setColor(isSuper ? "#fef08a" : "#7dd3fc");
        });

        hit.on("pointerout", () => {
          bBg.clear();
          bBg.fillStyle(0x0f172a, 0.9);
          bBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
          bBg.lineStyle(1, 0x1e293b, 0.9);
          bBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
          bTxt.setColor("#f8fafc");
        });

        hit.on("pointerdown", () => {
          onSelect(item.id, item.name);
          if (this.activeModalContainer === modalContainer) {
            this.activeModalContainer = undefined;
          }
          modalContainer.destroy(true);
        });

        card.add([bBg, bTxt, hit]);
        gridContainer.add(card);
      });
    };

    renderGrid();

    // Pagination
    const pageTxt = this.scene.add
      .text(panelX, panelY + panelH / 2 - 24, `Página ${currentPage + 1} de ${totalPages}`, {
        fontSize: "11px",
        color: "#94a3b8",
        fontStyle: "bold",
        fontFamily: "system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5);

    const prevBtn = this.createCompactButton(
      panelX - 110,
      panelY + panelH / 2 - 24,
      76,
      24,
      "◀ ANTERIOR",
      0x334155,
      () => {
        if (currentPage > 0) {
          currentPage--;
          renderGrid();
          pageTxt.setText(`Página ${currentPage + 1} de ${totalPages}`);
        }
      }
    );

    const nextBtn = this.createCompactButton(
      panelX + 110,
      panelY + panelH / 2 - 24,
      76,
      24,
      "PRÓXIMO ▶",
      0x334155,
      () => {
        if (currentPage < totalPages - 1) {
          currentPage++;
          renderGrid();
          pageTxt.setText(`Página ${currentPage + 1} de ${totalPages}`);
        }
      }
    );

    modalContainer.add([backdrop, panelBg, title, closeBtn, gridContainer, pageTxt, prevBtn, nextBtn]);
  }

  /**
   * Limpeza de containers, modais, botões e listeners interativos.
   */
  public destroy() {
    this.isDestroyed = true;

    if (this.activeModalContainer) {
      this.activeModalContainer.destroy(true);
      this.activeModalContainer = undefined;
    }

    if (this.panelContainer) {
      this.panelContainer.destroy(true);
      this.panelContainer = undefined;
    }

    this.tabButtons = [];
    this.stateRef = undefined;
  }
}
