import { Fighter } from './base/Fighter';
import { GokuFighter } from './goku';
import { VegetaFighter } from './vegeta';
import { GohanFighter } from './gohan';
import { PiccoloFighter } from './piccolo';
import { MadaraFighter } from './madara';
import { CellFighter } from './cell';
import { LeonardoFighter } from './leonardo';
import { ObitoFighter } from './obito';
import { ItachiFighter } from './itachi';
import { JotaroFighter } from './jotaro';
import { NarutoFighter } from './naruto';
import { SpidermanFighter } from './spiderman';
import { ThukunaFighter } from './thukuna';
import { BatmanFighter } from './batman';
import { CyberNinjaFighter } from './cyberninja';
import { MiniPekkaFighter } from './minipekka';
import { OptimusFighter } from './optimus';
import { SaitamaFighter } from './saitama';
import { StaticFighter } from './static';
import { FrierenFighter } from './frieren';
import { ChapolimFighter } from './chapolim';
import { GojoFighter } from './gojo';

const registry = new Map<string, Fighter>([
  ['goku', new GokuFighter()],
  ['vegeta', new VegetaFighter()],
  ['gohan', new GohanFighter()],
  ['piccolo', new PiccoloFighter()],
  ['madara', new MadaraFighter()],
  ['cell', new CellFighter()],
  ['leonardo', new LeonardoFighter()],
  ['obito', new ObitoFighter()],
  ['itachi', new ItachiFighter()],
  ['jotaro', new JotaroFighter()],
  ['naruto', new NarutoFighter()],
  ['spiderman', new SpidermanFighter()],
  ['thukuna', new ThukunaFighter()],
  ['batman', new BatmanFighter()],
  ['cyberninja', new CyberNinjaFighter()],
  ['minipekka', new MiniPekkaFighter()],
  ['optimus', new OptimusFighter()],
  ['saitama', new SaitamaFighter()],
  ['static', new StaticFighter()],
  ['frieren', new FrierenFighter()],
  ['chapolim', new ChapolimFighter()],
  ['gojo', new GojoFighter()],
]);

export function getFighter(key: string): Fighter {
  const fighter = registry.get(key);
  if (!fighter) {
      // Fallback or throw
      // Because we are migrating incrementally, return a dummy object or throw?
      // Wait, BattleScene handles the unmigrated ones in the switch cases, 
      // so if we only call `getFighter` inside the "goku" case, we are safe.
      throw new Error(`Fighter not found: ${key}`);
  }
  return fighter;
}
