import { BattleCamera } from '../battle/BattleCamera';
import { BattleReward } from '../battle/BattleReward';
import { BattleInput } from '../battle/BattleInput';
import { BattleUI } from '../battle/BattleUI';
import { BattleAI } from '../battle/BattleAI';
import { BattleEnvironment } from '../battle/BattleEnvironment';
import Phaser from "phaser";
import { CharacterData, GameState } from "../types";
import { getFighter } from '../characters/FighterRegistry';
import { DailyChallenges } from '../systems/DailyChallenges';
import { auth } from '../../firebase/init';
import { MultiplayerManager } from '../systems/MultiplayerManager';

export default class BattleScene extends Phaser.Scene {
  public trnBtnGroup?: Phaser.GameObjects.Container;

  public battleUI!: BattleUI;
  public battleEnvironment!: BattleEnvironment;
  
  public battleAI!: BattleAI;
  public battleReward!: BattleReward;
  public battleCamera!: BattleCamera;
  public battleInput!: BattleInput;
  public get keys() { return this.battleInput?.keys; }
  
  public isIncomingNetworkAction: boolean = false;
  public localPlayerIndex: 1 | 2 = 1;
  private netSyncTimer: number = 0;
  private remoteTargetX: number = 0;
  private remoteTargetY: number = 0;
  private hasInitialRemotePosition: boolean = false;
  
  public get mobileJoystickVector() { return this.battleInput?.mobileJoystickVector || {x:0, y:0}; }
  public get mobileP1Attack() { return this.battleInput?.mobileP1Attack; }
  public get mobileP1KiBlast() { return this.battleInput?.mobileP1KiBlast; }
  public get mobileP1Defend() { return this.battleInput?.mobileP1Defend; }
  public get mobileP1Charge() { return this.battleInput?.mobileP1Charge; }
  public get mobileP1Special() { return this.battleInput?.mobileP1Special; }
  public get mobileP1Transform() { return this.battleInput?.mobileP1Transform; }
  public get mobileP1SpecialJustUp() { return this.battleInput?.mobileP1SpecialJustUp; }
  public set mobileP1Attack(v) { if(this.battleInput) this.battleInput.mobileP1Attack = v; }
  public set mobileP1KiBlast(v) { if(this.battleInput) this.battleInput.mobileP1KiBlast = v; }
  public set mobileP1Defend(v) { if(this.battleInput) this.battleInput.mobileP1Defend = v; }
  public set mobileP1Charge(v) { if(this.battleInput) this.battleInput.mobileP1Charge = v; }
  public set mobileP1Special(v) { if(this.battleInput) this.battleInput.mobileP1Special = v; }
  public set mobileP1Transform(v) { if(this.battleInput) this.battleInput.mobileP1Transform = v; }
  public set mobileP1SpecialJustUp(v) { if(this.battleInput) this.battleInput.mobileP1SpecialJustUp = v; }

  declare sound:
    | Phaser.Sound.NoAudioSoundManager
    | Phaser.Sound.HTML5AudioSoundManager
    | Phaser.Sound.WebAudioSoundManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare registry: Phaser.Data.DataManager;
  declare time: Phaser.Time.Clock;
  declare input: Phaser.Input.InputPlugin;

  // Mobile Controls Flags
                        declare tweens: Phaser.Tweens.TweenManager;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare children: Phaser.GameObjects.DisplayList;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare anims: Phaser.Animations.AnimationManager;
  declare cache: Phaser.Cache.CacheManager;
  declare textures: Phaser.Textures.TextureManager;
  declare make: Phaser.GameObjects.GameObjectCreator;
  declare events: Phaser.Events.EventEmitter;

  public player!: Phaser.GameObjects.Sprite;
  public enemy!: Phaser.GameObjects.Sprite;

  public playerData!: CharacterData;
  public enemyData!: CharacterData;

  public playerHp: number = 0;
  public enemyHp: number = 0;
  public playerKi: number = 0;
  public enemyKi: number = 0;

  public playerTransformLevel: number = 0;
  public enemyTransformLevel: number = 0;
  public playerDefending: boolean = false;
  public enemyDefending: boolean = false;

  // Action Flags to prevent spamming
  public p1ActionActive: boolean = false;
  public p1SuperActive: boolean = false;
  public lastP1LeftTime: number = 0;
  public lastP1RightTime: number = 0;
  public p1DashCooldown: boolean = false;
  public isP1Jumping: boolean = false;
  public p2ActionActive: boolean = false;
  public p2SuperActive: boolean = false;
  public lastP2LeftTime: number = 0;
  public lastP2RightTime: number = 0;
  public p2DashCooldown: boolean = false;
  public isP2Jumping: boolean = false;
  public p2BufferedAttack: boolean = false;
  public p2BufferedKiBlast: boolean = false;
  public p2BufferedTransform: boolean = false;

  public p1AttackBuffer: number = 0;
  public p1KiBlastBuffer: number = 0;
  public p1TransformBuffer: number = 0;
  public p2AttackBuffer: number = 0;
  public p2KiBlastBuffer: number = 0;
  public p2TransformBuffer: number = 0;
  public readonly BUFFER_MS = 250;

  public p1Shadow!: Phaser.GameObjects.Ellipse;
  public p2Shadow!: Phaser.GameObjects.Ellipse;
  public p1DebugCircle!: Phaser.GameObjects.Shape;
  public p2DebugCircle!: Phaser.GameObjects.Shape;
  public debugCirclesDestroyed: boolean = false;
  public p1Aura!: Phaser.GameObjects.Shape;
  public p2Aura!: Phaser.GameObjects.Shape;
  public p1Shield!: Phaser.GameObjects.Arc;
  public p2Shield!: Phaser.GameObjects.Arc;

  public p1SpecialHoldTime: number = 0;
  public p2SpecialHoldTime: number = 0;
  public readonly SUPER_THRESHOLD_MS = 600; // 0.6 second hold for super
  public p1ChargeIndicator!: Phaser.GameObjects.Arc;
  public p2ChargeIndicator!: Phaser.GameObjects.Arc;

            
  public p1ComboCount: number = 0;
  public p1LastAttackTime: number = 0;
  public p2ComboCount: number = 0;
  public p2LastAttackTime: number = 0;

  public isBattleOver: boolean = false;
  public turnTimer?: Phaser.Time.TimerEvent;
  public regenTimer?: Phaser.Time.TimerEvent;
  public aiMoveDir: number = 0;
    public gameState!: GameState;

  // Position tuned for 64px tall sprites (scaled 3x)
  // Center Y at 280 ensures feet land around Y=460 (Ground Level)
  public readonly p1StartPos = { x: 200, y: 280 };
  public readonly p2StartPos = { x: 760, y: 280 };

  constructor() {
    super("BattleScene");
  }

