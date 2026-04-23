
import Phaser from 'phaser';
import { GameState } from '../types';

export default class CharacterSelectScene extends Phaser.Scene {
  declare registry: Phaser.Data.DataManager;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare sound: Phaser.Sound.NoAudioSoundManager | Phaser.Sound.HTML5AudioSoundManager | Phaser.Sound.WebAudioSoundManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare tweens: Phaser.Tweens.TweenManager;
  declare cache: Phaser.Cache.CacheManager;
  declare make: Phaser.GameObjects.GameObjectCreator;

  private state!: GameState;
  private charContainer!: Phaser.GameObjects.Container;
  private selectionStep: number = 0; // 0 = P1, 1 = P2
  private headerText!: Phaser.GameObjects.Text;
  private fightBtn!: Phaser.GameObjects.Container;

  constructor() {
    super('CharacterSelectScene');
  }

  create() {
    this.state = this.registry.get('gameState') as GameState;
    
    if(this.cache.audio.exists('bgm_battle')) {
         this.sound.stopByKey('bgm_battle');
    }
    if(this.cache.audio.exists('bgm_menu')) {
         let isPlaying = false;
         this.sound.getAll('bgm_menu').forEach(s => { if (s.isPlaying) isPlaying = true; });
         if (!isPlaying) {
             this.sound.play('bgm_menu', { loop: true, volume: 0.5 });
         }
    }

    // Force single player on mobile if local_pvp
    const isTouch = this.sys.game.device.input.touch || window.innerWidth < 800;
    if (isTouch && this.state.gameMode === 'local_pvp') {
        this.state.gameMode = 'single';
    }

    const { width, height } = this.cameras.main;
    this.selectionStep = 0;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0b2e, 0x000000, 0x1a0b2e, 0x000000, 1);
    bg.fillRect(0, 0, width, height);
    
    this.add.image(width / 2, height / 2, 'arena').setAlpha(0.15).setBlendMode(Phaser.BlendModes.ADD);

