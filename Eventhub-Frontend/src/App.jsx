import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  async function handleLogin() {
  const response = await fetch("http://127.0.0.1:8000/accounts/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });

  const data = await response.json();

  console.log(data);
}
  return (
    <div>
      <h1>EventHub</h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>
  Login
</button>
    </div>
  );
}

export default App;