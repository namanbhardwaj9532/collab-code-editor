import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5000");

function EditorRoom({ userData, initialRoomId, initialLanguage }) {
    const [socketId, setSocketId] = useState("Not connected");
    const [joinedRoom, setJoinedRoom] = useState("None");
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState(initialLanguage || "cpp");
    const [output, setOutput] = useState("Terminal ready...");
    const [input, setInput] = useState("");
    const [isRunning, setIsRunning] = useState(false);

    const [noteTitle, setNoteTitle] = useState("Team Notes");
    const [notes, setNotes] = useState("");

    const [userCount, setUserCount] = useState(0);
    const [activeUsers, setActiveUsers] = useState([]);
    const [systemMessage, setSystemMessage] = useState("");

    const isRemoteUpdate = useRef(false);
    const isRemoteNotesUpdate = useRef(false);
    const isRemoteNoteTitleUpdate = useRef(false);

    useEffect(() => {
        const handleConnect = () => {
            setSocketId(socket.id);
        };

        const handleJoinedRoom = ({ roomId, language }) => {
            setJoinedRoom(roomId);
            setLanguage(language || "cpp");
            setCode("");
            setOutput(
                `Connected to ${roomId} (${(language || "cpp").toUpperCase()} room)\nTerminal ready...`
            );
        };

        const handleRoomLanguage = ({ roomId, language }) => {
            if (roomId === joinedRoom || roomId === initialRoomId) {
                setLanguage(language || "cpp");
            }
        };

        const handleRoomCode = ({ roomId, code }) => {
            if (roomId === joinedRoom || roomId === initialRoomId) {
                isRemoteUpdate.current = true;
                setCode(code);
            }
        };

        const handleCodeUpdate = ({ roomId, code }) => {
            if (roomId === joinedRoom) {
                isRemoteUpdate.current = true;
                setCode(code);
            }
        };

        const handleRoomUsers = ({ roomId, userCount, users }) => {
            if (roomId === joinedRoom || roomId === initialRoomId) {
                setUserCount(userCount);
                setActiveUsers(users || []);
            }
        };

        const handleSystemMessage = ({ message }) => {
            setSystemMessage(message);

            setTimeout(() => {
                setSystemMessage("");
            }, 2500);
        };

        const handleRoomNotes = ({ roomId, notes }) => {
            if (roomId === joinedRoom || roomId === initialRoomId) {
                isRemoteNotesUpdate.current = true;
                setNotes(notes || "");
            }
        };

        const handleNotesUpdate = ({ roomId, notes }) => {
            if (roomId === joinedRoom) {
                isRemoteNotesUpdate.current = true;
                setNotes(notes || "");
            }
        };

        const handleRoomNoteTitle = ({ roomId, noteTitle }) => {
            if (roomId === joinedRoom || roomId === initialRoomId) {
                isRemoteNoteTitleUpdate.current = true;
                setNoteTitle(noteTitle || "Team Notes");
            }
        };

        const handleNoteTitleUpdate = ({ roomId, noteTitle }) => {
            if (roomId === joinedRoom) {
                isRemoteNoteTitleUpdate.current = true;
                setNoteTitle(noteTitle || "Team Notes");
            }
        };

        socket.on("connect", handleConnect);
        socket.on("joined-room", handleJoinedRoom);
        socket.on("room-language", handleRoomLanguage);
        socket.on("room-code", handleRoomCode);
        socket.on("code-update", handleCodeUpdate);
        socket.on("room-users", handleRoomUsers);
        socket.on("system-message", handleSystemMessage);

        socket.on("room-notes", handleRoomNotes);
        socket.on("notes-update", handleNotesUpdate);
        socket.on("room-note-title", handleRoomNoteTitle);
        socket.on("note-title-update", handleNoteTitleUpdate);

        if (initialRoomId) {
            socket.emit("join-room", {
                roomId: initialRoomId,
                username: userData?.username || "Anonymous",
                language: initialLanguage || "cpp",
            });
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("joined-room", handleJoinedRoom);
            socket.off("room-language", handleRoomLanguage);
            socket.off("room-code", handleRoomCode);
            socket.off("code-update", handleCodeUpdate);
            socket.off("room-users", handleRoomUsers);
            socket.off("system-message", handleSystemMessage);

            socket.off("room-notes", handleRoomNotes);
            socket.off("notes-update", handleNotesUpdate);
            socket.off("room-note-title", handleRoomNoteTitle);
            socket.off("note-title-update", handleNoteTitleUpdate);
        };
    }, [joinedRoom, initialRoomId, initialLanguage, userData]);

    const copyRoomId = async () => {
        if (joinedRoom === "None") return;
        await navigator.clipboard.writeText(joinedRoom);
        setOutput((prev) => `${prev}\n\n[INFO] Room ID copied: ${joinedRoom}`);
    };

    const runCode = async () => {
        if (!code.trim()) {
            setOutput((prev) => `${prev}\n\n[ERROR] Please write some code before running.`);
            return;
        }

        try {
            setIsRunning(true);

            setOutput((prev) => {
                const inputBlock = input.trim()
                    ? `\n[INPUT]\n${input}`
                    : `\n[INPUT]\n<empty>`;
                return `${prev}\n\n> Running ${language.toUpperCase()} code...${inputBlock}`;
            });

            const res = await fetch("http://localhost:5000/compile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code,
                    language,
                    input,
                }),
            });

            const data = await res.json();

            setOutput((prev) => `${prev}\n\n[OUTPUT]\n${data.output || "No output received."}`);
        } catch (error) {
            setOutput((prev) => `${prev}\n\n[ERROR] Error while running code. Check backend server.`);
        } finally {
            setIsRunning(false);
        }
    };

    const clearTerminal = () => {
        setOutput("Terminal cleared.\nReady...");
    };

    const clearInput = () => {
        setInput("");
    };

    const clearNotes = () => {
        setNotes("");

        if (joinedRoom !== "None") {
            socket.emit("notes-change", { roomId: joinedRoom, notes: "" });
        }
    };

    const copyNotes = async () => {
        if (!notes.trim()) {
            setOutput((prev) => `${prev}\n\n[INFO] No notes to copy.`);
            return;
        }

        await navigator.clipboard.writeText(notes);
        setOutput((prev) => `${prev}\n\n[INFO] Notes copied successfully.`);
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

                {userData && (
                    <div className="user-profile-card">
                        <p className="user-profile-label">Active User</p>
                        <h3>{userData.username}</h3>
                        <p className="user-profile-email">{userData.email}</p>
                    </div>
                )}

                

                <div className="sidebar-card notes-panel">
                    <div className="notes-top">
                        <span className="badge">Shared Workspace</span>
                        <div className="notes-mini-status">
                            {joinedRoom !== "None" ? "Room Active" : "No Room Joined"}
                        </div>
                    </div>


                    <input
                        type="text"
                        className="notes-title-input"
                        value={noteTitle}
                        onChange={(e) => {
                            const newTitle = e.target.value;
                            setNoteTitle(newTitle);

                            if (isRemoteNoteTitleUpdate.current) {
                                isRemoteNoteTitleUpdate.current = false;
                                return;
                            }

                            if (joinedRoom !== "None") {
                                socket.emit("note-title-change", {
                                    roomId: joinedRoom,
                                    noteTitle: newTitle,
                                });
                            }
                        }}
                        placeholder="Enter note title"
                    />

                    <div className="notes-editor-shell">
                        <div className="notes-editor-toolbar">
                            <span className="notes-doc-indicator"></span>
                            <span className="notes-doc-title">{noteTitle || "Untitled Notes"}</span>

                            <div className="notes-toolbar-actions">
                                <button className="mini-action-btn" onClick={copyNotes}>
                                    Copy
                                </button>
                                <button className="mini-action-btn danger" onClick={clearNotes}>
                                    Clear
                                </button>
                            </div>
                        </div>

                        <textarea
                            className="notes-editor-area"
                            placeholder="Write your ideas, pseudo-code, algorithm steps, meeting notes, or anything related to the room..."
                            value={notes}
                            onChange={(e) => {
                                const newNotes = e.target.value;
                                setNotes(newNotes);

                                if (isRemoteNotesUpdate.current) {
                                    isRemoteNotesUpdate.current = false;
                                    return;
                                }

                                if (joinedRoom !== "None") {
                                    socket.emit("notes-change", {
                                        roomId: joinedRoom,
                                        notes: newNotes,
                                    });
                                }
                            }}
                        ></textarea>
                    </div>
                </div>

                <div className="sidebar-card active-users-card">
                    <div className="active-users-header">
                        <span className="badge">Live Presence</span>
                        <span className="active-users-count">{userCount} Online</span>
                    </div>

                    <h2>Room Participants</h2>
                    <p>See who is currently connected in this collaborative room.</p>

                    <div className="active-users-list">
                        {activeUsers.length > 0 ? (
                            activeUsers.map((user) => (
                                <div className="active-user-item" key={user.socketId}>
                                    <div className="active-user-avatar">
                                        {user.username?.charAt(0)?.toUpperCase() || "A"}
                                    </div>
                                    <div className="active-user-info">
                                        <span className="active-user-name">{user.username}</span>
                                        <span className="active-user-role">Connected</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-users-text">No active users yet</p>
                        )}
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
                    <p className="status-subtext">
                        Users in Room: <span>{userCount}</span>
                    </p>
                </div>
            </aside>

            <main className="main-content">
                {systemMessage && <div className="system-message-banner">{systemMessage}</div>}

                <section className="room-info-bar">
                    <div className="room-info-item">
                        <span className="label">Joined Room</span>
                        <span className="value">{joinedRoom}</span>
                    </div>

                    <div className="room-info-item">
                        <span className="label">Users in Room</span>
                        <span className="value">{userCount}</span>
                    </div>

                    <div className="room-info-item">
                        <span className="label">Room Language</span>
                        <span className="value">{language.toUpperCase()}</span>
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
                                ? `${language.toUpperCase()} Room • ${joinedRoom}`
                                : "Waiting for room connection..."}
                        </p>
                    </div>

                    <div className="editor-box">
                        <Editor
                            height="48vh"
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

                <section className="input-panel">
                    <div className="input-panel-header">
                        <span className="input-panel-title">Custom Input (stdin)</span>
                        <button className="input-clear-btn" onClick={clearInput}>
                            Clear Input
                        </button>
                    </div>

                    <textarea
                        className="runtime-input-area"
                        placeholder="Enter custom input here...
Example:
5
or
5 10
or
3
1 2 3"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </section>

                <section className="terminal-panel">
                    <div className="terminal-header">
                        <div className="terminal-left">
                            <div className="terminal-dot red"></div>
                            <div className="terminal-dot yellow"></div>
                            <div className="terminal-dot green"></div>
                            <span className="terminal-title">Integrated Terminal</span>
                        </div>

                        <button className="terminal-clear-btn" onClick={clearTerminal}>
                            Clear Terminal
                        </button>
                    </div>

                    <pre className="terminal-output">{output}</pre>
                </section>
            </main>
        </div>
    );
}

export default EditorRoom;