    // Animated particles
    for (let i = 0; i < 30; i++) {
        const p = this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), Phaser.Math.FloatBetween(1, 4), 0x3498db, Phaser.Math.FloatBetween(0.2, 0.6));
        this.tweens.add({
            targets: p,
            y: p.y - Phaser.Math.Between(50, 150),
            alpha: 0,
            duration: Phaser.Math.Between(2000, 4000),
            repeat: -1,
            onRepeat: () => {
                p.y = height + 10;
                p.x = Phaser.Math.Between(0, width);
            }
        });
    }

    // Botão Voltar
    const backBtnContainer = this.add.container(80, 40);
    const backBg = this.add.rectangle(0, 0, 120, 40, 0x333333).setStrokeStyle(2, 0xffffff);
    const backTxt = this.add.text(0, 0, '← VOLTAR', { fontSize: '16px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    backBtnContainer.add([backBg, backTxt]);
    
    const backHit = this.add.rectangle(0, 0, 120, 40, 0x000000, 0).setInteractive({ useHandCursor: true });
    backBtnContainer.add(backHit);
    
    backHit.on('pointerover', () => { backBg.setFillStyle(0x555555); this.tweens.add({ targets: backBtnContainer, scale: 1.1, duration: 100 }); });
    backHit.on('pointerout', () => { backBg.setFillStyle(0x333333); this.tweens.add({ targets: backBtnContainer, scale: 1, duration: 100 }); });
    backHit.on('pointerdown', () => {
        if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
        this.scene.start('MenuScene');
    });

    // Header
    this.headerText = this.add.text(width / 2, 50, '', {
        fontSize: '36px',
        color: '#ffd54a',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6,
        shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 4, stroke: true, fill: true }
    }).setOrigin(0.5);
    
    this.tweens.add({
        targets: this.headerText,
        y: 45,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    this.charContainer = this.add.container(width / 2, 170);
    
    // Botão de Luta (Escondido até selecionar)
    this.createFightButton();
    
    this.updateUI();
  }

  createFightButton() {
    const { width, height } = this.cameras.main;
    this.fightBtn = this.add.container(width / 2, height - 60).setVisible(false);
    
    const shadow = this.add.rectangle(4, 4, 240, 60, 0x000000, 0.5).setOrigin(0.5);
    const bg = this.add.rectangle(0, 0, 240, 60, 0x27ae60).setStrokeStyle(3, 0xffffff);
    const innerBg = this.add.rectangle(0, 0, 232, 52, 0x000000, 0.2).setOrigin(0.5);
    const txt = this.add.text(0, 0, 'LUTAR!', { fontSize: '28px', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, fill: true } }).setOrigin(0.5);
    
    this.fightBtn.add([shadow, bg, innerBg, txt]);
    
    // Pulsing effect for the fight button
    this.tweens.add({
        targets: this.fightBtn,
        scale: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    const hitArea = this.add.rectangle(0, 0, 240, 60, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.fightBtn.add(hitArea);

    hitArea.on('pointerover', () => bg.setFillStyle(0x2ecc71))
      .on('pointerout', () => bg.setFillStyle(0x27ae60))
      .on('pointerdown', () => {
          if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
          
          if (this.state.gameMode === 'tournament') {
              this.state.tournamentPlayerCharId = this.state.p1CharacterId;
              
              // Generate Bracket
              const chars = this.state.characters;
              const participants = [this.state.p1CharacterId];
              const available = chars.filter(c => c.id !== this.state.p1CharacterId);
              Phaser.Utils.Array.Shuffle(available);
              for(let i=0; i<7; i++) {
                  participants.push(available[i].id);
              }
              Phaser.Utils.Array.Shuffle(participants);
              
              this.state.tournamentRounds = [
                  { matches: [ {p1: participants[0], p2: participants[1], winner: null}, {p1: participants[2], p2: participants[3], winner: null}, {p1: participants[4], p2: participants[5], winner: null}, {p1: participants[6], p2: participants[7], winner: null} ] },
                  { matches: [ {p1: null, p2: null, winner: null}, {p1: null, p2: null, winner: null} ] },
                  { matches: [ {p1: null, p2: null, winner: null} ] }
              ];
              this.state.tournamentCurrentRoundIndex = 0;
              this.registry.set('gameState', this.state);
              this.scene.start('TournamentScene');
          } else {
              this.scene.start('BattleScene');
          }
      });
  }

  updateUI() {
      this.headerText.setText(this.getSelectionText());
      this.createCharacterSelector();
      
      // Mostrar botão de lutar se a seleção estiver completa ou for single player/arcade/tournament
      if (this.state.gameMode !== 'local_pvp' || this.selectionStep === 1) {
          this.fightBtn.setVisible(true);
      } else {
          this.fightBtn.setVisible(false); 
      }
  }

  getSelectionText(): string {
      if (this.state.gameMode !== 'local_pvp') return 'ESCOLHA SEU HERÓI';
      return this.selectionStep === 0 ? 'PLAYER 1: ESCOLHA' : 'PLAYER 2: ESCOLHA';
  }

  createCharacterSelector() {
      this.charContainer.removeAll(true);
      const unlockedChars = this.state.characters.filter(c => c.unlocked);
      
      const cardSize = 100; // Larger square cards
      const gapX = 12;
      const gapY = 24;
      const itemsPerRow = 8;
      const totalWidth = (itemsPerRow * cardSize) + ((itemsPerRow - 1) * gapX);
      const startX = -(totalWidth / 2) + (cardSize / 2);

      unlockedChars.forEach((char, index) => {
          const col = index % itemsPerRow;
          const row = Math.floor(index / itemsPerRow);
          const x = startX + (col * (cardSize + gapX));
          const y = (row * (cardSize + gapY));

          const isP1 = this.state.p1CharacterId === char.id;
          const isP2 = this.state.p2CharacterId === char.id && this.state.gameMode === 'local_pvp';
          const isSelected = isP1 || isP2;

          const card = this.add.container(x, y);

          let bgColor = 0x2a2a35;
          let strokeColor = 0x555566;
          if (isP1) { strokeColor = 0x3498db; bgColor = 0x152535; }
          else if (isP2) { strokeColor = 0xe74c3c; bgColor = 0x351515; }

          // GLOW EFFECT
          if (isSelected) {
              const glow = this.add.rectangle(0, 0, cardSize + 12, cardSize + 12, strokeColor)
                  .setAlpha(0.4)
                  .setDepth(-1); 
              
              card.add(glow);

              this.tweens.add({
                  targets: glow,
                  alpha: { from: 0.3, to: 0.6 },
                  scale: { from: 0.95, to: 1.05 },
                  duration: 800,
                  yoyo: true,
                  repeat: -1,
                  ease: 'Sine.easeInOut'
              });
          }

          // Card Background
          const shadow = this.add.rectangle(4, 4, cardSize, cardSize, 0x000000, 0.5);
          const bg = this.add.rectangle(0, 0, cardSize, cardSize, bgColor)
              .setStrokeStyle(isSelected ? 4 : 2, strokeColor);
          const innerBg = this.add.rectangle(0, 0, cardSize - 6, cardSize - 6, 0x000000, 0.2);

          // Character Sprite - ALIGNED AND SCALED TO FIT
          const sprite = this.add.sprite(0, -6, char.key, 0)
              .setOrigin(0.5, 0.75)
              .setScale(1.0);
          
          if (this.anims.exists(`${char.key}_idle`)) {
              sprite.play(`${char.key}_idle`, true);
          }

          // Name plate
          const nameBg = this.add.rectangle(0, cardSize/2 - 12, cardSize - 4, 24, 0x000000, 0.8);
          const nameTxt = this.add.text(0, cardSize/2 - 12, char.name, {
              fontSize: '11px',
              fontStyle: 'bold',
              color: isSelected ? '#fff' : '#ccc',
              wordWrap: { width: cardSize - 6, useAdvancedWrap: true },
              align: 'center'
          }).setOrigin(0.5);

          card.add([shadow, bg, innerBg, sprite, nameBg, nameTxt]);

          if (isP1) {
              const p1Badge = this.add.rectangle(0, -cardSize/2 - 12, 40, 24, 0x3498db).setStrokeStyle(2, 0xffffff);
              const p1Txt = this.add.text(0, -cardSize/2 - 12, 'P1', { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
              card.add([p1Badge, p1Txt]);
          }
          if (isP2) {
              const p2Badge = this.add.rectangle(0, -cardSize/2 - 12, 40, 24, 0xe74c3c).setStrokeStyle(2, 0xffffff);
              const p2Txt = this.add.text(0, -cardSize/2 - 12, 'P2', { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
              card.add([p2Badge, p2Txt]);
          }

          const hitArea = this.add.rectangle(0, 0, cardSize, cardSize, 0x000000, 0).setInteractive({ useHandCursor: true });
          card.add(hitArea);

          hitArea.on('pointerdown', () => this.selectCharacter(char.id))
             .on('pointerover', () => {
                 if (!isSelected) {
                    this.tweens.add({ targets: card, scale: 1.1, duration: 100, ease: 'Sine.easeInOut' });
                    bg.setStrokeStyle(3, 0xaaaaaa); 
                    card.setAlpha(1); 
                    nameTxt.setColor('#fff');
                 }
             })
             .on('pointerout', () => {
                 if (!isSelected) {
                    this.tweens.add({ targets: card, scale: 1.0, duration: 100, ease: 'Sine.easeInOut' });
                    bg.setStrokeStyle(2, strokeColor); 
                    card.setAlpha(0.8); 
                    nameTxt.setColor('#ccc');
                 }
             });

          if (isSelected) {
              this.tweens.add({ targets: card, scale: 1.05, duration: 800, yoyo: true, repeat: -1 });
          } else {
              card.setAlpha(0.8);
          }

          this.charContainer.add(card);
      });
  }

  selectCharacter(id: number) {
    if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
    if (this.state.gameMode !== 'local_pvp') {
        this.state.p1CharacterId = id;
    } else {
        if (this.selectionStep === 0) {
            this.state.p1CharacterId = id;
            this.selectionStep = 1;
        } else {
            this.state.p2CharacterId = id;
            this.selectionStep = 0; 
        }
    }
    this.updateUI();
  }
}
