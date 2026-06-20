import Phaser from "phaser";
import { DailyChallenges } from "../systems/DailyChallenges";

export class BattleReward {
  scene: any; // Type as BattleScene

  constructor(scene: any) {
    this.scene = scene;
  }

  playVictorySound() {
    const soundManager = this.scene.sound as any;
    if (!soundManager || !soundManager.context) return;
    const ctx = soundManager.context as AudioContext;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 1.5; // 1.5 seconds
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Notes: C5(523.25), E5(659.25), G5(783.99), C6(1046.50)
    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },
      { freq: 659.25, time: 0.15, duration: 0.15 },
      { freq: 783.99, time: 0.3, duration: 0.15 },
      { freq: 1046.5, time: 0.45, duration: 0.8 },
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const note of notes) {
        if (t >= note.time && t < note.time + note.duration) {
          // Generate a simple square wave mix
          const phase = (t - note.time) * note.freq * 2 * Math.PI;
          const wave = Math.sin(phase) > 0 ? 0.3 : -0.3;

          // AR envelope
          const localT = t - note.time;
          let env = 1;
          if (localT < 0.05) {
            env = localT / 0.05; // Attack
          } else {
            env = Math.max(
              0,
              1 - Math.pow((localT - 0.05) / (note.duration - 0.05), 2),
            ); // Decay/Release
          }

          sample += wave * env;
        }
      }
      data[i] = sample * 0.5; // Master volume
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }

  endBattle(win: boolean) {
    const s = this.scene;
    // We remove the s.isBattleOver check because BattleScene.ts sets it to true before the delay to prevent double firing.
    if (s.turnTimer) s.turnTimer.remove();
    if (s.regenTimer) s.regenTimer.remove();

    if (win) {
      if (s.gameState && s.gameState.gameMode !== "training") {
        DailyChallenges.addProgress("win_3_battles", 1);
        if (s.playerHp && s.playerData && s.playerHp === s.playerData.maxHp) {
          DailyChallenges.addProgress("win_no_damage", 1);
        }
      }
      this.playVictorySound();
    }

    if (s.battleInput && s.battleInput.mobileControls) {
      s.battleInput.mobileControls.forEach((c: any) => c.destroy());
    }
    s.cameras.main.setZoom(1);
    s.cameras.main.centerOn(480, 270);

    const bg = s.add
      .rectangle(480, 270, 20000, 20000, 0x000000, 0.8)
      .setDepth(3000)
      .setScrollFactor(0);

    let titleMessage = "DEFEAT...";
    let subtitleMessage = "";
    let color = "#e74c3c"; // Red
    let coinsEarned = 0;

    if (s.gameState.gameMode === "local_pvp") {
      // PvP Outcome
      coinsEarned = 100;
      titleMessage = "CONGRATULATIONS!";
      color = "#f1c40f"; // Gold
      if (win) {
        // P1 Wins
        subtitleMessage = `${s.playerData.name.toUpperCase()} WINS!`;
      } else {
        // P2 Wins
        subtitleMessage = `${s.enemyData.name.toUpperCase()} WINS!`;
      }
      // Award coins in PvP regardless of who won (shared stash)
      s.gameState.coins += coinsEarned;
      (window as any).UTLW.save();
      window.dispatchEvent(
        new CustomEvent("battle-ended", {
          detail: { win, gameMode: s.gameState.gameMode },
        }),
      );
    } else {
      // Single Player Outcome
      if (win) {
        titleMessage = "CONGRATULATIONS!";
        if (
          s.gameState.gameMode === "arcade" &&
          s.gameState.arcadeRound === 5
        ) {
          titleMessage = "ARCADE CLEARED!";
          coinsEarned = 500;
        } else {
          coinsEarned = 100;
        }
        subtitleMessage = `${s.playerData.name.toUpperCase()} WINS!`;
        color = "#f1c40f"; // Gold
        s.gameState.coins += coinsEarned;
        (window as any).UTLW.save();
      } else {
        titleMessage = "DEFEAT...";
        subtitleMessage = `${s.enemyData.name.toUpperCase()} WINS!`;
        color = "#e74c3c"; // Red
        coinsEarned = 25; // Small consolation prize
        s.gameState.coins += coinsEarned;
        (window as any).UTLW.save();
      }
    }

    if (s.gameState.gameMode !== "local_pvp") {
      window.dispatchEvent(
        new CustomEvent("battle-ended", {
          detail: { win, gameMode: s.gameState.gameMode },
        }),
      );
    }

    // Display Title
    const titleText = s.add
      .text(480, -100, titleMessage, {
        fontFamily: "Impact, sans-serif",
        fontSize: "80px",
        color: color,
        fontStyle: "italic",
        stroke: "#000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(3001)
      .setScrollFactor(0);

    s.tweens.add({
      targets: titleText,
      y: 160,
      duration: 800,
      ease: "Bounce.easeOut",
    });

    // Display Subtitle (Winner Name)
    if (subtitleMessage) {
      const subText = s.add
        .text(480, 260, subtitleMessage, {
          fontFamily: "Impact, sans-serif",
          fontSize: "56px",
          color: "#ffffff",
          stroke: "#000",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(3001)
        .setAlpha(0)
        .setScale(0.5)
        .setScrollFactor(0);

      s.tweens.add({
        targets: subText,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: 600,
        ease: "Back.easeOut",
      });
    }

    // Display Coins Earned
    if (coinsEarned > 0) {
      const coinText = s.add
        .text(480, 340, `REWARD: +${coinsEarned} COINS`, {
          fontFamily: "Impact, sans-serif",
          fontSize: "48px",
          color: "#f1c40f",
          stroke: "#000",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(3001)
        .setAlpha(0)
        .setScrollFactor(0);

      s.tweens.add({
        targets: coinText,
        alpha: 1,
        y: 360,
        duration: 400,
        delay: 1100,
        ease: "Power2",
      });
    }

    const btn = s.add
      .text(480, 480, "CONTINUE", {
        fontFamily: "Impact, sans-serif",
        fontSize: "36px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(3001)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0)
      .setScrollFactor(0);

    s.tweens.add({
      targets: btn,
      alpha: 1,
      duration: 400,
      delay: 1500,
    });

    btn.on("pointerover", () => btn.setStyle({ color: "#f1c40f" }));
    btn.on("pointerout", () => btn.setStyle({ color: "#ffffff" }));
    btn.on("pointerdown", () => {
      if (s.gameState.gameMode === "tournament") {
        if (win) {
          // Update tournament bracket
          const rounds = s.gameState.tournamentRounds!;
          const currentRoundIndex =
            s.gameState.tournamentCurrentRoundIndex || 0;
          const round = rounds[currentRoundIndex];

          // Find player's match and set winner
          round.matches.forEach((match: any, index: number) => {
            if (
              match.p1 === s.gameState.tournamentPlayerCharId ||
              match.p2 === s.gameState.tournamentPlayerCharId
            ) {
              match.winner = s.gameState.tournamentPlayerCharId!;

              // Advance winner to next round
              if (currentRoundIndex < rounds.length - 1) {
                const nextRound = rounds[currentRoundIndex + 1];
                const nextMatchIndex = Math.floor(index / 2);
                const isP1 = index % 2 === 0;
                if (isP1) nextRound.matches[nextMatchIndex].p1 = match.winner;
                else nextRound.matches[nextMatchIndex].p2 = match.winner;
              }
            }
          });

          s.gameState.tournamentCurrentRoundIndex = currentRoundIndex + 1;
          s.registry.set("gameState", s.gameState);
          s.scene.start("TournamentScene");
        } else {
          s.scene.start("MenuScene");
        }
      } else if (s.gameState.gameMode === "arcade") {
        if (win) {
          s.gameState.arcadeRound = (s.gameState.arcadeRound || 1) + 1;
          if (s.gameState.arcadeRound > 5) {
            s.scene.start("MenuScene");
          } else {
            s.registry.set("gameState", s.gameState);
            s.scene.start("BattleScene");
          }
        } else {
          s.scene.start("MenuScene");
        }
      } else {
        s.scene.start("MenuScene");
      }
    });
  }
}
