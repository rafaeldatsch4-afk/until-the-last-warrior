/// <reference types="vite/client" />
import { io, Socket } from "socket.io-client";
import Phaser from "phaser";

export interface MatchStartData {
  roomCode: string;
  localPlayerIndex: 1 | 2;
  opponentName: string;
  opponentCharacterId: number;
}

export interface NetworkPlayerState {
  x: number;
  y: number;
  f: number; // flipX (0 or 1)
  r: number; // rotation
  a: number; // anim_id
  h: number; // hp
  k: number; // ki
  flags: number; // bitmask flags (action, defending, jumping, super)
  tl: number; // transformLevel
  timestamp?: number;
}

export interface InterpolatedTransform {
  x: number;
  y: number;
  rotation: number;
  flipX: boolean;
}

export class MultiplayerManager {
  private static instance: MultiplayerManager;
  private socket: Socket | null = null;

  public isConnected: boolean = false;
  public isReconnecting: boolean = false;
  public roomCode: string = "";
  public localPlayerIndex: 1 | 2 = 1; // 1 = Host/P1, 2 = Guest/P2
  public opponentName: string = "Inimigo";
  public opponentCharacterId: number = 0;
  public sessionId: string = Math.random().toString(36).substring(2, 15);

  public currentPing: number = 0;
  private pingInterval: any = null;

  // Snapshot Interpolation Buffer for Remote Opponent
  private stateBuffer: Array<{ state: NetworkPlayerState; timestamp: number }> = [];
  private readonly BUFFER_SIZE: number = 20;
  private readonly INTERPOLATION_DELAY_MS: number = 80; // Render delay to ensure smooth lerp between packets
  private currentInterpolated: InterpolatedTransform = { x: 0, y: 0, rotation: 0, flipX: false };
  private hasInitialSnapshot: boolean = false;

  // Listeners
  public onWaitingCallback?: (roomCode: string, isPrivate?: boolean) => void;
  public onMatchStartCallback?: (data: MatchStartData) => void;
  public onRemoteStateCallback?: (state: NetworkPlayerState) => void;
  public onRemoteActionCallback?: (action: any) => void;
  public onOpponentLeftCallback?: () => void;
  public onMatchPausedCallback?: () => void;
  public onMatchResumedCallback?: () => void;
  public onErrorCallback?: (err: string) => void;
  public onConnectionStatusCallback?: (status: "connected" | "reconnecting" | "disconnected") => void;

  private constructor() {}

  public static getInstance(): MultiplayerManager {
    if (!MultiplayerManager.instance) {
      MultiplayerManager.instance = new MultiplayerManager();
    }
    return MultiplayerManager.instance;
  }

  /**
   * Conecta ou reutiliza o WebSocket com reconexão resiliente e eventos isolados
   */
  public connect() {
    if (this.socket && (this.socket.connected || this.socket.active)) {
      return;
    }

    const railwayUrl = "https://until-the-last-warrior-production.up.railway.app";
    const envUrl = import.meta.env.VITE_MULTIPLAYER_URL;
    let url = envUrl || railwayUrl;

    if (
      window.location.hostname.includes("run.app") ||
      window.location.hostname === "localhost"
    ) {
      url = "";
    }

    console.log(`Connecting to Multiplayer server at ${url || "default host"}...`);

    this.socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    this.registerSocketEvents();
  }

