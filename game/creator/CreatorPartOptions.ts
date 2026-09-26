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

/** Hats hide the visible hair; the saved head choice stays available and unchanged. */
export function getAvailableHeadOptions(_accessoryId?: string): string[] {
  return partOptions.head;
}

export const auraColors = ColorPalette.aura;

export const skinColors = ColorPalette.skin;

export const hairColors = ColorPalette.hair;

export const giColors = ColorPalette.gi;
