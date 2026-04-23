const fs = require('fs');

const path = './game/data.ts';
let code = fs.readFileSync(path, 'utf-8');

const spiderMan = `
  {
    id: 17,
    key: "spiderman",
    name: "Spider-Man",
    price: 1900,
    unlocked: true,
    maxHp: 240,
    transformAvailable: true,
    sprite: "",
    frameWidth: 64,
    frameHeight: 64,
    specialName: "WEB SHOOTER",
    superName: "MAXIMUM SPIDER",
    specialColor: 0xffffff
  }
`;

code = code.replace(
  '    specialColor: 0xff4500\n  }\n];', 
  '    specialColor: 0xff4500\n  },' + spiderMan + '\n];'
);

fs.writeFileSync(path, code);
