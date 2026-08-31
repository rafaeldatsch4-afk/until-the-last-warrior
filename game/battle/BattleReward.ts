import { transitionTo } from "../utils/sceneTransition";
import { syncCloudSaveImmediate } from "../systems/CloudSave";
import Phaser from "phaser";
import { DailyChallenges } from "../systems/DailyChallenges";
import { AchievementSystem } from "../systems/Achievements";
import { StoryStatsMath } from "../systems/StoryStatsMath";

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
        const effectiveMaxHp = s.playerMaxHp || s.playerData.maxHp;
        const isFlawless = !!(s.playerHp && effectiveMaxHp && s.playerHp === effectiveMaxHp);
        DailyChallenges.onBattleWon(s.gameState.gameMode, isFlawless);
      }
      this.playVictorySound();
    }

    if (s.effects) {
      try {
        s.effects.clearAll();
      } catch (e) {
        console.warn("Error clearing battle effects:", e);
      }
    }

    if (s.p1Shield) s.p1Shield.setVisible(false);
    if (s.p2Shield) s.p2Shield.setVisible(false);
    if (s.p1Aura) s.p1Aura.setVisible(false);
    if (s.p2Aura) s.p2Aura.setVisible(false);

    if (s.battleInput && s.battleInput.mobileControls) {
      s.battleInput.mobileControls.forEach((c: any) => c.destroy());
    }
    s.cameras.main.setZoom(1);
    s.cameras.main.centerOn(480, 270);

    const bg = s.add
      .rectangle(480, 270, 20000, 20000, 0x000000, 0.9)
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
          AchievementSystem.addArcadeClear();
        } else {
          coinsEarned = 100;
        }
        subtitleMessage = `${s.playerData.name.toUpperCase()} WINS!`;
        color = "#f1c40f"; // Gold
        s.gameState.coins += coinsEarned;
        if (s.gameState.gameMode !== "training") {
          AchievementSystem.addWin();
        }
        (window as any).UTLW.save();
      } else {
        titleMessage = "DEFEAT...";
        subtitleMessage = `${s.enemyData.name.toUpperCase()} WINS!`;
        color = "#e74c3c"; // Red
        coinsEarned = 25; // Small consolation prize
        s.gameState.coins += coinsEarned;
        AchievementSystem.resetStreak();
        (window as any).UTLW.save();
      }
    }

    if (s.gameState.gameMode !== "local_pvp" && s.gameState.gameMode !== "training") {
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
        fontSize: "64px",
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
      y: 105,
      duration: 800,
      ease: "Bounce.easeOut",
    });

    // Display Subtitle (Winner Name)
    if (subtitleMessage) {
      const subText = s.add
        .text(480, 185, subtitleMessage, {
          fontFamily: "Impact, sans-serif",
          fontSize: "44px",
          color: "#ffffff",
          stroke: "#000",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(3001)
        .setAlpha(0)
        .setScale(0.6)
        .setScrollFactor(0);

      s.tweens.add({
        targets: subText,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: 500,
        ease: "Back.easeOut",
      });
    }

    // Display Coins Earned
    if (coinsEarned > 0) {
      const coinText = s.add
        .text(480, 240, `REWARD: +${coinsEarned} COINS`, {
          fontFamily: "Impact, sans-serif",
          fontSize: "36px",
          color: "#fbbf24",
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
        y: 255,
        duration: 400,
        delay: 900,
        ease: "Power2",
      });
    }

    // Story Mode Rich Rewards & Level Progress Display
    let storyRewardInfo: any = null;
    let storyLevelUps = 0;
    let storyPointsGained = 0;
    let storyNewLevel = 0;

    if (s.gameState.gameMode === "story") {
      const storyState = s.gameState.storyState;
      if (storyState) {
        const stage = storyState.stage || 1;
        const playerLvl = storyState.level || 1;
        const isBoss = stage % 5 === 0;
        const enemyLevel = s.gameState.storyEnemyState?.enemyLevel
          ?? StoryStatsMath.getEnemyLevel(stage, playerLvl);

        const rewards = StoryStatsMath.calculateBattleRewards(
          stage,
          playerLvl,
          enemyLevel,
          isBoss,
          s.storyParryCount || 0,
          s.maxStoryCombo || 0,
          win,
        );

        storyRewardInfo = rewards;

        // Apply EXP & calculate level ups
        storyState.exp += rewards.totalExp;
        let expReq = StoryStatsMath.getExpNeededForLevel(storyState.level);
        while (storyState.exp >= expReq) {
          storyState.level++;
          storyState.exp -= expReq;
          const pts = StoryStatsMath.getStatPointsForLevelUp(storyState.level);
          storyState.statPoints += pts;
          storyPointsGained += pts;
          storyLevelUps++;
          expReq = StoryStatsMath.getExpNeededForLevel(storyState.level);
        }
        storyNewLevel = storyState.level;

        if (win) {
          storyState.stage += 1;
          storyState.highestStageReached = Math.max(storyState.highestStageReached || 1, storyState.stage);
          storyState.totalStoryWins = (storyState.totalStoryWins || 0) + 1;
          if (isBoss) {
            storyState.bossesDefeated = (storyState.bossesDefeated || 0) + 1;
          }
        }

        s.gameState.coins += rewards.totalCoins;
        s.registry.set("gameState", s.gameState);
        if (window.UTLW) window.UTLW.save();
      }

      let nextY = 245;

      if (storyRewardInfo) {
        const expText = s.add
          .text(480, nextY, `⭐ EXP GANHO: +${storyRewardInfo.totalExp} (BASE: +${storyRewardInfo.baseExp})`, {
            fontFamily: "'Plus Jakarta Sans', Impact, sans-serif",
            fontSize: "20px",
            color: "#38bdf8",
            fontStyle: "bold",
            stroke: "#000",
            strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setDepth(3001)
          .setAlpha(0)
          .setScrollFactor(0);

        s.tweens.add({
          targets: expText,
          alpha: 1,
          duration: 400,
          delay: 800,
          ease: "Power2",
        });

        nextY += 32;
      }

      if (storyLevelUps > 0) {
        const lvlUpText = s.add
          .text(480, nextY, `🎉 LEVEL UP! NÍVEL ${storyNewLevel} (+${storyPointsGained} PONTOS DE ATRIBUTO!)`, {
            fontFamily: "'Plus Jakarta Sans', Impact, sans-serif",
            fontSize: "22px",
            color: "#22c55e",
            fontStyle: "900",
            stroke: "#000",
            strokeThickness: 6,
          })
          .setOrigin(0.5)
          .setDepth(3001)
          .setAlpha(0)
          .setScale(0.8)
          .setScrollFactor(0);

        s.tweens.add({
          targets: lvlUpText,
          alpha: 1,
          scale: 1.05,
          duration: 500,
          delay: 950,
          yoyo: true,
          repeat: 1,
          ease: "Back.easeOut",
        });

        nextY += 36;
      }

      if ((s.storyParryCount || 0) > 0) {
        const parryExp = (s.storyParryCount || 0) * 15;
        const parryText = s.add
          .text(480, nextY, `⚡ PARRIES: ${s.storyParryCount} (+${parryExp} EXP BÔNUS)`, {
            fontFamily: "'Plus Jakarta Sans', Impact, sans-serif",
            fontSize: "18px",
            color: "#60a5fa",
            fontStyle: "bold",
            stroke: "#000",
            strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setDepth(3001)
          .setAlpha(0)
          .setScrollFactor(0);

        s.tweens.add({
          targets: parryText,
          alpha: 1,
          duration: 400,
          delay: 1100,
          ease: "Power2",
        });

        nextY += 30;
      }

      if ((s.maxStoryCombo || 0) > 1) {
        const comboExp = (s.maxStoryCombo || 0) * 18;
        const comboCoins = (s.maxStoryCombo || 0) * 8;
        const comboText = s.add
          .text(480, nextY, `🔥 MAIOR COMBO: ${s.maxStoryCombo} HITS (+${comboExp} EXP / +${comboCoins} MOEDAS)`, {
            fontFamily: "'Plus Jakarta Sans', Impact, sans-serif",
            fontSize: "18px",
            color: "#fb923c",
            fontStyle: "bold",
            stroke: "#000",
            strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setDepth(3001)
          .setAlpha(0)
          .setScrollFactor(0);

        s.tweens.add({
          targets: comboText,
          alpha: 1,
          duration: 400,
          delay: 1250,
          ease: "Power2",
        });
      }
    }

    const btn = s.add
      .text(480, 440, "CONTINUE", {
        fontFamily: "Impact, sans-serif",
        fontSize: "30px",
        color: "#ffffff",
        backgroundColor: "#1e293b",
        padding: { x: 30, y: 10 },
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
      delay: 1400,
    });

    btn.on("pointerover", () => btn.setStyle({ color: "#fbbf24", backgroundColor: "#334155" }));
    btn.on("pointerout", () => btn.setStyle({ color: "#ffffff", backgroundColor: "#1e293b" }));
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

          const wasLastRound = currentRoundIndex === rounds.length - 1;
          s.gameState.tournamentCurrentRoundIndex = currentRoundIndex + 1;

          if (wasLastRound) {
            AchievementSystem.addTournamentWin();
          }

          s.registry.set("gameState", s.gameState);
          syncCloudSaveImmediate();
          transitionTo(s, "TournamentScene");
        } else {
          syncCloudSaveImmediate();
          transitionTo(s, "MenuScene");
        }
      } else if (s.gameState.gameMode === "story") {
        syncCloudSaveImmediate();
        transitionTo(s, "StoryHubScene");
      } else if (s.gameState.gameMode === "arcade") {
        if (win) {
          s.gameState.arcadeRound = (s.gameState.arcadeRound || 1) + 1;
          if (s.gameState.arcadeRound > 5) {
            syncCloudSaveImmediate();
          transitionTo(s, "MenuScene");
          } else {
            s.registry.set("gameState", s.gameState);
            syncCloudSaveImmediate();
          transitionTo(s, "BattleScene");
          }
        } else {
          syncCloudSaveImmediate();
          transitionTo(s, "MenuScene");
        }
      } else {
        syncCloudSaveImmediate();
          transitionTo(s, "MenuScene");
      }
    });
  }
}
