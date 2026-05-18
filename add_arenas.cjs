const fs = require('fs');
let file = fs.readFileSync('game/scenes/PreloadScene.ts', 'utf8');

const additionalArenas = `    this.load.image("arena_ice", "https://labs.phaser.io/assets/skies/sky1.png");
    this.load.image("arena_lava", "https://labs.phaser.io/assets/skies/underwater3.png");
    this.load.image("arena_desert", "https://labs.phaser.io/assets/skies/sky2.png");
    this.load.image("arena_dark", "https://labs.phaser.io/assets/skies/deepblue.png");`;

if (!file.includes('arena_ice')) {
    file = file.replace(
        `this.load.image(\n      "arena_tournament",\n      "https://labs.phaser.io/assets/skies/clouds.png",\n    );`,
        `this.load.image(\n      "arena_tournament",\n      "https://labs.phaser.io/assets/skies/clouds.png",\n    );\n${additionalArenas}`
    );
}

fs.writeFileSync('game/scenes/PreloadScene.ts', file);
console.log("Added more arenas to PreloadScene!");
