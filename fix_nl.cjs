const fs = require('fs');

const path = './game/scenes/BattleScene.ts';
let code = fs.readFileSync(path, 'utf-8');

code = code.replace('\\\\n', '\\n'); // Clean up the mistake, though let me just use a raw replace

// Let's replace the literal "\\n" with an actual newline "\n"
code = code.replace(/\\\\n/g, '\\n');
code = code.replace('break;\\n            case "spiderman":', 'break;\\n            case "spiderman":'); // wait I'll just write it literally

const badStr = 'break;\\n            case "spiderman":';
code = code.replace(badStr, 'break;\n            case "spiderman":');

fs.writeFileSync(path, code);
