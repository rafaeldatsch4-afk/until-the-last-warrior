import Phaser from "phaser";
import { auth } from "../../firebase/init";
import { CharacterData, GameState } from "../types";
import { MultiplayerManager, MatchStartData } from "../systems/MultiplayerManager";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";
import { transitionTo } from "../utils/sceneTransition";

const C = { bg: 0x080f21, panel: 0x101c32, line: 0x30425e, gold: 0xe3b663, cyan: 0x71d5e6, ink: 0x111b2c };
const FONT = "'Plus Jakarta Sans', sans-serif";
type Mode = "menu" | "typing" | "waiting" | "matched" | "error";
type Request = "quick" | "create" | "join";
interface Button { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; action: () => void; primary: boolean; enabled: boolean }

export default class MultiplayerLobbyScene extends Phaser.Scene {
  private gameState!: GameState;
  private playerName = "";
  private localCharacterId = 0;
  private currentMode: Mode = "menu";
  private root?: Phaser.GameObjects.Container;
  private buttons: Button[] = [];
  private focused = -1;
  private handledKeys = new WeakSet<KeyboardEvent>();
  private typedCode = "";
  private typingTextObj?: Phaser.GameObjects.Text;
  private typingHint?: Phaser.GameObjects.Text;
  private joinButton?: Button;
  private request?: Request;
  private waitingTitle = "";
  private waitingDetail = "";
  private privateCode = "";
  private errorMessage = "";
  private opponentName = "";
  private opponentCharacterId = 0;
  private connected = false;
  private reconnecting = false;
  private requestTimeout?: Phaser.Time.TimerEvent;
  private matchTimer?: Phaser.Time.TimerEvent;
  private resizeTimer?: Phaser.Time.TimerEvent;
  private enteringBattle = false;
  private layout = { x: 0, y: 0, w: 0, h: 0 };

  constructor() { super("MultiplayerLobbyScene"); }

