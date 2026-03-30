import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";
import "./App.css";

const socket = io("http://localhost:5000");

function EditorRoom() {
  const [socketId, setSocketId] = useState("Not connected");
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("None");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [output, setOutput] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

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
    const room = roomId.trim();
    if (!room) return;
    socket.emit("join-room", room);
  };

  const createRoom = () => {
    const randomId = "room-" + Math.floor(1000 + Math.random() * 9000);
    setRoomId(randomId);
    socket.emit("join-room", randomId);
  };

  const copyRoomId = async () => {
    if (joinedRoom === "None") return;
    await navigator.clipboard.writeText(joinedRoom);
    setOutput(`Room ID copied: ${joinedRoom}`);
    setShowOutput(true);
  };

  const runCode = async () => {
    if (!code.trim()) {
      setOutput("Please write some code before running.");
      setShowOutput(true);
      return;
    }

    try {
      setIsRunning(true);

      const res = await fetch("http://localhost:5000/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      const data = await res.json();
      setOutput(data.output || "No output received.");
      setShowOutput(true);
    } catch (error) {
      setOutput("Error while running code. Check backend server.");
      setShowOutput(true);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">&lt;/&gt;</div>
          <div>
            <h1>CodeSync</h1>
            <p>Collaborative Code Editor</p>
          </div>
        </div>

        <div className="sidebar-card">
          <span className="badge">Live Collaboration</span>
          <h2>Build together in real time</h2>
          <p>
            Create secure rooms, sync code instantly, and run programs directly
            from your collaborative workspace.
          </p>

          <div className="feature-list">
            <div className="feature-pill">Monaco Editor</div>
            <div className="feature-pill">Socket.IO Sync</div>
            <div className="feature-pill">Multi-language</div>
            <div className="feature-pill">Code Execution</div>
          </div>
        </div>

        <div className="status-box">
          <p className="status-label">Connection Status</p>
          <p className="status-value">
            {socketId !== "Not connected" ? "Connected" : "Disconnected"}
          </p>
          <p className="status-subtext">
            Socket ID:{" "}
            <span>{socketId !== "Not connected" ? socketId : "Waiting..."}</span>
          </p>
        </div>
      </aside>

      <main className="main-content">
        <section className="top-panel">
          <div className="top-left">
            <h2>Workspace</h2>
            <p>Join a room or create a new one to start collaborating.</p>
          </div>

          <div className="room-actions">
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="room-input"
            />

            <button onClick={joinRoom} className="btn btn-secondary">
              Join Room
            </button>

            <button onClick={createRoom} className="btn btn-primary">
              Create Room
            </button>
          </div>
        </section>

        <section className="room-info-bar">
          <div className="room-info-item">
            <span className="label">Joined Room</span>
            <span className="value">{joinedRoom}</span>
          </div>

          <div className="room-info-item">
            <span className="label">Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="lang-select"
            >
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          <div className="room-info-buttons">
            <button
              onClick={copyRoomId}
              className="btn btn-outline"
              disabled={joinedRoom === "None"}
            >
              Copy Room ID
            </button>

            <button
              onClick={runCode}
              className="btn btn-success"
              disabled={isRunning}
            >
              {isRunning ? "Running..." : "Run Code"}
            </button>
          </div>
        </section>

        <section className="editor-wrapper">
          <div className="editor-header">
            <div className="editor-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>
              {joinedRoom !== "None"
                ? `Live in ${joinedRoom}`
                : "Join a room to start live collaboration"}
            </p>
          </div>

          <div className="editor-box">
            <Editor
              height="68vh"
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
        </section>
      </main>

      {showOutput && (
        <div className="modal-overlay" onClick={() => setShowOutput(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Execution Output</h3>
              <button className="close-btn" onClick={() => setShowOutput(false)}>
                ✕
              </button>
            </div>

            <pre className="output-box">{output}</pre>

            <button className="btn btn-primary full-btn" onClick={() => setShowOutput(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorRoom;