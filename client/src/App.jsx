import { useEffect, useState } from "react";

function App() {
  const [health, setHealth] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:5000/health")
      .then((res) => res.json())
      .then((data) => {
        setHealth(JSON.stringify(data));
      })
      .catch((err) => {
        setHealth("Backend not reachable");
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Collaborative Code Editor</h1>
      <p>Backend Health: {health}</p>
    </div>
  );
}

export default App;
