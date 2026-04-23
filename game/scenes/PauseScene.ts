import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
  declare sound: Phaser.Sound.NoAudioSoundManager | Phaser.Sound.HTML5AudioSoundManager | Phaser.Sound.WebAudioSoundManager;

  constructor() {
    super('PauseScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Semi-transparent background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Pause Text
    this.add.text(width / 2, height / 2 - 50, 'PAUSED', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Impact',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Resume Button
    const resumeBtn = this.add.text(width / 2, height / 2 + 30, 'RESUME GAME', {
      fontSize: '28px',
      color: '#2ecc71',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerover', () => resumeBtn.setColor('#58d68d'));
    resumeBtn.on('pointerout', () => resumeBtn.setColor('#2ecc71'));
    resumeBtn.on('pointerdown', () => {
      this.sound.play('sfx_select');
      this.scene.resume('BattleScene');
      this.scene.stop();
    });

    // Quit Instruction
    const quitBtn = this.add.text(width / 2, height / 2 + 100, 'QUIT TO MENU', {
      fontSize: '28px',
      color: '#e74c3c',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    quitBtn.on('pointerover', () => quitBtn.setColor('#ff7979'));
    quitBtn.on('pointerout', () => quitBtn.setColor('#e74c3c'));
    quitBtn.on('pointerdown', () => {
      this.sound.play('sfx_select');
      this.scene.stop('BattleScene');
      this.scene.start('MenuScene');
    });

    // Listen for ESC to resume
    const escListener = () => {
      this.scene.resume('BattleScene');
      this.scene.stop();
    };
    this.input.keyboard?.on('keydown-ESC', escListener);

    this.events.on('shutdown', () => {
      this.input.keyboard?.off('keydown-ESC', escListener);
    });
  }
}
