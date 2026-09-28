import type Phaser from 'phaser';
import type { CharacterData } from '../types';
import { generateCustomSprite } from './CustomSprite';
import { registerFighterAnimations } from './FighterAnimations';

/** A story save and a versus save can share a key but have different wardrobes. */
export function ensureCustomAppearance(scene: Phaser.Scene, character: CharacterData) {
  if (!character.customData) return;
  const signature=JSON.stringify(character.customData);
  const forms=['','_ssj','_ui'].map(suffix=>character.key+suffix);
  const complete=forms.every(key=>scene.textures.exists(key) &&
    (scene.textures.get(key) as Phaser.Textures.Texture & {customAppearanceSignature?:string}).customAppearanceSignature===signature);
  if(!complete){
    generateCustomSprite(scene,character);
    registerFighterAnimations(scene,character.key);
  } else if(forms.some(key=>['idle','walk','attack','punch','kick','special','defend','transform','charge','genki']
    .some(action=>!scene.anims.exists(key+'_'+action)))) {
    registerFighterAnimations(scene,character.key);
  }
}
