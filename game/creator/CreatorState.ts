import { partOptions, getAvailableHeadOptions, skinColors, hairColors, giColors } from "./CreatorPartOptions";
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
    head_1: 0,
    head_2: 1,
    acc_1: 0,
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
  }

  public nextPart(part: keyof typeof this.style_idx, options: string[]) {
    if (!options.length) return;
    const head = this.getEquippedHead();
    this.style_idx[part] = (this.style_idx[part] + 1) % options.length;
    if (part === "accessory") this.style_idx.head = Math.max(0, this.getAvailableHeads().indexOf(head));
    this.validateConstraints();
  }

  public prevPart(part: keyof typeof this.style_idx, options: string[]) {
    if (!options.length) return;
    const head = this.getEquippedHead();
    this.style_idx[part] =
      (this.style_idx[part] - 1 + options.length) % options.length;
    if (part === "accessory") this.style_idx.head = Math.max(0, this.getAvailableHeads().indexOf(head));
    this.validateConstraints();
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
