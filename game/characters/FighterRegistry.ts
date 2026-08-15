import { Fighter } from "./base/Fighter";
import { FighterConfig } from "./base/FighterTypes";
import { GokuFighter } from "./goku";
import { VegetaFighter } from "./vegeta";
import { GohanFighter } from "./gohan";
import { PiccoloFighter } from "./piccolo";
import { MadaraFighter } from "./madara";
import { CellFighter } from "./cell";
import { LeonardoFighter } from "./leonardo";
import { ObitoFighter } from "./obito";
import { ItachiFighter } from "./itachi";
import { JotaroFighter } from "./jotaro";
import { NarutoFighter } from "./naruto";
import { SpidermanFighter } from "./spiderman";
import { ThukunaFighter } from "./thukuna";
import { BatmanFighter } from "./batman";
import { CyberNinjaFighter } from "./cyberninja";
import { MiniPekkaFighter } from "./minipekka";
import { OptimusFighter } from "./optimus";
import { SaitamaFighter } from "./saitama";
import { StaticFighter } from "./static";
import { FrierenFighter } from "./frieren";
import { ChapolimFighter } from "./chapolim";
import { GojoFighter } from "./gojo";

export class FighterRegistry {
  private static instance: FighterRegistry;
  private readonly fighters = new Map<string, Fighter>();

  private constructor() {
    this.registerFighter(new GokuFighter());
    this.registerFighter(new VegetaFighter());
    this.registerFighter(new GohanFighter());
    this.registerFighter(new PiccoloFighter());
    this.registerFighter(new MadaraFighter());
    this.registerFighter(new CellFighter());
    this.registerFighter(new LeonardoFighter());
    this.registerFighter(new ObitoFighter());
    this.registerFighter(new ItachiFighter());
    this.registerFighter(new JotaroFighter());
    this.registerFighter(new NarutoFighter());
    this.registerFighter(new SpidermanFighter());
    this.registerFighter(new ThukunaFighter());
    this.registerFighter(new BatmanFighter());
    this.registerFighter(new CyberNinjaFighter());
    this.registerFighter(new MiniPekkaFighter());
    this.registerFighter(new OptimusFighter());
    this.registerFighter(new SaitamaFighter());
    this.registerFighter(new StaticFighter());
    this.registerFighter(new FrierenFighter());
    this.registerFighter(new ChapolimFighter());
    this.registerFighter(new GojoFighter());
  }

  public static getInstance(): FighterRegistry {
    if (!FighterRegistry.instance) {
      FighterRegistry.instance = new FighterRegistry();
    }
    return FighterRegistry.instance;
  }

  public registerFighter(fighter: Fighter): void {
    this.fighters.set(fighter.key.toLowerCase(), fighter);
  }

  public getFighter(key: string, baseKey?: string): Fighter {
    let searchKey = key.toLowerCase();
    if (searchKey === "custom_999" && baseKey) {
      searchKey = baseKey.toLowerCase();
    }

    const fighter = this.fighters.get(searchKey);
    if (!fighter) {
      // Fallback gracioso para goku caso não encontre
      const fallback = this.fighters.get("goku");
      if (fallback) return fallback;
      throw new Error(`Fighter not found: ${searchKey}`);
    }
    return fighter;
  }

  public hasFighter(key: string): boolean {
    return this.fighters.has(key.toLowerCase());
  }

  public getAllFighters(): Fighter[] {
    return Array.from(this.fighters.values());
  }
}

/**
 * Função utilitária mantida para compatibilidade total com chamadas existentes
 */
export function getFighter(key: string, baseKey?: string): Fighter {
  return FighterRegistry.getInstance().getFighter(key, baseKey);
}

export type { FighterConfig };
