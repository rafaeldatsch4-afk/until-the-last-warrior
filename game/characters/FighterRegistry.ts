import { Fighter } from './base/Fighter';
import { GokuFighter } from './goku';
import { VegetaFighter } from './vegeta';
import { GohanFighter } from './gohan';
import { PiccoloFighter } from './piccolo';
import { MadaraFighter } from './madara';
import { CellFighter } from './cell';
import { LeonardoFighter } from './leonardo';

const registry = new Map<string, Fighter>([
  ['goku', new GokuFighter()],
  ['vegeta', new VegetaFighter()],
  ['gohan', new GohanFighter()],
  ['piccolo', new PiccoloFighter()],
  ['madara', new MadaraFighter()],
  ['cell', new CellFighter()],
  ['leonardo', new LeonardoFighter()],
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