      create() {
    this.battleAI = new BattleAI(this);
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
      this.gameState.gameMode === "tournament" ||
      this.gameState.gameMode === "online_pvp"
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
      
    this.battleEnvironment = new BattleEnvironment(this, bgImage, randomArena);
      
    this.battleCamera = new BattleCamera(this);
    this.battleCamera.setupCamera(mapWidth);

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

    this.battleUI = new BattleUI(this);
    this.battleReward = new BattleReward(this);
    this.battleUI.createUI(this.playerData, this.enemyData, this.gameState.gameMode, this.gameState.arcadeRound);
    this.battleInput = new BattleInput(this);
    this.battleInput.createInputs();
    this.battleInput.createMobileControls();

    this.localPlayerIndex = this.registry.get("localPlayerIndex") || 1;
    this.isIncomingNetworkAction = false;
    this.netSyncTimer = 0;
    this.hasInitialRemotePosition = false;

    if (this.gameState.gameMode === "online_pvp") {
      const mm = MultiplayerManager.getInstance();
      
      this.time.delayedCall(100, () => {
        if (!this.scene.isActive() || !this.battleUI) return;
        const p2Name = this.registry.get("p2Name") || "Inimigo";
        if (this.localPlayerIndex === 2) {
          if (this.battleUI.p1NameText) this.battleUI.p1NameText.setText(p2Name.toUpperCase());
          if (this.battleUI.p2NameText) this.battleUI.p2NameText.setText(this.getPlayerName().toUpperCase());
        } else {
          if (this.battleUI.p2NameText) this.battleUI.p2NameText.setText(p2Name.toUpperCase());
        }
      });

      mm.onRemoteStateCallback = (state: any) => {
        const target = this.localPlayerIndex === 1 ? this.enemy : this.player;
        if (target && target.active) {
          // Decompress state
          const s_x = state.x;
          const s_y = state.y;
          const s_flipX = state.f === 1;
          const s_rotation = state.r;
          const s_anim = state.a;
          const s_hp = state.h;
          const s_ki = state.k;
          const s_actionActive = state.aa === 1;
          const s_transformLevel = state.tl;
          const s_defending = state.d === 1;
          const s_isJumping = state.j === 1;
          const s_superActive = state.s === 1;

          if (!this.hasInitialRemotePosition) {
             target.x = s_x;
             target.y = s_y;
             this.hasInitialRemotePosition = true;
          }
          this.remoteTargetX = s_x;
          this.remoteTargetY = s_y;
          
          target.setFlipX(s_flipX);
          target.setRotation(s_rotation);
          
          if (target.anims && s_anim && target.anims.currentAnim?.key !== s_anim) {
            target.play(s_anim, true);
          }

          if (this.localPlayerIndex === 1) {
            this.enemyHp = s_hp;
            this.enemyKi = s_ki;
            this.p2ActionActive = s_actionActive;
            this.enemyTransformLevel = s_transformLevel;
            this.enemyDefending = s_defending;
            this.isP2Jumping = s_isJumping;
            this.p2SuperActive = s_superActive;
          } else {
            this.playerHp = s_hp;
            this.playerKi = s_ki;
            this.p1ActionActive = s_actionActive;
            this.playerTransformLevel = s_transformLevel;
            this.playerDefending = s_defending;
            this.isP1Jumping = s_isJumping;
            this.p1SuperActive = s_superActive;
          }
        }
      };

      mm.onRemoteActionCallback = (action: any) => {
        this.isIncomingNetworkAction = true;
        try {
          switch (action.type) {
            case "dash":
              this.performDash(action.isPlayer, action.dir);
              break;
            case "jump":
              this.performJump(action.isPlayer);
              break;
            case "attack":
              this.performAttack(action.isPlayer, action.attackType);
              break;
            case "special":
              this.performSpecial(action.isPlayer, action.isSuper);
              break;
            case "transform":
              this.performTransform(action.isPlayer);
              break;
          }
        } catch (e) {
          console.error("Error executing remote action", e);
        } finally {
          this.isIncomingNetworkAction = false;
        }
      };

      mm.onOpponentLeftCallback = () => {
        if (this.isBattleOver) return;
        if (this.battleUI) this.battleUI.showLog("OPONENTE SAIU! VITORIA!");
        this.isBattleOver = true;
        
        this.time.delayedCall(3000, () => {
          mm.disconnect();
          this.scene.start("MenuScene");
        });
      };
    }

    this.time.delayedCall(1000, () => {
      if (!this.scene.isActive()) return;
      if(this.battleUI) this.battleUI.showLog("FIGHT START!");
      if (
        this.gameState.gameMode !== "local_pvp" &&
        this.gameState.gameMode !== "training" &&
        this.gameState.gameMode !== "online_pvp"
      ) {
        if (this.battleAI) this.battleAI.startAILoop();
      }
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
      if (this.battleEnvironment) this.battleEnvironment.destroy();
      this.sound.stopByKey("bgm_battle");
      this.input.keyboard?.removeAllKeys();
      this.input.keyboard?.removeAllListeners();
      if (this.gameState.gameMode === "online_pvp") {
        MultiplayerManager.getInstance().disconnect();
      }
    });
  }

  update(time: number, delta: number) {
    if (this.battleEnvironment) this.battleEnvironment.update(time, delta);
    
    if (this.isBattleOver || !this.keys || !this.scene.isActive()) return;

    if (!this.debugCirclesDestroyed) {
      if (this.p1DebugCircle) this.p1DebugCircle.destroy();
      if (this.p2DebugCircle) this.p2DebugCircle.destroy();
      this.debugCirclesDestroyed = true;
    }

    if (this.battleUI) this.battleUI.updateBars(this.playerHp / this.playerData.maxHp, this.enemyHp / this.enemyData.maxHp, this.playerKi / 100, this.enemyKi / 100);

    if (this.playerHp <= 0 || this.enemyHp <= 0) {
      this.isBattleOver = true;
      this.time.timeScale = 0.15;
      if (this.battleCamera) this.battleCamera.shake(600, 0.003);
      else this.cameras.main.shake(600, 0.003);

      this.time.delayedCall(105, () => {
        this.time.timeScale = 1;
        this.cleanupAndShowVictory(this.playerHp > 0);
      });
      return;
    }
    
    // Network state stream sync
    if (this.gameState.gameMode === "online_pvp") {
      // Interpolate remote player
      if (this.hasInitialRemotePosition) {
         const target = this.localPlayerIndex === 1 ? this.enemy : this.player;
         if (target && target.active) {
            target.x += (this.remoteTargetX - target.x) * 0.94;
            target.y += (this.remoteTargetY - target.y) * 0.94;
         }
      }

      this.netSyncTimer += delta;
      if (this.netSyncTimer >= 16) { // Throttle to ~60 Hz (every frame) for extremely snappy, real-time responsive fighting
        this.netSyncTimer = 0;
        const localIdx = this.localPlayerIndex;
        const activeObj = localIdx === 1 ? this.player : this.enemy;
        if (activeObj && activeObj.active) {
          const stateData = {
            x: Math.round(activeObj.x),
            y: Math.round(activeObj.y),
            f: activeObj.flipX ? 1 : 0,
            r: Math.round(activeObj.rotation * 10) / 10,
            a: activeObj.anims.currentAnim?.key || "",
            h: Math.round(localIdx === 1 ? this.playerHp : this.enemyHp),
            k: Math.round(localIdx === 1 ? this.playerKi : this.enemyKi),
            aa: (localIdx === 1 ? this.p1ActionActive : this.p2ActionActive) ? 1 : 0,
            tl: localIdx === 1 ? this.playerTransformLevel : this.enemyTransformLevel,
            d: (localIdx === 1 ? this.playerDefending : this.enemyDefending) ? 1 : 0,
            j: (localIdx === 1 ? this.isP1Jumping : this.isP2Jumping) ? 1 : 0,
            s: (localIdx === 1 ? this.p1SuperActive : this.p2SuperActive) ? 1 : 0
          };
          MultiplayerManager.getInstance().emitState(stateData);
        }
      }
    }
    
    // Auto-heal character positions (prevent getting stuck outside bounds)
    const bounds = { minX: 50, maxX: 1950, minY: 100, maxY: 440 };

    if (this.player && this.player.active && this.enemy && this.enemy.active) {
        
        // --- PLAYER 1 (LEFT FIGHTER) MOVEMENT CONTROL ---
        const isP1Local = (this.gameState.gameMode !== "online_pvp" || this.localPlayerIndex === 1);
        
        if (isP1Local && !this.p1ActionActive && !this.tweens.isTweening(this.player) && !this.isP1Jumping) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.p1_left)) {
                if (time - this.lastP1LeftTime < 300) {
                    this.performDash(true, -1);
                }
                this.lastP1LeftTime = time;
            } else if (Phaser.Input.Keyboard.JustDown(this.keys.p1_right)) {
                if (time - this.lastP1RightTime < 300) {
                    this.performDash(true, 1);
                }
                this.lastP1RightTime = time;
            }

            const moveSpeed = 6;
            let isMoving = false;
            
