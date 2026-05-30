import Phaser from "phaser";
import { GameState } from "../types";
import { auth } from "../../firebase/init";
import { MultiplayerManager } from "../systems/MultiplayerManager";

export default class MultiplayerLobbyScene extends Phaser.Scene {
  private gameState!: GameState;
  private statusText!: Phaser.GameObjects.Text;
  private roomCodeText!: Phaser.GameObjects.Text;
  private lobbyCard!: Phaser.GameObjects.Container;
  private currentMode: "menu" | "waiting" | "typing" = "menu";
  
  // Interactive room code typing state
  private typedCode: string = "";
  private typingTextObj?: Phaser.GameObjects.Text;

  constructor() {
    super("MultiplayerLobbyScene");
  }

  create() {
    this.gameState = this.registry.get("gameState") as GameState;
    this.currentMode = "menu";
    this.typedCode = "";

    // Stop and play menus BGM
    if(this.cache.audio.exists("bgm_battle")) {
      this.sound.stopByKey("bgm_battle");
    }
    if(this.cache.audio.exists("bgm_menu")) {
      let isPlaying = false;
      this.sound.getAll("bgm_menu").forEach(s => { if (s.isPlaying) isPlaying = true; });
      if (!isPlaying) {
        this.sound.play("bgm_menu", { loop: true, volume: 0.5 });
      }
    }

    const { width, height } = this.cameras.main;

    // Background Gradient (Cyberpunk Cosmic Style)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0e081c, 0x1f0f3d, 0x05030a, 0x120a24, 1);
    bg.fillRect(0, 0, width, height);

    // Dynamic particle nodes
    for (let i = 0; i < 15; i++) {
      const circle = this.add.circle(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(50, height - 50),
        Phaser.Math.FloatBetween(2, 4),
        0x9b59b6,
        Phaser.Math.FloatBetween(0.1, 0.4)
      );
      this.tweens.add({
        targets: circle,
        scaleY: circle.scaleY * 2,
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut"
      });
    }

    // Modern Header Title
    const title = this.add.text(width / 2, 70, "ARENA ONLINE", {
      fontSize: "46px",
      fontFamily: "Impact, sans-serif",
      color: "#ffd54a",
      stroke: "#000000",
      strokeThickness: 8,
      shadow: { color: "#e74c3c", blur: 10, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: 65,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Main UI container cards
    this.lobbyCard = this.add.container(width / 2, height / 2 + 20);
    this.drawMainMenu();

    // Back / Exit Button
    this.createBackBtn(120, 50, "VOLTAR", () => {
      MultiplayerManager.getInstance().leaveLobby();
      MultiplayerManager.getInstance().disconnect();
      this.scene.start("CharacterSelectScene");
    });
  }

  // Get nickname based on login displayName or default template
  private getPlayerName(): string {
    const authUser = auth.currentUser;
    if (authUser?.displayName) {
      return authUser.displayName;
    }
    if (authUser?.email) {
      return authUser.email.split("@")[0];
    }
    // Random default warrior name
    return "Saiya_" + Phaser.Math.Between(100, 999);
  }

  // Lobby Menu Layout
  private drawMainMenu() {
    this.lobbyCard.removeAll(true);
    this.currentMode = "menu";

    const cardBg = this.add.rectangle(0, 0, 560, 320, 0x111625, 0.8)
      .setStrokeStyle(3, 0x3498db)
      .setOrigin(0.5);
    
    const banner = this.add.rectangle(0, -125, 560, 40, 0x1a2238)
      .setOrigin(0.5);
    
    const bannerTxt = this.add.text(0, -125, `GUERREIRO: ${this.getPlayerName().toUpperCase()}`, {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#2ecc71",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.lobbyCard.add([cardBg, banner, bannerTxt]);

    const selectChar = this.gameState.characters.find(c => c.id === this.gameState.p1CharacterId);
    const fighterName = selectChar ? selectChar.name : "Desconhecido";

    const characterText = this.add.text(0, -80, `Lutador Escolhido: ${fighterName.toUpperCase()}`, {
      fontSize: "18px",
      fontFamily: "Impact, sans-serif",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.lobbyCard.add(characterText);

    // BUTTON 1: QUICK MATCHMAKING
    const btnQuick = this.createInteractiveButton(0, -25, 420, 46, "PROCURAR OPONENTE", 0x27ae60, () => {
      this.startQuickMatchmaking();
    });

    // BUTTON 2: CREATE PRIVATE ROOM
    const btnCreate = this.createInteractiveButton(0, 35, 420, 46, "CRIAR SALA PRIVADA", 0x2980b9, () => {
      this.startCreatePrivate();
    });

    // BUTTON 3: JOIN PRIVATE ROOM
    const btnJoin = this.createInteractiveButton(0, 95, 420, 46, "ENTRAR EM SALA PRIVADA", 0x8e44ad, () => {
      this.drawTypingMenu();
    });

    this.lobbyCard.add([btnQuick, btnCreate, btnJoin]);
  }

  // Draw typing menu for Entering passcode on screen or physically
  private drawTypingMenu() {
    this.lobbyCard.removeAll(true);
    this.currentMode = "typing";
    this.typedCode = "";

    const cardBg = this.add.rectangle(0, 0, 560, 480, 0x111625, 0.8)
      .setStrokeStyle(3, 0x8e44ad)
      .setOrigin(0.5);

    const titleText = this.add.text(0, -210, "ENTRAR EM SALA PRIVADA", {
      fontSize: "20px",
      fontFamily: "Impact, sans-serif",
      color: "#f1c40f"
    }).setOrigin(0.5);

    const promptText = this.add.text(0, -170, "Digite um código de 6 caracteres:", {
      fontSize: "14px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    // Virtual passcode box display
    const inputBoxImg = this.add.rectangle(0, -120, 260, 50, 0x070911)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setOrigin(0.5);

    this.typingTextObj = this.add.text(0, -120, "_ _ _ _ _ _", {
      fontSize: "26px",
      fontFamily: "monospace",
      color: "#2ecc71",
      fontStyle: "bold",
      letterSpacing: 8
    }).setOrigin(0.5);
    
    // Keypad layout
    const keys = [
      "1","2","3","4","5","6","7","8","9","0",
      "Q","W","E","R","T","Y","U","I","O","P",
      "A","S","D","F","G","H","J","K","L","<",
      "Z","X","C","V","B","N","M"
    ];

    let startX = -195;
    let startY = -60;
    
    const keyWidth = 35;
    const keyHeight = 35;
    const spacing = 8;
    
    let kx = startX;
    let ky = startY;
    let col = 0;

    const keyboardBtns: Phaser.GameObjects.Container[] = [];
    
    keys.forEach(k => {
      const isBksp = k === "<";
      const bw = isBksp ? keyWidth * 1.5 : keyWidth;
      const bColor = isBksp ? 0xc0392b : 0x34495e;
      
      const btn = this.createInteractiveButton(kx + (bw/2) - (keyWidth/2), ky, bw, keyHeight, k, bColor, () => {
        this.sound.play("sfx_select", { volume: 0.5 });
        if (isBksp) {
          this.typedCode = this.typedCode.slice(0, -1);
        } else {
          if (this.typedCode.length < 6) {
            this.typedCode += k;
          }
        }
        this.updateTypedCodeDisplay();
      });
      
      keyboardBtns.push(btn);
      
      col++;
      kx += (isBksp ? bw : keyWidth) + spacing;
      
      if (col === 10 || col === 20 || col === 30) {
        ky += keyHeight + spacing;
        kx = startX + (col === 20 ? 15 : col === 30 ? 30 : 0);
      }
    });

    const btnConfirm = this.createInteractiveButton(0, 130, 260, 40, "CONFIRMAR ENTRADA", 0x27ae60, () => {
      if (this.typedCode.length < 3) {
        promptText.setText("O código deve ter pelo menos 3 dígitos.");
        promptText.setColor("#e74c3c");
        return;
      }
      this.startJoinPrivate(this.typedCode);
    });

    const btnBack = this.createInteractiveButton(0, 185, 260, 40, "CANCELAR", 0xc0392b, () => {
      this.drawMainMenu();
    });

    this.lobbyCard.add([cardBg, titleText, promptText, inputBoxImg, this.typingTextObj, btnConfirm, btnBack, ...keyboardBtns]);

    // Setup input keyboard keybind listener for physical typing codes
    this.input.keyboard?.off("keydown");
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (this.currentMode !== "typing") return;

      if (event.key === "Backspace") {
        this.typedCode = this.typedCode.slice(0, -1);
      } else if (event.key === "Enter") {
        if (this.typedCode.length >= 3) {
          this.startJoinPrivate(this.typedCode);
        }
      } else if (event.key.length === 1 && /^[a-zA-Z0-9]$/.test(event.key)) {
        if (this.typedCode.length < 6) {
          this.typedCode += event.key.toUpperCase();
        }
      }

      this.updateTypedCodeDisplay();
    });
  }

  private updateTypedCodeDisplay() {
    if (!this.typingTextObj) return;

    if (this.typedCode === "") {
      this.typingTextObj.setText("_ _ _ _ _ _");
    } else {
      let disp = "";
      for (let i = 0; i < 6; i++) {
        if (i < this.typedCode.length) {
          disp += this.typedCode[i] + " ";
        } else {
          disp += "_ ";
        }
      }
      this.typingTextObj.setText(disp.trim());
    }
  }

  // Draw matchmaking and matchmaking queue cards
  private drawWaitingScreen(mainHeading: string, subHeading: string, showRoomCode?: string) {
    this.lobbyCard.removeAll(true);
    this.currentMode = "waiting";

    const cardBg = this.add.rectangle(0, 0, 560, 320, 0x111625, 0.8)
      .setStrokeStyle(3, 0xf1c40f) // Waiting glow yellow
      .setOrigin(0.5);

    const heading = this.add.text(0, -80, mainHeading, {
      fontSize: "24px",
      fontFamily: "Impact, sans-serif",
      color: "#f1c40f"
    }).setOrigin(0.5);

    this.statusText = this.add.text(0, -30, subHeading, {
      fontSize: "16px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.roomCodeText = this.add.text(0, 30, "", {
      fontSize: "32px",
      fontFamily: "monospace",
      color: "#2ecc71",
      fontStyle: "bold",
      shadow: { offsetY: 2, color: "#000", blur: 4, fill: true }
    }).setOrigin(0.5);

    if (showRoomCode) {
      this.roomCodeText.setText(`CÓDIGO: ${showRoomCode}`);
    }

    // Interactive animated loading dots
    const loadingDot = this.add.circle(0, 80, 8, 0x3498db);
    this.tweens.add({
      targets: loadingDot,
      x: { from: -60, to: 60 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const btnBack = this.createInteractiveButton(0, 125, 260, 42, "CANCELLAR BUSCA", 0xc0392b, () => {
      MultiplayerManager.getInstance().leaveLobby();
      this.drawMainMenu();
    });

    this.lobbyCard.add([cardBg, heading, this.statusText, this.roomCodeText, loadingDot, btnBack]);
  }

  // Hookups networking callbacks
  private setupMultiplayerCallbacks() {
    const mm = MultiplayerManager.getInstance();

    mm.onWaitingCallback = (code, isPrivate) => {
      if (isPrivate) {
        this.drawWaitingScreen("AGUARDANDO OPONENTE", "Passe o código abaixo para o seu amigo entrar:", code);
      } else {
        this.drawWaitingScreen("OPONENTE ESTÁ LONGE...", "Em fila de espera pública por um guerreiro...", code);
      }
    };

    mm.onMatchStartCallback = (data) => {
      this.tweens.killTweensOf(this);
      
      this.sound.play("sfx_select");

      // Set matched player characters and details
      this.gameState.p1CharacterId = mm.localPlayerIndex === 1 ? this.gameState.p1CharacterId : data.opponentCharacterId;
      this.gameState.p2CharacterId = mm.localPlayerIndex === 2 ? this.gameState.p1CharacterId : data.opponentCharacterId;
      
      this.registry.set("p2Name", data.opponentName);
      this.registry.set("gameState", this.gameState);

      // Play matchup alert and delay start
      this.drawMatchMatchedScreen(data.opponentName);

      this.time.delayedCall(2200, () => {
        this.scene.start("BattleScene");
      });
    };

    mm.onErrorCallback = (err) => {
      // In-game error instead of window.alert() which is blocked in iframes
      const errBox = this.add.container(480, 270).setDepth(100);
      const errBg = this.add.rectangle(0, 0, 400, 150, 0x000000, 0.9).setStrokeStyle(2, 0xe74c3c);
      const errTitle = this.add.text(0, -40, "ERRO NO SERVIDOR", { fontSize: "20px", color: "#e74c3c", fontStyle: "bold" }).setOrigin(0.5);
      const errMsg = this.add.text(0, 0, err, { fontSize: "16px", color: "#ffffff", wordWrap: { width: 360, useAdvancedWrap: true } }).setOrigin(0.5);
      
      const btnOk = this.add.rectangle(0, 50, 100, 30, 0x333333).setStrokeStyle(1, 0xffffff).setInteractive({useHandCursor:true});
      const btnOkTxt = this.add.text(0, 50, "OK", { fontSize: "16px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
      
      errBox.add([errBg, errTitle, errMsg, btnOk, btnOkTxt]);
      
      btnOk.on("pointerdown", () => {
        errBox.destroy();
        if (this.currentMode !== "typing") {
          this.drawMainMenu();
        }
      });

      if (this.currentMode === "typing") {
        this.roomCodeText?.setText("");
        // Shake lobby box
        this.tweens.add({
          targets: this.lobbyCard,
          x: this.lobbyCard.x + 10,
          duration: 50,
          yoyo: true,
          repeat: 3
        });
      } else {
        // Switch out of waiting state
        this.lobbyCard.removeAll(true);
      }
    };
  }

  // Draw clean, elegant matching complete screen
  private drawMatchMatchedScreen(opponent: string) {
    this.lobbyCard.removeAll(true);
    
    const cardBg = this.add.rectangle(0, 0, 560, 320, 0x0a1c12, 0.95)
      .setStrokeStyle(3, 0x2ecc71) // success green glow
      .setOrigin(0.5);

    const txtMatched = this.add.text(0, -70, "PARTIDA ENCONTRADA! ⚔️", {
      fontSize: "30px",
      fontFamily: "Impact, sans-serif",
      color: "#2ecc71",
      shadow: { color: "#000", blur: 4, fill: true }
    }).setOrigin(0.5);

    const txtOpp = this.add.text(0, -10, `Inimigo: ${opponent.toUpperCase()}`, {
      fontSize: "22px",
      fontFamily: "Impact, sans-serif",
      color: "#ffffff"
    }).setOrigin(0.5);

    const txtStarting = this.add.text(0, 50, "Entrando no combate agora...", {
      fontSize: "15px",
      fontStyle: "italic",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    // Glowing impact rings
    const ring = this.add.circle(0, 0, 10).setStrokeStyle(2, 0x2ecc71);
    this.tweens.add({
      targets: ring,
      scaleX: 25,
      scaleY: 25,
      alpha: 0,
      duration: 1500,
      repeat: -1
    });

    this.lobbyCard.add([cardBg, txtMatched, txtOpp, txtStarting, ring]);
  }

  // Quick Matchmaking Join Trigger
  private startQuickMatchmaking() {
    this.sound.play("sfx_select");
    this.setupMultiplayerCallbacks();
    this.drawWaitingScreen("CONECTANDO", "Estabelecendo comunicação segura com salas de batalha...");
    
    // Send state request
    MultiplayerManager.getInstance().joinMatchmaking(this.getPlayerName(), this.gameState.p1CharacterId);
  }

  // Create Private Room Code
  private startCreatePrivate() {
    this.sound.play("sfx_select");
    this.setupMultiplayerCallbacks();
    this.drawWaitingScreen("CRIANDO SESSÃO", "Gerando novos portais de combate privado...");

    // Generate random room ID (digit-hex)
    const code = Phaser.Math.Between(100000, 999999).toString();
    MultiplayerManager.getInstance().createPrivateRoom(this.getPlayerName(), this.gameState.p1CharacterId, code);
  }

  // Join Private Room Code
  private startJoinPrivate(code: string) {
    this.sound.play("sfx_select");
    this.setupMultiplayerCallbacks();
    this.drawWaitingScreen("ENTRANDO NA SALA", `Buscando portal de combate fechado: ${code.toUpperCase()}...`);

    MultiplayerManager.getInstance().joinPrivateRoom(this.getPlayerName(), this.gameState.p1CharacterId, code);
  }

  // Helper inside lobby to create nice-looking interactive buttons
  private createInteractiveButton(x: number, y: number, w: number, h: number, label: string, color: number, action: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const shadow = this.add.rectangle(4, 4, w, h, 0x000000, 0.4).setOrigin(0.5);
    const bg = this.add.rectangle(0, 0, w, h, color).setOrigin(0.5);
    const inner = this.add.rectangle(0, 0, w - 8, h - 8, 0x000000, 0.25).setOrigin(0.5);
    const txt = this.add.text(0, 0, label, {
      fontSize: "16px",
      fontStyle: "bold",
      fontFamily: "Impact, sans-serif",
      color: "#ffffff"
    }).setOrigin(0.5);

    container.add([shadow, bg, inner, txt]);

    const hitArea = this.add.rectangle(0, 0, w, h, 0, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on("pointerover", () => {
      // Glow background slightly lighter
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      const lightColor = ((Math.min(255, r + 40)) << 16) | ((Math.min(255, g + 40)) << 8) | (Math.min(255, b + 40));
      bg.setFillStyle(lightColor);
      this.tweens.add({ targets: container, scale: 1.03, duration: 100 });
    });

    hitArea.on("pointerout", () => {
      bg.setFillStyle(color);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    hitArea.on("pointerdown", () => {
      action();
    });

    return container;
  }

  private createBackBtn(x: number, y: number, text: string, onClick: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 120, 38, 0x333333).setStrokeStyle(2, 0xffffff);
    const txt = this.add.text(0, 0, text, { fontSize: "16px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    
    container.add([bg, txt]);
    
    const hitArea = this.add.rectangle(0, 0, 120, 38, 0, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on("pointerover", () => {
      bg.setFillStyle(0x555555);
      this.tweens.add({ targets: container, scale: 1.1, duration: 100 });
    });
    hitArea.on("pointerout", () => {
      bg.setFillStyle(0x333333);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    hitArea.on("pointerdown", () => {
      this.sound.play("sfx_select");
      onClick();
    });
  }
}
