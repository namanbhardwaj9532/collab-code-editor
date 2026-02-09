import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [socketId, setSocketId] = useState("Not connected");

  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Collaborative Code Editor</h1>
      <p>Socket Status: Connected</p>
      <p>Socket ID: {socketId}</p>
    </div>
  );
}

export default App;
