
import Phaser from 'phaser';
import { GameState } from '../types';
import { DailyChallenges, CHALLENGES } from '../systems/DailyChallenges';

export default class MenuScene extends Phaser.Scene {
  declare registry: Phaser.Data.DataManager;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare sound: Phaser.Sound.NoAudioSoundManager | Phaser.Sound.HTML5AudioSoundManager | Phaser.Sound.WebAudioSoundManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare tweens: Phaser.Tweens.TweenManager;
  declare cache: Phaser.Cache.CacheManager;

  private state!: GameState;
  private coinText!: Phaser.GameObjects.Text;

  constructor() {
    super('MenuScene');
  }

  create() {
    window.dispatchEvent(new CustomEvent('scene-changed', { detail: 'MenuScene' }));

    this.events.on('shutdown', () => {
      window.dispatchEvent(new CustomEvent('scene-changed', { detail: null }));
    });

    this.state = this.registry.get('gameState') as GameState;
    const { width, height } = this.cameras.main;
    
    // Unlock Audio Context (Browser Policy)
    this.sound.pauseOnBlur = false;
    
    // Parar música de batalha e iniciar a do menu
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

    // Background Layers
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0515, 0x000000, 0x1f0f38, 0x050510, 1);
    bg.fillRect(0, 0, width, height);
    
