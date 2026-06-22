import Phaser from "phaser";
import { CreatorState } from "./CreatorState";
import {
  partOptions,
  auraColors,
  skinColors,
  hairColors,
  giColors,
} from "./CreatorPartOptions";

export class CreatorUI {
  private scene: Phaser.Scene;
  private onUpdate: () => void;

  constructor(scene: Phaser.Scene, onUpdate: () => void) {
    this.scene = scene;
    this.onUpdate = onUpdate;
  }

  // Define getColorName outside to use it locally in CreatorUI
  private getColorName(hex: number): string {
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
  }

  public createSelector(
    x: number,
    y: number,
    getLabel: () => string,
    onPrev: () => void,
    onNext: () => void,
    width: number = 140,
  ) {
    this.scene.add
      .rectangle(x, y, width, 30, 0x1a252f)
      .setStrokeStyle(2, 0x34495e);
    const txt = this.scene.add
      .text(x, y, getLabel(), {
        fontSize: "13px",
        fontFamily: "system-ui",
        color: "#fff",
      })
      .setOrigin(0.5);

    const btnL = this.scene.add
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
        this.onUpdate();
      })
      .on("pointerover", () => btnL.setColor("#f1c40f").setScale(1.2))
      .on("pointerout", () => btnL.setColor("#3498db").setScale(1));

    const btnR = this.scene.add
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
        this.onUpdate();
      })
      .on("pointerover", () => btnR.setColor("#f1c40f").setScale(1.2))
      .on("pointerout", () => btnR.setColor("#3498db").setScale(1));

    return txt;
  }

  public showAttackSelectModal(
    isSuper: boolean,
    specials: { id: string; name: string }[],
    supers: { id: string; name: string }[],
    onSelect: (id: string, name: string) => void,
  ) {
    const bg = this.scene.add
      .rectangle(480, 270, 960, 540, 0x000000, 0.8)
      .setInteractive()
      .setDepth(100);
    const panel = this.scene.add
      .rectangle(480, 270, 560, 480, 0x2c3e50)
      .setStrokeStyle(4, 0x34495e)
      .setDepth(100);
    const title = this.scene.add
      .text(
        480,
        60,
        isSuper ? "Selecionar Especial 2 (Super)" : "Selecionar Especial 1",
        { fontSize: "24px", fontStyle: "bold", fontFamily: "system-ui" },
      )
      .setOrigin(0.5)
      .setDepth(100);

    const listContainer = this.scene.add.container(230, 100).setDepth(100);
    const list = isSuper ? supers : specials;

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
        const btn = this.scene.add
          .rectangle(col * 260 + 120, row * 45, 240, 35, 0x34495e)
          .setInteractive({ useHandCursor: true });
        const txt = this.scene.add
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

    cancelBtn = this.scene.add
      .rectangle(480, 490, 200, 30, 0xe74c3c)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    cancelTxt = this.scene.add
      .text(480, 490, "CANCELAR", {
        fontSize: "18px",
        fontStyle: "bold",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5)
      .setDepth(100);
    cancelBtn.on("pointerdown", cleanup);

    prevBtn = this.scene.add
      .rectangle(330, 440, 80, 30, 0x7f8c8d)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    prevTxt = this.scene.add
      .text(330, 440, "< ANT", { fontSize: "16px", fontFamily: "system-ui" })
      .setOrigin(0.5)
      .setDepth(100);
    nextBtn = this.scene.add
      .rectangle(630, 440, 80, 30, 0x7f8c8d)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    nextTxt = this.scene.add
      .text(630, 440, "PROX >", { fontSize: "16px", fontFamily: "system-ui" })
      .setOrigin(0.5)
      .setDepth(100);
    pageTxt = this.scene.add
      .text(480, 440, `Pág 1/${totalPages}`, {
        fontSize: "16px",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5)
      .setDepth(100);

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
  }

  public buildAllSelectors(state: CreatorState) {
    const col1X = 140; // Parts
    const col2X = 300; // Col 1
    const col3X = 460; // Col 2

    let currY = 150;

    // Body
    this.createSelector(
      col1X,
      currY,
      () => `Pele: ${this.getColorName(skinColors[state.p_idx.skin])}`,
      () => state.prevColor("skin", skinColors),
      () => state.nextColor("skin", skinColors),
      140,
    );

    this.createSelector(
      col2X,
      currY,
      () => `Cab.: ${this.getColorName(hairColors[state.p_idx.hair])}`,
      () => state.prevColor("hair", hairColors),
      () => state.nextColor("hair", hairColors),
      140,
    );
    currY += 40;

    // Head
    this.createSelector(
      col1X,
      currY,
      () => `Cabç: ${partOptions.head[state.style_idx.head]}`,
      () => state.prevPart("head", partOptions.head),
      () => state.nextPart("head", partOptions.head),
    );
    this.createSelector(
      col2X,
      currY,
      () => `C1: ${this.getColorName(giColors[state.p_idx.head_1])}`,
      () => state.prevColor("head_1", giColors),
      () => state.nextColor("head_1", giColors),
    );
    this.createSelector(
      col3X,
      currY,
      () => `C2: ${this.getColorName(giColors[state.p_idx.head_2])}`,
      () => state.prevColor("head_2", giColors),
      () => state.nextColor("head_2", giColors),
    );
    currY += 40;

    // Torso
    this.createSelector(
      col1X,
      currY,
      () => `Tro: ${partOptions.torso[state.style_idx.torso]}`,
      () => state.prevPart("torso", partOptions.torso),
      () => state.nextPart("torso", partOptions.torso),
    );
    this.createSelector(
      col2X,
      currY,
      () => `C1: ${this.getColorName(giColors[state.p_idx.torso_1])}`,
      () => state.prevColor("torso_1", giColors),
      () => state.nextColor("torso_1", giColors),
    );
    this.createSelector(
      col3X,
      currY,
      () => `C2: ${this.getColorName(giColors[state.p_idx.torso_2])}`,
      () => state.prevColor("torso_2", giColors),
      () => state.nextColor("torso_2", giColors),
    );
    currY += 40;

    // Legs
    this.createSelector(
      col1X,
      currY,
      () => `Cal: ${partOptions.legs[state.style_idx.legs]}`,
      () => state.prevPart("legs", partOptions.legs),
      () => state.nextPart("legs", partOptions.legs),
    );
    this.createSelector(
      col2X,
      currY,
      () => `C1: ${this.getColorName(giColors[state.p_idx.legs_1])}`,
      () => state.prevColor("legs_1", giColors),
      () => state.nextColor("legs_1", giColors),
    );
    this.createSelector(
      col3X,
      currY,
      () => `C2: ${this.getColorName(giColors[state.p_idx.legs_2])}`,
      () => state.prevColor("legs_2", giColors),
      () => state.nextColor("legs_2", giColors),
    );
    currY += 40;

    // Feet
    this.createSelector(
      col1X,
      currY,
      () => `Bot: ${partOptions.feet[state.style_idx.feet]}`,
      () => state.prevPart("feet", partOptions.feet),
      () => state.nextPart("feet", partOptions.feet),
    );
    this.createSelector(
      col2X,
      currY,
      () => `C1: ${this.getColorName(giColors[state.p_idx.feet_1])}`,
      () => state.prevColor("feet_1", giColors),
      () => state.nextColor("feet_1", giColors),
    );
    this.createSelector(
      col3X,
      currY,
      () => `C2: ${this.getColorName(giColors[state.p_idx.feet_2])}`,
      () => state.prevColor("feet_2", giColors),
      () => state.nextColor("feet_2", giColors),
    );
    currY += 40;

    // Accessory
    this.createSelector(
      col1X,
      currY,
      () => `Acs: ${partOptions.accessory[state.style_idx.accessory]}`,
      () => state.prevPart("accessory", partOptions.accessory),
      () => state.nextPart("accessory", partOptions.accessory),
    );
    this.createSelector(
      col2X,
      currY,
      () => `C1: ${this.getColorName(giColors[state.p_idx.acc_1])}`,
      () => state.prevColor("acc_1", giColors),
      () => state.nextColor("acc_1", giColors),
    );
  }
}
