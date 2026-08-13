export interface UniverseInfo {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  lore: string;
  primaryColor: number;
  secondaryColor: number;
  textColor: string;
  ambientHex: string;
  particleColor: number;
  characterKeys: string[];
  bannerQuote: string;
}

export const UNIVERSES: UniverseInfo[] = [
  {
    id: "multiverse",
    name: "MULTIVERSO NEXUS",
    badge: "🌌 MULTIVERSO",
    subtitle: "Convergência Dimensional",
    lore: "Guerreiros de todas as realidades colidem no torneio supremo.",
    primaryColor: 0x9b59b6,
    secondaryColor: 0x3498db,
    textColor: "#c084fc",
    ambientHex: "#9b59b6",
    particleColor: 0xe0e7ff,
    characterKeys: [], // all
    bannerQuote: "O destino de todas as realidades em confronto!",
  },
  {
    id: "dragonball",
    name: "UNIVERSO SAIYAJIN",
    badge: "🐉 DRAGON BALL",
    subtitle: "Guerreiros Z & Ki Divino",
    lore: "Batalhas titânicas de artes marciais, transformações e poderes cósmicos.",
    primaryColor: 0xf39c12,
    secondaryColor: 0xe74c3c,
    textColor: "#fbbf24",
    ambientHex: "#f39c12",
    particleColor: 0xffd700,
    characterKeys: ["goku", "vegeta", "gohan", "piccolo", "cell"],
    bannerQuote: "Supere todos os limites com o poder do Ki!",
  },
  {
    id: "naruto",
    name: "MUNDO SHINOBI",
    badge: "🍥 SHINOBI",
    subtitle: "Chakra, Ninjutsu & Clãs Lendários",
    lore: "Técnicas milenares, Genjutsus sombrios e o despertar do poder ocular.",
    primaryColor: 0xe67e22,
    secondaryColor: 0x2980b9,
    textColor: "#fb923c",
    ambientHex: "#e67e22",
    particleColor: 0x38bdf8,
    characterKeys: ["naruto", "madara", "obito", "itachi"],
    bannerQuote: "O caminho ninja guiado pela vontade do fogo!",
  },
  {
    id: "jujutsu",
    name: "DOMÍNIO DAS MALDIÇÕES",
    badge: "👁️ JUJUTSU",
    subtitle: "Energia Amaldiçoada & Expansão",
    lore: "Xamãs supremos e Reis das Maldições distorcem a própria realidade.",
    primaryColor: 0xa855f7,
    secondaryColor: 0xd946ef,
    textColor: "#e879f9",
    ambientHex: "#a855f7",
    particleColor: 0xc084fc,
    characterKeys: ["gojo", "thukuna"],
    bannerQuote: "Expansão de Domínio: O infinito em suas mãos.",
  },
  {
    id: "stands",
    name: "HERÓIS & STANDS",
    badge: "⭐ STAND POWER",
    subtitle: "Stands Espirituais & Força Incomparável",
    lore: "Pancadarias supersônicas, Ora-Ora frenéticos e socos que desafiam a física.",
    primaryColor: 0xfacc15,
    secondaryColor: 0x8b5cf6,
    textColor: "#fde047",
    ambientHex: "#facc15",
    particleColor: 0xfef08a,
    characterKeys: ["jotaro", "saitama"],
    bannerQuote: "Yare Yare Daze... Um único golpe basta!",
  },
  {
    id: "comics_cyber",
    name: "VIGILANTES & CYBER",
    badge: "🦇 JUSTIÇA & TECH",
    subtitle: "Heróis Noturnos e Alta Tecnologia",
    lore: "Mestres da estratégia urbana, cibernética avançada e lendas heroicas.",
    primaryColor: 0x06b6d4,
    secondaryColor: 0x3b82f6,
    textColor: "#22d3ee",
    ambientHex: "#06b6d4",
    particleColor: 0x67e8f9,
    characterKeys: ["batman", "spiderman", "static", "cyberninja", "optimus", "leonardo", "chapolim", "frieren", "minipekka"],
    bannerQuote: "A justiça nunca dorme nas sombras.",
  },
];

const STORAGE_KEY = "utlw_selected_universe";

export class UniverseManager {
  private static currentUniverseId: string = "multiverse";

  static init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && UNIVERSES.some((u) => u.id === saved)) {
        this.currentUniverseId = saved;
      }
    } catch {
      this.currentUniverseId = "multiverse";
    }
  }

  static getSelectedUniverse(): UniverseInfo {
    const found = UNIVERSES.find((u) => u.id === this.currentUniverseId);
    return found || UNIVERSES[0];
  }

  static getSelectedIndex(): number {
    const idx = UNIVERSES.findIndex((u) => u.id === this.currentUniverseId);
    return idx >= 0 ? idx : 0;
  }

  static setSelectedUniverse(id: string): UniverseInfo {
    const found = UNIVERSES.find((u) => u.id === id);
    if (found) {
      this.currentUniverseId = id;
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {}
      return found;
    }
    return UNIVERSES[0];
  }

  static cycleUniverse(direction: 1 | -1): UniverseInfo {
    let index = this.getSelectedIndex() + direction;
    if (index < 0) index = UNIVERSES.length - 1;
    if (index >= UNIVERSES.length) index = 0;
    return this.setSelectedUniverse(UNIVERSES[index].id);
  }
}
UniverseManager.init();