    // Grid pattern for retro feel
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x3498db, 0.1);
    for (let x = 0; x < width; x += 40) grid.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) grid.moveTo(0, y).lineTo(width, y);
    grid.strokePath();
    
    this.add.image(width / 2, height / 2, 'arena').setAlpha(0.2).setBlendMode(Phaser.BlendModes.SCREEN);

    // Glowing Particles (Sparks)
    for (let i = 0; i < 40; i++) {
        const size = Phaser.Math.FloatBetween(1, 4);
        const p = this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), size, 0xf1c40f, Phaser.Math.FloatBetween(0.3, 0.8));
        p.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
            targets: p,
            y: p.y - Phaser.Math.Between(100, 250),
            x: p.x + Phaser.Math.Between(-30, 30),
            alpha: 0,
            scale: 0,
            duration: Phaser.Math.Between(2000, 5000),
            ease: 'Sine.inOut',
            repeat: -1,
            onRepeat: () => {
                p.y = height + 10;
                p.x = Phaser.Math.Between(0, width);
                p.scale = 1;
                p.alpha = Phaser.Math.FloatBetween(0.3, 0.8);
            }
        });
    }

    // Title Section
    const titleContainer = this.add.container(width / 2, 130);
    
    // Add postFX to main camera in Menu
    if (this.cameras.main.postFX) {
        this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
        const cm = this.cameras.main.postFX.addColorMatrix();
        // saturation removed
    }
    
    const titleShadow = this.add.text(0, 5, 'UNTIL THE LAST WARRIOR', {
      fontSize: '70px',
      color: '#000000',
      fontStyle: 'bold',
      fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
      shadow: { offsetX: 0, offsetY: 0, blur: 20, color: '#f1c40f' },
      resolution: 2
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(0, 0, 'UNTIL THE LAST WARRIOR', {
      fontSize: '70px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#f39c12',
      strokeThickness: 10,
      fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
      resolution: 2
    }).setOrigin(0.5);
    
    const subtitle = this.add.text(0, 50, 'A BATALHA FINAL COMEÇA AQUI', {
      fontSize: '20px',
      color: '#e0e0e0',
      fontStyle: 'bold',
      letterSpacing: 6,
      fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      resolution: 2
    }).setOrigin(0.5);

    titleContainer.add([titleShadow, title, subtitle]);
    
    this.tweens.add({
        targets: titleContainer,
        y: 120,
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Coins Display
    const coinDisplay = this.add.container(width - 120, 40);
    const coinBg = this.add.rectangle(0, 0, 160, 40, 0x000000, 0.6).setStrokeStyle(2, 0xf1c40f).setOrigin(0.5);
    const coinIcon = this.add.circle(-55, 0, 12, 0xf1c40f).setStrokeStyle(2, 0xffffff);
    this.coinText = this.add.text(-35, 0, `${this.state.coins || 0}`, {
        fontSize: '22px',
        color: '#f1c40f',
        fontStyle: 'bold',
        fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2
    }).setOrigin(0, 0.5);
    coinDisplay.add([coinBg, coinIcon, this.add.text(-55, 0, '$', { fontSize: '14px', color:'#000', fontStyle:'bold', fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif", resolution: 2 }).setOrigin(0.5), this.coinText]);

    // Botões Centralizados
    const buttonY = 280;
    const spacing = 80;

    this.createMenuButton(width/2, buttonY, 'COMEÇAR', () => {
        this.resumeAudioContext();
        if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
        this.scene.start('ModeSelectScene');
    }, 0xe74c3c);

    this.createMenuButton(width/2, buttonY + spacing, 'LOJA', () => {
        this.resumeAudioContext();
        if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
        this.scene.start('StoreScene');
    }, 0x3498db);

    this.createMenuButton(width/2, buttonY + spacing * 2, 'CONFIGURAÇÕES', () => {
        this.resumeAudioContext();
        if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
        this.scene.start('SettingsScene');
    }, 0x95a5a6);

    this.createDailyChallengesCard();
  }

  createDailyChallengesCard() {
      const { height } = this.cameras.main;
      const cardContainer = this.add.container(140, height - 60);

      const bg = this.add.rectangle(0, 0, 220, 60, 0x111625, 0.8).setStrokeStyle(2, 0xf1c40f).setOrigin(0.5);
      const text = this.add.text(0, 0, 'Desafios do Dia 🏆', {
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#ffffff',
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
          resolution: 2
      }).setOrigin(0.5);

      cardContainer.add([bg, text]);

      // Hover Effect
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
          bg.setFillStyle(0xf1c40f);
          text.setColor('#000000');
          this.tweens.add({ targets: cardContainer, scale: 1.05, duration: 100 });
      });
      bg.on('pointerout', () => {
          bg.setFillStyle(0x111625, 0.8);
          text.setColor('#ffffff');
          this.tweens.add({ targets: cardContainer, scale: 1, duration: 100 });
      });

      bg.on('pointerdown', () => {
          this.resumeAudioContext();
          if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
          this.showChallengesPopup();
      });
  }

  async showChallengesPopup() {
      const { width, height } = this.cameras.main;
      
      const popupOverlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7).setInteractive();
      const popupCard = this.add.container(width/2, height/2);
      
      const popupBg = this.add.rectangle(0, 0, 500, 520, 0x111625).setStrokeStyle(4, 0xf1c40f).setOrigin(0.5);
      const popupTitle = this.add.text(0, -225, 'DESAFIOS DO DIA', {
          fontSize: '28px',
          fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
          color: '#f1c40f',
          resolution: 2
      }).setOrigin(0.5);

      const closeBtn = this.add.text(220, -235, 'X', { fontSize: '24px', color: '#ff0000', fontStyle: 'bold', fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif", resolution: 2 })
        .setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          popupOverlay.destroy();
          popupCard.destroy();
        });

      popupCard.add([popupBg, popupTitle, closeBtn]);

      // Daily Streak Section
      const streakInfo = await DailyChallenges.getStreakInfo();
      const currentToday = DailyChallenges.getTodayDateStr();
      const hasClaimedStreakToday = (streakInfo.lastClaimedDate === currentToday);
      const currentStreakCoins = DailyChallenges.getStreakReward(streakInfo.currentStreak);

      const streakBg = this.add.rectangle(0, -145, 440, 90, 0x0c0f1d).setStrokeStyle(2, 0xe74c3c).setOrigin(0.5);
      const streakTitleText = this.add.text(-200, -175, `Sequência Diária: ${streakInfo.currentStreak} Dias 🔥`, {
          fontSize: '20px',
          fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
          color: '#e74c3c',
          resolution: 2
      });
      const streakDetailText = this.add.text(-200, -145, `Recompensa de Hoje: ${currentStreakCoins} 🪙\nBônus de login diário consecutivo ativo!`, {
          fontSize: '13px',
          color: '#ffffff',
          fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
          resolution: 2
      });

      popupCard.add([streakBg, streakTitleText, streakDetailText]);

      if (hasClaimedStreakToday) {
          const claimedStreakText = this.add.text(190, -150, 'CONCLUÍDO ✓', {
              fontSize: '16px',
              color: '#2ecc71',
              fontStyle: 'bold'
          }).setOrigin(1, 0.5);
          popupCard.add(claimedStreakText);
      } else {
          const claimStreakBox = this.add.rectangle(140, -150, 100, 32, 0x2ecc71).setInteractive({ useHandCursor: true });
          const claimStreakTxt = this.add.text(140, -150, 'COLETAR', {
              fontSize: '13px',
              color: '#ffffff',
              fontStyle: 'bold'
          }).setOrigin(0.5);

          claimStreakBox.on('pointerdown', async () => {
              const res = await DailyChallenges.claimStreakReward();
              if (res.success) {
                  claimStreakBox.destroy();
                  claimStreakTxt.destroy();
                  const claimedStreakText = this.add.text(190, -150, 'COLETADO ✓', {
                      fontSize: '16px',
                      color: '#2ecc71',
                      fontStyle: 'bold'
                  }).setOrigin(1, 0.5);
                  popupCard.add(claimedStreakText);
                  if (this.coinText) this.coinText.setText(`${window.UTLW.state.coins}`);
              }
          });
          popupCard.add([claimStreakBox, claimStreakTxt]);
      }

      // Challenges Progress Section
      const progress = await DailyChallenges.getProgress();
      
      let claimableCount = 0;
      CHALLENGES.forEach(challenge => {
          const p = progress[challenge.id] || { current: 0, claimed: false };
          if (p.current >= challenge.target && !p.claimed) claimableCount++;
      });
      
      let startY = -40;
      CHALLENGES.forEach(challenge => {
          const p = progress[challenge.id] || { current: 0, claimed: false };
          
          const chCard = this.add.rectangle(0, startY, 440, 64, 0x000000, 0.5).setStrokeStyle(1, 0x555555);
          const chTitle = this.add.text(-200, startY - 14, challenge.title, { fontSize: '16px', color: '#ffffff', fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif", resolution: 2 });
          const chReward = this.add.text(-200, startY + 10, `Recompensa: ${challenge.reward} 🪙`, { fontSize: '13px', color: '#f1c40f', fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif", resolution: 2 });
          
          const chProgressText = this.add.text(120, startY - 14, `${Math.min(p.current, challenge.target)} / ${challenge.target}`, {
              fontSize: '16px', 
              fontStyle: 'bold',
              color: p.current >= challenge.target ? '#2ecc71' : '#ffffff',
              fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
              resolution: 2
          }).setOrigin(1, 0);

          popupCard.add([chCard, chTitle, chReward, chProgressText]);

          if (p.claimed) {
               const claimedText = this.add.text(190, startY + 5, 'COLETADO', { fontSize: '15px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(1, 0);
               popupCard.add(claimedText);
          } else if (p.current >= challenge.target) {
               const claimBtnBox = this.add.rectangle(150, startY + 10, 100, 28, 0xf1c40f).setInteractive({ useHandCursor: true });
               const claimBtnTxt = this.add.text(150, startY + 10, 'COLETAR', { fontSize: '13px', color: '#000000', fontStyle: 'bold' }).setOrigin(0.5);
               
               claimBtnBox.on('pointerdown', async () => {
                   if (await DailyChallenges.claimReward(challenge.id)) {
                       claimBtnBox.destroy();
                       claimBtnTxt.destroy();
                       const claimedText = this.add.text(190, startY + 5, 'COLETADO', { fontSize: '15px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(1, 0);
                       popupCard.add(claimedText);
                       if (this.coinText) this.coinText.setText(`${window.UTLW.state.coins}`);
                       
                       // Refresh if collect all was visible
                       if (claimableCount > 1) {
                         popupOverlay.destroy();
                         popupCard.destroy();
                         this.showChallengesPopup();
                       }
                   }
               });
               popupCard.add([claimBtnBox, claimBtnTxt]);
          }
          
          startY += 78;
      });

      if (claimableCount > 1) {
          const collectAllBox = this.add.rectangle(0, 215, 180, 36, 0x2ecc71).setInteractive({ useHandCursor: true });
          const collectAllTxt = this.add.text(0, 215, 'COLETAR TUDO', { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
          
          collectAllBox.on('pointerdown', async () => {
              const total = await DailyChallenges.claimAllRewards();
              if (total > 0) {
                  if (this.coinText) this.coinText.setText(`${window.UTLW.state.coins}`);
                  popupOverlay.destroy();
                  popupCard.destroy();
                  this.showChallengesPopup();
              }
          });
          popupCard.add([collectAllBox, collectAllTxt]);
      }

      popupCard.setScale(0.8).setAlpha(0);
      this.tweens.add({ targets: popupCard, scale: 1, alpha: 1, duration: 200, ease: 'Back.easeOut' });
  }

  resumeAudioContext() {
      if (this.sound && this.sound instanceof Phaser.Sound.WebAudioSoundManager && this.sound.context.state === 'suspended') {
          this.sound.context.resume();
      }
  }

  createMenuButton(x: number, y: number, text: string, callback: () => void, color: number) {
      const container = this.add.container(x, y);
      
      const width = 340;
      const height = 65;

      const shadow = this.add.rectangle(6, 6, width, height, 0x000000, 0.6).setOrigin(0.5);
      
      const hoverGlow = this.add.rectangle(0, 0, width + 10, height + 10, color, 0.5).setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
      const bg = this.add.rectangle(0, 0, width, height, 0x111625).setStrokeStyle(4, color).setOrigin(0.5);
      const innerBg = this.add.rectangle(0, 0, width - 8, height - 8, 0x000000, 0.5).setOrigin(0.5);
      
      const txt = this.add.text(0, 0, text, { 
          fontSize: '30px', 
          fontStyle: 'italic bold',
          fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
          letterSpacing: 4,
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 5,
          shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 0, fill: true },
          resolution: 2
      }).setOrigin(0.5);
      
      container.add([hoverGlow, shadow, bg, innerBg, txt]);
      
      const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });
      container.add(hitArea);
      
      hitArea.on('pointerover', () => { 
          bg.setFillStyle(color); 
          bg.setStrokeStyle(4, 0xffffff);
          this.tweens.add({ targets: hoverGlow, alpha: 1, duration: 150 });
          this.tweens.add({ targets: container, scale: 1.08, duration: 150, ease: 'Back.easeOut' }); 
      })
      .on('pointerout', () => { 
          bg.setFillStyle(0x111625); 
          bg.setStrokeStyle(4, color);
          this.tweens.add({ targets: hoverGlow, alpha: 0, duration: 150 });
          this.tweens.add({ targets: container, scale: 1, duration: 150, ease: 'Power2' }); 
      })
      .on('pointerdown', () => {
          this.tweens.add({ targets: container, scale: 0.95, yoyo: true, duration: 50, onComplete: callback });
      });
  }
}

