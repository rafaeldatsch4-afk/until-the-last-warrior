import { Responsive } from "../utils/Responsive";
import Phaser from "phaser";

import type BattleScene from "../scenes/BattleScene";

export interface BattleKeys {
  p1_up: Phaser.Input.Keyboard.Key;
  p1_down: Phaser.Input.Keyboard.Key;
  p1_left: Phaser.Input.Keyboard.Key;
  p1_right: Phaser.Input.Keyboard.Key;
  p1_attack: Phaser.Input.Keyboard.Key;
  p1_kiblast: Phaser.Input.Keyboard.Key;
  p1_defend: Phaser.Input.Keyboard.Key;
  p1_charge: Phaser.Input.Keyboard.Key;
  p1_special: Phaser.Input.Keyboard.Key;
  p1_transform: Phaser.Input.Keyboard.Key;

  p2_up: Phaser.Input.Keyboard.Key;
  p2_down: Phaser.Input.Keyboard.Key;
  p2_left: Phaser.Input.Keyboard.Key;
  p2_right: Phaser.Input.Keyboard.Key;
  p2_attack: Phaser.Input.Keyboard.Key;
  p2_kiblast: Phaser.Input.Keyboard.Key;
  p2_charge: Phaser.Input.Keyboard.Key;
  p2_defend: Phaser.Input.Keyboard.Key;
  p2_special: Phaser.Input.Keyboard.Key;
  p2_transform: Phaser.Input.Keyboard.Key;

  pause: Phaser.Input.Keyboard.Key;
}

export type InputAction = "attack" | "kiblast" | "transform" | "special" | "left" | "right" | "up" | "down" | "defend" | "charge";

export class BattleInput {
  scene: BattleScene;
  keys!: BattleKeys;
  mobileJoystickPointerId: number | null = null;
  mobileJoystickVector = { x: 0, y: 0 };
  mobileControls: Phaser.GameObjects.GameObject[] = [];

  // Mobile state flags (accessible to scene)
  mobileP1Attack = false;
  mobileP1KiBlast = false;
  mobileP1Defend = false;
  mobileP1Charge = false;
  mobileP1Special = false;
  mobileP1Transform = false;
  mobileP1Dash: number = 0;
  mobileP1SpecialJustUp = false;
  isEditingHUD = false;
  editHudTextObj: Phaser.GameObjects.Text | null = null;

  constructor(scene: BattleScene) {
    this.scene = scene;
  }

  // --- Abstraction Layer ---
  public checkActionDown(action: InputAction, isPlayer1: boolean): boolean {
    if (isPlayer1) {
      switch (action) {
        case "defend": return this.keys.p1_defend.isDown || this.mobileP1Defend;
        case "charge": return this.keys.p1_charge.isDown || this.mobileP1Charge;
        case "left": return this.keys.p1_left.isDown || this.mobileJoystickVector.x < -0.3;
        case "right": return this.keys.p1_right.isDown || this.mobileJoystickVector.x > 0.3;
        case "up": return this.keys.p1_up.isDown || this.mobileJoystickVector.y < -0.3;
        case "down": return this.keys.p1_down.isDown || this.mobileJoystickVector.y > 0.3;
        case "special": return this.keys.p1_special.isDown || this.mobileP1Special;
        case "attack": return this.keys.p1_attack.isDown || this.mobileP1Attack;
        case "kiblast": return this.keys.p1_kiblast.isDown || this.mobileP1KiBlast;
        case "transform": return this.keys.p1_transform.isDown || this.mobileP1Transform;
        default: return false;
      }
    } else {
      switch (action) {
        case "defend": return this.keys.p2_defend.isDown;
        case "charge": return this.keys.p2_charge.isDown;
        case "left": return this.keys.p2_left.isDown;
        case "right": return this.keys.p2_right.isDown;
        case "up": return this.keys.p2_up.isDown;
        case "down": return this.keys.p2_down.isDown;
        case "special": return this.keys.p2_special.isDown;
        case "attack": return this.keys.p2_attack.isDown;
        case "kiblast": return this.keys.p2_kiblast.isDown;
        case "transform": return this.keys.p2_transform.isDown;
        default: return false;
      }
    }
  }

