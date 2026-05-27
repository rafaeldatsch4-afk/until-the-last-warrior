import Phaser from "phaser";
import { generateGokuSprite } from "./GokuSprite";
import { generateVegetaSprite } from "./VegetaSprite";
import { generatePiccoloSprite } from "./PiccoloSprite";
import { generateGohanSprite } from "./GohanSprite";
import { generateMadaraSprite } from "./MadaraSprite";
import { generateCellSprite } from "./CellSprite";
import { generateMinipekkaSprite } from "./MinipekkaSprite";
import { generateCyberninjaSprite } from "./CyberninjaSprite";
import { generateLeonardoSprite } from "./LeonardoSprite";
import { generateFrierenSprite } from "./FrierenSprite";
import { generateOptimusSprite } from "./OptimusSprite";
import { generateNarutoSprite } from "./NarutoSprite";
import { generateChapolimSprite } from "./ChapolimSprite";
import { generateBatmanSprite } from "./BatmanSprite";
import { generateThukunaSprite } from "./ThukunaSprite";
import { generateGojoSprite } from "./GojoSprite";
import { generateItachiSprite } from "./ItachiSprite";
import { generateJotaroSprite } from "./JotaroSprite";
import { generateObitoSprite } from "./ObitoSprite";
import { generateSpidermanSprite } from "./SpidermanSprite";
import { generateSaitamaSprite } from "./SaitamaSprite";
import { generateStaticSprite } from "./StaticSprite";

export interface SpriteGenerator {
  name: string;
  fn: (scene: Phaser.Scene) => void;
}

export const SPRITE_GENERATORS: SpriteGenerator[] = [
  { name: "Goku", fn: generateGokuSprite },
  { name: "Vegeta", fn: generateVegetaSprite },
  { name: "Piccolo", fn: generatePiccoloSprite },
  { name: "Gohan", fn: generateGohanSprite },
  { name: "Madara Uchiha", fn: generateMadaraSprite },
  { name: "Cell", fn: generateCellSprite },
  { name: "Mini P.E.K.K.A", fn: generateMinipekkaSprite },
  { name: "Cyberninja", fn: generateCyberninjaSprite },
  { name: "Leonardo", fn: generateLeonardoSprite },
  { name: "Frieren", fn: generateFrierenSprite },
  { name: "Optimus Prime", fn: generateOptimusSprite },
  { name: "Naruto Uzumaki", fn: generateNarutoSprite },
  { name: "Chapolin Colorado", fn: generateChapolimSprite },
  { name: "Batman", fn: generateBatmanSprite },
  { name: "Sukuna", fn: generateThukunaSprite },
  { name: "Gojo Satoru", fn: generateGojoSprite },
  { name: "Itachi Uchiha", fn: generateItachiSprite },
  { name: "Jotaro Kujo", fn: generateJotaroSprite },
  { name: "Obito Uchiha", fn: generateObitoSprite },
  { name: "Spiderman", fn: generateSpidermanSprite },
  { name: "Saitama", fn: generateSaitamaSprite },
  { name: "Static", fn: generateStaticSprite }
];

export function generateAllSprites(scene: Phaser.Scene): void {
    if (scene.textures.exists("goku")) {
        console.log("All character sprites are already in cache. Skipping generation.");
        return;
    }
    SPRITE_GENERATORS.forEach(item => {
        try {
            item.fn(scene);
        } catch (e) {
            console.error(`Error generating ${item.name}:`, e);
        }
    });
}
