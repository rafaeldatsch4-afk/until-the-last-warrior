import Phaser from 'phaser';
import { INITIAL_CHARACTERS } from '../data';
import { CharacterData } from '../types';
import { generateCustomSprite } from '../sprites/CustomSprite';

export default class CharacterCreatorScene extends Phaser.Scene {
  private currentBaseObjIndex = 0;
  private previewSprite!: Phaser.GameObjects.Sprite;
  private previewAura!: Phaser.GameObjects.Shape;
  private auraColors = [0xffffff, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0x000000, 0xff8800];
  private currentColorIndex = 0;

  private skinColors = [0xffce9e, 0x8d5524, 0xe0ac69, 0xf1c27d, 0x5c3a21, 0x4aa37a];
  private hairColors = [0x1a1a1a, 0xe0e0e0, 0xffea00, 0xd92525, 0x003399, 0x2ecc71, 0x9b59b6];
  private giColors = [0xff5a00, 0x003399, 0xd92525, 0x111111, 0x2ecc71, 0xf1c40f, 0x8e44ad, 0xffffff];
  private p_idx = { skin:0, hair:0, gi1:0, gi2:1 };

  private partOptions = {
    head: ['goku', 'spiderman', 'saitama', 'chapolim'],
    torso: ['goku', 'spiderman', 'jotaro', 'vegeta'],
    legs: ['goku', 'spiderman', 'jotaro', 'saitama'],
    feet: ['goku', 'spiderman', 'chapolim'],
    accessory: ['none', 'sword', 'cape']
  };
  private style_idx = { head: 0, torso: 0, legs: 0, feet: 0, accessory: 0 };
  
  private customSp1Id = "";
  private customSp2Id = "";
  private customSp1Name = "";
  private customSp2Name = "";

  constructor() {
    super('CharacterCreatorScene');
  }

