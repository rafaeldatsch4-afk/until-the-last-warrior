import Phaser from 'phaser';

export interface CharacterData {
  id: number;
  key: string;
  name: string;
  price: number;
  unlocked: boolean;
  maxHp: number;
  transformAvailable: boolean;
  sprite: string;
  frameWidth: number;
  frameHeight: number;
  specialName: string;
  superName: string;
  specialColor: number;
  baseKey?: string;
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
  difficulty: number; // 0: Easy, 1: Normal, 2: Hard
  gameMode: 'single' | 'local_pvp' | 'arcade' | 'tournament' | 'training' | 'online_pvp'; 
  selectedCharacterId: number; // Legacy/Default P1
  p1CharacterId: number;
  p2CharacterId: number;
  characters: CharacterData[];
  
  // Arcade State
  arcadeRound?: number;
  
  // Tournament State
  tournamentRounds?: TournamentRound[];
  tournamentCurrentRoundIndex?: number;
  tournamentPlayerCharId?: number;
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