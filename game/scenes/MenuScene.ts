
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
    const titleContainer = this.add.container(width - 340, height / 2 - 20); // Logo on the right side
    
    // Add postFX to main camera in Menu
    if (this.cameras.main.postFX) {
        this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
        const cm = this.cameras.main.postFX.addColorMatrix();
    }
    
    const logoImg = this.add.image(0, 0, 'utlw_logo');
    logoImg.setScale(0.35); // Sharp rendering representing the game title and warrior
    logoImg.setAlpha(0);
    this.tweens.add({ targets: logoImg, alpha: 1, duration: 1500, ease: 'Power2' });
    
    const subtitle = this.add.text(0, 190, 'A BATALHA FINAL COMEÇA AQUI', {
      fontSize: '20px',
      color: '#ffd54a',
      fontStyle: 'bold',
      letterSpacing: 4,
      fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif",
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { color: '#000000', blur: 4, fill: true },
      resolution: 2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 1500, delay: 500, ease: 'Power2' });

    titleContainer.add([logoImg, subtitle]);
    
    this.tweens.add({
        targets: titleContainer,
        y: titleContainer.y - 15,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Coins Display (Top Right)
    const coinDisplay = this.add.container(width - 150, 36);
    
    // Slanted polygon for coins background
    const polyBg = this.add.polygon(0, 0, [
      0, 36,
      140, 36,
      160, 0,
      20, 0
    ], 0x111625, 0.8).setOrigin(0.5).setStrokeStyle(2, 0xf1c40f);

    const coinIcon = this.add.circle(-50, 0, 14, 0xf1c40f).setStrokeStyle(2, 0xffffff);
    const coinSymbol = this.add.text(-50, 0, '$', { fontSize: '18px', color:'#000', fontStyle:'bold', fontFamily: "system-ui, -apple-system, 'Roboto', sans-serif", resolution: 2 }).setOrigin(0.5);
    
    this.coinText = this.add.text(-30, 0, `${this.state.coins || 0}`, {
        fontSize: '24px',
        color: '#f1c40f',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
        resolution: 2
    }).setOrigin(0, 0.5);
    coinDisplay.add([polyBg, coinIcon, coinSymbol, this.coinText]);

    // Botões Alinhados à Esquerda (Staggered Menu)
    const startX = 20;
    const startY = 180;
    const spacing = 60;

    this.createMenuButton(startX, startY, 'COMEÇAR', () => {
        this.resumeAudioContext();
        if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
        this.scene.start('ModeSelectScene');
    }, 0xe74c3c, 0);

    this.createMenuButton(startX + 20, startY + spacing, 'LOJA DE GUERREIROS', () => {
        this.resumeAudioContext();
        if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
        this.scene.start('StoreScene');
    }, 0x3498db, 100);

    this.createMenuButton(startX + 40, startY + spacing * 2, 'DESAFIOS DO DIA', () => {
        this.resumeAudioContext();
        if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
        this.showChallengesPopup();
    }, 0xf1c40f, 200);

    this.createMenuButton(startX + 60, startY + spacing * 3, 'CONFIGURAÇÕES', () => {
        this.resumeAudioContext();
        if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
        this.scene.start('SettingsScene');
    }, 0x95a5a6, 300);
  }

  async showChallengesPopup() {
      const { width, height } = this.cameras.main;
      
      const popupOverlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7).setInteractive().setDepth(100);
      const popupCard = this.add.container(width/2, height/2).setDepth(100);
      
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

  createMenuButton(x: number, y: number, text: string, callback: () => void, color: number, delayAnim: number = 0) {
      const container = this.add.container(x - 500, y); // Starts offscreen
      
      this.tweens.add({ targets: container, x: x, duration: 500, ease: 'Back.easeOut', delay: delayAnim });
      
      const width = 280;
      const height = 48;

      // Draw slanted polygon geometry for the menu button background
      const d = 16; // Diagonal offset
      const points = [
          0, height,
          width - d, height,
          width, 0,
          d, 0
      ];
      
      const polyShadow = this.add.polygon(6, 6, points, 0x000000, 0.5).setOrigin(0, 0);
      const hoverGlow = this.add.polygon(0, 0, points, color, 0.8).setOrigin(0, 0).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
      const polyMain = this.add.polygon(0, 0, points, 0x111625).setOrigin(0, 0).setStrokeStyle(3, color);
      
      const txt = this.add.text(45, height / 2 - 2, text, { 
          fontSize: '18px', 
          fontStyle: 'italic bold',
          fontFamily: "system-ui, -apple-system, 'Roboto', 'Arial Black', sans-serif",
          letterSpacing: 2,
          color: '#e2e8f0',
          stroke: '#000000',
          strokeThickness: 4,
          shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 0, fill: true },
          resolution: 2
      }).setOrigin(0, 0.5);
      
      // Right side arrow / accent
      const accent = this.add.polygon(width - d - 10, height / 2, [0, 10, 8, 0, 0, -10, -4, -10, 4, 0, -4, 10], color, 1).setOrigin(0, 0).setAlpha(0.6);

      
      container.add([polyShadow, hoverGlow, polyMain, txt, accent]);
      
      // Interactive hit area (we approximate with a rectangle covering the polygon)
      const hitArea = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });
      container.add(hitArea);
      
      hitArea.on('pointerover', () => { 
          polyMain.setFillStyle(color); 
          polyMain.setStrokeStyle(3, 0xffffff);
          txt.setColor('#ffffff');
          accent.setFillStyle(0xffffff).setAlpha(1);
          this.tweens.add({ targets: hoverGlow, alpha: 1, duration: 150 });
          this.tweens.add({ targets: container, x: x + 20, duration: 250, ease: 'Power2' }); 
      })
      .on('pointerout', () => { 
          polyMain.setFillStyle(0x111625); 
          polyMain.setStrokeStyle(3, color);
          txt.setColor('#e2e8f0');
          accent.setFillStyle(color).setAlpha(0.6);
          this.tweens.add({ targets: hoverGlow, alpha: 0, duration: 150 });
          this.tweens.add({ targets: container, x: x, duration: 250, ease: 'Power2' }); 
      })
      .on('pointerdown', () => {
          this.tweens.add({ targets: container, scale: 0.95, yoyo: true, duration: 50, onComplete: callback });
      });
  }
}