  public checkActionJustUp(action: InputAction, isPlayer1: boolean): boolean {
    if (isPlayer1) {
      switch (action) {
        case "special":
          if (this.mobileP1SpecialJustUp) {
            this.mobileP1SpecialJustUp = false;
            return true;
          }
          return Phaser.Input.Keyboard.JustUp(this.keys.p1_special);
        default: return false;
      }
    } else {
      switch (action) {
        case "special":
          return Phaser.Input.Keyboard.JustUp(this.keys.p2_special);
        default: return false;
      }
    }
  }

  public checkActionJustDown(action: InputAction, isPlayer1: boolean): boolean {
    if (isPlayer1) {
      switch (action) {
        case "attack":
          if (this.mobileP1Attack) {
            this.mobileP1Attack = false;
            return true;
          }
          return Phaser.Input.Keyboard.JustDown(this.keys.p1_attack);
        case "kiblast":
          if (this.mobileP1KiBlast) {
            this.mobileP1KiBlast = false;
            return true;
          }
          return Phaser.Input.Keyboard.JustDown(this.keys.p1_kiblast);
        case "transform":
          if (this.mobileP1Transform) {
            this.mobileP1Transform = false;
            return true;
          }
          return Phaser.Input.Keyboard.JustDown(this.keys.p1_transform);
        case "left": return Phaser.Input.Keyboard.JustDown(this.keys.p1_left);
        case "right": return Phaser.Input.Keyboard.JustDown(this.keys.p1_right);
        case "up": return Phaser.Input.Keyboard.JustDown(this.keys.p1_up);
        case "down": return Phaser.Input.Keyboard.JustDown(this.keys.p1_down);
        case "special": return Phaser.Input.Keyboard.JustDown(this.keys.p1_special);
        default: return false;
      }
    } else {
      switch (action) {
        case "attack":
          if (this.scene.p2BufferedAttack) {
            this.scene.p2BufferedAttack = false;
            return true;
          }
          return Phaser.Input.Keyboard.JustDown(this.keys.p2_attack);
        case "kiblast":
          if (this.scene.p2BufferedKiBlast) {
            this.scene.p2BufferedKiBlast = false;
            return true;
          }
          return Phaser.Input.Keyboard.JustDown(this.keys.p2_kiblast);
        case "transform":
          if (this.scene.p2BufferedTransform) {
            this.scene.p2BufferedTransform = false;
            return true;
          }
          return Phaser.Input.Keyboard.JustDown(this.keys.p2_transform);
        case "left": return Phaser.Input.Keyboard.JustDown(this.keys.p2_left);
        case "right": return Phaser.Input.Keyboard.JustDown(this.keys.p2_right);
        case "up": return Phaser.Input.Keyboard.JustDown(this.keys.p2_up);
        case "down": return Phaser.Input.Keyboard.JustDown(this.keys.p2_down);
        case "special": return Phaser.Input.Keyboard.JustDown(this.keys.p2_special);
        default: return false;
      }
    }
  }


