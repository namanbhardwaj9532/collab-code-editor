function WelcomePage({ onEnter }) {
  return (
    <div className="welcome-shell">
      <div className="welcome-orb orb-a"></div>
      <div className="welcome-orb orb-b"></div>
      <div className="welcome-grid"></div>

      <div className="welcome-card">
        <div className="welcome-badge">Realtime Collaboration</div>

        <div className="welcome-logo">
          <span>&lt;/&gt;</span>
        </div>

        <h1 className="welcome-title">CodeSync</h1>
        <p className="welcome-subtitle">
          Build, collaborate, and execute code together in real time with a
          modern collaborative editor.
        </p>

        <div className="welcome-features">
          <span>Monaco Editor</span>
          <span>Socket.IO Sync</span>
          <span>Multi-language</span>
          <span>Code Execution</span>
        </div>

        <button className="welcome-btn" onClick={onEnter}>
          Enter Workspace
        </button>

        <p className="welcome-footer">
          Seamless rooms • Live code sync • Fast execution
        </p>
      </div>
    </div>
  );
}

export default WelcomePage;