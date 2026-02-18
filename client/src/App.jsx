import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";



const socket = io("http://localhost:5000");

function App() {
  const [socketId, setSocketId] = useState("Not connected");
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("None");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    socket.on("joined-room", (room) => {
      setJoinedRoom(room);
      setCode("");
    });

    socket.on("room-code", ({ roomId, code }) => {
      if (roomId === joinedRoom) {
        isRemoteUpdate.current = true;
        setCode(code);
      }
    });



    socket.on("code-update", ({ roomId, code }) => {
      if (roomId === joinedRoom) {
        isRemoteUpdate.current = true;
        setCode(code);
      }
    });


    return () => {
      socket.off("connect");
      socket.off("joined-room");
      socket.off("code-update");
      socket.off("room-code");

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

      <div style={{ marginBottom: "12px" }}>
        <label style={{ marginRight: "10px" }}>Language:</label>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ padding: "6px" }}
        >
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>


      <Editor
        height="60vh"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(value) => {
          const newCode = value || "";
          setCode(newCode);

          if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
          }

          if (joinedRoom !== "None") {
            socket.emit("code-change", { roomId: joinedRoom, code: newCode });
          }
        }}

      />


    </div>
  );
}

export default App;
