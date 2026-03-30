import { useState } from "react";
import AuthPage from "./pages/AuthPage";
import RoomPage from "./pages/RoomPage";
import EditorRoom from "./pages/EditorRoom";

function App() {
  const [step, setStep] = useState("auth");
  const [userData, setUserData] = useState(null);
  const [roomConfig, setRoomConfig] = useState({
    roomId: "",
    language: "cpp",
  });

  const handleAuthEnter = (data) => {
    setUserData(data);
    setStep("room");
  };

  const handleRoomEnter = ({ roomId, language }) => {
    setRoomConfig({
      roomId,
      language,
    });
    setStep("editor");
  };

  if (step === "auth") {
    return <AuthPage onEnter={handleAuthEnter} />;
  }

  if (step === "room") {
    return <RoomPage onEnterRoom={handleRoomEnter} userData={userData} />;
  }

  return (
    <EditorRoom
      userData={userData}
      initialRoomId={roomConfig.roomId}
      initialLanguage={roomConfig.language}
    />
  );
}

export default App;