import Phaser from "phaser";
import type { CharacterData } from "../types";
import { generateRiggedCustomSprite } from "./CustomSpriteRig";

/**
 * Custom fighters are built from one coherent articulated base body and then
 * dressed in deterministic overlay layers. Keeping every part on the same rig
 * prevents the old oversized-head / detached-clothing composition failures and
 * makes idle, guard, walk, attack, kick, defend and charge share the same joints.
 */
export function generateCustomSprite(scene: Phaser.Scene, charData: CharacterData) {
  return generateRiggedCustomSprite(scene, charData);
}
