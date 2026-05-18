const fs = require('fs');
let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(
`            // Cannot cross the enemy
            const p1MaxX = this.enemy.x - 40;
            this.player.x = Phaser.Math.Clamp(this.player.x, bounds.minX, Math.min(bounds.maxX, p1MaxX));`,
`            // Cannot cross the enemy
            if (this.player.x <= this.enemy.x) {
                this.player.x = Math.min(this.player.x, this.enemy.x - 60);
                this.player.x = Math.max(this.player.x, bounds.minX);
            } else {
                this.player.x = Math.max(this.player.x, this.enemy.x + 60);
                this.player.x = Math.min(this.player.x, bounds.maxX);
            }`
);

file = file.replace(
`            // Cannot cross the player
            const p2MinX = this.player.x + 40;
            this.enemy.x = Phaser.Math.Clamp(this.enemy.x, Math.max(bounds.minX, p2MinX), bounds.maxX);`,
`            // Cannot cross the player
            if (this.enemy.x >= this.player.x) {
                this.enemy.x = Math.max(this.enemy.x, this.player.x + 60);
                this.enemy.x = Math.min(this.enemy.x, bounds.maxX);
            } else {
                this.enemy.x = Math.min(this.enemy.x, this.player.x - 60);
                this.enemy.x = Math.max(this.enemy.x, bounds.minX);
            }`
);

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Fixed collision code!");
