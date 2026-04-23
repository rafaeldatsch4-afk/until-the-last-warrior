const fs = require('fs');

const path = './game/scenes/BattleScene.ts';
let code = fs.readFileSync(path, 'utf-8');

// Genkidama Animation Fix
const genkidamaOld = `    // Raise hands
    attacker.y -= 20;

    // Create giant spirit bomb`;
    
const genkidamaNew = `    // Raise hands
    attacker.play(\`\${attacker.getData('charKey')}_charge\`);

    // Create giant spirit bomb`;

code = code.replace(genkidamaOld, genkidamaNew);

const dropHandsOld = `      onComplete: () => {
        if (!this.scene.isActive()) return;
        attacker.y += 20; // Lower hands

        this.cameras.main.shake(300, 0.02);

        // Throw`;

const dropHandsNew = `      onComplete: () => {
        if (!this.scene.isActive()) return;
        attacker.play(\`\${attacker.getData('charKey')}_attack\`); // Throw forward

        this.cameras.main.shake(300, 0.02);

        // Throw`;
        
code = code.replace(dropHandsOld, dropHandsNew);

const throwEndOld = `                onComplete: () => p.destroy(),
              });
            }

            // Restore
            this.time.delayedCall(500, () => {`;

const throwEndNew = `                onComplete: () => p.destroy(),
              });
            }

            // Restore
            attacker.play(\`\${attacker.getData('charKey')}_idle\`);
            this.time.delayedCall(500, () => {`;
            
code = code.replace(throwEndOld, throwEndNew);


// Spider-Man Special Logic
const spidermanCase = `            case "spiderman":
              if (isSuper) this.specialBeam(isPlayer, true, 0x1a1a1a, true, false, 'maximum_spider');
              else this.specialBeam(isPlayer, false, 0xffffff, false, false, 'web_shoot');
              break;`;

// insert spidermanCase into standard attack calls (line 3866 was gohan). We can insert it securely using regex or index.
const gokuCase = `            case "goku":
              if (isSuper) this.specialGenkidama(isPlayer);
              else this.specialKamehameha(isPlayer);
              break;`;
              
code = code.replace(gokuCase, gokuCase + '\\n' + spidermanCase);

fs.writeFileSync(path, code);
console.log('Battle scene updated for Goku and Spiderman.');
