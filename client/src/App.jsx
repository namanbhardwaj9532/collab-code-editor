import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [socketId, setSocketId] = useState("Not connected");
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("None");
  const [code, setCode] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    socket.on("joined-room", (room) => {
      setJoinedRoom(room);
      setCode(""); 
    });

    socket.on("code-update", ({ roomId, code }) => {
      if (roomId === joinedRoom) {
        setCode(code);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("joined-room");
      socket.off("code-update");

    };
  }, [joinedRoom]);

  const joinRoom = () => {
    console.log("Joining room:", roomId);
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

      <textarea
        value={code}
        onChange={(e) => {
          const newCode = e.target.value;
          setCode(newCode);

          if (joinedRoom !== "None") {
            socket.emit("code-change", { roomId: joinedRoom, code: newCode });
          }
        }}
        rows={15}
        cols={80}
      />

    </div>
  );
}

export default App;
