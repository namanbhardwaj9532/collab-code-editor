import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [socketId, setSocketId] = useState("Not connected");
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("None");

  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    socket.on("joined-room", (room) => {
      setJoinedRoom(room);
    });

    return () => {
      socket.off("connect");
      socket.off("joined-room");
    };
  }, []);

  const joinRoom = () => {
    const room = roomId.trim();
    if (!room) return;

    socket.emit("join-room", room);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Collaborative Code Editor</h1>

      <p>Socket Status: Connected</p>
      <p>Socket ID: {socketId}</p>

      <hr />

      <h2>Join a Room</h2>

      <input
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter Room ID"
        style={{ padding: "8px", width: "250px" }}
      />

      <button
        onClick={joinRoom}
        style={{ marginLeft: "10px", padding: "8px 14px" }}
      >
        Join
      </button>

      <p style={{ marginTop: "15px" }}>
        Joined Room: <b>{joinedRoom}</b>
      </p>
    </div>
  );
}

export default App;