  createInputs() {
    if (!this.scene.input.keyboard) return;

    // Clean up old keys if any (defensive)
    this.scene.input.keyboard.removeAllKeys();

    this.keys = this.scene.input.keyboard.addKeys({
      p1_up: Phaser.Input.Keyboard.KeyCodes.W,
      p1_down: Phaser.Input.Keyboard.KeyCodes.S,
      p1_left: Phaser.Input.Keyboard.KeyCodes.A,
      p1_right: Phaser.Input.Keyboard.KeyCodes.D,
      p1_attack: Phaser.Input.Keyboard.KeyCodes.E,
      p1_kiblast: Phaser.Input.Keyboard.KeyCodes.C,
      p1_defend: Phaser.Input.Keyboard.KeyCodes.Q,
      p1_charge: Phaser.Input.Keyboard.KeyCodes.R,
      p1_special: Phaser.Input.Keyboard.KeyCodes.V,
      p1_transform: Phaser.Input.Keyboard.KeyCodes.X,

      p2_up: Phaser.Input.Keyboard.KeyCodes.UP,
      p2_down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      p2_left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      p2_right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      p2_attack: Phaser.Input.Keyboard.KeyCodes.I,
      p2_kiblast: Phaser.Input.Keyboard.KeyCodes.L,
      p2_defend: Phaser.Input.Keyboard.KeyCodes.O,
      p2_charge: Phaser.Input.Keyboard.KeyCodes.U,
      p2_special: Phaser.Input.Keyboard.KeyCodes.K,
      p2_transform: Phaser.Input.Keyboard.KeyCodes.P,

      pause: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) as unknown as BattleKeys;

    // Pause handler
    this.scene.input.keyboard.on("keydown-ESC", () => {
      if (!this.scene.isBattleOver) {
        if (this.scene.gameState.gameMode === "online_pvp") {
          this.scene.scene.launch("PauseScene", { online: true });
        } else {
          this.scene.scene.pause();
          this.scene.scene.launch("PauseScene", { online: false });
        }
      }
    });
  }

  createMobileControls() {
    // Ensure accurate isMobile check
    const isMobile =
      this.scene.sys.game.device.input.touch ||
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) return;

    const gw = this.scene.cameras.main.width;
    const gh = this.scene.cameras.main.height;
    
    const cfg = this.scene.gameState.settings?.hudConfig;
    const opacity = cfg?.opacity ?? 0.5;
    const dpadScale = cfg?.dpadScale ?? 1.0;
    const btnScale = cfg?.buttonsScale ?? 1.0;

    const visible = Responsive.getVisibleBounds(this.scene);

    const dpadPos = cfg?.dpadPos ?? { x: visible.left + 120, y: visible.bottom - 100 };
    const btnPos = cfg?.buttonsPos ?? { x: visible.right - 120, y: visible.bottom - 100 };

    const createBtn = (
      defaultX: number,
      defaultY: number,
      text: string,
      color: number,
      radius: number,
      onDown: () => void,
      onUp?: () => void,
    ) => {
      // Check localStorage for saved position
      const saved = localStorage.getItem(`hudPos_${text}`);
      let x = defaultX;
      let y = defaultY;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          x = parsed.x;
          y = parsed.y;
        } catch (e) {}
      }
      // Modern Glassy Button Setup
      const btnGroup = this.scene.add
        .container(x, y)
        .setScrollFactor(0)
        .setDepth(100);

      const outerBtn = this.scene.add
        .circle(0, 0, radius, color, opacity)
        .setStrokeStyle(3, 0xffffff, 0.5);
      const innerBtn = this.scene.add.circle(0, 0, radius * 0.85, 0x000000, Math.min(1, opacity * 1.5));

      const txt = this.scene.add
        .text(0, 0, text, {
          fontFamily: "Impact, sans-serif",
          fontSize: radius > 40 ? "24px" : "18px",
          color: "#ffffff",
          stroke: "#000",
          strokeThickness: 3,
        })
        .setOrigin(0.5);

      btnGroup.add([outerBtn, innerBtn, txt]);

      this.mobileControls.push(btnGroup);
      if (this.scene.battleUI?.uiContainer) {
        this.scene.battleUI?.uiContainer.add(btnGroup);
      }

      let isPressed = false;

      const press = () => {
        if (isPressed) return;
        isPressed = true;
        outerBtn.setAlpha(0.8);
        outerBtn.setScale(0.9);
        innerBtn.setScale(0.9);
        txt.setScale(0.9);
        onDown();
      };

      const release = () => {
        if (!isPressed) return;
        isPressed = false;
        outerBtn.setAlpha(0.4);
        outerBtn.setScale(1);
        innerBtn.setScale(1);
        txt.setScale(1);
        if (onUp) onUp();
      };

