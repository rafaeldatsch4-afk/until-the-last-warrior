import Phaser from "phaser";

export interface AuraPreset {
  id: string;
  name: string;
  color: number; // -1 represents canonical default
  ringColor: number;
  hex: string;
  description: string;
  particleCount?: number;
}

export const AURA_PRESETS: AuraPreset[] = [
  {
    id: "default",
    name: "Padrão Canônico",
    color: -1,
    ringColor: -1,
    hex: "#94a3b8",
    description: "Aura clássica e exclusiva de cada guerreiro e transformação",
  },
  {
    id: "gold",
    name: "Super Saiyajin",
    color: 0xffd700,
    ringColor: 0xffff55,
    hex: "#ffd700",
    description: "Chama dourada lendária que eleva o poder ao extremo",
  },
  {
    id: "god_blue",
    name: "Ciano Divino",
    color: 0x00eaff,
    ringColor: 0x80ffff,
    hex: "#00eaff",
    description: "Ki divino refinado e sereno com vibração de alta energia",
  },
  {
    id: "ultra_ego",
    name: "Ultra Ego",
    color: 0x9b59b6,
    ringColor: 0xff44ff,
    hex: "#9b59b6",
    description: "Aura púrpura implacável movida pelo espírito de batalha",
  },
  {
    id: "crimson",
    name: "Fúria Carmesim",
    color: 0xff1e27,
    ringColor: 0xff7777,
    hex: "#ff1e27",
    description: "Chamas escarlates ardentes com sede de vitória",
  },
  {
    id: "emerald",
    name: "Esmeralda Plasma",
    color: 0x00ff66,
    ringColor: 0x88ffaa,
    hex: "#00ff66",
    description: "Energia bio-orgânica densa e radiação cósmica",
  },
  {
    id: "instinct",
    name: "Instinto Astral",
    color: 0xffffff,
    ringColor: 0x88eaff,
    hex: "#ffffff",
    description: "Brilho prateado límpido da mente e reflexo puros",
  },
  {
    id: "fire_orange",
    name: "Chama Solar",
    color: 0xff7b00,
    ringColor: 0xffbe33,
    hex: "#ff7b00",
    description: "Fogo solar ardente canalizado diretamente do núcleo",
  },
  {
    id: "neon_pink",
    name: "Super Rosé",
    color: 0xff0099,
    ringColor: 0xff66cc,
    hex: "#ff0099",
    description: "Aura rosa neon eletrizante com impacto penetrante",
  },
  {
    id: "dark_void",
    name: "Trevas Abissais",
    color: 0x8b0000,
    ringColor: 0x220000,
    hex: "#8b0000",
    description: "Manto negro e rubro condensado das sombras do abismo",
  },
  {
    id: "electric_blue",
    name: "Raio Elétrico",
    color: 0x2563eb,
    ringColor: 0x60a5fa,
    hex: "#2563eb",
    description: "Descargas elétricas e ondas de choque em alta frequência",
  },
  {
    id: "amethyst",
    name: "Ametista Cósmica",
    color: 0xc084fc,
    ringColor: 0xe879f9,
    hex: "#c084fc",
    description: "Pulso astral místico com partículas estelares",
  },
];

export interface AuraPreference {
  id: string;
  color: number;
  ringColor: number;
  mode: "p1" | "all";
}

const STORAGE_KEY_PREF = "utlw_aura_preference";
const STORAGE_KEY_COLOR = "utlw_aura_color";
const STORAGE_KEY_MODE = "utlw_aura_mode";

export class AuraManager {
  /**
   * Loads the current aura preference from localStorage and window.UTLW fallback.
   */
  static getPreference(): AuraPreference {
    let prefId = "default";
    let mode: "p1" | "all" = "p1";

    try {
      const storedPref = localStorage.getItem(STORAGE_KEY_PREF);
      if (storedPref) {
        const parsed = JSON.parse(storedPref);
        if (parsed && typeof parsed.id === "string") {
          prefId = parsed.id;
          if (parsed.mode === "all" || parsed.mode === "p1") {
            mode = parsed.mode;
          }
        }
      } else {
        const legacyColor = localStorage.getItem(STORAGE_KEY_COLOR);
        if (legacyColor) {
          prefId = legacyColor;
        }
        const legacyMode = localStorage.getItem(STORAGE_KEY_MODE);
        if (legacyMode === "all" || legacyMode === "p1") {
          mode = legacyMode;
        }
      }
    } catch (e) {
      console.warn("AuraManager: failed to read localStorage", e);
    }

    // Fallback to in-game state if present
    if (prefId === "default" && typeof window !== "undefined" && window.UTLW?.state?.settings?.auraColor) {
      const stateAura = String(window.UTLW.state.settings.auraColor);
      if (stateAura) prefId = stateAura;
      if (window.UTLW.state.settings.auraMode) {
        mode = window.UTLW.state.settings.auraMode;
      }
    }

    const preset = AURA_PRESETS.find((p) => p.id === prefId) || AURA_PRESETS[0];

    return {
      id: preset.id,
      color: preset.color,
      ringColor: preset.ringColor,
      mode,
    };
  }

