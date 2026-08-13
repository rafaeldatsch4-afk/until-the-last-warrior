import Phaser from "phaser";
import { transitionTo } from "../utils/sceneTransition";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/init";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";

export default class LeaderboardScene extends Phaser.Scene {
  private unsubscribe: any = null;
  private listContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScroll = 0;
  private loadingText!: Phaser.GameObjects.Text;
  private players: any[] = [];

  constructor() {
    super("LeaderboardScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x0f0c29);
    
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
    }

    const bounds = ResponsiveUtils.getSafeBounds();
    const backBtn = this.add.rectangle(bounds.left + 70, bounds.top + 40, 100, 40, 0xe74c3c).setStrokeStyle(2, 0xffffff);
    this.add.text(bounds.left + 70, bounds.top + 40, "VOLTAR", {
      fontSize: "18px",
      fontStyle: "bold",
      fontFamily: "system-ui",
    }).setOrigin(0.5);

    backBtn.setInteractive({ useHandCursor: true })
      .on("pointerover", () => backBtn.setFillStyle(0xc0392b))
      .on("pointerout", () => backBtn.setFillStyle(0xe74c3c))
      .on("pointerdown", () => {
        transitionTo(this, "MenuScene");
      });

    this.add.text(480, bounds.top + 50, "TOP GLOBAL 🌍", {
      fontSize: "36px",
      fontStyle: "bold",
      color: "#f1c40f",
      fontFamily: "system-ui",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Header da tabela
    this.add.text(260, 100, "JOGADOR", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0, 0.5);
    this.add.text(600, 100, "VITÓRIAS", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
    this.add.text(780, 100, "PARTIDAS", { fontSize: "16px", color: "#aaa", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);

    this.loadingText = this.add.text(480, 270, "Carregando Ranking (24h/Ao Vivo)...", {
      fontSize: "24px",
      fontFamily: "system-ui",
      color: "#fff",
    }).setOrigin(0.5);

    this.listContainer = this.add.container(0, 130);
    
    // Create Mask
    const shape = this.make.graphics({});
    shape.fillStyle(0xffffff);
    shape.fillRect(100, 120, 760, 400);
    this.listContainer.setMask(shape.createGeometryMask());

    // Scroll Interactivity
    const zone = this.add.zone(480, 320, 760, 400).setInteractive();
    
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      this.scrollY -= deltaY * 0.5;
      this.constrainScroll();
    });

    let isDragging = false;
    let startY = 0;
    zone.on('pointerdown', (pointer: any) => {
       isDragging = true;
       startY = pointer.y - this.scrollY;
    });
    this.input.on('pointermove', (pointer: any) => {
       if (isDragging) {
          this.scrollY = pointer.y - startY;
          this.constrainScroll();
       }
    });
    this.input.on('pointerup', () => { isDragging = false; });
    
    this.events.on("shutdown", () => {
      if (this.unsubscribe) this.unsubscribe();
    });

    this.loadLeaderboardLive();
  }

  constrainScroll() {
    if (this.scrollY > 0) this.scrollY = 0;
    if (this.scrollY < -this.maxScroll) this.scrollY = -this.maxScroll;
    this.listContainer.y = 130 + this.scrollY;
  }

  loadLeaderboardLive() {
    const usersRef = collection(db, "leaderboard_public");
    const topPlayersQuery = query(usersRef, orderBy("wins", "desc"), limit(10));
    
    // Live update onSnapshot
    this.unsubscribe = onSnapshot(topPlayersQuery, (snapshot) => {
       this.players = [];
       snapshot.forEach(doc => {
           this.players.push(doc.data());
       });
       this.renderList();
    }, (error) => {
       console.error("Erro no Leaderboard:", error);
       if (this.loadingText) this.loadingText.setText("Erro ao carregar ranking.");
    });
  }

  renderList() {
    if (this.loadingText) {
        this.loadingText.destroy();
    }
    this.listContainer.removeAll(true);

    // Ordenar: Wins (Desc) -> Matches como desempate reverso (menos partidas = melhor aproveitamento)
    this.players.sort((a, b) => {
       const winsA = a.wins || 0;
       const winsB = b.wins || 0;
       if (winsB !== winsA) return winsB - winsA;
       const matchesA = a.matches || 0;
       const matchesB = b.matches || 0;
       return matchesA - matchesB;
    });

    if (this.players.length === 0) {
        this.listContainer.add(this.add.text(480, 100, "Nenhum jogador cadastrado.", {
           fontSize: "24px", color: "#aaa", fontFamily: "system-ui"
        }).setOrigin(0.5));
        this.maxScroll = 0;
        return;
    }

    let yPos = 0;
    const rowHeight = 45;

    this.players.forEach((data, index) => {
        const rank = index + 1;
        const username = data.username || "Desconhecido";
        const wins = data.wins || 0;
        const elo = data.elo || 1000;
        const matches = data.matches || 0;
        const avatar = data.avatar || "🥷";

        const bg = this.add.rectangle(480, yPos, 700, 40, rank % 2 === 0 ? 0x2c3e50 : 0x34495e, 0.8)
          .setStrokeStyle(1, 0x7f8c8d);

        let color = "#ffffff";
        if (rank === 1) color = "#f1c40f"; // Gold
        else if (rank === 2) color = "#bdc3c7"; // Silver
        else if (rank === 3) color = "#cd7f32"; // Bronze

        const txtRank = this.add.text(150, yPos, `#${rank}`, { fontSize: "18px", color, fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0, 0.5);
        const txtAvatar = this.add.text(210, yPos, avatar, { fontSize: "22px", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
        const txtName = this.add.text(240, yPos, username, { fontSize: "18px", color, fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0, 0.5);
        
        const txtElo = this.add.text(550, yPos, `${elo}`, { fontSize: "18px", color: "#9b59b6", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
        const txtWins = this.add.text(680, yPos, `${wins}`, { fontSize: "18px", color: "#2ecc71", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
        const txtMatches = this.add.text(800, yPos, `${matches}`, { fontSize: "18px", color: "#3498db", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);

        this.listContainer.add([bg, txtRank, txtAvatar, txtName, txtElo, txtWins, txtMatches]);
        yPos += rowHeight;
    });

    const totalHeight = this.players.length * rowHeight;
    this.maxScroll = Math.max(0, totalHeight - 380);
    this.constrainScroll();
  }
}
