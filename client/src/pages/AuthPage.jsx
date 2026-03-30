import { useState } from "react";

function AuthPage({ onEnter }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      alert("Please fill all fields");
      return;
    }

    onEnter({
      username,
      email,
      password,
    });
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb orb-a"></div>
      <div className="auth-orb orb-b"></div>
      <div className="auth-grid"></div>

      <div className="auth-card">
        <div className="auth-badge">Secure Workspace Access</div>

        <div className="auth-logo">
          <span>&lt;/&gt;</span>
        </div>

        <h1 className="auth-title">CodeSync</h1>
        <p className="auth-subtitle">
          Enter your details to continue into the collaborative coding workspace.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="auth-input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-btn">
            Enter Workspace
          </button>
        </form>

        <p className="auth-footer">
          Realtime collaboration • Room-based editing • Code execution
        </p>
      </div>
    </div>
  );
}

export default AuthPage;