import { useState } from "react";

function RoomPage({ onEnterRoom, userData }) {
  const [roomId, setRoomId] = useState("");
  const [language, setLanguage] = useState("cpp");

  const joinRoom = () => {
    const room = roomId.trim();
    if (!room) {
      alert("Please enter a Room ID");
      return;
    }

    onEnterRoom({
      roomId: room,
      language,
    });
  };

  const createRoom = () => {
    const randomId = "room-" + Math.floor(1000 + Math.random() * 9000);

    onEnterRoom({
      roomId: randomId,
      language,
    });
  };

  return (
    <div className="room-page-shell">
      <div className="room-page-orb orb-a"></div>
      <div className="room-page-orb orb-b"></div>
      <div className="room-page-grid"></div>

      <div className="room-page-card">
        <div className="room-page-badge">Workspace Access</div>

        <h1 className="room-page-title">Choose Your Room</h1>
        <p className="room-page-subtitle">
          Join or create a collaborative room and lock it to a specific programming language.
        </p>

        {userData?.username && (
          <div className="room-user-box">
            <span>Signed in as</span>
            <strong>{userData.username}</strong>
          </div>
        )}

        <div className="room-input-row">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="room-page-input"
          />
        </div>

        <div className="room-input-row">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="room-page-input room-page-select"
          >
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>

        <div className="room-page-actions">
          <button className="room-page-btn secondary" onClick={joinRoom}>
            Join Room
          </button>

          <button className="room-page-btn primary" onClick={createRoom}>
            Create Room
          </button>
        </div>

        <div className="room-page-features">
          <span>Realtime Sync</span>
          <span>Monaco Editor</span>
          <span>Code Execution</span>
          <span>Language Locked Rooms</span>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;