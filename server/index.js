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
  const { code, language } = req.body;

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
      }
    );

    res.json({
      output: submission.data.stdout || submission.data.stderr,
    });

  } catch (err) {
    console.log(err.message);
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

const roomCode = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  let currentRoom = null;

  socket.on("join-room", (roomId) => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }

    socket.join(roomId);
    currentRoom = roomId;

    console.log("JOIN:", socket.id, roomId);
    socket.emit("joined-room", roomId);

    const existingCode = roomCode[roomId] || "";
    socket.emit("room-code", { roomId, code: existingCode });
  });

  socket.on("code-change", ({ roomId, code }) => {
    roomCode[roomId] = code;
    socket.to(roomId).emit("code-update", { roomId, code });
  });


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
