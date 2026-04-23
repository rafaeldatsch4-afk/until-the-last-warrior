const fs = require('fs');
const path = './game/scenes/BattleScene.ts';
let code = fs.readFileSync(path, 'utf-8');

const spiderManRouteOld = '      case "naruto":';
const spiderManRouteNew = '      case "spiderman":\\n        this.performSpidermanAttack(isPlayer, attackType, comboCount, isComboFinisher);\\n        return true;\\n      case "naruto":';
code = code.replace(spiderManRouteOld, spiderManRouteNew.replace(/\\n/g, '\\n'));

const spidermanSpecialsOld = '            case "spiderman":\\n              if (isSuper) this.specialBeam(isPlayer, true, 0x1a1a1a, true, false, \\'maximum_spider\\');\\n              else this.specialBeam(isPlayer, false, 0xffffff, false, false, \\'web_shoot\\');\\n              break;';
const spidermanSpecialsNew = '            case "spiderman":\\n              if (isSuper) this.specialMaximumSpider(isPlayer);\\n              else this.specialWebPullPunch(isPlayer);\\n              break;';
code = code.replace(spidermanSpecialsOld.replace(/\\n/g, '\\n'), spidermanSpecialsNew.replace(/\\n/g, '\\n'));

fs.writeFileSync(path, code);
console.log('first routes setup')
