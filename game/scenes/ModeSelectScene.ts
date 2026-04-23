import Phaser from 'phaser';
import { GameState } from '../types';

export default class ModeSelectScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super('ModeSelectScene');
  }

  create() {
    this.gameState = this.registry.get('gameState');

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

    // Background (Gradient)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f0c29, 0x302b63, 0x0f0c29, 0x24243e, 1);
    bg.fillRect(0, 0, 960, 540);

    // Animated grid or particles in background
    for (let i = 0; i < 20; i++) {
        const star = this.add.circle(Phaser.Math.Between(0, 960), Phaser.Math.Between(0, 540), Phaser.Math.FloatBetween(1, 3), 0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
        this.tweens.add({
            targets: star,
            y: star.y - 50,
            alpha: 0,
            duration: Phaser.Math.Between(2000, 5000),
            repeat: -1,
            yoyo: false,
            onRepeat: () => {
                star.y = 540;
                star.x = Phaser.Math.Between(0, 960);
                star.alpha = Phaser.Math.FloatBetween(0.1, 0.5);
            }
        });
    }
    
    // Title
    const title = this.add.text(480, 80, 'SELECIONE O MODO', {
      fontSize: '52px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 4, stroke: true, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
        targets: title,
        y: 75,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    const isMobile = !this.sys.game.device.os.desktop;

    const modes = [
      { text: '1 VS 1 (CPU)', mode: 'single', color: 0x3498db, desc: 'Lute contra a inteligência artificial' },
      isMobile 
        ? { text: 'TREINAMENTO', mode: 'training', color: 0x27ae60, desc: 'Pratique livremente contra CPU inativa' }
        : { text: '1 VS 1 (LOCAL)', mode: 'local_pvp', color: 0xe74c3c, desc: 'Jogue contra um amigo no mesmo teclado' },
      { text: 'ARCADE', mode: 'arcade', color: 0x9b59b6, desc: 'Enfrente uma série de oponentes' },
      { text: 'TORNEIO', mode: 'tournament', color: 0xf1c40f, desc: 'Chaveamento de 8 lutadores' }
    ];

    modes.forEach((m, index) => {
      const yPos = 180 + (index * 85);
      this.createBtn(480, yPos, m.text, m.desc, () => {
        this.gameState.gameMode = m.mode as any;
        
        if (m.mode === 'arcade') {
            this.gameState.arcadeRound = 1;
        }
        
        this.registry.set('gameState', this.gameState);
        this.scene.start('CharacterSelectScene');
      }, m.color);
    });

    // Back Button
    this.createBackBtn(100, 50, 'VOLTAR', () => {
      this.scene.start('MenuScene');
    });
  }

  createBtn(x: number, y: number, text: string, desc: string, onClick: () => void, color: number) {
    const container = this.add.container(x, y);
    
    // Button background with gradient/shadow effect
    const shadow = this.add.rectangle(4, 4, 400, 70, 0x000000, 0.5).setOrigin(0.5);
    const bg = this.add.rectangle(0, 0, 400, 70, color).setOrigin(0.5);
    const innerBg = this.add.rectangle(0, 0, 392, 62, 0x000000, 0.3).setOrigin(0.5); // Darker inner area
    
    const txt = this.add.text(0, -10, text, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    const descTxt = this.add.text(0, 15, desc, { fontSize: '14px', color: '#dddddd', fontStyle: 'italic' }).setOrigin(0.5);

    container.add([shadow, bg, innerBg, txt, descTxt]);
    
    // Hit area
    const hitArea = this.add.rectangle(0, 0, 400, 70, 0x000000, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      const hoverColor = ((Math.min(255, r + 40)) << 16) | ((Math.min(255, g + 40)) << 8) | (Math.min(255, b + 40));
      bg.setFillStyle(hoverColor);
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });
    hitArea.on('pointerout', () => {
      bg.setFillStyle(color);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    hitArea.on('pointerdown', () => {
      if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
      this.tweens.add({
        targets: container, scale: 0.95, duration: 50, yoyo: true,
        onComplete: onClick
      });
    });
  }

  createBackBtn(x: number, y: number, text: string, onClick: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 120, 40, 0x555555).setStrokeStyle(2, 0xffffff);
    const txt = this.add.text(0, 0, text, { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    container.add([bg, txt]);
    
    const hitArea = this.add.rectangle(0, 0, 120, 40, 0x000000, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      bg.setFillStyle(0x777777);
      this.tweens.add({ targets: container, scale: 1.1, duration: 100 });
    });
    hitArea.on('pointerout', () => {
      bg.setFillStyle(0x555555);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    hitArea.on('pointerdown', () => {
      if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
      this.tweens.add({
        targets: container, scale: 0.9, duration: 50, yoyo: true,
        onComplete: onClick
      });
    });
  }
}
