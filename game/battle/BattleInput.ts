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
  p2_defend: Phaser.Input.Keyboard.Key;
  p2_special: Phaser.Input.Keyboard.Key;
  p2_transform: Phaser.Input.Keyboard.Key;

  pause: Phaser.Input.Keyboard.Key;
}

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
  mobileP1SpecialJustUp = false;

  constructor(scene: BattleScene) {
    this.scene = scene;
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
      p1_attack: Phaser.Input.Keyboard.KeyCodes.J,
      p1_kiblast: Phaser.Input.Keyboard.KeyCodes.K,
      p1_defend: Phaser.Input.Keyboard.KeyCodes.U,
      p1_charge: Phaser.Input.Keyboard.KeyCodes.O,
      p1_special: Phaser.Input.Keyboard.KeyCodes.L,
      p1_transform: Phaser.Input.Keyboard.KeyCodes.I,
      
      p2_up: Phaser.Input.Keyboard.KeyCodes.UP,
      p2_down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      p2_left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      p2_right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      p2_attack: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
      p2_kiblast: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
      p2_defend: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
      p2_special: Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE,
      p2_transform: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FIVE,

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
    const isMobile = this.scene.sys.game.device.input.touch || 
                     (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
                     
    if (!isMobile) return;

    const gw = this.scene.cameras.main.width;
    const gh = this.scene.cameras.main.height;

    const createBtn = (
      x: number,
      y: number,
      text: string,
      color: number,
      radius: number,
      onDown: () => void,
      onUp?: () => void,
    ) => {
      // Modern Glassy Button Setup
      const btnGroup = this.scene.add.container(x, y).setScrollFactor(0).setDepth(100);
      
      const outerBtn = this.scene.add.circle(0, 0, radius, color, 0.4).setStrokeStyle(3, 0xffffff, 0.5);
      const innerBtn = this.scene.add.circle(0, 0, radius * 0.85, 0x000000, 0.3);
      
      const txt = this.scene.add.text(0, 0, text, {
        fontFamily: "Impact, sans-serif",
        fontSize: radius > 40 ? "24px" : "18px",
        color: "#ffffff",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(0.5);

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

      const hitArea = new Phaser.Geom.Circle(0, 0, radius * 1.5);
      btnGroup.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
      
      btnGroup.on("pointerdown", () => {
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
    const defaultJoyX = 140;
    const defaultJoyY = gh - 100;
    let joyRootX = defaultJoyX;
    let joyRootY = defaultJoyY;
    
    const joyContainer = this.scene.add.container(joyRootX, joyRootY).setScrollFactor(0).setDepth(100);
    const joyBase = this.scene.add.circle(0, 0, 75, 0x000000, 0.4).setStrokeStyle(3, 0xffffff, 0.3);
    const joyThumb = this.scene.add.circle(0, 0, 35, 0xffffff, 0.6).setStrokeStyle(2, 0x000000, 0.5);
    
    joyContainer.add([joyBase, joyThumb]);
    this.mobileControls.push(joyContainer);
    
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

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const loc = getLocalPnt(pointer);
        // Only trigger joystick if the pointer is on the left half of the screen
        if (loc.x < gw / 2 && loc.y > gh / 2 - 50) {
            if (this.mobileJoystickPointerId === null) {
                this.mobileJoystickPointerId = pointer.id;
                
                // Standard Floating Joystick Behavior
                joyRootX = loc.x;
                joyRootY = loc.y;
                joyContainer.setPosition(joyRootX, joyRootY);
                joyBase.setAlpha(0.7);
                
                handleJoystick(pointer);
            }
        }
    });

    this.scene.input.on('pointermove', handleJoystick);

    const releaseJoystick = (pointer: Phaser.Input.Pointer) => {
        if (this.mobileJoystickPointerId === pointer.id) {
            this.mobileJoystickPointerId = null;
            
            joyRootX = defaultJoyX;
            joyRootY = defaultJoyY;
            joyContainer.setPosition(joyRootX, joyRootY);
            
            joyBase.setAlpha(0.4);
            joyThumb.setPosition(0, 0);
            this.mobileJoystickVector = { x: 0, y: 0 };
            
            this.keys.p1_up.isDown = false;
            this.keys.p1_left.isDown = false;
            this.keys.p1_right.isDown = false;
        }
    };

    this.scene.input.on('pointerup', releaseJoystick);
    this.scene.input.on('pointerout', releaseJoystick);
    // --- End Virtual Joystick ---

    // Right side (Attacks)
    createBtn(gw - 100, gh - 100, "ATK", 0xe74c3c, 60, () => {
      this.mobileP1Attack = true;
      this.scene.p1AttackBuffer = this.scene.BUFFER_MS;
    });

    // SPC (Special)
    createBtn(
      gw - 100,
      gh - 240,
      "SPC",
      0xf1c40f,
      45,
      () => {
        this.mobileP1Special = true;
      },
      () => {
        this.mobileP1Special = false;
        this.mobileP1SpecialJustUp = true;
      },
    );

    // DEF/CHARGE
    createBtn(
      gw - 240,
      gh - 100,
      "DEF/\nCHG",
      0x3498db,
      45,
      () => {
        this.mobileP1Defend = true;
      },
      () => {
        this.mobileP1Defend = false;
      },
    );

    // KI BLAST
    createBtn(gw - 240, gh - 240, "KI", 0x00ffff, 45, () => {
      this.mobileP1KiBlast = true;
      this.scene.p1KiBlastBuffer = this.scene.BUFFER_MS;
    });

    // TRN (Transform)
    if (this.scene.playerData.transformAvailable) {
      this.scene.trnBtnGroup = createBtn(140, 200, "TRN", 0x9b59b6, 50, () => {
        this.mobileP1Transform = true;
        this.scene.p1TransformBuffer = this.scene.BUFFER_MS;
      });
    }

    // Pause Button (Top Center)
    const pauseBtn = this.scene.add
      .circle(480, 40, 30, 0x333333, 0.6)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100);
    const pauseTxt = this.scene.add
      .text(480, 40, "||", { fontSize: "24px", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.mobileControls.push(pauseBtn, pauseTxt);

    pauseBtn.on("pointerdown", () => {
      pauseBtn.setAlpha(0.9);
      if (this.scene.cache.audio.exists("sfx_select")) this.scene.sound.play("sfx_select");
      
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
}
