import { useState, useEffect, useCallback } from "react";
import Auth from "./components/Auth/auth.jsx";
import Home from "./components/Home/Home.jsx";
import GameMenu from "./components/GameMenu/GameMenu.jsx";
import GameLobby from "./components/GameLobby/GameLobby.jsx";
import GameBoard from "./components/GameBoard/GameBoard.jsx";
import Leaderboard from "./components/Leaderboard/Leaderboard.jsx";
import { authAPI } from "./api/api.js";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [gameConfig, setGameConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    authAPI
      .me()
      .then((res) => {
        setUser(res.user.username);
        localStorage.setItem("sim_username", res.user.username);
      })
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  function handleLogin(username) {
    setUser(username);
    setScreen("home");
  }

  async function handleLogout() {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout errors
    }
    setUser(null);
    setGameConfig(null);
    setScreen("home");
    localStorage.removeItem("sim_username");
  }

  function handleSelectGame(gameName) {
    if (gameName === "sim") setScreen("menu");
  }

  const handleStartGame = useCallback((config) => {
    setGameConfig(config);
    if (config.mode === "multiplayer") {
      setScreen("lobby");
    } else {
      setScreen("game");
    }
  }, []);

  const handleGameReady = useCallback((config) => {
    setGameConfig(config);
    setScreen("game");
  }, []);

  function handleBackToHome() {
    setGameConfig(null);
    setScreen("home");
  }

  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F5F0E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Space Mono, monospace",
          color: "#8C7B6B",
          fontSize: "0.85rem",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      {screen === "home" && (
        <Home
          onSelectGame={handleSelectGame}
          onLeaderboard={() => setScreen("leaderboard")}
          onLogout={handleLogout}
          username={user}
        />
      )}
      {screen === "menu" && (
        <GameMenu
          onStartGame={handleStartGame}
          onBack={handleBackToHome}
          username={user}
        />
      )}
      {screen === "lobby" && (
        <GameLobby
          config={gameConfig}
          onGameReady={handleGameReady}
          onBack={handleBackToHome}
        />
      )}
      {screen === "game" && (
        <GameBoard config={gameConfig} onBackToMenu={handleBackToHome} />
      )}
      {screen === "leaderboard" && <Leaderboard onBack={handleBackToHome} />}
    </>
  );
}
