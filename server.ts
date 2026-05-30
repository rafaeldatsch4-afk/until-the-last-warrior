import express from "express";
import http from "http";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Server as SocketServer } from "socket.io";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Player {
  id: string;
  name: string;
  characterId: number;
}

interface Room {
  id: string;
  players: Player[];
  isPrivate: boolean;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Port 3000 required for AI Studio dev environment, allow env port for production deploy (e.g. Railway)
  const PORT = process.env.NODE_ENV === "production" && process.env.PORT 
    ? Number(process.env.PORT) 
    : 3000;
  
  // Game matchmaking rooms state
  const rooms: Map<string, Room> = new Map();
  // Map socket IDs to room IDs
  const socketToRoom: Map<string, string> = new Map();

  // Helper to find a public room waiting for a player
  function findWaitingPublicRoom(): Room | null {
    for (const room of rooms.values()) {
      if (!room.isPrivate && room.players.length === 1) {
        return room;
      }
    }
    return null;
  }

  // Socket.IO Connection Setup
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join random public matchmaking
    socket.on("joinMatchmaking", (data: { name: string; characterId: number }) => {
      // First, make sure they are not already in a room
      if (socketToRoom.has(socket.id)) {
        return;
      }

      const pName = data.name || "Guerreiro";
      const charId = data.characterId;

      const waitingRoom = findWaitingPublicRoom();

      if (waitingRoom) {
        // Match found!
        const player2: Player = { id: socket.id, name: pName, characterId: charId };
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
          players: [{ id: socket.id, name: pName, characterId: charId }],
          isPrivate: false
        };

        rooms.set(roomId, newRoom);
        socketToRoom.set(socket.id, roomId);
        socket.join(roomId);

        socket.emit("waitingForOpponent", { roomCode: roomId });
        console.log(`Player ${pName} waiting in new public room: ${roomId}`);
      }
    });

    // Create a private room
    socket.on("createPrivateRoom", (data: { name: string; characterId: number; roomCode: string }) => {
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
        isPrivate: true
      };

      rooms.set(roomId, newRoom);
      socketToRoom.set(socket.id, roomId);
      socket.join(roomId);

      socket.emit("waitingForOpponent", { roomCode: roomId, isPrivate: true });
      console.log(`Private room created: ${roomId} by ${pName}`);
    });

    // Join a private room
    socket.on("joinPrivateRoom", (data: { name: string; characterId: number; roomCode: string }) => {
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

    function handleDisconnect(sId: string) {
      const roomId = socketToRoom.get(sId);
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          // Tell other player that the opponent left
          socket.to(roomId).emit("opponentLeft");
          
          // Remove players, delete room
          room.players = room.players.filter(p => p.id !== sId);
          if (room.players.length === 0) {
            rooms.delete(roomId);
            console.log(`Deleted empty room: ${roomId}`);
          }
        }
        socketToRoom.delete(sId);
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
    app.use(express.static(join(__dirname, "../dist")));
    app.get("*all", (req, res) => {
      res.sendFile(join(__dirname, "../dist/index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Online PvP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
