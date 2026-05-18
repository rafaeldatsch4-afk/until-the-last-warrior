
import Phaser from 'phaser';
import { GameState } from '../types';

export default class StoreScene extends Phaser.Scene {
  declare registry: Phaser.Data.DataManager;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare sound: Phaser.Sound.NoAudioSoundManager | Phaser.Sound.HTML5AudioSoundManager | Phaser.Sound.WebAudioSoundManager;
  declare scene: Phaser.Scenes.ScenePlugin;
  declare make: Phaser.GameObjects.GameObjectCreator;
  declare input: Phaser.Input.InputPlugin;
  declare time: Phaser.Time.Clock;
  declare tweens: Phaser.Tweens.TweenManager;
  declare events: Phaser.Events.EventEmitter;
  declare cache: Phaser.Cache.CacheManager;

  private coinsText!: Phaser.GameObjects.Text;
  private itemContainers: Phaser.GameObjects.Container[] = [];
  
  // Scroll variables
  private listContainer!: Phaser.GameObjects.Container;
  private scrollYPos: number = 0;
  private contentHeight: number = 0;
  private visibleArea = { y: 100, height: 420 }; // Top header is ~100px
  private scrollBarThumb!: Phaser.GameObjects.Rectangle;
  private scrollBarTrack!: Phaser.GameObjects.Rectangle;

  // Selection Logic
  private selectedIndex: number = 0;
  private selectionRect!: Phaser.GameObjects.Rectangle;

  // Input keys
  private keys!: any;

  constructor() {
    super('StoreScene');
  }