  private registerSocketEvents() {
    if (!this.socket) return;

    this.socket.on("connect_error", (err: any) => {
      console.warn("Socket connection error:", err?.message || err);
      this.isReconnecting = true;
      if (this.onConnectionStatusCallback) {
        this.onConnectionStatusCallback("reconnecting");
      }
      if (this.onErrorCallback) {
        this.onErrorCallback("Erro de Conexão com o Servidor PvP. Tentando reconectar...");
      }
    });

    this.socket.on("connect_timeout", () => {
      console.warn("Socket connection timeout");
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      this.isReconnecting = false;
      console.log("Connected to Multiplayer Server successfully.");

      if (this.onConnectionStatusCallback) {
        this.onConnectionStatusCallback("connected");
      }

      // Reconnect to active room if reconnecting mid-game
      if (this.roomCode) {
        this.socket?.emit("reconnectMatch", {
          sessionId: this.sessionId,
          roomCode: this.roomCode,
        });
      }

      if (this.pingInterval) clearInterval(this.pingInterval);
      this.pingInterval = setInterval(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit("ping", Date.now());
        }
      }, 1000);
    });

    this.socket.on("pong", (timestamp: number) => {
      this.currentPing = Math.max(1, Date.now() - timestamp);
    });

    this.socket.on(
      "waitingForOpponent",
      (data: { roomCode: string; isPrivate?: boolean }) => {
        this.roomCode = data.roomCode;
        if (this.onWaitingCallback) {
          this.onWaitingCallback(data.roomCode, data.isPrivate);
        }
      },
    );

    this.socket.on("matchPaused", () => {
      if (this.onMatchPausedCallback) this.onMatchPausedCallback();
    });

    this.socket.on("matchResumed", () => {
      if (this.onMatchResumedCallback) this.onMatchResumedCallback();
    });

    this.socket.on("matchStart", (data: MatchStartData) => {
      this.roomCode = data.roomCode;
      this.localPlayerIndex = data.localPlayerIndex;
      this.opponentName = data.opponentName;
      this.opponentCharacterId = data.opponentCharacterId;
      this.resetInterpolation();

      if (this.onMatchStartCallback) {
        this.onMatchStartCallback(data);
      }
    });

    this.socket.on("remotePlayerState", (state: NetworkPlayerState) => {
      this.pushRemoteState(state);
      if (this.onRemoteStateCallback) {
        this.onRemoteStateCallback(state);
      }
    });

    this.socket.on("remoteAction", (action: any) => {
      if (this.onRemoteActionCallback) {
        this.onRemoteActionCallback(action);
      }
    });

    this.socket.on("opponentLeft", () => {
      if (this.onOpponentLeftCallback) {
        this.onOpponentLeftCallback();
      }
    });

    this.socket.on("roomError", (errMsg: string) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(errMsg);
      }
    });

    this.socket.on("disconnect", (reason: string) => {
      this.isConnected = false;
      console.log("Disconnected from Multiplayer Server. Reason:", reason);
      if (this.onConnectionStatusCallback) {
        this.onConnectionStatusCallback(reason === "io client disconnect" ? "disconnected" : "reconnecting");
      }
    });
  }

  // ==========================================
  // SNAPSHOT INTERPOLATION & BUFFERING
  // ==========================================

  public resetInterpolation() {
    this.stateBuffer = [];
    this.hasInitialSnapshot = false;
    this.currentInterpolated = { x: 0, y: 0, rotation: 0, flipX: false };
  }

  private pushRemoteState(state: NetworkPlayerState) {
    const now = Date.now();
    const snap = { state, timestamp: state.timestamp || now };

    if (!this.hasInitialSnapshot) {
      this.currentInterpolated.x = state.x;
      this.currentInterpolated.y = state.y;
      this.currentInterpolated.rotation = state.r || 0;
      this.currentInterpolated.flipX = state.f === 1;
      this.hasInitialSnapshot = true;
    }

    this.stateBuffer.push(snap);

    // Prune old snapshots beyond buffer limit
    if (this.stateBuffer.length > this.BUFFER_SIZE) {
      this.stateBuffer.shift();
    }
  }

  /**
   * Calcula a posição e rotação interpolada suave para o sprite remoto no frame atual
   */
  public updateInterpolation(deltaMs: number): InterpolatedTransform {
    if (!this.hasInitialSnapshot || this.stateBuffer.length === 0) {
      return this.currentInterpolated;
    }

    const renderTime = Date.now() - this.INTERPOLATION_DELAY_MS;

    // Se temos apenas 1 snapshot ou o renderTime é menor que o snapshot mais antigo
    if (this.stateBuffer.length === 1 || renderTime <= this.stateBuffer[0].timestamp) {
      const latest = this.stateBuffer[this.stateBuffer.length - 1].state;
      const lerpAlpha = Phaser.Math.Clamp(deltaMs * 0.015, 0.05, 0.35);

      this.currentInterpolated.x = Phaser.Math.Linear(this.currentInterpolated.x, latest.x, lerpAlpha);
      this.currentInterpolated.y = Phaser.Math.Linear(this.currentInterpolated.y, latest.y, lerpAlpha);
      this.currentInterpolated.rotation = Phaser.Math.Linear(this.currentInterpolated.rotation, latest.r || 0, lerpAlpha);
      this.currentInterpolated.flipX = latest.f === 1;

      return this.currentInterpolated;
    }

    // Se renderTime é mais recente que o último snapshot, extrapolamos suavemente para o mais recente
    const newest = this.stateBuffer[this.stateBuffer.length - 1];
    if (renderTime >= newest.timestamp) {
      const lerpAlpha = Phaser.Math.Clamp(deltaMs * 0.02, 0.08, 0.5);
      this.currentInterpolated.x = Phaser.Math.Linear(this.currentInterpolated.x, newest.state.x, lerpAlpha);
      this.currentInterpolated.y = Phaser.Math.Linear(this.currentInterpolated.y, newest.state.y, lerpAlpha);
      this.currentInterpolated.rotation = Phaser.Math.Linear(this.currentInterpolated.rotation, newest.state.r || 0, lerpAlpha);
      this.currentInterpolated.flipX = newest.state.f === 1;

      return this.currentInterpolated;
    }

    // Encontra os dois snapshots adjacentes (p0 e p1) onde p0.timestamp <= renderTime <= p1.timestamp
    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      const p0 = this.stateBuffer[i];
      const p1 = this.stateBuffer[i + 1];

      if (renderTime >= p0.timestamp && renderTime <= p1.timestamp) {
        const totalDuration = p1.timestamp - p0.timestamp;
        const alpha = totalDuration > 0 ? (renderTime - p0.timestamp) / totalDuration : 1;

        const targetX = Phaser.Math.Linear(p0.state.x, p1.state.x, alpha);
        const targetY = Phaser.Math.Linear(p0.state.y, p1.state.y, alpha);
        const targetRot = Phaser.Math.Linear(p0.state.r || 0, p1.state.r || 0, alpha);

        // Suavização adaptativa com a posição atual
        const smoothing = Phaser.Math.Clamp(deltaMs * 0.025, 0.1, 0.6);
        this.currentInterpolated.x = Phaser.Math.Linear(this.currentInterpolated.x, targetX, smoothing);
        this.currentInterpolated.y = Phaser.Math.Linear(this.currentInterpolated.y, targetY, smoothing);
        this.currentInterpolated.rotation = Phaser.Math.Linear(this.currentInterpolated.rotation, targetRot, smoothing);
        this.currentInterpolated.flipX = (alpha > 0.5 ? p1.state.f : p0.state.f) === 1;

        return this.currentInterpolated;
      }
    }

    return this.currentInterpolated;
  }

  // ==========================================
  // MATCHMAKING & LOBBIES
  // ==========================================

  public joinMatchmaking(playerName: string, characterId: number, isRanked: boolean = false, rating: number = 1000) {
    this.connect();
    if (this.socket) {
      this.socket.emit("joinMatchmaking", {
        name: playerName,
        characterId,
        sessionId: this.sessionId,
        isRanked,
        rating,
      });
    }
  }

  public createPrivateRoom(
    playerName: string,
    characterId: number,
    roomCode: string,
  ) {
    this.connect();
    if (this.socket) {
      this.socket.emit("createPrivateRoom", {
        name: playerName,
        characterId,
        roomCode,
        sessionId: this.sessionId,
      });
    }
  }

  public joinPrivateRoom(
    playerName: string,
    characterId: number,
    roomCode: string,
  ) {
    this.connect();
    if (this.socket) {
      this.socket.emit("joinPrivateRoom", {
        name: playerName,
        characterId,
        roomCode,
        sessionId: this.sessionId,
      });
    }
  }

  public emitState(state: NetworkPlayerState | any) {
    if (this.socket && this.isConnected) {
      if (!state.timestamp) {
        state.timestamp = Date.now();
      }
      this.socket.emit("playerState", state);
    }
  }

  public emitAction(action: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit("action", action);
    }
  }

  public leaveLobby() {
    if (this.socket && this.isConnected) {
      this.socket.emit("leaveLobby");
    }
    this.roomCode = "";
    this.resetInterpolation();
  }

  /**
   * Desconecta o socket e remove estritamente todos os listeners de rede
   */
  public disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.currentPing = 0;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.isReconnecting = false;
    this.roomCode = "";
    this.resetInterpolation();
  }

  public destroy() {
    this.disconnect();
    this.onWaitingCallback = undefined;
    this.onMatchStartCallback = undefined;
    this.onRemoteStateCallback = undefined;
    this.onRemoteActionCallback = undefined;
    this.onOpponentLeftCallback = undefined;
    this.onMatchPausedCallback = undefined;
    this.onMatchResumedCallback = undefined;
    this.onErrorCallback = undefined;
    this.onConnectionStatusCallback = undefined;
  }
}
