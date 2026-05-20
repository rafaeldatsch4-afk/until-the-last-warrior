import Phaser from "phaser";
import { CharacterData, GameState } from "../types";
import { getFighter } from '../characters/FighterRegistry';

export default class BattleScene extends Phaser.Scene {
  declare sound:
    | Phaser.Sound.NoAudioSoundManager
    | Phaser.Sound.HTML5AudioSoundManager
    | Phaser.Sound.WebAudioSoundManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare registry: Phaser.Data.DataManager;
  declare time: Phaser.Time.Clock;
  declare input: Phaser.Input.InputPlugin;

  // Mobile Controls Flags
  mobileP1Attack = false;
  mobileP1KiBlast = false;
  mobileP1Defend = false;
  mobileP1Charge = false;
  mobileP1Special = false;
  mobileP1Transform = false;
  mobileP1SpecialJustUp = false;
  mobileJoystickVector = { x: 0, y: 0 };
  mobileJoystickPointerId: number | null = null;
  private mobileControls: Phaser.GameObjects.GameObject[] = [];
  private trnBtnGroup?: Phaser.GameObjects.Container;
  declare tweens: Phaser.Tweens.TweenManager;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare children: Phaser.GameObjects.DisplayList;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare anims: Phaser.Animations.AnimationManager;
  declare cache: Phaser.Cache.CacheManager;
  declare textures: Phaser.Textures.TextureManager;
  declare make: Phaser.GameObjects.GameObjectCreator;
  declare events: Phaser.Events.EventEmitter;

  private player!: Phaser.GameObjects.Sprite;
  private enemy!: Phaser.GameObjects.Sprite;

  private playerData!: CharacterData;
  private enemyData!: CharacterData;

  private playerHp: number = 0;
  private enemyHp: number = 0;
  private playerKi: number = 0;
  private enemyKi: number = 0;

  private playerTransformLevel: number = 0;
  private enemyTransformLevel: number = 0;
  private playerDefending: boolean = false;
  private enemyDefending: boolean = false;

  // Action Flags to prevent spamming
  private p1ActionActive: boolean = false;
  private isP1Jumping: boolean = false;
  private p2ActionActive: boolean = false;
  private isP2Jumping: boolean = false;
  private p2BufferedAttack: boolean = false;
  private p2BufferedKiBlast: boolean = false;
  private p2BufferedTransform: boolean = false;

  private p1AttackBuffer: number = 0;
  private p1KiBlastBuffer: number = 0;
  private p1TransformBuffer: number = 0;
  private p2AttackBuffer: number = 0;
  private p2KiBlastBuffer: number = 0;
  private p2TransformBuffer: number = 0;
  private readonly BUFFER_MS = 250;

  private p1Shadow!: Phaser.GameObjects.Ellipse;
  private p2Shadow!: Phaser.GameObjects.Ellipse;
  private p1Aura!: Phaser.GameObjects.Shape;
  private p2Aura!: Phaser.GameObjects.Shape;
  private p1Shield!: Phaser.GameObjects.Arc;
  private p2Shield!: Phaser.GameObjects.Arc;

  private p1SpecialHoldTime: number = 0;
  private p2SpecialHoldTime: number = 0;
  private readonly SUPER_THRESHOLD_MS = 600; // 0.6 second hold for super
  private p1ChargeIndicator!: Phaser.GameObjects.Arc;
  private p2ChargeIndicator!: Phaser.GameObjects.Arc;

  private p1HpBar!: Phaser.GameObjects.Rectangle;
  private p2HpBar!: Phaser.GameObjects.Rectangle;
  private p1KiBar!: Phaser.GameObjects.Rectangle;
  private p2KiBar!: Phaser.GameObjects.Rectangle;
  private uiContainer!: Phaser.GameObjects.Container;
  private logText!: Phaser.GameObjects.Text;

  private p1ComboCount: number = 0;
  private p1LastAttackTime: number = 0;
  private p2ComboCount: number = 0;
  private p2LastAttackTime: number = 0;

  private isBattleOver: boolean = false;
  private turnTimer?: Phaser.Time.TimerEvent;
  private regenTimer?: Phaser.Time.TimerEvent;
  private aiMoveDir: number = 0;
  private keys!: any;
  private gameState!: GameState;

  // Position tuned for 64px tall sprites (scaled 3x)
  // Center Y at 280 ensures feet land around Y=460 (Ground Level)
  private readonly p1StartPos = { x: 200, y: 280 };
  private readonly p2StartPos = { x: 760, y: 280 };

  constructor() {
    super("BattleScene");
  }

