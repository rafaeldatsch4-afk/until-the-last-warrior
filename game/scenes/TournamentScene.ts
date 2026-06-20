import Phaser from "phaser";
import { GameState, CharacterData, TournamentMatch } from "../types";
import { INITIAL_CHARACTERS } from "../data";

export default class TournamentScene extends Phaser.Scene {
  private gameState!: GameState;

  constructor() {
    super("TournamentScene");
  }

  create() {
    this.gameState = this.registry.get("gameState");

    if (this.cache.audio.exists("bgm_battle")) {
      this.sound.stopByKey("bgm_battle");
    }
    if (this.cache.audio.exists("bgm_menu")) {
      let isPlaying = false;
      this.sound.getAll("bgm_menu").forEach((s) => {
        if (s.isPlaying) isPlaying = true;
      });
      if (!isPlaying) {
        this.sound.play("bgm_menu", { loop: true, volume: 0.5 });
      }
    }

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0b2e, 0x000000, 0x1a0b2e, 0x000000, 1);
    bg.fillRect(0, 0, 960, 540);

    // Add postFX to main camera
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8, 0.4);
      const cm = this.cameras.main.postFX.addColorMatrix();
      // saturation removed
    }

    this.add
      .image(480, 270, "arena")
      .setAlpha(0.1)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Title
    const title = this.add
      .text(480, 40, "CHAVES DO TORNEIO", {
        fontSize: "42px",
        color: "#f1c40f",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 4,
          color: "#000000",
          blur: 4,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: 35,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    if (!this.gameState.tournamentRounds) {
      this.scene.start("MenuScene");
      return;
    }

    this.drawBracket();

    // Check if tournament is over
    const finalRound =
      this.gameState.tournamentRounds[
        this.gameState.tournamentRounds.length - 1
      ];
    if (finalRound.matches[0].winner !== null) {
      const winnerId = finalRound.matches[0].winner;
      const winnerChar = INITIAL_CHARACTERS.find((c) => c.id === winnerId);

      const winBg = this.add
        .rectangle(480, 470, 600, 100, 0x000000, 0.8)
        .setStrokeStyle(2, 0xf1c40f);

      this.add
        .text(480, 440, `VENCEDOR: ${winnerChar?.name.toUpperCase()}!`, {
          fontSize: "32px",
          color: "#f1c40f",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      // Reward if player won
      if (winnerId === this.gameState.tournamentPlayerCharId) {
        this.gameState.coins += 500;
        this.registry.set("gameState", this.gameState);
        window.UTLW.save();
        this.add
          .text(480, 480, "+500 MOEDAS!", {
            fontSize: "24px",
            color: "#2ecc71",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
      }

      this.createBtn(
        480,
        550,
        "VOLTAR AO MENU",
        () => {
          this.scene.start("MenuScene");
        },
        0x3498db,
      );

      this.tweens.add({
        targets: winBg,
        y: 470,
        alpha: { from: 0, to: 1 },
        duration: 500,
      });
      return;
    }

    // Simulate CPU matches for current round, then show FIGHT button for player
    this.processCurrentRound();
  }

  drawBracket() {
    const rounds = this.gameState.tournamentRounds!;
    const startX = 150;
    const startY = 120;
    const xSpacing = 220;

    rounds.forEach((round, rIndex) => {
      const ySpacing = 60 * Math.pow(2, rIndex);
      const currentYStart = startY + ySpacing / 2 - 30;

      round.matches.forEach((match, mIndex) => {
        const x = startX + rIndex * xSpacing;
        const y = currentYStart + mIndex * ySpacing * 2;

        // Draw match box
        const isPlayerMatch =
          match.p1 === this.gameState.tournamentPlayerCharId ||
          match.p2 === this.gameState.tournamentPlayerCharId;
        const boxColor = isPlayerMatch ? 0x2c3e50 : 0x111111;
        const strokeColor = isPlayerMatch ? 0xf1c40f : 0x555555;

        this.add
          .rectangle(x, y, 180, 50, boxColor, 0.8)
          .setStrokeStyle(2, strokeColor);

        const p1Name =
          match.p1 !== null
            ? INITIAL_CHARACTERS.find((c) => c.id === match.p1)?.name
            : "???";
        const p2Name =
          match.p2 !== null
            ? INITIAL_CHARACTERS.find((c) => c.id === match.p2)?.name
            : "???";

        const p1Color =
          match.winner === match.p1 && match.p1 !== null
            ? "#2ecc71"
            : match.winner !== null
              ? "#555555"
              : "#ffffff";
        const p2Color =
          match.winner === match.p2 && match.p2 !== null
            ? "#2ecc71"
            : match.winner !== null
              ? "#555555"
              : "#ffffff";

        // Highlight player
        const p1IsPlayer = match.p1 === this.gameState.tournamentPlayerCharId;
        const p2IsPlayer = match.p2 === this.gameState.tournamentPlayerCharId;

        this.add
          .text(x, y - 12, p1Name || "???", {
            fontSize: "14px",
            color: p1IsPlayer ? "#f1c40f" : p1Color,
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        this.add
          .text(x, y + 12, p2Name || "???", {
            fontSize: "14px",
            color: p2IsPlayer ? "#f1c40f" : p2Color,
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        this.add.line(0, 0, x - 80, y, x + 80, y, 0x444444).setOrigin(0);

        // Draw connecting lines to next round
        if (rIndex < rounds.length - 1) {
          const nextX = startX + (rIndex + 1) * xSpacing - 90;
          const nextY =
            startY +
            (60 * Math.pow(2, rIndex + 1)) / 2 -
            30 +
            Math.floor(mIndex / 2) * 60 * Math.pow(2, rIndex + 1) * 2;

          const lineColor = match.winner !== null ? 0x3498db : 0x333333;

          this.add
            .line(0, 0, x + 90, y, x + 90 + (xSpacing - 180) / 2, y, lineColor)
            .setOrigin(0);
          this.add
            .line(
              0,
              0,
              x + 90 + (xSpacing - 180) / 2,
              y,
              x + 90 + (xSpacing - 180) / 2,
              nextY,
              lineColor,
            )
            .setOrigin(0);
          this.add
            .line(
              0,
              0,
              x + 90 + (xSpacing - 180) / 2,
              nextY,
              nextX,
              nextY,
              lineColor,
            )
            .setOrigin(0);
        }
      });
    });
  }

  processCurrentRound() {
    const currentRoundIndex = this.gameState.tournamentCurrentRoundIndex || 0;
    const round = this.gameState.tournamentRounds![currentRoundIndex];

    let playerMatchIndex = -1;
    let playerIsP1 = false;

    // Find player's match
    round.matches.forEach((match, index) => {
      if (match.p1 === this.gameState.tournamentPlayerCharId) {
        playerMatchIndex = index;
        playerIsP1 = true;
      } else if (match.p2 === this.gameState.tournamentPlayerCharId) {
        playerMatchIndex = index;
        playerIsP1 = false;
      }
    });

    // Simulate CPU matches
    let cpuMatchesSimulated = false;
    round.matches.forEach((match, index) => {
      if (
        index !== playerMatchIndex &&
        match.winner === null &&
        match.p1 !== null &&
        match.p2 !== null
      ) {
        // Random winner for CPU vs CPU
        match.winner = Math.random() > 0.5 ? match.p1 : match.p2;
        this.advanceWinner(match.winner, currentRoundIndex, index);
        cpuMatchesSimulated = true;
      }
    });
    if (cpuMatchesSimulated) {
      this.registry.set("gameState", this.gameState);
    }

    // Check if player is eliminated or not in this round (shouldn't happen if they win, but just in case)
    if (playerMatchIndex === -1) {
      // Player is out, simulate rest of tournament
      this.simulateRestOfTournament();
      return;
    }

    const playerMatch = round.matches[playerMatchIndex];

    if (
      playerMatch.winner === null &&
      playerMatch.p1 !== null &&
      playerMatch.p2 !== null
    ) {
      // Player needs to fight
      const enemyId = playerIsP1 ? playerMatch.p2 : playerMatch.p1;

      this.gameState.p1CharacterId = this.gameState.tournamentPlayerCharId!;
      this.gameState.p2CharacterId = enemyId;
      this.registry.set("gameState", this.gameState);

      this.createBtn(
        480,
        480,
        "LUTAR!",
        () => {
          this.scene.start("BattleScene");
        },
        0xe74c3c,
      );
    }
  }

  advanceWinner(
    winnerId: number,
    currentRoundIndex: number,
    matchIndex: number,
  ) {
    const rounds = this.gameState.tournamentRounds!;
    if (currentRoundIndex < rounds.length - 1) {
      const nextRound = rounds[currentRoundIndex + 1];
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const isP1 = matchIndex % 2 === 0;

      if (isP1) {
        nextRound.matches[nextMatchIndex].p1 = winnerId;
      } else {
        nextRound.matches[nextMatchIndex].p2 = winnerId;
      }
    }
  }

  simulateRestOfTournament() {
    const rounds = this.gameState.tournamentRounds!;
    let currentRoundIndex = this.gameState.tournamentCurrentRoundIndex || 0;

    while (currentRoundIndex < rounds.length) {
      const round = rounds[currentRoundIndex];
      round.matches.forEach((match, index) => {
        if (match.winner === null && match.p1 !== null && match.p2 !== null) {
          match.winner = Math.random() > 0.5 ? match.p1 : match.p2;
          this.advanceWinner(match.winner, currentRoundIndex, index);
        }
      });
      currentRoundIndex++;
    }

    this.registry.set("gameState", this.gameState);
    this.scene.restart(); // Redraw with final results
  }

  createBtn(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    color: number = 0x3498db,
  ) {
    const container = this.add.container(x, y);

    const shadow = this.add
      .rectangle(4, 4, 250, 60, 0x000000, 0.5)
      .setOrigin(0.5);
    const bg = this.add
      .rectangle(0, 0, 250, 60, color)
      .setStrokeStyle(2, 0xffffff)
      .setOrigin(0.5);
    const innerBg = this.add
      .rectangle(0, 0, 242, 52, 0x000000, 0.2)
      .setOrigin(0.5);

    const txt = this.add
      .text(0, 0, text, {
        fontSize: "26px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    container.add([shadow, bg, innerBg, txt]);

    // Pulsing effect if it's the fight button
    if (color === 0xe74c3c) {
      this.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    const hitArea = this.add
      .rectangle(0, 0, 250, 60, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on("pointerover", () => {
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      const hoverColor =
        (Math.min(255, r + 40) << 16) |
        (Math.min(255, g + 40) << 8) |
        Math.min(255, b + 40);
      bg.setFillStyle(hoverColor);
      if (color !== 0xe74c3c)
        this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });
    hitArea.on("pointerout", () => {
      bg.setFillStyle(color);
      if (color !== 0xe74c3c)
        this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    hitArea.on("pointerdown", () => {
      if (this.cache.audio.exists("sfx_select")) this.sound.play("sfx_select");
      this.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: onClick,
      });
    });
  }
}
