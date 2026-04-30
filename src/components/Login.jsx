import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin, goRegister }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-10 rounded-2xl w-[350px] shadow-lg">

        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <input
          className="w-full mb-4 p-3 rounded bg-gray-700 text-white"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-4 p-3 rounded bg-gray-700 text-white"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-blue-500 py-2 rounded"
        >
          Login
        </button>

        <p
          onClick={goRegister}
          className="mt-4 text-center text-sm cursor-pointer text-blue-400"
        >
          Go Register
        </p>

        <p
          onClick={() => navigate("/forgot")}
          className="mt-2 text-sm text-red-400 cursor-pointer text-center"
        >
          Forgot Password?
        </p>

      </div>
    </div>
  );
}

export default Login;