  create() {
    const state = this.registry.get('gameState') as GameState;

    this.add.rectangle(480, 270, 960, 540, 0x0c141f);
    
    // Add postFX to main camera
    if (this.cameras.main.postFX) {
        this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
        const cm = this.cameras.main.postFX.addColorMatrix();
        // saturation removed
    }
    
    // --- Static Header ---
    // Back Button (Top Left)
    const backContainer = this.add.container(80, 40);
    const backBtn = this.add.rectangle(0, 0, 100, 40, 0xe74c3c).setStrokeStyle(2, 0xffffff);
    const backTxt = this.add.text(0, 0, 'BACK', { fontSize: '18px', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);
    backContainer.add([backBtn, backTxt]);
    
    backBtn.setInteractive({ useHandCursor: true })
        .on('pointerover', () => backBtn.setFillStyle(0xc0392b))
        .on('pointerout', () => backBtn.setFillStyle(0xe74c3c))
        .on('pointerdown', () => {
            this.sound.play('sfx_select');
            this.scene.start('MenuScene');
        });

    this.add.text(480, 40, 'WARRIOR STORE', { fontSize: '32px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial Black' }).setOrigin(0.5);
    this.coinsText = this.add.text(920, 40, `COINS: ${state.coins}`, { fontSize: '24px', color: '#ffd54a', fontStyle: 'bold' }).setOrigin(1, 0.5);
    
    // Info Text about controls
    this.add.text(480, 85, 'Nav: WASD / Arrows | Buy: SPACE / ENTER', { fontSize: '14px', color: '#888888' }).setOrigin(0.5);

    // --- Scrollable Content Setup ---
    this.listContainer = this.add.container(0, this.visibleArea.y);
    
    // Mask logic
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, this.visibleArea.y, 960, this.visibleArea.height);
    const mask = maskShape.createGeometryMask();
    this.listContainer.setMask(mask);

    // Selection Highlight
    this.selectionRect = this.add.rectangle(0, 0, 290, 150, 0xffd700, 0)
        .setStrokeStyle(4, 0xffd700)
        .setVisible(false);
    this.listContainer.add(this.selectionRect); // Add to container so it scrolls

    // Scrollbar UI
    const trackX = 945;
    const trackY = this.visibleArea.y + this.visibleArea.height / 2;
    this.scrollBarTrack = this.add.rectangle(trackX, trackY, 10, this.visibleArea.height, 0x222222).setDepth(10);
    this.scrollBarThumb = this.add.rectangle(trackX, this.visibleArea.y + 40, 10, 80, 0x666666).setDepth(11);
    this.scrollBarThumb.setInteractive({ draggable: true });

    let isDraggingList = false;
    let dragStartY = 0;
    let startScrollY = 0;
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.x < 900) { // Dragging anywhere in the list area
            isDraggingList = true;
            dragStartY = pointer.y;
            startScrollY = this.scrollYPos;
        }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (isDraggingList && pointer.isDown) {
            const deltaY = dragStartY - pointer.y;
            this.updateScrollFromTouch(startScrollY + deltaY);
        }
    });

    this.input.on('pointerup', () => {
        isDraggingList = false;
    });

    // Scroll Events (Mouse)
    const wheelHandler = (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
        this.updateScroll(deltaY);
    };
    this.input.on('wheel', wheelHandler);

    this.input.setDraggable(this.scrollBarThumb);
    this.input.on('drag', (pointer: any, gameObject: any, dragX: number, dragY: number) => {
        if (gameObject === this.scrollBarThumb) {
            const trackTop = this.visibleArea.y;
            const trackBottom = this.visibleArea.y + this.visibleArea.height;
            const thumbHeight = this.scrollBarThumb.height;
            
            // Clamp Y
            const minY = trackTop + thumbHeight / 2;
            const maxY = trackBottom - thumbHeight / 2;
            const newY = Phaser.Math.Clamp(dragY, minY, maxY);
            
            this.scrollBarThumb.y = newY;
            
            // Map position to scrollY
            const percent = (newY - minY) / (maxY - minY);
            const maxContentScroll = Math.max(0, this.contentHeight - this.visibleArea.height);
            this.scrollYPos = percent * maxContentScroll;
            this.listContainer.y = this.visibleArea.y - this.scrollYPos;
        }
    });

    // Clean up event listeners when scene is shut down
    this.events.on('shutdown', () => {
        this.input.off('wheel', wheelHandler);
    });

    // Keyboard Inputs (Standard WASD + Arrows for P2 support)
    if (this.input.keyboard) {
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            upAlt: Phaser.Input.Keyboard.KeyCodes.UP,
            downAlt: Phaser.Input.Keyboard.KeyCodes.DOWN,
            leftAlt: Phaser.Input.Keyboard.KeyCodes.LEFT,
            rightAlt: Phaser.Input.Keyboard.KeyCodes.RIGHT
        });
    }

    this.renderItems(state);
    this.updateSelectionHighlight();
  }

  update(time: number, delta: number) {
      if (!this.keys) return;

      if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.upAlt)) {
          this.moveSelection(-3); // Move up a row (3 cols)
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.down) || Phaser.Input.Keyboard.JustDown(this.keys.downAlt)) {
          this.moveSelection(3); // Move down a row
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.left) || Phaser.Input.Keyboard.JustDown(this.keys.leftAlt)) {
          this.moveSelection(-1);
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.right) || Phaser.Input.Keyboard.JustDown(this.keys.rightAlt)) {
          this.moveSelection(1);
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
          this.buySelected();
      }
  }

  moveSelection(delta: number) {
      const state = this.registry.get('gameState') as GameState;
      const count = state.characters.length;
      
      let newIndex = this.selectedIndex + delta;
      
      // Simple clamping
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= count) newIndex = count - 1;
      
      if (newIndex !== this.selectedIndex) {
          this.selectedIndex = newIndex;
          if(this.cache.audio.exists('sfx_select')) this.sound.play('sfx_select');
          this.updateSelectionHighlight();
          this.scrollToSelection();
      }
  }

  updateSelectionHighlight() {
      if (!this.itemContainers[this.selectedIndex]) return;
      
      const target = this.itemContainers[this.selectedIndex];
      this.selectionRect.setPosition(target.x, target.y);
      this.selectionRect.setVisible(true);
      
      // Bring selection box to top of container logic if needed, but it's already in listContainer
      this.listContainer.bringToTop(this.selectionRect);
  }

  scrollToSelection() {
      const target = this.itemContainers[this.selectedIndex];
      // Item Top Y relative to list start (0)
      const itemTop = target.y - 70; // Half height (140/2)
      const itemBottom = target.y + 70;

      // Current visible window relative to list start: [scrollYPos, scrollYPos + visibleHeight]
      const visibleTop = this.scrollYPos;
      const visibleBottom = this.scrollYPos + this.visibleArea.height;

      if (itemTop < visibleTop) {
          // Scroll Up
          this.scrollYPos = Math.max(0, itemTop - 10);
      } else if (itemBottom > visibleBottom) {
          // Scroll Down
          this.scrollYPos = Math.min(this.contentHeight - this.visibleArea.height, itemBottom - this.visibleArea.height + 10);
      }
      
      // Apply
      this.listContainer.y = this.visibleArea.y - this.scrollYPos;
      this.updateScrollBarPosition();
  }

  buySelected() {
      const state = this.registry.get('gameState') as GameState;
      const char = state.characters[this.selectedIndex];
      this.attemptBuy(char);
  }

  attemptBuy(char: any) {
      const state = this.registry.get('gameState') as GameState;
      
      if (char.unlocked) return; // Already owned

      if (state.coins >= char.price) {
          this.sound.play('sfx_select');
          state.coins -= char.price;
          char.unlocked = true;
          
          window.UTLW.save(); 
          this.showSaveIndicator();

          this.coinsText.setText(`COINS: ${state.coins}`);
          this.renderItems(state);
          this.updateSelectionHighlight(); // Re-render kills reference? No, containers recreated
      } else {
          this.sound.play('sfx_error');
          // Visual feedback on selected item?
          const container = this.itemContainers[this.selectedIndex];
          this.tweens.add({ targets: container, x: container.x + 10, duration: 50, yoyo: true, repeat: 3 });
      }
  }

  updateScroll(delta: number) {
      const maxScroll = Math.max(0, this.contentHeight - this.visibleArea.height);
      if (maxScroll <= 0) return;

      this.scrollYPos = Phaser.Math.Clamp(this.scrollYPos + delta, 0, maxScroll);
      this.listContainer.y = this.visibleArea.y - this.scrollYPos;
      
      this.updateScrollBarPosition();
  }

  private updateScrollFromTouch(newY: number) {
      const maxScroll = Math.max(0, this.contentHeight - this.visibleArea.height);
      if (maxScroll <= 0) return;

      this.scrollYPos = Phaser.Math.Clamp(newY, 0, maxScroll);
      this.listContainer.y = this.visibleArea.y - this.scrollYPos;
      
      this.updateScrollBarPosition();
  }

  updateScrollBarPosition() {
      const maxScroll = Math.max(0, this.contentHeight - this.visibleArea.height);
      if (maxScroll <= 0) {
          this.scrollBarThumb.setVisible(false);
          return;
      }
      this.scrollBarThumb.setVisible(true);
      
      const percent = this.scrollYPos / maxScroll;
      
      const trackTop = this.visibleArea.y;
      const trackBottom = this.visibleArea.y + this.visibleArea.height;
      const thumbHeight = this.scrollBarThumb.height;
      
      const minY = trackTop + thumbHeight / 2;
      const maxY = trackBottom - thumbHeight / 2;
      
      this.scrollBarThumb.y = minY + percent * (maxY - minY);
  }

  renderItems(state: GameState) {
    this.itemContainers.forEach(c => c.destroy());
    this.itemContainers = [];

    const startY = 80; // Initial offset inside container
    const rowHeight = 180;
    const colWidth = 300;
    const cols = 3;

    state.characters.forEach((char, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const x = 180 + col * colWidth;
        const y = startY + row * rowHeight;
        
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 280, 140, 0x1a2b45).setStrokeStyle(3, 0x3a4866);
        
        // Fix: Position at -70 to offset the bottom-heavy sprite drawing
        // Use frame 0 explicitly to ensure correct render
        const sprite = this.add.sprite(-80, -70, char.key, 0).setScale(2);
        
        if (this.anims.exists(`${char.key}_idle`)) {
            sprite.play(`${char.key}_idle`, true);
        }
        
        const name = this.add.text(40, -35, char.name.toUpperCase(), { fontSize: '24px', fontStyle: 'bold', fontFamily: 'Arial Black' }).setOrigin(0.5);
        
        const special = this.add.text(40, -10, `50%: ${char.specialName}`, { fontSize: '12px', color: '#aaa', fontStyle: 'italic' }).setOrigin(0.5);
        const superAttack = this.add.text(40, 5, `100%: ${char.superName}`, { fontSize: '12px', color: '#ffd700', fontStyle: 'italic' }).setOrigin(0.5);

        container.add([bg, sprite, name, special, superAttack]);

        if (char.unlocked) {
            const status = this.add.text(40, 30, 'OWNED', { fontSize: '20px', color: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);
            container.add(status);
        } else {
            const btnBg = this.add.rectangle(40, 30, 140, 40, 0xd35400);
            const btnTxt = this.add.text(40, 30, `${char.price} G`, { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
            
            // Buy Button Interaction
            btnBg.setInteractive({ useHandCursor: true })
                .on('pointerup', () => {
                    // If we dragged more than a few pixels, cancel the buy because it was a swipe
                    if (Math.abs(this.input.activePointer.y - this.input.activePointer.downY) > 10) return;
                    
                    this.selectedIndex = index; // Sync selection
                    this.updateSelectionHighlight();
                    this.attemptBuy(char);
                });
            container.add([btnBg, btnTxt]);
        }
        
        this.listContainer.add(container);
        this.itemContainers.push(container);
    });

    // Re-add selection rect to top so it draws over new items
    this.listContainer.bringToTop(this.selectionRect);

    // Calculate total height
    const rows = Math.ceil(state.characters.length / cols);
    this.contentHeight = startY + rows * rowHeight;
    
    this.updateScrollBarPosition();
  }

  showSaveIndicator() {
      const txt = this.add.text(920, 80, 'SAVED!', { fontSize: '16px', color: '#00ff00', fontStyle: 'bold' }).setOrigin(1, 0.5);
      this.tweens.add({
          targets: txt,
          y: 70,
          alpha: 0,
          duration: 1500,
          onComplete: () => txt.destroy()
      });
  }
}
