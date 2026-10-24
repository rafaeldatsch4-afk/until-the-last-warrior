import { partOptions, getAvailableHeadOptions, accessoryFitsHead, skinColors, hairColors, giColors } from "./CreatorPartOptions";
import type { CharacterData } from "../types";

type CustomData = NonNullable<CharacterData["customData"]>;
const colorFields = {
  skin: "skin", hair: "hair", torso_1: "color_torso_1", torso_2: "color_torso_2",
  legs_1: "color_legs_1", legs_2: "color_legs_2", feet_1: "color_feet_1",
  feet_2: "color_feet_2", head_1: "color_head_1", head_2: "color_head_2", acc_1: "color_acc_1",
} as const;
type ColorPart = keyof typeof colorFields;
const legacyColors: Partial<Record<ColorPart, "gi1" | "gi2">> = {
  torso_1: "gi1", torso_2: "gi2", legs_1: "gi1", legs_2: "gi2",
  feet_1: "gi2", feet_2: "gi1", head_1: "gi1", head_2: "gi2", acc_1: "gi2",
};
const paletteFor = (part: ColorPart) => part === "skin" ? skinColors : part === "hair" ? hairColors : giColors;

export class CreatorState {
  public aura_preset_id: string = "gold";
  public aura_mode: "p1" | "all" = "p1";
  private importedColors: Partial<Record<ColorPart, number>> = {};

  public p_idx = {
    skin: 0,
    hair: 0,
    torso_1: 0,
    torso_2: 1,
    legs_1: 0,
    legs_2: 1,
    feet_1: 0,
    feet_2: 1,
    head_1: 2, // red: the Spider mask and Chapolim hood read as themselves by default
    head_2: 1,
    acc_1: 2, // red: the default gi is orange, so the default orange made accessories vanish
  };

  public style_idx = {
    head: 0,
    torso: 0,
    legs: 0,
    feet: 0,
    accessory: 0,
  };

  public getEquippedAccessory(): string {
    return partOptions.accessory[this.style_idx.accessory] || "none";
  }

  public getAvailableHeads(): string[] {
    return getAvailableHeadOptions(this.getEquippedAccessory());
  }

  public getEquippedHead(): string {
    const heads = this.getAvailableHeads();
    if (this.style_idx.head >= heads.length) {
      this.style_idx.head = 0;
    }
    return heads[this.style_idx.head] || "goku";
  }

  public validateConstraints() {
    const heads = this.getAvailableHeads();
    if (this.style_idx.head >= heads.length) {
      this.style_idx.head = 0;
    }
    // A covered head (cap, hood, mask) takes the headband's place: it comes off, and
    // goes back on when a head of hair or a bald head is picked again.
    const head = this.getEquippedHead();
    if (!accessoryFitsHead(this.getEquippedAccessory(), head)) {
      this.removedAccessory = this.getEquippedAccessory();
      this.style_idx.accessory = partOptions.accessory.indexOf("none");
    } else if (this.removedAccessory && this.getEquippedAccessory() === "none" && accessoryFitsHead(this.removedAccessory, head)) {
      this.style_idx.accessory = partOptions.accessory.indexOf(this.removedAccessory);
      this.removedAccessory = null;
    }
  }

  /** An accessory a covered head took off, restored when the head allows it again. */
  private removedAccessory: string | null = null;

  private stepPart(part: keyof typeof this.style_idx, options: string[], step: 1 | -1) {
    if (!options.length) return;
    // Choosing an accessory yourself replaces the one a head took off.
    if (part === "accessory") this.removedAccessory = null;
    const head = this.getEquippedHead();
    do {
      this.style_idx[part] = (this.style_idx[part] + step + options.length) % options.length;
      // Accessories that don't fit the head (a headband on a cap, hood or mask) are skipped.
    } while (part === "accessory" && !accessoryFitsHead(options[this.style_idx[part]], head));
    if (part === "accessory") this.style_idx.head = Math.max(0, this.getAvailableHeads().indexOf(head));
    this.validateConstraints();
  }

  public nextPart(part: keyof typeof this.style_idx, options: string[]) {
    this.stepPart(part, options, 1);
  }

  public prevPart(part: keyof typeof this.style_idx, options: string[]) {
    this.stepPart(part, options, -1);
  }

  public nextColor(part: keyof typeof this.p_idx, options: number[]) {
    if (!options.length) return;
    this.p_idx[part] = (this.p_idx[part] + 1) % options.length;
  }

  public prevColor(part: keyof typeof this.p_idx, options: number[]) {
    if (!options.length) return;
    if (this.p_idx[part] < 0) { this.p_idx[part] = options.length - 1; return; }
    this.p_idx[part] =
      (this.p_idx[part] - 1 + options.length) % options.length;
  }

  public getColor(part: ColorPart): number {
    return paletteFor(part)[this.p_idx[part]] ?? this.importedColors[part] ?? paletteFor(part)[0];
  }

  /** Restore IDs after applying accessory constraints; array positions are not save IDs. */
  public loadCustomData(data: CustomData) {
    this.importedColors = {};
    for (const part of ["accessory", "torso", "legs", "feet"] as const) {
      const id = data[`part_${part}`];
      this.style_idx[part] = Math.max(0, partOptions[part].indexOf(id ?? ""));
    }
    this.style_idx.head = Math.max(0, this.getAvailableHeads().indexOf(data.part_head ?? "goku"));
    this.removedAccessory = null;
    this.validateConstraints();
    this.removedAccessory = null;
    for (const part of Object.keys(colorFields) as ColorPart[]) {
      const legacyField = legacyColors[part];
      const value = data[colorFields[part]] ?? (legacyField ? data[legacyField] : undefined);
      if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 0xffffff) {
        this.p_idx[part] = paletteFor(part).indexOf(value);
        // Keep valid colors from old/imported saves even if today's palette has no matching swatch.
        this.importedColors[part] = value;
      }
    }
    if (data.aura_id) this.aura_preset_id = data.aura_id;
    if (data.aura_mode === "p1" || data.aura_mode === "all") this.aura_mode = data.aura_mode;
  }

  /** The preview and equipped fighter consume exactly the same appearance data. */
  public toCustomData(sp1: string, sp2: string): CustomData {
    const colors = Object.fromEntries((Object.keys(colorFields) as ColorPart[])
      .map(part => [colorFields[part], this.getColor(part)]));
    return {
      ...colors, gi1: this.getColor("torso_1"), gi2: this.getColor("torso_2"),
      skin: this.getColor("skin"), hair: this.getColor("hair"),
      sp1_id: sp1, sp2_id: sp2, aura_id: this.aura_preset_id, aura_mode: this.aura_mode,
      part_head: this.getEquippedHead(), part_accessory: this.getEquippedAccessory(),
      part_torso: partOptions.torso[this.style_idx.torso] ?? "goku",
      part_legs: partOptions.legs[this.style_idx.legs] ?? "goku",
      part_feet: partOptions.feet[this.style_idx.feet] ?? "goku",
    };
  }
}
