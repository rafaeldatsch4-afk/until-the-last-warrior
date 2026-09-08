import { Responsive } from "../utils/Responsive";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";
import Phaser from "phaser";
import { MobileButtonInput, buttonsOverlap, safeButtonLayout } from "../utils/MobileButtonInput";

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
  updateJoystickPositionFn: ((p: Phaser.Input.Pointer) => void) | null = null;
  releaseJoystickFn: ((p?: Phaser.Input.Pointer) => void) | null = null;
  enableJoyDragFn: ((enable: boolean) => void) | null = null;

  private mobileButtons = new MobileButtonInput();
  private mobileCleanup: (() => void)[] = [];

  private listenMobile(emitter: Phaser.Events.EventEmitter, event: string, handler: (...args: any[]) => void) {
    emitter.on(event, handler);
    this.mobileCleanup.push(() => emitter.off(event, handler));
  }

  private resetMobile = () => {
    this.mobileButtons.reset();
    this.releaseJoystickFn?.();
    this.mobileP1Defend = this.mobileP1Charge = this.mobileP1Special = false;
    this.mobileP1SpecialJustUp = false;
    this.mobileP1Dash = 0;
    this.mobileP1Attack = this.mobileP1KiBlast = this.mobileP1Transform = false;
    this.scene.p1AttackBuffer = this.scene.p1KiBlastBuffer = this.scene.p1TransformBuffer = 0;
  };

  constructor(scene: BattleScene) {
    this.scene = scene;
  }

  public update() {
    this.mobileButtons.reconcile(id => !!this.scene.input.manager.pointers.find(p => p.id === id)?.isDown);
    if (this.mobileJoystickPointerId !== null) {
      const activePtr = (this.scene.input.manager as any)?.pointers?.find(
        (p: any) => p.id === this.mobileJoystickPointerId
      );
      if (!activePtr || !activePtr.isDown) {
        if (this.releaseJoystickFn) {
          this.releaseJoystickFn();
        }
      } else if (this.updateJoystickPositionFn) {
        this.updateJoystickPositionFn(activePtr);
      }
    }
  }

  // --- Abstraction Layer ---
  public checkActionDown(action: InputAction, isPlayer1: boolean): boolean {
    if (isPlayer1) {
      const vx = this.mobileJoystickVector.x;
      const vy = this.mobileJoystickVector.y;
      switch (action) {
        case "defend": return this.keys.p1_defend.isDown || this.mobileP1Defend;
        case "charge": return this.keys.p1_charge.isDown || this.mobileP1Charge;
        case "left": return this.keys.p1_left.isDown || vx < -0.22;
        case "right": return this.keys.p1_right.isDown || vx > 0.22;
        case "up": {
          // Jump triggers smoothly when stick is pushed up
          const isJoyUp = vy < -0.45 && Math.abs(vx) < 0.7;
          return this.keys.p1_up.isDown || isJoyUp;
        }
        case "down": {
          const isJoyDown = vy > 0.45 && Math.abs(vx) < 0.7;
          return this.keys.p1_down.isDown || isJoyDown;
        }
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

    const buttonLayouts: { group: Phaser.GameObjects.Container; radius: number; defaultX: number; defaultY: number; saved: unknown }[] = [];
    const finishPointer = (pointer: Phaser.Input.Pointer) => {
      this.mobileButtons.release(pointer.id, pointer.event?.type === "touchcancel");
      this.releaseJoystickFn?.(pointer);
    };
    this.listenMobile(this.scene.input, "pointerup", finishPointer);
    this.listenMobile(this.scene.input, "pointerupoutside", finishPointer);
    this.listenMobile(this.scene.events, "pause", this.resetMobile);
    this.listenMobile(this.scene.events, "sleep", this.resetMobile);
    this.listenMobile(this.scene.game.events, "blur", this.resetMobile);
    const visibility = () => { if (document.hidden) this.resetMobile(); };
    document.addEventListener("visibilitychange", visibility);
    this.mobileCleanup.push(() => document.removeEventListener("visibilitychange", visibility));

    const createBtn = (
      defaultX: number,
      defaultY: number,
      text: string,
      color: number,
      radius: number,
      onDown: () => void,
      onUp?: () => void,
    ) => {
      let saved: unknown;
      try { saved = JSON.parse(localStorage.getItem(`hudPos_${text}`) || "null"); } catch {}
      const x = defaultX;
      const y = defaultY;
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

      buttonLayouts.push({ group: btnGroup, radius, defaultX, defaultY, saved });
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

      const release = (cancelled: boolean) => {
        if (!isPressed) return;
        isPressed = false;
        outerBtn.setAlpha(0.4);
        outerBtn.setScale(1);
        innerBtn.setScale(1);
        txt.setScale(1);
        if (onUp) onUp();
        // Cancelling SPC must not synthesize its release-to-fire action.
        if (cancelled && text === "SPC") this.mobileP1SpecialJustUp = false;
        if (cancelled && text === "ATK") { this.mobileP1Attack = false; this.scene.p1AttackBuffer = 0; }
        if (cancelled && text === "KI") { this.mobileP1KiBlast = false; this.scene.p1KiBlastBuffer = 0; }
        if (cancelled && text === "TRN") { this.mobileP1Transform = false; this.scene.p1TransformBuffer = 0; }
        if (cancelled && text === "DSH") this.mobileP1Dash = 0;
      };

      const circleContains = (c: Phaser.Geom.Circle, x: number, y: number) => {
        if (c.radius <= 0) return false;
        const dx = c.x - x;
        const dy = c.y - y;
        return dx * dx + dy * dy <= c.radius * c.radius;
      };

      const hitArea = new Phaser.Geom.Circle(0, 0, radius);
      btnGroup.setInteractive(hitArea, circleContains);
      this.scene.input.setDraggable(btnGroup, false);
      this.mobileButtons.register(text, press, release);
      let dragStart = { x, y };
      btnGroup.on('dragstart', () => { dragStart = { x: btnGroup.x, y: btnGroup.y }; });

      btnGroup.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (!this.isEditingHUD) return;
        btnGroup.x = dragX;
        btnGroup.y = dragY;
      });
      
      btnGroup.on('dragend', () => {
        if (!this.isEditingHUD) return;
        const candidate = { x: btnGroup.x, y: btnGroup.y, radius };
        if (buttonLayouts.some(other => other.group !== btnGroup && buttonsOverlap(candidate, { x: other.group.x, y: other.group.y, radius: other.radius }))) {
          btnGroup.setPosition(dragStart.x, dragStart.y);
        }
        localStorage.setItem(`hudPos_${text}`, JSON.stringify({ x: btnGroup.x, y: btnGroup.y }));
      });

      btnGroup.on("pointerdown", (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        if (this.isEditingHUD || this.mobileJoystickPointerId === pointer.id) return;
        this.mobileButtons.press(pointer.id, text);
        // One touch must not also start the floating joystick or another button.
        event.stopPropagation();
      });
      // Release globally by owner, even outside the original button/canvas.
      // pointerout from another finger must never release a held action.

      return btnGroup;
    };

    // --- Virtual Joystick ---
    const joyRadius = 60 * dpadScale;
    const joyThumbRadius = 26 * dpadScale;
    const maxDist = 45 * dpadScale;
    const safeMargin = 16;

    // Strict boundary limits keeping the joystick 100% inside visible screen area
    const minJoyX = visible.left + joyRadius + safeMargin;
    const maxJoyX = Math.min(visible.centerX - 50, visible.left + 240);
    const minJoyY = Math.max(visible.centerY + 30, visible.bottom - 220);
    const maxJoyY = visible.bottom - joyRadius - safeMargin;

    let defaultJoyX = minJoyX + 10;
    let defaultJoyY = maxJoyY - 10;

    // Check localStorage for saved joystick position, strictly clamped to safe screen bounds
    const savedJoy = localStorage.getItem(`hudPos_JOYSTICK`);
    if (savedJoy) {
      try {
        const parsed = JSON.parse(savedJoy);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          defaultJoyX = Phaser.Math.Clamp(parsed.x, minJoyX, maxJoyX);
          defaultJoyY = Phaser.Math.Clamp(parsed.y, minJoyY, maxJoyY);
        }
      } catch (e) {}
    } else if (cfg?.dpadPos) {
      defaultJoyX = Phaser.Math.Clamp(cfg.dpadPos.x, minJoyX, maxJoyX);
      defaultJoyY = Phaser.Math.Clamp(cfg.dpadPos.y, minJoyY, maxJoyY);
    }

    let joyRootX = defaultJoyX;
    let joyRootY = defaultJoyY;

    const joyContainer = this.scene.add
      .container(joyRootX, joyRootY)
      .setScrollFactor(0)
      .setDepth(100);

    const joyBase = this.scene.add
      .circle(0, 0, joyRadius, 0x071026, 0.45)
      .setStrokeStyle(2.5, 0x38bdf8, 0.5);

    const joyBaseInner = this.scene.add
      .circle(0, 0, joyRadius * 0.45, 0x0f172a, 0.25)
      .setStrokeStyle(1.5, 0xffffff, 0.2);

    const joyThumb = this.scene.add
      .circle(0, 0, joyThumbRadius, 0xffffff, 0.85)
      .setStrokeStyle(2, 0x0284c7, 0.7);

    joyContainer.add([joyBase, joyBaseInner, joyThumb]);
    joyContainer.setScale(dpadScale);
    joyBase.setAlpha(opacity);
    this.mobileControls.push(joyContainer);

    if (this.scene.battleUI?.uiContainer) {
      this.scene.battleUI?.uiContainer.add(joyContainer);
    }

    // Draggable in HUD edit mode ONLY
    const joyCircleContains = (c: Phaser.Geom.Circle, x: number, y: number) => {
      if (c.radius <= 0) return false;
      const dx = c.x - x;
      const dy = c.y - y;
      return dx * dx + dy * dy <= c.radius * c.radius;
    };

    joyContainer.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (!this.isEditingHUD) return;
      joyContainer.x = Phaser.Math.Clamp(dragX, minJoyX, maxJoyX);
      joyContainer.y = Phaser.Math.Clamp(dragY, minJoyY, maxJoyY);
    });

    joyContainer.on("dragend", () => {
      if (!this.isEditingHUD) return;
      defaultJoyX = joyContainer.x;
      defaultJoyY = joyContainer.y;
      localStorage.setItem(`hudPos_JOYSTICK`, JSON.stringify({ x: joyContainer.x, y: joyContainer.y }));
    });

    this.enableJoyDragFn = (enable: boolean) => {
      if (enable) {
        joyContainer.setInteractive(new Phaser.Geom.Circle(0, 0, joyRadius), joyCircleContains);
        this.scene.input.setDraggable(joyContainer);
      } else {
        joyContainer.disableInteractive();
      }
    };
    this.enableJoyDragFn(false);

    const getLocalPnt = (pointer: Phaser.Input.Pointer) => {
      if (this.scene.battleUI?.uiContainer) {
        const uc = this.scene.battleUI.uiContainer;
        return {
          x: (pointer.x - uc.x) / uc.scaleX,
          y: (pointer.y - uc.y) / uc.scaleY,
        };
      }
      return { x: pointer.x, y: pointer.y };
    };

    const updateJoystickWithPointer = (pointer: Phaser.Input.Pointer) => {
      if (this.mobileJoystickPointerId !== pointer.id) return;

      const loc = getLocalPnt(pointer);

      let dx = loc.x - joyRootX;
      let dy = loc.y - joyRootY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      joyThumb.setPosition(dx, dy);

      // Deadzone is 2.5px to filter micro-jitter, followed by smooth normalized vector
      this.mobileJoystickVector = {
        x: dist > 2.5 ? dx / maxDist : 0,
        y: dist > 2.5 ? dy / maxDist : 0,
      };
    };
    this.updateJoystickPositionFn = updateJoystickWithPointer;

    const releaseJoystick = (pointer?: Phaser.Input.Pointer) => {
      if (!pointer || this.mobileJoystickPointerId === pointer.id) {
        this.mobileJoystickPointerId = null;

        joyRootX = defaultJoyX;
        joyRootY = defaultJoyY;
        joyContainer.setPosition(joyRootX, joyRootY);

        joyBase.setAlpha(opacity);
        joyThumb.setPosition(0, 0);
        this.mobileJoystickVector = { x: 0, y: 0 };
      }
    };
    this.releaseJoystickFn = releaseJoystick;

    this.listenMobile(this.scene.input, "pointerdown", (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (this.isEditingHUD) return;

      // Do not capture if user clicked an action button
      if (currentlyOver && currentlyOver.length > 0) {
        const hitOtherButton = currentlyOver.some((obj: any) => {
          if (obj === joyContainer || (joyContainer.list && joyContainer.list.includes(obj))) {
            return false;
          }
          return true;
        });
        if (hitOtherButton) return;
      }

      const loc = getLocalPnt(pointer);

      // Move zone: left 50% of the screen and below 35% height
      const inMoveZone = (loc.x < gw * 0.5 && loc.y > gh * 0.35);
      const distToDefault = Phaser.Math.Distance.Between(loc.x, loc.y, defaultJoyX, defaultJoyY);
      const isNearJoy = distToDefault <= joyRadius * 1.5;

      if (inMoveZone || isNearJoy) {
        if (this.mobileJoystickPointerId === null) {
          this.mobileJoystickPointerId = pointer.id;

          if (isNearJoy) {
            // Keep home base stationary when touching near it for instant response
            joyRootX = defaultJoyX;
            joyRootY = defaultJoyY;
          } else {
            // Floating joystick: anchor near touch within safe screen bounds
            joyRootX = Phaser.Math.Clamp(loc.x, minJoyX, maxJoyX);
            joyRootY = Phaser.Math.Clamp(loc.y, minJoyY, maxJoyY);
          }

          joyContainer.setPosition(joyRootX, joyRootY);
          joyBase.setAlpha(Math.min(0.9, opacity * 1.6));

          updateJoystickWithPointer(pointer);
        }
      }
    });

    this.listenMobile(this.scene.input, "pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.mobileJoystickPointerId === pointer.id) {
        updateJoystickWithPointer(pointer);
      }
    });

    this.listenMobile(this.scene.input, "gameout", () => {
      if (this.mobileJoystickPointerId !== null) {
        const activePtr = (this.scene.input.manager as any)?.pointers?.find(
          (p: any) => p.id === this.mobileJoystickPointerId
        );
        if (!activePtr || !activePtr.isDown) {
          releaseJoystick();
        }
      }
    });
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
        const isLeft = this.checkActionDown("left", true);
        const isRight = this.checkActionDown("right", true);
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

    const positions = safeButtonLayout(
      buttonLayouts.map(b => ({ x: b.defaultX, y: b.defaultY, radius: b.radius })),
      buttonLayouts.map(b => b.saved),
    );
    buttonLayouts.forEach((b, i) => b.group.setPosition(positions[i].x, positions[i].y));

    // --- Top Mobile Buttons (Pause, HUD Edit, HUD Visibility) ---
    const bounds = ResponsiveUtils.getSafeBounds(this.scene);
    const topBtnY = Math.max(26, bounds.top + 16);
    const topCenterX = bounds.centerX;
    const btnSpacing = 82; // Ample spacing to ensure zero touch overlapping
    const btnW = 68;
    const btnH = 40;
    const btnRadius = 10;

    // Helper to create top mobile button with dedicated interactive hit zone & instant touch response
    const createTopBtn = (
      x: number,
      y: number,
      label: string,
      bgColor: number,
      borderColor: number,
      fontSize: string = "13px",
      onClick: () => void
    ) => {
      const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(250);
      const bg = this.scene.add.graphics();
      
      const drawState = (isActive: boolean, isPressed: boolean = false) => {
        bg.clear();
        // Drop shadow for crisp contrast over any background/effects
        bg.fillStyle(0x000000, 0.7);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2 + 2, btnW, btnH, btnRadius);
        
        // Button surface
        const currentBg = isActive ? 0x16a34a : (isPressed ? 0x0f172a : bgColor);
        const currentBorder = isActive ? 0x86efac : (isPressed ? 0xffffff : borderColor);
        bg.fillStyle(currentBg, 0.95);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnRadius);
        bg.lineStyle(2, currentBorder, 1.0);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, btnRadius);
      };
      drawState(false, false);

      const txt = this.scene.add.text(0, 0, label, {
        fontSize,
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
      }).setOrigin(0.5);

      // Dedicated interactive hit zone covering full button + generous touch padding (76x52px)
      const hitZone = this.scene.add
        .zone(0, 0, btnW + 12, btnH + 16)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      container.add([bg, txt, hitZone]);

      let isPressed = false;
      let activeState = false;

      // Immediate trigger on pointerdown for instant response on mobile touch
      hitZone.on("pointerdown", () => {
        isPressed = true;
        drawState(activeState, true);
        container.setScale(0.92);

        if (this.scene.cache.audio.exists("sfx_select")) {
          this.scene.sound.play("sfx_select", { volume: 0.8 });
        }
        
        onClick();
      });

      hitZone.on("pointerup", () => {
        if (isPressed) {
          isPressed = false;
          drawState(activeState, false);
          container.setScale(1.0);
        }
      });

      hitZone.on("pointerout", () => {
        if (isPressed) {
          isPressed = false;
          drawState(activeState, false);
          container.setScale(1.0);
        }
      });

      const setActive = (active: boolean) => {
        activeState = active;
        drawState(activeState, false);
      };

      const setLabel = (newLabel: string) => {
        txt.setText(newLabel);
      };

      return { container, bg, txt, hitZone, setActive, setLabel };
    };

    // 1. Pause Button (Left of center)
    const pauseBtnObj = createTopBtn(
      topCenterX - btnSpacing,
      topBtnY,
      "⏸ PAUSA",
      0x1e293b,
      0x64748b,
      "12px",
      () => {
        this.resetMobile();
        if (this.scene.gameState.gameMode === "online_pvp") {
          this.scene.scene.launch("PauseScene", { online: true });
        } else {
          this.scene.scene.pause();
          this.scene.scene.launch("PauseScene", { online: false });
        }
      }
    );

    // 2. HUD Edit Button (Center)
    let isEditing = false;
    const editBtnObj = createTopBtn(
      topCenterX,
      topBtnY,
      "🛠 HUD",
      0x1e3a8a,
      0x38bdf8,
      "12px",
      () => {
        this.resetMobile();
        isEditing = !isEditing;
        buttonLayouts.forEach(b => this.scene.input.setDraggable(b.group, isEditing));
        this.isEditingHUD = isEditing;
        if (this.enableJoyDragFn) this.enableJoyDragFn(isEditing);
        editBtnObj.setActive(isEditing);
        editBtnObj.setLabel(isEditing ? "💾 SALVAR" : "🛠 HUD");
        if (this.scene.battleUI?.setHudEditMode) {
          this.scene.battleUI.setHudEditMode(isEditing);
        }
        if (this.editHudTextObj) this.editHudTextObj.setVisible(isEditing);
      }
    );

    // 3. Toggle HUD Button (Right of center - Tela Livre)
    let hudVisible = true;
    const toggleBtnObj = createTopBtn(
      topCenterX + btnSpacing,
      topBtnY,
      "👁 HUD",
      0x581c87,
      0xc084fc,
      "12px",
      () => {
        hudVisible = !hudVisible;
        toggleBtnObj.setActive(!hudVisible);
        toggleBtnObj.setLabel(hudVisible ? "👁 HUD" : "🚫 HUD");
        if (this.scene.battleUI) {
          if (this.scene.battleUI.p1HudContainer) this.scene.battleUI.p1HudContainer.setVisible(hudVisible);
          if (this.scene.battleUI.p2HudContainer) this.scene.battleUI.p2HudContainer.setVisible(hudVisible);
        }
      }
    );

    this.editHudTextObj = this.scene.add.text(topCenterX, topBtnY + 46, "MODO DE EDIÇÃO DO HUD\nArraste os botões para reposicionar\nToque em HUD para salvar", {
        fontSize: "15px",
        color: "#fffc00",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 3.5,
        align: "center",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(105).setVisible(false);

    this.mobileControls.push(
      pauseBtnObj.container,
      editBtnObj.container,
      toggleBtnObj.container,
      this.editHudTextObj
    );
  }

  public destroy() {
    if (this.mobileCleanup.length) this.resetMobile();
    this.mobileCleanup.splice(0).forEach(cleanup => cleanup());
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