  create() {
    this.gameState = this.registry.get("gameState") as GameState;
    this.isBattleOver = false;
    this.input.addPointer(3); // Support up to 4 touches (1 default + 3 added)
    this.p1ActionActive = false;
    this.p2ActionActive = false;
    this.p2BufferedAttack = false;
    this.p2BufferedKiBlast = false;
    this.p2BufferedTransform = false;
    this.p1AttackBuffer = 0;
    this.p1KiBlastBuffer = 0;
    this.p1TransformBuffer = 0;
    this.p2AttackBuffer = 0;
    this.p2KiBlastBuffer = 0;
    this.p2TransformBuffer = 0;
    this.p1SpecialHoldTime = 0;
    this.p2SpecialHoldTime = 0;

    // Reset transform levels to fix auto-transformation bug on rematch
    this.playerTransformLevel = 0;
    this.enemyTransformLevel = 0;
    this.playerKi = 0;
    this.enemyKi = 0;
    this.p1ComboCount = 0;
    this.p2ComboCount = 0;

    const chars = this.gameState.characters;
    this.playerData =
      chars.find((c) => c.id === this.gameState.p1CharacterId) || chars[0];

    if (
      this.gameState.gameMode === "local_pvp" ||
      this.gameState.gameMode === "tournament"
    ) {
      this.enemyData =
        chars.find((c) => c.id === this.gameState.p2CharacterId) || chars[1];
    } else {
      const available = chars.filter((c) => c.id !== this.playerData.id);
      this.enemyData =
        available[Phaser.Math.Between(0, available.length - 1)] || chars[1];
    }

    // Set arena to back depth
    const arenas = ["arena", "arena_namek", "arena_city", "arena_tournament", "arena_ice", "arena_lava", "arena_desert", "arena_dark"];
    const randomArena = Phaser.Utils.Array.GetRandom(arenas);
    const mapWidth = 5000;
    const bgImage = this.add
      .image(mapWidth/2, 270, randomArena)
      .setDisplaySize(mapWidth * 1.5, 540 * 2.5) // Make it large enough so edges are not seen when zoomed out
      .setTint(0x888888)
      .setDepth(-10);
      
    // Intelligently desaturate and adjust only the background so characters remain colorful
    if (bgImage.postFX) {
        const bgMatrix = bgImage.postFX.addColorMatrix();
        // Lower saturation of the background by 40% to stop eye burn
        bgMatrix.saturate(-0.4); 
        // Slightly dim it
        bgMatrix.brightness(0.8);
        // Subtle blur for depth of field
        bgImage.postFX.addBlur(0.3, 0.3, 0.3, 1); 
    }
      
    // Set bounds such that camera can zoom out, removing restrictive Y bounds
    this.cameras.main.setBounds(-500, -500, mapWidth + 1000, 1500);
      
    // Cinematic Camera Effects - keep very subtle to NOT alter characters
    if (this.cameras.main.postFX) {
        // Add a cinematic vignette for dramatic effect
        this.cameras.main.postFX.addVignette(0.5, 0.5, 0.9, 0.3);
    }

    if (this.cache.audio.exists("bgm_menu")) this.sound.stopByKey("bgm_menu");
    if (this.cache.audio.exists("bgm_battle")) {
      this.sound.stopByKey("bgm_battle");
      this.sound.play("bgm_battle", { loop: true, volume: 0.4 });
    }

    this.createFighterSprites();
    this.playerHp = this.playerData.maxHp;
    this.enemyHp = this.enemyData.maxHp;
    this.playerKi = 0;
    this.enemyKi = 0;

    this.createUI();
    this.createInputs();

    this.time.delayedCall(1000, () => {
      if (!this.scene.isActive()) return;
      this.log("FIGHT START!");
      if (
        this.gameState.gameMode !== "local_pvp" &&
        this.gameState.gameMode !== "training"
      )
        this.startAILoop();
    });

    // Passive Ki regeneration
    this.regenTimer = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.isBattleOver || !this.scene.isActive()) return;
        this.modifyKi(true, 1);
        this.modifyKi(false, 1);
      },
    });

    // Clean up when scene shuts down
    this.events.on("shutdown", () => {
      if (this.turnTimer) this.turnTimer.remove();
      if (this.regenTimer) this.regenTimer.remove();
      this.sound.stopByKey("bgm_battle");
      this.input.keyboard?.removeAllKeys();
      this.input.keyboard?.removeAllListeners();
    });
  }

  update(time: number, delta: number) {
    if (this.isBattleOver || !this.keys || !this.scene.isActive()) return;
    
    // Auto-heal character positions (prevent getting stuck outside bounds)
    const bounds = { minX: 50, maxX: 1950, minY: 100, maxY: 440 };

    if (this.player && this.player.active && this.enemy && this.enemy.active) {
        if (!this.p1ActionActive && !this.tweens.isTweening(this.player) && !this.isP1Jumping) {
            const moveSpeed = 6;
            let isMoving = false;
            if (this.keys.p1_left.isDown || this.mobileJoystickVector.x < -0.3) {
                this.player.x -= moveSpeed;
                this.player.setFlipX(true);
                isMoving = true;
            } else if (this.keys.p1_right.isDown || this.mobileJoystickVector.x > 0.3) {
                this.player.x += moveSpeed;
                this.player.setFlipX(false);
                isMoving = true;
            } else {
                this.player.setFlipX(this.player.x > this.enemy.x);
            }
            
            if (isMoving) {
                const walkAnim = this.getAnimKey(this.playerData.key, this.playerTransformLevel, "walk");
                if (this.player.anims.currentAnim?.key !== walkAnim) {
                    this.player.play(walkAnim, true);
                }
                // Dynamic walk effect: slight tilt forward and bobbing
                this.player.setRotation(this.player.flipX ? -0.1 : 0.1);
                this.player.y = this.p1StartPos.y + Math.sin(time * 0.02) * 8;
            } else {
                const idleAnim = this.getAnimKey(this.playerData.key, this.playerTransformLevel, "idle");
                if (this.player.anims.currentAnim?.key !== idleAnim) {
                    this.player.play(idleAnim, true);
                }
                this.player.setRotation(0);
                this.player.y = Phaser.Math.Linear(this.player.y, this.p1StartPos.y, 0.2);
            }
            
            if (this.keys.p1_up.isDown && !this.isP1Jumping) {
                this.performJump(true);
            }
            
            // Cannot cross the enemy
            if (this.player.x <= this.enemy.x) {
                this.player.x = Math.min(this.player.x, this.enemy.x - 40);
                this.player.x = Math.max(this.player.x, bounds.minX);
            } else {
                this.player.x = Math.max(this.player.x, this.enemy.x + 40);
                this.player.x = Math.min(this.player.x, bounds.maxX);
            }
            this.player.y = Phaser.Math.Clamp(this.player.y, bounds.minY, bounds.maxY);
        }
    
        if (!this.p2ActionActive && !this.tweens.isTweening(this.enemy) && !this.isP2Jumping) {
            const moveSpeed = 6;
            let isMoving = false;
            let moveL = this.keys.p2_left.isDown;
            let moveR = this.keys.p2_right.isDown;

            if (this.gameState.gameMode !== "local_pvp" && this.gameState.gameMode !== "training") {
                moveL = this.aiMoveDir === -1;
                moveR = this.aiMoveDir === 1;
                
                const distToPlayer = Math.abs(this.enemy.x - this.player.x);
                if (moveL && this.enemy.x < this.player.x && distToPlayer > 600) moveL = false;
                if (moveR && this.enemy.x > this.player.x && distToPlayer > 600) moveR = false;
            }

            if (moveL) {
                this.enemy.x -= moveSpeed;
                this.enemy.setFlipX(true);
                isMoving = true;
            } else if (moveR) {
                this.enemy.x += moveSpeed;
                this.enemy.setFlipX(false);
                isMoving = true;
            } else {
                this.enemy.setFlipX(this.enemy.x > this.player.x);
            }
            
            if (isMoving) {
                const walkAnim = this.getAnimKey(this.enemyData.key, this.enemyTransformLevel, "walk");
                if (this.enemy.anims.currentAnim?.key !== walkAnim) {
                    this.enemy.play(walkAnim, true);
                }
                this.enemy.setRotation(this.enemy.flipX ? -0.1 : 0.1);
                this.enemy.y = this.p2StartPos.y + Math.sin(time * 0.02) * 8;
            } else {
                const idleAnim = this.getAnimKey(this.enemyData.key, this.enemyTransformLevel, "idle");
                if (this.enemy.anims.currentAnim?.key !== idleAnim) {
                    this.enemy.play(idleAnim, true);
                }
                this.enemy.setRotation(0);
                this.enemy.y = Phaser.Math.Linear(this.enemy.y, this.p2StartPos.y, 0.2);
            }
            
            if (this.keys.p2_up.isDown && !this.isP2Jumping) {
                this.performJump(false);
            }
            
            // Cannot cross the player
            if (this.enemy.x >= this.player.x) {
                this.enemy.x = Math.max(this.enemy.x, this.player.x + 40);
                this.enemy.x = Math.min(this.enemy.x, bounds.maxX);
            } else {
                this.enemy.x = Math.min(this.enemy.x, this.player.x - 40);
                this.enemy.x = Math.max(this.enemy.x, bounds.minX);
            }
            this.enemy.y = Phaser.Math.Clamp(this.enemy.y, bounds.minY, bounds.maxY);
        }

        const midX = (this.player.x + this.enemy.x) / 2;
        const dist = Math.abs(this.player.x - this.enemy.x);
        
        let targetZoom = 1;
        if (dist > 600) {
            targetZoom = 960 / (dist + 360);
        }
        targetZoom = Phaser.Math.Clamp(targetZoom, 0.6, 1.0);
        
        this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom, targetZoom, 0.1));
        this.cameras.main.centerOnX(Phaser.Math.Linear(this.cameras.main.midPoint.x, midX, 0.1));
        
        if (this.uiContainer) {
            this.uiContainer.setScale(1 / this.cameras.main.zoom);
            this.uiContainer.setPosition(
                (960 - 960 / this.cameras.main.zoom) / 2,
                (540 - 540 / this.cameras.main.zoom) / 2
            );
        }
    }

    // Buffer keyboard inputs with a timer
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1_attack)) { this.mobileP1Attack = true; this.p1AttackBuffer = this.BUFFER_MS; }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1_kiblast)) { this.mobileP1KiBlast = true; this.p1KiBlastBuffer = this.BUFFER_MS; }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p1_transform)) { this.mobileP1Transform = true; this.p1TransformBuffer = this.BUFFER_MS; }

    if (Phaser.Input.Keyboard.JustDown(this.keys.p2_attack)) { this.p2BufferedAttack = true; this.p2AttackBuffer = this.BUFFER_MS; }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p2_kiblast)) { this.p2BufferedKiBlast = true; this.p2KiBlastBuffer = this.BUFFER_MS; }
    if (Phaser.Input.Keyboard.JustDown(this.keys.p2_transform)) { this.p2BufferedTransform = true; this.p2TransformBuffer = this.BUFFER_MS; }

    // Decay the buffers
    if (this.p1AttackBuffer > 0) {
      this.p1AttackBuffer -= delta;
      if (this.p1AttackBuffer <= 0) this.mobileP1Attack = false;
    }
    if (this.p1KiBlastBuffer > 0) {
      this.p1KiBlastBuffer -= delta;
      if (this.p1KiBlastBuffer <= 0) this.mobileP1KiBlast = false;
    }
    if (this.p1TransformBuffer > 0) {
      this.p1TransformBuffer -= delta;
      if (this.p1TransformBuffer <= 0) this.mobileP1Transform = false;
    }

    if (this.p2AttackBuffer > 0) {
      this.p2AttackBuffer -= delta;
      if (this.p2AttackBuffer <= 0) this.p2BufferedAttack = false;
    }
    if (this.p2KiBlastBuffer > 0) {
      this.p2KiBlastBuffer -= delta;
      if (this.p2KiBlastBuffer <= 0) this.p2BufferedKiBlast = false;
    }
    if (this.p2TransformBuffer > 0) {
      this.p2TransformBuffer -= delta;
      if (this.p2TransformBuffer <= 0) this.p2BufferedTransform = false;
    }

    if (this.p1Shadow && this.player) {
      this.p1Shadow.setX(this.player.x);
      // Optional: fade slightly if they go high above the start pos
      const yDist = Math.max(0, this.p1StartPos.y - this.player.y);
      this.p1Shadow.setAlpha(Math.max(0.1, 0.5 - (yDist / 200)));
      this.p1Shadow.setScale(Math.max(0.2, 1 - (yDist / 200)));
      
      if (this.p1Aura) { this.p1Aura.setX(this.player.x); this.p1Aura.setY(this.player.y + 80); }
      if (this.p1Shield) { this.p1Shield.setX(this.player.x); this.p1Shield.setY(this.player.y + 80); }
    }
    if (this.p2Shadow && this.enemy) {
      this.p2Shadow.setX(this.enemy.x);
      const yDist = Math.max(0, this.p2StartPos.y - this.enemy.y);
      this.p2Shadow.setAlpha(Math.max(0.1, 0.5 - (yDist / 200)));
      this.p2Shadow.setScale(Math.max(0.2, 1 - (yDist / 200)));
      
      if (this.p2Aura) { this.p2Aura.setX(this.enemy.x); this.p2Aura.setY(this.enemy.y + 80); }
      if (this.p2Shield) { this.p2Shield.setX(this.enemy.x); this.p2Shield.setY(this.enemy.y + 80); }
    }

    // Keep training mode infinite HP but let them charge Ki normally
    // --- PLAYER 1 CONTROLS ---
    if (this.p1ActionActive) {
      this.stopContinuousCharge(true);
      this.playerDefending = false;
      this.p1SpecialHoldTime = 0;
      this.clearChargeIndicator(true);
      this.mobileP1SpecialJustUp = false;
    } else {
      // Defend / Charge
      if (this.keys.p1_defend.isDown || this.mobileP1Defend) {
        this.playerDefending = true;
        this.performContinuousCharge(true, delta);
        this.p1SpecialHoldTime = 0;
        this.clearChargeIndicator(true);
        
        // Anti-Ghosting: If they hold DEF, clear any buffered attacks so they don't fire when DEF is released
        this.mobileP1Attack = false;
        this.mobileP1KiBlast = false;
        this.p1AttackBuffer = 0;
        this.p1KiBlastBuffer = 0;
      } else {
        this.playerDefending = false;
        this.stopContinuousCharge(true);
      }

      if (!this.playerDefending) {
        // Attack
        if (
          Phaser.Input.Keyboard.JustDown(this.keys.p1_attack) ||
          this.mobileP1Attack
        ) {
          this.performAttack(true, "melee");
          this.mobileP1Attack = false; // Reset flag
          this.p1AttackBuffer = 0;
        }
        // Ki Blast
        else if (
          Phaser.Input.Keyboard.JustDown(this.keys.p1_kiblast) ||
          this.mobileP1KiBlast
        ) {
          this.performAttack(true, "ki");
          this.mobileP1KiBlast = false; // Reset flag
          this.p1KiBlastBuffer = 0;
        }
        // Transform
        else if (
          Phaser.Input.Keyboard.JustDown(this.keys.p1_transform) ||
          this.mobileP1Transform
        ) {
          this.performTransform(true);
          this.mobileP1Transform = false; // Reset flag
          this.p1TransformBuffer = 0;
        }

        // Special
        if (!this.p1ActionActive) {
          if (this.keys.p1_special.isDown || this.mobileP1Special) {
            this.p1SpecialHoldTime += delta;
            this.updateChargeIndicator(true, this.p1SpecialHoldTime);
          } else if (
            (this.p1SpecialHoldTime > 0 && this.mobileP1SpecialJustUp) ||
            (this.p1SpecialHoldTime > 0 && Phaser.Input.Keyboard.JustUp(this.keys.p1_special)) ||
            // Ensure a minimum tap time isn't required if they just tap it
            (Phaser.Input.Keyboard.JustUp(this.keys.p1_special) && this.p1SpecialHoldTime === 0)
          ) {
            // Fire the special
            this.performSpecial(
              true,
              this.p1SpecialHoldTime >= this.SUPER_THRESHOLD_MS,
            );
            this.p1SpecialHoldTime = 0;
            this.clearChargeIndicator(true);
            this.mobileP1SpecialJustUp = false; // Reset flag
          } else if (this.mobileP1SpecialJustUp || this.p1SpecialHoldTime > 0) {
              // Just clear the flag if hold time was 0 and nothing triggered
              if (this.p1SpecialHoldTime > 0) {
                 this.performSpecial(true, this.p1SpecialHoldTime >= this.SUPER_THRESHOLD_MS);
              }
              this.p1SpecialHoldTime = 0;
              this.clearChargeIndicator(true);
              this.mobileP1SpecialJustUp = false;
          }
        }
      }
    }

    // Reset mobile special flag
    this.mobileP1SpecialJustUp = false;

    // --- PLAYER 2 CONTROLS (Local PvP) ---
    if (this.gameState.gameMode === "local_pvp") {
      if (this.p2ActionActive) {
        this.stopContinuousCharge(false);
        this.enemyDefending = false;
        this.p2SpecialHoldTime = 0;
        this.clearChargeIndicator(false);
      } else {
        let isDefending = this.keys.p2_defend.isDown;
        if (this.gameState.gameMode !== "local_pvp" && this.gameState.gameMode !== "training") {
           // If AI, it sets its own enemyDefending state in enemyDecide.
           isDefending = this.enemyDefending;
        }

        if (isDefending) {
          this.enemyDefending = true;
          this.performContinuousCharge(false, delta);
          this.p2SpecialHoldTime = 0;
          this.clearChargeIndicator(false);
        } else {
          this.enemyDefending = false;
          this.stopContinuousCharge(false);

          if (Phaser.Input.Keyboard.JustDown(this.keys.p2_attack) || this.p2BufferedAttack) {
            this.performAttack(false, "melee");
            this.p2BufferedAttack = false;
          } else if (Phaser.Input.Keyboard.JustDown(this.keys.p2_kiblast) || this.p2BufferedKiBlast) {
            this.performAttack(false, "ki");
            this.p2BufferedKiBlast = false;
          } else if (Phaser.Input.Keyboard.JustDown(this.keys.p2_transform) || this.p2BufferedTransform) {
            this.performTransform(false);
            this.p2BufferedTransform = false;
          }

          if (!this.p2ActionActive) {
            if (this.keys.p2_special.isDown) {
              this.p2SpecialHoldTime += delta;
              this.updateChargeIndicator(false, this.p2SpecialHoldTime);
            } else if (
              (this.p2SpecialHoldTime > 0 && Phaser.Input.Keyboard.JustUp(this.keys.p2_special)) ||
              (Phaser.Input.Keyboard.JustUp(this.keys.p2_special) && this.p2SpecialHoldTime === 0)
            ) {
              this.performSpecial(
                false,
                this.p2SpecialHoldTime >= this.SUPER_THRESHOLD_MS,
              );
              this.p2SpecialHoldTime = 0;
              this.clearChargeIndicator(false);
            } else if (this.p2SpecialHoldTime > 0) {
              // Failsafe in case JustUp was missed but key is no longer down
              this.performSpecial(
                false,
                this.p2SpecialHoldTime >= this.SUPER_THRESHOLD_MS,
              );
              this.p2SpecialHoldTime = 0;
              this.clearChargeIndicator(false);
            }
          }
        }
      }
    }
  }

  setActionState(isPlayer: boolean, isActive: boolean) {
    if (isPlayer) this.p1ActionActive = isActive;
    else this.p2ActionActive = isActive;
  }

  performContinuousCharge(isPlayer: boolean, delta: number) {
    if (this.isBattleOver) return;
    const chargeRate = 0.04 * delta; // Slightly faster charge
    this.modifyKi(isPlayer, chargeRate);
    const aura = isPlayer ? this.p1Aura : this.p2Aura;
    const shield = isPlayer ? this.p1Shield : this.p2Shield;
    if (aura && aura.active) {
      aura.setVisible(true);
      aura.setScale(1 + Math.sin(this.time.now * 0.02) * 0.3);
      aura.setAlpha(0.6 + Math.sin(this.time.now * 0.05) * 0.2);
    }
    if (shield && shield.active) {
      shield.setVisible(true);
      shield.setScale(1 + Math.sin(this.time.now * 0.08) * 0.1);
    }

    // Ki Charge Particles Effect
    const sprite = isPlayer ? this.player : this.enemy;
    if (Math.random() > 0.6) {
        const px = sprite.x + Phaser.Math.Between(-60, 60);
        const py = sprite.y + 120 + Phaser.Math.Between(-20, 20);
        const p = this.add.circle(px, py, 4, isPlayer ? 0x3498db : 0xe74c3c).setDepth(2);
        this.tweens.add({
            targets: p,
            y: py - 150,
            alpha: 0,
            scale: 2,
            duration: 600,
            onComplete: () => p.destroy()
        });
    }

    const data = isPlayer ? this.playerData : this.enemyData;
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const defendAnim = this.getAnimKey(data.key, transLevel, "defend");
    if (sprite.anims.currentAnim?.key !== defendAnim) {
      sprite.play(defendAnim);
    }
  }

  stopContinuousCharge(isPlayer: boolean) {
    const aura = isPlayer ? this.p1Aura : this.p2Aura;
    const shield = isPlayer ? this.p1Shield : this.p2Shield;
    if (aura && aura.active) aura.setVisible(false);
    if (shield && shield.active) shield.setVisible(false);

    const sprite = isPlayer ? this.player : this.enemy;
    const data = isPlayer ? this.playerData : this.enemyData;
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const defendAnim = this.getAnimKey(data.key, transLevel, "defend");
    const idleAnim = this.getAnimKey(data.key, transLevel, "idle");

    if (sprite.anims.currentAnim?.key === defendAnim) {
      sprite.play(idleAnim);
    }
  }

  updateChargeIndicator(isPlayer: boolean, timer: number) {
    const sprite = isPlayer ? this.player : this.enemy;
    const indicator = isPlayer
      ? this.p1ChargeIndicator
      : this.p2ChargeIndicator;

    // Safety check if sprite is destroyed
    if (!sprite || !sprite.active) return;

    if (!indicator || !indicator.scene) {
      const obj = this.add.arc(
        sprite.x,
        sprite.y - 60,
        15,
        0,
        360,
        false,
        0x00ffff,
        0.5,
      );
      if (isPlayer) this.p1ChargeIndicator = obj;
      else this.p2ChargeIndicator = obj;
    }

    const ind = isPlayer ? this.p1ChargeIndicator : this.p2ChargeIndicator;
    ind.setPosition(sprite.x, sprite.y - 60).setVisible(true);
    const progress = Math.min(timer / this.SUPER_THRESHOLD_MS, 1);

    // Visual indicator logic
    ind.setStartAngle(Phaser.Math.DegToRad(-90));
    ind.setEndAngle(Phaser.Math.DegToRad(-90 + 360 * progress));

    if (progress >= 1) {
      ind.setFillStyle(0xff0000, 0.8);
      ind.setScale(1 + Math.sin(this.time.now * 0.02) * 0.2);
    } else {
      ind.setFillStyle(0x00ffff, 0.5);
      ind.setScale(1);
    }
  }

  clearChargeIndicator(isPlayer: boolean) {
    const ind = isPlayer ? this.p1ChargeIndicator : this.p2ChargeIndicator;
    if (ind && ind.scene) ind.setVisible(false);
  }

  createFighterSprites() {
    // Player 1
    this.player = this.add
      .sprite(this.p1StartPos.x, this.p1StartPos.y, this.playerData.key)
      .setOrigin(0.5, 0.5)
      .setScale(3) // Scaled down from 4 to fit screen better (Texture height 128 * 3 = 384px)
      .setDepth(1);
    this.player.play(`${this.playerData.key}_idle`, true);
    
    // Add cool graphical effects to the sprite
    if (this.player.postFX) {
        this.player.postFX.addShadow(0, 0, 0.05, 1, 0x000000, 4, 1);
    }

    // Shadows (offset +180 relative to sprite center Y to land at Y=460)
    this.p1Shadow = this.add
      .ellipse(
        this.p1StartPos.x,
        this.p1StartPos.y + 180,
        100,
        30,
        0x000000,
        0.5,
      )
      .setDepth(0);

    // FIX: Moved Aura down to +80 to center on body/chest (was +0, top of head)
    this.p1Aura = this.add
      .circle(this.p1StartPos.x, this.p1StartPos.y + 80, 50, 0x3498db, 0.5)
      .setVisible(false)
      .setDepth(0);
    this.p1Shield = this.add
      .arc(
        this.p1StartPos.x,
        this.p1StartPos.y + 80,
        60,
        0,
        360,
        false,
        0x3498db,
        0.3,
      )
      .setVisible(false)
      .setDepth(2);
    this.p1Shield.setStrokeStyle(4, 0x3498db, 0.8);

    // Player 2
    this.enemy = this.add
      .sprite(this.p2StartPos.x, this.p2StartPos.y, this.enemyData.key)
      .setOrigin(0.5, 0.5)
      .setScale(3)
      .setFlipX(true)
      .setDepth(1);
    this.enemy.play(`${this.enemyData.key}_idle`, true);
    
    // Add cool graphical effects to the sprite
    if (this.enemy.postFX) {
        this.enemy.postFX.addShadow(0, 0, 0.05, 1, 0x000000, 4, 1);
    }
    
    this.p2Shadow = this.add
      .ellipse(
        this.p2StartPos.x,
        this.p2StartPos.y + 180,
        100,
        30,
        0x000000,
        0.5,
      )
      .setDepth(0);
    this.p2Aura = this.add
      .circle(this.p2StartPos.x, this.p2StartPos.y + 80, 50, 0xe74c3c, 0.5)
      .setVisible(false)
      .setDepth(0);
    this.p2Shield = this.add
      .arc(
        this.p2StartPos.x,
        this.p2StartPos.y + 80,
        60,
        0,
        360,
        false,
        0xe74c3c,
        0.3,
      )
      .setVisible(false)
      .setDepth(2);
    this.p2Shield.setStrokeStyle(4, 0xe74c3c, 0.8);
  }

  performJump(isP: boolean) {
    const player = isP ? this.player : this.enemy;
    if (!player || !player.active) return;
    
    // Scale up slightly during jump to give depth perspective
    const startY = isP ? this.p1StartPos.y : this.p2StartPos.y;
    const startScale = 3;
    const jumpScale = 3.6;
    const jumpHeight = -250; // Jump up (y decreases)

    if (isP) this.isP1Jumping = true;
    else this.isP2Jumping = true;

    // Optional flip for acrobatic effect
    const direction = player.flipX ? -1 : 1;
    
    // Jump Up
    this.tweens.add({
      targets: player,
      y: startY + jumpHeight,
      scaleX: jumpScale * (player.scaleX > 0 ? 1 : -1),
      scaleY: jumpScale,
      angle: isP ? -15 : 15,
      duration: 350,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        
        // Fall Down
        this.tweens.add({
          targets: player,
          y: startY,
          scaleX: startScale * (player.scaleX > 0 ? 1 : -1),
          scaleY: startScale,
          angle: 0,
          duration: 250,
          ease: "Quad.easeIn",
          onComplete: () => {
            if (isP) this.isP1Jumping = false;
            else this.isP2Jumping = false;
            
            // Landing dust
            this.createImpactEffect(player.x, startY + 80, 0xecf0f1, "block");
            
            if (this.cache.audio.exists("sfx_step")) {
                this.sound.play("sfx_step", { volume: 0.5 });
            }
          }
        });
      }
    });
  }

  createInputs() {
    if (!this.input.keyboard) return;

    // Clean up old keys if any (defensive)
    this.input.keyboard.removeAllKeys();

    this.keys = this.input.keyboard.addKeys({
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
    });

    // Pause handler
    this.input.keyboard.on("keydown-ESC", () => {
      if (!this.isBattleOver) {
        this.scene.pause();
        this.scene.launch("PauseScene");
      }
    });
  }

  createUI() {
    this.uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(10);
    
    // Player 1 HP/Ki Backgrounds
    const p1HpBg = this.add.rectangle(150, 50, 250, 22, 0x111111).setStrokeStyle(3, 0xffffff, 0.8);
    const p1KiBg = this.add.rectangle(150, 80, 250, 12, 0x111111).setStrokeStyle(2, 0xaaaaaa, 0.6);
    this.uiContainer.add([p1HpBg, p1KiBg]);

    // Player 2 HP/Ki Backgrounds
    const p2HpBg = this.add.rectangle(810, 50, 250, 22, 0x111111).setStrokeStyle(3, 0xffffff, 0.8);
    const p2KiBg = this.add.rectangle(810, 80, 250, 12, 0x111111).setStrokeStyle(2, 0xaaaaaa, 0.6);
    this.uiContainer.add([p2HpBg, p2KiBg]);

    this.p1HpBar = this.add
      .rectangle(25, 50, 250, 22, 0x2ecc71)
      .setOrigin(0, 0.5);
    this.uiContainer.add(this.p1HpBar);

    this.p1KiBar = this.add
      .rectangle(25, 80, 250, 12, 0x3498db)
      .setOrigin(0, 0.5);
    this.uiContainer.add(this.p1KiBar);
    this.p1KiBar.scaleX = 0; // Starts with 0 Ki

    this.p2HpBar = this.add
      .rectangle(685, 50, 250, 22, 0xe74c3c)
      .setOrigin(0, 0.5);
    this.uiContainer.add(this.p2HpBar);

    this.p2KiBar = this.add
      .rectangle(685, 80, 250, 12, 0xf1c40f)
      .setOrigin(0, 0.5);
    this.uiContainer.add(this.p2KiBar);
    this.p2KiBar.scaleX = 0; // Starts with 0 Ki

    // Player 1 Name
    const p1NameTxt = this.add
      .text(25, 15, this.playerData.name, {
        fontSize: "22px",
        fontFamily: "Impact, sans-serif",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 4,
        shadow: { color: "#3498db", blur: 4, fill: true }
      });
    this.uiContainer.add(p1NameTxt);
      
    // Player 2 Name
    const p2NameTxt = this.add
      .text(935, 15, this.enemyData.name, {
        fontSize: "22px",
        fontFamily: "Impact, sans-serif",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 4,
        shadow: { color: "#e74c3c", blur: 4, fill: true }
      })
      .setOrigin(1, 0);
    this.uiContainer.add(p2NameTxt);
      
    this.logText = this.add
      .text(480, 120, "", {
        fontSize: "26px",
        color: "#fff",
        fontFamily: "Impact, sans-serif",
        stroke: "#000",
        strokeThickness: 5,
        shadow: { color: "#000", blur: 4, offsetX: 2, offsetY: 2, fill: true }
      })
      .setOrigin(0.5);
    this.uiContainer.add(this.logText);

    if (this.gameState.gameMode === "arcade") {
      this.add
        .text(480, 25, `ARCADE: ROUND ${this.gameState.arcadeRound || 1} / 5`, {
          fontSize: "22px",
          color: "#f1c40f",
          fontFamily: "Impact, sans-serif",
          stroke: "#000",
          strokeThickness: 4,
          shadow: { color: "#000", blur: 4, fill: true }
        })
        .setOrigin(0.5)
        .setDepth(12);
    } else if (this.gameState.gameMode === "tournament") {
      let roundName = "QUARTAS DE FINAL";
      if (this.gameState.tournamentCurrentRoundIndex === 1)
        roundName = "SEMIFINAL";
      if (this.gameState.tournamentCurrentRoundIndex === 2) roundName = "FINAL";
      this.add
        .text(480, 25, `TORNEIO: ${roundName}`, {
          fontSize: "22px",
          color: "#f1c40f",
          fontFamily: "Impact, sans-serif",
          stroke: "#000",
          strokeThickness: 4,
          shadow: { color: "#000", blur: 4, fill: true }
        })
        .setOrigin(0.5)
        .setDepth(12);
    }

    this.createMobileControls();
  }

  createMobileControls() {
    // Ensure accurate isMobile check
    const isMobile = this.sys.game.device.input.touch || 
                     (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
                     
    if (!isMobile) return;

    const gw = this.cameras.main.width;
    const gh = this.cameras.main.height;

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
      const btnGroup = this.add.container(x, y).setScrollFactor(0).setDepth(100);
      
      const outerBtn = this.add.circle(0, 0, radius, color, 0.4).setStrokeStyle(3, 0xffffff, 0.5);
      const innerBtn = this.add.circle(0, 0, radius * 0.85, 0x000000, 0.3);
      
      const txt = this.add.text(0, 0, text, {
        fontFamily: "Impact, sans-serif",
        fontSize: radius > 40 ? "24px" : "18px",
        color: "#ffffff",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(0.5);

      btnGroup.add([outerBtn, innerBtn, txt]);
      
      this.mobileControls.push(btnGroup);
      if (this.uiContainer) {
          this.uiContainer.add(btnGroup);
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
    
    const joyContainer = this.add.container(joyRootX, joyRootY).setScrollFactor(0).setDepth(100);
    const joyBase = this.add.circle(0, 0, 75, 0x000000, 0.4).setStrokeStyle(3, 0xffffff, 0.3);
    const joyThumb = this.add.circle(0, 0, 35, 0xffffff, 0.6).setStrokeStyle(2, 0x000000, 0.5);
    
    joyContainer.add([joyBase, joyThumb]);
    this.mobileControls.push(joyContainer);
    
    // Large invisible hit area on the bottom-left quadrant for the FLOATING joystick
    // We remove the old rectangle hit area and use global checking for this too.
    if (this.uiContainer) {
        this.uiContainer.add(joyContainer);
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

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
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

    this.input.on('pointermove', handleJoystick);

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

    this.input.on('pointerup', releaseJoystick);
    this.input.on('pointerout', releaseJoystick);
    // --- End Virtual Joystick ---

    // Right side (Attacks)
    createBtn(gw - 100, gh - 100, "ATK", 0xe74c3c, 60, () => {
      this.mobileP1Attack = true;
      this.p1AttackBuffer = this.BUFFER_MS;
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
      this.p1KiBlastBuffer = this.BUFFER_MS;
    });

    // TRN (Transform)
    if (this.playerData.transformAvailable) {
      this.trnBtnGroup = createBtn(140, 200, "TRN", 0x9b59b6, 50, () => {
        this.mobileP1Transform = true;
        this.p1TransformBuffer = this.BUFFER_MS;
      });
    }

    // Pause Button (Top Center)
    const pauseBtn = this.add
      .circle(480, 40, 30, 0x333333, 0.6)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100);
    const pauseTxt = this.add
      .text(480, 40, "||", { fontSize: "24px", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.mobileControls.push(pauseBtn, pauseTxt);

    pauseBtn.on("pointerdown", () => {
      pauseBtn.setAlpha(0.9);
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      this.scene.pause();
      this.scene.launch("PauseScene");
    });

    pauseBtn.on("pointerup", () => pauseBtn.setAlpha(0.6));
    pauseBtn.on("pointerout", () => pauseBtn.setAlpha(0.6));
  }

  getAnimKey(baseKey: string, transLevel: number, animType: string): string {
    let texKey = baseKey;
    if (transLevel === 1) texKey = `${baseKey}_ssj`;
    else if (transLevel === 2) texKey = `${baseKey}_ui`;

    // Fallback to base animation if transformed animation doesn't exist
    const animKey = `${texKey}_${animType}`;
    if (this.anims.exists(animKey)) {
      return animKey;
    }
    return `${baseKey}_${animType}`;
  }

  
  performWhiffMelee(isPlayer: boolean) {
    const attacker = isPlayer ? this.player : this.enemy;
    const attackerData = isPlayer ? this.playerData : this.enemyData;
    const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;
    
    this.setActionState(isPlayer, true);
    attacker.play(this.getAnimKey(attackerData.key, transLevel, "attack"));

    this.tweens.add({
      targets: attacker,
      x: attacker.x + (attacker.flipX ? -30 : 30),
      duration: 150,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        attacker.play(this.getAnimKey(attackerData.key, transLevel, "idle"));
        this.setActionState(isPlayer, false);
      }
    });
  }

  performAttack(isPlayer: boolean, attackType: "melee" | "ki") {
    if (this.isBattleOver) return;
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const attackerData = isPlayer ? this.playerData : this.enemyData;

    const dist = Math.abs(attacker.x - target.x);
    const yDist = Math.abs((attacker.y || 0) - (target.y || 0));
    if (attackType === "melee" && (dist > 250 || yDist > 100)) {
        this.performWhiffMelee(isPlayer);
        return;
    }

    this.setActionState(isPlayer, true);

    // Combo Logic
    const currentTime = this.time.now;
    let comboCount = 0;

    if (isPlayer) {
      if (currentTime - this.p1LastAttackTime < 1000) {
        this.p1ComboCount++;
      } else {
        this.p1ComboCount = 1;
      }
      this.p1LastAttackTime = currentTime;
      comboCount = this.p1ComboCount;
    } else {
      if (currentTime - this.p2LastAttackTime < 1000) {
        this.p2ComboCount++;
      } else {
        this.p2ComboCount = 1;
      }
      this.p2LastAttackTime = currentTime;
      comboCount = this.p2ComboCount;
    }

    const isComboFinisher = comboCount % 3 === 0;

    if (
      this.performCustomAttack(
        isPlayer,
        attackType,
        comboCount,
        isComboFinisher,
      )
    ) {
      return;
    }

    this.performGenericAttack(
      isPlayer,
      attackType,
      comboCount,
      isComboFinisher,
    );
  }

  performCustomAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ): boolean {
    const attackerData = isPlayer ? this.playerData : this.enemyData;

    switch (attackerData.key) {
      case "goku": {
        const fighter = getFighter("goku");
        fighter.performAttack({
          scene: this,
          attacker: isPlayer ? this.player : this.enemy,
          defender: isPlayer ? this.enemy : this.player,
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
          transformLevel: isPlayer ? this.playerTransformLevel : this.enemyTransformLevel
        });
        return true;
      }
      case "vegeta": {
        const fighter = getFighter("vegeta");
        fighter.performAttack({
          scene: this,
          attacker: isPlayer ? this.player : this.enemy,
          defender: isPlayer ? this.enemy : this.player,
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
          transformLevel: isPlayer ? this.playerTransformLevel : this.enemyTransformLevel
        });
        return true;
      }
      case "madara":
        this.performMadaraAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "obito":
        this.performObitoAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "itachi":
        this.performItachiAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "jotaro":
        this.performJotaroAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "spiderman":
        this.performSpidermanAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "naruto":
        this.performNarutoAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "thukuna":
        this.performThukunaAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "batman":
        this.performBatmanAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "cyberninja":
        this.performCyberNinjaAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "minipekka":
        this.performMiniPekkaAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "optimus":
        this.performOptimusAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "cell":
        this.performCellAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "piccolo":
        this.performPiccoloAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "gohan":
        this.performGohanAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "leonardo":
        this.performLeonardoAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "saitama":
        this.performSaitamaAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "static":
        this.performStaticAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "frieren":
        this.performFrierenAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "chapolim":
        this.performChapolimAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      case "gojo":
        this.performGojoAttack(
          isPlayer,
          attackType,
          comboCount,
          isComboFinisher,
        );
        return true;
      default:
        return false; // Fallback to generic
    }
  }

  performItachiAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Itachi Melee: Kunai slash
      attacker.play(this.getAnimKey("itachi", transLevel, "attack"));

      // Dash forward
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        ease: "Power2",
        onComplete: () => {
          if (!this.scene.isActive()) return;

          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.2 });

          const hitColor = transLevel === 1 ? 0xff4500 : 0xcccccc; // Susanoo sword or kunai
          const hitLine = this.add
            .rectangle(target.x, target.y + 120, 50, 4, hitColor)
            .setRotation(isPlayer ? 0.8 : -0.8)
            .setDepth(6);
          this.tweens.add({
            targets: hitLine,
            alpha: 0,
            scaleX: 1.5,
            duration: 150,
            onComplete: () => hitLine.destroy(),
          });

          this.createImpactEffect(target.x, target.y + 120, hitColor);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 22 : 12) *
                this.getDamageMultiplier(transLevel),
            ),
          );
          this.cameras.main.shake(100, 0.01);

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;

            // Dash back
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              ease: "Power2",
              onComplete: () => {
                attacker.play(this.getAnimKey("itachi", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Itachi Ki: Fireball (Katon)
      attacker.play(this.getAnimKey("itachi", transLevel, "attack"));

      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 0.8 });

        const fireballColor = transLevel === 1 ? 0xff4500 : 0xff8c00; // Susanoo fire or normal fire
        const hand = this.getHandPosition(isPlayer);
        const fireball = this.add
          .circle(hand.x, hand.y, 15, fireballColor)
          .setDepth(5);

        // Add some fire particles/glow
        const glow = this.add
          .circle(fireball.x, fireball.y, 25, 0xff0000, 0.5)
          .setDepth(4);

        this.tweens.add({
          targets: [fireball, glow],
          x: target.x,
          duration: 300,
          ease: "Power1",
          onComplete: () => {
            if (!this.scene.isActive()) return;
            fireball.destroy();
            glow.destroy();

            if (this.cache.audio.exists("sfx_explosion"))
              this.sound.play("sfx_explosion", { volume: 0.8 });
            this.createImpactEffect(target.x, target.y + 120, fireballColor);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 20 : 10) *
                  this.getDamageMultiplier(transLevel),
              ),
            );

            // Fire explosion effect
            const explosion = this.add
              .circle(target.x, target.y + 120, 10, 0xff0000)
              .setDepth(6);
            this.tweens.add({
              targets: explosion,
              scale: 4,
              alpha: 0,
              duration: 200,
              onComplete: () => explosion.destroy(),
            });
          },
        });

        this.time.delayedCall(400, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("itachi", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performJotaroAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Jotaro Melee: ORA punches
      attacker.play(this.getAnimKey("jotaro", transLevel, "attack"));

      // Dash forward
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        ease: "Power2",
        onComplete: () => {
          if (!this.scene.isActive()) return;

          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.2 });

          // Multiple punch impacts for Star Platinum
          const hitColor = transLevel === 1 ? 0x8a2be2 : 0xcccccc;

          const createPunch = (delay: number, offsetY: number) => {
            this.time.delayedCall(delay, () => {
              if (!this.scene.isActive()) return;
              const hitCircle = this.add
                .circle(
                  target.x + (Math.random() * 20 - 10),
                  target.y + 120 + offsetY,
                  15,
                  hitColor,
                )
                .setAlpha(0.7)
                .setDepth(6);
              this.tweens.add({
                targets: hitCircle,
                alpha: 0,
                scale: 1.5,
                duration: 100,
                onComplete: () => hitCircle.destroy(),
              });
              this.createImpactEffect(
                target.x,
                target.y + 120 + offsetY,
                hitColor,
              );
            });
          };

          createPunch(0, 0);
          if (transLevel === 1) {
            createPunch(50, -10);
            createPunch(100, 10);
          }

          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 25 : 15) *
                this.getDamageMultiplier(transLevel),
            ),
          );
          this.cameras.main.shake(150, 0.015);

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;

            // Dash back
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              ease: "Power2",
              onComplete: () => {
                if (this.scene.isActive()) {
                  attacker.play(this.getAnimKey("jotaro", transLevel, "idle"));
                  this.setActionState(isPlayer, false);
                }
              },
            });
          });
        },
      });
    } else {
      // Jotaro Ki: Star Finger (or throwing something)
      attacker.play(this.getAnimKey("jotaro", transLevel, "attack"));
      if (this.cache.audio.exists("sfx_ki"))
        this.sound.play("sfx_ki", { volume: 0.8 });

      const projectileColor = transLevel === 1 ? 0x8a2be2 : 0xcccccc;

      // Star Finger visual (elongated beam/finger)
      const hand = this.getHandPosition(isPlayer);
      const projectile = this.add
        .rectangle(hand.x, hand.y, 30, 6, projectileColor)
        .setDepth(5);

      this.tweens.add({
        targets: projectile,
        x: target.x,
        duration: 300,
        ease: "Linear",
        onComplete: () => {
          if (!this.scene.isActive()) return;
          projectile.destroy();
          this.createImpactEffect(target.x, target.y + 120, projectileColor);
          if (this.cache.audio.exists("sfx_hit"))
            this.sound.play("sfx_hit", { volume: 0.8 });
          this.takeDamage(
            !isPlayer,
            Math.floor(12 * this.getDamageMultiplier(transLevel)),
          );

          this.time.delayedCall(200, () => {
            if (this.scene.isActive()) {
              attacker.play(this.getAnimKey("jotaro", transLevel, "idle"));
              this.setActionState(isPlayer, false);
            }
          });
        },
      });
    }
  }

  performObitoAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Obito Melee: Staff strike (Paulada)
      attacker.play(this.getAnimKey("obito", transLevel, "attack"));

      // Dash forward
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        ease: "Power2",
        onComplete: () => {
          if (!this.scene.isActive()) return;

          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.2 });

          // Visual effect for the staff hit
          const hitColor = transLevel === 1 ? 0x000000 : 0xffaa00;
          const hitLine = this.add
            .rectangle(target.x, target.y + 120, 60, 6, hitColor)
            .setRotation(isPlayer ? 0.5 : -0.5)
            .setDepth(6);
          this.tweens.add({
            targets: hitLine,
            alpha: 0,
            scaleX: 1.5,
            duration: 150,
            onComplete: () => hitLine.destroy(),
          });

          this.createImpactEffect(target.x, target.y + 120, hitColor);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 22 : 12) *
                this.getDamageMultiplier(transLevel),
            ),
          );
          this.cameras.main.shake(150, 0.02);

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;

            // Dash back
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              ease: "Power2",
              onComplete: () => {
                attacker.play(this.getAnimKey("obito", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Obito Ki: Fireball / Truth-Seeking Orb
      attacker.play(this.getAnimKey("obito", transLevel, "attack"));
      this.time.delayedCall(150, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 1.0 });

        const orbColor = transLevel === 1 ? 0x111111 : 0xff4500;
        const hand = this.getHandPosition(isPlayer);
        const orb = this.add
          .circle(hand.x, hand.y, isComboFinisher ? 25 : 15, orbColor)
          .setDepth(5);
        if (transLevel === 1) orb.setStrokeStyle(2, 0xffffff); // White outline for truth-seeking orb

        this.tweens.add({
          targets: orb,
          x: target.x,
          duration: 200,
          onComplete: () => {
            orb.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, orbColor);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 25 : 15) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
            this.cameras.main.shake(isComboFinisher ? 150 : 50, 0.01);
          },
        });

        this.time.delayedCall(400, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("obito", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performSpidermanAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;

    if (attackType === "melee") {
        // Swift kick/punch combo
        attacker.play(this.getAnimKey("spiderman", transLevel, "attack"));

        this.tweens.add({
            targets: attacker,
            x: target.x + (attacker.x < target.x ? -40 : 40),
            duration: 100,
            onComplete: () => {
                if (!this.scene.isActive()) return;
                if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack", { volume: 1.0 });

                const hits = isComboFinisher ? 3 : 1;
                for (let i = 0; i < hits; i++) {
                    this.time.delayedCall(i * 100, () => {
                        this.createImpactEffect(target.x, target.y + 120, 0xffffff);
                        this.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 8 : 12) * this.getDamageMultiplier(transLevel)));
                        target.x += attacker.x < target.x ? 5 : -5;
                        this.cameras.main.shake(100, 0.01);
                    });
                }

                this.time.delayedCall(hits * 100 + 100, () => {
                    if (!this.scene.isActive()) return;
                    this.tweens.add({
                        targets: attacker,
                        x: startX,
                        duration: 150,
                        onComplete: () => {
                            attacker.play(this.getAnimKey("spiderman", transLevel, "idle"));
                            this.setActionState(isPlayer, false);
                        }
                    });
                });
            }
        });
    } else {
        // Ki Blast: Web Ball
        attacker.play(this.getAnimKey("spiderman", transLevel, "attack"));
        this.time.delayedCall(50, () => {
            if (!this.scene.isActive()) return;
            if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam", { volume: 0.6 });
            
            const hand = this.getHandPosition(isPlayer);
            const isIron = transLevel > 0;
            const webColor = isIron ? 0xcc2222 : 0xdddddd;
            
            const webBall = this.add.circle(hand.x, hand.y, 8, webColor).setDepth(5);
            
            this.tweens.add({
                targets: webBall,
                x: target.x,
                duration: 200,
                onComplete: () => {
                    webBall.destroy();
                    if (!this.scene.isActive()) return;
                    this.createImpactEffect(target.x, target.y + 120, webColor);
                    this.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 15 : 10) * this.getDamageMultiplier(transLevel)));
                    
                    if (isComboFinisher) {
                        this.tweens.add({
                           targets: target,
                           x: target.x + (attacker.x < target.x ? -20 : 20),
                           duration: 100,
                           yoyo: true
                        });
                    }
                }
            });

            this.time.delayedCall(250, () => {
                if (!this.scene.isActive()) return;
                attacker.play(this.getAnimKey("spiderman", transLevel, "idle"));
                this.setActionState(isPlayer, false);
            });
        });
    }
  }

  performStaticAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;

    if (attackType === "melee") {
      attacker.play(this.getAnimKey("static", transLevel, "attack"));
      
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 100,
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack", { volume: 1.0 });

          const hits = isComboFinisher ? 3 : 1;
          for (let i = 0; i < hits; i++) {
            this.time.delayedCall(i * 100, () => {
              this.createImpactEffect(target.x, target.y + 120, 0x00ffff);
              this.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 15 : 10) * this.getDamageMultiplier(transLevel)));
              
              // Zap visual
              const zap = this.add.graphics();
              zap.lineStyle(2, 0x00ffff, 1);
              zap.beginPath();
              zap.moveTo(attacker.x, attacker.y + 100);
              zap.lineTo(target.x + (Math.random() * 20 - 10), target.y + 120 + (Math.random() * 20 - 10));
              zap.strokePath();
              this.time.delayedCall(50, () => zap.destroy());
            });
          }

          this.time.delayedCall(hits * 100 + 100, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.play(this.getAnimKey("static", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              }
            });
          });
        }
      });
    } else {
      // Ki Blast: Electric Bolt
      attacker.play(this.getAnimKey("static", transLevel, "attack"));
      this.time.delayedCall(50, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam", { volume: 0.4, rate: 1.5 });
        
        const hand = this.getHandPosition(isPlayer);
        const bolt = this.add.graphics().setDepth(5);
        bolt.lineStyle(3, 0x00ffff, 1);
        
        this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 200,
          onUpdate: (tween) => {
            const v = tween.getValue();
            bolt.clear();
            bolt.lineStyle(3, 0x00ffff, 1);
            bolt.beginPath();
            let curX = hand.x;
            let curY = hand.y;
            const targetX = hand.x + (target.x - hand.x) * v;
            const targetY = hand.y + (target.y + 100 - hand.y) * v;
            
            bolt.moveTo(curX, curY);
            for (let i = 1; i <= 4; i++) {
                const px = hand.x + (targetX - hand.x) * (i/4);
                const py = hand.y + (targetY - hand.y) * (i/4);
                bolt.lineTo(px + (Math.random() * 10 - 5), py + (Math.random() * 10 - 5));
            }
            bolt.strokePath();
          },
          onComplete: () => {
            bolt.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0x00ffff);
            this.takeDamage(!isPlayer, Math.floor((isComboFinisher ? 18 : 8) * this.getDamageMultiplier(transLevel)));
            
            attacker.play(this.getAnimKey("static", transLevel, "idle"));
            this.setActionState(isPlayer, false);
          }
        });
      });
    }
  }

  performNarutoAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Naruto Melee: Shadow Clone combo
      attacker.play(this.getAnimKey("naruto", transLevel, "attack"));

      // Spawn clone
      const clone = this.add
        .sprite(
          target.x + (attacker.x < target.x ? 40 : -40),
          target.y + 120,
          attacker.texture.key,
          attacker.frame.name,
        )
        .setScale(3)
        .setFlipX(!attacker.flipX)
        .setAlpha(0)
        .setTint(0xaaaaaa);

      this.createImpactEffect(clone.x, clone.y + 120, 0xffffff); // Poof
      clone.setAlpha(1);

      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 150,
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.2 });
          this.createImpactEffect(target.x, target.y + 120, 0xffffff);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 20 : 12) *
                this.getDamageMultiplier(transLevel),
            ),
          );

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;
            this.createImpactEffect(clone.x, clone.y + 120, 0xffffff);
            clone.destroy();

            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.play(this.getAnimKey("naruto", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Naruto Ki: Rasengan thrust
      attacker.play(this.getAnimKey("naruto", transLevel, "attack"));

      const hand = this.getHandPosition(isPlayer);
      const rasengan = this.add
        .circle(hand.x, hand.y, 15, 0x00ffff)
        .setDepth(6);
      rasengan.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 200,
        ease: "Power2",
        onUpdate: () => {
          const hand = this.getHandPosition(isPlayer);
          rasengan.x = hand.x;
          rasengan.y = hand.y;
        },
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.5 });
          this.createImpactEffect(target.x, target.y + 120, 0x00ffff);
          rasengan.destroy();

          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 25 : 15) *
                this.getDamageMultiplier(transLevel),
            ),
          );
          this.cameras.main.shake(150, 0.02);
          this.tweens.add({
            targets: target,
            x: target.x + (attacker.x < target.x ? 80 : -80),
            duration: 150,
            yoyo: true,
          });

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 200,
              onComplete: () => {
                attacker.play(this.getAnimKey("naruto", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    }
  }

  performThukunaAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Thukuna Melee: Cleave (invisible slashes)
      attacker.play(this.getAnimKey("thukuna", transLevel, "attack"));

      const slashCount = isComboFinisher ? 5 : 2;
      for (let i = 0; i < slashCount; i++) {
        this.time.delayedCall(i * 100, () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.0 });

          // Draw slash lines on target
          const slash = this.add.graphics().setDepth(10);
          slash.lineStyle(4, 0xffffff, 1);
          const ox = target.x + (Math.random() * 40 - 20);
          const oy = target.y + 120 + (Math.random() * 40 - 20);
          slash.lineBetween(ox - 20, oy - 20, ox + 20, oy + 20);

          this.tweens.add({
            targets: slash,
            alpha: 0,
            duration: 150,
            onComplete: () => slash.destroy(),
          });
          this.createImpactEffect(ox, oy, 0xff0000);
          this.takeDamage(
            !isPlayer,
            Math.floor(6 * this.getDamageMultiplier(transLevel)),
          );
        });
      }

      this.time.delayedCall(slashCount * 100 + 200, () => {
        if (!this.scene.isActive()) return;
        attacker.play(this.getAnimKey("thukuna", transLevel, "idle"));
        this.setActionState(isPlayer, false);
      });
    } else {
      // Thukuna Ki: Fire Arrow
      attacker.play(this.getAnimKey("thukuna", transLevel, "attack"));
      this.time.delayedCall(150, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 1.2 });

        const hand = this.getHandPosition(isPlayer);
        const arrow = this.add
          .triangle(
            hand.x,
            hand.y,
            0,
            -10,
            0,
            10,
            attacker.x < target.x ? 30 : -30,
            0,
            0xff4500,
          )
          .setDepth(5);

        this.tweens.add({
          targets: arrow,
          x: target.x,
          duration: 150,
          onComplete: () => {
            arrow.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0xff4500);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 25 : 15) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
            this.cameras.main.shake(150, 0.02);
          },
        });

        this.time.delayedCall(300, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("thukuna", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performBatmanAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Batman Melee: Slide kick
      attacker.play(this.getAnimKey("batman", transLevel, "attack"));
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        y: target.y + 20,
        rotation: isPlayer ? 0.5 : -0.5,
        duration: 150,
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.0 });
          this.createImpactEffect(target.x, target.y + 120, 0xffffff);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 18 : 10) *
                this.getDamageMultiplier(transLevel),
            ),
          );
          target.y -= 20; // Knock up slightly
          this.tweens.add({
            targets: target,
            y: target.y + 20,
            duration: 100,
            ease: "Bounce.easeOut",
          });

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              rotation: 0,
              duration: 150,
              onComplete: () => {
                attacker.play(this.getAnimKey("batman", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Batman Ki: Batarang throw
      attacker.play(this.getAnimKey("batman", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 0.8 });

        const hand = this.getHandPosition(isPlayer);
        const batarang = this.add
          .triangle(
            hand.x,
            hand.y,
            0,
            -5,
            0,
            5,
            attacker.x < target.x ? 15 : -15,
            0,
            0x333333,
          )
          .setDepth(5);
        this.tweens.add({
          targets: batarang,
          rotation: isPlayer ? Math.PI * 4 : -Math.PI * 4,
          duration: 200,
        });

        this.tweens.add({
          targets: batarang,
          x: target.x,
          duration: 200,
          onComplete: () => {
            batarang.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0x333333);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 15 : 8) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        this.time.delayedCall(300, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("batman", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performCyberNinjaAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // CyberNinja Melee: Katana dash
      attacker.play(this.getAnimKey("cyberninja", transLevel, "attack"));

      // Dash line
      const dashLine = this.add.graphics().setDepth(5);
      dashLine.lineStyle(2, 0x00ffff, 0.8);
      dashLine.lineBetween(
        attacker.x,
        attacker.y + 120,
        target.x + (attacker.x < target.x ? 40 : -40),
        target.y + 120,
      );
      this.tweens.add({
        targets: dashLine,
        alpha: 0,
        duration: 200,
        onComplete: () => dashLine.destroy(),
      });

      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? 40 : -40),
        duration: 100, // Dash through
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.2 });
          this.createImpactEffect(target.x, target.y + 120, 0x00ffff);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 22 : 12) *
                this.getDamageMultiplier(transLevel),
            ),
          );

          // Slash mark
          const slash = this.add.graphics().setDepth(6);
          slash.lineStyle(3, 0xffffff, 1);
          slash.lineBetween(
            target.x - 20,
            target.y - 40,
            target.x + 20,
            target.y + 120,
          );
          this.tweens.add({
            targets: slash,
            alpha: 0,
            duration: 150,
            onComplete: () => slash.destroy(),
          });

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;
            attacker.setFlipX(!attacker.flipX); // Face back
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.setFlipX(isPlayer ? false : true); // Reset flip
                attacker.play(
                  this.getAnimKey("cyberninja", transLevel, "idle"),
                );
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // CyberNinja Ki: Shuriken throw
      attacker.play(this.getAnimKey("cyberninja", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 0.8 });

        const shurikenCount = isComboFinisher ? 3 : 1;
        for (let i = 0; i < shurikenCount; i++) {
          const hand = this.getHandPosition(isPlayer);
          const shuriken = this.add
            .star(hand.x, hand.y, 4, 4, 8, 0xaaaaaa)
            .setDepth(5);
          this.tweens.add({
            targets: shuriken,
            rotation: isPlayer ? Math.PI * 4 : -Math.PI * 4,
            duration: 200,
          });

          this.tweens.add({
            targets: shuriken,
            x: target.x,
            duration: 150,
            onComplete: () => {
              shuriken.destroy();
              if (!this.scene.isActive()) return;
              this.createImpactEffect(
                target.x,
                target.y + 120 + (i * 10 - 10),
                0xaaaaaa,
              );
              this.takeDamage(
                !isPlayer,
                Math.floor(8 * this.getDamageMultiplier(transLevel)),
              );
            },
          });
        }

        this.time.delayedCall(300, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("cyberninja", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performMiniPekkaAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // MiniPekka Melee: Heavy sword slash
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -30 : 30),
        duration: 150,
        onComplete: () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("minipekka", transLevel, "attack"));

          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.5 });

          // Sword arc
          const arc = this.add.graphics().setDepth(6);
          arc.lineStyle(6, 0xaaaaaa, 1);
          arc.beginPath();
          arc.arc(
            attacker.x,
            attacker.y,
            40,
            isPlayer ? -Math.PI / 2 : Math.PI / 2,
            isPlayer ? Math.PI / 2 : -Math.PI / 2,
            isPlayer ? false : true,
          );
          arc.strokePath();
          this.tweens.add({
            targets: arc,
            alpha: 0,
            scale: 1.2,
            duration: 150,
            onComplete: () => arc.destroy(),
          });

          this.createImpactEffect(target.x, target.y + 120, 0xffffff);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 30 : 15) *
                this.getDamageMultiplier(transLevel),
            ),
          );
          this.cameras.main.shake(150, 0.02);

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 200,
              onComplete: () => {
                attacker.play(this.getAnimKey("minipekka", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // MiniPekka Ki: Pancake throw
      attacker.play(this.getAnimKey("minipekka", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 0.8 });

        const hand = this.getHandPosition(isPlayer);
        const pancake = this.add
          .ellipse(hand.x, hand.y, 20, 10, 0xd2b48c)
          .setDepth(5);

        this.tweens.add({
          targets: pancake,
          x: target.x,
          rotation: Math.PI * 2,
          duration: 200,
          onComplete: () => {
            pancake.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0xd2b48c);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 15 : 8) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        this.time.delayedCall(300, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("minipekka", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performOptimusAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Optimus Melee: Heavy punch
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 200,
        ease: "Power2",
        onComplete: () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("optimus", transLevel, "attack"));

          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.5 });
          this.createImpactEffect(target.x, target.y + 120, 0xffaa00);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 25 : 15) *
                this.getDamageMultiplier(transLevel),
            ),
          );
          this.cameras.main.shake(200, 0.02);

          this.time.delayedCall(250, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 200,
              onComplete: () => {
                attacker.play(this.getAnimKey("optimus", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Optimus Ki: Ion Blaster
      attacker.play(this.getAnimKey("optimus", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 1.2 });

        const hand = this.getHandPosition(isPlayer);
        const blast = this.add
          .rectangle(hand.x, hand.y, 30, 8, 0x00ffff)
          .setDepth(5);

        this.tweens.add({
          targets: blast,
          x: target.x,
          duration: 150,
          onComplete: () => {
            blast.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0x00ffff);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 20 : 12) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        this.time.delayedCall(300, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("optimus", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performCellAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Cell Melee: Teleport above and stomp
      attacker.setAlpha(0);
      this.createImpactEffect(attacker.x, attacker.y + 120, 0x00ff00);

      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        attacker.setAlpha(1);
        attacker.x = target.x;
        attacker.y = target.y - 60;
        attacker.play(this.getAnimKey("cell", transLevel, "attack"));

        this.tweens.add({
          targets: attacker,
          y: target.y,
          duration: 100,
          ease: "Expo.easeIn",
          onComplete: () => {
            if (!this.scene.isActive()) return;
            if (this.cache.audio.exists("sfx_attack"))
              this.sound.play("sfx_attack", { volume: 1.2 });
            this.createImpactEffect(target.x, target.y + 120, 0x00ff00);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 22 : 12) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
            this.cameras.main.shake(150, 0.02);

            this.time.delayedCall(200, () => {
              if (!this.scene.isActive()) return;
              attacker.setAlpha(0);
              this.createImpactEffect(attacker.x, attacker.y + 120, 0x00ff00);
              this.time.delayedCall(100, () => {
                if (!this.scene.isActive()) return;
                attacker.setAlpha(1);
                attacker.x = startX;
                attacker.y = startY;
                attacker.play(this.getAnimKey("cell", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              });
            });
          },
        });
      });
    } else {
      // Cell Ki: Finger beam
      attacker.play(this.getAnimKey("cell", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 1.0 });

        const hand = this.getHandPosition(isPlayer);
        const beam = this.add
          .rectangle(
            hand.x,
            hand.y,
            Math.abs(target.x - attacker.x),
            2,
            0xffff00,
          )
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(5);
        this.tweens.add({
          targets: beam,
          alpha: 0,
          duration: 150,
          onComplete: () => beam.destroy(),
        });

        this.createImpactEffect(target.x, target.y + 120, 0xffff00);
        this.takeDamage(
          !isPlayer,
          Math.floor(
            (isComboFinisher ? 18 : 10) * this.getDamageMultiplier(transLevel),
          ),
        );

        this.time.delayedCall(250, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("cell", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performPiccoloAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Piccolo Melee: Stretchy arm
      attacker.play(this.getAnimKey("piccolo", transLevel, "attack"));

      const hand = this.getHandPosition(isPlayer);
      const arm = this.add
        .rectangle(hand.x, hand.y, 0, 8, 0x228b22)
        .setOrigin(isPlayer ? 0 : 1, 0.5)
        .setDepth(4);

      this.tweens.add({
        targets: arm,
        width: Math.abs(target.x - attacker.x) - 20,
        duration: 100,
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.0 });
          this.createImpactEffect(target.x, target.y + 120, 0xffffff);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 18 : 10) *
                this.getDamageMultiplier(transLevel),
            ),
          );

          this.tweens.add({
            targets: arm,
            width: 0,
            duration: 100,
            delay: 50,
            onComplete: () => {
              arm.destroy();
              attacker.play(this.getAnimKey("piccolo", transLevel, "idle"));
              this.setActionState(isPlayer, false);
            },
          });
        },
      });
    } else {
      // Piccolo Ki: Eye laser
      attacker.play(this.getAnimKey("piccolo", transLevel, "attack"));
      this.time.delayedCall(50, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 0.8 });

        const hand = this.getHandPosition(isPlayer);
        const beam1 = this.add
          .rectangle(
            hand.x,
            hand.y,
            Math.abs(target.x - attacker.x),
            2,
            0xff0000,
          )
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(5);
        const beam2 = this.add
          .rectangle(
            hand.x,
            hand.y,
            Math.abs(target.x - attacker.x),
            2,
            0xff0000,
          )
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(5);

        this.tweens.add({
          targets: [beam1, beam2],
          alpha: 0,
          duration: 150,
          onComplete: () => {
            beam1.destroy();
            beam2.destroy();
          },
        });

        this.createImpactEffect(target.x, target.y + 120, 0xff0000);
        this.takeDamage(
          !isPlayer,
          Math.floor(
            (isComboFinisher ? 15 : 8) * this.getDamageMultiplier(transLevel),
          ),
        );

        this.time.delayedCall(200, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("piccolo", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performMadaraAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Madara Melee: Gunbai swing or Susanoo sword
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 150,
        ease: "Power2",
        onComplete: () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("madara", transLevel, "attack"));

          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.2 });
          this.createImpactEffect(
            target.x,
            target.y + 120,
            transLevel > 0 ? 0x3b82f6 : 0xb91c1c,
          );
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 25 : 15) *
                this.getDamageMultiplier(transLevel),
            ),
          );

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              duration: 200,
              ease: "Power2",
              onComplete: () => {
                attacker.play(this.getAnimKey("madara", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Madara Ki: Fireball
      attacker.play(this.getAnimKey("madara", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 1.0 });

        const kiColor = transLevel > 0 ? 0x3b82f6 : 0xff4500;
        const hand = this.getHandPosition(isPlayer);
        const blast = this.add
          .circle(hand.x, hand.y, 15, kiColor)
          .setDepth(5);
        const core = this.add.circle(blast.x, blast.y, 8, 0xffffff).setDepth(6);

        this.tweens.add({
          targets: [blast, core],
          x: target.x,
          duration: 200,
          onComplete: () => {
            blast.destroy();
            core.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, kiColor);
            this.takeDamage(
              !isPlayer,
              Math.floor(12 * this.getDamageMultiplier(transLevel)),
            );
            attacker.play(this.getAnimKey("madara", transLevel, "idle"));
            this.setActionState(isPlayer, false);
          },
        });
      });
    }
  }

  performGohanAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Gohan Melee: High kick
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -30 : 30),
        y: target.y - 30,
        duration: 150,
        ease: "Sine.easeOut",
        onComplete: () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("gohan", transLevel, "attack"));

          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.2 });
          this.createImpactEffect(target.x, target.y + 120, 0xffffff);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 20 : 12) *
                this.getDamageMultiplier(transLevel),
            ),
          );

          this.time.delayedCall(150, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              duration: 200,
              ease: "Sine.easeIn",
              onComplete: () => {
                attacker.play(this.getAnimKey("gohan", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Gohan Ki: Quick Masenko blast
      attacker.play(this.getAnimKey("gohan", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 1.0 });

        const hand = this.getHandPosition(isPlayer);
        const blast = this.add.circle(hand.x, hand.y, 12, 0xffff00).setDepth(5);
        const core = this.add.circle(blast.x, blast.y, 6, 0xffffff).setDepth(6);

        this.tweens.add({
          targets: [blast, core],
          x: target.x,
          duration: 120,
          onComplete: () => {
            blast.destroy();
            core.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0xffff00);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 18 : 10) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        this.time.delayedCall(250, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("gohan", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performLeonardoAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      attacker.play(this.getAnimKey("leonardo", transLevel, "attack"));
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 150,
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.2 });

          const slash = this.add.graphics().setDepth(6);
          slash.lineStyle(4, 0x00ff00, 1);
          slash.lineBetween(
            target.x - 20,
            target.y - 30,
            target.x + 20,
            target.y + 120,
          );
          this.tweens.add({
            targets: slash,
            alpha: 0,
            duration: 150,
            onComplete: () => slash.destroy(),
          });

          this.createImpactEffect(target.x, target.y + 120, 0x00ff00);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 20 : 12) *
                this.getDamageMultiplier(transLevel),
            ),
          );

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.play(this.getAnimKey("leonardo", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      attacker.play(this.getAnimKey("leonardo", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 0.8 });

        const hand = this.getHandPosition(isPlayer);
        const shuriken = this.add
          .star(hand.x, hand.y, 4, 4, 8, 0x00ff00)
          .setDepth(5);
        this.tweens.add({
          targets: shuriken,
          rotation: isPlayer ? Math.PI * 4 : -Math.PI * 4,
          duration: 200,
        });

        this.tweens.add({
          targets: shuriken,
          x: target.x,
          duration: 150,
          onComplete: () => {
            shuriken.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0x00ff00);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 15 : 8) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        this.time.delayedCall(300, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("leonardo", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performSaitamaAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      // Saitama Melee: Fast strikes that create shockwaves
      attacker.play(this.getAnimKey("saitama", transLevel, "attack"));
      
      // Dash effect
      const dashGlow = this.add.rectangle(attacker.x - (attacker.x < target.x ? -20 : 20), attacker.y + 100, 80, 10, 0xffffff, 0.5).setDepth(2);
      this.tweens.add({ targets: dashGlow, scaleX: 3, alpha: 0, duration: 200, onComplete: () => dashGlow.destroy() });

      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -45 : 45),
        duration: 50, // SUPER FAST
        ease: "Expo.easeOut",
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 2.0 });

          this.createImpactEffect(target.x, target.y + 120, 0xffffff);
          this.cameras.main.shake(150, 0.02);

          // Intense Impact shockwave
          const wave = this.add.circle(target.x, target.y + 120, 15, 0xffffff, 0.7).setDepth(6);
          this.tweens.add({
            targets: wave,
            scale: isComboFinisher ? 12 : 8,
            alpha: 0,
            duration: 250,
            ease: "Quad.easeOut",
            onComplete: () => wave.destroy(),
          });
          
          if (isComboFinisher) {
             const wave2 = this.add.circle(target.x, target.y + 120, 5, 0xffffff, 1).setDepth(6);
             this.tweens.add({
               targets: wave2, scale: 20, alpha: 0, duration: 400, onComplete: () => wave2.destroy()
             });
             this.cameras.main.shake(250, 0.04);
          }

          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 35 : 18) *
                this.getDamageMultiplier(transLevel),
            ),
          );

          this.time.delayedCall(150, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 100,
              ease: "Expo.easeOut",
              onComplete: () => {
                attacker.play(this.getAnimKey("saitama", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      // Saitama Ki: He doesn't have "ki", so he just does a "Normal Punch" that creates a wind pressure blast
      attacker.play(this.getAnimKey("saitama", transLevel, "attack"));

      // Small dash forward
      this.tweens.add({ targets: attacker, x: attacker.x + (attacker.x < target.x ? 20 : -20), duration: 50, yoyo: true });
      
      this.time.delayedCall(50, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 1.0, rate: 0.8 }); // deeper sound for air pressure

        const hand = this.getHandPosition(isPlayer);
        
        const blastsCount = isComboFinisher ? 5 : 1;
        
        // Huge screen flash for the punch force
        this.createScreenFlash(0xffffff, 200, 0.5);
        this.cameras.main.shake(150, 0.02);

        for (let i = 0; i < blastsCount; i++) {
           this.time.delayedCall(i * 80, () => {
              if (!this.scene.isActive()) return;

              if (i > 0 && this.cache.audio.exists("sfx_attack")) {
                 this.sound.play("sfx_attack", { volume: 1.0, rate: 1.5 });
              }
              
              // Wind pressure (Giant expanding ellipse)
              const waveY = hand.y + Phaser.Math.Between(-20, 20);
              const blast = this.add.ellipse(hand.x, waveY, 40, 60, 0xffffff, 0.7).setDepth(5);
              const core = this.add.ellipse(hand.x, waveY, 20, 30, 0xffffff, 1).setDepth(6);
              
              // Wind lines
              const lines: Phaser.GameObjects.Rectangle[] = [];
              for(let j=0; j<3; j++) {
                  const line = this.add.rectangle(hand.x, waveY + Phaser.Math.Between(-30, 30), Phaser.Math.Between(40, 80), Phaser.Math.Between(2, 6), 0xffffff, 0.5).setDepth(5);
                  lines.push(line);
              }

              this.tweens.add({
                targets: [blast, core, ...lines],
                x: target.x + (attacker.x < target.x ? 200 : -200),
                scale: i === blastsCount - 1 ? 6 : 3, // Last one is HUGE
                alpha: 0,
                duration: 200,
                ease: "Power2",
                onComplete: () => {
                  blast.destroy();
                  core.destroy();
                  lines.forEach(l => l.destroy());
                  if (!this.scene.isActive()) return;
                  
                  this.createImpactEffect(target.x, target.y + 120, 0xffffff);
                  this.cameras.main.shake(100, 0.03);
                  
                  this.takeDamage(
                    !isPlayer,
                    Math.floor(
                      (isComboFinisher ? 15 : 20) *
                        this.getDamageMultiplier(transLevel),
                    ),
                  );
                },
              });
           });
        }

        this.time.delayedCall(200 + (blastsCount * 80), () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("saitama", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performFrierenAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      attacker.play(this.getAnimKey("frieren", transLevel, "attack"));
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -40 : 40),
        duration: 150,
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.0 });
          this.createImpactEffect(target.x, target.y + 120, 0xffffff);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 15 : 8) * this.getDamageMultiplier(transLevel),
            ),
          );

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              duration: 150,
              onComplete: () => {
                attacker.play(this.getAnimKey("frieren", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      attacker.play(this.getAnimKey("frieren", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 1.0 });

        const hand = this.getHandPosition(isPlayer);
        const beam = this.add
          .rectangle(
            hand.x,
            hand.y,
            Math.abs(target.x - attacker.x),
            4,
            0xffffff,
          )
          .setOrigin(isPlayer ? 0 : 1, 0.5)
          .setDepth(5);
        this.tweens.add({
          targets: beam,
          alpha: 0,
          duration: 150,
          onComplete: () => beam.destroy(),
        });

        this.createImpactEffect(target.x, target.y + 120, 0xffffff);
        this.takeDamage(
          !isPlayer,
          Math.floor(
            (isComboFinisher ? 20 : 12) * this.getDamageMultiplier(transLevel),
          ),
        );

        this.time.delayedCall(250, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("frieren", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performChapolimAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      attacker.play(this.getAnimKey("chapolim", transLevel, "attack"));
      this.tweens.add({
        targets: attacker,
        x: target.x + (attacker.x < target.x ? -30 : 30),
        y: target.y - 30,
        duration: 150,
        onComplete: () => {
          if (!this.scene.isActive()) return;
          if (this.cache.audio.exists("sfx_attack"))
            this.sound.play("sfx_attack", { volume: 1.5 });

          const hammer = this.add
            .rectangle(target.x, target.y + 120, 20, 10, 0xff0000)
            .setDepth(6);
          this.tweens.add({
            targets: hammer,
            alpha: 0,
            y: target.y + 120,
            duration: 150,
            onComplete: () => hammer.destroy(),
          });

          this.createImpactEffect(target.x, target.y + 120, 0xffff00);
          this.takeDamage(
            !isPlayer,
            Math.floor(
              (isComboFinisher ? 25 : 15) *
                this.getDamageMultiplier(transLevel),
            ),
          );
          this.cameras.main.shake(100, 0.02);

          this.time.delayedCall(200, () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              duration: 150,
              onComplete: () => {
                attacker.play(this.getAnimKey("chapolim", transLevel, "idle"));
                this.setActionState(isPlayer, false);
              },
            });
          });
        },
      });
    } else {
      attacker.play(this.getAnimKey("chapolim", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 0.8 });

        const hand = this.getHandPosition(isPlayer);
        const heart = this.add
          .text(hand.x, hand.y, "CH", {
            color: "#ffff00",
            fontSize: "16px",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(5);

        this.tweens.add({
          targets: heart,
          x: target.x,
          duration: 200,
          onComplete: () => {
            heart.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0xffff00);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 15 : 8) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        this.time.delayedCall(300, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("chapolim", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performGojoAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;

    if (attackType === "melee") {
      attacker.setAlpha(0);
      this.createImpactEffect(attacker.x, attacker.y + 120, 0x00ffff);

      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        attacker.setAlpha(1);
        attacker.x = target.x + (attacker.x < target.x ? -30 : 30);
        attacker.play(this.getAnimKey("gojo", transLevel, "attack"));

        if (this.cache.audio.exists("sfx_attack"))
          this.sound.play("sfx_attack", { volume: 1.2 });
        this.createImpactEffect(target.x, target.y + 120, 0x00ffff);
        this.takeDamage(
          !isPlayer,
          Math.floor(
            (isComboFinisher ? 22 : 12) * this.getDamageMultiplier(transLevel),
          ),
        );

        this.time.delayedCall(200, () => {
          if (!this.scene.isActive()) return;
          attacker.setAlpha(0);
          this.createImpactEffect(attacker.x, attacker.y + 120, 0x00ffff);

          this.time.delayedCall(100, () => {
            if (!this.scene.isActive()) return;
            attacker.setAlpha(1);
            attacker.x = startX;
            attacker.play(this.getAnimKey("gojo", transLevel, "idle"));
            this.setActionState(isPlayer, false);
          });
        });
      });
    } else {
      attacker.play(this.getAnimKey("gojo", transLevel, "attack"));
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive()) return;
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { volume: 1.0 });

        const orbColor = Math.random() > 0.5 ? 0xff0000 : 0x0000ff;
        const hand = this.getHandPosition(isPlayer);
        const orb = this.add.circle(hand.x, hand.y, 10, orbColor).setDepth(5);

        this.tweens.add({
          targets: orb,
          x: target.x,
          duration: 150,
          onComplete: () => {
            orb.destroy();
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, orbColor);
            this.takeDamage(
              !isPlayer,
              Math.floor(
                (isComboFinisher ? 20 : 10) *
                  this.getDamageMultiplier(transLevel),
              ),
            );
          },
        });

        this.time.delayedCall(300, () => {
          if (!this.scene.isActive()) return;
          attacker.play(this.getAnimKey("gojo", transLevel, "idle"));
          this.setActionState(isPlayer, false);
        });
      });
    }
  }

  performGenericAttack(
    isPlayer: boolean,
    attackType: "melee" | "ki",
    comboCount: number,
    isComboFinisher: boolean,
  ) {
    const attacker = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
    const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const attackerData = isPlayer ? this.playerData : this.enemyData;

    // 1. Windup (Hop Back & Rotate)
    const windupDist = isPlayer ? -60 : 60;
    const rotDir = isPlayer ? -0.3 : 0.3;

    this.tweens.add({
      targets: attacker,
      x: startX + windupDist,
      y: startY - 20,
      rotation: rotDir,
      scaleX: 2.8,
      scaleY: 3.2,
      duration: 150, // Slightly longer windup for impact
      ease: "Back.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;

        if (attackType === "melee") {
          // MELEE: Quick Lunge with Follow-Through
          const trailTimer = this.time.addEvent({
            delay: 15,
            callback: () => {
              if (!this.scene.isActive() || !attacker.active) return;
              const ghost = this.add
                .sprite(
                  attacker.x,
                  attacker.y,
                  attacker.texture.key,
                  attacker.frame.name,
                )
                .setOrigin(0.5, 0.5)
                .setScale(attacker.scaleX, attacker.scaleY)
                .setRotation(attacker.rotation)
                .setFlipX(attacker.flipX)
                .setTint(0x00ffff)
                .setAlpha(0.6)
                .setDepth(0);
              this.tweens.add({
                targets: ghost,
                alpha: 0,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 150,
                onComplete: () => ghost.destroy(),
              });
            },
            repeat: 10,
          });

          // Lunge Forward
          attacker.play(
            this.getAnimKey(attackerData.key, transLevel, "attack"),
          );

          const lungeDist = isComboFinisher
            ? isPlayer
              ? -50
              : 50
            : isPlayer
              ? -30
              : 30;

          this.tweens.add({
            targets: attacker,
            x: target.x + lungeDist, // Deeper lunge
            y: startY,
            rotation: -rotDir * 2.5, // More rotation for follow-through
            scaleX: 3.4,
            scaleY: 2.6,
            duration: isComboFinisher ? 80 : 100, // Faster lunge
            ease: "Expo.easeIn",
            onComplete: () => {
              trailTimer.remove();
              if (!this.scene.isActive()) return;

              // Impact
              if (this.cache.audio.exists("sfx_attack"))
                this.sound.play("sfx_attack", { volume: 1.2 });

              const baseDamage = isComboFinisher ? 20 : 10;
              const damage = Math.floor(
                baseDamage * this.getDamageMultiplier(transLevel),
              );

              this.takeDamage(!isPlayer, damage);
              this.modifyKi(isPlayer, 5);

              // Visual Impact
              this.cameras.main.shake(
                isComboFinisher ? 200 : 100,
                isComboFinisher ? 0.02 : 0.01,
              );

              if (isComboFinisher) {
                const comboText = this.add
                  .text(target.x, target.y - 100, "COMBO FINISH!", {
                    fontSize: "24px",
                    color: "#ff0000",
                    fontStyle: "bold",
                  })
                  .setOrigin(0.5)
                  .setDepth(20);
                this.tweens.add({
                  targets: comboText,
                  y: target.y - 150,
                  alpha: 0,
                  duration: 1000,
                  onComplete: () => comboText.destroy(),
                });
              }

              this.createImpactEffect(target.x, target.y + 120, 0xffffff);

              // Target hit flash
              this.tweens.add({
                targets: target,
                alpha: 0.5,
                yoyo: true,
                duration: 50,
                repeat: 1,
              });

              // Knockback Target
              const knockbackDist = isComboFinisher
                ? isPlayer
                  ? 80
                  : -80
                : isPlayer
                  ? 30
                  : -30;
              this.tweens.add({
                targets: target,
                x: target.x + knockbackDist,
                duration: 100,
                yoyo: true,
                ease: "Sine.easeOut",
              });

              // 3. Recover (Return to start)
              this.time.delayedCall(150, () => {
                if (!this.scene.isActive()) return;
                attacker.play(
                  this.getAnimKey(attackerData.key, transLevel, "idle"),
                );
                this.tweens.add({
                  targets: attacker,
                  x: startX,
                  y: startY,
                  rotation: 0,
                  scaleX: 3,
                  scaleY: 3,
                  duration: 200,
                  ease: "Sine.easeInOut",
                  onComplete: () => {
                    this.setActionState(isPlayer, false);
                  },
                });
              });
            },
          });
        } else {
          // BEAM: Gather energy then shoot
          const blastColor = attackerData.specialColor || 0x00ffff;

          // Gathering energy spark
          const hand = this.getHandPosition(isPlayer);
          const gatherSpark = this.add
            .circle(hand.x, hand.y, 2, blastColor)
            .setDepth(6);
          this.tweens.add({
            targets: gatherSpark,
            scale: 8,
            alpha: 0.8,
            duration: 150,
            yoyo: true,
            onComplete: () => gatherSpark.destroy(),
          });

          attacker.play(
            this.getAnimKey(attackerData.key, transLevel, "attack"),
          );
          this.tweens.add({
            targets: attacker,
            x: startX + (attacker.x < target.x ? 30 : -30), // Forward lunge to throw
            y: startY,
            rotation: -rotDir * 0.8,
            scaleX: 3.2,
            scaleY: 2.8,
            duration: 150,
            ease: "Power2",
            onComplete: () => {
              if (!this.scene.isActive()) return;

              // Shoot Blast
              if (this.cache.audio.exists("sfx_beam"))
                this.sound.play("sfx_beam", { volume: 1.2 });

              // Attacker flash
              this.tweens.add({
                targets: attacker,
                alpha: 0.7,
                yoyo: true,
                duration: 50,
              });

              const hand = this.getHandPosition(isPlayer);
              const originX = hand.x;
              const originY = hand.y;

              // Muzzle flash at origin
              const muzzle = this.add
                .circle(originX, originY, 25, blastColor)
                .setDepth(4);
              muzzle.setBlendMode(Phaser.BlendModes.ADD);
              this.tweens.add({
                targets: muzzle,
                scale: 0,
                alpha: 0,
                duration: 200,
                onComplete: () => muzzle.destroy(),
              });

              const blastCount = isComboFinisher ? 3 : 1;

              for (let i = 0; i < blastCount; i++) {
                this.time.delayedCall(i * 100, () => {
                  if (!this.scene.isActive()) return;

                  const blast = this.add
                    .circle(originX, originY, 18, blastColor)
                    .setDepth(5);
                  const core = this.add
                    .circle(blast.x, blast.y, 10, 0xffffff)
                    .setDepth(6);
                  blast.setBlendMode(Phaser.BlendModes.ADD);

                  // Continuous Beam trail
                  const trailLine = this.add.graphics().setDepth(3);
                  trailLine.setBlendMode(Phaser.BlendModes.ADD);

                  const trailUpdateEvent = this.time.addEvent({
                    delay: 10,
                    callback: () => {
                      if (!this.scene.isActive() || !blast.active) return;
                      trailLine.clear();
                      trailLine.lineStyle(20, blastColor, 0.6);
                      trailLine.lineBetween(originX, originY, blast.x, blast.y);
                      trailLine.lineStyle(10, 0xffffff, 0.8);
                      trailLine.lineBetween(originX, originY, blast.x, blast.y);
                    },
                    loop: true,
                  });

                  this.tweens.add({
                    targets: [blast, core],
                    x: target.x,
                    duration: 120, // Faster beam
                    ease: "Linear",
                    onComplete: () => {
                      trailUpdateEvent.remove();
                      this.tweens.add({
                        targets: trailLine,
                        alpha: 0,
                        duration: 150,
                        onComplete: () => trailLine.destroy(),
                      });
                      blast.destroy();
                      core.destroy();

                      if (!this.scene.isActive()) return;

                      // Impact
                      if (this.cache.audio.exists("sfx_attack"))
                        this.sound.play("sfx_attack", { volume: 1.5 });

                      const baseDamage = isComboFinisher ? 15 : 10;
                      const damage = Math.floor(
                        baseDamage * this.getDamageMultiplier(transLevel),
                      );

                      this.takeDamage(!isPlayer, damage);
                      this.modifyKi(isPlayer, 5);

                      // Visual Impact
                      this.createImpactEffect(
                        target.x,
                        target.y + 120,
                        blastColor,
                        "beam",
                      );

                      // Target hit flash
                      this.tweens.add({
                        targets: target,
                        alpha: 0.5,
                        yoyo: true,
                        duration: 50,
                        repeat: 2,
                      });
                    },
                  });
                });
              }

              // Return
              this.tweens.add({
                targets: attacker,
                x: startX,
                y: startY,
                rotation: 0,
                scaleX: 3,
                scaleY: 3,
                duration: 300,
                ease: "Back.easeOut",
                delay: 150 + blastCount * 100,
                onComplete: () => {
                  if (this.scene.isActive()) {
                    attacker.play(
                      this.getAnimKey(attackerData.key, transLevel, "idle"),
                    );
                    this.setActionState(isPlayer, false);
                  }
                },
              });
            },
          });
        }
      },
    });
  }

  performCharge(isPlayer: boolean) {
    if (isPlayer && this.p1ActionActive) return;
    if (!isPlayer && this.p2ActionActive) return;
    if (this.isBattleOver) return;

    this.setActionState(isPlayer, true);
    this.modifyKi(isPlayer, 25);
    const sprite = isPlayer ? this.player : this.enemy;

    // FIX: Moved charge aura down to +60 (Chest level)
    const aura = this.add.circle(
      sprite.x,
      sprite.y + 60,
      10,
      isPlayer ? 0x3498db : 0xe74c3c,
      0.6,
    );
    this.children.moveBelow(aura, sprite);

    this.tweens.add({
      targets: aura,
      scale: 8,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        if (this.scene.isActive()) {
          aura.destroy();
          this.setActionState(isPlayer, false);
        }
      },
    });
  }

  performTransform(isPlayer: boolean) {
    if (this.isBattleOver) return;
    const data = isPlayer ? this.playerData : this.enemyData;
    const ki = isPlayer ? this.playerKi : this.enemyKi;
    const currentLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const sprite = isPlayer ? this.player : this.enemy;

    // Check max transformation level
    let maxLevel = 1;
    if (data.key === "goku" || data.key === "vegeta" || data.key === "naruto")
      maxLevel = 2; // Goku, Vegeta, Naruto have 2 transformations

    if (!data.transformAvailable || currentLevel >= maxLevel || ki < 100)
      return;

    this.setActionState(isPlayer, true);
    this.modifyKi(isPlayer, -100);

    const nextLevel = currentLevel + 1;
    if (isPlayer) this.playerTransformLevel = nextLevel;
    else this.enemyTransformLevel = nextLevel;

    const isUI = data.key === "goku" && nextLevel === 2;
    const isUE = data.key === "vegeta" && nextLevel === 2;
    const isSageMode = data.key === "naruto" && nextLevel === 1;
    const isKuramaMode = data.key === "naruto" && nextLevel === 2;

    let auraColor = 0xffd700;
    let ringColor = 0xffff00;
    let transformText = `${data.name} TRANSFORMED!`;

    if (isUI) {
      auraColor = 0xffffff;
      ringColor = 0x00ffff;
      transformText = "ULTRA INSTINCT!";
    } else if (isUE) {
      auraColor = 0x9b59b6; // Purple
      ringColor = 0xff00ff; // Magenta
      transformText = "ULTRA EGO!";
    } else if (data.key === "gohan") {
      auraColor = 0x8a2be2; // Violet
      ringColor = 0xff00ff; // Magenta
      transformText = "BEAST FORM!";
    } else if (data.key === "piccolo") {
      auraColor = 0xff8800; // Orange
      ringColor = 0xffaa00; // Light Orange
      transformText = "ORANGE PICCOLO!";
    } else if (data.key === "cell") {
      auraColor = 0x00ff00; // Green
      ringColor = 0x00aa00; // Dark Green
      transformText = "PERFECT CELL!";
    } else if (data.key === "optimus") {
      auraColor = 0x3498db; // Blue
      ringColor = 0x2980b9; // Dark Blue
      transformText = "TRUCK MODE!";
    } else if (data.key === "minipekka") {
      auraColor = 0xff0000; // Red
      ringColor = 0xaa0000; // Dark Red
      transformText = "RAGE MODE!";
    } else if (data.key === "cyberninja") {
      auraColor = 0x00eaff; // Cyan
      ringColor = 0x0088ff; // Blue
      transformText = "OVERDRIVE!";
    } else if (isSageMode) {
      auraColor = 0xffaa00; // Orange/Yellow
      ringColor = 0xff4400; // Reddish orange
      transformText = "SAGE MODE!";
    } else if (isKuramaMode) {
      auraColor = 0xffff00; // Bright Yellow
      ringColor = 0xffaa00; // Orange
      transformText = "KURAMA LINK MODE!";
    } else if (data.key === "thukuna") {
      auraColor = 0x8b0000; // Dark Red
      ringColor = 0x000000; // Black
      transformText = "TRUE FORM!";
    } else if (data.key === "gojo") {
      auraColor = 0x00ffff; // Bright Blue
      ringColor = 0xffffff; // White
      transformText = "LIMITLESS!";
    } else if (data.key === "saitama") {
      auraColor = 0xffffff; // White/Neutral for Saitama
      ringColor = 0xff0000; // Red for the intensity
      transformText = "SERIOUS MODE!";
    }

    const animKeyTransform = this.getAnimKey(
      data.key,
      currentLevel,
      "transform",
    );
    sprite.play(animKeyTransform);

    // 1. Initial Charge Up (Screen darkens significantly)
    const darkenColor = data.key === "thukuna" ? 0x4a0000 : 0x000000;
    const darken = this.add
      .rectangle(480, 270, 960, 540, darkenColor, 0)
      .setDepth(1);
    this.tweens.add({ targets: darken, fillAlpha: 0.7, duration: 800 });

    let darkAuraElements: Phaser.GameObjects.GameObject[] = [];
    if (data.key === "thukuna") {
      // Pulsating dark red/black aura behind him
      for (let i = 0; i < 3; i++) {
        const auraRing = this.add
          .circle(sprite.x, sprite.y, 40 + i * 20, 0x8b0000, 0.3)
          .setDepth(1);
        auraRing.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: auraRing,
          scale: 3 + i,
          alpha: { start: 0.5, end: 0 },
          duration: 800 + i * 200,
          repeat: -1,
          yoyo: false,
        });
        darkAuraElements.push(auraRing);
      }

      // Rising dark energy particles
      for (let i = 0; i < 15; i++) {
        const darkParticle = this.add
          .circle(
            sprite.x + Phaser.Math.Between(-60, 60),
            sprite.y + Phaser.Math.Between(0, 100),
            Phaser.Math.Between(4, 12),
            0x000000,
            0.7,
          )
          .setDepth(2);
        this.tweens.add({
          targets: darkParticle,
          y: sprite.y - Phaser.Math.Between(150, 300),
          x: darkParticle.x + Phaser.Math.Between(-30, 30),
          alpha: 0,
          scale: 0.5,
          duration: Phaser.Math.Between(600, 1200),
          repeat: -1,
        });
        darkAuraElements.push(darkParticle);
      }
      this.cameras.main.shake(800, 0.01);
    }

    // Gathering energy particles
    for (let i = 0; i < 20; i++) {
      const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
      const distance = Phaser.Math.Between(100, 300);
      const startX = sprite.x + Math.cos(angle) * distance;
      const startY = sprite.y + Math.sin(angle) * distance;

      const particle = this.add
        .circle(startX, startY, Phaser.Math.Between(2, 4), auraColor)
        .setDepth(2)
        .setAlpha(0);

      this.tweens.add({
        targets: particle,
        x: sprite.x,
        y: sprite.y,
        alpha: { start: 0, end: 1 },
        duration: Phaser.Math.Between(400, 800),
        ease: "Cubic.easeIn",
        onComplete: () => particle.destroy(),
      });
    }

    // Pre-transform shake and float
    this.tweens.add({
      targets: sprite,
      x: sprite.x + (isPlayer ? 5 : -5),
      yoyo: true,
      repeat: 15,
      duration: 40,
      onComplete: () => {
        if (!this.scene.isActive()) return;

        // 2. The Explosion / Flash
        // FX: Massive pillar of light
        const pillar = this.add
          .rectangle(sprite.x, sprite.y, 150, 1200, auraColor)
          .setAlpha(0)
          .setDepth(2);
        pillar.setBlendMode(Phaser.BlendModes.ADD);

        // Float up slightly during the flash
        this.tweens.add({
          targets: sprite,
          y: sprite.y - 80,
          duration: 500,
          yoyo: true,
          ease: "Sine.easeInOut",
          onYoyo: () => {
            if (!this.scene.isActive()) return;

            let texKey = `${data.key}_ssj`;
            if (isUI || isUE || isKuramaMode) texKey = `${data.key}_ui`;

            if (this.textures.exists(texKey)) {
              sprite.setTexture(texKey);
              const animKeyIdle = this.getAnimKey(data.key, nextLevel, "idle");
              if (this.anims.exists(animKeyIdle)) sprite.play(animKeyIdle);
            }

            // Big Flash & Shake
            if (data.key === "thukuna") {
              // Invert colors momentarily for an "impact frame" feel
              this.cameras.main.flash(800, 255, 0, 0, true);

              // Thukuna specific slash effects - make them sharper and cleaner
              for (let i = 0; i < 8; i++) {
                this.time.delayedCall(i * 60, () => {
                  if (!this.scene.isActive()) return;
                  const cx = sprite.x + Phaser.Math.Between(-100, 100);
                  const cy = sprite.y + Phaser.Math.Between(-150, 150);
                  const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
                  const length = Phaser.Math.Between(100, 250);

                  const slash = this.add.graphics().setDepth(15);
                  // White core with red outline for a sharp cursed energy slash
                  slash.lineStyle(6, 0xff0000, 0.8);
                  slash.beginPath();
                  slash.moveTo(
                    cx - (Math.cos(angle) * length) / 2,
                    cy - (Math.sin(angle) * length) / 2,
                  );
                  slash.lineTo(
                    cx + (Math.cos(angle) * length) / 2,
                    cy + (Math.sin(angle) * length) / 2,
                  );
                  slash.strokePath();

                  slash.lineStyle(2, 0xffffff, 1);
                  slash.beginPath();
                  slash.moveTo(
                    cx - (Math.cos(angle) * length) / 2,
                    cy - (Math.sin(angle) * length) / 2,
                  );
                  slash.lineTo(
                    cx + (Math.cos(angle) * length) / 2,
                    cy + (Math.sin(angle) * length) / 2,
                  );
                  slash.strokePath();

                  this.tweens.add({
                    targets: slash,
                    alpha: 0,
                    scale: 1.2,
                    duration: 150,
                    ease: "Expo.easeOut",
                    onComplete: () => slash.destroy(),
                  });

                  if (this.cache.audio.exists("sfx_hit"))
                    this.sound.play("sfx_hit", { volume: 0.3, rate: 1.5 });
                });
              }

              // Massive dark red aura burst (Domain Expansion style)
              const redBurst = this.add
                .circle(sprite.x, sprite.y, 5, 0x000000)
                .setDepth(1);
              redBurst.setStrokeStyle(10, 0x8b0000);
              this.tweens.add({
                targets: redBurst,
                scale: 150,
                alpha: 0,
                strokeWidth: 0,
                duration: 1000,
                ease: "Cubic.easeOut",
                onComplete: () => redBurst.destroy(),
              });
            } else {
              this.cameras.main.flash(800, 255, 255, 255, true);
            }

            this.cameras.main.shake(1000, 0.05);
            if (this.cache.audio.exists("sfx_transform"))
              this.sound.play("sfx_transform", { volume: 1.5 });

            // Pillar Animation
            pillar.setAlpha(1).setScale(0, 1);
            this.tweens.add({
              targets: pillar,
              scaleX: 4,
              alpha: 0,
              duration: 1000,
              ease: "Power2",
              onComplete: () => {
                if (this.scene.isActive()) pillar.destroy();
              },
            });

            // Shockwave Rings (Multiple, expanding outwards)
            for (let i = 0; i < 4; i++) {
              this.time.delayedCall(i * 100, () => {
                if (!this.scene.isActive()) return;
                const ring = this.add
                  .circle(sprite.x, sprite.y, 10, auraColor, 0)
                  .setStrokeStyle(8 - i * 1.5, ringColor)
                  .setDepth(2);
                this.tweens.add({
                  targets: ring,
                  scale: 30 + i * 10,
                  alpha: { start: 1, end: 0 },
                  duration: 800,
                  ease: "Cubic.easeOut",
                  onComplete: () => {
                    if (this.scene.isActive()) ring.destroy();
                  },
                });
              });
            }

            // Update continuous charge aura color
            const chargeAura = isPlayer ? this.p1Aura : this.p2Aura;
            if (chargeAura && chargeAura.active) {
              (chargeAura as Phaser.GameObjects.Shape).setFillStyle(
                auraColor,
                0.6,
              );
            }

            // Intense particles bursting outwards
            for (let i = 0; i < 40; i++) {
              const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
              const speed = Phaser.Math.Between(100, 400);
              const spark = this.add
                .circle(
                  sprite.x,
                  sprite.y,
                  Phaser.Math.Between(3, 8),
                  ringColor,
                )
                .setDepth(3);
              spark.setBlendMode(Phaser.BlendModes.ADD);

              this.tweens.add({
                targets: spark,
                x: spark.x + Math.cos(angle) * speed,
                y:
                  spark.y +
                  Math.sin(angle) * speed -
                  Phaser.Math.Between(50, 150), // Upward bias
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(800, 1500),
                ease: "Power2",
                onComplete: () => spark.destroy(),
              });
            }
          },
          onComplete: () => {
            if (!this.scene.isActive()) return;
            // Remove darken overlay
            this.tweens.add({
              targets: darken,
              fillAlpha: 0,
              duration: 500,
              onComplete: () => {
                darken.destroy();
                this.setActionState(isPlayer, false);
              },
            });

            if (darkAuraElements.length > 0) {
              darkAuraElements.forEach((el) => {
                this.tweens.add({
                  targets: el,
                  alpha: 0,
                  duration: 500,
                  onComplete: () => el.destroy(),
                });
              });
            }
          },
        });

        // Dramatic text display
        let textFill = "#ffffff";
        let textStroke = "#000000";
        if (data.key === "thukuna") {
          textFill = "#ff0000";
          textStroke = "#330000";
        }

        const textObj = this.add
          .text(480, 200, transformText, {
            fontFamily: "Impact, sans-serif",
            fontSize: "64px",
            color: textFill,
            stroke: textStroke,
            strokeThickness: 8,
            fontStyle: "italic",
          })
          .setOrigin(0.5)
          .setDepth(10)
          .setAlpha(0)
          .setScale(0.5);

        this.tweens.add({
          targets: textObj,
          alpha: 1,
          scale: 1.2,
          duration: 300,
          yoyo: true,
          hold: 1000,
          ease: "Back.easeOut",
          onComplete: () => textObj.destroy(),
        });

        this.log(transformText);
      },
    });
  }

  // --- ANIMATION SEQUENCE (FIXED: NO MOVEMENT) ---
  animateCastSequence(
    attacker: Phaser.GameObjects.Sprite,
    isPlayer: boolean,
    tintColor: number,
    animKeySpecial: string,
    animKeyIdle: string,
    onFireCallback: () => void,
  ) {
    attacker.play(animKeySpecial);

    // FIXED: Removed x movement (targets: attacker, x: ...)
    // We only scale to show effort/charging. This prevents the beam from detaching or spawning behind.

    const rotDir = isPlayer ? -0.15 : 0.15;

    // 1. Squash/Stretch (Charge)
    this.tweens.add({
      targets: attacker,
      scaleX: 3.5, // Stretch wide
      scaleY: 2.5, // Squash down
      rotation: rotDir,
      tint: tintColor,
      duration: 50,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        attacker.setTint(0xffffff);

        // Flash screen slightly to indicate power
        this.cameras.main.flash(100, 255, 255, 255, false);

        // Snap forward
        this.tweens.add({
          targets: attacker,
          rotation: -rotDir,
          scaleX: 2.8,
          scaleY: 3.2,
          duration: 50,
          ease: "Power2",
        });

        // FIRE IMMEDIATELY
        onFireCallback();

        // 2. HOLD (Stay in pose)
        this.time.delayedCall(500, () => {
          if (!this.scene.isActive()) return;

          // 3. Recovery (Return to Normal)
          this.tweens.add({
            targets: attacker,
            scaleX: 3,
            scaleY: 3,
            rotation: 0,
            duration: 200,
            ease: "Quad.easeOut",
            onComplete: () => {
              if (!this.scene.isActive()) return;
              attacker.clearTint();
              // Let onSpecialComplete handle returning to idle
            },
          });
        });
      },
    });
  }

  performSpecial(isPlayer: boolean, isSuper: boolean) {
    if (this.isBattleOver) return;
    const ki = isPlayer ? this.playerKi : this.enemyKi;
    const data = isPlayer ? this.playerData : this.enemyData;
    const cost = isSuper ? 100 : 50;
    const sprite = isPlayer ? this.player : this.enemy;

    if (ki < cost) {
      if (isPlayer) this.log(`Need ${cost} Ki!`);
      return;
    }

    this.setActionState(isPlayer, true);
    this.modifyKi(isPlayer, -cost);

    if (isPlayer) {
      this.p1ComboCount = 0;
    } else {
      this.p2ComboCount = 0;
    }

    if (data.key === "minipekka") {
      if (isSuper) this.specialMegaPancake(isPlayer);
      else this.specialPancake(isPlayer, false);
    } else {
      const transLevel = isPlayer
        ? this.playerTransformLevel
        : this.enemyTransformLevel;
      const animKeySpecial = this.getAnimKey(data.key, transLevel, "special");
      const animKeyIdle = this.getAnimKey(data.key, transLevel, "idle");
      this.animateCastSequence(
        sprite,
        isPlayer,
        data.specialColor,
        animKeySpecial,
        animKeyIdle,
        () => {
          switch (data.key) {
            case "goku": {
              const fighter = getFighter("goku");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "spiderman":
              if (isSuper) this.specialMaximumSpider(isPlayer);
              else this.specialWebPullPunch(isPlayer);
              break;
            case "vegeta": {
              const fighter = getFighter("vegeta");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "gohan":
              if (isSuper) this.specialFatherSonKamehameha(isPlayer);
              else
                this.specialBeam(
                  isPlayer,
                  false,
                  0xffff00,
                  true,
                  false,
                  "masenko",
                );
              break;
            case "piccolo":
              if (isSuper) this.specialHellzoneGrenade(isPlayer);
              else this.specialMakanko(isPlayer, false);
              break;
            case "cell":
              if (isSuper) this.specialSolarKamehameha(isPlayer);
              else
                this.specialBeam(
                  isPlayer,
                  false,
                  0x00ff00,
                  true,
                  false,
                  "kamehameha",
                );
              break;
            case "leonardo":
              if (isSuper) this.specialNinjaBarrage(isPlayer);
              else this.specialSlash(isPlayer, false);
              break;
            case "frieren":
              if (isSuper) this.specialBlackHole(isPlayer);
              else this.specialZoltraak(isPlayer, false);
              break;
            case "optimus":
              if (isSuper) this.specialMatrixBlast(isPlayer);
              else this.specialMissiles(isPlayer, false);
              break;
            case "cyberninja":
              if (isSuper) this.specialCyberOverdrive(isPlayer);
              else this.specialPlasmaDash(isPlayer, false);
              break;
            case "chapolim":
              if (isSuper) this.specialAerolitos(isPlayer);
              else this.specialChipote(isPlayer);
              break;
            case "naruto":
              if (isSuper) this.specialRasenshuriken(isPlayer);
              else this.specialRasengan(isPlayer, false);
              break;
            case "batman":
              if (isSuper) this.specialTheDarkKnight(isPlayer);
              else this.specialBatarang(isPlayer);
              break;
            case "thukuna":
              if (isSuper) this.specialMalevolentShrine(isPlayer);
              else this.specialCleave(isPlayer);
              break;
            case "gojo":
              if (isSuper) this.specialHollowPurple(isPlayer);
              else this.specialRedAndBlue(isPlayer);
              break;
            case "obito":
              if (isSuper) this.specialTenTailsBeastBomb(isPlayer);
              else this.specialKamui(isPlayer);
              break;
            case "itachi":
              if (isSuper) this.specialTsukuyomi(isPlayer);
              else this.specialAmaterasu(isPlayer);
              break;
            case "jotaro":
              if (isSuper) this.specialOraOraOra(isPlayer);
              else this.specialStarFinger(isPlayer);
              break;
            case "madara":
              if (isSuper) this.specialTengaiShinsei(isPlayer);
              else this.specialMajesticDestroyerFlame(isPlayer);
              break;
            case "saitama":
              if (isSuper) this.specialSupremeHeadbutt(isPlayer);
              else this.specialSeriousPunch(isPlayer);
              break;
            case "static":
              if (isSuper) this.specialStaticBurst(isPlayer);
              else this.specialElectricDisc(isPlayer);
              break;
            default:
              this.specialBeam(
                isPlayer,
                isSuper,
                data.specialColor,
                false,
                false,
                "generic",
              );
              break;
          }
        },
      );
    }
  }

  private onSpecialComplete(isPlayer: boolean) {
    const data = isPlayer ? this.playerData : this.enemyData;
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const animKeyIdle = this.getAnimKey(data.key, transLevel, "idle");
    const attacker = isPlayer ? this.player : this.enemy;

    if (this.scene.isActive()) {
      attacker.play(animKeyIdle);
      this.setActionState(isPlayer, false);
    }
  }

  // Helper to calculate damage multiplier based on transformation level
  private getDamageMultiplier(transLevel: number): number {
    if (transLevel === 1) return 1.25; // 25% stronger
    if (transLevel === 2) return 1.5; // 50% stronger
    return 1.0;
  }

  // Helper to get EXACT hand position based on sprite flipping
  getHandPosition(isPlayer: boolean): { x: number; y: number } {
    const sprite = isPlayer ? this.player : this.enemy;
    const target = isPlayer ? this.enemy : this.player;
    // Default for all characters
    const xOffset = sprite.x < target.x ? 45 : -45; 
    const yOffset = 120; // Lowered from 84 so it aligns with hands visually rather than mouth
    return { x: sprite.x + xOffset, y: sprite.y + yOffset };
  }

  // REMASTERED SPECIAL ATTACKS (VISUALLY UPGRADED FOR ALL)
  // =========================================================================

  // 1. BEAM ENGINE (KAMEHAMEHA, GALICK GUN, MASENKO)
  private specialBeam(
    isP: boolean,
    isS: boolean,
    col: number,
    hasInner: boolean,
    vibrate: boolean,
    type: string,
  ) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    if (!attacker.active || !target.active) {
      this.setActionState(isP, false);
      return;
    }

    const baseDmg = isS ? 60 : 35;
    const dmg = Math.floor(baseDmg * this.getDamageMultiplier(transLevel));

    const size = isS ? 3.5 : 2.0;

    const hand = this.getHandPosition(isP);
    const endX = target.x;
    const distance = Math.abs(endX - hand.x) + 50;

    this.log(isS ? "SUPER ATTACK!" : type.toUpperCase() + "!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Charge Effect
    const chargeCore = this.add
      .circle(hand.x, hand.y, 2, 0xffffff)
      .setDepth(16);
    const chargeGlow = this.add
      .circle(hand.x, hand.y, 5, col)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.cameras.main.shake(400, 0.01);

    // Gathering particles
    const gatherParticles = this.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -150, max: 150 },
        scale: { start: 0.8, end: 0 },
        blendMode: "ADD",
        lifespan: 300,
        tint: col,
        gravityY: 0,
      })
      .setDepth(14);

    this.tweens.add({
      targets: [chargeCore, chargeGlow],
      scale: 12 * size,
      alpha: { start: 1, end: 0.8 },
      duration: 400,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!this.scene.isActive()) return;
        chargeCore.destroy();
        chargeGlow.destroy();
        gatherParticles.destroy();

        this.createScreenFlash(col, 200, 0.6);
        this.cameras.main.shake(300, 0.03);

        // The Beam Structure
        const originX = 0;

        // Outer Glow
        const beamOuter = this.add
          .rectangle(hand.x, hand.y, 0, 40 * size, col)
          .setOrigin(originX, 0.5)
          .setDepth(4)
          .setAlpha(0.6)
          .setBlendMode(Phaser.BlendModes.ADD);
        // Main Color Beam
        const beamMain = this.add
          .rectangle(hand.x, hand.y, 0, 24 * size, col)
          .setOrigin(originX, 0.5)
          .setDepth(5)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD);
        // Inner Core (White/Bright)
        const beamCore = this.add
          .rectangle(hand.x, hand.y, 0, 12 * size, 0xffffff)
          .setOrigin(originX, 0.5)
          .setDepth(6);

        beamOuter.scaleX = isP ? 1 : -1;
        beamMain.scaleX = isP ? 1 : -1;
        beamCore.scaleX = isP ? 1 : -1;

        // Beam Head/Tip
        const beamHeadGlow = this.add
          .circle(hand.x, hand.y, 30 * size, col)
          .setDepth(5)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.8);
        const beamHead = this.add
          .circle(hand.x, hand.y, 15 * size, 0xffffff)
          .setDepth(6);

        // Particles Emitter for Beam
        const particles = this.add
          .particles(0, 0, "particle", {
            speed: { min: 50, max: 200 },
            angle: { min: isP ? 160 : -20, max: isP ? 200 : 20 },
            scale: { start: 0.8 * size, end: 0 },
            blendMode: "ADD",
            lifespan: 300,
            tint: col,
          })
          .setDepth(7);

        // Animation
        this.tweens.add({
          targets: [beamOuter, beamMain, beamCore],
          width: distance,
          duration: type === "masenko" ? 100 : 200,
          ease: "Power2",
          onUpdate: () => {
            if (!this.scene.isActive()) return;

            const shakeAmt = vibrate ? 6 : 2;
            const jitterY = Phaser.Math.Between(-shakeAmt, shakeAmt);

            beamOuter.setPosition(hand.x, hand.y + jitterY);
            beamMain.setPosition(hand.x, hand.y + jitterY);
            beamCore.setPosition(hand.x, hand.y + jitterY / 2);

            // Tip Position
            const tipX = isP
              ? hand.x + beamMain.width
              : hand.x - beamMain.width;
            beamHeadGlow.setPosition(tipX, hand.y + jitterY);
            beamHead.setPosition(tipX, hand.y + jitterY);

            // Particle Emitter follows tip
            particles.setPosition(tipX, hand.y + jitterY);
          },
          onComplete: () => {
            if (!this.scene.isActive()) return;

            this.createImpactEffect(endX, hand.y, col, "beam");
            this.takeDamage(!isP, dmg);
            particles.stop();

            // Shockwave rings at impact
            for (let i = 0; i < 3; i++) {
              const ring = this.add
                .circle(endX, hand.y, 20, col)
                .setStrokeStyle(4 + size * 2, col)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 4 + i * 1.5 + size,
                alpha: { start: 1, end: 0 },
                duration: 200 + i * 50,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            // Fade Out
            this.tweens.add({
              targets: [beamOuter, beamMain, beamCore, beamHead, beamHeadGlow],
              alpha: 0,
              scaleY: 0,
              duration: 300,
              onComplete: () => {
                beamOuter.destroy();
                beamMain.destroy();
                beamCore.destroy();
                beamHead.destroy();
                beamHeadGlow.destroy();
                particles.destroy();
                this.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  // 2. MAKANKOSAPPO (DOUBLE HELIX REMASTER)
  private specialMakanko(isP: boolean, isS: boolean) {
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const baseDmg = isS ? 70 : 45;
    const dmg = Math.floor(baseDmg * this.getDamageMultiplier(transLevel));
    const hand = this.getHandPosition(isP);
    const endX = target.x;
    const distance = Math.abs(endX - hand.x) + 50;

    this.log("MAKANKOSAPPO!");

    // Charge Effect
    const chargeCore = this.add
      .circle(hand.x, hand.y, 2, 0xffffff)
      .setDepth(16);
    const chargeGlow = this.add
      .circle(hand.x, hand.y, 5, 0xffaa00)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.cameras.main.shake(400, 0.01);

    // Gathering particles
    const gatherParticles = this.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -100, max: 100 },
        scale: { start: 0.6, end: 0 },
        blendMode: "ADD",
        lifespan: 300,
        tint: 0xffaa00,
        gravityY: 0,
      })
      .setDepth(14);

    this.tweens.add({
      targets: [chargeCore, chargeGlow],
      scale: 10,
      alpha: { start: 1, end: 0.8 },
      duration: 400,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!this.scene.isActive()) return;
        chargeCore.destroy();
        chargeGlow.destroy();
        gatherParticles.destroy();

        this.createScreenFlash(0xffaa00, 200, 0.6);
        this.cameras.main.shake(300, 0.03);

        const originX = 0;

        // Thicker central beam
        const coreGlow = this.add
          .rectangle(hand.x, hand.y, 0, 20, 0xffaa00)
          .setOrigin(originX, 0.5)
          .setDepth(4)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.6);
        const core = this.add
          .rectangle(hand.x, hand.y, 0, 10, 0xffff00)
          .setOrigin(originX, 0.5)
          .setDepth(5)
          .setBlendMode(Phaser.BlendModes.ADD);
        coreGlow.scaleX = isP ? 1 : -1;
        core.scaleX = isP ? 1 : -1;

        // Two separate graphics for the double helix
        const spiral1 = this.add
          .graphics()
          .setDepth(6)
          .setBlendMode(Phaser.BlendModes.ADD);
        const spiral2 = this.add
          .graphics()
          .setDepth(6)
          .setBlendMode(Phaser.BlendModes.ADD);

        const muzzle = this.add
          .circle(hand.x, hand.y, 30, 0xffff00)
          .setDepth(7)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: muzzle,
          scale: 2,
          alpha: 0,
          duration: 200,
          repeat: 1,
        });

        if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

        this.tweens.add({
          targets: [core, coreGlow],
          width: distance,
          duration: 250,
          onUpdate: () => {
            if (!this.scene.isActive()) return;

            spiral1.clear();
            spiral2.clear();
            spiral1.lineStyle(6, 0xffaa00, 0.9); // Orange tint
            spiral2.lineStyle(6, 0xffd700, 0.9); // Gold tint

            const currentW = core.width;

            // Double Helix Math
            const freq = 0.08;
            const amp = 25;
            const speed = this.time.now * 0.03;

            spiral1.beginPath();
            spiral2.beginPath();

            for (let i = 0; i < currentW; i += 5) {
              const angle = i * freq + speed;
              const sx = isP ? hand.x + i : hand.x - i;

              // Spiral 1 (Sine)
              const sy1 = hand.y + Math.sin(angle) * amp;
              if (i === 0) spiral1.moveTo(sx, sy1);
              else spiral1.lineTo(sx, sy1);

              // Spiral 2 (Cosine / Opposite)
              const sy2 = hand.y + Math.sin(angle + Math.PI) * amp; // Phase shift PI
              if (i === 0) spiral2.moveTo(sx, sy2);
              else spiral2.lineTo(sx, sy2);
            }
            spiral1.strokePath();
            spiral2.strokePath();
          },
          onComplete: () => {
            if (!this.scene.isActive()) return;
            this.createScreenFlash(0xffaa00, 500, 1);
            this.cameras.main.shake(800, 0.08);
            this.createImpactEffect(endX, hand.y, 0xffaa00, "beam");
            this.takeDamage(!isP, dmg);

            // Shockwave rings at impact
            for (let i = 0; i < 5; i++) {
              const ring = this.add
                .circle(endX, hand.y, 40, 0xffaa00)
                .setStrokeStyle(10, 0xffaa00)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 10 + i * 5,
                alpha: { start: 1, end: 0 },
                duration: 400 + i * 100,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            this.tweens.add({
              targets: [core, coreGlow, spiral1, spiral2, muzzle],
              alpha: 0,
              duration: 250,
              onComplete: () => {
                if (this.scene.isActive()) {
                  core.destroy();
                  coreGlow.destroy();
                  spiral1.destroy();
                  spiral2.destroy();
                  muzzle.destroy();
                  this.onSpecialComplete(isP);
                }
              },
            });
          },
        });
      },
    });
  }

  // 4. KATANA SLASH (DIMENSIONAL CUT REMASTER)
  private specialSupremeHeadbutt(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const startX = isP ? this.player.x : this.enemy.x;
    const startY = isP ? this.player.y : this.enemy.y;
    const transLevel = isP ? this.playerTransformLevel : this.enemyTransformLevel;
    const dmg = Math.floor(130 * this.getDamageMultiplier(transLevel));
    const targetStartX = isP ? this.enemy.x : this.player.x;

    this.log("SUPREME HEADBUTT!");
    
    // Preparation: Wind gathering effect
    for(let i=0; i<15; i++) {
       const p = this.add.circle(attacker.x + Phaser.Math.Between(-60, 60), attacker.y + Phaser.Math.Between(-60, 60), Phaser.Math.Between(2, 4), 0xffffff, 0.8).setDepth(15);
       this.tweens.add({
         targets: p,
         x: attacker.x,
         y: attacker.y - 45,
         alpha: 0,
         scale: 0.2,
         duration: 600,
         onComplete: () => p.destroy()
       });
    }

    this.tweens.add({
      targets: attacker,
      x: attacker.x + (isP ? -60 : 60),
      duration: 500,
      ease: "Cubic.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;

        // Head glint
        const glow = this.add.circle(attacker.x, attacker.y - 45, 12, 0xffffff, 1).setDepth(20);
        this.tweens.add({ targets: glow, scale: 6, alpha: 0, duration: 200 });

        if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack", { volume: 2.5 });
        this.cameras.main.shake(150, 0.04);

        // DASH! (Almost instantaneous)
        this.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? 30 : -30),
          duration: 60,
          ease: "Linear",
          onComplete: () => {
            if (!this.scene.isActive()) return;

            glow.destroy();
            this.createScreenFlash(0xffffff, 500, 1);
            this.cameras.main.shake(800, 0.08);

            // Relativistic impact - White screen for a frame
            const flash = this.add.rectangle(480, 270, 960, 540, 0xffffff).setDepth(100).setAlpha(0);
            this.tweens.add({ targets: flash, alpha: 1, duration: 30, yoyo: true });

            this.createImpactEffect(target.x, target.y + 120, 0xffffff, "beam");
            this.takeDamage(!isP, dmg);

            // PHYSICS-BASED KNOCKBACK (Intense)
            this.tweens.add({
              targets: target,
              x: target.x + (attacker.x < target.x ? 400 : -400),
              y: target.y - 100,
              angle: isP ? 20 : -20,
              duration: 500,
              ease: "Expo.easeOut",
              onComplete: () => {
                if (!this.scene.isActive() || !target.active) return;
                this.tweens.add({
                  targets: target,
                  x: targetStartX,
                  y: startY,
                  angle: 0,
                  duration: 400,
                  ease: "Bounce.easeOut"
                });
              }
            });

            // Afterimage return
            this.time.delayedCall(500, () => {
              if (!this.scene.isActive()) return;
              this.tweens.add({
                targets: attacker,
                x: startX,
                duration: 200,
                ease: "Power2",
                onComplete: () => this.onSpecialComplete(isP)
              });
            });
          }
        });
      }
    });
  }

  private specialSeriousPunch(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const startX = isP ? this.player.x : this.enemy.x;
    const transLevel = isP ? this.playerTransformLevel : this.enemyTransformLevel;
    const dmg = Math.floor(110 * this.getDamageMultiplier(transLevel));
    const targetStartX = isP ? this.enemy.x : this.player.x;

    this.log("SERIOUS PUNCH!");
    
    // Slow dramatic walk
    attacker.play(this.getAnimKey("saitama", transLevel, "idle"));
    
    // Manga-style speed lines in the background
    const speedLines = this.add.graphics();
    const cx = 480;
    const cy = 270;
    speedLines.lineStyle(2, 0xffffff, 0.4);
    for(let i=0; i<60; i++) {
        const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
        const r1 = Phaser.Math.Between(150, 400);
        const r2 = 600;
        speedLines.beginPath();
        speedLines.moveTo(cx + Math.cos(angle)*r1, cy + Math.sin(angle)*r1);
        speedLines.lineTo(cx + Math.cos(angle)*r2, cy + Math.sin(angle)*r2);
        speedLines.strokePath();
    }
    speedLines.setDepth(0);
    this.tweens.add({ targets: speedLines, angle: 10, duration: 1200, alpha: 0.8 });

    this.tweens.add({
      targets: attacker,
      x: target.x + (attacker.x < target.x ? -120 : 120),
      duration: 1200,
      ease: "Power1.easeInOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        
        // Everything goes quiet for a second...
        this.time.delayedCall(300, () => {
          if (!this.scene.isActive()) return;

          attacker.play(this.getAnimKey("saitama", transLevel, "attack"));
          
          this.time.delayedCall(100, () => {
            if (!this.scene.isActive()) return;
            
            if (this.cache.audio.exists("sfx_explosion")) this.sound.play("sfx_explosion", { volume: 3.0 });
            this.createScreenFlash(0xffffff, 800, 1);
            this.cameras.main.shake(1000, 0.1);

            // ATMOSPHERIC SPLIT (Iconic)
            const splitLine = this.add.rectangle(480, target.y + 120, 960, 10, 0xffffff).setDepth(30).setAlpha(1);
            this.tweens.add({
               targets: splitLine,
               scaleY: 200,
               alpha: 0,
               duration: 800,
               onComplete: () => {
                 splitLine.destroy();
                 speedLines.destroy();
               }
            });

            // Particles flying away from impact
            for(let i=0; i<40; i++) {
               const p = this.add.rectangle(target.x, target.y + 120, Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10), Math.random() > 0.5 ? 0xffffff : 0xffaa00).setDepth(20);
               this.tweens.add({
                  targets: p,
                  x: p.x + (attacker.x < target.x ? 600 : -600) + Phaser.Math.Between(-150, 150),
                  y: p.y + Phaser.Math.Between(-400, 400),
                  angle: Phaser.Math.Between(0, 360),
                  alpha: 0,
                  duration: 1200,
                  onComplete: () => p.destroy()
               });
            }

            this.takeDamage(!isP, dmg);
            this.createImpactEffect(target.x, target.y + 120, 0xffffff, "beam");

            // Horizontal knockback that flies off screen briefly, then bounces back
            this.tweens.add({
              targets: target,
              x: target.x + (attacker.x < target.x ? 600 : -600),
              angle: isP ? 45 : -45,
              alpha: 0,
              duration: 300,
              ease: "Expo.easeOut",
              onComplete: () => {
                 this.time.delayedCall(200, () => {
                    if (!this.scene.isActive() || !target.active) return;
                    target.setX(isP ? 900 : 60);
                    this.tweens.add({ 
                      targets: target, 
                      x: targetStartX, 
                      angle: 0,
                      alpha: 1, 
                      duration: 400,
                      ease: "Bounce.easeOut"
                    });
                 });
              }
            });

            this.time.delayedCall(800, () => {
               if (!this.scene.isActive()) return;
               this.tweens.add({
                 targets: attacker,
                 x: startX,
                 duration: 300,
                 onComplete: () => this.onSpecialComplete(isP)
               });
            });
          });
        });
      }
    });
  }

  private specialElectricDisc(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP ? this.playerTransformLevel : this.enemyTransformLevel;
    const dmg = Math.floor(40 * this.getDamageMultiplier(transLevel));

    this.log("ELECTRIC DISC!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam", { volume: 0.8, rate: 0.7 });

    const hand = this.getHandPosition(isP);
    const disc = this.add.ellipse(hand.x, hand.y, 40, 10, 0x00ffff).setDepth(5);
    const discGlow = this.add.ellipse(hand.x, hand.y, 50, 15, 0x00ffff, 0.5).setDepth(4);

    this.tweens.add({
      targets: [disc, discGlow],
      x: target.x,
      y: target.y + 120,
      angle: 360,
      duration: 400,
      ease: "Quad.easeIn",
      onComplete: () => {
        disc.destroy();
        discGlow.destroy();
        if (!this.scene.isActive()) return;
        
        this.cameras.main.shake(150, 0.02);
        this.createImpactEffect(target.x, target.y + 120, 0x00ffff, "beam");
        this.takeDamage(!isP, dmg);
        
        // Zaps
        for(let i=0; i<8; i++) {
           const zap = this.add.graphics().lineStyle(2, 0x00ffff, 1);
           zap.beginPath();
           zap.moveTo(target.x, target.y + 120);
           zap.lineTo(target.x + Phaser.Math.Between(-80, 80), target.y + 120 + Phaser.Math.Between(-80, 80));
           zap.strokePath();
           this.time.delayedCall(100, () => zap.destroy());
        }
        
        this.onSpecialComplete(isP);
      }
    });
  }

  private specialStaticBurst(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP ? this.playerTransformLevel : this.enemyTransformLevel;
    const dmg = Math.floor(85 * this.getDamageMultiplier(transLevel));

    this.log("STATIC BURST!!!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam", { volume: 1.2, rate: 0.5 });
    
    // Zoom in
    this.cameras.main.zoomTo(1.2, 500, "Cubic.easeInOut", true);

    // Charge effect
    const charge = this.add.circle(attacker.x, attacker.y + 100, 10, 0x00ffff, 1).setDepth(5);
    this.tweens.add({
        targets: charge,
        scale: 6,
        alpha: 0.2,
        duration: 600,
        yoyo: true,
        repeat: 1
    });

    this.time.delayedCall(1200, () => {
        if (!this.scene.isActive()) return;
        charge.destroy();
        
        this.createScreenFlash(0x00ffff, 400, 0.6);
        this.cameras.main.shake(500, 0.05);

        // Huge electric beams from sky
        for(let i=0; i<5; i++) {
            const rx = target.x + (i - 2) * 40;
            const beam = this.add.rectangle(rx, target.y - 300, 10, 600, 0x00ffff).setOrigin(0.5, 0).setDepth(10).setAlpha(0.8);
            this.tweens.add({ targets: beam, width: 40, alpha: 0, duration: 300, onComplete: () => beam.destroy() });
        }

        this.createImpactEffect(target.x, target.y + 120, 0xffffff, "beam");
        this.takeDamage(!isP, dmg);

        this.time.delayedCall(500, () => {
            if (!this.scene.isActive()) return;
            this.cameras.main.zoomTo(1, 500, "Cubic.easeInOut", true);
            this.onSpecialComplete(isP);
        });
    });
  }

  private specialSlash(isP: boolean, isS: boolean) {
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const baseDmg = isS ? 55 : 30;
    const dmg = Math.floor(baseDmg * this.getDamageMultiplier(transLevel));
    const hand = this.getHandPosition(isP);

    this.log("KATANA SLASH!");
    if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack");

    // The Slash Graphic
    const slashGlow = this.add
      .graphics()
      .setDepth(4)
      .setBlendMode(Phaser.BlendModes.ADD);
    slashGlow.fillStyle(0x3498db, 0.6);

    const slash = this.add
      .graphics()
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.ADD);
    slash.fillStyle(0xffffff, 1);

    // Draw a growing crescent
    if (isP) {
      slashGlow.slice(
        0,
        0,
        80,
        Phaser.Math.DegToRad(-40),
        Phaser.Math.DegToRad(40),
        false,
      );
      slash.slice(
        0,
        0,
        60,
        Phaser.Math.DegToRad(-40),
        Phaser.Math.DegToRad(40),
        false,
      );
    } else {
      slashGlow.slice(
        0,
        0,
        80,
        Phaser.Math.DegToRad(140),
        Phaser.Math.DegToRad(220),
        false,
      );
      slash.slice(
        0,
        0,
        60,
        Phaser.Math.DegToRad(140),
        Phaser.Math.DegToRad(220),
        false,
      );
    }
    slashGlow.fillPath();
    slash.fillPath();

    slashGlow.setPosition(hand.x, hand.y);
    slash.setPosition(hand.x, hand.y);
    slashGlow.setScale(0.1);
    slash.setScale(0.1); // Start small

    this.tweens.add({
      targets: [slash, slashGlow],
      x: target.x,
      scaleX: 3.0, // Grow huge
      scaleY: 3.0,
      alpha: { start: 1, end: 0 }, // Fade out as it hits
      duration: 250,
      onComplete: () => {
        if (!this.scene.isActive()) return;

        this.createScreenFlash(0x3498db, 200, 0.6);
        this.cameras.main.shake(300, 0.03);

        // Distortion line at impact
        const cutLineGlow = this.add
          .rectangle(target.x, target.y + 120, 30, 300, 0x3498db)
          .setRotation(0.5)
          .setBlendMode(Phaser.BlendModes.ADD);
        const cutLine = this.add
          .rectangle(target.x, target.y + 120, 10, 300, 0xffffff)
          .setRotation(0.5)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: [cutLine, cutLineGlow],
          scaleX: 0,
          scaleY: 2,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            cutLine.destroy();
            cutLineGlow.destroy();
          },
        });

        // Shockwave rings
        for (let i = 0; i < 2; i++) {
          const ring = this.add
            .circle(target.x, target.y + 120, 20, 0x3498db)
            .setStrokeStyle(6, 0x3498db)
            .setDepth(20)
            .setAlpha(0)
            .setBlendMode(Phaser.BlendModes.ADD);
          ring.isFilled = false;
          this.tweens.add({
            targets: ring,
            scale: 6 + i * 3,
            alpha: { start: 1, end: 0 },
            duration: 200 + i * 100,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
          });
        }

        this.createImpactEffect(target.x, hand.y, 0x3498db, "beam");
        this.createImpactEffect(target.x, target.y + 120, 0xffffff, "melee");
        this.takeDamage(!isP, dmg);
        slash.destroy();
        slashGlow.destroy();
        this.onSpecialComplete(isP);
      },
    });
  }

  // 5. ZOLTRAAK (MASSIVE MAGIC REMASTER)
  private specialZoltraak(isP: boolean, isS: boolean) {
    const hand = this.getHandPosition(isP);
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const circleOffset = attacker.x < target.x ? 40 : -40;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const baseDmg = isS ? 80 : 50;
    const dmg = Math.floor(baseDmg * this.getDamageMultiplier(transLevel));

    this.log("ZOLTRAAK!");

    this.cameras.main.shake(500, 0.01);

    // Always 3 Circles for maximum epicness
    const circles: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 3; i++) {
      const c = this.add
        .graphics()
        .setDepth(5)
        .setBlendMode(Phaser.BlendModes.ADD);
      c.lineStyle(3 + i, 0xffffff, 0.8);
      c.strokeCircle(0, 0, 30 + i * 10); // Concentric sizes
      c.strokeRect(-20 - i * 5, -20 - i * 5, 40 + i * 10, 40 + i * 10);
      c.setPosition(hand.x + circleOffset, hand.y);
      c.setRotation(i * 0.5); // Different start rotations
      circles.push(c);
    }

    // Gathering particles
    const gatherParticles = this.add
      .particles(0, 0, "particle", {
        x: hand.x + circleOffset,
        y: hand.y,
        speed: { min: -150, max: 150 },
        scale: { start: 1, end: 0 },
        blendMode: "ADD",
        lifespan: 400,
        tint: 0xffffff,
        gravityY: 0,
      })
      .setDepth(14);

    // Spin up
    this.tweens.add({
      targets: circles,
      angle: 360,
      scale: 1.5,
      duration: 600,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        circles.forEach((c) => c.destroy());
        gatherParticles.destroy();

        this.createScreenFlash(0xffffff, 300, 0.9);
        this.cameras.main.shake(600, 0.05);

        // MASSIVE BEAM "JUDGEMENT" STYLE
        const target = isP ? this.enemy : this.player;
        const distance = Math.abs(target.x - hand.x) + 200;
        const originX = 0; // FIX: Added origin direction logic

        // Outer Glow
        const beamOuter = this.add
          .rectangle(hand.x, hand.y, distance, 250, 0xffffff)
          .setOrigin(originX, 0.5)
          .setAlpha(0.4)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(9);
        beamOuter.scaleX = isP ? 1 : -1;

        // Black void beam
        const massiveBeam = this.add
          .rectangle(hand.x, hand.y, distance, 150, 0x000000)
          .setOrigin(originX, 0.5) // FIX: Set Origin
          .setAlpha(0.9)
          .setDepth(10);
        massiveBeam.scaleX = isP ? 1 : -1;

        // White hot core
        const core = this.add
          .rectangle(hand.x, hand.y, distance, 60, 0xffffff)
          .setOrigin(originX, 0.5) // FIX: Set Origin
          .setDepth(11);
        core.scaleX = isP ? 1 : -1;

        this.createImpactEffect(target.x, hand.y, 0x000000, "beam");
        this.createImpactEffect(target.x, target.y + 120, 0xffffff, "beam");
        this.takeDamage(!isP, dmg); // Buffed dmg

        // Massive Shockwave rings
        for (let i = 0; i < 3; i++) {
          const ring = this.add
            .circle(target.x, target.y + 120, 40, 0xffffff)
            .setStrokeStyle(8, 0xffffff)
            .setDepth(20)
            .setAlpha(0)
            .setBlendMode(Phaser.BlendModes.ADD);
          ring.isFilled = false;
          this.tweens.add({
            targets: ring,
            scale: 8 + i * 4,
            alpha: { start: 1, end: 0 },
            duration: 300 + i * 100,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
          });
        }

        this.tweens.add({
          targets: [beamOuter, massiveBeam, core],
          scaleY: 0,
          alpha: 0,
          duration: 500,
          ease: "Quad.easeIn",
          onComplete: () => {
            beamOuter.destroy();
            massiveBeam.destroy();
            core.destroy();
            this.onSpecialComplete(isP);
          },
        });
      },
    });
  }

  // 6. MISSILES (SMOKE TRAIL REMASTER)
  private specialMissiles(isP: boolean, isS: boolean) {
    this.log("MISSILE STRIKE!");
    const count = isS ? 12 : 6; // More missiles
    const hand = this.getHandPosition(isP);
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const baseDmg = isS ? 8 : 12;
    const dmg = Math.floor(baseDmg * this.getDamageMultiplier(transLevel));

    const fireOne = (delay: number) => {
      this.time.delayedCall(delay, () => {
        if (!this.scene.isActive()) return;

        // Missile Graphic
        const m = this.add
          .rectangle(hand.x, hand.y - 30, 20, 8, 0xffffff)
          .setDepth(5);
        const mGlow = this.add
          .rectangle(hand.x, hand.y - 30, 30, 12, 0xffaa00)
          .setDepth(4)
          .setAlpha(0.6)
          .setBlendMode(Phaser.BlendModes.ADD);

        // Smoke Particle Emitter
        const smoke = this.add.particles(0, 0, "particle", {
          follow: m,
          scale: { start: 1.2, end: 0 },
          lifespan: 600,
          tint: [0xffaa00, 0x555555, 0x222222], // Fire to smoke
          frequency: 15,
          blendMode: "ADD",
        });

        const targetX = isP ? this.enemy.x : this.player.x;
        const targetY =
          (isP ? this.enemy.y : this.player.y) + Phaser.Math.Between(-50, 100); // Hit various body parts

        // High Arc
        const midX = (hand.x + targetX) / 2 + Phaser.Math.Between(-100, 100);
        const midY = hand.y - Phaser.Math.Between(200, 400);

        const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(hand.x, hand.y - 30),
          new Phaser.Math.Vector2(midX, midY),
          new Phaser.Math.Vector2(targetX, targetY),
        );

        let t = { val: 0 };
        this.tweens.add({
          targets: t,
          val: 1,
          duration: Phaser.Math.Between(500, 800),
          ease: "Sine.easeIn",
          onUpdate: () => {
            const pos = curve.getPoint(t.val);
            m.setPosition(pos.x, pos.y);
            mGlow.setPosition(pos.x, pos.y);
            const angle = curve.getTangent(t.val).angle();
            m.rotation = angle;
            mGlow.rotation = angle;
          },
          onComplete: () => {
            if (!this.scene.isActive()) return;
            m.destroy();
            mGlow.destroy();
            smoke.stop();
            this.time.delayedCall(600, () => smoke.destroy());

            this.createImpactEffect(targetX, targetY, 0xffaa00);
            this.takeDamage(!isP, dmg);

            // Shockwave ring
            const ring = this.add
              .circle(targetX, targetY, 10, 0xffaa00)
              .setStrokeStyle(3, 0xffaa00)
              .setDepth(20)
              .setAlpha(0)
              .setBlendMode(Phaser.BlendModes.ADD);
            ring.isFilled = false;
            this.tweens.add({
              targets: ring,
              scale: 4,
              alpha: { start: 1, end: 0 },
              duration: 200,
              ease: "Cubic.easeOut",
              onComplete: () => ring.destroy(),
            });

            // Small explosion
            const explosion = this.add
              .circle(targetX, targetY, 5, 0xffaa00)
              .setDepth(20)
              .setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
              targets: explosion,
              scale: 5,
              alpha: 0,
              duration: 200,
              onComplete: () => explosion.destroy(),
            });

            this.cameras.main.shake(100, 0.02);
            if (this.cache.audio.exists("sfx_explosion"))
              this.sound.play("sfx_explosion", { volume: 0.3 });
          },
        });
      });
    };

    for (let i = 0; i < count; i++) fireOne(i * 100); // Rapid fire

    this.time.delayedCall(count * 100 + 800, () => {
      if (this.scene.isActive()) this.onSpecialComplete(isP);
    });
  }

  // 7. PANCAKE (JUMP ATTACK - Uses specific tweens)
  private specialPancake(isP: boolean, isS: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const startX = isP ? this.player.x : this.enemy.x;
    const startY = isP ? this.player.y : this.enemy.y;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const attackerData = isP ? this.playerData : this.enemyData;
    const baseDmg = isS ? 80 : 50;
    const dmg = Math.floor(baseDmg * this.getDamageMultiplier(transLevel));

    this.log("PANCAKES!");
    if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack");

    const animKeySpecial = this.getAnimKey(
      attackerData.key,
      transLevel,
      "special",
    );
    const animKeyIdle = this.getAnimKey(attackerData.key, transLevel, "idle");
    attacker.play(animKeySpecial);

    // Charge squash
    this.tweens.add({
      targets: attacker,
      scaleX: 3.5,
      scaleY: 2.5,
      duration: 200,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;

        // Shadow looming over target
        const shadow = this.add.ellipse(
          target.x,
          target.y + 30,
          10,
          5,
          0x000000,
          0.5,
        );
        this.tweens.add({
          targets: shadow,
          scaleX: 10,
          scaleY: 5,
          duration: 400,
        });

        this.tweens.add({
          targets: attacker,
          y: startY - 400, // Higher jump
          x: target.x,
          scaleX: 3,
          scaleY: 3,
          duration: 400,
          ease: "Cubic.easeOut",
          onComplete: () => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
              targets: attacker,
              y: startY,
              duration: 150, // Faster drop
              ease: "Bounce.easeOut",
              onComplete: () => {
                if (!this.scene.isActive()) return;

                this.createScreenFlash(0xffaa00, 300, 0.8);
                this.cameras.main.shake(500, 0.08); // Big shake

                // Shockwave Rings
                for (let i = 0; i < 3; i++) {
                  const ring = this.add
                    .circle(target.x, startY, 20, 0xffaa00)
                    .setStrokeStyle(6, 0xffaa00)
                    .setDepth(20)
                    .setAlpha(0)
                    .setBlendMode(Phaser.BlendModes.ADD);
                  ring.isFilled = false;
                  this.tweens.add({
                    targets: ring,
                    scale: 8 + i * 3,
                    alpha: { start: 1, end: 0 },
                    duration: 300 + i * 100,
                    ease: "Cubic.easeOut",
                    onComplete: () => ring.destroy(),
                  });
                }

                // Impact dust
                const dust = this.add
                  .particles(0, 0, "particle", {
                    x: target.x,
                    y: startY,
                    speed: { min: 100, max: 300 },
                    angle: { min: 180, max: 360 },
                    scale: { start: 2, end: 0 },
                    blendMode: "ADD",
                    lifespan: 500,
                    tint: 0xffaa00,
                    gravityY: 200,
                  })
                  .setDepth(19);
                this.time.delayedCall(500, () => dust.destroy());

                this.createImpactEffect(target.x, startY, 0xffaa00);
                this.takeDamage(!isP, dmg);
                shadow.destroy();

                this.time.delayedCall(400, () => {
                  if (this.scene.isActive()) {
                    this.tweens.add({
                      targets: attacker,
                      x: startX,
                      y: startY,
                      duration: 300,
                      onComplete: () => {
                        this.onSpecialComplete(isP);
                      },
                    });
                  }
                });
              },
            });
          },
        });
      },
    });
  }

  // 8. PLASMA DASH (CYBER NINJA SPECIAL)
  private specialPlasmaDash(isP: boolean, isS: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const baseDmg = isS ? 60 : 35;
    const dmg = Math.floor(baseDmg * this.getDamageMultiplier(transLevel));
    const dashColor = transLevel > 0 ? 0xff0055 : 0x00eaff;

    this.log("PLASMA DASH!");
    if (this.cache.audio.exists("sfx_attack"))
      this.sound.play("sfx_attack", { rate: 2.0 });

    // Vanish
    attacker.setVisible(false);

    // Dash Line Visual
    const dashLineGlow = this.add
      .rectangle(
        (startX + target.x) / 2,
        startY + 50,
        Math.abs(target.x - startX) + 200,
        30,
        dashColor,
      )
      .setDepth(14)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);

    const dashLine = this.add
      .rectangle(
        (startX + target.x) / 2,
        startY + 50,
        Math.abs(target.x - startX) + 100,
        10,
        0xffffff,
      )
      .setDepth(15)
      .setAlpha(0.9)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.cameras.main.shake(300, 0.02);

    this.tweens.add({
      targets: [dashLine, dashLineGlow],
      scaleY: 0,
      alpha: 0,
      duration: 300,
    });

    // Teleport behind enemy
    const behindX = isP ? target.x + 80 : target.x - 80;
    attacker.setPosition(behindX, startY);
    attacker.setVisible(true);
    attacker.setFlipX(isP ? true : false); // Face back towards enemy

    // Impact Delay (The "Omae wa mou shindeiru" effect)
    this.time.delayedCall(400, () => {
      if (!this.scene.isActive()) return;

      this.createScreenFlash(dashColor, 300, 0.7);
      this.cameras.main.shake(400, 0.04);

      // Slash Effect on Target
      const slashGlow = this.add
        .graphics()
        .setDepth(14)
        .setBlendMode(Phaser.BlendModes.ADD);
      slashGlow.lineStyle(12, dashColor, 0.6);
      slashGlow.lineBetween(
        target.x - 100,
        target.y + 120 - 100,
        target.x + 100,
        target.y + 120 + 100,
      );

      const slash = this.add
        .graphics()
        .setDepth(15)
        .setBlendMode(Phaser.BlendModes.ADD);
      slash.lineStyle(4, 0xffffff);
      slash.lineBetween(
        target.x - 100,
        target.y + 120 - 100,
        target.x + 100,
        target.y + 120 + 100,
      );

      this.tweens.add({
        targets: [slash, slashGlow],
        alpha: 0,
        duration: 200,
        onComplete: () => {
          slash.destroy();
          slashGlow.destroy();
        },
      });

      // Shockwave rings
      for (let i = 0; i < 3; i++) {
        const ring = this.add
          .circle(target.x, target.y + 120, 20, dashColor)
          .setStrokeStyle(6, dashColor)
          .setDepth(20)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD);
        ring.isFilled = false;
        this.tweens.add({
          targets: ring,
          scale: 6 + i * 3,
          alpha: { start: 1, end: 0 },
          duration: 200 + i * 100,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      }

      this.createImpactEffect(target.x, target.y + 120, dashColor, "beam");
      this.takeDamage(!isP, dmg);

      // Return to start
      this.time.delayedCall(300, () => {
        if (!this.scene.isActive()) return;
        attacker.setVisible(false); // Vanish

        // Teleport back start
        attacker.setPosition(startX, startY);
        attacker.setFlipX(isP ? false : true); // Reset flip
        attacker.setVisible(true);

        this.onSpecialComplete(isP);
      });
    });
  }

  // =========================================================================
  // SPIDERMAN SPECIAL & SUPER ATTACKS
  // =========================================================================

  private specialWebPullPunch(isPlayer: boolean) {
      const attacker = isPlayer ? this.player : this.enemy;
      const target = isPlayer ? this.enemy : this.player;
      const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;
      const isIron = transLevel > 0;
      
      const webColor = isIron ? 0xcc2222 : 0xdddddd;
      
      // Throw Web Line
      const hand = this.getHandPosition(isPlayer);
      const webLine = this.add.rectangle(hand.x, hand.y, 0, 4, webColor).setOrigin(isPlayer ? 0 : 1, 0.5).setDepth(4);
      
      this.tweens.add({
          targets: webLine,
          width: Math.abs(target.x - attacker.x),
          duration: 150,
          onComplete: () => {
             if (!this.scene.isActive()) return;
             // Hit! the opponent is pulled towards spiderman
             this.createImpactEffect(target.x, target.y + 120, webColor);
             
             this.tweens.add({
                 targets: [target, webLine],
                 x: attacker.x + (attacker.x < target.x ? 50 : -50),
                 width: 50,
                 duration: 200,
                 ease: "Back.easeIn",
                 onComplete: () => {
                     webLine.destroy();
                     // BAM! Uppercut or heavy punch
                     attacker.play(this.getAnimKey("spiderman", transLevel, "attack"));
                     this.cameras.main.shake(200, 0.03);
                     if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack", { volume: 1.5 });
                     
                     this.createImpactEffect(target.x, target.y + 120, 0xff0000);
                     this.takeDamage(!isPlayer, Math.floor(40 * this.getDamageMultiplier(transLevel)));
                     
                     // Send them flying back
                     this.tweens.add({
                         targets: target,
                         x: isPlayer ? this.p2StartPos.x : this.p1StartPos.x,
                         duration: 200,
                         ease: "Quad.easeOut"
                     });
                     this.tweens.add({
                         targets: target,
                         y: target.y - 40,
                         duration: 100,
                         yoyo: true,
                         ease: "Sine.easeOut"
                     });
                     
                     this.time.delayedCall(400, () => {
                         if (!this.scene.isActive()) return;
                         attacker.play(this.getAnimKey("spiderman", transLevel, "idle"));
                         this.onSpecialComplete(isPlayer);
                     });
                 }
             });
          }
      });
  }

  private specialMaximumSpider(isPlayer: boolean) {
      const attacker = isPlayer ? this.player : this.enemy;
      const target = isPlayer ? this.enemy : this.player;
      const startX = attacker ? attacker.x : (isPlayer ? this.player.x : this.enemy.x);
      const startY = attacker ? attacker.y : (isPlayer ? this.player.y : this.enemy.y);
      const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;
      const isIron = transLevel > 0;
      
      const beamColor = isIron ? 0xffd700 : 0xaa0000;
      this.cameras.main.flash(500, 255, 255, 255);

      // Dash through screen multiple times! INSTANT KILL MODE
      attacker.play(this.getAnimKey("spiderman", transLevel, "attack"));
      
      let strikes = 0;
      const maxStrikes = isIron ? 8 : 5;
      
      const performStrike = () => {
          if (!this.scene.isActive()) return;
          if (strikes >= maxStrikes) {
              // Final return
              attacker.setAlpha(0);
              attacker.x = startX;
              attacker.y = startY;
              this.time.delayedCall(150, () => {
                 if (!this.scene.isActive()) return;
                 attacker.setAlpha(1);
                 attacker.play(this.getAnimKey("spiderman", transLevel, "idle"));
                 this.onSpecialComplete(isPlayer);
              });
              return;
          }
          
          strikes++;
          
          // Random attack vector
          const fromX = target.x + (Math.random() * 400 - 200);
          const fromY = target.y + 120 + (Math.random() * 300 - 200);
          
          attacker.x = fromX;
          attacker.y = fromY;
          attacker.setAlpha(0);
          
          // Show quick line
          const slash = this.add.graphics();
          slash.lineStyle(6, beamColor, 0.8);
          slash.beginPath();
          slash.moveTo(fromX, fromY);
          slash.lineTo(target.x, target.y + 120);
          slash.strokePath();
          slash.setDepth(4);
          
          this.tweens.add({
              targets: slash,
              alpha: 0,
              duration: 100,
              onComplete: () => slash.destroy()
          });

          this.tweens.add({
              targets: attacker,
              x: target.x,
              y: target.y,
              alpha: 1,
              duration: 80,
              onComplete: () => {
                  if (!this.scene.isActive()) return;
                  if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack", { volume: 0.8 });
                  this.createImpactEffect(target.x + (Math.random()*40-20), target.y + 120 + (Math.random()*40-20), 0xffffff);
                  this.takeDamage(!isPlayer, Math.floor((isIron ? 15 : 20) * this.getDamageMultiplier(transLevel)));
                  this.cameras.main.shake(50, 0.02);
                  performStrike();
              }
          });
      };
      
      performStrike();
  }

  // =========================================================================
  // 100% ULTIMATE ATTACKS
  // =========================================================================





  private specialFatherSonKamehameha(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(115 * this.getDamageMultiplier(transLevel));
    const hand = this.getHandPosition(isP);

    this.log("FATHER-SON KAMEHAMEHA!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Ghost Goku (Visual representation)
    const ghost = this.add
      .sprite(attacker.x + (attacker.x < target.x ? -40 : 40), attacker.y - 60, "goku_ssj")
      .setOrigin(0.5, 0.5)
      .setAlpha(0)
      .setScale(3.5)
      .setDepth(2); // In front of Gohan to be clearly visible
    ghost.setFlipX(!isP);
    if (this.anims.exists("goku_ssj_attack")) {
      ghost.play("goku_ssj_attack");
    }
    this.tweens.add({ targets: ghost, alpha: 0.85, duration: 500 });

    // Charge Effect
    const chargeCore = this.add
      .circle(hand.x, hand.y, 2, 0xffffff)
      .setDepth(16);
    const chargeGlow = this.add
      .circle(hand.x, hand.y, 5, 0x00ffff)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.cameras.main.shake(800, 0.01);

    // Gathering particles
    const gatherParticles = this.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -250, max: 250 },
        scale: { start: 1.2, end: 0 },
        blendMode: "ADD",
        lifespan: 500,
        tint: 0x00ffff,
        gravityY: 0,
      })
      .setDepth(14);

    this.tweens.add({
      targets: [chargeCore, chargeGlow],
      scale: 30,
      alpha: { start: 1, end: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!this.scene.isActive()) return;
        chargeCore.destroy();
        chargeGlow.destroy();
        gatherParticles.destroy();

        this.createScreenFlash(0x00ffff, 500, 0.9);
        this.cameras.main.shake(1200, 0.08);

        // Massive Beam using the new texture
        const beam = this.add
          .sprite(hand.x, hand.y, "massive_beam")
          .setOrigin(0, 0.5)
          .setDepth(5)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD);
        beam.scaleX = isP ? 0.1 : -0.1;
        beam.scaleY = 0.5;

        const distance = Math.abs(target.x - hand.x) + 200;
        const targetScaleX = (isP ? distance : -distance) / 128; // 128 is the width of massive_beam

        // Muzzle Flash
        const muzzle = this.add
          .circle(hand.x, hand.y, 80, 0x00ffff)
          .setDepth(6);
        muzzle.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: muzzle,
          scale: 0,
          alpha: 0,
          duration: 400,
          onComplete: () => muzzle.destroy(),
        });

        this.tweens.add({
          targets: beam,
          scaleX: targetScaleX,
          scaleY: 4.5,
          duration: 200,
          ease: "Power2",
          onComplete: () => {
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0x00ffff, "beam");
            this.takeDamage(!isP, dmg);

            // Massive Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = this.add
                .circle(target.x, target.y + 120, 40, 0x00ffff)
                .setStrokeStyle(10, 0x00ffff)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 10 + i * 4,
                alpha: { start: 1, end: 0 },
                duration: 400 + i * 120,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            this.tweens.add({
              targets: [beam, ghost],
              alpha: 0,
              duration: 600,
              onComplete: () => {
                beam.destroy();
                ghost.destroy();
                this.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  private specialHellzoneGrenade(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(105 * this.getDamageMultiplier(transLevel));

    this.log("HELLZONE GRENADE!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    const orbs: any[] = [];
    const orbCount = 16;
    for (let i = 0; i < orbCount; i++) {
      const angle = (i / orbCount) * Math.PI * 2;
      const dist = 200;
      const ox = target.x + Math.cos(angle) * dist;
      const oy = target.y - 50 + Math.sin(angle) * dist;

      const orbGlow = this.add
        .circle(ox, oy, 25, 0xffff00)
        .setDepth(14)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      const orb = this.add
        .circle(ox, oy, 12, 0xffffff)
        .setDepth(15)
        .setAlpha(0);

      orbs.push({ orb, orbGlow });

      this.tweens.add({
        targets: [orb, orbGlow],
        alpha: 1,
        duration: 400,
        delay: i * 40,
      });

      // Orbiting effect
      this.tweens.add({
        targets: [orb, orbGlow],
        x: target.x + Math.cos(angle + Math.PI) * dist,
        y: target.y - 50 + Math.sin(angle + Math.PI) * dist,
        duration: 1000,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    }

    this.time.delayedCall(1200, () => {
      if (!this.scene.isActive()) return;

      this.cameras.main.shake(400, 0.03);

      orbs.forEach((o, i) => {
        this.tweens.killTweensOf([o.orb, o.orbGlow]); // Stop orbiting

        // Trail
        const trail = this.add
          .particles(0, 0, "particle", {
            follow: o.orb,
            scale: { start: 1.0, end: 0 },
            lifespan: 250,
            tint: 0xffff00,
            blendMode: "ADD",
          })
          .setDepth(13);

        this.tweens.add({
          targets: [o.orb, o.orbGlow],
          x: target.x + Phaser.Math.Between(-30, 30),
          y: target.y + 120 + Phaser.Math.Between(-30, 30),
          duration: 350,
          delay: i * 30,
          ease: "Back.easeIn",
          onComplete: () => {
            if (!this.scene.isActive()) return;

            // Small explosion for each orb
            const exp = this.add
              .circle(o.orb.x, o.orb.y, 20, 0xffff00)
              .setDepth(16)
              .setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
              targets: exp,
              scale: 4,
              alpha: 0,
              duration: 250,
              onComplete: () => exp.destroy(),
            });

            this.createImpactEffect(o.orb.x, o.orb.y, 0xffff00, "melee");
            this.cameras.main.shake(100, 0.02);

            if (i === orbs.length - 1) {
              this.createScreenFlash(0xffff00, 400, 0.9);
              this.cameras.main.shake(800, 0.08);

              // Shockwave rings
              for (let j = 0; j < 5; j++) {
                const ring = this.add
                  .circle(target.x, target.y + 120, 40, 0xffff00)
                  .setStrokeStyle(10, 0xffff00)
                  .setDepth(20)
                  .setAlpha(0)
                  .setBlendMode(Phaser.BlendModes.ADD);
                ring.isFilled = false;
                this.tweens.add({
                  targets: ring,
                  scale: 8 + j * 4,
                  alpha: { start: 1, end: 0 },
                  duration: 400 + j * 120,
                  ease: "Cubic.easeOut",
                  onComplete: () => ring.destroy(),
                });
              }

              this.createImpactEffect(target.x, target.y + 120, 0xffff00, "beam");
              this.takeDamage(!isP, dmg);
              this.onSpecialComplete(isP);
            }

            trail.stop();
            this.time.delayedCall(250, () => trail.destroy());
            o.orb.destroy();
            o.orbGlow.destroy();
          },
        });
      });
    });
  }

  private specialSolarKamehameha(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(120 * this.getDamageMultiplier(transLevel));
    const hand = this.getHandPosition(isP);

    this.log("SOLAR KAMEHAMEHA!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Charge
    const charge = this.add
      .circle(hand.x, hand.y, 5, 0x00ff00)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);
    const chargeCore = this.add
      .circle(hand.x, hand.y, 2, 0xffffff)
      .setDepth(16);

    this.cameras.main.shake(800, 0.01); // Shake while charging

    // Gathering particles
    const gatherParticles = this.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -250, max: 250 },
        scale: { start: 1.2, end: 0 },
        blendMode: "ADD",
        lifespan: 500,
        tint: 0x00ff00,
        gravityY: 0,
      })
      .setDepth(14);

    this.tweens.add({
      targets: [charge, chargeCore],
      scale: 35,
      alpha: { start: 1, end: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!this.scene.isActive()) return;
        charge.destroy();
        chargeCore.destroy();
        gatherParticles.destroy();

        this.createScreenFlash(0x00ff00, 500, 0.9);
        this.cameras.main.shake(1200, 0.1);

        // Massive Beam
        const beamOuter = this.add
          .rectangle(hand.x, hand.y, 0, 240, 0x00ff00)
          .setOrigin(0, 0.5)
          .setDepth(4)
          .setAlpha(0.5)
          .setBlendMode(Phaser.BlendModes.ADD);
        const beam = this.add
          .rectangle(hand.x, hand.y, 0, 180, 0x00ff00)
          .setOrigin(0, 0.5)
          .setDepth(5)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD);
        const beamCore = this.add
          .rectangle(hand.x, hand.y, 0, 90, 0xffffff)
          .setOrigin(0, 0.5)
          .setDepth(6)
          .setAlpha(1);
        beamOuter.scaleX = isP ? 1 : -1;
        beam.scaleX = isP ? 1 : -1;
        beamCore.scaleX = isP ? 1 : -1;
        const distance = Math.abs(target.x - hand.x) + 200;

        // Beam Head
        const beamHeadGlow = this.add
          .ellipse(hand.x, hand.y, 140, 280, 0x00ff00)
          .setDepth(5)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.8);
        const beamHead = this.add
          .ellipse(hand.x, hand.y, 70, 140, 0xffffff)
          .setDepth(6);

        this.tweens.add({
          targets: [beamOuter, beam, beamCore],
          width: distance,
          duration: 150,
          ease: "Power2",
          onUpdate: () => {
            if (!this.scene.isActive()) return;
            const tipX = isP ? hand.x + beam.width : hand.x - beam.width;
            beamHeadGlow.setPosition(tipX, hand.y);
            beamHead.setPosition(tipX, hand.y);
          },
          onComplete: () => {
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0x00ff00, "beam");
            this.takeDamage(!isP, dmg);

            // Massive Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = this.add
                .circle(target.x, target.y + 120, 40, 0x00ff00)
                .setStrokeStyle(12, 0x00ff00)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 12 + i * 6,
                alpha: { start: 1, end: 0 },
                duration: 400 + i * 120,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            this.tweens.add({
              targets: [beamOuter, beam, beamCore, beamHead, beamHeadGlow],
              alpha: 0,
              scaleY: 0,
              duration: 500,
              onComplete: () => {
                beamOuter.destroy();
                beam.destroy();
                beamCore.destroy();
                beamHead.destroy();
                beamHeadGlow.destroy();
                this.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  private specialNinjaBarrage(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(100 * this.getDamageMultiplier(transLevel));
    const startX = attacker.x;

    this.log("NINJA BARRAGE!");
    if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack");

    // Dash to target
    const dashGlow = this.add
      .rectangle(attacker.x, attacker.y, 100, 50, 0x3498db)
      .setDepth(14)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [attacker, dashGlow],
      x: target.x + (attacker.x < target.x ? -80 : 80),
      duration: 150,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        dashGlow.destroy();

        this.cameras.main.shake(500, 0.02);

        // Multiple slashes
        for (let i = 0; i < 15; i++) {
          this.time.delayedCall(i * 40, () => {
            if (!this.scene.isActive()) return;
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const len = 120;
            const cx = target.x + Phaser.Math.Between(-40, 40);
            const cy = target.y + 120 + Phaser.Math.Between(-40, 40);

            const slashGlow = this.add
              .rectangle(cx, cy, len * 2, 12, 0x3498db)
              .setDepth(14)
              .setBlendMode(Phaser.BlendModes.ADD)
              .setAlpha(0.6)
              .setRotation(angle);
            const slash = this.add
              .rectangle(cx, cy, len * 2, 4, 0xffffff)
              .setDepth(15)
              .setBlendMode(Phaser.BlendModes.ADD)
              .setRotation(angle);

            this.tweens.add({
              targets: [slash, slashGlow],
              alpha: 0,
              duration: 150,
              onComplete: () => {
                slash.destroy();
                slashGlow.destroy();
              },
            });
            if (i % 2 === 0) {
              this.createImpactEffect(cx, cy, 0x3498db);
              this.cameras.main.shake(50, 0.01);
            }
          });
        }

        this.time.delayedCall(700, () => {
          if (!this.scene.isActive()) return;

          this.createScreenFlash(0x3498db, 200, 0.7);
          this.cameras.main.shake(300, 0.05);

          // Final big slash
          const finalSlashGlow = this.add
            .graphics()
            .setDepth(14)
            .setBlendMode(Phaser.BlendModes.ADD);
          finalSlashGlow.lineStyle(30, 0x3498db, 0.8);
          finalSlashGlow.lineBetween(
            target.x - 150,
            target.y - 150,
            target.x + 150,
            target.y + 150,
          );

          const finalSlash = this.add
            .graphics()
            .setDepth(15)
            .setBlendMode(Phaser.BlendModes.ADD);
          finalSlash.lineStyle(10, 0xffffff);
          finalSlash.lineBetween(
            target.x - 150,
            target.y - 150,
            target.x + 150,
            target.y + 150,
          );

          this.tweens.add({
            targets: [finalSlash, finalSlashGlow],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              finalSlash.destroy();
              finalSlashGlow.destroy();
            },
          });

          // Shockwave rings
          for (let i = 0; i < 4; i++) {
            const ring = this.add
              .circle(target.x, target.y + 120, 40, 0x3498db)
              .setStrokeStyle(10, 0x3498db)
              .setDepth(20)
              .setAlpha(0)
              .setBlendMode(Phaser.BlendModes.ADD);
            ring.isFilled = false;
            this.tweens.add({
              targets: ring,
              scale: 10 + i * 5,
              alpha: { start: 1, end: 0 },
              duration: 400 + i * 100,
              ease: "Cubic.easeOut",
              onComplete: () => ring.destroy(),
            });
          }

          this.takeDamage(!isP, dmg);
          // Dash back
          this.tweens.add({
            targets: attacker,
            x: startX,
            duration: 200,
            ease: "Cubic.easeOut",
            onComplete: () => this.onSpecialComplete(isP),
          });
        });
      },
    });
  }

  private specialBlackHole(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(115 * this.getDamageMultiplier(transLevel));

    this.log("BLACK HOLE!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Create black hole on target
    const hole = this.add.circle(target.x, target.y + 120, 5, 0x000000).setDepth(15);
    const ring = this.add
      .circle(target.x, target.y + 120, 10, 0x9b59b6)
      .setDepth(14)
      .setStrokeStyle(6, 0x9b59b6)
      .setBlendMode(Phaser.BlendModes.ADD);
    const aura = this.add
      .circle(target.x, target.y + 120, 15, 0x9b59b6)
      .setDepth(13)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.cameras.main.shake(800, 0.02);

    // Suck particles
    const suckParticles = this.add
      .particles(0, 0, "particle", {
        x: target.x,
        y: target.y + 120,
        speed: { min: -300, max: -100 }, // Negative speed pulls them in
        scale: { start: 1.5, end: 0 },
        blendMode: "ADD",
        lifespan: 600,
        tint: [0x9b59b6, 0xffffff],
        gravityY: 0,
      })
      .setDepth(16);

    // Swirl effect
    const swirlTween = this.tweens.add({
      targets: ring,
      rotation: Math.PI * 10,
      duration: 1500,
    });

    this.tweens.add({
      targets: [hole, ring, aura],
      scale: 15,
      duration: 800,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;

        this.createScreenFlash(0x9b59b6, 300, 0.6);
        this.cameras.main.shake(600, 0.05);

        // Suck effect on target
        this.tweens.add({
          targets: target,
          scaleX: 0.2,
          scaleY: 0.2,
          alpha: 0.2,
          rotation: Math.PI * 4,
          duration: 600,
          yoyo: true,
          ease: "Cubic.easeInOut",
          onComplete: () => {
            if (!this.scene.isActive()) return;

            suckParticles.stop();
            swirlTween.stop();

            // Massive explosion
            this.createScreenFlash(0xffffff, 600, 1);
            this.cameras.main.shake(1000, 0.1);

            const explosion = this.add
              .circle(target.x, target.y + 120, 10, 0x9b59b6)
              .setDepth(20)
              .setBlendMode(Phaser.BlendModes.ADD);
            const explosionCore = this.add
              .circle(target.x, target.y + 120, 5, 0xffffff)
              .setDepth(21)
              .setBlendMode(Phaser.BlendModes.ADD);

            // Shockwave rings
            for (let i = 0; i < 6; i++) {
              const shockRing = this.add
                .circle(target.x, target.y + 120, 40, 0x9b59b6)
                .setStrokeStyle(12, 0x9b59b6)
                .setDepth(22)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              shockRing.isFilled = false;
              this.tweens.add({
                targets: shockRing,
                scale: 12 + i * 6,
                alpha: { start: 1, end: 0 },
                duration: 500 + i * 120,
                ease: "Cubic.easeOut",
                onComplete: () => shockRing.destroy(),
              });
            }

            this.tweens.add({
              targets: [explosion, explosionCore],
              scale: 45,
              alpha: 0,
              duration: 800,
              onComplete: () => {
                explosion.destroy();
                explosionCore.destroy();
              },
            });

            this.createImpactEffect(target.x, target.y + 120, 0x9b59b6, "beam");
            this.takeDamage(!isP, dmg);

            this.tweens.add({
              targets: [hole, ring, aura],
              scale: 0,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                hole.destroy();
                ring.destroy();
                aura.destroy();
                this.time.delayedCall(600, () => suckParticles.destroy());
                this.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  private specialMatrixBlast(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(125 * this.getDamageMultiplier(transLevel));

    this.log("MATRIX BLAST!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Open chest (visual effect)
    const hand = this.getHandPosition(isP);
    const matrix = this.add
      .circle(hand.x, hand.y, 10, 0x00eaff)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);
    const matrixCore = this.add
      .circle(hand.x, hand.y, 5, 0xffffff)
      .setDepth(16);

    this.cameras.main.shake(800, 0.01);

    // Gathering particles
    const gatherParticles = this.add
      .particles(0, 0, "particle", {
        x: hand.x,
        y: hand.y,
        speed: { min: -250, max: 250 },
        scale: { start: 1.8, end: 0 },
        blendMode: "ADD",
        lifespan: 500,
        tint: 0x00eaff,
        gravityY: 0,
      })
      .setDepth(14);

    this.tweens.add({
      targets: [matrix, matrixCore],
      scale: 25,
      alpha: { start: 1, end: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        if (!this.scene.isActive()) return;
        matrix.destroy();
        matrixCore.destroy();
        gatherParticles.destroy();

        this.createScreenFlash(0x00eaff, 500, 0.9);
        this.cameras.main.shake(1200, 0.1);

        // Massive Beam
        const beamOuter = this.add
          .rectangle(hand.x, hand.y, 0, 240, 0x00eaff)
          .setOrigin(0, 0.5)
          .setDepth(4)
          .setAlpha(0.5)
          .setBlendMode(Phaser.BlendModes.ADD);
        const beam = this.add
          .rectangle(hand.x, hand.y, 0, 180, 0x00eaff)
          .setOrigin(0, 0.5)
          .setDepth(5)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD);
        const beamCore = this.add
          .rectangle(hand.x, hand.y, 0, 90, 0xffffff)
          .setOrigin(0, 0.5)
          .setDepth(6);
        beamOuter.scaleX = isP ? 1 : -1;
        beam.scaleX = isP ? 1 : -1;
        beamCore.scaleX = isP ? 1 : -1;
        const distance = Math.abs(target.x - attacker.x) + 200;

        // Beam Head
        const beamHeadGlow = this.add
          .ellipse(hand.x, hand.y, 140, 280, 0x00eaff)
          .setDepth(5)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.8);
        const beamHead = this.add
          .ellipse(hand.x, hand.y, 70, 140, 0xffffff)
          .setDepth(6);

        this.tweens.add({
          targets: [beamOuter, beam, beamCore],
          width: distance,
          duration: 150,
          ease: "Power2",
          onUpdate: () => {
            if (!this.scene.isActive()) return;
            const tipX = isP
              ? attacker.x + beam.width
              : attacker.x - beam.width;
            beamHeadGlow.setPosition(tipX, hand.y);
            beamHead.setPosition(tipX, hand.y);
          },
          onComplete: () => {
            if (!this.scene.isActive()) return;
            this.createImpactEffect(target.x, target.y + 120, 0x00eaff, "beam");
            this.takeDamage(!isP, dmg);

            // Massive Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = this.add
                .circle(target.x, target.y + 120, 40, 0x00eaff)
                .setStrokeStyle(12, 0x00eaff)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 12 + i * 6,
                alpha: { start: 1, end: 0 },
                duration: 400 + i * 120,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            this.tweens.add({
              targets: [beamOuter, beam, beamCore, beamHead, beamHeadGlow],
              alpha: 0,
              scaleY: 0,
              duration: 500,
              onComplete: () => {
                beamOuter.destroy();
                beam.destroy();
                beamCore.destroy();
                beamHead.destroy();
                beamHeadGlow.destroy();
                this.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  private specialMegaPancake(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const attackerData = isP ? this.playerData : this.enemyData;
    const dmg = Math.floor(130 * this.getDamageMultiplier(transLevel));
    const startX = attacker.x;
    const startY = attacker.y;

    this.log("MEGA PANCAKE!");
    if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack");

    const animKeySpecial = this.getAnimKey(
      attackerData.key,
      transLevel,
      "special",
    );
    const animKeyIdle = this.getAnimKey(attackerData.key, transLevel, "idle");
    attacker.play(animKeySpecial);

    // Charge squash
    this.tweens.add({
      targets: attacker,
      scaleX: 4,
      scaleY: 2,
      duration: 300,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.scene.isActive()) return;

        // Shadow looming over target
        const shadow = this.add.ellipse(
          target.x,
          target.y + 30,
          10,
          5,
          0x000000,
          0.5,
        );
        this.tweens.add({
          targets: shadow,
          scaleX: 30,
          scaleY: 15,
          duration: 600,
        });

        // Giant Pancake visual
        const pancakeGlow = this.add
          .ellipse(target.x, target.y - 800, 200, 60, 0xffaa00)
          .setDepth(15)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.6);
        const pancake = this.add
          .ellipse(target.x, target.y - 800, 180, 50, 0xd35400)
          .setDepth(16);
        const butter = this.add
          .rectangle(target.x, target.y - 810, 40, 25, 0xf1c40f)
          .setDepth(17);

        // Fire trail
        const trail = this.add
          .particles(0, 0, "particle", {
            follow: pancake,
            speed: { min: -100, max: 100 },
            scale: { start: 2, end: 0 },
            blendMode: "ADD",
            lifespan: 400,
            tint: [0xffaa00, 0xff0000],
            gravityY: -200,
          })
          .setDepth(14);

        this.tweens.add({
          targets: [pancakeGlow, pancake, butter],
          y: "+=800",
          duration: 600,
          ease: "Cubic.easeIn",
          onComplete: () => {
            if (!this.scene.isActive()) return;
            trail.stop();

            this.createScreenFlash(0xffaa00, 500, 1);
            this.cameras.main.shake(1200, 0.12); // MASSIVE SHAKE

            // Shockwave Rings
            for (let i = 0; i < 6; i++) {
              const ring = this.add
                .ellipse(target.x, target.y + 20, 120, 40, 0xffaa00)
                .setStrokeStyle(12, 0xffaa00)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 10 + i * 4,
                alpha: { start: 1, end: 0 },
                duration: 500 + i * 150,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            // Impact dust
            const dust = this.add
              .particles(0, 0, "particle", {
                x: target.x,
                y: target.y + 20,
                speed: { min: 300, max: 700 },
                angle: { min: 180, max: 360 },
                scale: { start: 4, end: 0 },
                blendMode: "ADD",
                lifespan: 800,
                tint: 0xffaa00,
                gravityY: 400,
              })
              .setDepth(19);
            this.time.delayedCall(800, () => dust.destroy());

            this.createImpactEffect(target.x, target.y + 120, 0xd35400, "beam");
            this.takeDamage(!isP, dmg);

            this.tweens.add({
              targets: attacker,
              scaleX: 3,
              scaleY: 3,
              duration: 200,
              ease: "Quad.easeIn",
            });

            this.tweens.add({
              targets: [pancakeGlow, pancake, butter, shadow],
              alpha: 0,
              duration: 500,
              onComplete: () => {
                pancakeGlow.destroy();
                pancake.destroy();
                butter.destroy();
                shadow.destroy();
                attacker.play(animKeyIdle);
                this.time.delayedCall(500, () => trail.destroy());
                this.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  private specialCyberOverdrive(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(120 * this.getDamageMultiplier(transLevel));
    const startX = attacker.x;
    const startY = attacker.y;
    const dashColor = 0xff0055; // Always red for overdrive

    this.log("CYBER OVERDRIVE!");
    if (this.cache.audio.exists("sfx_attack"))
      this.sound.play("sfx_attack", { rate: 1.5 });

    attacker.setVisible(false);

    // Screen darkens slightly for contrast
    const dark = this.add
      .rectangle(0, 0, 1000, 600, 0x000000, 0.8)
      .setOrigin(0)
      .setDepth(14);

    // Multiple high speed dashes
    for (let i = 0; i < 15; i++) {
      this.time.delayedCall(i * 50, () => {
        if (!this.scene.isActive()) return;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const len = 500;

        const dashLineGlow = this.add
          .rectangle(
            target.x + Math.cos(angle) * 50,
            target.y - 30 + Math.sin(angle) * 50,
            len,
            40,
            dashColor,
          )
          .setDepth(14)
          .setAlpha(0.6)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setRotation(angle);

        const dashLine = this.add
          .rectangle(
            target.x + Math.cos(angle) * 50,
            target.y - 30 + Math.sin(angle) * 50,
            len,
            20,
            dashColor,
          )
          .setDepth(15)
          .setAlpha(0.9)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setRotation(angle);

        const dashCore = this.add
          .rectangle(dashLine.x, dashLine.y, len, 5, 0xffffff)
          .setDepth(16)
          .setRotation(angle);

        this.tweens.add({
          targets: [dashLineGlow, dashLine, dashCore],
          scaleY: 0,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            dashLineGlow.destroy();
            dashLine.destroy();
            dashCore.destroy();
          },
        });
        this.createImpactEffect(
          target.x + Phaser.Math.Between(-60, 60),
          target.y + 120 + Phaser.Math.Between(-60, 60),
          dashColor,
        );

        if (i % 2 === 0) this.cameras.main.shake(80, 0.02);
      });
    }

    this.time.delayedCall(850, () => {
      if (!this.scene.isActive()) return;

      this.createScreenFlash(dashColor, 600, 1);
      this.cameras.main.shake(1000, 0.1);
      if (this.cache.audio.exists("sfx_explosion"))
        this.sound.play("sfx_explosion");

      // Final massive slash
      const slashGlow = this.add
        .rectangle(target.x, target.y + 120, 700, 80, dashColor)
        .setDepth(14)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.8)
        .setRotation(Math.PI / 4);
      const slash = this.add
        .rectangle(target.x, target.y + 120, 700, 30, dashColor)
        .setDepth(15)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setRotation(Math.PI / 4);
      const slashCore = this.add
        .rectangle(target.x, target.y + 120, 700, 15, 0xffffff)
        .setDepth(16)
        .setRotation(Math.PI / 4);

      // Shockwave rings
      for (let i = 0; i < 6; i++) {
        const ring = this.add
          .circle(target.x, target.y + 120, 50, dashColor)
          .setStrokeStyle(12, dashColor)
          .setDepth(20)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD);
        ring.isFilled = false;
        this.tweens.add({
          targets: ring,
          scale: 12 + i * 6,
          alpha: { start: 1, end: 0 },
          duration: 500 + i * 150,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      }

      this.tweens.add({
        targets: [slashGlow, slash, slashCore],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          slashGlow.destroy();
          slash.destroy();
          slashCore.destroy();
        },
      });

      this.createImpactEffect(target.x, target.y + 120, dashColor, "beam");
      this.takeDamage(!isP, dmg);

      this.tweens.add({
        targets: dark,
        alpha: 0,
        duration: 400,
        onComplete: () => dark.destroy(),
      });
      attacker.setPosition(startX, startY);
      attacker.setVisible(true);
      this.onSpecialComplete(isP);
    });
  }

  private specialChipote(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(40 * this.getDamageMultiplier(transLevel));

    this.log("CHIPOTE CHILLÓN!");
    if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack");

    // Create a giant mallet sprite (using graphics)
    const mallet = this.add.graphics().setDepth(15);
    mallet.fillStyle(0xff0000, 1);
    mallet.fillRect(-20, -30, 40, 60); // Head
    mallet.fillStyle(0xffff00, 1);
    mallet.fillRect(-25, -20, 50, 40); // Yellow middle
    mallet.fillStyle(0xffff00, 1);
    mallet.fillRect(-5, 30, 10, 80); // Handle

    const startX = attacker.x + (attacker.x < target.x ? 50 : -50);
    const startY = attacker.y - 100;
    mallet.setPosition(startX, startY);
    mallet.rotation = isP ? -Math.PI / 4 : Math.PI / 4;

    // Charge up effect
    this.tweens.add({
      targets: mallet,
      scale: 2.5,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: mallet,
          x: target.x,
          y: target.y - 50,
          rotation: isP ? Math.PI / 2 : -Math.PI / 2,
          duration: 200,
          ease: "Cubic.easeIn",
          onComplete: () => {
            this.createScreenFlash(0xff0000, 300, 0.8);
            this.cameras.main.shake(500, 0.05);

            // Shockwave rings
            for (let i = 0; i < 2; i++) {
              const ring = this.add
                .circle(target.x, target.y + 120, 20, 0xff0000)
                .setStrokeStyle(6, 0xff0000)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 6 + i * 3,
                alpha: { start: 1, end: 0 },
                duration: 300 + i * 100,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            // Stars effect
            for (let i = 0; i < 5; i++) {
              const star = this.add
                .circle(target.x, target.y + 120, 5, 0xffff00)
                .setDepth(16);
              this.tweens.add({
                targets: star,
                x: target.x + Phaser.Math.Between(-100, 100),
                y: target.y + 120 + Phaser.Math.Between(-100, 100),
                alpha: 0,
                scale: 2,
                rotation: Math.PI * 4,
                duration: 500,
                ease: "Cubic.easeOut",
                onComplete: () => star.destroy(),
              });
            }

            this.createImpactEffect(target.x, target.y + 120, 0xff0000, "beam");
            if (this.cache.audio.exists("sfx_hit")) this.sound.play("sfx_hit");
            this.takeDamage(!isP, dmg);

            this.tweens.add({
              targets: mallet,
              alpha: 0,
              y: target.y + 120,
              duration: 200,
              onComplete: () => {
                mallet.destroy();
                this.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  private specialAerolitos(isP: boolean) {
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(110 * this.getDamageMultiplier(transLevel));

    this.log("AEROLITOS!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    this.cameras.main.shake(1200, 0.03);

    // Drop multiple meteorites
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 60, () => {
        if (!this.scene.isActive()) return;

        const size = Phaser.Math.Between(30, 60);
        const rock = this.add.circle(0, 0, size, 0x7f8c8d).setDepth(15);

        // Fire trail
        const trail = this.add
          .particles(0, 0, "particle", {
            color: [0xffaa00, 0xff0000],
            colorEase: "quad.out",
            lifespan: 400,
            angle: { min: 250, max: 290 },
            scale: { start: size / 5, end: 0, ease: "sine.out" },
            speed: 150,
            advance: 2000,
            blendMode: "ADD",
          })
          .setDepth(14);

        const startX = target.x + Phaser.Math.Between(-300, 300);
        const startY = -150;
        const targetX = target.x + Phaser.Math.Between(-80, 80);
        const targetY = target.y + 120 + Phaser.Math.Between(-30, 60);

        rock.setPosition(startX, startY);
        trail.startFollow(rock);

        this.tweens.add({
          targets: rock,
          x: targetX,
          y: targetY,
          duration: 250,
          ease: "Linear",
          onComplete: () => {
            this.createImpactEffect(targetX, targetY, 0xe74c3c, "melee");
            this.cameras.main.shake(80, 0.02);
            if (this.cache.audio.exists("sfx_hit"))
              this.sound.play("sfx_hit", { volume: 0.6 });

            // Small explosion for each rock
            const exp = this.add
              .circle(targetX, targetY, size, 0xffaa00)
              .setDepth(16)
              .setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
              targets: exp,
              scale: 3,
              alpha: 0,
              duration: 200,
              onComplete: () => exp.destroy(),
            });

            rock.destroy();
            trail.stop();
            this.time.delayedCall(300, () => trail.destroy());

            // Deal damage on the last hit
            if (i === 19) {
              this.createScreenFlash(0xffaa00, 400, 0.9);
              this.cameras.main.shake(600, 0.06);
              if (this.cache.audio.exists("sfx_explosion"))
                this.sound.play("sfx_explosion");

              // Massive final shockwave
              for (let j = 0; j < 5; j++) {
                const ring = this.add
                  .circle(target.x, target.y + 120, 50, 0xffaa00)
                  .setStrokeStyle(10, 0xffaa00)
                  .setDepth(20)
                  .setAlpha(0)
                  .setBlendMode(Phaser.BlendModes.ADD);
                ring.isFilled = false;
                this.tweens.add({
                  targets: ring,
                  scale: 12 + j * 5,
                  alpha: { start: 1, end: 0 },
                  duration: 400 + j * 120,
                  ease: "Cubic.easeOut",
                  onComplete: () => ring.destroy(),
                });
              }

              this.takeDamage(!isP, dmg);
              this.onSpecialComplete(isP);
            }
          },
        });
      });
    }
  }

  private specialRasengan(isP: boolean, isS: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const startX = attacker.x;
    const startY = attacker.y;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const baseDmg = isS ? 60 : 35;
    const dmg = Math.floor(baseDmg * this.getDamageMultiplier(transLevel));

    let color = 0x3498db; // Blue Rasengan
    let scaleTarget = 15;
    let attackName = "RASENGAN!";

    if (transLevel === 1) {
      scaleTarget = 25; // Oodama Rasengan (Bigger)
      attackName = "OODAMA RASENGAN!";
    } else if (transLevel === 2) {
      color = 0xffaa00; // Tailed Beast Rasengan (Orange)
      scaleTarget = 30;
      attackName = "TAILED BEAST RASENGAN!";
    }

    this.log(attackName);
    if (this.cache.audio.exists("sfx_attack"))
      this.sound.play("sfx_attack", { rate: 1.5 });

    // Create Rasengan in hand
    const hand = this.getHandPosition(isP);
    const rasengan = this.add
      .circle(hand.x, hand.y, 2, color)
      .setDepth(15)
      .setAlpha(0.8)
      .setBlendMode(Phaser.BlendModes.ADD);
    const rasenganCore = this.add
      .circle(hand.x, hand.y, 1, 0xffffff)
      .setDepth(16)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Swirling particles during charge
    const particles = this.add
      .particles(0, 0, "particle", {
        color: [color, 0xffffff],
        colorEase: "quad.out",
        lifespan: 400,
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        speed: { min: 100, max: 250 },
        blendMode: "ADD",
      })
      .setDepth(14);
    particles.startFollow(rasengan);

    this.cameras.main.shake(600, 0.02);

    // 1. Charge effect (standing still)
    this.tweens.add({
      targets: [rasengan, rasenganCore],
      scale: scaleTarget,
      duration: 600,
      ease: "Sine.easeOut",
      onUpdate: () => {
        const currentHand = this.getHandPosition(isP);
        rasengan.setPosition(currentHand.x, currentHand.y);
        rasenganCore.setPosition(currentHand.x, currentHand.y);
      },
      onComplete: () => {
        if (!this.scene.isActive()) return;

        // Swirling effect
        const swirlTween = this.tweens.add({
          targets: rasengan,
          scale: scaleTarget * 1.3,
          alpha: 0.6,
          duration: 100,
          yoyo: true,
          repeat: -1,
        });

        // 2. Dash towards enemy holding the Rasengan
        this.tweens.add({
          targets: attacker,
          x: target.x + (attacker.x < target.x ? -40 : 40), // Get right up to the target
          duration: 200,
          ease: "Power2",
          onUpdate: () => {
            const currentHand = this.getHandPosition(isP);
            rasengan.setPosition(currentHand.x, currentHand.y);
            rasenganCore.setPosition(currentHand.x, currentHand.y);
          },
          onComplete: () => {
            if (!this.scene.isActive()) return;

            swirlTween.stop();
            particles.stop();

            // 3. Impact!
            this.createScreenFlash(color, 500, 1);
            this.cameras.main.shake(1000, 0.1);
            if (this.cache.audio.exists("sfx_explosion"))
              this.sound.play("sfx_explosion");

            // Explosion effect
            const explosion = this.add
              .circle(target.x, target.y + 120, 10, color)
              .setDepth(20)
              .setBlendMode(Phaser.BlendModes.ADD);
            const explosionCore = this.add
              .circle(target.x, target.y + 120, 5, 0xffffff)
              .setDepth(21)
              .setBlendMode(Phaser.BlendModes.ADD);

            // Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = this.add
                .circle(target.x, target.y + 120, 40, color)
                .setStrokeStyle(12, color)
                .setDepth(22)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 12 + i * 6,
                alpha: { start: 1, end: 0 },
                duration: 500 + i * 150,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            this.tweens.add({
              targets: [explosion, explosionCore],
              scale: scaleTarget * 5,
              alpha: 0,
              duration: 800,
              onComplete: () => {
                explosion.destroy();
                explosionCore.destroy();
              },
            });

            this.createImpactEffect(target.x, target.y + 120, color, "beam");
            this.takeDamage(!isP, dmg);

            rasengan.destroy();
            rasenganCore.destroy();
            this.time.delayedCall(400, () => particles.destroy());

            // Target knockback
            this.tweens.add({
              targets: target,
              x: target.x + (attacker.x < target.x ? 150 : -150),
              duration: 250,
              yoyo: true,
              ease: "Sine.easeOut",
            });

            // Jump back
            this.tweens.add({
              targets: attacker,
              x: startX,
              y: startY,
              duration: 300,
              ease: "Power1",
              onComplete: () => {
                this.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  private specialRasenshuriken(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(120 * this.getDamageMultiplier(transLevel));

    let color = 0x3498db; // Blue/White
    let attackName = "RASENSHURIKEN!";
    let scaleTarget = 1.5;

    if (transLevel === 1) {
      attackName = "SENPOU: RASENSHURIKEN!";
      scaleTarget = 2.0;
    } else if (transLevel === 2) {
      color = 0xffaa00; // Orange/Yellow
      attackName = "BIJUU RASENSHURIKEN!";
      scaleTarget = 2.5;
    }

    this.log(attackName);
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Raise hand
    attacker.y -= 20;

    const hand = this.getHandPosition(isP);

    // Create Rasenshuriken
    const shuriken = this.add
      .graphics()
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Draw shuriken shape
    shuriken.fillStyle(color, 0.8);
    shuriken.fillCircle(0, 0, 15); // Core
    shuriken.fillStyle(0xffffff, 0.9);
    shuriken.fillCircle(0, 0, 8); // Inner core

    // Blades
    shuriken.lineStyle(6, color, 0.9);
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      shuriken.lineBetween(
        Math.cos(angle) * 15,
        Math.sin(angle) * 15,
        Math.cos(angle) * 50,
        Math.sin(angle) * 50,
      );
    }

    shuriken.setPosition(hand.x, hand.y - 30);

    // Wind particles
    const wind = this.add
      .particles(0, 0, "particle", {
        color: [0xffffff, color],
        colorEase: "quad.out",
        lifespan: 300,
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        speed: { min: 150, max: 300 },
        blendMode: "ADD",
      })
      .setDepth(14);
    wind.startFollow(shuriken);

    this.cameras.main.shake(800, 0.03);

    // Spin and grow
    this.tweens.add({
      targets: shuriken,
      rotation: Math.PI * 15,
      scale: scaleTarget,
      duration: 600,
      ease: "Sine.easeIn",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        attacker.y += 20; // Lower hand

        // Throw
        this.tweens.add({
          targets: shuriken,
          x: target.x,
          y: target.y + 120,
          rotation: Math.PI * 30, // Keep spinning
          duration: 250,
          ease: "Power2",
          onComplete: () => {
            if (!this.scene.isActive()) return;

            wind.stop();

            // Massive explosion sphere
            this.createScreenFlash(color, 600, 1);
            this.cameras.main.shake(1200, 0.12);
            if (this.cache.audio.exists("sfx_explosion"))
              this.sound.play("sfx_explosion");

            const explosion = this.add
              .circle(target.x, target.y + 120, 10, color)
              .setDepth(20)
              .setBlendMode(Phaser.BlendModes.ADD);
            const explosionCore = this.add
              .circle(target.x, target.y + 120, 5, 0xffffff)
              .setDepth(21)
              .setBlendMode(Phaser.BlendModes.ADD);

            // Wind slashes inside explosion
            for (let i = 0; i < 15; i++) {
              const slash = this.add
                .rectangle(
                  target.x + Phaser.Math.Between(-100, 100),
                  target.y + 120 + Phaser.Math.Between(-100, 100),
                  120,
                  4,
                  0xffffff,
                )
                .setDepth(22)
                .setRotation(Phaser.Math.Between(0, 360))
                .setBlendMode(Phaser.BlendModes.ADD);
              this.tweens.add({
                targets: slash,
                scaleX: 4,
                alpha: 0,
                duration: 300,
                delay: i * 20,
                onComplete: () => slash.destroy(),
              });
            }

            // Shockwave rings
            for (let i = 0; i < 6; i++) {
              const ring = this.add
                .circle(target.x, target.y + 120, 40, color)
                .setStrokeStyle(12, color)
                .setDepth(23)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 12 + i * 6,
                alpha: { start: 1, end: 0 },
                duration: 500 + i * 150,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            this.tweens.add({
              targets: [explosion, explosionCore],
              scale: scaleTarget * 20,
              alpha: 0,
              duration: 1000,
              onComplete: () => {
                explosion.destroy();
                explosionCore.destroy();
              },
            });

            this.createImpactEffect(target.x, target.y + 120, color, "beam");
            this.takeDamage(!isP, dmg);
            shuriken.destroy();
            this.time.delayedCall(400, () => wind.destroy());

            this.onSpecialComplete(isP);
          },
        });
      },
    });
  }

  private specialBatarang(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(35 * this.getDamageMultiplier(transLevel));

    this.log("BATARANG!");
    if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack");

    const hand = this.getHandPosition(isP);

    // Throw 5 batarangs
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 100, () => {
        if (!this.scene.isActive()) return;

        const batarangGlow = this.add
          .sprite(hand.x, hand.y, "batarang")
          .setOrigin(0.5, 0.5)
          .setDepth(14)
          .setTint(0x00eaff)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.6)
          .setScale(1.5);

        const batarang = this.add
          .sprite(hand.x, hand.y, "batarang")
          .setOrigin(0.5, 0.5)
          .setDepth(15);

        // Trail
        const trail = this.add
          .particles(0, 0, "particle", {
            follow: batarang,
            scale: { start: 1, end: 0 },
            lifespan: 200,
            tint: 0x00eaff,
            blendMode: "ADD",
          })
          .setDepth(13);

        // Spin animation
        this.tweens.add({
          targets: [batarang, batarangGlow],
          angle: 360 * 6,
          duration: 300,
          ease: "Linear",
        });

        // Move to target
        this.tweens.add({
          targets: [batarang, batarangGlow],
          x: target.x,
          y: target.y + 120 + Phaser.Math.Between(-40, 40),
          duration: 300,
          ease: "Power1",
          onComplete: () => {
            if (!this.scene.isActive()) return;

            this.createImpactEffect(batarang.x, batarang.y, 0x00eaff);
            if (this.cache.audio.exists("sfx_hit")) this.sound.play("sfx_hit");

            // Shockwave ring
            const ring = this.add
              .circle(batarang.x, batarang.y, 10, 0x00eaff)
              .setStrokeStyle(3, 0x00eaff)
              .setDepth(20)
              .setAlpha(0)
              .setBlendMode(Phaser.BlendModes.ADD);
            ring.isFilled = false;
            this.tweens.add({
              targets: ring,
              scale: 4,
              alpha: { start: 1, end: 0 },
              duration: 200,
              ease: "Cubic.easeOut",
              onComplete: () => ring.destroy(),
            });

            // Small explosion
            const exp = this.add
              .circle(batarang.x, batarang.y, 10, 0x00eaff)
              .setDepth(16)
              .setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
              targets: exp,
              scale: 3,
              alpha: 0,
              duration: 200,
              onComplete: () => exp.destroy(),
            });

            batarang.destroy();
            batarangGlow.destroy();
            trail.stop();
            this.time.delayedCall(200, () => trail.destroy());

            if (i === 4) {
              this.cameras.main.shake(300, 0.02);
              this.takeDamage(!isP, dmg);
              this.onSpecialComplete(isP);
            }
          },
        });
      });
    }
  }

  private specialTheDarkKnight(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(100 * this.getDamageMultiplier(transLevel));
    const startX = attacker.x;

    this.log("THE DARK KNIGHT!");
    if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack");

    // Screen goes dark
    const darkOverlay = this.add
      .rectangle(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0,
      )
      .setDepth(10);

    this.tweens.add({
      targets: darkOverlay,
      fillAlpha: 0.9,
      duration: 300,
      onComplete: () => {
        if (!this.scene.isActive()) return;

        // Teleport behind target
        attacker.x = target.x + (isP ? 60 : -60);

        // Multiple strikes in the dark
        for (let i = 0; i < 12; i++) {
          this.time.delayedCall(i * 80, () => {
            if (!this.scene.isActive()) return;
            const cx = target.x + Phaser.Math.Between(-40, 40);
            const cy = target.y + 120 + Phaser.Math.Between(-40, 40);

            // Slash effect
            const slash = this.add
              .graphics()
              .setDepth(15)
              .setBlendMode(Phaser.BlendModes.ADD);
            slash.lineStyle(4, 0xffffff);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const len = 60;
            slash.lineBetween(
              cx - Math.cos(angle) * len,
              cy - Math.sin(angle) * len,
              cx + Math.cos(angle) * len,
              cy + Math.sin(angle) * len,
            );
            this.tweens.add({
              targets: slash,
              alpha: 0,
              duration: 100,
              onComplete: () => slash.destroy(),
            });

            this.createImpactEffect(cx, cy, 0xffffff);
            if (i % 3 === 0) this.cameras.main.shake(50, 0.01);
            if (this.cache.audio.exists("sfx_hit")) this.sound.play("sfx_hit");
          });
        }

        this.time.delayedCall(1000, () => {
          if (!this.scene.isActive()) return;

          // Final explosive strike
          this.createScreenFlash(0xf1c40f, 500, 1);
          this.cameras.main.shake(1000, 0.1);

          // Shockwave rings
          for (let i = 0; i < 5; i++) {
            const ring = this.add
              .circle(target.x, target.y + 120, 40, 0xf1c40f)
              .setStrokeStyle(12, 0xf1c40f)
              .setDepth(20)
              .setAlpha(0)
              .setBlendMode(Phaser.BlendModes.ADD);
            ring.isFilled = false;
            this.tweens.add({
              targets: ring,
              scale: 12 + i * 6,
              alpha: { start: 1, end: 0 },
              duration: 500 + i * 150,
              ease: "Cubic.easeOut",
              onComplete: () => ring.destroy(),
            });
          }

          this.createImpactEffect(target.x, target.y + 120, 0xf1c40f, "beam");
          this.takeDamage(!isP, dmg);

          // Fade out darkness and return
          this.tweens.add({
            targets: darkOverlay,
            fillAlpha: 0,
            duration: 400,
            onComplete: () => {
              darkOverlay.destroy();
              attacker.x = startX;
              this.onSpecialComplete(isP);
            },
          });
        });
      },
    });
  }

  private specialCleave(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(45 * this.getDamageMultiplier(transLevel));
    const hand = this.getHandPosition(isP);

    this.log("CLEAVE!");
    if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack");

    // Create invisible slash effect
    const slashGlow1 = this.add
      .graphics()
      .setDepth(14)
      .setBlendMode(Phaser.BlendModes.ADD);
    slashGlow1.lineStyle(20, 0xff0000, 0.6);
    slashGlow1.beginPath();
    slashGlow1.moveTo(target.x - 60, target.y - 60);
    slashGlow1.lineTo(target.x + 60, target.y + 120);
    slashGlow1.strokePath();

    const slash1 = this.add.graphics().setDepth(15);
    slash1.lineStyle(6, 0xffffff, 1);
    slash1.beginPath();
    slash1.moveTo(target.x - 60, target.y - 60);
    slash1.lineTo(target.x + 60, target.y + 120);
    slash1.strokePath();

    const slashGlow2 = this.add
      .graphics()
      .setDepth(14)
      .setBlendMode(Phaser.BlendModes.ADD);
    slashGlow2.lineStyle(20, 0xff0000, 0.6);
    slashGlow2.beginPath();
    slashGlow2.moveTo(target.x + 60, target.y - 60);
    slashGlow2.lineTo(target.x - 60, target.y + 120);
    slashGlow2.strokePath();

    const slash2 = this.add.graphics().setDepth(15);
    slash2.lineStyle(6, 0xffffff, 1);
    slash2.beginPath();
    slash2.moveTo(target.x + 60, target.y - 60);
    slash2.lineTo(target.x - 60, target.y + 120);
    slash2.strokePath();

    this.cameras.main.shake(200, 0.02);

    this.tweens.add({
      targets: [slash1, slash2, slashGlow1, slashGlow2],
      alpha: 0,
      scale: 2,
      duration: 300,
      ease: "Cubic.easeOut",
      onComplete: () => {
        slash1.destroy();
        slash2.destroy();
        slashGlow1.destroy();
        slashGlow2.destroy();

        // Shockwave ring
        for (let i = 0; i < 4; i++) {
          const ring = this.add
            .circle(target.x, target.y + 120, 40, 0xff0000)
            .setStrokeStyle(10, 0xff0000)
            .setDepth(20)
            .setAlpha(0)
            .setBlendMode(Phaser.BlendModes.ADD);
          ring.isFilled = false;
          this.tweens.add({
            targets: ring,
            scale: 10 + i * 5,
            alpha: { start: 1, end: 0 },
            duration: 400 + i * 100,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
          });
        }

        // Small explosion
        const exp = this.add
          .circle(target.x, target.y + 120, 30, 0xff0000)
          .setDepth(16)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: exp,
          scale: 4,
          alpha: 0,
          duration: 250,
          onComplete: () => exp.destroy(),
        });

        this.createImpactEffect(target.x, target.y + 120, 0xff0000, "beam");
        this.takeDamage(!isP, dmg);
        this.onSpecialComplete(isP);
      },
    });
  }

  private specialMalevolentShrine(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(140 * this.getDamageMultiplier(transLevel));

    this.log("CASTELO MANIVOLENTE!");
    if (this.cache.audio.exists("sfx_attack"))
      this.sound.play("sfx_attack", { rate: 0.5 });

    // Screen goes dark red
    const darkOverlay = this.add
      .rectangle(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        this.cameras.main.width,
        this.cameras.main.height,
        0x5a0000,
        0,
      )
      .setDepth(8);

    this.tweens.add({
      targets: darkOverlay,
      fillAlpha: 0.8,
      duration: 500,
      onComplete: () => {
        if (!this.scene.isActive()) return;

        // Shrine visual (Demonic Temple)
        const shrine = this.add.graphics().setDepth(9);
        const sx = attacker.x;
        const sy = attacker.y - 40;

        // Base/Platform
        shrine.fillStyle(0x1a1a1a, 1);
        shrine.fillRect(sx - 100, sy, 200, 40);
        shrine.fillRect(sx - 80, sy - 20, 160, 20);

        // Pillars
        shrine.fillStyle(0x2a0000, 1);
        shrine.fillRect(sx - 60, sy - 120, 20, 100);
        shrine.fillRect(sx + 40, sy - 120, 20, 100);

        // Roof tiers (Pagoda style)
        shrine.fillStyle(0x0f0f0f, 1);
        shrine.beginPath();
        shrine.moveTo(sx - 90, sy - 120);
        shrine.lineTo(sx + 90, sy - 120);
        shrine.lineTo(sx + 70, sy - 150);
        shrine.lineTo(sx - 70, sy - 150);
        shrine.closePath();
        shrine.fillPath();

        shrine.beginPath();
        shrine.moveTo(sx - 60, sy - 150);
        shrine.lineTo(sx + 60, sy - 150);
        shrine.lineTo(sx + 40, sy - 190);
        shrine.lineTo(sx - 40, sy - 190);
        shrine.closePath();
        shrine.fillPath();

        // Center Core / Mouth
        shrine.fillStyle(0x000000, 1);
        shrine.fillRect(sx - 30, sy - 100, 60, 80);
        shrine.fillStyle(0x8b0000, 1);
        shrine.fillCircle(sx, sy - 60, 15); // Glowing eye/core

        // Skulls/Bones scattered
        shrine.fillStyle(0xdddddd, 1);
        for (let k = 0; k < 8; k++) {
          shrine.fillCircle(
            sx + Phaser.Math.Between(-80, 80),
            sy + Phaser.Math.Between(0, 30),
            Phaser.Math.Between(3, 6),
          );
        }

        // Shrine entrance animation
        shrine.setAlpha(0);
        shrine.y += 50;
        this.tweens.add({
          targets: shrine,
          alpha: 1,
          y: "-=50",
          duration: 400,
          ease: "Back.easeOut",
        });

        this.cameras.main.shake(1500, 0.02);

        // Relentless slashes (Cleave/Dismantle storm)
        const slashGraphics = this.add.graphics().setDepth(15);
        for (let i = 0; i < 25; i++) {
          this.time.delayedCall(i * 60, () => {
            if (!this.scene.isActive()) return;
            const cx = target.x + Phaser.Math.Between(-60, 60);
            const cy = target.y + 120 + Phaser.Math.Between(-80, 80);
            const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
            const length = Phaser.Math.Between(80, 200);

            // Black core
            slashGraphics.lineStyle(8, 0x000000, 1);
            slashGraphics.beginPath();
            slashGraphics.moveTo(
              cx - (Math.cos(angle) * length) / 2,
              cy - (Math.sin(angle) * length) / 2,
            );
            slashGraphics.lineTo(
              cx + (Math.cos(angle) * length) / 2,
              cy + (Math.sin(angle) * length) / 2,
            );
            slashGraphics.strokePath();

            // Red outline
            slashGraphics.lineStyle(4, 0xff0000, 1);
            slashGraphics.beginPath();
            slashGraphics.moveTo(
              cx - (Math.cos(angle) * length) / 2,
              cy - (Math.sin(angle) * length) / 2,
            );
            slashGraphics.lineTo(
              cx + (Math.cos(angle) * length) / 2,
              cy + (Math.sin(angle) * length) / 2,
            );
            slashGraphics.strokePath();

            // Fade out effect using a tween on the graphics object would clear everything,
            // so we'll just clear it after a short delay or use individual rectangles for better control
            // Actually, for 25 slashes, individual rectangles are better if we want them to fade independently.
            // Let's use rectangles instead of graphics for slashes.
            const slashRect = this.add
              .rectangle(cx, cy, length, 8, 0x000000)
              .setDepth(15)
              .setRotation(angle);
            const slashCore = this.add
              .rectangle(cx, cy, length, 3, 0xff0000)
              .setDepth(16)
              .setRotation(angle);

            this.tweens.add({
              targets: [slashRect, slashCore],
              alpha: 0,
              scaleX: 1.5,
              duration: 150,
              onComplete: () => {
                slashRect.destroy();
                slashCore.destroy();
              },
            });

            this.createImpactEffect(cx, cy, 0x8b0000);
            if (this.cache.audio.exists("sfx_hit"))
              this.sound.play("sfx_hit", { volume: 0.5 });
            this.cameras.main.shake(30, 0.015);
          });
        }

        this.time.delayedCall(1600, () => {
          if (!this.scene.isActive()) return;
          slashGraphics.destroy();

          // Final massive slash
          this.createScreenFlash(0xff0000, 400, 0.9);
          this.cameras.main.shake(600, 0.06);
          if (this.cache.audio.exists("sfx_explosion"))
            this.sound.play("sfx_explosion");

          const finalSlash = this.add
            .rectangle(target.x, target.y + 120, 400, 20, 0xff0000)
            .setDepth(16)
            .setRotation(Math.PI / 4);
          const finalSlashCore = this.add
            .rectangle(target.x, target.y + 120, 400, 8, 0xffffff)
            .setDepth(17)
            .setRotation(Math.PI / 4);
          this.tweens.add({
            targets: [finalSlash, finalSlashCore],
            scaleY: 5,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              finalSlash.destroy();
              finalSlashCore.destroy();
            },
          });

          this.createImpactEffect(target.x, target.y + 120, 0xff0000, "beam");
          this.takeDamage(!isP, dmg);

          // Shockwave rings
          for (let i = 0; i < 6; i++) {
            const ring = this.add
              .circle(target.x, target.y + 120, 50, 0xff0000)
              .setStrokeStyle(12, 0xff0000)
              .setDepth(20)
              .setAlpha(0)
              .setBlendMode(Phaser.BlendModes.ADD);
            ring.isFilled = false;
            this.tweens.add({
              targets: ring,
              scale: 12 + i * 6,
              alpha: { start: 1, end: 0 },
              duration: 500 + i * 150,
              ease: "Cubic.easeOut",
              onComplete: () => ring.destroy(),
            });
          }

          // Fade out domain
          this.tweens.add({
            targets: [darkOverlay, shrine],
            alpha: 0,
            duration: 500,
            onComplete: () => {
              darkOverlay.destroy();
              shrine.destroy();
              this.onSpecialComplete(isP);
            },
          });
        });
      },
    });
  }

  private specialRedAndBlue(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(45 * this.getDamageMultiplier(transLevel));

    this.log("CURSED TECHNIQUE: RED & BLUE!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    const hand = this.getHandPosition(isP);

    // Create Blue (Attract)
    const blueGlow = this.add
      .circle(hand.x, hand.y - 30, 20, 0x0000ff)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const blue = this.add
      .circle(hand.x, hand.y - 30, 8, 0x0000ff, 1)
      .setDepth(10);
    const blueCore = this.add
      .circle(hand.x, hand.y - 30, 3, 0xffffff, 1)
      .setDepth(11);

    // Create Red (Repel)
    const redGlow = this.add
      .circle(hand.x, hand.y + 30, 20, 0xff0000)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const red = this.add
      .circle(hand.x, hand.y + 30, 8, 0xff0000, 1)
      .setDepth(10);
    const redCore = this.add
      .circle(hand.x, hand.y + 30, 3, 0xffffff, 1)
      .setDepth(11);

    // Particles
    const blueParticles = this.add
      .particles(0, 0, "particle", {
        follow: blue,
        scale: { start: 0.5, end: 0 },
        lifespan: 200,
        tint: 0x0000ff,
        blendMode: "ADD",
      })
      .setDepth(8);

    const redParticles = this.add
      .particles(0, 0, "particle", {
        follow: red,
        scale: { start: 0.5, end: 0 },
        lifespan: 200,
        tint: 0xff0000,
        blendMode: "ADD",
      })
      .setDepth(8);

    this.tweens.add({
      targets: [blue, red, blueGlow, redGlow, blueCore, redCore],
      scale: 3,
      duration: 400,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Shoot them
        this.tweens.add({
          targets: [blue, blueGlow, blueCore],
          x: target.x,
          y: target.y + 120,
          duration: 250,
          ease: "Power2",
        });
        this.tweens.add({
          targets: [red, redGlow, redCore],
          x: target.x,
          y: target.y + 20,
          duration: 250,
          ease: "Power2",
          onComplete: () => {
            blue.destroy();
            blueGlow.destroy();
            blueCore.destroy();
            red.destroy();
            redGlow.destroy();
            redCore.destroy();
            blueParticles.stop();
            redParticles.stop();
            this.time.delayedCall(200, () => {
              blueParticles.destroy();
              redParticles.destroy();
            });

            this.createScreenFlash(0x8a2be2, 500, 1);
            this.cameras.main.shake(800, 0.08);

            // Purple explosion
            const exp = this.add
              .circle(target.x, target.y + 120, 20, 0x8a2be2)
              .setDepth(16)
              .setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
              targets: exp,
              scale: 8,
              alpha: 0,
              duration: 400,
              onComplete: () => exp.destroy(),
            });

            this.createImpactEffect(target.x, target.y + 120, 0x8a2be2, "beam");
            this.takeDamage(!isP, dmg);

            // Shockwave rings
            for (let i = 0; i < 4; i++) {
              const ring = this.add
                .circle(target.x, target.y + 120, 40, 0x8a2be2)
                .setStrokeStyle(10, 0x8a2be2)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 10 + i * 5,
                alpha: { start: 1, end: 0 },
                duration: 400 + i * 100,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            this.onSpecialComplete(isP);
          },
        });
      },
    });
  }

  private specialHollowPurple(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(150 * this.getDamageMultiplier(transLevel));

    this.log("HOLLOW PURPLE!");
    if (this.cache.audio.exists("sfx_beam"))
      this.sound.play("sfx_beam", { rate: 0.8 });

    const hand = this.getHandPosition(isP);

    // Screen darken
    const darkOverlay = this.add
      .rectangle(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0,
      )
      .setDepth(8);
    this.tweens.add({ targets: darkOverlay, fillAlpha: 0.9, duration: 500 });

    // Combine Red and Blue
    const blueGlow = this.add
      .circle(hand.x - (attacker.x < target.x ? 40 : -40), hand.y, 40, 0x0000ff)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const blue = this.add
      .circle(hand.x - (attacker.x < target.x ? 40 : -40), hand.y, 20, 0x0000ff, 1)
      .setDepth(10)
      .setBlendMode(Phaser.BlendModes.ADD);

    const redGlow = this.add
      .circle(hand.x + (attacker.x < target.x ? 40 : -40), hand.y, 40, 0xff0000)
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const red = this.add
      .circle(hand.x + (attacker.x < target.x ? 40 : -40), hand.y, 20, 0xff0000, 1)
      .setDepth(10)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Swirling particles
    const swirlEvent = this.time.addEvent({
      delay: 20,
      callback: () => {
        if (!this.scene.isActive()) return;
        const bPart = this.add
          .circle(
            blue.x + (Math.random() * 40 - 20),
            blue.y + (Math.random() * 40 - 20),
            8,
            0x0000ff,
          )
          .setDepth(11)
          .setBlendMode(Phaser.BlendModes.ADD);
        const rPart = this.add
          .circle(
            red.x + (Math.random() * 40 - 20),
            red.y + (Math.random() * 40 - 20),
            8,
            0xff0000,
          )
          .setDepth(11)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: [bPart, rPart],
          alpha: 0,
          scale: 0.1,
          duration: 300,
          onComplete: () => {
            bPart.destroy();
            rPart.destroy();
          },
        });
      },
      repeat: 40,
    });

    this.tweens.add({
      targets: [blue, red, blueGlow, redGlow],
      x: hand.x,
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        blue.destroy();
        red.destroy();
        blueGlow.destroy();
        redGlow.destroy();

        // Purple Core
        const purpleGlow = this.add
          .circle(hand.x, hand.y, 100, 0x8a2be2)
          .setDepth(9)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.8);
        const purple = this.add
          .circle(hand.x, hand.y, 45, 0x8a2be2, 1)
          .setDepth(10);
        const purpleAura = this.add
          .circle(hand.x, hand.y, 70, 0x8a2be2, 0.8)
          .setDepth(9)
          .setBlendMode(Phaser.BlendModes.ADD);
        const purpleCore = this.add
          .circle(hand.x, hand.y, 20, 0xffffff, 1)
          .setDepth(11);

        this.createScreenFlash(0x8a2be2, 500, 0.9);
        this.cameras.main.shake(1000, 0.06);

        // Lightning around purple
        const lightningEvent = this.time.addEvent({
          delay: 40,
          callback: () => {
            if (!this.scene.isActive()) return;
            const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
            const length = Phaser.Math.Between(80, 150);
            const spark = this.add
              .graphics()
              .setDepth(12)
              .setBlendMode(Phaser.BlendModes.ADD);
            spark.lineStyle(4, 0xffffff, 1);
            spark.beginPath();
            spark.moveTo(purple.x, purple.y);
            spark.lineTo(
              purple.x + Math.cos(angle) * length,
              purple.y + Math.sin(angle) * length,
            );
            spark.strokePath();
            this.tweens.add({
              targets: spark,
              alpha: 0,
              duration: 100,
              onComplete: () => spark.destroy(),
            });
          },
          repeat: 15,
        });

        this.time.delayedCall(600, () => {
          if (this.cache.audio.exists("sfx_explosion"))
            this.sound.play("sfx_explosion");

          // Fire Hollow Purple
          this.tweens.add({
            targets: [purple, purpleAura, purpleCore, purpleGlow],
            x: isP ? target.x + 300 : target.x - 300, // Go through target
            scale: 12,
            duration: 400,
            ease: "Power2",
            onUpdate: () => {
              // Destroy everything in its path (visual effect)
              if (!this.scene.isActive()) return;

              // Use a local flag to trigger impact only once per attack
              if (
                !attacker.getData("hollowPurpleTriggered") &&
                Math.abs(purple.x - target.x) < 120
              ) {
                attacker.setData("hollowPurpleTriggered", true);
                this.createImpactEffect(target.x, target.y + 120, 0x8a2be2, "beam");
                this.cameras.main.shake(300, 0.15);

                // Spatial distortion rings
                for (let i = 0; i < 4; i++) {
                  const ring = this.add
                    .circle(target.x, target.y + 120, 30, 0x8a2be2)
                    .setStrokeStyle(10, 0x8a2be2)
                    .setDepth(20)
                    .setAlpha(0.8)
                    .setBlendMode(Phaser.BlendModes.ADD);
                  ring.isFilled = false;
                  this.tweens.add({
                    targets: ring,
                    scale: 15 + i * 5,
                    alpha: 0,
                    duration: 300 + i * 100,
                    ease: "Cubic.easeOut",
                    onComplete: () => ring.destroy(),
                  });
                }
              }
            },
            onComplete: () => {
              attacker.setData("hollowPurpleTriggered", false);
              purple.destroy();
              purpleAura.destroy();
              purpleCore.destroy();
              purpleGlow.destroy();
              lightningEvent.remove();

              this.createScreenFlash(0x8a2be2, 600, 1);
              this.cameras.main.shake(1500, 0.15);
              if (this.cache.audio.exists("sfx_explosion"))
                this.sound.play("sfx_explosion");

              // Massive Purple Void
              const voidGlow = this.add
                .circle(target.x, target.y + 120, 300, 0x8a2be2)
                .setDepth(20)
                .setAlpha(0.6)
                .setBlendMode(Phaser.BlendModes.ADD);
              const purpleVoid = this.add
                .circle(target.x, target.y + 120, 200, 0x4b0082)
                .setDepth(21);
              const voidCore = this.add
                .circle(target.x, target.y + 120, 100, 0xffffff)
                .setDepth(22)
                .setBlendMode(Phaser.BlendModes.ADD);

              // Shockwave rings
              for (let i = 0; i < 8; i++) {
                const ring = this.add
                  .circle(target.x, target.y + 120, 50, 0x8a2be2)
                  .setStrokeStyle(15, 0x8a2be2)
                  .setDepth(23)
                  .setAlpha(0)
                  .setBlendMode(Phaser.BlendModes.ADD);
                ring.isFilled = false;
                this.tweens.add({
                  targets: ring,
                  scale: 15 + i * 10,
                  alpha: { start: 1, end: 0 },
                  duration: 600 + i * 150,
                  ease: "Cubic.easeOut",
                  onComplete: () => ring.destroy(),
                });
              }

              this.tweens.add({
                targets: [purpleVoid, voidCore, voidGlow],
                scale: 4,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                  purpleVoid.destroy();
                  voidCore.destroy();
                  voidGlow.destroy();
                },
              });

              this.createImpactEffect(target.x, target.y + 120, 0x8a2be2, "beam");
              this.takeDamage(!isP, dmg);

              this.tweens.add({
                targets: darkOverlay,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                  darkOverlay.destroy();
                  this.onSpecialComplete(isP);
                },
              });
            },
          });
        });
      },
    });
  }

  private specialAmaterasu(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(40 * this.getDamageMultiplier(transLevel));

    this.log("AMATERASU!");
    attacker.play(this.getAnimKey("itachi", transLevel, "attack"));
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Eye bleeding effect on attacker (Itachi)
    const eyeBleed = this.add
      .rectangle(attacker.x + (isP ? 5 : -5), attacker.y - 25, 2, 10, 0xff0000)
      .setDepth(15);
    this.tweens.add({
      targets: eyeBleed,
      scaleY: 3,
      alpha: 0,
      duration: 800,
      ease: "Sine.easeIn",
      onComplete: () => eyeBleed.destroy(),
    });

    // Screen darkens slightly
    const darkOverlay = this.add
      .rectangle(480, 270, 960, 540, 0x000000, 0)
      .setDepth(13);
    this.tweens.add({
      targets: darkOverlay,
      fillAlpha: 0.5,
      duration: 300,
      yoyo: true,
      hold: 1000,
    });

    // Black fire on target
    const fireGlow = this.add
      .circle(target.x, target.y + 120, 60, 0x8b0000)
      .setDepth(14)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);
    const fire = this.add
      .circle(target.x, target.y + 120, 30, 0x000000)
      .setDepth(15)
      .setAlpha(0.9);

    // Black fire particles
    const particles = this.add
      .particles(0, 0, "particle", {
        color: [0x000000, 0x8b0000],
        colorEase: "quad.out",
        lifespan: 800,
        angle: { min: 240, max: 300 },
        scale: { start: 1.5, end: 0 },
        speed: { min: 100, max: 250 },
        blendMode: "NORMAL",
      })
      .setDepth(16);
    particles.startFollow(fire);

    this.cameras.main.shake(1000, 0.02);

    this.tweens.add({
      targets: [fire, fireGlow],
      scale: 3.5,
      yoyo: true,
      repeat: 3,
      duration: 250,
      onComplete: () => {
        fire.destroy();
        fireGlow.destroy();
        particles.stop();
        this.time.delayedCall(800, () => particles.destroy());
      },
    });

    this.time.delayedCall(1000, () => {
      if (!this.scene.isActive()) return;
      if (this.cache.audio.exists("sfx_explosion"))
        this.sound.play("sfx_explosion");

      this.createScreenFlash(0x8b0000, 500, 1);
      this.createImpactEffect(target.x, target.y + 120, 0x000000, "beam");

      // Shockwave rings
      for (let i = 0; i < 5; i++) {
        const ring = this.add
          .circle(target.x, target.y + 120, 40, 0x8b0000)
          .setStrokeStyle(12, 0x8b0000)
          .setDepth(20)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD);
        ring.isFilled = false;
        this.tweens.add({
          targets: ring,
          scale: 12 + i * 6,
          alpha: { start: 1, end: 0 },
          duration: 500 + i * 150,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      }

      this.takeDamage(!isP, dmg);
      this.cameras.main.shake(1000, 0.1);

      this.time.delayedCall(300, () => {
        darkOverlay.destroy();
        this.onSpecialComplete(isP);
      });
    });
  }

  private specialTsukuyomi(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(100 * this.getDamageMultiplier(transLevel));

    this.log("TSUKUYOMI!");
    attacker.play(this.getAnimKey("itachi", transLevel, "attack"));
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Screen turns red/black
    const bg = this.add
      .rectangle(480, 270, 960, 540, 0x8b0000)
      .setDepth(13)
      .setAlpha(0);

    this.tweens.add({
      targets: bg,
      alpha: 0.9,
      duration: 300,
      onComplete: () => {
        // Giant Sharingan eye in background
        const eyeGlow = this.add
          .circle(480, 270, 200, 0xff0000)
          .setDepth(13)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD);
        const eye = this.add
          .circle(480, 270, 150, 0xff0000)
          .setDepth(14)
          .setAlpha(0);
        const pupil = this.add
          .circle(480, 270, 30, 0x000000)
          .setDepth(14)
          .setAlpha(0);

        // Tomoe
        const tomoes: Phaser.GameObjects.Graphics[] = [];
        for (let i = 0; i < 3; i++) {
          const t = this.add.graphics().setDepth(14).setAlpha(0);
          t.fillStyle(0x000000, 1);
          t.fillCircle(0, 0, 15);
          t.setPosition(
            480 + Math.cos((i * Math.PI * 2) / 3) * 80,
            270 + Math.sin((i * Math.PI * 2) / 3) * 80,
          );
          tomoes.push(t);
        }

        // Invert colors effect
        // We can't easily invert colors with standard Phaser without a custom pipeline,
        // so we'll simulate it with a strong flash and color overlay
        this.createScreenFlash(0xffffff, 300, 0.9);
        this.cameras.main.shake(1000, 0.02);

        this.tweens.add({
          targets: [eye, pupil, eyeGlow, ...tomoes],
          alpha: 0.9,
          scale: 1.8,
          duration: 500,
          yoyo: true,
          hold: 1000,
          onUpdate: (tween) => {
            // Spin tomoes
            const progress = tween.getValue();
            tomoes.forEach((t, i) => {
              const angle = (i * Math.PI * 2) / 3 + progress * Math.PI * 6;
              t.setPosition(
                480 + Math.cos(angle) * 80 * progress,
                270 + Math.sin(angle) * 80 * progress,
              );
            });
          },
          onComplete: () => {
            eye.destroy();
            pupil.destroy();
            eyeGlow.destroy();
            tomoes.forEach((t) => t.destroy());

            this.tweens.add({
              targets: bg,
              alpha: 0,
              duration: 300,
              onComplete: () => bg.destroy(),
            });

            if (this.cache.audio.exists("sfx_explosion"))
              this.sound.play("sfx_explosion");

            // Multiple invisible slashes
            for (let i = 0; i < 8; i++) {
              this.time.delayedCall(i * 80, () => {
                if (!this.scene.isActive()) return;
                this.createImpactEffect(
                  target.x + Phaser.Math.Between(-40, 40),
                  target.y + 120 + Phaser.Math.Between(-40, 40),
                  0x000000,
                  "melee",
                );
                this.cameras.main.shake(150, 0.03);
              });
            }

            this.time.delayedCall(700, () => {
              this.createScreenFlash(0xffffff, 600, 1);
              this.takeDamage(!isP, dmg);
              this.cameras.main.shake(1000, 0.1);

              // Shockwave rings
              for (let i = 0; i < 6; i++) {
                const ring = this.add
                  .circle(target.x, target.y + 120, 50, 0x8b0000)
                  .setStrokeStyle(12, 0x8b0000)
                  .setDepth(20)
                  .setAlpha(0)
                  .setBlendMode(Phaser.BlendModes.ADD);
                ring.isFilled = false;
                this.tweens.add({
                  targets: ring,
                  scale: 12 + i * 6,
                  alpha: { start: 1, end: 0 },
                  duration: 500 + i * 150,
                  ease: "Cubic.easeOut",
                  onComplete: () => ring.destroy(),
                });
              }

              this.onSpecialComplete(isP);
            });
          },
        });
      },
    });
  }

  private specialKamui(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(60 * this.getDamageMultiplier(transLevel));
    const startX = attacker.x;

    this.log("KAMUI!");
    if (this.cache.audio.exists("sfx_attack")) this.sound.play("sfx_attack");

    // Swirl effect around attacker
    const swirlGlow = this.add
      .circle(attacker.x, attacker.y + 120, 60, 0x000000)
      .setDepth(14)
      .setAlpha(0.6);
    const swirl = this.add.graphics().setDepth(15);
    swirl.lineStyle(10, 0x000000, 0.9);
    swirl.strokeCircle(attacker.x, attacker.y, 40);

    const swirlCore = this.add
      .circle(attacker.x, attacker.y + 120, 15, 0x000000)
      .setDepth(16);

    // Distortion spiral
    const spiral = this.add
      .particles(attacker.x, attacker.y, "particle", {
        color: [0x000000, 0x444444],
        colorEase: "quad.out",
        lifespan: 500,
        angle: { min: 0, max: 360 },
        scale: { start: 2, end: 0 },
        speed: { min: 100, max: 200 },
        blendMode: "MULTIPLY",
      })
      .setDepth(14);

    this.cameras.main.shake(300, 0.02);

    this.tweens.add({
      targets: [swirl, swirlCore, swirlGlow],
      scale: 0,
      angle: 1080,
      duration: 500,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (!this.scene.isActive()) return;
        swirl.destroy();
        swirlCore.destroy();
        swirlGlow.destroy();
        spiral.stop();
        attacker.setVisible(false); // Teleport

        // Spatial distortion sound
        if (this.cache.audio.exists("sfx_beam"))
          this.sound.play("sfx_beam", { rate: 1.5, volume: 0.5 });

        // Reappear behind target
        this.time.delayedCall(400, () => {
          if (!this.scene.isActive()) return;
          attacker.x = target.x + (isP ? 60 : -60);
          attacker.setVisible(true);

          // Swirl reappear
          const swirlGlow2 = this.add
            .circle(attacker.x, attacker.y + 120, 10, 0x000000)
            .setDepth(14)
            .setAlpha(0.6);
          const swirl2 = this.add.graphics().setDepth(15);
          swirl2.lineStyle(10, 0x000000, 0.9);
          swirl2.strokeCircle(attacker.x, attacker.y, 5);

          const swirlCore2 = this.add
            .circle(attacker.x, attacker.y + 120, 5, 0x000000)
            .setDepth(16);

          const spiral2 = this.add
            .particles(attacker.x, attacker.y, "particle", {
              color: [0x000000, 0x444444],
              colorEase: "quad.out",
              lifespan: 500,
              angle: { min: 0, max: 360 },
              scale: { start: 0, end: 2 },
              speed: { min: 100, max: 200 },
              blendMode: "MULTIPLY",
            })
            .setDepth(14);

          this.cameras.main.shake(400, 0.04);

          this.tweens.add({
            targets: [swirl2, swirlCore2, swirlGlow2],
            scale: 12,
            angle: 1080,
            alpha: 0,
            duration: 500,
            ease: "Cubic.easeOut",
            onComplete: () => {
              swirl2.destroy();
              swirlCore2.destroy();
              spiral2.stop();
              this.time.delayedCall(400, () => {
                spiral.destroy();
                spiral2.destroy();
              });
            },
          });

          // Strike
          this.time.delayedCall(100, () => {
            if (!this.scene.isActive()) return;
            attacker.play(this.getAnimKey("obito", transLevel, "attack"));
            if (this.cache.audio.exists("sfx_hit")) this.sound.play("sfx_hit");

            // Distortion impact
            const impactSwirl = this.add
              .circle(target.x, target.y + 120, 10, 0x000000)
              .setDepth(20);
            this.tweens.add({
              targets: impactSwirl,
              scale: 10,
              alpha: 0,
              duration: 300,
              onComplete: () => impactSwirl.destroy(),
            });

            this.createImpactEffect(target.x, target.y + 120, 0x000000, "melee");
            this.takeDamage(!isP, dmg);
            this.cameras.main.shake(200, 0.03);

            // Shockwave rings
            for (let i = 0; i < 5; i++) {
              const ring = this.add
                .circle(target.x, target.y + 120, 40, 0x000000)
                .setStrokeStyle(10, 0x000000)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.MULTIPLY);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 12 + i * 6,
                alpha: { start: 1, end: 0 },
                duration: 500 + i * 150,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            // Slash effect
            const slash = this.add
              .rectangle(target.x, target.y + 120, 100, 5, 0xffffff)
              .setDepth(20)
              .setRotation(Math.PI / 4);
            this.tweens.add({
              targets: slash,
              scaleY: 5,
              alpha: 0,
              duration: 200,
              onComplete: () => slash.destroy(),
            });

            // Teleport back
            this.time.delayedCall(500, () => {
              if (!this.scene.isActive()) return;
              attacker.setVisible(false);

              this.time.delayedCall(200, () => {
                if (!this.scene.isActive()) return;
                attacker.x = startX;
                attacker.setVisible(true);
                this.onSpecialComplete(isP);
              });
            });
          });
        });
      },
    });
  }

  private specialStarFinger(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(45 * this.getDamageMultiplier(transLevel));

    this.log("STAR FINGER!");
    attacker.play(this.getAnimKey("jotaro", transLevel, "attack"));
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Stand aura
    const aura = this.add
      .circle(attacker.x, attacker.y + 120, 60, 0x8a2be2)
      .setDepth(8)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: aura,
      alpha: 0.6,
      scale: 1.5,
      duration: 200,
      yoyo: true,
    });

    // Elongated purple beam
    const hand = this.getHandPosition(isP);
    const fingerGlow = this.add
      .rectangle(hand.x, hand.y, 20, 20, 0x8a2be2)
      .setDepth(14)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6);
    const finger = this.add
      .rectangle(hand.x, hand.y, 10, 10, 0x8a2be2)
      .setDepth(15);
    const fingerCore = this.add
      .rectangle(hand.x, hand.y, 4, 4, 0xffffff)
      .setDepth(16);

    this.tweens.add({
      targets: [finger, fingerCore, fingerGlow],
      x: target.x,
      scaleX: 40, // Stretch it out
      duration: 150,
      ease: "Power2",
      onComplete: () => {
        this.createImpactEffect(target.x, target.y + 120, 0x8a2be2, "beam");

        // Piercing effect
        const pierce = this.add
          .circle(target.x, target.y + 120, 30, 0xffffff)
          .setDepth(20)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: pierce,
          scale: 4,
          alpha: 0,
          duration: 200,
          onComplete: () => pierce.destroy(),
        });

        // Shockwave rings
        for (let i = 0; i < 4; i++) {
          const ring = this.add
            .circle(target.x, target.y + 120, 40, 0x8a2be2)
            .setStrokeStyle(10, 0x8a2be2)
            .setDepth(20)
            .setAlpha(0)
            .setBlendMode(Phaser.BlendModes.ADD);
          ring.isFilled = false;
          this.tweens.add({
            targets: ring,
            scale: 10 + i * 5,
            alpha: { start: 1, end: 0 },
            duration: 400 + i * 100,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
          });
        }

        this.takeDamage(!isP, dmg);
        this.cameras.main.shake(600, 0.08);
        this.createScreenFlash(0x8a2be2, 400, 0.8);
        if (this.cache.audio.exists("sfx_hit"))
          this.sound.play("sfx_hit", { rate: 1.2 });

        this.tweens.add({
          targets: [finger, fingerCore, fingerGlow],
          alpha: 0,
          duration: 150,
          onComplete: () => {
            finger.destroy();
            fingerCore.destroy();
            fingerGlow.destroy();
            this.onSpecialComplete(isP);
          },
        });
      },
    });
  }

  private specialOraOraOra(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(110 * this.getDamageMultiplier(transLevel));

    this.log("ORA ORA ORA ORA ORA!");
    attacker.play(this.getAnimKey("jotaro", transLevel, "attack"));
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Stand aura
    const aura = this.add
      .circle(attacker.x, attacker.y + 120, 60, 0x8a2be2)
      .setDepth(8)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: aura,
      alpha: 0.6,
      scale: 1.8,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    // Dash to target
    this.tweens.add({
      targets: attacker,
      x: target.x + (attacker.x < target.x ? -50 : 50),
      duration: 150,
      ease: "Power2",
      onComplete: () => {
        // Flurry of punches
        let punches = 0;
        const maxPunches = 25;
        const punchInterval = this.time.addEvent({
          delay: 30,
          callback: () => {
            if (!this.scene.isActive()) return;

            const hitX = target.x + (Math.random() * 80 - 40);
            const hitY = target.y + 120 + (Math.random() * 80 - 40);

            // Fist graphic
            const hand = this.getHandPosition(isP);
            const fist = this.add
              .circle(hand.x, hand.y, 20, 0x8a2be2)
              .setDepth(15)
              .setBlendMode(Phaser.BlendModes.ADD);

            this.tweens.add({
              targets: fist,
              x: hitX,
              y: hitY,
              duration: 50,
              onComplete: () => {
                fist.destroy();

                const hitCircle = this.add
                  .circle(hitX, hitY, 40, 0x8a2be2)
                  .setAlpha(0.8)
                  .setDepth(15)
                  .setBlendMode(Phaser.BlendModes.ADD);
                this.tweens.add({
                  targets: hitCircle,
                  alpha: 0,
                  scale: 2.5,
                  duration: 150,
                  onComplete: () => hitCircle.destroy(),
                });

                // Impact lines (reduced to 1)
                const line = this.add
                  .rectangle(hitX, hitY, 80, 4, 0xffffff)
                  .setDepth(17)
                  .setRotation(Math.random() * Math.PI * 2)
                  .setBlendMode(Phaser.BlendModes.ADD);
                this.tweens.add({
                  targets: line,
                  scaleX: 2,
                  alpha: 0,
                  duration: 100,
                  onComplete: () => line.destroy(),
                });
              },
            });

            if (punches % 2 === 0 && this.cache.audio.exists("sfx_attack")) {
              this.sound.play("sfx_attack", { volume: 0.9, rate: 1.2 });
            }

            this.cameras.main.shake(50, 0.04);

            // Target hit flash
            target.setTintFill(0xffffff);
            this.time.delayedCall(20, () => target.clearTint());

            punches++;

            if (punches >= maxPunches) {
              punchInterval.remove();

              // Final heavy punch
              this.time.delayedCall(100, () => {
                this.createScreenFlash(0xffd700, 600, 1);
                this.createImpactEffect(
                  target.x,
                  target.y + 120,
                  0xffd700,
                  "beam",
                );
                this.cameras.main.shake(1200, 0.12);
                if (this.cache.audio.exists("sfx_explosion"))
                  this.sound.play("sfx_explosion");

                // Huge impact circle
                const finalHitGlow = this.add
                  .circle(target.x, target.y + 120, 150, 0xffd700)
                  .setDepth(19)
                  .setAlpha(0.6)
                  .setBlendMode(Phaser.BlendModes.ADD);
                const finalHit = this.add
                  .circle(target.x, target.y + 120, 100, 0xffd700)
                  .setDepth(20)
                  .setAlpha(0.8);
                this.tweens.add({
                  targets: [finalHit, finalHitGlow],
                  scale: 6,
                  alpha: 0,
                  duration: 600,
                  onComplete: () => {
                    finalHit.destroy();
                    finalHitGlow.destroy();
                  },
                });

                // Shockwave rings
                for (let i = 0; i < 5; i++) {
                  const ring = this.add
                    .circle(target.x, target.y + 120, 50, 0xffd700)
                    .setStrokeStyle(12, 0xffd700)
                    .setDepth(21)
                    .setAlpha(0)
                    .setBlendMode(Phaser.BlendModes.ADD);
                  ring.isFilled = false;
                  this.tweens.add({
                    targets: ring,
                    scale: 12 + i * 6,
                    alpha: { start: 1, end: 0 },
                    duration: 500 + i * 150,
                    ease: "Cubic.easeOut",
                    onComplete: () => ring.destroy(),
                  });
                }

                this.takeDamage(!isP, dmg);

                // Knockback
                this.tweens.add({
                  targets: target,
                  x: target.x + (attacker.x < target.x ? 200 : -200),
                  duration: 250,
                  yoyo: true,
                  ease: "Sine.easeOut",
                });

                // Dash back
                this.tweens.add({
                  targets: attacker,
                  x: isP ? this.p1StartPos.x : this.p2StartPos.x,
                  duration: 200,
                  ease: "Power2",
                  onComplete: () => {
                    aura.destroy();
                    attacker.play(
                      this.getAnimKey("jotaro", transLevel, "idle"),
                    );
                    this.onSpecialComplete(isP);
                  },
                });
              });
            }
          },
          repeat: maxPunches - 1,
        });
      },
    });
  }

  private specialMajesticDestroyerFlame(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const dmg = Math.floor(
      45 *
        this.getDamageMultiplier(
          isP ? this.playerTransformLevel : this.enemyTransformLevel,
        ),
    );

    this.log("MAJESTIC DESTROYER FLAME!");
    if (this.cache.audio.exists("sfx_charge")) this.sound.play("sfx_charge");

    // Inhale effect
    const inhale = this.add
      .particles(attacker.x + (isP ? 20 : -20), attacker.y - 20, "particle", {
        color: [0xffa500, 0xff4500],
        colorEase: "quad.out",
        lifespan: 400,
        angle: { min: 0, max: 360 },
        scale: { start: 0, end: 1 },
        speed: { min: -150, max: -80 },
        blendMode: "ADD",
      })
      .setDepth(14);

    this.time.delayedCall(500, () => {
      if (!this.scene.isActive()) return;
      inhale.stop();
      this.time.delayedCall(400, () => inhale.destroy());

      if (this.cache.audio.exists("sfx_beam"))
        this.sound.play("sfx_beam", { volume: 1.5 });

      // Create a massive wall of fire
      const fireGroup = this.add.group();

      // Fire particles
      const hand = this.getHandPosition(isP);
      const fireParticles = this.add
        .particles(hand.x, hand.y, "particle", {
          color: [0xffffff, 0xffa500, 0xff0000],
          colorEase: "quad.out",
          lifespan: 1000,
          angle: { min: isP ? -45 : 135, max: isP ? 45 : 225 },
          scale: { start: 2, end: 5 },
          speed: { min: 400, max: 800 },
          blendMode: "ADD",
        })
        .setDepth(12);

      this.cameras.main.shake(800, 0.03);

      for (let i = 0; i < 30; i++) {
        const fireGlow = this.add
          .circle(
            attacker.x + (attacker.x < target.x ? 40 : -40),
            attacker.y - 60 + i * 8,
            40,
            0xff4500,
          )
          .setDepth(9)
          .setAlpha(0.6)
          .setBlendMode(Phaser.BlendModes.ADD);
        const fire = this.add
          .circle(
            attacker.x + (attacker.x < target.x ? 40 : -40),
            attacker.y - 60 + i * 8,
            25,
            0xff4500,
          )
          .setDepth(10);
        const core = this.add.circle(fire.x, fire.y, 15, 0xffa500).setDepth(11);
        fireGroup.add(fire);
        fireGroup.add(core);
        fireGroup.add(fireGlow);

        this.tweens.add({
          targets: [fire, core, fireGlow],
          x: target.x + (attacker.x < target.x ? 200 : -200),
          y: target.y - 80 + i * 12,
          scale: 4,
          duration: 800,
          ease: "Power1",
          onComplete: () => {
            fire.destroy();
            core.destroy();
            fireGlow.destroy();
          },
        });
      }

      this.time.delayedCall(800, () => {
        if (!this.scene.isActive()) return;
        fireParticles.stop();
        this.time.delayedCall(1000, () => fireParticles.destroy());

        this.takeDamage(!isP, dmg);

        this.createScreenFlash(0xff4500, 500, 1);
        this.createImpactEffect(target.x, target.y + 120, 0xff4500, "beam");
        this.cameras.main.shake(1000, 0.1);
        if (this.cache.audio.exists("sfx_explosion"))
          this.sound.play("sfx_explosion");

        // Shockwave rings
        for (let i = 0; i < 5; i++) {
          const ring = this.add
            .circle(target.x, target.y + 120, 50, 0xff4500)
            .setStrokeStyle(12, 0xff4500)
            .setDepth(20)
            .setAlpha(0)
            .setBlendMode(Phaser.BlendModes.ADD);
          ring.isFilled = false;
          this.tweens.add({
            targets: ring,
            scale: 12 + i * 6,
            alpha: { start: 1, end: 0 },
            duration: 500 + i * 150,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
          });
        }

        // Target burns
        target.setTint(0xff4500);
        this.time.delayedCall(500, () => target.clearTint());

        this.onSpecialComplete(isP);
      });
    });
  }

  private specialTengaiShinsei(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const dmg = Math.floor(
      100 *
        this.getDamageMultiplier(
          isP ? this.playerTransformLevel : this.enemyTransformLevel,
        ),
    );

    this.log("TENGAI SHINSEI!");
    if (this.cache.audio.exists("sfx_charge")) this.sound.play("sfx_charge");

    // Screen darkens
    const dark = this.add
      .rectangle(0, 0, 1000, 600, 0x000000, 0.8)
      .setOrigin(0)
      .setDepth(19);

    // Shadow growing on the ground
    const shadow = this.add
      .ellipse(target.x, target.y + 30, 0, 0, 0x000000)
      .setAlpha(0.9)
      .setDepth(1);
    this.tweens.add({
      targets: shadow,
      width: 800,
      height: 200,
      duration: 1800,
      ease: "Sine.easeIn",
    });

    // Camera rumble
    this.cameras.main.shake(1800, 0.02);

    this.time.delayedCall(800, () => {
      if (!this.scene.isActive()) return;
      if (this.cache.audio.exists("sfx_beam"))
        this.sound.play("sfx_beam", { volume: 2.0 });

      // Giant Meteor falling from sky
      const meteorGlow = this.add
        .circle(target.x, -300, 250, 0xff4500, 0.6)
        .setDepth(19)
        .setBlendMode(Phaser.BlendModes.ADD);
      const meteor = this.add
        .circle(target.x, -300, 200, 0x8b4513)
        .setDepth(20);

      // Fire trails
      const trailEvent = this.time.addEvent({
        delay: 20,
        callback: () => {
          if (!this.scene.isActive()) return;
          const trail = this.add
            .circle(
              meteor.x + (Math.random() * 300 - 150),
              meteor.y - 100,
              Math.random() * 50 + 30,
              0xff4500,
            )
            .setDepth(18)
            .setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({
            targets: trail,
            y: trail.y - 200,
            alpha: 0,
            scale: 0.5,
            duration: 500,
            onComplete: () => trail.destroy(),
          });
        },
        repeat: 50,
      });

      this.tweens.add({
        targets: [meteor, meteorGlow],
        y: target.y + 120,
        duration: 1000,
        ease: "Cubic.easeIn",
        onComplete: () => {
          if (!this.scene.isActive()) return;

          this.createScreenFlash(0xffffff, 1200, 1);

          // Massive explosion
          this.cameras.main.shake(2000, 0.2);
          if (this.cache.audio.exists("sfx_explosion"))
            this.sound.play("sfx_explosion", { volume: 2.5 });

          const explosionGlow = this.add
            .circle(target.x, target.y + 120, 400, 0xff4500)
            .setDepth(20)
            .setAlpha(0.6)
            .setBlendMode(Phaser.BlendModes.ADD);
          const explosion = this.add
            .circle(target.x, target.y + 120, 300, 0xff4500)
            .setDepth(21);
          const core = this.add
            .circle(target.x, target.y + 120, 200, 0xffffff)
            .setDepth(22);

          // Shockwave rings
          for (let i = 0; i < 8; i++) {
            const shockwave = this.add
              .circle(target.x, target.y + 120, 50, 0xffffff)
              .setStrokeStyle(20, 0xffffff)
              .setDepth(23)
              .setAlpha(0.8)
              .setBlendMode(Phaser.BlendModes.ADD);
            shockwave.isFilled = false;
            this.tweens.add({
              targets: shockwave,
              scale: 30 + i * 10,
              alpha: 0,
              duration: 800 + i * 150,
              ease: "Cubic.easeOut",
              onComplete: () => shockwave.destroy(),
            });
          }

          // Debris
          for (let i = 0; i < 25; i++) {
            const debris = this.add
              .rectangle(
                target.x,
                target.y + 120,
                Phaser.Math.Between(15, 40),
                Phaser.Math.Between(15, 40),
                0x8b4513,
              )
              .setDepth(24);
            const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
            const dist = Phaser.Math.Between(300, 800);
            this.tweens.add({
              targets: debris,
              x: target.x + Math.cos(angle) * dist,
              y: target.y + 120 + Math.sin(angle) * dist,
              rotation: Phaser.Math.Between(10, 30),
              alpha: 0,
              duration: 1000,
              ease: "Cubic.easeOut",
              onComplete: () => debris.destroy(),
            });
          }

          this.tweens.add({
            targets: [explosion, core, explosionGlow],
            scale: 3,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
              explosion.destroy();
              core.destroy();
              explosionGlow.destroy();
              meteor.destroy();
              meteorGlow.destroy();
              shadow.destroy();
            },
          });

          this.createImpactEffect(target.x, target.y + 120, 0xff4500, "beam");
          this.takeDamage(!isP, dmg);

          this.tweens.add({
            targets: dark,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
              dark.destroy();
              this.onSpecialComplete(isP);
            },
          });
        },
      });
    });
  }

  private specialTenTailsBeastBomb(isP: boolean) {
    const attacker = isP ? this.player : this.enemy;
    const target = isP ? this.enemy : this.player;
    const transLevel = isP
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const dmg = Math.floor(130 * this.getDamageMultiplier(transLevel));

    this.log("TEN-TAILS BEAST BOMB!");
    if (this.cache.audio.exists("sfx_beam"))
      this.sound.play("sfx_beam", { rate: 0.7 });

    // Charge massive dark red/black sphere
    const bombGlow = this.add
      .circle(attacker.x, attacker.y - 120, 15, 0xcc0000)
      .setDepth(14)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);
    const bomb = this.add
      .circle(attacker.x, attacker.y - 120, 5, 0x111111)
      .setDepth(15);
    const aura = this.add
      .circle(attacker.x, attacker.y - 120, 8, 0xcc0000)
      .setDepth(14)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.cameras.main.shake(1000, 0.02);

    // Gathering particles
    const gatherParticles = this.add
      .particles(0, 0, "particle", {
        x: attacker.x,
        y: attacker.y - 120,
        speed: { min: -350, max: 350 },
        scale: { start: 2, end: 0 },
        blendMode: "ADD",
        lifespan: 500,
        tint: 0xcc0000,
        gravityY: 0,
      })
      .setDepth(13);

    this.tweens.add({
      targets: [bomb, aura, bombGlow],
      scale: 30,
      duration: 1000,
      onComplete: () => {
        if (!this.scene.isActive()) return;
        gatherParticles.destroy();

        this.createScreenFlash(0xcc0000, 500, 0.9);
        this.cameras.main.shake(1000, 0.08);

        // Fire as a massive beam
        const beamOuter = this.add
          .rectangle(attacker.x, attacker.y - 120, 0, 250, 0xcc0000)
          .setOrigin(0, 0.5)
          .setDepth(4)
          .setAlpha(0.6)
          .setBlendMode(Phaser.BlendModes.ADD);
        const beam = this.add
          .rectangle(attacker.x, attacker.y - 120, 0, 180, 0x111111)
          .setOrigin(0, 0.5)
          .setDepth(5);
        beam.setStrokeStyle(8, 0xcc0000);

        beamOuter.scaleX = isP ? 1 : -1;
        beam.scaleX = isP ? 1 : -1;
        const distance = Math.abs(target.x - attacker.x) + 300;

        // Beam Head
        const beamHeadGlow = this.add
          .ellipse(attacker.x, attacker.y - 120, 150, 300, 0xcc0000)
          .setDepth(5)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.8);
        const beamHead = this.add
          .ellipse(attacker.x, attacker.y - 120, 80, 160, 0x111111)
          .setDepth(6);
        beamHead.setStrokeStyle(6, 0xcc0000);

        this.tweens.add({
          targets: [beamOuter, beam],
          width: distance,
          duration: 200,
          onUpdate: () => {
            if (!this.scene.isActive()) return;
            const tipX = isP
              ? attacker.x + beam.width
              : attacker.x - beam.width;
            beamHeadGlow.setPosition(tipX, attacker.y - 120);
            beamHead.setPosition(tipX, attacker.y - 120);
          },
          onComplete: () => {
            if (!this.scene.isActive()) return;

            bomb.destroy();
            aura.destroy();
            bombGlow.destroy();

            this.createScreenFlash(0xcc0000, 600, 1);
            this.cameras.main.shake(1500, 0.15);

            this.createImpactEffect(target.x, target.y + 120, 0xcc0000, "beam");
            this.takeDamage(!isP, dmg);

            // Massive Shockwave rings
            for (let i = 0; i < 8; i++) {
              const ring = this.add
                .circle(target.x, target.y + 120, 50, 0xcc0000)
                .setStrokeStyle(15, 0xcc0000)
                .setDepth(20)
                .setAlpha(0)
                .setBlendMode(Phaser.BlendModes.ADD);
              ring.isFilled = false;
              this.tweens.add({
                targets: ring,
                scale: 15 + i * 10,
                alpha: { start: 1, end: 0 },
                duration: 600 + i * 150,
                ease: "Cubic.easeOut",
                onComplete: () => ring.destroy(),
              });
            }

            this.tweens.add({
              targets: [beamOuter, beam, beamHead, beamHeadGlow],
              alpha: 0,
              scaleY: 0,
              duration: 800,
              onComplete: () => {
                beamOuter.destroy();
                beam.destroy();
                beamHead.destroy();
                beamHeadGlow.destroy();
                this.onSpecialComplete(isP);
              },
            });
          },
        });
      },
    });
  }

  createScreenFlash(color: number, duration: number, alpha: number = 0.8) {
    const flash = this.add
      .rectangle(480, 270, 960, 540, color)
      .setDepth(30)
      .setAlpha(alpha);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      ease: "Power2",
      onComplete: () => flash.destroy(),
    });
  }

  createImpactEffect(
    x: number,
    y: number,
    color: number,
    type: "melee" | "beam" | "block" = "melee",
  ) {
    const isBeam = type === "beam";
    const isBlock = type === "block";

    // Main Flash - Make it bigger and punchier
    const boom = this.add
      .circle(x, y, isBeam ? 40 : isBlock ? 15 : 20, color)
      .setDepth(20);
    this.tweens.add({
      targets: boom,
      scale: isBeam ? 8 : isBlock ? 3 : 6,
      alpha: 0,
      duration: isBeam ? 350 : 250,
      ease: "Cubic.easeOut",
      onComplete: () => boom.destroy(),
    });

    // Add an inner white core for more impact
    const core = this.add.circle(x, y, isBeam ? 20 : 10, 0xffffff).setDepth(21);
    this.tweens.add({
      targets: core,
      scale: isBeam ? 6 : 4,
      alpha: 0,
      duration: isBeam ? 200 : 150,
      ease: "Cubic.easeOut",
      onComplete: () => core.destroy(),
    });

    // Debris / Sparks - Faster and more dynamic
    const particleCount = isBeam ? 32 : isBlock ? 12 : 20;
    for (let i = 0; i < particleCount; i++) {
      const p = this.add
        .rectangle(
          x,
          y,
          isBeam ? 10 : 6,
          isBeam ? 2 : 6, // Elongated sparks for beams
          isBlock ? 0x3498db : (Math.random() > 0.5 ? 0xffffff : color),
        )
        .setDepth(20);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = isBeam
        ? Phaser.Math.Between(150, 350)
        : Phaser.Math.Between(80, 200);

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleY: 0.1,
        scaleX: isBeam ? 2 : 0.1,
        rotation: angle, // Align rotation to travel direction
        duration: Phaser.Math.Between(400, 800),
        ease: "Expo.easeOut",
        onComplete: () => p.destroy(),
      });
    }

    // Extra ring for beams
    if (isBeam) {
      const ring = this.add
        .circle(x, y, 30)
        .setStrokeStyle(4, color)
        .setDepth(19);
      this.tweens.add({
        targets: ring,
        scale: 5,
        alpha: 0,
        duration: 400,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy(),
      });

      // Beam specific screen flash and shake
      this.cameras.main.flash(150, 255, 255, 255, true);
      this.cameras.main.shake(300, 0.05);
    } else if (isBlock) {
      // Block specific shake
      this.cameras.main.shake(100, 0.01);
    } else {
      // Melee specific shake
      this.cameras.main.shake(150, 0.02);
    }
  }

  createFloatingDamage(x: number, y: number, amount: number, isCritical: boolean = false, isBlock: boolean = false) {
    if (!this.scene.isActive()) return;

    const color = isBlock ? "#3498db" : isCritical ? "#e74c3c" : "#ffffff";
    const fontSize = isCritical ? "36px" : "28px";
    
    // Add some random jitter so numbers don't overlap perfectly
    const jitterX = Phaser.Math.Between(-20, 20);
    const jitterY = Phaser.Math.Between(-10, 10);
    
    const text = this.add.text(x + jitterX, y + jitterY, `-${amount}`, {
      fontFamily: "Impact, sans-serif",
      fontSize: fontSize,
      color: color,
      stroke: "#000000",
      strokeThickness: isCritical ? 6 : 4,
      shadow: { color: "#000", blur: 4, offsetX: 2, offsetY: 2, fill: true }
    }).setOrigin(0.5).setDepth(100);

    // Critical hits get a slightly longer, more dramatic animation
    const duration = isCritical ? 1000 : 800;
    const yOffset = isCritical ? -100 : -60;

    this.tweens.add({
      targets: text,
      y: y + jitterY + yOffset,
      alpha: { start: 1, end: 0 },
      scale: isCritical ? { start: 1.5, end: 1 } : { start: 1, end: 1 },
      duration: duration,
      ease: "Cubic.easeOut",
      onComplete: () => {
        text.destroy();
      }
    });
  }

  takeDamage(isP: boolean, dmg: number) {
    if (this.isBattleOver || !this.scene.isActive()) return;

    if (isP) this.isP1Jumping = false;
    else this.isP2Jumping = false;

    const def = isP ? this.playerDefending : this.enemyDefending;
    const target = isP ? this.player : this.enemy;

    // Reset combo count when hit
    if (isP) {
      this.p1ComboCount = 0;
    } else {
      this.p2ComboCount = 0;
    }

    let isCritical = false;
    if (def) {
      dmg = Math.floor(dmg * 0.3);
      // Block effect
      this.createImpactEffect(target.x, target.y + 120, 0x3498db, "block"); // Blue shield spark
      if (this.cache.audio.exists("sfx_block")) this.sound.play("sfx_block");
    } else {
      isCritical = dmg > 25; // threshold for critical visual
      if (this.cache.audio.exists("sfx_hit")) this.sound.play("sfx_hit");
      // Removed global hitstop to fix "travado" stutter bug
    }
    
    // Spawn floating damage number
    this.createFloatingDamage(target.x, target.y + 60, dmg, isCritical, def);

    if (isP) this.playerHp = Math.max(0, this.playerHp - dmg);
    else this.enemyHp = Math.max(0, this.enemyHp - dmg);

    if (this.gameState.gameMode === "training") {
      if (!isP) this.enemyHp = this.enemyData.maxHp;
      if (isP) this.playerHp = this.playerData.maxHp;
    }

    if (target.active) {
      target.setTintFill(0xffffff); // Initial white flash
      this.cameras.main.flash(50, 255, 255, 255, true); // QUICK Flash for every hit
      
      this.time.delayedCall(40, () => {
        if (target.active) target.setTint(0xff0000); // Then red
      });

      const isTargetActing = isP ? this.p1ActionActive : this.p2ActionActive;
      // Knockback / Shake effect
      const originalX = isTargetActing ? target.x : (isP ? this.p1StartPos.x : this.p2StartPos.x);
      // Push back further if not defending
      const knockbackDist = def ? 10 : 30;
      const knockbackDir = isP ? -knockbackDist : knockbackDist;
      const rotDir = isP ? -0.1 : 0.1;

      if (!isTargetActing) {
        // Kill previous knockback tweens on the target to prevent weird stacking
        this.tweens.killTweensOf(target);
        target.x = originalX; // Snap back before knocking back again to prevent drift

        this.tweens.add({
          targets: target,
          x: originalX + knockbackDir,
          rotation: def ? 0 : rotDir,
          yoyo: true,
          duration: def ? 50 : 100,
          repeat: def ? 1 : 0,
          ease: "Sine.easeOut",
          onComplete: () => {
            if (target.active) {
              target.clearTint();
              target.x = originalX;
              target.rotation = 0;
            }
          },
        });
      } else {
        // If acting, just do a small rotation shake to avoid breaking x position
        this.tweens.add({
          targets: target,
          rotation: rotDir * 0.5,
          yoyo: true,
          duration: 50,
          onComplete: () => {
            if (target.active) {
              target.clearTint();
              target.rotation = 0;
            }
          },
        });
      }
    }

    this.updateUI();
    if (this.playerHp <= 0 || this.enemyHp <= 0)
      this.endBattle(this.playerHp > 0);
  }

  modifyKi(isP: boolean, amt: number) {
    const oldKi = isP ? this.playerKi : this.enemyKi;
    if (isP) this.playerKi = Phaser.Math.Clamp(this.playerKi + amt, 0, 100);
    else this.enemyKi = Phaser.Math.Clamp(this.enemyKi + amt, 0, 100);
    if (oldKi !== (isP ? this.playerKi : this.enemyKi)) {
        this.updateUI();
    }
  }

  updateUI() {
    const p1p = this.playerHp / this.playerData.maxHp;
    const p2p = this.enemyHp / this.enemyData.maxHp;

    if (this.p1HpBar && this.p1HpBar.active) {
      // Liquid HP Bars
      this.tweens.add({
        targets: this.p1HpBar,
        scaleX: Math.max(0, p1p),
        duration: 300,
        ease: "Cubic.easeOut",
        overwrite: true,
      });
      this.tweens.add({
        targets: this.p2HpBar,
        scaleX: Math.max(0, p2p),
        duration: 300,
        ease: "Cubic.easeOut",
        overwrite: true,
      });
      // Liquid Ki Bars
      this.p1KiBar.scaleX = Math.max(0, this.playerKi / 100);
      this.p2KiBar.scaleX = Math.max(0, this.enemyKi / 100);
    }
    
    // Hide Transform Button if max level reached
    if (this.trnBtnGroup && this.playerData) {
        let maxLevel = 1;
        if (this.playerData.key === "goku" || this.playerData.key === "vegeta" || this.playerData.key === "naruto") {
          maxLevel = 2;
        }
        if (this.playerTransformLevel >= maxLevel) {
            this.trnBtnGroup.setVisible(false);
            // Disable interaction
            this.trnBtnGroup.each((child: any) => {
               if (child.disableInteractive) child.disableInteractive(); 
            });
            this.trnBtnGroup = undefined; // prevent running this block again
        }
    }
  }

  log(m: string) {
    if (!this.logText.active) return;
    this.tweens.killTweensOf(this.logText);
    this.logText.setText(m).setAlpha(1);
    this.tweens.add({
      targets: this.logText,
      alpha: 0,
      delay: 1000,
      duration: 500,
    });
  }

  startAILoop() {
    const diff = this.gameState.difficulty; // 0: Easy, 1: Normal, 2: Hard
    let delay = 1500;
    if (diff === 0) delay = 2000;
    else if (diff === 1) delay = 1200;
    else if (diff === 2) delay = 700; // Much faster on Hard

    this.turnTimer = this.time.addEvent({
      delay: delay,
      loop: true,
      callback: () => this.enemyDecide(),
    });

    // AI Movement Loop
    this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        if (this.isBattleOver || !this.scene.isActive()) return;
        if (this.p2ActionActive || this.enemyDefending) {
           this.aiMoveDir = 0;
           return;
        }
        
        const dist = Math.abs(this.enemy.x - this.player.x);
        const isLeftOfPlayer = this.enemy.x < this.player.x;
        
        let targetDir = 0; // -1 for Left, 1 for Right, 0 for stop
        
        // Dynamic behavior based on state
        if (this.enemyKi < 30) {
            // Needs Ki. If too close, retreat! If far enough, stay and charge.
            if (dist < 400) {
                targetDir = isLeftOfPlayer ? -1 : 1; // back away
            } else {
                targetDir = 0; // stop and charge
            }
        } else {
            // Has Ki, ready to attack. If far, approach!
            if (dist > 300) {
                targetDir = isLeftOfPlayer ? 1 : -1; // approach
            } else if (dist < 150) {
                // very close, jitter a bit
                targetDir = Math.random() < 0.3 ? (isLeftOfPlayer ? -1 : 1) : 0;
            } else {
                // sweet spot for attack, stay still or approach
                targetDir = Math.random() < 0.6 ? (isLeftOfPlayer ? 1 : -1) : 0;
            }
        }
        
        // Prevent corner trapping
        if (this.enemy.x <= 150) targetDir = 1;
        if (this.enemy.x >= 1850) targetDir = -1;
        
        this.aiMoveDir = targetDir;
      }
    });
  }

  enemyDecide() {
    if (this.isBattleOver || this.p2ActionActive || !this.scene.isActive())
      return;

    const r = Math.random();
    const playerHpPct = this.playerHp / this.playerData.maxHp;
    const enemyHpPct = this.enemyHp / this.enemyData.maxHp;
    const dist = Math.abs(this.player.x - this.enemy.x);

    // SMARTER AI: Check player state
    const playerIsAttacking = this.p1ActionActive;

    // 1. Reactive Guard: If player is attacking and close, HIGH chance to block
    if (playerIsAttacking && dist < 300 && r < 0.7) {
      this.enemyDefending = true;
      this.p2Aura.setVisible(true).setAlpha(0.4).setScale(1.1);
      this.time.delayedCall(800, () => {
        if (this.scene.isActive()) {
          this.enemyDefending = false;
          this.p2Aura.setVisible(false);
        }
      });
      return;
    }

    // 2. Transform if available and have enough Ki
    let maxLevel = 1;
    if (
      this.enemyData.key === "goku" ||
      this.enemyData.key === "vegeta" ||
      this.enemyData.key === "naruto"
    )
      maxLevel = 2;

    if (
      this.enemyKi >= 100 &&
      this.enemyTransformLevel < maxLevel &&
      this.enemyData.transformAvailable
    ) {
      this.performTransform(false);
      return;
    }

    // 2. If player is low on HP, prioritize finishing them off
    if (playerHpPct <= 0.3) {
      if (this.enemyKi >= 80 && r < 0.8) {
        this.performSpecial(false, true);
      } else if (this.enemyKi >= 40 && r < 0.7) {
        this.performSpecial(false, false);
      } else if (r < 0.6) {
        this.performAttack(false, Math.random() > 0.5 ? "melee" : "ki");
      } else {
        this.performCharge(false);
      }
      return;
    }

    // 3. If enemy is low on HP, play aggressively with specials or charge to get them
    if (enemyHpPct <= 0.4) {
      if (this.enemyKi >= 80) {
        this.performSpecial(false, true);
      } else if (this.enemyKi >= 40 && r < 0.6) {
        this.performSpecial(false, false);
      } else if (this.enemyKi < 40 && r < 0.8) {
        this.performCharge(false);
      } else {
        this.performAttack(false, Math.random() > 0.5 ? "melee" : "ki");
      }
      return;
    }

    // 4. If player has high Ki, try to interrupt them or defend
    if (this.playerKi >= 80) {
      if (r < 0.4) {
        // Defend for 1.2 seconds against potential super
        this.enemyDefending = true;
        this.p2Aura.setVisible(true).setAlpha(0.6).setScale(1.2);
        this.time.delayedCall(1200, () => {
          if (this.scene.isActive()) {
            this.enemyDefending = false;
            this.p2Aura.setVisible(false);
          }
        });
        return;
      } else if (this.enemyKi >= 40 && r < 0.6) {
        this.performSpecial(false, false);
        return;
      } else if (r < 0.8) {
        this.performAttack(false, dist < 200 ? "melee" : "ki");
        return;
      } else {
        this.performCharge(false);
        return;
      }
    }

    // 5. Standard tactical decisions based on Ki and Distance
    if (this.enemyKi >= 80) {
      // High Ki: Favor Super or Strategic Attack
      if (r < 0.5) {
        if (dist < 400 || r < 0.3) this.performSpecial(false, true);
        else this.performCharge(false);
      }
      else if (r < 0.8) this.performSpecial(false, false);
      else this.performAttack(false, dist < 150 ? "melee" : "ki");
    } else if (this.enemyKi >= 40) {
      // Medium Ki: Mix of Special, Attack, and Charge
      if (r < 0.4) this.performSpecial(false, false);
      else if (r < 0.7)
        this.performAttack(false, dist < 150 ? "melee" : "ki");
      else this.performCharge(false);
    } else {
      // Low Ki: Favor Charging or distancing
      if (r < 0.7) this.performCharge(false);
      else this.performAttack(false, dist < 150 ? "melee" : "ki");
    }
  }

  endBattle(win: boolean) {
    if (this.isBattleOver) return; // Prevent double call
    this.isBattleOver = true;
    if (this.turnTimer) this.turnTimer.remove();
    if (this.regenTimer) this.regenTimer.remove();

    this.mobileControls.forEach((c) => c.destroy());
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(480, 270);

    const bg = this.add.rectangle(480, 270, 20000, 20000, 0x000000, 0.8).setDepth(20).setScrollFactor(0);

    let titleMessage = "DEFEAT...";
    let subtitleMessage = "";
    let color = "#e74c3c"; // Red
    let coinsEarned = 0;

    if (this.gameState.gameMode === "local_pvp") {
      // PvP Outcome
      coinsEarned = 100;
      titleMessage = "CONGRATULATIONS!";
      color = "#f1c40f"; // Gold
      if (win) {
        // P1 Wins
        subtitleMessage = `${this.playerData.name.toUpperCase()} WINS!`;
      } else {
        // P2 Wins
        subtitleMessage = `${this.enemyData.name.toUpperCase()} WINS!`;
      }
      // Award coins in PvP regardless of who won (shared stash)
      this.gameState.coins += coinsEarned;
      window.UTLW.save();
      window.dispatchEvent(new CustomEvent('battle-ended', { detail: { win, gameMode: this.gameState.gameMode } }));
    } else {
      // Single Player Outcome
      if (win) {
        titleMessage = "CONGRATULATIONS!";
        if (
          this.gameState.gameMode === "arcade" &&
          this.gameState.arcadeRound === 5
        ) {
          titleMessage = "ARCADE CLEARED!";
          coinsEarned = 500;
        } else {
          coinsEarned = 100;
        }
        subtitleMessage = `${this.playerData.name.toUpperCase()} WINS!`;
        color = "#f1c40f"; // Gold
        this.gameState.coins += coinsEarned;
        window.UTLW.save();
      } else {
        titleMessage = "DEFEAT...";
        subtitleMessage = `${this.enemyData.name.toUpperCase()} WINS!`;
        color = "#e74c3c"; // Red
        coinsEarned = 25; // Small consolation prize
        this.gameState.coins += coinsEarned;
        window.UTLW.save();
      }
    }

    if (this.gameState.gameMode !== "local_pvp") {
       window.dispatchEvent(new CustomEvent('battle-ended', { detail: { win, gameMode: this.gameState.gameMode } }));
    }

    // Display Title
    const titleText = this.add
      .text(480, -100, titleMessage, {
        fontFamily: "Impact, sans-serif",
        fontSize: "80px",
        color: color,
        fontStyle: "italic",
        stroke: "#000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(21).setScrollFactor(0);

    this.tweens.add({
      targets: titleText,
      y: 160,
      duration: 800,
      ease: "Bounce.easeOut",
    });

    // Display Subtitle (Winner Name)
    if (subtitleMessage) {
      const subText = this.add
        .text(480, 260, subtitleMessage, {
          fontFamily: "Impact, sans-serif",
          fontSize: "56px",
          color: "#ffffff",
          stroke: "#000",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(21)
        .setAlpha(0)
        .setScale(0.5).setScrollFactor(0);

      this.tweens.add({
        targets: subText,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: 600,
        ease: "Back.easeOut",
      });
    }

    // Display Coins Earned
    if (coinsEarned > 0) {
      const coinText = this.add
        .text(480, 340, `REWARD: +${coinsEarned} COINS`, {
          fontFamily: "Impact, sans-serif",
          fontSize: "48px",
          color: "#f1c40f",
          stroke: "#000",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(21)
        .setAlpha(0).setScrollFactor(0);

      this.tweens.add({
        targets: coinText,
        alpha: 1,
        y: 360,
        duration: 400,
        delay: 1100,
        ease: "Power2",
      });
    }

    const btn = this.add
      .text(480, 480, "CONTINUE", {
        fontFamily: "Impact, sans-serif",
        fontSize: "36px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(21)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0).setScrollFactor(0);

    this.tweens.add({
      targets: btn,
      alpha: 1,
      duration: 400,
      delay: 1500,
    });

    btn.on("pointerover", () => btn.setStyle({ color: "#f1c40f" }));
    btn.on("pointerout", () => btn.setStyle({ color: "#ffffff" }));
    btn.on("pointerdown", () => {
      if (this.gameState.gameMode === "tournament") {
        if (win) {
          // Update tournament bracket
          const rounds = this.gameState.tournamentRounds!;
          const currentRoundIndex =
            this.gameState.tournamentCurrentRoundIndex || 0;
          const round = rounds[currentRoundIndex];

          // Find player's match and set winner
          round.matches.forEach((match, index) => {
            if (
              match.p1 === this.gameState.tournamentPlayerCharId ||
              match.p2 === this.gameState.tournamentPlayerCharId
            ) {
              match.winner = this.gameState.tournamentPlayerCharId!;

              // Advance winner to next round
              if (currentRoundIndex < rounds.length - 1) {
                const nextRound = rounds[currentRoundIndex + 1];
                const nextMatchIndex = Math.floor(index / 2);
                const isP1 = index % 2 === 0;
                if (isP1) nextRound.matches[nextMatchIndex].p1 = match.winner;
                else nextRound.matches[nextMatchIndex].p2 = match.winner;
              }
            }
          });

          this.gameState.tournamentCurrentRoundIndex = currentRoundIndex + 1;
          this.registry.set("gameState", this.gameState);
          this.scene.start("TournamentScene");
        } else {
          this.scene.start("MenuScene");
        }
      } else if (this.gameState.gameMode === "arcade") {
        if (win) {
          this.gameState.arcadeRound = (this.gameState.arcadeRound || 1) + 1;
          if (this.gameState.arcadeRound > 5) {
            this.scene.start("MenuScene");
          } else {
            this.registry.set("gameState", this.gameState);
            this.scene.start("BattleScene");
          }
        } else {
          this.scene.start("MenuScene");
        }
      } else {
        this.scene.start("MenuScene");
      }
    });
  }
}
