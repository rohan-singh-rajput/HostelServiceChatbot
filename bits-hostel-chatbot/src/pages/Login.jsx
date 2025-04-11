import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white text-black p-8 rounded-2xl shadow-xl space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Login to Dashboard</h2>
        <input
          type="email"
          className="w-full p-3 rounded-lg border border-gray-300"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full p-3 rounded-lg border border-gray-300"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-black text-white p-3 rounded-lg hover:bg-gray-900 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
