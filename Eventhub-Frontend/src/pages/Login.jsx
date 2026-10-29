
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LOGIN_URL = "http://127.0.0.1:8000/accounts/login/";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.access && data.refresh) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        navigate("/events");
      } else {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        setError(
          data.error ||
            data.detail ||
            "Login failed. Check your username and password."
        );
      }
    } catch {
      setError(
        "Cannot connect to the server. Please check that Django is running."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span className="login-brand-icon">E</span>
          <span>EventHub</span>
        </div>

        <h1>Welcome back</h1>
        <p className="login-subtitle">
          Sign in to discover events and manage your registrations.
        </p>

        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={isLoading || !username.trim() || !password}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="login-footer">
          Your next experience starts here.
        </p>
      </section>
    </main>
  );
}

export default Login;
