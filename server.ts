import express from "express";
import http from "http";
import path, { join } from "path";
import { Server as SocketServer } from "socket.io";
import { createServer as createViteServer } from "vite";

interface Player {
  ping?: number;
  id: string;
  name: string;
  characterId: number;
}

interface Room {
  id: string;
  players: Player[];
  isPrivate: boolean;
  isRanked?: boolean;
  rating?: number;
  createdAt: number;
  disconnectTimers?: Map<string, NodeJS.Timeout>; // Maps socket.id/sessionId to timer
  playerSessions?: Map<string, string>; // Maps sessionId to player socket.id
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true
    },
    perMessageDeflate: {
      threshold: 1024,
    },
  });

  const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
  
  // Game matchmaking rooms state
  const rooms: Map<string, Room> = new Map();
  // Map socket IDs to room IDs
  const socketToRoom: Map<string, string> = new Map();

  // Helper to find a public room waiting for a player
  
  function findWaitingPublicRoom(playerPing: number, isRanked: boolean, rating: number = 1000): Room | null {
    const now = Date.now();
    let bestRoom = null;
    let fallbackRoom = null;

    for (const room of rooms.values()) {
      if (!room.isPrivate && room.isRanked === isRanked && room.players.length === 1) {
        if (isRanked && room.rating) {
            const ratingDiff = Math.abs(room.rating - rating);
            const waitingTimeRanked = now - room.createdAt;
            // Expand rating threshold over time (starts at 100, adds 100 every 5 seconds)
            const allowedDiff = 100 + Math.floor(waitingTimeRanked / 5000) * 100;
            if (ratingDiff > allowedDiff) continue;
        }
        const hostPing = room.players[0].ping || 0;
        const waitingTime = now - room.createdAt;
        
        // Similar ping (both good < 80, or both high, or difference is small)
        const similarPing = Math.abs(hostPing - playerPing) <= 50 || (hostPing < 80 && playerPing < 80);
        
        if (similarPing) {
          bestRoom = room;
          break; // Found perfect match
        } else if (waitingTime > 5000) {
          // Room waiting too long, just match them
          fallbackRoom = room;
        } else if (!fallbackRoom) {
          fallbackRoom = room;
        }
      }
    }
    return bestRoom || fallbackRoom;
  }


  // Socket.IO Connection Setup
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Ping for latency
    socket.on("ping", (timestamp) => {
      socket.emit("pong", timestamp);
    });

    // Join random public matchmaking
    socket.on("joinMatchmaking", (data: { name: string; characterId: number; sessionId?: string; ping?: number; isRanked?: boolean; rating?: number }) => {
      // First, make sure they are not already in a room
      if (socketToRoom.has(socket.id)) {
        return;
      }

      const pName = data.name || "Guerreiro";
      const charId = data.characterId;

      const waitingRoom = findWaitingPublicRoom(data.ping || 0, data.isRanked || false, data.rating || 1000);

      if (waitingRoom) {
        // Match found!
        const player2: Player = { id: socket.id, name: pName, characterId: charId, ping: data.ping || 0 };
        if (!waitingRoom.playerSessions) waitingRoom.playerSessions = new Map();
        waitingRoom.playerSessions.set(socket.id, data.sessionId || "guest");
        waitingRoom.players.push(player2);
        socketToRoom.set(socket.id, waitingRoom.id);
        socket.join(waitingRoom.id);

        const player1 = waitingRoom.players[0];

        // Notify both players of details
        // Host gets index 1, Joiner gets index 2
        io.to(player1.id).emit("matchStart", {
          roomCode: waitingRoom.id,
          localPlayerIndex: 1,
          opponentName: player2.name,
          opponentCharacterId: player2.characterId
        });

        io.to(player2.id).emit("matchStart", {
          roomCode: waitingRoom.id,
          localPlayerIndex: 2,
          opponentName: player1.name,
          opponentCharacterId: player1.characterId
        });

        console.log(`Match matched in room: ${waitingRoom.id}. p1: ${player1.name}, p2: ${player2.name}`);
      } else {
        // Creative new Room code
        const roomId = "ROOM_" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const newRoom: Room = {
          id: roomId,
          players: [{ id: socket.id, name: pName, characterId: charId, ping: data.ping || 0 }],
          isPrivate: false,
          createdAt: Date.now(),
          playerSessions: new Map([[socket.id, data.sessionId || "guest"]])
        };

        rooms.set(roomId, newRoom);
        socketToRoom.set(socket.id, roomId);
        socket.join(roomId);

        socket.emit("waitingForOpponent", { roomCode: roomId });
        console.log(`Player ${pName} waiting in new public room: ${roomId}`);
      }
    });

    // Create a private room
    socket.on("createPrivateRoom", (data: { name: string; characterId: number; roomCode: string; sessionId?: string }) => {
      if (socketToRoom.has(socket.id)) {
        return;
      }

      const pName = data.name || "Guerreiro";
      const charId = data.characterId;
      const roomId = (data.roomCode || "").trim().toUpperCase();

      if (!roomId) {
        socket.emit("roomError", "Código de sala inválido.");
        return;
      }

      if (rooms.has(roomId)) {
        socket.emit("roomError", "Esta sala já existe.");
        return;
      }

      const newRoom: Room = {
        id: roomId,
        players: [{ id: socket.id, name: pName, characterId: charId }],
        isPrivate: true,
        createdAt: Date.now(),
        playerSessions: new Map([[socket.id, data.sessionId || "guest"]])
      };

      rooms.set(roomId, newRoom);
      socketToRoom.set(socket.id, roomId);
      socket.join(roomId);

      socket.emit("waitingForOpponent", { roomCode: roomId, isPrivate: true });
      console.log(`Private room created: ${roomId} by ${pName}`);
    });

    // Join a private room
    socket.on("joinPrivateRoom", (data: { name: string; characterId: number; roomCode: string; sessionId?: string }) => {
      if (socketToRoom.has(socket.id)) {
        return;
      }

      const pName = data.name || "Guerreiro";
      const charId = data.characterId;
      const roomId = (data.roomCode || "").trim().toUpperCase();

      const existingRoom = rooms.get(roomId);

      if (!existingRoom) {
        socket.emit("roomError", "Sala não encontrada.");
        return;
      }

      if (existingRoom.players.length >= 2) {
        socket.emit("roomError", "Sala cheia.");
        return;
      }

      const player2: Player = { id: socket.id, name: pName, characterId: charId };
      if (!existingRoom.playerSessions) existingRoom.playerSessions = new Map();
      existingRoom.playerSessions.set(socket.id, data.sessionId || "guest");
      existingRoom.players.push(player2);
      socketToRoom.set(socket.id, roomId);
      socket.join(roomId);

      const player1 = existingRoom.players[0];

      // Notify both players
      io.to(player1.id).emit("matchStart", {
        roomCode: roomId,
        localPlayerIndex: 1,
        opponentName: player2.name,
        opponentCharacterId: player2.characterId
      });

      io.to(player2.id).emit("matchStart", {
        roomCode: roomId,
        localPlayerIndex: 2,
        opponentName: player1.name,
        opponentCharacterId: player1.characterId
      });

      console.log(`Private match matched in room: ${roomId}. P1: ${player1.name}, P2: ${player2.name}`);
    });

    // Sync state
    socket.on("playerState", (state: any) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit("remotePlayerState", state);
      }
    });

    // Relay actions (attacks, skills, dash, jumps)
    socket.on("action", (act: any) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit("remoteAction", act);
      }
    });

    // Leave matchmaking / lobby
    socket.on("leaveLobby", () => {
      handleDisconnect(socket.id);
    });

    // Disconnect handling
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      handleDisconnect(socket.id);
    });

    
    // Handle graceful reconnect
    socket.on("reconnectMatch", (data: { sessionId: string; roomCode: string }) => {
      const roomId = data.roomCode;
      const room = rooms.get(roomId);
      if (room) {
        // Find if this player is in the room by comparing session ID
        let foundPlayer = null;
        for (let i = 0; i < room.players.length; i++) {
           const p = room.players[i];
           if (room.playerSessions && room.playerSessions.get(p.id) === data.sessionId) {
              foundPlayer = p;
              break;
           }
        }
        
        if (foundPlayer) {
          // Clear disconnect timer
          if (room.disconnectTimers && room.disconnectTimers.has(data.sessionId)) {
            clearTimeout(room.disconnectTimers.get(data.sessionId));
            room.disconnectTimers.delete(data.sessionId);
          }
          
          // Update socket mapping
          const oldSocketId = foundPlayer.id;
          socketToRoom.delete(oldSocketId);
          foundPlayer.id = socket.id; // update player socket
          socketToRoom.set(socket.id, roomId);
          if (room.playerSessions) {
            room.playerSessions.set(socket.id, data.sessionId);
          }
          socket.join(roomId);
          
          socket.to(roomId).emit("matchResumed");
          console.log(`Player reconnected to room ${roomId} with new socket ${socket.id}`);
        }
      }
    });
    
    function handleDisconnect(sId: string) {
      const roomId = socketToRoom.get(sId);
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          // Find the player's sessionId
          const sessionId = room.playerSessions ? room.playerSessions.get(sId) : null;
          
          if (sessionId) {
            console.log(`Player disconnected, starting 10s grace period for ${sId} in room ${roomId}`);
            socket.to(roomId).emit("matchPaused"); // Notify opponent
            
            if (!room.disconnectTimers) room.disconnectTimers = new Map();
            
            const timer = setTimeout(() => {
              // Timer expired, player didn't return
              console.log(`Grace period expired for ${sId} in room ${roomId}`);
              // Use io.to(roomId) instead of socket.to (socket is disconnected)
              io.to(roomId).emit("opponentLeft");
              for (const p of room.players) {
                socketToRoom.delete(p.id);
              }
              rooms.delete(roomId);
            }, 10000);
            
            room.disconnectTimers.set(sessionId, timer);
          } else {
            // Old fallback (if no session id)
            socket.to(roomId).emit("opponentLeft");
            for (const p of room.players) {
              socketToRoom.delete(p.id);
            }
            rooms.delete(roomId);
            console.log(`Room closed due to disconnect: ${roomId}`);
          }
        } else {
          socketToRoom.delete(sId);
        }
      }
    }

  });

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", activeRooms: rooms.size });
  });

  // Serve Frontend depending on Environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Online PvP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
