import { ColorPalette } from "../utils/ColorPalette";
import { COVERED_HEADS } from "../sprites/CustomArtLayout";

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

/** Every head works under a hat; the saved head choice stays available and unchanged. */
export function getAvailableHeadOptions(_accessoryId?: string): string[] {
  return partOptions.head;
}

/** Only a head of hair or a bald head wears a headband: not a cap, hood or mask. */
export function accessoryFitsHead(accessoryId: string, head: string): boolean {
  return accessoryId !== "headband" || !(COVERED_HEADS as readonly string[]).includes(head);
}

export const auraColors = ColorPalette.aura;

export const skinColors = ColorPalette.skin;

export const hairColors = ColorPalette.hair;

export const giColors = ColorPalette.gi;
