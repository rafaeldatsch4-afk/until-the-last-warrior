import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import PreloadScene from './scenes/PreloadScene';
import MenuScene from './scenes/MenuScene';
import ModeSelectScene from './scenes/ModeSelectScene';
import CharacterSelectScene from './scenes/CharacterSelectScene';
import TournamentScene from './scenes/TournamentScene';
import BattleScene from './scenes/BattleScene';
import StoreScene from './scenes/StoreScene';
import SettingsScene from './scenes/SettingsScene';
import PauseScene from './scenes/PauseScene';
import MultiplayerLobbyScene from './scenes/MultiplayerLobbyScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-container',
  backgroundColor: '#071026',
  pixelArt: true,
  antialias: false,
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    ModeSelectScene,
    CharacterSelectScene,
    TournamentScene,
    BattleScene,
    StoreScene,
    SettingsScene,
    PauseScene,
    MultiplayerLobbyScene
  ],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  fps: {
    target: 60,
  },
  input: {
    activePointers: 5
  }
};