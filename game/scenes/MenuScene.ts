
import Phaser from 'phaser';
import { GameState } from '../types';

export default class MenuScene extends Phaser.Scene {
  declare registry: Phaser.Data.DataManager;
  declare cameras: Phaser.Cameras.Scene2D.CameraManager;
  declare sound: Phaser.Sound.NoAudioSoundManager | Phaser.Sound.HTML5AudioSoundManager | Phaser.Sound.WebAudioSoundManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare tweens: Phaser.Tweens.TweenManager;
  declare cache: Phaser.Cache.CacheManager;

  private state!: GameState;

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

    // Title
    const title = this.add.text(width / 2, 120, 'UNTIL THE LAST WARRIOR', {
      fontSize: '64px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
      fontFamily: 'Impact',
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 4, stroke: true, fill: true }
    }).setOrigin(0.5);
    
    this.tweens.add({
        targets: title,
        y: 110,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

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
  }

  resumeAudioContext() {
      if (this.sound && this.sound instanceof Phaser.Sound.WebAudioSoundManager && this.sound.context.state === 'suspended') {
          this.sound.context.resume();
      }
  }

  createMenuButton(x: number, y: number, text: string, callback: () => void, color: number) {
      const container = this.add.container(x, y);
      
      const shadow = this.add.rectangle(4, 4, 320, 60, 0x000000, 0.5).setOrigin(0.5);
      const bg = this.add.rectangle(0, 0, 320, 60, 0x1f2940).setStrokeStyle(3, 0x3a4866).setOrigin(0.5);
      const innerBg = this.add.rectangle(0, 0, 312, 52, 0x000000, 0.2).setOrigin(0.5);
      
      const txt = this.add.text(0, 0, text, { 
          fontSize: '28px', 
          fontStyle: 'bold',
          fontFamily: 'Impact',
          letterSpacing: 2,
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4
      }).setOrigin(0.5);
      
      container.add([shadow, bg, innerBg, txt]);
      
      const hitArea = this.add.rectangle(0, 0, 320, 60, 0x000000, 0).setInteractive({ useHandCursor: true });
      container.add(hitArea);
      
      hitArea.on('pointerover', () => { 
          bg.setFillStyle(color); 
          bg.setStrokeStyle(3, 0xffffff);
          this.tweens.add({ targets: container, scale: 1.05, duration: 100 }); 
      })
      .on('pointerout', () => { 
          bg.setFillStyle(0x1f2940); 
          bg.setStrokeStyle(3, 0x3a4866);
          this.tweens.add({ targets: container, scale: 1, duration: 100 }); 
      })
      .on('pointerdown', () => {
          this.tweens.add({ targets: container, scale: 0.95, yoyo: true, duration: 50, onComplete: callback });
      });
  }
}
