import { detectLowEndDevice } from "../systems/DeviceCapability";
import { transitionTo } from "../utils/sceneTransition";
import { startCloudSaveSync, syncCloudSaveImmediate } from "../systems/CloudSave";
import { trackCoins, validCoins } from "../systems/CoinSync";
import Phaser from "phaser";
import { INITIAL_CHARACTERS } from "../data";
import { AchievementSystem } from "../systems/Achievements";
import { GameState } from "../types";
import { ResponsiveUtils } from "../utils/ResponsiveUtils";
import { AuraManager } from "../systems/AuraManager";

export default class BootScene extends Phaser.Scene {
  declare registry: Phaser.Data.DataManager;
  declare scene: Phaser.Scenes.ScenePlugin;

  constructor() {
    super("BootScene");
  }

  create() {
    ResponsiveUtils.init(this);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    // Initialize Global Game State if it doesn't exist
    if (!window.UTLW) {
console.log("Initializing Game State...");

      // Default State
      const defaultState: GameState = {
        coins: 1000,
        difficulty: 1,
        gameMode: "single",
        selectedCharacterId: 0,
        p1CharacterId: 0,
        p2CharacterId: 1,
        characters: JSON.parse(JSON.stringify(INITIAL_CHARACTERS)), // Deep copy
        stats: {
          totalWins: 0,
          winStreak: 0,
          maxWinStreak: 0,
          tournamentsWon: 0,
          arcadeClears: 0,
          charactersUnlocked: 0,
        },
        unlockedTitles: [],
        equippedTitle: "",
        settings: {
          lowPerformanceMode: detectLowEndDevice(),
          auraColor: AuraManager.getPreference().id,
          auraMode: AuraManager.getPreference().mode,
          hudConfig: {
            dpadPos: { x: 150, y: 380 },
            dpadScale: 1,
            buttonsPos: { x: 810, y: 380 },
            buttonsScale: 1,
            opacity: 0.5
          }
        }
      };

      // Attempt to load from LocalStorage
      try {
        const savedData = localStorage.getItem("utlw_save_v1");
        if (savedData) {
          const parsed = JSON.parse(savedData);
          console.log("Found save data:", parsed);

          // Restore basic stats safely
          if (validCoins(parsed.coins))
            defaultState.coins = parsed.coins;
          if (parsed.coinSync && validCoins(parsed.coinSync.balance) && Number.isFinite(parsed.coinSync.updatedAt)) {
            defaultState.coinSync = parsed.coinSync;
          }
          if (
            typeof parsed.difficulty === "number" &&
            !isNaN(parsed.difficulty)
          )
            defaultState.difficulty = parsed.difficulty;
          if (typeof parsed.gameMode === "string")
            defaultState.gameMode = parsed.gameMode;
          if (
            typeof parsed.p1CharacterId === "number" &&
            !isNaN(parsed.p1CharacterId)
          )
            defaultState.p1CharacterId = parsed.p1CharacterId;
          if (
            typeof parsed.p2CharacterId === "number" &&
            !isNaN(parsed.p2CharacterId)
          )
            defaultState.p2CharacterId = parsed.p2CharacterId;

          // Restore unlocked characters safely
          if (parsed && Array.isArray(parsed.characters)) {
            parsed.characters.forEach((savedChar: any) => {
              if (!savedChar) return;
              const match = defaultState.characters.find(
                (c) => c.id === savedChar.id,
              );
              if (match && typeof savedChar.unlocked === "boolean") {
                // We only persist the unlock if it is true, or if it explicitly matches our logic.
                // However, since we want to persist *lock* states if needed, we'll simply assign it if true.
                // It's safer to only unlock if saved as unlocked, so default free chars remain free.
                if (savedChar.unlocked === true) {
                  match.unlocked = true;
                  console.log(`Restored unlocked char: ${match.name}`);
                }
              } else if (!match && savedChar.id === 999) {
                if (savedChar.key === "custom_999" && savedChar.customData) {
                  defaultState.characters.push(savedChar);
                  console.log("Restored custom character from save.");
                } else {
                  console.warn(
                    "Skipped corrupted custom character save:",
                    savedChar,
                  );
                }
              }
            });
          }

          // Restore achievements safely
          if (parsed.storyState) {
            defaultState.storyState = parsed.storyState;
          }
          if (parsed.stats) {
            defaultState.stats = { ...defaultState.stats, ...parsed.stats };
          }
          if (Array.isArray(parsed.unlockedTitles)) {
            defaultState.unlockedTitles = parsed.unlockedTitles;
          }
          if (typeof parsed.equippedTitle === 'string') {
            defaultState.equippedTitle = parsed.equippedTitle;
          }
          if (parsed.settings) {
            defaultState.settings = { ...defaultState.settings, ...parsed.settings };
            if (parsed.settings.hudConfig) {
               defaultState.settings.hudConfig = { ...defaultState.settings.hudConfig, ...parsed.settings.hudConfig };
            }
          }
          if (!parsed.settings || parsed.settings.lowPerformanceMode === undefined) {
             if (defaultState.settings.lowPerformanceMode) {
                 this.registry.set("showPerfToast", true);
             }
          }
        }
      } catch (e) {
        console.error("Failed to load save data:", e);
        // Fallback to default state silently if corrupt
      }

      defaultState.coinSync ||= { balance: defaultState.coins, updatedAt: 0, ownerId: null };

      // Set Global Object with Save Method
      window.UTLW = {
        state: defaultState,
        save: () => {
          try {
            window.UTLW.state.coinSync = trackCoins(window.UTLW.state.coins, window.UTLW.state.coinSync);
            const dataToSave = {
              coinSync: window.UTLW.state.coinSync,
              coins: window.UTLW.state.coins,
              difficulty: window.UTLW.state.difficulty,
              gameMode: window.UTLW.state.gameMode,
              p1CharacterId: window.UTLW.state.p1CharacterId,
              p2CharacterId: window.UTLW.state.p2CharacterId,
              stats: window.UTLW.state.stats,
              storyState: window.UTLW.state.storyState,
              unlockedTitles: window.UTLW.state.unlockedTitles,
              equippedTitle: window.UTLW.state.equippedTitle,
              settings: window.UTLW.state.settings,
              characters: window.UTLW.state.characters.map((c) => {
                if (c.id === 999) return c; // Save full raw data for custom character
                return { id: c.id, unlocked: c.unlocked };
              }),
            };
            localStorage.setItem("utlw_save_v1", JSON.stringify(dataToSave));
            // console.log('Game Saved'); // Uncomment for debugging
          } catch (e) {
            console.error("Failed to save game:", e);
          }
        },
      };

      const stopCloudSync = startCloudSaveSync();
      const localTimer = setInterval(() => window.UTLW?.save(), 5000);
      const cloudTimer = setInterval(() => { void syncCloudSaveImmediate(); }, 30000);
      const saveBeforeUnload = () => window.UTLW?.save();
      window.addEventListener('beforeunload', saveBeforeUnload);
      this.game.events.once('destroy', () => {
        clearInterval(localTimer);
        clearInterval(cloudTimer);
        stopCloudSync();
        window.removeEventListener('beforeunload', saveBeforeUnload);
      });
      console.log("Auto-Save initialized (5s interval)");
    }

    // Ensure registry is synced
    this.registry.set("gameState", window.UTLW.state);
    setTimeout(() => AchievementSystem.checkAchievements(), 2000);

    transitionTo(this, "PreloadScene");
  }
}
