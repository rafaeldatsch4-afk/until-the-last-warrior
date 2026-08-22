import { partOptions, getAvailableHeadOptions } from "./CreatorPartOptions";

export class CreatorState {
  public aura_preset_id: string = "gold";
  public aura_mode: "p1" | "all" = "p1";

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
    this.style_idx[part] = (this.style_idx[part] + 1) % options.length;
    this.validateConstraints();
  }

  public prevPart(part: keyof typeof this.style_idx, options: string[]) {
    this.style_idx[part] =
      (this.style_idx[part] - 1 + options.length) % options.length;
    this.validateConstraints();
  }

  public nextColor(part: keyof typeof this.p_idx, options: number[]) {
    this.p_idx[part] = (this.p_idx[part] + 1) % options.length;
  }

  public prevColor(part: keyof typeof this.p_idx, options: number[]) {
    this.p_idx[part] =
      (this.p_idx[part] - 1 + options.length) % options.length;
  }
}