            if (this.playerDefending) {
                // Cannot move while defending/charging
                this.player.setFlipX(this.player.x > this.enemy.x);
            } else if (this.keys.p1_left.isDown || this.mobileJoystickVector.x < -0.3) {
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
            
            if (isMoving && !this.playerDefending) {
                const walkAnim = this.getAnimKey(this.playerData.key, this.playerTransformLevel, "walk");
                if (this.player.anims.currentAnim?.key !== walkAnim) {
                    this.player.play(walkAnim, true);
                }
                // Dynamic walk effect: slight tilt forward and bobbing
                this.player.setRotation(this.player.flipX ? -0.1 : 0.1);
                this.player.y = this.p1StartPos.y + Math.sin(time * 0.02) * 8;
                
                // Continuous dust clouds from feet
                if (Math.random() > 0.82) {
                    const walkDirection = this.player.flipX ? 1 : -1;
                    this.createDustEffect(this.player.x, this.p1StartPos.y + 180, 2, true, walkDirection);
                }
            } else if (!this.p1ActionActive && !this.playerDefending) {
                const idleAnim = this.getAnimKey(this.playerData.key, this.playerTransformLevel, "idle");
                if (this.player.anims.currentAnim?.key !== idleAnim) {
                    this.player.play(idleAnim, true);
                }
                this.player.setRotation(0);
                this.player.y = Phaser.Math.Linear(this.player.y, this.p1StartPos.y, 0.2);
            }
            
            if (!this.playerDefending && this.keys.p1_up.isDown && !this.isP1Jumping) {
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

        // --- PLAYER 2 (RIGHT FIGHTER) MOVEMENT CONTROL ---
        const isP2Local = (this.gameState.gameMode === "local_pvp" || this.gameState.gameMode === "training" || (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2));
        const isAIScene = (this.gameState.gameMode !== "local_pvp" && this.gameState.gameMode !== "training" && this.gameState.gameMode !== "online_pvp");

        if (isP2Local && !this.p2ActionActive && !this.tweens.isTweening(this.enemy) && !this.isP2Jumping) {
            // Check double-tap dash
            if (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2) {
                if (Phaser.Input.Keyboard.JustDown(this.keys.p1_left)) {
                    if (time - this.lastP2LeftTime < 300) {
                        this.performDash(false, -1);
                    }
                    this.lastP2LeftTime = time;
                } else if (Phaser.Input.Keyboard.JustDown(this.keys.p1_right)) {
                    if (time - this.lastP2RightTime < 300) {
                        this.performDash(false, 1);
                    }
                    this.lastP2RightTime = time;
                }
            } else {
                if (Phaser.Input.Keyboard.JustDown(this.keys.p2_left)) {
                    if (time - this.lastP2LeftTime < 300) {
                        this.performDash(false, -1);
                    }
                    this.lastP2LeftTime = time;
                } else if (Phaser.Input.Keyboard.JustDown(this.keys.p2_right)) {
                    if (time - this.lastP2RightTime < 300) {
                        this.performDash(false, 1);
                    }
                    this.lastP2RightTime = time;
                }
            }

            const moveSpeed = 6;
            let isMoving = false;
            let moveL = false;
            let moveR = false;

            if (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2) {
                moveL = this.keys.p1_left.isDown || this.mobileJoystickVector.x < -0.3;
                moveR = this.keys.p1_right.isDown || this.mobileJoystickVector.x > 0.3;
            } else {
                moveL = this.keys.p2_left.isDown;
                moveR = this.keys.p2_right.isDown;
            }

            if (this.enemyDefending) {
                this.enemy.setFlipX(this.enemy.x > this.player.x);
            } else if (moveL) {
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
            
            if (isMoving && !this.enemyDefending) {
                const walkAnim = this.getAnimKey(this.enemyData.key, this.enemyTransformLevel, "walk");
                if (this.enemy.anims.currentAnim?.key !== walkAnim) {
                    this.enemy.play(walkAnim, true);
                }
                this.enemy.setRotation(this.enemy.flipX ? -0.1 : 0.1);
                this.enemy.y = this.p2StartPos.y + Math.sin(time * 0.02) * 8;
                
                // Continuous dust clouds from feet
                if (Math.random() > 0.82) {
                    const walkDirection = this.enemy.flipX ? 1 : -1;
                    this.createDustEffect(this.enemy.x, this.p2StartPos.y + 180, 2, true, walkDirection);
                }
            } else if (!this.p2ActionActive && !this.enemyDefending) {
                const idleAnim = this.getAnimKey(this.enemyData.key, this.enemyTransformLevel, "idle");
                if (this.enemy.anims.currentAnim?.key !== idleAnim) {
                    this.enemy.play(idleAnim, true);
                }
                this.enemy.setRotation(0);
                this.enemy.y = Phaser.Math.Linear(this.enemy.y, this.p2StartPos.y, 0.2);
            }
            
            const isJumpPressed = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
                ? this.keys.p1_up.isDown
                : this.keys.p2_up.isDown;

            if (!this.enemyDefending && isJumpPressed && !this.isP2Jumping) {
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
        } else if (isAIScene && !this.p2ActionActive && !this.tweens.isTweening(this.enemy) && !this.isP2Jumping) {
            // Artificial Intelligence controls movement
            let moveL = this.aiMoveDir === -1;
            let moveR = this.aiMoveDir === 1;
            
            const distToPlayer = Math.abs(this.enemy.x - this.player.x);
            if (moveL && this.enemy.x < this.player.x && distToPlayer > 600) moveL = false;
            if (moveR && this.enemy.x > this.player.x && distToPlayer > 600) moveR = false;

            const moveSpeed = 6;
            let isMoving = false;

            if (this.enemyDefending) {
                this.enemy.setFlipX(this.enemy.x > this.player.x);
            } else if (moveL) {
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
            
            if (isMoving && !this.enemyDefending) {
                const walkAnim = this.getAnimKey(this.enemyData.key, this.enemyTransformLevel, "walk");
                if (this.enemy.anims.currentAnim?.key !== walkAnim) {
                    this.enemy.play(walkAnim, true);
                }
                this.enemy.setRotation(this.enemy.flipX ? -0.1 : 0.1);
                this.enemy.y = this.p2StartPos.y + Math.sin(time * 0.02) * 8;
                
                // Continuous dust clouds from feet
                if (Math.random() > 0.82) {
                    const walkDirection = this.enemy.flipX ? 1 : -1;
                    this.createDustEffect(this.enemy.x, this.p2StartPos.y + 180, 2, true, walkDirection);
                }
            } else if (!this.p2ActionActive && !this.enemyDefending) {
                const idleAnim = this.getAnimKey(this.enemyData.key, this.enemyTransformLevel, "idle");
                if (this.enemy.anims.currentAnim?.key !== idleAnim) {
                    this.enemy.play(idleAnim, true);
                }
                this.enemy.setRotation(0);
                this.enemy.y = Phaser.Math.Linear(this.enemy.y, this.p2StartPos.y, 0.2);
            }
            
            if (!this.enemyDefending && this.keys.p2_up.isDown && !this.isP2Jumping) {
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
        
        if (this.battleUI?.uiContainer) {
            this.battleUI?.uiContainer.setScale(1 / this.cameras.main.zoom);
            this.battleUI?.uiContainer.setPosition(
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
      
      if (this.p1Aura) { 
        this.p1Aura.setX(this.player.x); 
        this.p1Aura.setY(this.player.y + 80); 
        if (this.playerTransformLevel > 0) {
          this.p1Aura.setVisible(true);
          const colors = this.getCharacterAuraColor(true);
          (this.p1Aura as Phaser.GameObjects.Shape).setFillStyle(colors.auraColor, 0.3);
          if (!this.playerDefending) {
            this.p1Aura.setScale(0.95 + Math.sin(time * 0.012) * 0.12);
            this.p1Aura.setAlpha(0.25 + Math.sin(time * 0.035) * 0.08);
          }
        } else if (!this.playerDefending) {
          this.p1Aura.setVisible(false);
        }
      }
      if (this.p1Shield) { 
        this.p1Shield.setX(this.player.x); 
        this.p1Shield.setY(this.player.y + 80); 
        if (this.playerTransformLevel > 0 && !this.playerDefending) {
          this.p1Shield.setVisible(true);
          const colors = this.getCharacterAuraColor(true);
          (this.p1Shield as Phaser.GameObjects.Arc).setStrokeStyle(2, colors.ringColor, 0.4);
          this.p1Shield.setScale(0.85 + Math.sin(time * 0.024) * 0.05);
        } else if (!this.playerDefending) {
          this.p1Shield.setVisible(false);
        }
      }
    }
    if (this.p2Shadow && this.enemy) {
      this.p2Shadow.setX(this.enemy.x);
      const yDist = Math.max(0, this.p2StartPos.y - this.enemy.y);
      this.p2Shadow.setAlpha(Math.max(0.1, 0.5 - (yDist / 200)));
      this.p2Shadow.setScale(Math.max(0.2, 1 - (yDist / 200)));
      
      if (this.p2Aura) { 
        this.p2Aura.setX(this.enemy.x); 
        this.p2Aura.setY(this.enemy.y + 80); 
        if (this.enemyTransformLevel > 0) {
          this.p2Aura.setVisible(true);
          const colors = this.getCharacterAuraColor(false);
          (this.p2Aura as Phaser.GameObjects.Shape).setFillStyle(colors.auraColor, 0.3);
          if (!this.enemyDefending) {
            this.p2Aura.setScale(0.95 + Math.sin(time * 0.012) * 0.12);
            this.p2Aura.setAlpha(0.25 + Math.sin(time * 0.035) * 0.08);
          }
        } else if (!this.enemyDefending) {
          this.p2Aura.setVisible(false);
        }
      }
      if (this.p2Shield) { 
        this.p2Shield.setX(this.enemy.x); 
        this.p2Shield.setY(this.enemy.y + 80); 
        if (this.enemyTransformLevel > 0 && !this.enemyDefending) {
          this.p2Shield.setVisible(true);
          const colors = this.getCharacterAuraColor(false);
          (this.p2Shield as Phaser.GameObjects.Arc).setStrokeStyle(2, colors.ringColor, 0.4);
          this.p2Shield.setScale(0.85 + Math.sin(time * 0.024) * 0.05);
        } else if (!this.enemyDefending) {
          this.p2Shield.setVisible(false);
        }
      }
    }

    // Keep training mode infinite HP but let them charge Ki normally
    // --- PLAYER 1 CONTROLS ---
    const isP1Local = (this.gameState.gameMode !== "online_pvp" || this.localPlayerIndex === 1);
    if (isP1Local) {
      if (this.p1ActionActive) {
        this.stopContinuousCharge(true);
        this.playerDefending = false;
        this.p1SpecialHoldTime = 0;
        this.clearChargeIndicator(true);
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
    }

    // Reset mobile special flag
    this.mobileP1SpecialJustUp = false;
    
    // --- PLAYER 2 CONTROLS (Local PvP or Online Guest) ---
    const isP2Local = (this.gameState.gameMode === "local_pvp" || (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2));
    if (isP2Local) {
      if (this.p2ActionActive) {
        this.stopContinuousCharge(false);
        this.enemyDefending = false;
        this.p2SpecialHoldTime = 0;
        this.clearChargeIndicator(false);
      } else {
        let isDefending = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
            ? (this.keys.p1_defend.isDown || this.mobileP1Defend)
            : this.keys.p2_defend.isDown;

        if (this.gameState.gameMode === "training") {
           isDefending = this.enemyDefending;
        }

        if (isDefending) {
          this.enemyDefending = true;
          this.performContinuousCharge(false, delta);
          this.p2SpecialHoldTime = 0;
          this.clearChargeIndicator(false);
          
          if (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2) {
            this.mobileP1Attack = false;
            this.mobileP1KiBlast = false;
            this.p1AttackBuffer = 0;
            this.p1KiBlastBuffer = 0;
          }
        } else {
          this.enemyDefending = false;
          this.stopContinuousCharge(false);

          const isAttack = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
              ? (Phaser.Input.Keyboard.JustDown(this.keys.p1_attack) || this.mobileP1Attack)
              : (Phaser.Input.Keyboard.JustDown(this.keys.p2_attack) || this.p2BufferedAttack);

          const isKiBlast = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
              ? (Phaser.Input.Keyboard.JustDown(this.keys.p1_kiblast) || this.mobileP1KiBlast)
              : (Phaser.Input.Keyboard.JustDown(this.keys.p2_kiblast) || this.p2BufferedKiBlast);

          const isTransform = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
              ? (Phaser.Input.Keyboard.JustDown(this.keys.p1_transform) || this.mobileP1Transform)
              : (Phaser.Input.Keyboard.JustDown(this.keys.p2_transform) || this.p2BufferedTransform);

          if (isAttack) {
            this.performAttack(false, "melee");
            if (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2) {
              this.mobileP1Attack = false;
            } else {
              this.p2BufferedAttack = false;
            }
          } else if (isKiBlast) {
            this.performAttack(false, "ki");
            if (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2) {
              this.mobileP1KiBlast = false;
            } else {
              this.p2BufferedKiBlast = false;
            }
          } else if (isTransform) {
            this.performTransform(false);
            if (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2) {
              this.mobileP1Transform = false;
            } else {
              this.p2BufferedTransform = false;
            }
          }

          if (!this.p2ActionActive) {
            const isSpecialDown = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
                ? (this.keys.p1_special.isDown || this.mobileP1Special)
                : this.keys.p2_special.isDown;

            const isSpecialJustUp = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
                ? (this.mobileP1SpecialJustUp || Phaser.Input.Keyboard.JustUp(this.keys.p1_special))
                : Phaser.Input.Keyboard.JustUp(this.keys.p2_special);

            if (isSpecialDown) {
              this.p2SpecialHoldTime += delta;
              this.updateChargeIndicator(false, this.p2SpecialHoldTime);
            } else if (
              (this.p2SpecialHoldTime > 0 && isSpecialJustUp) ||
              (isSpecialJustUp && this.p2SpecialHoldTime === 0)
            ) {
              this.performSpecial(
                false,
                this.p2SpecialHoldTime >= this.SUPER_THRESHOLD_MS,
              );
              this.p2SpecialHoldTime = 0;
              this.clearChargeIndicator(false);
              this.mobileP1SpecialJustUp = false;
            } else if (this.p2SpecialHoldTime > 0) {
              this.performSpecial(
                false,
                this.p2SpecialHoldTime >= this.SUPER_THRESHOLD_MS,
              );
              this.p2SpecialHoldTime = 0;
              this.clearChargeIndicator(false);
              this.mobileP1SpecialJustUp = false;
            }
          }
        }
      }
    }
  }

  // Safety timers for action unstuck
  public p1ActionTimeout: Phaser.Time.TimerEvent | null = null;
  public p2ActionTimeout: Phaser.Time.TimerEvent | null = null;

  performDash(isPlayer: boolean, direction: number) {
    if (isPlayer && this.p1DashCooldown) return;
    if (!isPlayer && this.p2DashCooldown) return;

    const isLocal = (isPlayer === (this.localPlayerIndex === 1));
    if (isLocal) {
      this.emitNetworkAction({ type: "dash", isPlayer, dir: direction });
    }

    const sprite = isPlayer ? this.player : this.enemy;
    const bounds = { minX: 50, maxX: 1950, minY: 100, maxY: 440 };

    this.setActionState(isPlayer, true);
    
    if (isPlayer) this.p1DashCooldown = true;
    else this.p2DashCooldown = true;

    // Simple dash dust effect
    this.createImpactEffect(sprite.x, sprite.y + 60, 0xecf0f1, "block");
    this.createDustEffect(sprite.x, (isPlayer ? this.p1StartPos.y : this.p2StartPos.y) + 180, 14, true, direction);
    if (this.cache.audio.exists("sfx_step")) this.sound.play("sfx_step", { volume: 1.5, rate: 1.5 });

    const dashDistance = 300 * direction;
    let targetX = sprite.x + dashDistance;
    
    // Bounds check
    if (isPlayer) {
       if (targetX <= this.enemy.x) targetX = Math.min(targetX, this.enemy.x - 40);
       else targetX = Math.max(targetX, this.enemy.x + 40);
    } else {
       if (targetX <= this.player.x) targetX = Math.min(targetX, this.player.x - 40);
       else targetX = Math.max(targetX, this.player.x + 40);
    }
    targetX = Phaser.Math.Clamp(targetX, bounds.minX, bounds.maxX);

    sprite.play(this.getAnimKey(isPlayer ? this.playerData.key : this.enemyData.key, isPlayer ? this.playerTransformLevel : this.enemyTransformLevel, "walk"), true);
    sprite.setFlipX(direction === -1);
    
    const fighterData = getFighter(isPlayer ? this.playerData.key : this.enemyData.key);
    const color = fighterData.specialColor;

    // Create ghost trail effect
    const ghostTimer = this.time.addEvent({
        delay: 30,
        repeat: 6,
        callback: () => {
            if (!this.scene.isActive() || !sprite.active) return;
            const ghost = this.add.sprite(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
                .setFlipX(sprite.flipX)
                .setTintFill(color)
                .setAlpha(0.5)
                .setDepth(sprite.depth - 1);
                
            this.tweens.add({
                targets: ghost,
                alpha: 0,
                scale: 1.2,
                duration: 300,
                onComplete: () => ghost.destroy()
            });
        }
    });

    this.tweens.add({
       targets: sprite,
       x: targetX,
       duration: 200,
       ease: 'Power2',
       onComplete: () => {
           this.setActionState(isPlayer, false);
           sprite.play(this.getAnimKey(isPlayer ? this.playerData.key : this.enemyData.key, isPlayer ? this.playerTransformLevel : this.enemyTransformLevel, "idle"), true);
           
           // Manage Cooldown and UI Ring
           const ring = this.add.graphics();
           ring.setDepth(sprite.depth + 1);
           const cooldownDuration = 500;
           let progress = { val: 0 };
           
           this.tweens.add({
               targets: progress,
               val: 1,
               duration: cooldownDuration,
               onUpdate: () => {
                   if (!this.scene.isActive() || !sprite.active) return;
                   ring.clear();
                   ring.lineStyle(4, color, 0.7);
                   ring.beginPath();
                   ring.arc(sprite.x, sprite.y, 40, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress.val), false);
                   ring.strokePath();
               },
               onComplete: () => {
                   ring.destroy();
                   if (isPlayer) this.p1DashCooldown = false;
                   else this.p2DashCooldown = false;
               }
           });
       }
    });
  }

  setActionState(isPlayer: boolean, isActive: boolean) {
    if (isPlayer) {
      this.p1ActionActive = isActive;
      if (isActive) {
         if (this.p1ActionTimeout) this.p1ActionTimeout.remove();
         this.p1ActionTimeout = this.time.delayedCall(6000, () => {
             if (this.p1ActionActive && !this.isBattleOver) {
                 console.warn("Failsafe triggered for Player 1 action state.");
                 this.p1ActionActive = false;
                 this.player.play(this.getAnimKey(this.playerData.key, this.playerTransformLevel, "idle"));
             }
         });
      } else {
         if (this.p1ActionTimeout) { this.p1ActionTimeout.remove(); this.p1ActionTimeout = null; }
         
         // Zero-latency instant continuation of buffered actions
         const isP1Local = (this.gameState.gameMode !== "online_pvp" || this.localPlayerIndex === 1);
         if (isP1Local && !this.playerDefending && !this.isBattleOver && !this.isP1Jumping) {
           if (this.p1TransformBuffer > 0 || this.mobileP1Transform) {
             this.p1TransformBuffer = 0;
             this.mobileP1Transform = false;
             this.performTransform(true);
           } else if (this.p1AttackBuffer > 0 || this.mobileP1Attack) {
             this.p1AttackBuffer = 0;
             this.mobileP1Attack = false;
             this.performAttack(true, "melee");
           } else if (this.p1KiBlastBuffer > 0 || this.mobileP1KiBlast) {
             this.p1KiBlastBuffer = 0;
             this.mobileP1KiBlast = false;
             this.performAttack(true, "ki");
           }
         }
      }
    } else {
      this.p2ActionActive = isActive;
      if (isActive) {
         if (this.p2ActionTimeout) this.p2ActionTimeout.remove();
         this.p2ActionTimeout = this.time.delayedCall(6000, () => {
             if (this.p2ActionActive && !this.isBattleOver) {
                 console.warn("Failsafe triggered for Player 2 action state.");
                 this.p2ActionActive = false;
                 this.enemy.play(this.getAnimKey(this.enemyData.key, this.enemyTransformLevel, "idle"));
             }
         });
      } else {
         if (this.p2ActionTimeout) { this.p2ActionTimeout.remove(); this.p2ActionTimeout = null; }
         
         // Zero-latency instant continuation of buffered actions for P2 / Opponent
         const isP2Local = (this.gameState.gameMode === "local_pvp" || (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2));
         if (isP2Local && !this.enemyDefending && !this.isBattleOver && !this.isP2Jumping) {
           const isP1Attack = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
               ? (this.p1AttackBuffer > 0 || this.mobileP1Attack)
               : (this.p2AttackBuffer > 0 || this.p2BufferedAttack);
           const isP1KiBlast = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
               ? (this.p1KiBlastBuffer > 0 || this.mobileP1KiBlast)
               : (this.p2KiBlastBuffer > 0 || this.p2BufferedKiBlast);
           const isP1Transform = (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2)
               ? (this.p1TransformBuffer > 0 || this.mobileP1Transform)
               : (this.p2TransformBuffer > 0 || this.p2BufferedTransform);

           if (isP1Transform) {
             if (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2) {
               this.p1TransformBuffer = 0;
               this.mobileP1Transform = false;
             } else {
               this.p2TransformBuffer = 0;
               this.p2BufferedTransform = false;
             }
             this.performTransform(false);
           } else if (isP1Attack) {
             if (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2) {
               this.p1AttackBuffer = 0;
               this.mobileP1Attack = false;
             } else {
               this.p2AttackBuffer = 0;
               this.p2BufferedAttack = false;
             }
             this.performAttack(false, "melee");
           } else if (isP1KiBlast) {
             if (this.gameState.gameMode === "online_pvp" && this.localPlayerIndex === 2) {
               this.p1KiBlastBuffer = 0;
               this.mobileP1KiBlast = false;
             } else {
               this.p2KiBlastBuffer = 0;
               this.p2BufferedKiBlast = false;
             }
             this.performAttack(false, "ki");
           }
         }
      }
    }
  }

  getCharacterAuraColor(isPlayer: boolean): { auraColor: number, ringColor: number } {
    const data = isPlayer ? this.playerData : this.enemyData;
    const level = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;
    
    // Default base form colors
    let auraColor = data.specialColor || (isPlayer ? 0x3498db : 0xe74c3c);
    let ringColor = auraColor;

    if (level > 0) {
      // Transformed forms
      const isUI = data.key === "goku" && level === 2;
      const isUE = data.key === "vegeta" && level === 2;
      const isSageMode = data.key === "naruto" && level === 1;
      const isKuramaMode = data.key === "naruto" && level === 2;

      auraColor = 0xffd700; // SSJ Gold
      ringColor = 0xffff00;

      if (isUI) {
        auraColor = 0xffffff;
        ringColor = 0x00ffff;
      } else if (isUE) {
        auraColor = 0x9b59b6;
        ringColor = 0xff00ff;
      } else if (data.key === "gohan" && level === 2) {
        auraColor = 0x8a2be2;
        ringColor = 0xff00ff;
      } else if (data.key === "gohan" && level === 1) {
        auraColor = 0xffd700;
        ringColor = 0xffff00;
      } else if (data.key === "piccolo") {
        auraColor = 0xff8800;
        ringColor = 0xffaa00;
      } else if (data.key === "cell") {
        auraColor = 0x00ff00;
        ringColor = 0x00aa00;
      } else if (data.key === "optimus") {
        auraColor = 0x3498db;
        ringColor = 0x2980b9;
      } else if (data.key === "minipekka") {
        auraColor = 0xff0000;
        ringColor = 0xaa0000;
      } else if (data.key === "cyberninja") {
        auraColor = 0x00eaff;
        ringColor = 0x0088ff;
      } else if (isSageMode) {
        auraColor = 0xffaa00;
        ringColor = 0xff4400;
      } else if (isKuramaMode) {
        auraColor = 0xffff00;
        ringColor = 0xffaa00;
      } else if (data.key === "thukuna") {
        auraColor = 0x8b0000;
        ringColor = 0x000000;
      } else if (data.key === "gojo") {
        auraColor = 0x00ffff;
        ringColor = 0xffffff;
      } else if (data.key === "saitama") {
        auraColor = 0xffffff;
        ringColor = 0xff0000;
      }
    }

    return { auraColor, ringColor };
  }

  performContinuousCharge(isPlayer: boolean, delta: number) {
    if (this.isBattleOver) return;
    const chargeRate = 0.04 * delta; // Slightly faster charge
    this.modifyKi(isPlayer, chargeRate);
    
    const colors = this.getCharacterAuraColor(isPlayer);
    const aura = isPlayer ? this.p1Aura : this.p2Aura;
    const shield = isPlayer ? this.p1Shield : this.p2Shield;
    
    if (aura && aura.active) {
      aura.setVisible(true);
      (aura as Phaser.GameObjects.Shape).setFillStyle(colors.auraColor, 0.4);
      aura.setScale(1.2 + Math.sin(this.time.now * 0.03) * 0.4);
      aura.setAlpha(0.5 + Math.sin(this.time.now * 0.06) * 0.25);
    }
    
    if (shield && shield.active) {
      shield.setVisible(true);
      (shield as Phaser.GameObjects.Arc).setStrokeStyle(4, colors.ringColor, 0.8);
      shield.setScale(1.1 + Math.sin(this.time.now * 0.08) * 0.15);
    }

    // Ki Charge Particles Effect
    const sprite = isPlayer ? this.player : this.enemy;
    if (Math.random() > 0.4) {
        const px = sprite.x + Phaser.Math.Between(-55, 55);
        const py = sprite.y + 100 + Phaser.Math.Between(-15, 10);
        const size = Phaser.Math.Between(3, 7);
        const p = this.add.circle(px, py, size, colors.auraColor).setDepth(sprite.depth - 1);
        p.setBlendMode(Phaser.BlendModes.ADD);
        
        this.tweens.add({
            targets: p,
            x: px + Phaser.Math.Between(-30, 30),
            y: py - 180,
            alpha: 0,
            scale: 2.2,
            duration: 500,
            onComplete: () => p.destroy()
        });
    }

    const data = isPlayer ? this.playerData : this.enemyData;
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const chargeAnim = this.getAnimKey(data.key, transLevel, "charge");
    if (sprite.anims.currentAnim?.key !== chargeAnim) {
      sprite.play(chargeAnim);
    }
  }

  stopContinuousCharge(isPlayer: boolean) {
    const aura = isPlayer ? this.p1Aura : this.p2Aura;
    const shield = isPlayer ? this.p1Shield : this.p2Shield;
    const transLevel = isPlayer ? this.playerTransformLevel : this.enemyTransformLevel;
    
    if (aura && aura.active && transLevel === 0) aura.setVisible(false);
    if (shield && shield.active && transLevel === 0) shield.setVisible(false);

    const sprite = isPlayer ? this.player : this.enemy;
    const data = isPlayer ? this.playerData : this.enemyData;
    const chargeAnim = this.getAnimKey(data.key, transLevel, "charge");
    const idleAnim = this.getAnimKey(data.key, transLevel, "idle");

    if (sprite.anims.currentAnim?.key === chargeAnim) {
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
      .sprite(this.p1StartPos.x, this.p1StartPos.y, this.playerData.key, "0")
      .setOrigin(0.5, 0.5)
      .setScale(3) // Scaled down from 4 to fit screen better (Texture height 128 * 3 = 384px)
      .setDepth(1);
    this.player.play(`${this.playerData.key}_idle`, true);
    
    // Add cool graphical effects to the sprite
    if (this.player.postFX) {
        // Shadow FX removed due to pipeline flickering on animation frames
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
    this.p1DebugCircle = this.add.circle(this.p1StartPos.x, this.p1StartPos.y + 80, 50, 0x3498db, 0.5).setVisible(false);
    this.p1Aura = this.add
      .circle(this.p1StartPos.x, this.p1StartPos.y + 80, 51, 0x3498db, 0.5)
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
      .sprite(this.p2StartPos.x, this.p2StartPos.y, this.enemyData.key, "0")
      .setOrigin(0.5, 0.5)
      .setScale(3)
      .setFlipX(true)
      .setDepth(1);
    this.enemy.play(`${this.enemyData.key}_idle`, true);
    
    // Add cool graphical effects to the sprite
    if (this.enemy.postFX) {
        // Shadow FX removed due to pipeline flickering on animation frames
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
    this.p2DebugCircle = this.add.circle(this.p2StartPos.x, this.p2StartPos.y + 80, 50, 0xe74c3c, 0.5).setVisible(false);
    this.p2Aura = this.add
      .circle(this.p2StartPos.x, this.p2StartPos.y + 80, 51, 0xe74c3c, 0.5)
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
    const isLocal = (isP === (this.localPlayerIndex === 1));
    if (isLocal) {
      this.emitNetworkAction({ type: "jump", isPlayer: isP });
    }

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
            this.createDustEffect(player.x, startY + 180, 16);
            
            if (this.cache.audio.exists("sfx_step")) {
                this.sound.play("sfx_step", { volume: 0.5 });
            }
          }
        });
      }
    });
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

    const isLocal = (isPlayer === (this.localPlayerIndex === 1));
    if (isLocal) {
      this.emitNetworkAction({ type: "attack", isPlayer, attackType });
    }

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
        if (this.battleUI) {
          this.battleUI.addCombatLog(`${attackerData.name} misses melee!`, isPlayer ? "#3498db" : "#e74c3c");
        }
        return;
    }

    if (this.battleUI) {
      const typeStr = attackType === "melee" ? "Melee Attack" : "Ki Blast";
      this.battleUI.addCombatLog(`${attackerData.name} uses ${typeStr}!`, isPlayer ? "#3498db" : "#e74c3c");
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
      case "madara": {
        const fighter = getFighter("madara");
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
      case "obito": {
        const fighter = getFighter("obito");
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
      case "itachi": {
        const fighter = getFighter("itachi");
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
      case "jotaro": {
        const fighter = getFighter("jotaro");
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
      case "spiderman": {
        const fighter = getFighter("spiderman");
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
      case "naruto": {
        const fighter = getFighter("naruto");
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
      case "thukuna": {
        const fighter = getFighter("thukuna");
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
      case "batman": {
        const fighter = getFighter("batman");
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
      case "cyberninja": {
        const fighter = getFighter("cyberninja");
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
      case "minipekka": {
        const fighter = getFighter("minipekka");
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
      case "optimus": {
        const fighter = getFighter("optimus");
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
      case "cell": {
        const fighter = getFighter("cell");
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
      case "piccolo": {
        const fighter = getFighter("piccolo");
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
      case "gohan": {
        const fighter = getFighter("gohan");
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
      case "leonardo": {
        const fighter = getFighter("leonardo");
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
      case "saitama": {
        const fighter = getFighter("saitama");
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
      case "static": {
        const fighter = getFighter("static");
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
      case "frieren": {
        const fighter = getFighter("frieren");
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
      case "chapolim": {
        const fighter = getFighter("chapolim");
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
      case "gojo": {
        const fighter = getFighter("gojo");
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
      default:
        return false; // Fallback to generic
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
              if(this.battleCamera) this.battleCamera.shake(
                isComboFinisher ? 200 : 100,
                isComboFinisher ? 0.02 : 0.01,
              );

              if (isComboFinisher) {
                if (this.battleUI) this.battleUI.showCombo(target.x, target.y - 100);
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

    // Check max transformation level
    let maxLevel = 1;
    if (data.key === "goku" || data.key === "vegeta" || data.key === "naruto" || data.key === "gohan")
      maxLevel = 2; // Goku, Vegeta, Naruto, Gohan have 2 transformations

    if (!data.transformAvailable || currentLevel >= maxLevel || ki < 100)
      return;

    const isLocal = (isPlayer === (this.localPlayerIndex === 1));
    if (isLocal) {
      this.emitNetworkAction({ type: "transform", isPlayer });
    }

    const sprite = isPlayer ? this.player : this.enemy;

    this.setActionState(isPlayer, true);
    this.modifyKi(isPlayer, -100);
    this.clearChargeIndicator(isPlayer);

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
    } else if (data.key === "gohan" && nextLevel === 2) {
      auraColor = 0x8a2be2; // Violet
      ringColor = 0xff00ff; // Magenta
      transformText = "BEAST FORM!";
    } else if (data.key === "gohan" && nextLevel === 1) {
      auraColor = 0xffd700;
      ringColor = 0xffff00;
      transformText = "SUPER SAIYAN!";
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
      if(this.battleCamera) this.battleCamera.shake(800, 0.01);
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
            if (isUI || isUE || isKuramaMode || (data.key === "gohan" && nextLevel === 2)) texKey = `${data.key}_ui`;

            if (this.textures.exists(texKey)) {
              sprite.setTexture(texKey, "0");
              const animKeyIdle = this.getAnimKey(data.key, nextLevel, "idle");
              if (this.anims.exists(animKeyIdle)) sprite.play(animKeyIdle);
            }

            // Big Flash & Shake
            if (data.key === "thukuna") {
              // Invert colors momentarily for an "impact frame" feel
              if(this.battleCamera) this.battleCamera.flash(800, 255, 0, 0, true);

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
              if(this.battleCamera) this.battleCamera.flash(800, 255, 255, 255, true);
            }

            if(this.battleCamera) this.battleCamera.shake(1000, 0.05);
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
            fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
            fontSize: "64px",
            color: textFill,
            stroke: textStroke,
            strokeThickness: 8,
            fontStyle: "italic",
            resolution: 2
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

        if(this.battleUI) this.battleUI.showLog(transformText);
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
        if(this.battleCamera) this.battleCamera.flash(100, 255, 255, 255, false);

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
        try {
          onFireCallback();
        } catch (e) {
          console.error("Error evaluating special attack!", e);
          this.onSpecialComplete(isPlayer);
        }

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
    const cost = isSuper ? 100 : 50;

    if (ki < cost) {
      if (isPlayer) if(this.battleUI) this.battleUI.showLog(`Need ${cost} Ki!`);
      return;
    }

    const isLocal = (isPlayer === (this.localPlayerIndex === 1));
    if (isLocal) {
      this.emitNetworkAction({ type: "special", isPlayer, isSuper });
    }

    const data = isPlayer ? this.playerData : this.enemyData;
    const sprite = isPlayer ? this.player : this.enemy;

    this.setActionState(isPlayer, true);
    if (isSuper) {
      if (isPlayer) this.p1SuperActive = true;
      else this.p2SuperActive = true;
    }
    this.modifyKi(isPlayer, -cost);
    
    if (this.battleUI) {
      const moveNameLog = isSuper ? data.superName : data.specialName;
      this.battleUI.addCombatLog(`${data.name} uses ${moveNameLog}!`, isPlayer ? "#3498db" : "#e74c3c");
    }

    if (isPlayer && this.gameState && this.gameState.gameMode !== 'training') {
        DailyChallenges.addProgress('use_special_5_times', 1);
    }

    const moveName = isSuper ? data.superName : data.specialName;
    if (moveName && moveName !== "") {
      this.showMoveName(moveName);
    }

    if (isPlayer) {
      this.p1ComboCount = 0;
    } else {
      this.p2ComboCount = 0;
    }

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
            case "spiderman": {
              const fighter = getFighter("spiderman");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "vegeta": {
              const fighter = getFighter("vegeta");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "gohan": {
              const fighter = getFighter("gohan");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "piccolo": {
              const fighter = getFighter("piccolo");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "cell": {
              const fighter = getFighter("cell");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "leonardo": {
              const fighter = getFighter("leonardo");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "frieren": {
              const fighter = getFighter("frieren");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "optimus": {
              const fighter = getFighter("optimus");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "cyberninja": {
              const fighter = getFighter("cyberninja");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "chapolim": {
              const fighter = getFighter("chapolim");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "naruto": {
              const fighter = getFighter("naruto");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "batman": {
              const fighter = getFighter("batman");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "thukuna": {
              const fighter = getFighter("thukuna");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "gojo": {
              const fighter = getFighter("gojo");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "obito": {
              const fighter = getFighter("obito");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "itachi": {
              const fighter = getFighter("itachi");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "jotaro": {
              const fighter = getFighter("jotaro");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "madara": {
              const fighter = getFighter("madara");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "saitama": {
              const fighter = getFighter("saitama");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "minipekka": {
              const fighter = getFighter("minipekka");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
            case "static": {
              const fighter = getFighter("static");
              if (isSuper) fighter.performSuper({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              else fighter.performSpecial({ scene: this, attacker: sprite, defender: isPlayer ? this.enemy : this.player, isPlayer, attackType: "ki", comboCount: 0, isComboFinisher: false, transformLevel: transLevel });
              break;
            }
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

  public onSpecialComplete(isPlayer: boolean) {
    const data = isPlayer ? this.playerData : this.enemyData;
    const transLevel = isPlayer
      ? this.playerTransformLevel
      : this.enemyTransformLevel;
    const animKeyIdle = this.getAnimKey(data.key, transLevel, "idle");
    const attacker = isPlayer ? this.player : this.enemy;

    if (isPlayer) this.p1SuperActive = false;
    else this.p2SuperActive = false;

    if (this.scene.isActive()) {
      attacker.play(animKeyIdle);
      this.setActionState(isPlayer, false);
    }
  }

  // Helper to calculate damage multiplier based on transformation level
  public getDamageMultiplier(transLevel: number): number {
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
  public specialBeam(
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

    if(this.battleUI) this.battleUI.showLog(isS ? "SUPER ATTACK!" : type.toUpperCase() + "!");
    if (this.cache.audio.exists("sfx_beam")) this.sound.play("sfx_beam");

    // Charge Effect
    const chargeCore = this.add
      .circle(hand.x, hand.y, 2, 0xffffff)
      .setDepth(16);
    const chargeGlow = this.add
      .circle(hand.x, hand.y, 5, col)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    if(this.battleCamera) this.battleCamera.shake(400, 0.01);

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
        if(this.battleCamera) this.battleCamera.shake(300, 0.03);

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
  

  // 4. KATANA SLASH (DIMENSIONAL CUT REMASTER)
  

  

  

  

  

  // 5. ZOLTRAAK (MASSIVE MAGIC REMASTER)
  

  // 6. MISSILES (SMOKE TRAIL REMASTER)
  

  // 7. PANCAKE (JUMP ATTACK - Uses specific tweens)
  

  // 8. PLASMA DASH (CYBER NINJA SPECIAL)
  

  // =========================================================================
  // SPIDERMAN SPECIAL & SUPER ATTACKS
  // =========================================================================

  

  

  // =========================================================================
  // 100% ULTIMATE ATTACKS
  // =========================================================================





  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

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
    type: "melee" | "beam" | "block" | "super" = "melee",
  ) {
    const isSuperMode = type === "super" || this.p1SuperActive || this.p2SuperActive;
    const isBeam = type === "beam" || (isSuperMode && type !== "block");
    const isBlock = type === "block";

    // Main Flash - Make it bigger and punchier
    const boomRadius = isSuperMode ? 60 : (isBeam ? 40 : (isBlock ? 15 : 20));
    const boom = this.add
      .circle(x, y, boomRadius, color)
      .setDepth(20);
    this.tweens.add({
      targets: boom,
      scale: isSuperMode ? 12 : (isBeam ? 8 : (isBlock ? 3 : 6)),
      alpha: 0,
      duration: isSuperMode ? 500 : (isBeam ? 350 : 250),
      ease: "Cubic.easeOut",
      onComplete: () => boom.destroy(),
    });

    // Add an inner white core for more impact
    const coreRadius = isSuperMode ? 35 : (isBeam ? 20 : 10);
    const core = this.add.circle(x, y, coreRadius, 0xffffff).setDepth(21);
    this.tweens.add({
      targets: core,
      scale: isSuperMode ? 8 : (isBeam ? 6 : 4),
      alpha: 0,
      duration: isSuperMode ? 300 : (isBeam ? 200 : 150),
      ease: "Cubic.easeOut",
      onComplete: () => core.destroy(),
    });

    // Debris / Sparks - Faster and more dynamic
    const particleCount = isSuperMode ? 60 : (isBeam ? 32 : (isBlock ? 12 : 20));
    for (let i = 0; i < particleCount; i++) {
      const p = this.add
        .rectangle(
          x,
          y,
          isSuperMode ? 14 : (isBeam ? 10 : 6),
          isSuperMode ? 3 : (isBeam ? 2 : 6), // Elongated sparks for beams
          isBlock ? 0x3498db : (Math.random() > 0.5 ? 0xffffff : color),
        )
        .setDepth(20);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = isSuperMode
        ? Phaser.Math.Between(250, 550)
        : (isBeam ? Phaser.Math.Between(150, 350) : Phaser.Math.Between(80, 200));

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleY: 0.1,
        scaleX: isSuperMode ? 3 : (isBeam ? 2 : 0.1),
        rotation: angle, // Align rotation to travel direction
        duration: Phaser.Math.Between(isSuperMode ? 600 : 400, isSuperMode ? 1200 : 800),
        ease: "Expo.easeOut",
        onComplete: () => p.destroy(),
      });
    }

    // Extra ring for beams or super
    if (isSuperMode || isBeam) {
      const ringCount = isSuperMode ? 3 : 1;
      for (let r = 0; r < ringCount; r++) {
        const ring = this.add
          .circle(x, y, 30 + r * 15)
          .setStrokeStyle(isSuperMode ? 6 : 4, color)
          .setDepth(19);
        this.tweens.add({
          targets: ring,
          scale: isSuperMode ? 8 + r * 2 : 5,
          alpha: 0,
          delay: r * 80,
          duration: isSuperMode ? 600 : 400,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      }

      // Camera shake and screen flash
      if (isSuperMode) {
        if (this.battleCamera) {
          this.battleCamera.flash(300, 255, 255, 255, true);
          this.battleCamera.shake(500, 0.08); // Trigger a stronger camera shake effect
        }
      } else {
        if (this.battleCamera) this.battleCamera.flash(150, 255, 255, 255, true);
        if (this.battleCamera) this.battleCamera.shake(300, 0.05);
      }
    } else if (isBlock) {
      // Block specific shake
      if (this.battleCamera) this.battleCamera.shake(100, 0.01);
    } else {
      // Melee specific shake
      if (this.battleCamera) this.battleCamera.shake(150, 0.02);
    }
  }

  createDustEffect(x: number, y: number, count: number = 10, isDash: boolean = false, direction: number = 0) {
    if (!this.scene.isActive()) return;

    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(4, 12);
      // Colors representing soil/dust (translucent desert sandy and grey tones)
      const dustColors = [0xdad7cd, 0xa3b19b, 0xededed, 0xdbd5c9, 0xc0b299];
      const color = Phaser.Utils.Array.GetRandom(dustColors);
      
      const p = this.add.circle(
        x + Phaser.Math.Between(-25, 25),
        y + Phaser.Math.Between(-8, 8),
        size,
        color,
        Phaser.Math.FloatBetween(0.25, 0.55)
      ).setDepth(1); // Set depth above or on level with shadow but below character typically

      let targetX = x;
      let targetY = y - Phaser.Math.Between(15, 65);

      if (isDash && direction !== 0) {
        // Dust blows backwards away from quick motion
        targetX = x - (direction * Phaser.Math.Between(70, 180)) + Phaser.Math.Between(-15, 15);
        targetY = y - Phaser.Math.Between(5, 30);
      } else {
        // Landing dust expands outwards
        const angle = Phaser.Math.FloatBetween(Math.PI, Math.PI * 2); // semi-circle upwards
        const dist = Phaser.Math.Between(30, 130);
        targetX = x + Math.cos(angle) * dist;
        targetY = y + Math.sin(angle) * dist * 0.25 - Phaser.Math.Between(10, 35);
      }

      this.tweens.add({
        targets: p,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: Phaser.Math.FloatBetween(1.6, 2.8),
        duration: Phaser.Math.Between(350, 750),
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy()
      });
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
      fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
      fontSize: fontSize,
      color: color,
      stroke: "#000000",
      strokeThickness: isCritical ? 6 : 4,
      shadow: { color: "#000", blur: 4, offsetX: 2, offsetY: 2, fill: true },
      resolution: 2
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
    const targetData = isP ? this.playerData : this.enemyData;

    let msg = "";
    const logColor = isP ? "#e74c3c" : "#3498db";

    let isCritical = false;
    if (def) {
      dmg = Math.floor(dmg * 0.3);
      msg = `${targetData.name} blocks! (-${dmg} HP)`;
      // Block effect
      this.createImpactEffect(target.x, target.y + 120, 0x3498db, "block"); // Blue shield spark
      if (this.cache.audio.exists("sfx_block")) this.sound.play("sfx_block");
    } else {
      isCritical = dmg > 25; // threshold for critical visual
      msg = `${targetData.name} takes ${dmg} damage!`;
      if (isCritical) msg = `CRITICAL! ${msg}`;
      if (this.cache.audio.exists("sfx_hit")) this.sound.play("sfx_hit");
      // Add requested screen-shake and particle burst
      if(this.battleCamera) this.battleCamera.shake(150, 0.02);
      this.createImpactEffect(target.x, target.y + 60, 0xffaa00, "melee");

      // Update combo counter
      if (this.battleUI) {
        if (isP && this.p2ComboCount > 1) {
          this.battleUI.updateCombo(this.p2ComboCount, false);
        } else if (!isP && this.p1ComboCount > 1) {
          this.battleUI.updateCombo(this.p1ComboCount, true);
        }
      }
    }
    
    if (this.battleUI) this.battleUI.addCombatLog(msg, logColor);

    // Reset combo count when hit
    if (isP) {
      this.p1ComboCount = 0;
    } else {
      this.p2ComboCount = 0;
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
      if (this.battleCamera && isCritical) this.battleCamera.flash(50, 255, 255, 255, false); // Quick camera flash only on critical hits, non-forcing
      
      this.time.delayedCall(40, () => {
        if (target.active) target.setTint(0xff0000); // Then red
        this.time.delayedCall(200, () => {
          if (target && target.active) target.clearTint();
        });
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

  }

  public cleanupAndShowVictory(win: boolean) {
    if (this.battleInput && this.battleInput.mobileControls) {
      this.battleInput.mobileControls.forEach((c: any) => {
        try {
          c.destroy();
        } catch (e) {
          console.warn("Error destroying mobile control:", e);
        }
      });
      this.battleInput.mobileControls = [];
    }

    if (this.battleUI && this.battleUI.uiContainer) {
      this.battleUI.uiContainer.setAlpha(0);
    }

    if (this.battleCamera) this.battleCamera.camera.resetFX();
    else this.cameras.main.resetFX();

    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(480, 270);

    if (this.battleReward) {
      this.battleReward.endBattle(win);
    }
  }

  getPlayerName(): string {
    const authUser = auth.currentUser;
    if (authUser?.displayName) {
      return authUser.displayName;
    }
    if (authUser?.email) {
      return authUser.email.split("@")[0];
    }
    return "Guerreiro";
  }

  emitNetworkAction(actionData: any) {
    if (this.gameState.gameMode === "online_pvp" && !this.isIncomingNetworkAction) {
      MultiplayerManager.getInstance().emitAction(actionData);
    }
  }

  showMoveName(name: string) {
    // Determine screen center. Assuming resolution 960x540.
    const text = this.add.text(480, 270, name, {
      fontSize: "48px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
      fontStyle: "bold",
      resolution: 2
    }).setOrigin(0.5).setDepth(200);

    text.setScale(0.5);
    
    this.tweens.add({
      targets: text,
      scale: 1.2,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: text,
          scale: 1,
          duration: 200,
          onComplete: () => {
            this.time.delayedCall(500, () => {
              this.tweens.add({
                targets: text,
                alpha: 0,
                duration: 200,
                onComplete: () => text.destroy()
              });
            });
          }
        });
      }
    });
  }

  log(msg: string) {
    if (this.battleUI) this.battleUI.showLog(msg);
  }

  modifyKi(isP: boolean, amt: number) {
    const oldKi = isP ? this.playerKi : this.enemyKi;
    if (isP) this.playerKi = Phaser.Math.Clamp(this.playerKi + amt, 0, 100);
    else this.enemyKi = Phaser.Math.Clamp(this.enemyKi + amt, 0, 100);
    if (oldKi !== (isP ? this.playerKi : this.enemyKi)) {
        if(this.battleUI) this.battleUI.updateBars(this.playerHp/this.playerData.maxHp, this.enemyHp/this.enemyData.maxHp, this.playerKi/100, this.enemyKi/100);
    }
  }

  

  

  

  

  

  
}
