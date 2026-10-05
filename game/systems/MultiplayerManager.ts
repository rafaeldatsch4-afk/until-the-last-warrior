/// <reference types="vite/client" />
import { io, Socket } from "socket.io-client";
import Phaser from "phaser";
import { getMultiplayerServerUrl } from "./ServerWakeup";
import { NET_PROTOCOL_VERSION, packState, unpackState } from "./NetProtocol";

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
  private hasNotifiedConnectionError: boolean = false;
  /** True between matchStart and leaving; roomCode alone is also set while waiting in a queue. */
  private inMatch: boolean = false;
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
  /** Local clock minus the sender's clock (plus the fastest observed latency). */
  private clockOffset: number | null = null;

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

    const url = getMultiplayerServerUrl();

    console.log(`Connecting to Multiplayer server at ${url || "default host"}...`);

    this.socket = io(url, {
      autoConnect: true,
      reconnection: true,
      // Fail fast while searching for a match; raised to 10 once a match starts (see matchStart)
      reconnectionAttempts: 4,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      timeout: 8000,
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
    });

    // All reconnection attempts failed: stop for good and tell the UI once
    this.socket.io.on("reconnect_failed", () => {
      const wasInMatch = this.inMatch;
      this.isReconnecting = false;
      this.isConnected = false;
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      this.socket?.disconnect();
      if (this.onConnectionStatusCallback) {
        this.onConnectionStatusCallback("disconnected");
      }
      if (!wasInMatch && this.onErrorCallback && !this.hasNotifiedConnectionError) {
        this.hasNotifiedConnectionError = true;
        this.onErrorCallback("Servidor PvP indisponível no momento. Tente novamente mais tarde.");
      }
      // Drop the dead socket so the next join/create starts a fresh connection
      this.socket?.removeAllListeners();
      this.socket = null;
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      this.isReconnecting = false;
      this.hasNotifiedConnectionError = false;
      console.log("Connected to Multiplayer Server successfully.");

      if (this.onConnectionStatusCallback) {
        this.onConnectionStatusCallback("connected");
      }

      // Reconnect to active room if reconnecting mid-game
      if (this.roomCode && this.inMatch) {
        this.socket?.emit("reconnectMatch", {
          sessionId: this.sessionId,
          roomCode: this.roomCode,
        });
      } else if (this.roomCode) {
        // The server drops a waiting room as soon as its socket disconnects
        this.roomCode = "";
        this.onErrorCallback?.("A conexão caiu durante a busca. Tente novamente.");
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
      this.inMatch = true;
      this.resetInterpolation();
      // Be more patient with reconnections once a match is running
      this.socket?.io.reconnectionAttempts(10);

      if (this.onMatchStartCallback) {
        this.onMatchStartCallback(data);
      }
    });

    this.socket.on("remotePlayerState", (raw: unknown) => {
      const state = unpackState(raw) as NetworkPlayerState | null;
      if (!state) return;
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

    // We dropped for too long and the server closed the room
    this.socket.on("matchExpired", () => {
      this.inMatch = false;
      this.roomCode = "";
      this.onConnectionStatusCallback?.("disconnected");
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
      // The server kicked us: socket.io will not retry by itself
      if (reason === "io server disconnect") {
        this.socket?.connect();
      }
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
    this.clockOffset = null;
    this.currentInterpolated = { x: 0, y: 0, rotation: 0, flipX: false };
  }

  private pushRemoteState(state: NetworkPlayerState) {
    const now = Date.now();
    // Timestamps come from the other device's clock, which rarely matches ours (phones and
    // PCs are often seconds apart). Map them onto our clock using the smallest observed
    // offset, which keeps the real spacing between snapshots without the clock skew.
    const sentAt = state.timestamp || now;
    const offset = now - sentAt;
    if (this.clockOffset === null || offset < this.clockOffset) this.clockOffset = offset;
    else this.clockOffset += (offset - this.clockOffset) * 0.002; // follow slow drift
    const snap = { state, timestamp: sentAt + this.clockOffset };

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
        proto: NET_PROTOCOL_VERSION,
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
        proto: NET_PROTOCOL_VERSION,
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
        proto: NET_PROTOCOL_VERSION,
      });
    }
  }

  public emitState(state: NetworkPlayerState) {
    if (this.socket && this.isConnected) {
      // Volatile: a position that can't go out right now is dropped, not queued. The next
      // tick replaces it anyway, and a queue of stale positions is what builds up lag on
      // congested mobile connections. Actions (attacks, hits) stay reliable.
      this.socket.volatile.emit("playerState", packState(state));
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
    this.inMatch = false;
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
    this.hasNotifiedConnectionError = false;
    this.roomCode = "";
    this.inMatch = false;
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
