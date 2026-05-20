import { Fighter } from './base/Fighter';
import { GokuFighter } from './goku';
import { VegetaFighter } from './vegeta';

const registry = new Map<string, Fighter>([
  ['goku', new GokuFighter()],
  ['vegeta', new VegetaFighter()]
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
