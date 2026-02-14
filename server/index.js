const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

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
  });

  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-update", { roomId, code });
  });


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