      const circleContains = (c: Phaser.Geom.Circle, x: number, y: number) => {
        if (c.radius <= 0) return false;
        const dx = c.x - x;
        const dy = c.y - y;
        return dx * dx + dy * dy <= c.radius * c.radius;
      };

      const hitArea = new Phaser.Geom.Circle(0, 0, radius * 1.5);
      btnGroup.setInteractive(hitArea, circleContains);
      this.scene.input.setDraggable(btnGroup);

      btnGroup.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (!this.isEditingHUD) return;
        btnGroup.x = dragX;
        btnGroup.y = dragY;
      });
      
      btnGroup.on('dragend', () => {
        if (!this.isEditingHUD) return;
        localStorage.setItem(`hudPos_${text}`, JSON.stringify({ x: btnGroup.x, y: btnGroup.y }));
      });

      btnGroup.on("pointerdown", () => {
        if (this.isEditingHUD) return;
        press();
      });

      btnGroup.on("pointerup", () => {
        release();
      });

      btnGroup.on("pointerout", () => {
        release();
      });

      return btnGroup;
    };

    // --- Virtual Joystick ---
    let defaultJoyX = dpadPos.x;
    let defaultJoyY = dpadPos.y;
    
    // Check localStorage for saved joystick position
    const savedJoy = localStorage.getItem(`hudPos_JOYSTICK`);
    if (savedJoy) {
      try {
        const parsed = JSON.parse(savedJoy);
        defaultJoyX = parsed.x;
        defaultJoyY = parsed.y;
      } catch (e) {}
    }

    let joyRootX = defaultJoyX;
    let joyRootY = defaultJoyY;

    const joyContainer = this.scene.add
      .container(joyRootX, joyRootY)
      .setScrollFactor(0)
      .setDepth(100);
    const joyBase = this.scene.add
      .circle(0, 0, 75, 0x000000, 0.4)
      .setStrokeStyle(3, 0xffffff, 0.3);
    const joyThumb = this.scene.add
      .circle(0, 0, 35, 0xffffff, 0.6)
      .setStrokeStyle(2, 0x000000, 0.5);

    joyContainer.add([joyBase, joyThumb]);
    joyContainer.setScale(dpadScale);
    joyBase.setAlpha(opacity);
    this.mobileControls.push(joyContainer);

    // Make joystick draggable in HUD edit mode
    const joyCircleContains = (c: Phaser.Geom.Circle, x: number, y: number) => {
      if (c.radius <= 0) return false;
      const dx = c.x - x;
      const dy = c.y - y;
      return dx * dx + dy * dy <= c.radius * c.radius;
    };
    joyContainer.setInteractive(new Phaser.Geom.Circle(0, 0, 75), joyCircleContains);
    this.scene.input.setDraggable(joyContainer);
    
    joyContainer.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (!this.isEditingHUD) return;
      joyContainer.x = dragX;
      joyContainer.y = dragY;
    });
    
    joyContainer.on('dragend', () => {
      if (!this.isEditingHUD) return;
      defaultJoyX = joyContainer.x;
      defaultJoyY = joyContainer.y;
      localStorage.setItem(`hudPos_JOYSTICK`, JSON.stringify({ x: joyContainer.x, y: joyContainer.y }));
    });

    // Large invisible hit area on the bottom-left quadrant for the FLOATING joystick
    // We remove the old rectangle hit area and use global checking for this too.
    if (this.scene.battleUI?.uiContainer) {
      this.scene.battleUI?.uiContainer.add(joyContainer);
    }

    const getLocalPnt = (pointer: Phaser.Input.Pointer) => {
      return { x: pointer.x, y: pointer.y };
    };

    const handleJoystick = (pointer: Phaser.Input.Pointer) => {
      if (this.mobileJoystickPointerId !== pointer.id) return;

      const loc = getLocalPnt(pointer);

      let dx = loc.x - joyRootX;
      let dy = loc.y - joyRootY;
      const maxDist = 75;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      joyThumb.setPosition(dx, dy);

      this.mobileJoystickVector = { x: dx / maxDist, y: dy / maxDist };

      // Instant response with very small deadzone (360-like responsiveness)
      this.keys.p1_up.isDown = dy < -10;
      this.keys.p1_left.isDown = dx < -10;
      this.keys.p1_right.isDown = dx > 10;
    };

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (this.isEditingHUD) return;
      if (currentlyOver && currentlyOver.length > 0) return; // Prevent triggering if clicking a button
      const loc = getLocalPnt(pointer);
      // Only trigger joystick if the pointer is on the left half of the screen
      if (loc.x < gw / 2 && loc.y > gh / 2 - 50) {
        if (this.mobileJoystickPointerId === null) {
          this.mobileJoystickPointerId = pointer.id;

          // Standard Floating Joystick Behavior
          joyRootX = loc.x;
          joyRootY = loc.y;
          joyContainer.setPosition(joyRootX, joyRootY);
          joyBase.setAlpha(Math.min(1, opacity * 1.5));

          handleJoystick(pointer);
        }
      }
    });

    this.scene.input.on("pointermove", handleJoystick);

    const releaseJoystick = (pointer: Phaser.Input.Pointer) => {
      if (this.mobileJoystickPointerId === pointer.id) {
        this.mobileJoystickPointerId = null;

        joyRootX = defaultJoyX;
        joyRootY = defaultJoyY;
        joyContainer.setPosition(joyRootX, joyRootY);

        joyBase.setAlpha(opacity);
        joyThumb.setPosition(0, 0);
        this.mobileJoystickVector = { x: 0, y: 0 };

        this.keys.p1_up.isDown = false;
        this.keys.p1_left.isDown = false;
        this.keys.p1_right.isDown = false;
      }
    };

    this.scene.input.on("pointerup", releaseJoystick);
    this.scene.input.on("pointerout", releaseJoystick);
    // --- End Virtual Joystick ---

    // Right side (Attacks)
    // Layout em grade 2x3 sem sobreposição (validado matematicamente)
    const COL_GAP = 145 * btnScale;
    const ROW_GAP = 145 * btnScale;
    const gridBaseX = btnPos.x + 20;
    const gridBaseY = btnPos.y + 5;

    // ATK (Center)
    createBtn(gridBaseX, gridBaseY, "ATK", 0xe74c3c, 55 * btnScale, () => {
      this.mobileP1Attack = true;
      this.scene.p1AttackBuffer = this.scene.BUFFER_MS;
    });

    // KI BLAST (Top)
    createBtn(gridBaseX - COL_GAP, gridBaseY - ROW_GAP, "KI", 0x00ffff, 38 * btnScale, () => {
      this.mobileP1KiBlast = true;
      this.scene.p1KiBlastBuffer = this.scene.BUFFER_MS;
    });

    // DEF (Left)
    createBtn(
      gridBaseX - COL_GAP * 2,
      gridBaseY,
      "DEF",
      0x3498db,
      38 * btnScale,
      () => { this.mobileP1Defend = true; },
      () => { this.mobileP1Defend = false; },
    );

    // DASH (Bottom)
    createBtn(
      gridBaseX - COL_GAP * 2,
      gridBaseY - ROW_GAP,
      "DSH",
      0xff9900,
      38 * btnScale,
      () => { 
        const isLeft = this.keys.p1_left.isDown;
        const isRight = this.keys.p1_right.isDown;
        this.mobileP1Dash = isLeft ? -1 : (isRight ? 1 : 0);
        if (this.mobileP1Dash === 0) {
            const activeObj = this.scene.localPlayerIndex === 1 ? this.scene.player : this.scene.enemy;
            this.mobileP1Dash = activeObj.flipX ? -1 : 1;
        }
      }
    );

    // CHG (Right)
    createBtn(
      gridBaseX - COL_GAP,
      gridBaseY,
      "CHG",
      0x2ecc71,
      38 * btnScale,
      () => { this.mobileP1Charge = true; },
      () => { this.mobileP1Charge = false; },
    );

    // SPC (Special - Top Right)
    createBtn(
      gridBaseX,
      gridBaseY - ROW_GAP,
      "SPC",
      0xf1c40f,
      38 * btnScale,
      () => { this.mobileP1Special = true; },
      () => { this.mobileP1Special = false; this.mobileP1SpecialJustUp = true; },
    );

    // TRN (Transform - Above Joystick)
    const localData = this.scene.localPlayerIndex === 1 ? this.scene.playerData : this.scene.enemyData;
    if (localData.transformAvailable) {
      this.scene.trnBtnGroup = createBtn(dpadPos.x, dpadPos.y - 180 * dpadScale, "TRN", 0x9b59b6, 40 * dpadScale, () => {
        this.mobileP1Transform = true;
        this.scene.p1TransformBuffer = this.scene.BUFFER_MS;
      });
    }

    // Pause Button (Top Center)
    const pauseX = gw / 2 - 35;
    const pauseY = 40;
    const pauseBtn = this.scene.add
      .circle(pauseX, pauseY, 30, 0x333333, 0.6)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100);
    const pauseTxt = this.scene.add
      .text(pauseX, pauseY, "||", { fontSize: "24px", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    // Edit HUD Button
    const editBtn = this.scene.add
      .circle(pauseX + 70, pauseY, 30, 0x4a69bd, 0.6)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100);
      
    const editTxt = this.scene.add
      .text(pauseX + 70, pauseY, "HUD", { fontSize: "16px", fontStyle: "bold", color: "#fff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
      
    this.editHudTextObj = this.scene.add.text(this.scene.cameras.main.width / 2, 100, "HUD EDIT MODE\nDrag buttons to move\nClick HUD button to save", {
        fontSize: "24px",
        color: "#fffc00",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 4,
        align: "center"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(105).setVisible(false);

    editBtn.on("pointerdown", () => {
      this.isEditingHUD = !this.isEditingHUD;
      editBtn.setAlpha(this.isEditingHUD ? 1 : 0.6);
      if (this.editHudTextObj) this.editHudTextObj.setVisible(this.isEditingHUD);
    });

    // Toggle HUD Button
    const toggleBtn = this.scene.add
      .circle(pauseX + 140, pauseY, 30, 0x9b59b6, 0.6)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100);
      
    const toggleTxt = this.scene.add
      .text(pauseX + 140, pauseY, "VIS", { fontSize: "16px", fontStyle: "bold", color: "#fff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    let hudVisible = true;
    toggleBtn.on("pointerdown", () => {
      hudVisible = !hudVisible;
      toggleBtn.setAlpha(hudVisible ? 0.6 : 1);
      
      if (this.scene.battleUI) {
        if (this.scene.battleUI.p1HudContainer) this.scene.battleUI.p1HudContainer.setVisible(hudVisible);
        if (this.scene.battleUI.p2HudContainer) this.scene.battleUI.p2HudContainer.setVisible(hudVisible);
      }
    });

    this.mobileControls.push(pauseBtn, pauseTxt, editBtn, editTxt, toggleBtn, toggleTxt, this.editHudTextObj);

    pauseBtn.on("pointerdown", () => {
      pauseBtn.setAlpha(0.9);
      if (this.scene.cache.audio.exists("sfx_select"))
        this.scene.sound.play("sfx_select");

      if (this.scene.gameState.gameMode === "online_pvp") {
        this.scene.scene.launch("PauseScene", { online: true });
      } else {
        this.scene.scene.pause();
        this.scene.scene.launch("PauseScene", { online: false });
      }
    });

    pauseBtn.on("pointerup", () => pauseBtn.setAlpha(0.6));
    pauseBtn.on("pointerout", () => pauseBtn.setAlpha(0.6));
  }

  public destroy() {
    if (this.mobileControls && this.mobileControls.length > 0) {
      this.mobileControls.forEach((ctrl) => {
        try {
          ctrl.destroy();
        } catch (e) {}
      });
      this.mobileControls = [];
    }
    if (this.editHudTextObj) {
      try {
        this.editHudTextObj.destroy();
      } catch (e) {}
      this.editHudTextObj = null;
    }
  }
}