  create() {
    this.gameState = this.registry.get("gameState") as GameState;
    this.localCharacterId = this.gameState.p1CharacterId;
    this.playerName = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || `Guerreiro ${Phaser.Math.Between(100, 999)}`;
    this.currentMode = "menu";
    this.typedCode = "";
    this.request = undefined;
    this.privateCode = "";
    this.errorMessage = "";
    this.handledKeys = new WeakSet<KeyboardEvent>();
    this.enteringBattle = false;
    this.root = undefined;
    const mm = MultiplayerManager.getInstance();
    this.connected = mm.isConnected;
    this.reconnecting = mm.isReconnecting;
    this.setupMultiplayerCallbacks();
    this.scale.on("resize", this.handleResize, this);
    this.input.keyboard?.on("keydown", this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.cameras.main.fadeIn(220);
    if (this.cache.audio.exists("bgm_battle")) this.sound.stopByKey("bgm_battle");
    if (this.cache.audio.exists("bgm_menu") && !this.sound.getAll("bgm_menu").some(s => s.isPlaying)) {
      this.sound.play("bgm_menu", { loop: true, volume: this.registry.get("bgmEnabled") === false ? 0 : (this.registry.get("bgmVolume") ?? 0.5) });
    }
    this.render();
    mm.connect();
  }

  private text(x: number, y: number, content: string, size = 16, color = "#edf1f8", bold = false, width?: number) {
    const t = this.add.text(x, y, content, { fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: bold ? "bold" : "normal", resolution: 3, ...(width ? { wordWrap: { width, useAdvancedWrap: true } } : {}) });
    this.root!.add(t);
    return t;
  }

  private handleResize() {
    // The parent and canvas bounds finish updating after Phaser emits resize.
    this.resizeTimer?.remove();
    this.resizeTimer = this.time.delayedCall(0, () => this.render());
  }

  private line(x: number, y: number, w: number, color = C.line, alpha = 1) {
    const rect = this.add.rectangle(x, y, w, 1, color, alpha).setOrigin(0, 0);
    this.root!.add(rect);
  }

  private button(x: number, y: number, w: number, h: number, label: string, action: () => void, primary = false, size = 14) {
    const bg = this.add.rectangle(x, y, w, h, primary ? C.gold : C.panel).setStrokeStyle(1, primary ? C.gold : C.line).setInteractive({ useHandCursor: true });
    const text = this.text(x, y, label, size, primary ? "#10192a" : "#e5eaf3", true).setOrigin(0.5);
    this.root!.addAt(bg, this.root!.length - 1);
    const b: Button = { bg, text, action, primary, enabled: true };
    this.buttons.push(b);
    bg.on("pointerover", () => { if (b.enabled) { bg.setStrokeStyle(2, C.gold); bg.setFillStyle(primary ? 0xf2ca82 : 0x1b2e49); } });
    bg.on("pointerout", () => this.paintButton(b, this.buttons[this.focused] === b));
    bg.on("pointerdown", () => { if (b.enabled) { this.selectSound(); action(); } });
    return b;
  }

  private paintButton(b: Button, focus = false) {
    b.bg.setFillStyle(b.primary ? C.gold : C.panel).setStrokeStyle(focus ? 3 : 1, focus ? C.cyan : b.primary ? C.gold : C.line);
    b.bg.setAlpha(b.enabled ? 1 : 0.4);
    b.text.setAlpha(b.enabled ? 1 : 0.5);
  }

  private render() {
    if (!this.scene.isActive()) return;
    this.tweens.killAll();
    this.root?.destroy(true);
    this.root = this.add.container(0, 0);
    this.buttons = [];
    this.focused = -1;
    this.typingTextObj = undefined;
    this.typingHint = undefined;
    this.joinButton = undefined;
    const b = ResponsiveUtils.getSafeBounds(this);
    const bg = this.add.graphics();
    bg.fillGradientStyle(C.bg, C.panel, C.bg, 0x0a1224, 1).fillRect(0, 0, 960, 540);
    bg.lineStyle(1, 0x293c56, 0.22);
    for (let x = 0; x < 960; x += 48) bg.lineBetween(x, 0, x, 540);
    for (let y = 0; y < 540; y += 48) bg.lineBetween(0, y, 960, y);
    this.root.add(bg);
    this.button(b.left + 55, b.top + 23, 110, 46, "← VOLTAR", () => this.back(), false, 13);
    this.text(b.left + 137, b.top + 1, "PVP ONLINE", 29, "#e3b663", true);
    this.text(b.left + 139, b.top + 38, this.gameState.gameMode === "ranked_pvp" ? "ARENA RANQUEADA · 1 CONTRA 1" : "A PRÓXIMA BATALHA COMEÇA AQUI", 10, "#aab9ce", true);
    const status = this.connected ? "CONECTADO" : this.reconnecting ? "RECONECTANDO" : this.errorMessage ? "SEM CONEXÃO" : "CONECTANDO";
    const color = this.connected ? "#71d5e6" : "#c3cbd8";
    this.text(b.right, b.top + 15, status, 11, color, true).setOrigin(1, 0);
    this.line(b.left, b.top + 65, b.width, C.gold, 0.5);
    this.layout = { x: b.left, y: b.top + 82, w: b.width, h: b.height - 105 };
    if (this.currentMode === "typing") this.renderTyping();
    else if (this.currentMode === "matched") this.renderMatched();
    else {
      this.renderIdentity();
      if (this.currentMode === "menu") this.renderMenu();
      else if (this.currentMode === "waiting") this.renderWaiting();
      else this.renderError();
    }
    this.text(b.left, b.bottom - 8, "ATÉ O ÚLTIMO GUERREIRO", 9, "#a7b6ca", true);
    this.text(b.right, b.bottom - 8, "ESC  VOLTAR    ·    TAB  NAVEGAR    ·    ENTER  SELECIONAR", 9, "#a7b6ca").setOrigin(1, 0);
  }

  private renderIdentity() {
    const { x, y, w, h } = this.layout;
    const width = w * 0.34;
    const g = this.add.graphics();
    g.fillStyle(0x13233b, 0.74).fillPoints([{ x, y }, { x: x + width, y }, { x: x + width - 26, y: y + h }, { x, y: y + h }], true);
    g.lineStyle(1, C.gold, 0.35).lineBetween(x, y + h, x + width - 26, y + h);
    this.root!.add(g);
    this.text(x + 22, y + 18, "SEU LUTADOR", 10, "#b5c3d7", true);
    const char = this.character(this.localCharacterId);
    this.text(x + 22, y + 36, char?.name.toUpperCase() || "GUERREIRO", 23, "#f2d39a", true, width - 40);
    this.fighter(char, x + width / 2, y + h - 56, h - 126);
    this.text(x + 22, y + h - 39, this.shortName(this.playerName), 14, "#edf1f8", true, width - 44);
    this.text(x + 22, y + h - 18, this.gameState.gameMode === "ranked_pvp" ? `${this.gameState.elo || 1000} PONTOS · RANQUEADO` : "PRONTO PARA LUTAR", 9, "#aab9ce", true);
  }

  private fighter(char: CharacterData | undefined, x: number, floor: number, height: number, flip = false) {
    const shadow = this.add.ellipse(x, floor, height * 0.73, 16, C.cyan, 0.08).setStrokeStyle(1, C.cyan, 0.25);
    this.root!.add(shadow);
    if (!char || !this.textures.exists(char.key)) return;
    const sprite = this.add.sprite(x, floor, char.key, 0).setOrigin(0.5, 0.96).setFlipX(flip);
    // Every fighter frame uses a bottom-aligned pose; scale the existing artwork without changing it.
    sprite.setScale(height / 100);
    if (this.anims.exists(`${char.key}_idle`)) sprite.play(`${char.key}_idle`);
    this.root!.add(sprite);
  }

  private actionArea() {
    const { x, y, w, h } = this.layout;
    return { x: x + w * 0.39, y, w: w * 0.61 - 18, h };
  }

  private renderMenu() {
    const { x, y, w, h } = this.actionArea();
    this.text(x, y + 13, "ENTRE NA ARENA", 26, "#f2f4f9", true);
    this.text(x, y + 54, "Encontre um adversário e leve seu guerreiro ao combate.", 14, "#b6c4d9", false, w);
    this.button(x + w / 2, y + 118, w, 58, "ENCONTRAR PARTIDA   →", () => this.startRequest("quick"), true, 17);
    const privateY = y + Math.max(178, h * 0.51);
    this.line(x, privateY, w);
    this.text(x, privateY + 17, "DESAFIE UM AMIGO", 11, "#e3b663", true);
    this.text(x, privateY + 40, "Crie uma sala privada ou use o código de quem convidou.", 12, "#b6c4d9", false, w);
    const gap = 12;
    const bw = (w - gap) / 2;
    this.button(x + bw / 2, privateY + 99, bw, 52, "CRIAR SALA", () => this.startRequest("create"));
    this.button(x + bw + gap + bw / 2, privateY + 99, bw, 52, "ENTRAR COM CÓDIGO", () => this.showTyping(), false, 12);
  }

  private showTyping() { this.currentMode = "typing"; this.render(); }

  private renderTyping() {
    const { x, y, w, h } = this.layout;
    const lw = w * 0.34;
    this.text(x + 10, y + 11, "SALA PRIVADA", 25, "#f2d39a", true);
    this.text(x + 10, y + 54, "Digite o código recebido.\nUse o teclado ou toque nas letras.", 13, "#b6c4d9", false, lw - 20);
    const codeY = y + 136;
    const codeBg = this.add.rectangle(x + lw / 2, codeY, lw - 20, 64, 0x080f21).setStrokeStyle(2, C.cyan);
    this.root!.add(codeBg);
    this.typingTextObj = this.text(x + lw / 2, codeY, "", 28, "#f7dca9", true).setOrigin(0.5);
    this.typingTextObj.setFontFamily("monospace");
    this.typingHint = this.text(x + 10, codeY + 43, "Até 6 letras ou números", 11, "#aab9ce");
    this.joinButton = this.button(x + lw / 2, y + h - 86, lw - 20, 48, "ENTRAR NA SALA   →", () => this.confirmCode(), true, 14);
    this.button(x + lw / 2, y + h - 28, lw - 20, 46, "CANCELAR", () => this.returnToMenu());
    const kx = x + lw + 35;
    const kw = w - lw - 35;
    this.text(kx, y + 11, "CÓDIGO DO CONVITE", 11, "#b6c4d9", true);
    const rows = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    const gap = 6;
    const keyW = (kw - gap * 9) / 10;
    const keyH = Math.min(54, (h - 56 - gap * 3) / 4);
    rows.forEach((row, r) => {
      const total = row.length + (r === 3 ? 2 : 0);
      const start = kx + (kw - (total * keyW + (total - 1) * gap)) / 2;
      [...row].forEach((key, c) => this.button(start + c * (keyW + gap) + keyW / 2, y + 51 + r * (keyH + gap) + keyH / 2, keyW, keyH, key, () => this.typeCharacter(key), false, 18));
      if (r === 3) this.button(start + 7 * (keyW + gap) + keyW + gap / 2, y + 51 + r * (keyH + gap) + keyH / 2, keyW * 2 + gap, keyH, "APAGAR", () => this.typeCharacter("Backspace"), false, 11);
    });
    this.updateTypedCodeDisplay();
  }

  private typeCharacter(key: string) {
    if (key === "Backspace") this.typedCode = this.typedCode.slice(0, -1);
    else if (this.typedCode.length < 6 && /^[a-z0-9]$/i.test(key)) this.typedCode += key.toUpperCase();
    this.updateTypedCodeDisplay();
  }

  private updateTypedCodeDisplay() {
    this.typingTextObj?.setText(this.typedCode.padEnd(6, "_").split("").join(" "));
    if (this.joinButton) { this.joinButton.enabled = this.typedCode.length >= 3; this.paintButton(this.joinButton, this.buttons[this.focused] === this.joinButton); }
    this.typingHint?.setText(this.typedCode.length < 3 ? "Digite o código para continuar" : "Código pronto. Confirme para entrar.");
  }

  private confirmCode() { if (this.currentMode === "typing" && this.typedCode.length >= 3) this.startRequest("join"); }

  private renderWaiting() {
    const { x, y, w, h } = this.actionArea();
    this.text(x, y + 15, this.waitingTitle, 25, "#f2d39a", true, w);
    this.text(x, y + 60, this.waitingDetail, 14, "#c1cee0", false, w);
    if (this.privateCode) {
      this.text(x, y + 122, "CÓDIGO DA SALA", 10, "#aab9ce", true);
      this.text(x, y + 145, this.privateCode.split("").join(" "), 39, "#f5d295", true).setFontFamily("monospace");
      if (navigator.clipboard?.writeText) this.button(x + w - 54, y + 168, 108, 44, "COPIAR", () => this.copyCode(), false, 12);
    } else {
      this.text(x, y + 126, this.request === "quick" ? "VOCÊ  /  ?" : "PREPARANDO A SALA", 30, "#dce6f4", true);
      this.text(x, y + 177, this.request === "quick" ? "A partida começa quando um adversário entrar." : "Aguarde a confirmação do servidor.", 12, "#aab9ce", false, w);
    }
    const progressY = y + h - 95;
    const track = this.add.rectangle(x, progressY, w, 2, C.line).setOrigin(0, 0.5);
    const pulse = this.add.rectangle(x, progressY, 62, 2, C.cyan).setOrigin(0, 0.5);
    this.root!.add([track, pulse]);
    this.tweens.add({ targets: pulse, x: x + w - 62, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.button(x + w / 2, y + h - 39, w, 50, this.request === "quick" ? "CANCELAR BUSCA" : "SAIR DA SALA", () => this.returnToMenu());
  }

  private async copyCode() {
    const code = this.privateCode;
    try {
      await navigator.clipboard.writeText(code);
      if (this.currentMode === "waiting" && this.privateCode === code) { this.waitingDetail = "Código copiado. Envie para quem vai jogar com você."; this.render(); }
    } catch {
      if (this.currentMode === "waiting" && this.privateCode === code) { this.waitingDetail = "Copie o código abaixo e envie ao seu amigo."; this.render(); }
    }
  }

  private renderError() {
    const { x, y, w, h } = this.actionArea();
    this.text(x, y + 20, "NÃO FOI POSSÍVEL ENTRAR", 24, "#f2d39a", true, w);
    this.text(x, y + 93, this.errorMessage, 16, "#e0e6f0", false, w);
    this.text(x, y + h - 157, "Você pode tentar de novo ou escolher outra partida.", 12, "#b6c4d9", false, w);
    this.button(x + w / 2, y + h - 91, w, 50, this.request === "join" ? "REVISAR CÓDIGO" : "TENTAR NOVAMENTE", () => this.request === "join" ? this.showTyping() : this.startRequest(this.request || "quick"), true);
    this.button(x + w / 2, y + h - 30, w, 46, "VOLTAR À ARENA", () => this.returnToMenu());
  }

  private renderMatched() {
    const { x, y, w, h } = this.layout;
    this.text(x + w / 2, y + 8, "ADVERSÁRIO ENCONTRADO", 25, "#f2d39a", true).setOrigin(0.5, 0);
    const left = x + w * 0.25, right = x + w * 0.75;
    this.fighter(this.character(this.localCharacterId), left, y + h - 62, h - 136);
    this.fighter(this.character(this.opponentCharacterId), right, y + h - 62, h - 136, true);
    this.text(x + w / 2, y + h * 0.48, "VS", 53, "#e3b663", true).setOrigin(0.5);
    this.text(left, y + h - 48, this.shortName(this.playerName), 17, "#edf1f8", true).setOrigin(0.5, 0);
    this.text(right, y + h - 48, this.shortName(this.opponentName), 17, "#edf1f8", true).setOrigin(0.5, 0);
    this.text(x + w / 2, y + h - 13, "PREPARE-SE · ENTRANDO NO COMBATE", 11, "#71d5e6", true).setOrigin(0.5, 0);
  }

  private setupMultiplayerCallbacks() {
    const mm = MultiplayerManager.getInstance();
    mm.onConnectionStatusCallback = status => {
      if (!this.scene.isActive()) return;
      this.connected = status === "connected";
      this.reconnecting = status === "reconnecting";
      this.render();
    };
    mm.onWaitingCallback = (code, isPrivate) => {
      if (!this.scene.isActive() || this.currentMode !== "waiting") return;
      this.requestTimeout?.remove();
      this.privateCode = isPrivate ? code : "";
      this.waitingTitle = isPrivate ? "SUA SALA ESTÁ PRONTA" : "BUSCANDO ADVERSÁRIO";
      this.waitingDetail = isPrivate ? "Envie o código abaixo para seu amigo entrar." : "Você está na fila. Seu próximo duelo está a caminho.";
      this.render();
    };
    mm.onMatchStartCallback = data => this.matchStarted(data);
    mm.onOpponentLeftCallback = () => {
      if (this.scene.isActive() && this.currentMode === "matched") this.showError("O adversário saiu antes do combate. Escolha outra partida.");
    };
    mm.onErrorCallback = message => {
      if (!this.scene.isActive()) return;
      this.connected = mm.isConnected;
      this.reconnecting = false;
      this.errorMessage = message;
      if (this.currentMode === "waiting" || this.currentMode === "matched") this.showError(message);
      else this.render();
    };
  }

  private startRequest(request: Request) {
    if (this.currentMode === "waiting" || this.currentMode === "matched") return;
    this.request = request;
    this.privateCode = "";
    this.currentMode = "waiting";
    this.errorMessage = "";
    this.waitingTitle = request === "quick" ? "PROCURANDO PARTIDA" : request === "create" ? "CRIANDO SUA SALA" : "ENTRANDO NA SALA";
    this.waitingDetail = this.connected ? "Aguardando a confirmação do servidor." : "Conectando à arena. Isso pode levar alguns segundos.";
    this.render();
    this.requestTimeout?.remove();
    this.requestTimeout = this.time.delayedCall(45000, () => this.showError("O servidor não respondeu a tempo. Tente novamente em instantes."));
    const mm = MultiplayerManager.getInstance();
    if (request === "quick") mm.joinMatchmaking(this.playerName, this.localCharacterId, this.gameState.gameMode === "ranked_pvp", this.gameState.elo || 1000);
    else if (request === "create") mm.createPrivateRoom(this.playerName, this.localCharacterId, Phaser.Math.Between(100000, 999999).toString());
    else mm.joinPrivateRoom(this.playerName, this.localCharacterId, this.typedCode);
  }

  private matchStarted(data: MatchStartData) {
    if (!this.scene.isActive() || this.currentMode !== "waiting") return;
    this.requestTimeout?.remove();
    this.currentMode = "matched";
    this.opponentName = data.opponentName;
    this.opponentCharacterId = data.opponentCharacterId;
    const mm = MultiplayerManager.getInstance();
    this.gameState.p1CharacterId = mm.localPlayerIndex === 1 ? this.localCharacterId : data.opponentCharacterId;
    this.gameState.p2CharacterId = mm.localPlayerIndex === 1 ? data.opponentCharacterId : this.localCharacterId;
    this.registry.set("p2Name", data.opponentName);
    this.registry.set("localPlayerIndex", mm.localPlayerIndex);
    this.registry.set("gameState", this.gameState);
    this.selectSound();
    this.render();
    this.matchTimer = this.time.delayedCall(2200, () => {
      this.enteringBattle = true;
      transitionTo(this, "BattleScene");
    });
  }

  private showError(message: string) {
    this.requestTimeout?.remove();
    this.matchTimer?.remove();
    this.currentMode = "error";
    this.errorMessage = message;
    // Discard buffered room requests as well as an active room so a retry is a new request.
    const mm = MultiplayerManager.getInstance();
    mm.leaveLobby();
    mm.disconnect();
    this.connected = false;
    this.reconnecting = false;
    this.restoreLocalSelection();
    this.render();
  }

  private returnToMenu() {
    this.requestTimeout?.remove();
    this.matchTimer?.remove();
    const mm = MultiplayerManager.getInstance();
    mm.leaveLobby();
    mm.disconnect();
    this.currentMode = "menu";
    this.privateCode = "";
    this.errorMessage = "";
    this.connected = false;
    this.reconnecting = false;
    this.restoreLocalSelection();
    this.render();
    mm.connect();
  }

  private back() {
    if (this.currentMode === "matched") return;
    if (this.currentMode !== "menu") { this.returnToMenu(); return; }
    MultiplayerManager.getInstance().leaveLobby();
    MultiplayerManager.getInstance().disconnect();
    transitionTo(this, "CharacterSelectScene");
  }

  private handleKey(event: KeyboardEvent) {
    // Phaser can replay its pending queue while several DOM events arrive in one frame.
    // Consume each physical event once; intentional key repeats still have distinct events.
    if (this.handledKeys.has(event)) return;
    this.handledKeys.add(event);
    if (event.key === "Escape") { event.preventDefault(); this.back(); return; }
    if (event.key === "Tab") {
      event.preventDefault();
      const available = this.buttons.map((b, i) => b.enabled ? i : -1).filter(i => i >= 0);
      if (!available.length) return;
      const pos = available.indexOf(this.focused);
      this.focused = available[(pos + (event.shiftKey ? -1 : 1) + available.length) % available.length];
      this.buttons.forEach((b, i) => this.paintButton(b, i === this.focused));
      return;
    }
    if (event.key === "Enter" && this.focused >= 0) { event.preventDefault(); const b = this.buttons[this.focused]; if (b?.enabled) { this.selectSound(); b.action(); } return; }
    if (this.currentMode !== "typing") return;
    if (event.key === "Enter") { event.preventDefault(); this.confirmCode(); }
    else if (event.key === "Backspace" || /^[a-z0-9]$/i.test(event.key)) { event.preventDefault(); this.typeCharacter(event.key); }
  }

  private restoreLocalSelection() { this.gameState.p1CharacterId = this.localCharacterId; this.registry.set("gameState", this.gameState); }
  private character(id: number) { return this.gameState.characters.find(c => c.id === id); }
  private shortName(name: string) { return name.length > 24 ? `${name.slice(0, 23)}…` : name; }
  private selectSound() { if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select", { volume: 0.5 }); }

  private shutdown() {
    this.scale.off("resize", this.handleResize, this);
    this.resizeTimer?.remove();
    this.input.keyboard?.off("keydown", this.handleKey, this);
    this.requestTimeout?.remove();
    this.matchTimer?.remove();
    const mm = MultiplayerManager.getInstance();
    mm.onWaitingCallback = undefined;
    mm.onMatchStartCallback = undefined;
    mm.onOpponentLeftCallback = undefined;
    mm.onErrorCallback = undefined;
    mm.onConnectionStatusCallback = undefined;
    if (!this.enteringBattle) { mm.leaveLobby(); mm.disconnect(); }
    this.root = undefined;
  }
}
