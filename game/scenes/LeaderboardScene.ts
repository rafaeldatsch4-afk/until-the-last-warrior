import Phaser from "phaser";
import { transitionTo } from "../utils/sceneTransition";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase/init";

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("LeaderboardScene");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x0f0c29);

    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
    }

    const backBtn = this.add.rectangle(80, 40, 100, 40, 0xe74c3c).setStrokeStyle(2, 0xffffff);
    const backTxt = this.add.text(80, 40, "VOLTAR", {
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

    this.add.text(480, 50, "TOP GLOBAL", {
      fontSize: "36px",
      fontStyle: "bold",
      color: "#f1c40f",
      fontFamily: "system-ui",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.loadLeaderboard();
  }

  async loadLeaderboard() {
    const loadingText = this.add.text(480, 270, "Carregando...", {
      fontSize: "24px",
      fontFamily: "system-ui",
      color: "#fff",
    }).setOrigin(0.5);

    try {
      const usersRef = collection(db, "leaderboard_public");
      const q = query(usersRef, orderBy("wins", "desc"), limit(10));
      const querySnapshot = await getDocs(q);

      loadingText.destroy();

      let startY = 120;
      let rank = 1;

      if (querySnapshot.empty) {
        this.add.text(480, 270, "Nenhum jogador encontrado.", {
           fontSize: "24px",
           color: "#aaa",
           fontFamily: "system-ui"
        }).setOrigin(0.5);
        return;
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const username = data.username || "Desconhecido";
        const wins = data.wins || 0;
        const avatar = data.avatar || "🥷";

        const rowBg = this.add.rectangle(480, startY, 600, 40, rank % 2 === 0 ? 0x2c3e50 : 0x34495e, 0.8)
          .setStrokeStyle(1, 0x7f8c8d);

        let color = "#ffffff";
        if (rank === 1) color = "#f1c40f"; // Gold
        if (rank === 2) color = "#bdc3c7"; // Silver
        if (rank === 3) color = "#cd7f32"; // Bronze

        this.add.text(220, startY, `#${rank}`, { fontSize: "20px", color, fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0, 0.5);
        this.add.text(260, startY, avatar, { fontSize: "24px", fontFamily: "system-ui" }).setOrigin(0.5, 0.5);
        this.add.text(290, startY, username, { fontSize: "20px", color, fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(0, 0.5);
        this.add.text(740, startY, `${wins} Vitórias`, { fontSize: "20px", color: "#2ecc71", fontStyle: "bold", fontFamily: "system-ui" }).setOrigin(1, 0.5);

        startY += 50;
        rank++;
      });
    } catch (e) {
      console.error(e);
      loadingText.setText("Erro ao carregar o ranking.");
    }
  }
}
