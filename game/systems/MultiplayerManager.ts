/// <reference types="vite/client" />
import { io, Socket } from "socket.io-client";

export interface MatchStartData {
  roomCode: string;
  localPlayerIndex: 1 | 2;
  opponentName: string;
  opponentCharacterId: number;
}

export class MultiplayerManager {
  private static instance: MultiplayerManager;
  private socket: Socket | null = null;
  
  public isConnected: boolean = false;
  public roomCode: string = "";
  public localPlayerIndex: 1 | 2 = 1; // 1 = Host/P1, 2 = Guest/P2
  public opponentName: string = "Inimigo";
  public opponentCharacterId: number = 0;

  // Listeners
  public onWaitingCallback?: (roomCode: string, isPrivate?: boolean) => void;
  public onMatchStartCallback?: (data: MatchStartData) => void;
  public onRemoteStateCallback?: (state: any) => void;
  public onRemoteActionCallback?: (action: any) => void;
  public onOpponentLeftCallback?: () => void;
  public onErrorCallback?: (err: string) => void;

  private constructor() {}

  public static getInstance(): MultiplayerManager {
    if (!MultiplayerManager.instance) {
      MultiplayerManager.instance = new MultiplayerManager();
    }
    return MultiplayerManager.instance;
  }

  public connect() {
    if (this.socket) return;

    // Use current window location to connect directly to the Express server
    const isDev = import.meta.env.DEV;
    const railwayUrl = "https://until-the-last-warrior-production.up.railway.app";
    const envUrl = import.meta.env.VITE_MULTIPLAYER_URL;
    const url = envUrl || (isDev ? window.location.origin : railwayUrl);
    
    console.log(`Connecting to Multiplayer server at ${url}...`);
    this.socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true // Required for AI Studio preview proxy authentication cookies
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      if (this.onErrorCallback) {
        this.onErrorCallback("Erro de Conexão com o Servidor PvP. Tentando novamente...");
      }
    });

    this.socket.on("connect_timeout", () => {
      console.warn("Socket connection timeout");
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("Connected to Multiplayer Server successfully.");
    });

    this.socket.on("waitingForOpponent", (data: { roomCode: string; isPrivate?: boolean }) => {
      this.roomCode = data.roomCode;
      if (this.onWaitingCallback) {
        this.onWaitingCallback(data.roomCode, data.isPrivate);
      }
    });

    this.socket.on("matchStart", (data: MatchStartData) => {
      this.roomCode = data.roomCode;
      this.localPlayerIndex = data.localPlayerIndex;
      this.opponentName = data.opponentName;
      this.opponentCharacterId = data.opponentCharacterId;

      if (this.onMatchStartCallback) {
        this.onMatchStartCallback(data);
      }
    });

    this.socket.on("remotePlayerState", (state: any) => {
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

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("Disconnected from Multiplayer Server.");
    });
  }

  public joinMatchmaking(playerName: string, characterId: number) {
    this.connect();
    if (this.socket) {
      this.socket.emit("joinMatchmaking", { name: playerName, characterId });
    }
  }

  public createPrivateRoom(playerName: string, characterId: number, roomCode: string) {
    this.connect();
    if (this.socket) {
      this.socket.emit("createPrivateRoom", { name: playerName, characterId, roomCode });
    }
  }

  public joinPrivateRoom(playerName: string, characterId: number, roomCode: string) {
    this.connect();
    if (this.socket) {
      this.socket.emit("joinPrivateRoom", { name: playerName, characterId, roomCode });
    }
  }

  public emitState(state: any) {
    if (this.socket && this.isConnected) {
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
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.roomCode = "";
  }
}
