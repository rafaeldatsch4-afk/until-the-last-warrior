import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import PreloadScene from "./scenes/PreloadScene";
import MenuScene from "./scenes/MenuScene";
import SettingsScene from "./scenes/SettingsScene";
import PauseScene from "./scenes/PauseScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: "game-container",
  backgroundColor: "#071026",
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    SettingsScene,
    PauseScene,
  ],

  scale: {
    // NÃO MUDE ISSO PARA FIT: FIT deixa barras pretas em celulares que não são 16:9.
    // NÃO MUDE ISSO PARA RESIZE: RESIZE muda a resolução interna dinamicamente e
    // quebra todo o posicionamento de botões em BattleInput.ts (bug já confirmado antes).
    // ENVELOP preenche 100% da tela SEM mudar a resolução interna fixa (960x540),
    // por isso é a única opção segura aqui. Se precisar mexer nisso, avise que essa
    // decisão foi testada e revertida 2 vezes antes de chegar em ENVELOP.
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
    // Renderiza em 2x (1920x1080 físico) para nitidez em telas HD, mantendo a
    // resolução lógica em 960x540 (todos os cálculos de posição continuam iguais).
    zoom: 2,
  },
  render: {
    pixelArt: true,
    antialias: false,
    antialiasGL: false,
    roundPixels: true,
    powerPreference: "high-performance",
    batchSize: 4096,
  },
  fps: {
    target: 60,
    min: 30,
    forceSetTimeOut: false,
  },
  input: {
    activePointers: 5,
  },
};
