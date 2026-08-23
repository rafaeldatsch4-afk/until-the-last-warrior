import { transitionTo } from "../utils/sceneTransition";
import { syncCloudSaveImmediate } from "../systems/CloudSave";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";
import Phaser from "phaser";
import { GameState } from "../types";

export default class StoreScene extends Phaser.Scene {
  declare registry: Phaser.Data.DataManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare sound:
    | Phaser.Sound.NoAudioSoundManager
    | Phaser.Sound.HTML5AudioSoundManager
    | Phaser.Sound.WebAudioSoundManager;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare make: Phaser.GameObjects.GameObjectCreator;
  declare input: Phaser.Input.InputPlugin;
  declare time: Phaser.Time.Clock;
  declare tweens: Phaser.Tweens.TweenManager;
  declare events: Phaser.Events.EventEmitter;
  declare cache: Phaser.Cache.CacheManager;

  private coinsText!: Phaser.GameObjects.Text;
  private itemContainers: Phaser.GameObjects.Container[] = [];

  // Scroll variables
  private listContainer!: Phaser.GameObjects.Container;
  private scrollYPos: number = 0;
  private contentHeight: number = 0;
  private visibleArea = { y: 100, height: 420 }; // Top header is ~100px
  private scrollBarThumb!: Phaser.GameObjects.Rectangle;
  private scrollBarTrack!: Phaser.GameObjects.Rectangle;

  // Selection Logic
  private selectedIndex: number = 0;
  private selectionRect!: Phaser.GameObjects.Rectangle;

  // Input keys
  private keys!: any;

  constructor() {
    super("StoreScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const state = this.registry.get("gameState") as GameState;

    this.add.rectangle(480, 270, 960, 540, 0x0c141f);

    // Add postFX to main camera
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
      const cm = this.cameras.main.postFX.addColorMatrix();
      // saturation removed
    }

    // --- Header Background & Top Bar ---
    const bounds = ResponsiveUtils.getSafeBounds(this);
    const headerY = Math.max(26, bounds.top + 20);

    // Header Background Bar (Depth 150)
    const headerBar = this.add.graphics().setDepth(150);
    headerBar.fillStyle(0x0a101d, 0.95);
    headerBar.fillRect(0, 0, 960, headerY + 26);
    headerBar.lineStyle(1.5, 0xd4af37, 0.5);
    headerBar.moveTo(0, headerY + 26).lineTo(960, headerY + 26);
    headerBar.strokePath();

    // Back Button (Top Left - High Depth & Touch-Friendly Hitbox)
    const backBtnX = Math.min(130, Math.max(68, bounds.left + 50));
    const backContainer = this.add.container(backBtnX, headerY).setDepth(250);

    const btnW = 104;
    const btnH = 32;
    const radius = 7;
    const backBg = this.add.graphics();

    const drawBackBtn = (isHover: boolean) => {
      backBg.clear();
      // Drop Shadow
      backBg.fillStyle(0x000000, 0.6);
      backBg.fillRoundedRect(-btnW / 2 + 2, -btnH / 2 + 2, btnW, btnH, radius);
      // Main Surface
      backBg.fillStyle(isHover ? 0xd93829 : 0x1e293b, 0.95);
      backBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
      // Border
      backBg.lineStyle(1.5, isHover ? 0xfca5a5 : 0x475569, 0.9);
      backBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
    };
    drawBackBtn(false);

    const backTxt = this.add
      .text(0, 0, "← VOLTAR", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        resolution: 3,
      })
      .setOrigin(0.5);

    // Enlarged invisible hitbox (130x48px) for effortless tapping on mobile
    const backHit = this.add
      .rectangle(0, 0, 130, 48, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    backContainer.add([backBg, backTxt, backHit]);

    const exitToMenu = () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      transitionTo(this, "MenuScene");
    };

    backHit.on("pointerover", () => {
      drawBackBtn(true);
      this.tweens.add({ targets: backContainer, scale: 1.05, duration: 100 });
    });
    backHit.on("pointerout", () => {
      drawBackBtn(false);
      this.tweens.add({ targets: backContainer, scale: 1, duration: 100 });
    });
    backHit.on("pointerdown", () => {
      this.tweens.add({
        targets: backContainer,
        scale: 0.93,
        duration: 70,
        yoyo: true,
        onComplete: exitToMenu,
      });
    });