  private createAnim = (animKey: string, texture: string, start: number, end: number, frameRate: number, repeat: number = -1) => {
    if (this.anims.exists(animKey)) this.anims.remove(animKey);
    const tex = this.textures.get(texture);
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = start; i <= end; i++) {
        if (tex && tex.has(i.toString())) frames.push({ key: texture, frame: i.toString() });
    }
    if (frames.length > 0) {
        this.anims.create({ key: animKey, frames: frames, frameRate: frameRate, repeat: repeat });
    }
  };

  create() {
    this.add.rectangle(480, 270, 960, 540, 0x0f0c29);
    
    if (this.cameras.main.postFX) {
        this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
    }
    
    const backContainer = this.add.container(80, 40);
    const backBtn = this.add.rectangle(0, 0, 100, 40, 0xe74c3c).setStrokeStyle(2, 0xffffff);
    const backTxt = this.add.text(0, 0, 'VOLTAR', { fontSize: '18px', fontStyle: 'bold', fontFamily: "system-ui, -apple-system, sans-serif", resolution: 2 }).setOrigin(0.5);
    backContainer.add([backBtn, backTxt]);
    
    backBtn.setInteractive({ useHandCursor: true })
      .on('pointerover', () => backBtn.setFillStyle(0xc0392b))
      .on('pointerout', () => backBtn.setFillStyle(0xe74c3c))
      .on('pointerdown', () => this.scene.start('MenuScene'));

    this.add.text(480, 50, 'CRIAR PERSONAGEM', { fontSize: '32px', fontStyle: 'bold', color: '#f39c12', fontFamily: "system-ui, -apple-system, 'Arial Black', sans-serif", resolution: 2 }).setOrigin(0.5);

    const builderData = {
        base: INITIAL_CHARACTERS[0],
        auraColor: 0xffffff,
        name: "Meu Guerreiro"
    };

    const getColorName = (hex: number) => {
        const map: {[key: number]: string} = {
            0xffffff: 'Branco',
            0xff0000: 'Vermelho',
            0x00ff00: 'Verde',
            0x0000ff: 'Azul',
            0xffff00: 'Amarelo',
            0xff00ff: 'Rosa',
            0x00ffff: 'Ciano',
            0x000000: 'Preto',
            0xff8800: 'Laranja',
            0xffce9e: 'Claro',
            0x8d5524: 'Escuro',
            0xe0ac69: 'Médio',
            0xf1c27d: 'Amarelo',
            0x5c3a21: 'Mto Escuro',
            0x4aa37a: 'Alien',
            0x1a1a1a: 'Preto',
            0xe0e0e0: 'Platina',
            0xffea00: 'Loiro',
            0xd92525: 'Vermelho',
            0x003399: 'Azul E.',
            0x2ecc71: 'Verde E.',
            0x9b59b6: 'Roxo',
            0xff5a00: 'Laranja',
            0x111111: 'Negro',
            0xf1c40f: 'Dourado',
            0x8e44ad: 'Roxo E.'
        };
        return map[hex] || `#${hex.toString(16)}`;
    };

    const updatePreview = () => {
        builderData.base = INITIAL_CHARACTERS[this.currentBaseObjIndex];
        builderData.auraColor = this.auraColors[this.currentColorIndex];
        
        baseTxt.setText(`Cabeça: ${this.partOptions.head[this.style_idx.head]}`);
        auraTxt.setText(`Aura: ${getColorName(builderData.auraColor)}`);
        gi1Txt.setText(`Roupa 1: ${getColorName(this.giColors[this.p_idx.gi1])}`);
        gi2Txt.setText(`Roupa 2: ${getColorName(this.giColors[this.p_idx.gi2])}`);
        skinTxt.setText(`Pele: ${getColorName(this.skinColors[this.p_idx.skin])}`);
        hairTxt.setText(`Cabelo: ${getColorName(this.hairColors[this.p_idx.hair])}`);
        torsoTxt.setText(`Tronco: ${this.partOptions.torso[this.style_idx.torso]}`);
        legsTxt.setText(`Calça: ${this.partOptions.legs[this.style_idx.legs]}`);
        feetTxt.setText(`Botas: ${this.partOptions.feet[this.style_idx.feet]}`);
        accTxt.setText(`Acessório: ${this.partOptions.accessory[this.style_idx.accessory]}`);

        // Generate Custom Sprite Dynamic
        const customData = {
            gi1: this.giColors[this.p_idx.gi1],
            gi2: this.giColors[this.p_idx.gi2],
            skin: this.skinColors[this.p_idx.skin],
            hair: this.hairColors[this.p_idx.hair],
            sp1_id: this.customSp1Id || builderData.base.key,
            sp2_id: this.customSp2Id || builderData.base.key,
            part_head: this.partOptions.head[this.style_idx.head],
            part_torso: this.partOptions.torso[this.style_idx.torso],
            part_legs: this.partOptions.legs[this.style_idx.legs],
            part_feet: this.partOptions.feet[this.style_idx.feet],
            part_accessory: this.partOptions.accessory[this.style_idx.accessory]
        };
        
        if (this.previewSprite) this.previewSprite.destroy();
        if (this.previewAura) this.previewAura.destroy();

        generateCustomSprite(this, { ...builderData.base, key: 'custom_preview', customData: customData });

        this.createAnim('custom_preview_idle', 'custom_preview', 0, 3, 10, -1);

        
        this.previewAura = this.add.ellipse(700, 250, 150, 250, builderData.auraColor).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);
        this.previewSprite = this.add.sprite(700, 250, 'custom_preview').setScale(3.5);
        if (this.textures.exists('custom_preview')) {
            this.previewSprite.play(`custom_preview_idle`);
        }
    };

    // Name Editor
    const y0 = 90;
    const nameTxt = this.add.text(250, y0, `Nome: ${builderData.name}`, { fontSize: '24px', fontFamily: "system-ui", color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const editNameBtn = this.add.rectangle(420, y0, 80, 30, 0x34495e).setInteractive({useHandCursor:true});
    this.add.text(420, y0, 'EDITAR', { fontSize: '14px', fontFamily: 'system-ui' }).setOrigin(0.5);
    
    // Add hover effects for the button
    editNameBtn.on('pointerover', () => editNameBtn.setFillStyle(0x2980b9));
    editNameBtn.on('pointerout', () => editNameBtn.setFillStyle(0x34495e));

    editNameBtn.on('pointerdown', () => {
        // Dispatch event to React overlay instead of using prompt() which may not work in iframe
        window.dispatchEvent(new CustomEvent('request-text-input', {
            detail: {
                title: 'Digite o nome do seu guerreiro:',
                currentValue: builderData.name,
                onComplete: (newName: string) => {
                    if (newName && newName.trim().length > 0) {
                        builderData.name = newName.substring(0, 15);
                        nameTxt.setText(`Nome: ${builderData.name}`);
                    }
                }
            }
        }));
    });

    const addArrowBtn = (x: number, y: number, text: string, onClick: () => void) => {
        const btn = this.add.text(x, y, text, { fontSize: '28px', color: '#3498db', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({useHandCursor: true})
            .on('pointerdown', onClick)
            .on('pointerover', () => btn.setColor('#f1c40f').setScale(1.2))
            .on('pointerout', () => btn.setColor('#3498db').setScale(1));
        return btn;
    };

    // Layout Constants
    const col1X = 160;
    const col2X = 440;
    const arrowDist = 130;

    // Head Part
    const y1 = 130;
    const baseTxt = this.add.text(col2X, y1, `Cabeça: ${this.partOptions.head[this.style_idx.head]}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col2X - arrowDist, y1, '<', () => { this.style_idx.head = (this.style_idx.head - 1 + this.partOptions.head.length) % this.partOptions.head.length; updatePreview(); });
    addArrowBtn(col2X + arrowDist, y1, '>', () => { this.style_idx.head = (this.style_idx.head + 1) % this.partOptions.head.length; updatePreview(); });

    // Aura Color Selector
    const auraTxt = this.add.text(col1X, y1, `Aura: ${getColorName(builderData.auraColor)}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col1X - arrowDist, y1, '<', () => { this.currentColorIndex = (this.currentColorIndex - 1 + this.auraColors.length) % this.auraColors.length; updatePreview(); });
    addArrowBtn(col1X + arrowDist, y1, '>', () => { this.currentColorIndex = (this.currentColorIndex + 1) % this.auraColors.length; updatePreview(); });

    // Torso Part
    const y2 = 170;
    const torsoTxt = this.add.text(col2X, y2, `Tronco: ${this.partOptions.torso[this.style_idx.torso]}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col2X - arrowDist, y2, '<', () => { this.style_idx.torso = (this.style_idx.torso - 1 + this.partOptions.torso.length) % this.partOptions.torso.length; updatePreview(); });
    addArrowBtn(col2X + arrowDist, y2, '>', () => { this.style_idx.torso = (this.style_idx.torso + 1) % this.partOptions.torso.length; updatePreview(); });

    // GI 1 color
    const gi1Txt = this.add.text(col1X, y2, `Roupa 1: ${getColorName(this.giColors[this.p_idx.gi1])}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col1X - arrowDist, y2, '<', () => { this.p_idx.gi1 = (this.p_idx.gi1 - 1 + this.giColors.length) % this.giColors.length; updatePreview(); });
    addArrowBtn(col1X + arrowDist, y2, '>', () => { this.p_idx.gi1 = (this.p_idx.gi1 + 1) % this.giColors.length; updatePreview(); });

    // Legs Part
    const y3 = 210;
    const legsTxt = this.add.text(col2X, y3, `Calça: ${this.partOptions.legs[this.style_idx.legs]}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col2X - arrowDist, y3, '<', () => { this.style_idx.legs = (this.style_idx.legs - 1 + this.partOptions.legs.length) % this.partOptions.legs.length; updatePreview(); });
    addArrowBtn(col2X + arrowDist, y3, '>', () => { this.style_idx.legs = (this.style_idx.legs + 1) % this.partOptions.legs.length; updatePreview(); });

    // GI 2 color
    const gi2Txt = this.add.text(col1X, y3, `Roupa 2: ${getColorName(this.giColors[this.p_idx.gi2])}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col1X - arrowDist, y3, '<', () => { this.p_idx.gi2 = (this.p_idx.gi2 - 1 + this.giColors.length) % this.giColors.length; updatePreview(); });
    addArrowBtn(col1X + arrowDist, y3, '>', () => { this.p_idx.gi2 = (this.p_idx.gi2 + 1) % this.giColors.length; updatePreview(); });

    // Feet Part
    const y4 = 250;
    const feetTxt = this.add.text(col2X, y4, `Botas: ${this.partOptions.feet[this.style_idx.feet]}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col2X - arrowDist, y4, '<', () => { this.style_idx.feet = (this.style_idx.feet - 1 + this.partOptions.feet.length) % this.partOptions.feet.length; updatePreview(); });
    addArrowBtn(col2X + arrowDist, y4, '>', () => { this.style_idx.feet = (this.style_idx.feet + 1) % this.partOptions.feet.length; updatePreview(); });

    // Skin color
    const skinTxt = this.add.text(col1X, y4, `Pele: ${getColorName(this.skinColors[this.p_idx.skin])}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col1X - arrowDist, y4, '<', () => { this.p_idx.skin = (this.p_idx.skin - 1 + this.skinColors.length) % this.skinColors.length; updatePreview(); });
    addArrowBtn(col1X + arrowDist, y4, '>', () => { this.p_idx.skin = (this.p_idx.skin + 1) % this.skinColors.length; updatePreview(); });

    // Accessory Part
    const y5 = 290;
    const accTxt = this.add.text(col2X, y5, `Acessório: ${this.partOptions.accessory[this.style_idx.accessory]}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col2X - arrowDist, y5, '<', () => { this.style_idx.accessory = (this.style_idx.accessory - 1 + this.partOptions.accessory.length) % this.partOptions.accessory.length; updatePreview(); });
    addArrowBtn(col2X + arrowDist, y5, '>', () => { this.style_idx.accessory = (this.style_idx.accessory + 1) % this.partOptions.accessory.length; updatePreview(); });

    // Hair color
    const hairTxt = this.add.text(col1X, y5, `Cabelo: ${getColorName(this.hairColors[this.p_idx.hair])}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0.5);
    addArrowBtn(col1X - arrowDist, y5, '<', () => { this.p_idx.hair = (this.p_idx.hair - 1 + this.hairColors.length) % this.hairColors.length; updatePreview(); });
    addArrowBtn(col1X + arrowDist, y5, '>', () => { this.p_idx.hair = (this.p_idx.hair + 1) % this.hairColors.length; updatePreview(); });

    const AVAILABLE_SPECIALS = [
      { id: 'goku', name: 'Kamehameha' },
      { id: 'vegeta', name: 'Galick Gun' },
      { id: 'piccolo', name: 'Makankosappo' },
      { id: 'gohan', name: 'Masenko' },
      { id: 'naruto', name: 'Rasengan' },
      { id: 'gojo', name: 'Vazio Roxo' },
      { id: 'saitama', name: 'Soco Sério' },
      { id: 'spiderman', name: 'Teia de Aranha' },
      { id: 'cyberninja', name: 'Plasma Dash' },
      { id: 'thukuna', name: 'Flecha de Fogo' },
      { id: 'jotaro', name: 'Ora Ora' }
    ];

    const AVAILABLE_SUPERS = [
      { id: 'goku', name: 'Genki Dama' },
      { id: 'vegeta', name: 'Final Flash' },
      { id: 'piccolo', name: 'Hellzone Grenade' },
      { id: 'gohan', name: 'Kamehameha Pai-Filho' },
      { id: 'naruto', name: 'Rasenshuriken' },
      { id: 'gojo', name: 'Expansão de Domínio' },
      { id: 'saitama', name: 'Soco Muito Sério' },
      { id: 'madara', name: 'Meteoro' },
      { id: 'thukuna', name: 'Santuário Malevolente' },
      { id: 'cyberninja', name: 'Cyber Overdrive' },
      { id: 'jotaro', name: 'Star Platinum: Za Warudo' }
    ];

    const showAttackSelectModal = (isSuper: boolean, onSelect: (id: string, name: string) => void) => {
        const bg = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.8).setInteractive();
        const panel = this.add.rectangle(480, 270, 400, 480, 0x2c3e50).setStrokeStyle(4, 0x34495e);
        const title = this.add.text(480, 60, isSuper ? 'Selecionar Especial 2 (Super)' : 'Selecionar Especial 1', { fontSize: '24px', fontStyle: 'bold', fontFamily: "system-ui" }).setOrigin(0.5);
        
        const listContainer = this.add.container(280, 100);
        const list = isSuper ? AVAILABLE_SUPERS : AVAILABLE_SPECIALS;
        
        list.forEach((atk, i) => {
            const btn = this.add.rectangle(200, i * 35, 350, 30, 0x34495e).setInteractive({useHandCursor: true});
            const txt = this.add.text(200, i * 35, atk.name, { fontSize: '16px', fontFamily: 'system-ui' }).setOrigin(0.5);
            
            btn.on('pointerover', () => btn.setFillStyle(0x2980b9));
            btn.on('pointerout', () => btn.setFillStyle(0x34495e));
            btn.on('pointerdown', () => {
                onSelect(atk.id, atk.name);
                bg.destroy();
                panel.destroy();
                title.destroy();
                listContainer.destroy();
                cancelBtn.destroy();
                cancelTxt.destroy();
            });
            
            listContainer.add([btn, txt]);
        });
        
        const cancelBtn = this.add.rectangle(480, 490, 200, 30, 0xe74c3c).setInteractive({useHandCursor: true});
        const cancelTxt = this.add.text(480, 490, 'CANCELAR', { fontSize: '18px', fontStyle: 'bold', fontFamily: 'system-ui' }).setOrigin(0.5);
        cancelBtn.on('pointerdown', () => {
            bg.destroy(); panel.destroy(); title.destroy(); listContainer.destroy(); cancelBtn.destroy(); cancelTxt.destroy();
        });
    };

    // Specials Edit
    const special1Txt = this.add.text(180, 360, `Especial 1: ${this.customSp1Name || builderData.base.specialName}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0, 0.5);
    const editSp1Btn = this.add.rectangle(450, 360, 100, 30, 0x34495e).setInteractive({useHandCursor:true});
    this.add.text(450, 360, 'SELECIONAR', { fontSize: '12px', fontStyle: 'bold', fontFamily: 'system-ui' }).setOrigin(0.5);
    
    editSp1Btn.on('pointerover', () => editSp1Btn.setFillStyle(0x2980b9));
    editSp1Btn.on('pointerout', () => editSp1Btn.setFillStyle(0x34495e));

    editSp1Btn.on('pointerdown', () => {
        showAttackSelectModal(false, (id, name) => {
            this.customSp1Id = id;
            this.customSp1Name = name;
            special1Txt.setText(`Especial 1: ${name}`);
            updatePreview();
        });
    });

    const special2Txt = this.add.text(180, 400, `Especial 2: ${this.customSp2Name || builderData.base.superName}`, { fontSize: '20px', fontFamily: "system-ui", color: '#fff' }).setOrigin(0, 0.5);
    const editSp2Btn = this.add.rectangle(450, 400, 100, 30, 0x34495e).setInteractive({useHandCursor:true});
    this.add.text(450, 400, 'SELECIONAR', { fontSize: '12px', fontStyle: 'bold', fontFamily: 'system-ui' }).setOrigin(0.5);

    editSp2Btn.on('pointerover', () => editSp2Btn.setFillStyle(0x2980b9));
    editSp2Btn.on('pointerout', () => editSp2Btn.setFillStyle(0x34495e));

    editSp2Btn.on('pointerdown', () => {
        showAttackSelectModal(true, (id, name) => {
            this.customSp2Id = id;
            this.customSp2Name = name;
            special2Txt.setText(`Especial 2: ${name}`);
            updatePreview();
        });
    });

    // Save Button
    const saveBtn = this.add.rectangle(300, 470, 350, 50, 0x27ae60).setStrokeStyle(2, 0xffffff);
    const saveTxt = this.add.text(300, 470, 'SALVAR & EQUIPAR PERSONALIZADO', { fontSize: '18px', fontStyle: 'bold', color: '#000', fontFamily: "system-ui, sans-serif" }).setOrigin(0.5);
    
    saveBtn.setInteractive({useHandCursor: true})
        .on('pointerover', () => saveBtn.setFillStyle(0x2ecc71))
        .on('pointerout', () => saveBtn.setFillStyle(0x27ae60))
        .on('pointerdown', () => {
       const customChar: CharacterData = {
           ...builderData.base,
           id: 999,
           key: 'custom_999',
           baseKey: builderData.base.key,
           name: builderData.name,
           specialColor: builderData.auraColor,
           specialName: this.customSp1Name || builderData.base.specialName,
           superName: this.customSp2Name || builderData.base.superName,
           price: 0,
           unlocked: true,
           customData: {
               gi1: this.giColors[this.p_idx.gi1],
               gi2: this.giColors[this.p_idx.gi2],
               skin: this.skinColors[this.p_idx.skin],
               hair: this.hairColors[this.p_idx.hair],
               sp1_id: this.customSp1Id || builderData.base.key,
               sp2_id: this.customSp2Id || builderData.base.key,
               part_head: this.partOptions.head[this.style_idx.head],
               part_torso: this.partOptions.torso[this.style_idx.torso],
               part_legs: this.partOptions.legs[this.style_idx.legs],
               part_feet: this.partOptions.feet[this.style_idx.feet],
               part_accessory: this.partOptions.accessory[this.style_idx.accessory]
           }
       };

       generateCustomSprite(this, customChar);
       
       const createAllForTex = (baseKey: string, texKey: string) => {
         this.createAnim(`${baseKey}_idle`, texKey, 0, 3, 10);
         this.createAnim(`${baseKey}_walk`, texKey, 4, 7, 12);
         this.createAnim(`${baseKey}_attack`, texKey, 8, 9, 16, 0);
         this.createAnim(`${baseKey}_special`, texKey, 8, 9, 12, -1);
         this.createAnim(`${baseKey}_defend`, texKey, 10, 10, 10, -1);
         this.createAnim(`${baseKey}_transform`, texKey, 0, 3, 24, -1);
         this.createAnim(`${baseKey}_charge`, texKey, 11, 11, 10, -1);
       };
       createAllForTex('custom_999', 'custom_999');
       createAllForTex('custom_999_ssj', 'custom_999_ssj');
       createAllForTex('custom_999_ui', 'custom_999_ui');

       const gameState = this.registry.get('gameState');
       if (gameState) {
           // Remove existing custom character if any
           gameState.characters = gameState.characters.filter((c: CharacterData) => c.id !== 999);
           gameState.characters.push(customChar);
           gameState.p1CharacterId = 999;
           this.registry.set('gameState', gameState);
           
           if(window.UTLW) window.UTLW.save(); // trigger save
       }
       
       const confirmTxt = this.add.text(250, 350, 'Equipado como Player 1!', { color: '#00ff00', fontSize: '18px', fontStyle: 'bold', fontFamily: "system-ui" }).setOrigin(0.5);
       this.tweens.add({ targets: confirmTxt, alpha: 0, y: 320, duration: 2000, onComplete: () => confirmTxt.destroy() });
    });
    
    // Character Preview Box
    this.add.rectangle(700, 280, 300, 360, 0x1a1a24).setStrokeStyle(2, 0x34495e);
    this.add.text(700, 130, 'PREVIEW', { fontSize: '24px', fontStyle: 'bold', color: '#3498db' }).setOrigin(0.5);
    
    updatePreview();
  }
}

