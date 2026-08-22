import { ColorPalette } from "../utils/ColorPalette";

export const partOptions = {
  head: ["goku", "spiderman", "saitama", "chapolim", "vegeta", "jotaro", "naruto", "sasuke", "luffy"],
  torso: [
    "goku",
    "spiderman",
    "jotaro",
    "vegeta",
    "saitama",
    "chapolim",
    "muscle",
    "naruto",
    "sasuke",
    "luffy"
  ],
  legs: ["goku", "spiderman", "jotaro", "saitama", "vegeta", "chapolim", "naruto", "sasuke", "luffy"],
  feet: ["goku", "spiderman", "chapolim", "saitama", "vegeta", "jotaro", "naruto", "sasuke", "luffy"],
  accessory: ["none", "straw_hat", "sword", "headband", "cape", "scouter", "scarf"],
};

/**
 * Retorna as opções de cabeça disponíveis. Quando o Chapéu de Palha (straw_hat)
 * está equipado, o capuz do Chapolim é omitido para evitar sobreposição conflitante.
 */
export function getAvailableHeadOptions(accessoryId?: string): string[] {
  if (accessoryId === "straw_hat") {
    return partOptions.head.filter((h) => h !== "chapolim");
  }
  return partOptions.head;
}

export const auraColors = ColorPalette.aura;

export const skinColors = ColorPalette.skin;

export const hairColors = ColorPalette.hair;

export const giColors = ColorPalette.gi;