    // Keyboard ESC & Backspace shortcuts
    this.input.keyboard?.on("keydown-ESC", exitToMenu);
    this.input.keyboard?.on("keydown-BACKSPACE", exitToMenu);

    // Title (Centered, Depth 200)
    const titleContainer = this.add.container(480, headerY).setDepth(200);

    const titleDecor = this.add.graphics();
    titleDecor.lineStyle(1.5, 0xd4af37, 0.6);
    titleDecor.moveTo(-160, 0).lineTo(-105, 0);
    titleDecor.moveTo(105, 0).lineTo(160, 0);
    titleDecor.strokePath();
    titleDecor.fillCircle(-105, 0, 3);
    titleDecor.fillCircle(105, 0, 3);

    const storeTitleText = this.add
      .text(0, 0, "LOJA DE GUERREIROS", {
        fontSize: "21px",
        color: "#facc15",
        fontStyle: "900",
        stroke: "#000000",
        strokeThickness: 3.5,
        letterSpacing: 2,
        fontFamily:
          "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        shadow: {
          offsetY: 2,
          color: "#000000",
          blur: 4,
          fill: true,
        },
        resolution: 3,
      })
      .setOrigin(0.5);

    titleContainer.add([titleDecor, storeTitleText]);

    // Coins Pill (Top Right, Depth 200)
    const coinsX = Math.min(900, bounds.right - 50);
    const coinsContainer = this.add.container(coinsX, headerY).setDepth(200);

    const coinsBg = this.add.graphics();
    coinsBg.fillStyle(0x1e1b18, 0.95);
    coinsBg.fillRoundedRect(-68, -16, 136, 32, 7);
    coinsBg.lineStyle(1.5, 0xf59e0b, 0.9);
    coinsBg.strokeRoundedRect(-68, -16, 136, 32, 7);

    this.coinsText = this.add
      .text(0, 0, `🪙 ${state.coins}`, {
        fontSize: "14.5px",
        color: "#fbbf24",
        fontStyle: "bold",
        fontFamily:
          "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        resolution: 3,
      })
      .setOrigin(0.5);

    coinsContainer.add([coinsBg, this.coinsText]);

    // Bottom Help Banner (Depth 150)
    const bottomBar = this.add.graphics().setDepth(150);
    bottomBar.fillStyle(0x090e17, 0.92);
    bottomBar.fillRect(0, 514, 960, 26);
    bottomBar.lineStyle(1, 0x1e293b, 0.8);
    bottomBar.moveTo(0, 514).lineTo(960, 514);
    bottomBar.strokePath();

    this.add
      .text(480, 527, "Navegar: WASD / Setas | Comprar: ESPAÇO / ENTER | Toque nos cards", {
        fontSize: "11.5px",
        color: "#94a3b8",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        resolution: 2,
      })
      .setOrigin(0.5)
      .setDepth(160);

    // --- Scrollable Content Setup ---
    this.visibleArea = { y: headerY + 28, height: 512 - (headerY + 28) };
    this.listContainer = this.add.container(0, this.visibleArea.y);

    // Mask logic
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, this.visibleArea.y, 960, this.visibleArea.height);
    const mask = maskShape.createGeometryMask();
    this.listContainer.setMask(mask);

    // Selection Highlight
    this.selectionRect = this.add
      .rectangle(0, 0, 280, 146, 0xffd700, 0)
      .setStrokeStyle(3.5, 0xfacc15)
      .setVisible(false);
    this.listContainer.add(this.selectionRect); // Add to container so it scrolls

    // Scrollbar UI
    const trackX = 948;
    const trackY = this.visibleArea.y + this.visibleArea.height / 2;
    this.scrollBarTrack = this.add
      .rectangle(trackX, trackY, 6, this.visibleArea.height - 10, 0x1e293b)
      .setDepth(10);
    this.scrollBarThumb = this.add
      .rectangle(trackX, this.visibleArea.y + 40, 6, 70, 0x64748b)
      .setDepth(11);
    this.scrollBarThumb.setInteractive({ draggable: true });

    let isDraggingList = false;
    let dragStartY = 0;
    let startScrollY = 0;

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Only drag if the touch started within the scrollable cards area
      if (pointer.y >= this.visibleArea.y && pointer.x < 900) {
        isDraggingList = true;
        dragStartY = pointer.y;
        startScrollY = this.scrollYPos;
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (isDraggingList && pointer.isDown) {
        const deltaY = dragStartY - pointer.y;
        this.updateScrollFromTouch(startScrollY + deltaY);
      }
    });

    this.input.on("pointerup", () => {
      isDraggingList = false;
    });

    // Scroll Events (Mouse)
    const wheelHandler = (
      pointer: any,
      gameObjects: any,
      deltaX: number,
      deltaY: number,
    ) => {
      this.updateScroll(deltaY);
    };
    this.input.on("wheel", wheelHandler);

    this.input.setDraggable(this.scrollBarThumb);
    this.input.on(
      "drag",
      (pointer: any, gameObject: any, dragX: number, dragY: number) => {
        if (gameObject === this.scrollBarThumb) {
          const trackTop = this.visibleArea.y;
          const trackBottom = this.visibleArea.y + this.visibleArea.height;
          const thumbHeight = this.scrollBarThumb.height;

          // Clamp Y
          const minY = trackTop + thumbHeight / 2;
          const maxY = trackBottom - thumbHeight / 2;
          const newY = Phaser.Math.Clamp(dragY, minY, maxY);

          this.scrollBarThumb.y = newY;

          // Map position to scrollY
          const percent = (newY - minY) / (maxY - minY);
          const maxContentScroll = Math.max(
            0,
            this.contentHeight - this.visibleArea.height,
          );
          this.scrollYPos = percent * maxContentScroll;
          this.listContainer.y = this.visibleArea.y - this.scrollYPos;
        }
      },
    );

    // Clean up event listeners when scene is shut down
    this.events.on("shutdown", () => {
      this.input.off("wheel", wheelHandler);
    });

    // Keyboard Inputs (Standard WASD + Arrows for P2 support)
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        upAlt: Phaser.Input.Keyboard.KeyCodes.UP,
        downAlt: Phaser.Input.Keyboard.KeyCodes.DOWN,
        leftAlt: Phaser.Input.Keyboard.KeyCodes.LEFT,
        rightAlt: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      });
    }

    this.renderItems(state);
    this.updateSelectionHighlight();
  }

  update(time: number, delta: number) {
    if (!this.keys) return;

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.upAlt)
    ) {
      this.moveSelection(-3); // Move up a row (3 cols)
    } else if (
      Phaser.Input.Keyboard.JustDown(this.keys.down) ||
      Phaser.Input.Keyboard.JustDown(this.keys.downAlt)
    ) {
      this.moveSelection(3); // Move down a row
    } else if (
      Phaser.Input.Keyboard.JustDown(this.keys.left) ||
      Phaser.Input.Keyboard.JustDown(this.keys.leftAlt)
    ) {
      this.moveSelection(-1);
    } else if (
      Phaser.Input.Keyboard.JustDown(this.keys.right) ||
      Phaser.Input.Keyboard.JustDown(this.keys.rightAlt)
    ) {
      this.moveSelection(1);
    } else if (
      Phaser.Input.Keyboard.JustDown(this.keys.enter) ||
      Phaser.Input.Keyboard.JustDown(this.keys.space)
    ) {
      this.buySelected();
    }
  }

  moveSelection(delta: number) {
    const state = this.registry.get("gameState") as GameState;
    const count = state.characters.length;

    let newIndex = this.selectedIndex + delta;

    // Simple clamping
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= count) newIndex = count - 1;

    if (newIndex !== this.selectedIndex) {
      this.selectedIndex = newIndex;
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      this.updateSelectionHighlight();
      this.scrollToSelection();
    }
  }

  updateSelectionHighlight() {
    if (!this.itemContainers[this.selectedIndex]) return;

    const target = this.itemContainers[this.selectedIndex];
    this.selectionRect.setPosition(target.x, target.y);
    this.selectionRect.setVisible(true);

    // Bring selection box to top of container logic if needed, but it's already in listContainer
    this.listContainer.bringToTop(this.selectionRect);
  }

  scrollToSelection() {
    const target = this.itemContainers[this.selectedIndex];
    // Item Top Y relative to list start (0)
    const itemTop = target.y - 70; // Half height (140/2)
    const itemBottom = target.y + 70;

    // Current visible window relative to list start: [scrollYPos, scrollYPos + visibleHeight]
    const visibleTop = this.scrollYPos;
    const visibleBottom = this.scrollYPos + this.visibleArea.height;

    if (itemTop < visibleTop) {
      // Scroll Up
      this.scrollYPos = Math.max(0, itemTop - 10);
    } else if (itemBottom > visibleBottom) {
      // Scroll Down
      this.scrollYPos = Math.min(
        this.contentHeight - this.visibleArea.height,
        itemBottom - this.visibleArea.height + 10,
      );
    }

    // Apply
    this.listContainer.y = this.visibleArea.y - this.scrollYPos;
    this.updateScrollBarPosition();
  }

  buySelected() {
    const state = this.registry.get("gameState") as GameState;
    const char = state.characters[this.selectedIndex];
    this.attemptBuy(char);
  }

  attemptBuy(char: any) {
    const state = this.registry.get("gameState") as GameState;

    if (char.unlocked) return; // Already owned

    if (state.coins >= char.price) {
      this.sound.play("sfx_select");
      state.coins -= char.price;
      char.unlocked = true;

      window.UTLW.save();
      window.dispatchEvent(new CustomEvent('sync-coins', { detail: { coins: state.coins }}));
      syncCloudSaveImmediate();
      this.showSaveIndicator();

      this.coinsText.setText(`COINS: ${state.coins}`);
      this.renderItems(state);
      this.updateSelectionHighlight(); // Re-render kills reference? No, containers recreated
    } else {
      this.sound.play("sfx_error");
      // Visual feedback on selected item?
      const container = this.itemContainers[this.selectedIndex];
      this.tweens.add({
        targets: container,
        x: container.x + 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
    }
  }

  updateScroll(delta: number) {
    const maxScroll = Math.max(0, this.contentHeight - this.visibleArea.height);
    if (maxScroll <= 0) return;

    this.scrollYPos = Phaser.Math.Clamp(this.scrollYPos + delta, 0, maxScroll);
    this.listContainer.y = this.visibleArea.y - this.scrollYPos;

    this.updateScrollBarPosition();
  }

  private updateScrollFromTouch(newY: number) {
    const maxScroll = Math.max(0, this.contentHeight - this.visibleArea.height);
    if (maxScroll <= 0) return;

    this.scrollYPos = Phaser.Math.Clamp(newY, 0, maxScroll);
    this.listContainer.y = this.visibleArea.y - this.scrollYPos;

    this.updateScrollBarPosition();
  }

  updateScrollBarPosition() {
    const maxScroll = Math.max(0, this.contentHeight - this.visibleArea.height);
    if (maxScroll <= 0) {
      this.scrollBarThumb.setVisible(false);
      return;
    }
    this.scrollBarThumb.setVisible(true);

    const percent = this.scrollYPos / maxScroll;

    const trackTop = this.visibleArea.y;
    const trackBottom = this.visibleArea.y + this.visibleArea.height;
    const thumbHeight = this.scrollBarThumb.height;

    const minY = trackTop + thumbHeight / 2;
    const maxY = trackBottom - thumbHeight / 2;

    this.scrollBarThumb.y = minY + percent * (maxY - minY);
  }

  renderItems(state: GameState) {
    this.itemContainers.forEach((c) => c.destroy());
    this.itemContainers = [];

    const startY = 82; // Initial offset inside container
    const rowHeight = 152;
    const colWidth = 286;
    const cols = 3;

    state.characters.forEach((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = 184 + col * colWidth;
      const y = startY + row * rowHeight;

      const container = this.add.container(x, y);
      
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x131f33, 0.92);
      cardBg.fillRoundedRect(-137, -68, 274, 136, 8);
      cardBg.lineStyle(1.5, char.unlocked ? 0x334155 : 0xf59e0b, 0.7);
      cardBg.strokeRoundedRect(-137, -68, 274, 136, 8);

      // Sprite framed cleanly inside the left section of the card
      const sprite = this.add
        .sprite(-78, 6, char.key, "0")
        .setScale(1.9)
        .setOrigin(0.5, 0.5);

      if (this.anims.exists(`${char.key}_idle`)) {
        sprite.play(`${char.key}_idle`, true);
      }

      const name = this.add
        .text(38, -36, char.name.toUpperCase(), {
          fontSize: "19px",
          fontStyle: "bold",
          color: "#f8fafc",
          fontFamily:
            "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      const special = this.add
        .text(38, -12, `50%: ${char.specialName}`, {
          fontSize: "11px",
          color: "#94a3b8",
          fontStyle: "italic",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      const superAttack = this.add
        .text(38, 6, `100%: ${char.superName}`, {
          fontSize: "11px",
          color: "#fbbf24",
          fontStyle: "italic",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          resolution: 2,
        })
        .setOrigin(0.5);

      container.add([cardBg, sprite, name, special, superAttack]);

      if (char.unlocked) {
        const statusBg = this.add.graphics();
        statusBg.fillStyle(0x064e3b, 0.7);
        statusBg.fillRoundedRect(-22, 24, 120, 26, 5);
        statusBg.lineStyle(1, 0x10b981, 0.6);
        statusBg.strokeRoundedRect(-22, 24, 120, 26, 5);

        const status = this.add
          .text(38, 37, "✓ ADQUIRIDO", {
            fontSize: "12px",
            color: "#34d399",
            fontStyle: "bold",
            letterSpacing: 1,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            resolution: 2,
          })
          .setOrigin(0.5);
        container.add([statusBg, status]);
      } else {
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xd97706, 0.95);
        btnBg.fillRoundedRect(-22, 23, 120, 28, 6);
        btnBg.lineStyle(1, 0xfde68a, 0.8);
        btnBg.strokeRoundedRect(-22, 23, 120, 28, 6);

        const btnTxt = this.add
          .text(38, 37, `🪙 ${char.price} G`, {
            fontSize: "13px",
            fontStyle: "bold",
            color: "#ffffff",
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            resolution: 2,
          })
          .setOrigin(0.5);

        // Invisible touch hitbox for buy button
        const btnHit = this.add
          .rectangle(38, 37, 120, 28, 0x000000, 0)
          .setInteractive({ useHandCursor: true });

        btnHit.on("pointerover", () => {
          btnBg.clear();
          btnBg.fillStyle(0xf59e0b, 1);
          btnBg.fillRoundedRect(-22, 23, 120, 28, 6);
          btnBg.lineStyle(1.5, 0xffffff, 1);
          btnBg.strokeRoundedRect(-22, 23, 120, 28, 6);
        });

        btnHit.on("pointerout", () => {
          btnBg.clear();
          btnBg.fillStyle(0xd97706, 0.95);
          btnBg.fillRoundedRect(-22, 23, 120, 28, 6);
          btnBg.lineStyle(1, 0xfde68a, 0.8);
          btnBg.strokeRoundedRect(-22, 23, 120, 28, 6);
        });

        // Buy Button Interaction
        btnHit.on("pointerup", () => {
          // If we dragged more than a few pixels, cancel the buy because it was a swipe
          if (
            Math.abs(
              this.input.activePointer.y - this.input.activePointer.downY,
            ) > 10
          )
            return;

          this.selectedIndex = index; // Sync selection
          this.updateSelectionHighlight();
          this.attemptBuy(char);
        });

        container.add([btnBg, btnTxt, btnHit]);
      }

      this.listContainer.add(container);
      this.itemContainers.push(container);
    });

    // Re-add selection rect to top so it draws over new items
    this.listContainer.bringToTop(this.selectionRect);

    // Calculate total height
    const rows = Math.ceil(state.characters.length / cols);
    this.contentHeight = startY + rows * rowHeight;

    this.updateScrollBarPosition();
  }

  showSaveIndicator() {
    const txt = this.add
      .text(920, 80, "SAVED!", {
        fontSize: "16px",
        color: "#00ff00",
        fontStyle: "bold",
        fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
        resolution: 2,
      })
      .setOrigin(1, 0.5);
    this.tweens.add({
      targets: txt,
      y: 70,
      alpha: 0,
      duration: 1500,
      onComplete: () => txt.destroy(),
    });
  }
}