  /**
   * Saves the aura preference to localStorage and the active GameState.
   */
  static setPreference(presetId: string, mode: "p1" | "all" = "p1"): AuraPreference {
    const preset = AURA_PRESETS.find((p) => p.id === presetId) || AURA_PRESETS[0];
    const pref: AuraPreference = {
      id: preset.id,
      color: preset.color,
      ringColor: preset.ringColor,
      mode,
    };

    try {
      localStorage.setItem(STORAGE_KEY_PREF, JSON.stringify(pref));
      localStorage.setItem(STORAGE_KEY_COLOR, preset.id);
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch (e) {
      console.error("AuraManager: failed to write to localStorage", e);
    }

    if (typeof window !== "undefined" && window.UTLW?.state) {
      if (!window.UTLW.state.settings) {
        window.UTLW.state.settings = {};
      }
      window.UTLW.state.settings.auraColor = preset.id;
      window.UTLW.state.settings.auraMode = mode;
      window.UTLW.save();
    }

    return pref;
  }

  /**
   * Determines the effective aura and ring colors for a fighter in battle.
   */
  static getBattleAura(
    characterKey: string,
    isPlayer: boolean,
    transformLevel: number,
    baseSpecialColor?: number,
  ): { auraColor: number; ringColor: number; isCustom: boolean } {
    const pref = this.getPreference();

    // Check if custom aura applies to this fighter
    const applies = pref.id !== "default" && (isPlayer || pref.mode === "all");

    if (applies && pref.color !== -1) {
      return {
        auraColor: pref.color,
        ringColor: pref.ringColor !== -1 ? pref.ringColor : pref.color,
        isCustom: true,
      };
    }

    // Default canonical character logic
    let auraColor = baseSpecialColor || (isPlayer ? 0x3498db : 0xe74c3c);
    let ringColor = auraColor;

    if (transformLevel > 0) {
      const isUI = characterKey === "goku" && transformLevel === 2;
      const isUE = characterKey === "vegeta" && transformLevel === 2;
      const isSageMode = characterKey === "naruto" && transformLevel === 1;
      const isKuramaMode = characterKey === "naruto" && transformLevel === 2;

      auraColor = 0xffd700; // SSJ Gold
      ringColor = 0xffff00;

      if (isUI) {
        auraColor = 0xffffff;
        ringColor = 0x00ffff;
      } else if (isUE) {
        auraColor = 0x9b59b6;
        ringColor = 0xff00ff;
      } else if (characterKey === "gohan" && transformLevel === 2) {
        auraColor = 0x8a2be2;
        ringColor = 0xff00ff;
      } else if (characterKey === "gohan" && transformLevel === 1) {
        auraColor = 0xffd700;
        ringColor = 0xffff00;
      } else if (characterKey === "piccolo") {
        auraColor = 0xff8800;
        ringColor = 0xffaa00;
      } else if (characterKey === "cell") {
        auraColor = 0x00ff00;
        ringColor = 0x00aa00;
      } else if (characterKey === "optimus") {
        auraColor = 0x3498db;
        ringColor = 0x2980b9;
      } else if (characterKey === "minipekka") {
        auraColor = 0xff0000;
        ringColor = 0xaa0000;
      } else if (characterKey === "cyberninja") {
        auraColor = 0x00eaff;
        ringColor = 0x0088ff;
      } else if (isSageMode) {
        auraColor = 0xffaa00;
        ringColor = 0xff4400;
      } else if (isKuramaMode) {
        auraColor = 0xffff00;
        ringColor = 0xffaa00;
      } else if (characterKey === "itachi") {
        auraColor = 0xff4500;
        ringColor = 0xffd700;
      } else if (characterKey === "thukuna") {
        auraColor = 0x8b0000;
        ringColor = 0x000000;
      } else if (characterKey === "gojo") {
        auraColor = 0x00ffff;
        ringColor = 0xffffff;
      } else if (characterKey === "saitama") {
        auraColor = 0xffffff;
        ringColor = 0xff0000;
      }
    }

    return { auraColor, ringColor, isCustom: false };
  }
}
