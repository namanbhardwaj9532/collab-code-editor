const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/compile", async (req, res) => {
  const { code, language, input } = req.body;

  const languageMap = {
    cpp: 54,
    python: 71,
    java: 62,
    javascript: 63,
  };

  try {
    const submission = await axios.post(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: languageMap[language],
        stdin: input || "",
      }
    );

    res.json({
      output:
        submission.data.stdout ||
        submission.data.stderr ||
        submission.data.compile_output ||
        "No output",
    });
  } catch (err) {
    console.log("Compile error:", err.message);
    res.json({ output: "Error running code" });
  }
});

const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Store room code
const roomCode = {};

// Store room notes
const roomNotes = {};

// Store room note titles
const roomNoteTitles = {};

// Store users in each room
const roomUsers = {};

// Store room language
const roomLanguages = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  let currentRoom = null;
  let currentUsername = "Anonymous";

  const emitRoomUsers = (roomId) => {
    if (!roomId) return;

    const users = roomUsers[roomId] || [];
    const userCount = users.length;

    io.to(roomId).emit("room-users", {
      roomId,
      userCount,
      users,
    });
  };

  socket.on("join-room", ({ roomId, username, language }) => {
    if (!roomId) return;

    // Leave previous room if any
    if (currentRoom) {
      socket.leave(currentRoom);

      if (roomUsers[currentRoom]) {
        roomUsers[currentRoom] = roomUsers[currentRoom].filter(
          (user) => user.socketId !== socket.id
        );

        if (roomUsers[currentRoom].length === 0) {
          delete roomUsers[currentRoom];
          delete roomCode[currentRoom];
          delete roomNotes[currentRoom];
          delete roomNoteTitles[currentRoom];
          delete roomLanguages[currentRoom];
        }

        emitRoomUsers(currentRoom);
      }
    }

    // If room is new, set language. If room exists, keep old language.
    if (!roomLanguages[roomId]) {
      roomLanguages[roomId] = language || "cpp";
    }

    const finalRoomLanguage = roomLanguages[roomId];

    // Join room
    socket.join(roomId);
    currentRoom = roomId;
    currentUsername = username?.trim() || "Anonymous";

    // Track users
    if (!roomUsers[roomId]) {
      roomUsers[roomId] = [];
    }

    // Avoid duplicate entry for same socket
    roomUsers[roomId] = roomUsers[roomId].filter(
      (user) => user.socketId !== socket.id
    );

    roomUsers[roomId].push({
      socketId: socket.id,
      username: currentUsername,
    });

    console.log("JOIN:", socket.id, roomId, currentUsername, finalRoomLanguage);

    // Confirm joined room + send locked language
    socket.emit("joined-room", {
      roomId,
      language: finalRoomLanguage,
    });

    // Send room language explicitly
    socket.emit("room-language", {
      roomId,
      language: finalRoomLanguage,
    });

    // Send existing code
    const existingCode = roomCode[roomId] || "";
    socket.emit("room-code", { roomId, code: existingCode });

    // Send existing notes
    const existingNotes = roomNotes[roomId] || "";
    socket.emit("room-notes", { roomId, notes: existingNotes });

    // Send existing note title
    const existingNoteTitle = roomNoteTitles[roomId] || "Team Notes";
    socket.emit("room-note-title", { roomId, noteTitle: existingNoteTitle });

    // Send room users
    emitRoomUsers(roomId);

    // Broadcast room language to everyone in room
    io.to(roomId).emit("room-language", {
      roomId,
      language: finalRoomLanguage,
    });

    // Notify others
    socket.to(roomId).emit("system-message", {
      message: `${currentUsername} joined the ${finalRoomLanguage.toUpperCase()} room`,
    });
  });

  socket.on("code-change", ({ roomId, code }) => {
    if (!roomId) return;

    roomCode[roomId] = code;
    socket.to(roomId).emit("code-update", { roomId, code });
  });

  socket.on("notes-change", ({ roomId, notes }) => {
    if (!roomId) return;

    roomNotes[roomId] = notes;
    socket.to(roomId).emit("notes-update", { roomId, notes });
  });

  socket.on("note-title-change", ({ roomId, noteTitle }) => {
    if (!roomId) return;

    roomNoteTitles[roomId] = noteTitle;
    socket.to(roomId).emit("note-title-update", { roomId, noteTitle });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (currentRoom && roomUsers[currentRoom]) {
      const leavingUser = currentUsername;

      roomUsers[currentRoom] = roomUsers[currentRoom].filter(
        (user) => user.socketId !== socket.id
      );

      if (roomUsers[currentRoom].length === 0) {
        delete roomUsers[currentRoom];
        delete roomCode[currentRoom];
        delete roomNotes[currentRoom];
        delete roomNoteTitles[currentRoom];
        delete roomLanguages[currentRoom];
      }

      socket.to(currentRoom).emit("system-message", {
        message: `${leavingUser} left the room`,
      });

      emitRoomUsers(currentRoom);
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});