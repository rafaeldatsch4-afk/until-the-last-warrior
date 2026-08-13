import Phaser from "phaser";

export interface CharacterData {
  id: number;
  key: string;
  name: string;
  description?: string;
  price: number;
  unlocked: boolean;
  maxHp: number;
  strength?: number;
  speed?: number;
  transformAvailable: boolean;
  sprite: string;
  frameWidth: number;
  frameHeight: number;
  specialName: string;
  superName: string;
  specialColor: number;
  baseKey?: string;
  form?: number;
  customData?: {
    gi1: number;
    gi2: number;
    hair: number;
    skin: number;
    sp1_id?: string;
    sp2_id?: string;
    part_head?: string;
    part_torso?: string;
    part_legs?: string;
    part_feet?: string;
    part_accessory?: string;
    color_torso_1?: number;
    color_torso_2?: number;
    color_legs_1?: number;
    color_legs_2?: number;
    color_feet_1?: number;
    color_feet_2?: number;
    color_head_1?: number;
    color_head_2?: number;
    color_acc_1?: number;
  };
}

export interface TournamentMatch {
  p1: number | null;
  p2: number | null;
  winner: number | null;
}

export interface TournamentRound {
  matches: TournamentMatch[];
}

export interface GameState {
  coins: number;
  elo?: number;
  difficulty: number; // 0: Easy, 1: Normal, 2: Hard
  gameMode:
    | "story"
    | "single"
    | "local_pvp"
    | "arcade"
    | "tournament"
    | "training"
    | "online_pvp"
    | "ranked_pvp";
  selectedCharacterId: number; // Legacy/Default P1
  p1CharacterId: number;
  p2CharacterId: number;
  selectedArena?: string;
  characters: CharacterData[];

  // Arcade State
  arcadeRound?: number;

  // Tournament State
  tournamentRounds?: TournamentRound[];
  tournamentCurrentRoundIndex?: number;
  tournamentPlayerCharId?: number;
  storyState?: {
    level: number;
    exp: number;
    statPoints: number;
    stats: {
      attack: number;
      defense: number;
      ki: number;
      speed: number;
      health: number;
    };
    stage: number;
    customCharacter?: CharacterData;
  };
  stats?: {
    totalWins: number;
    winStreak: number;
    maxWinStreak: number;
    tournamentsWon: number;
    arcadeClears: number;
    charactersUnlocked: number;
  };
  unlockedTitles?: string[];
  equippedTitle?: string;
  settings?: {
    lowPerformanceMode?: boolean;
    hudConfig?: {
      dpadPos?: { x: number, y: number };
      dpadScale?: number;
      buttonsPos?: { x: number, y: number };
      buttonsScale?: number;
      opacity?: number;
    }
  };
}

declare global {
  interface Window {
    UTLW: {
      game?: Phaser.Game;
      state: GameState;
      save: () => void;
    };
  }
}
