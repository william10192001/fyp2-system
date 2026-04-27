import React, { useState } from "react";

function Register({ onRegister, goLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");

  const submit = () => {
    onRegister({ email, password, role });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-10 rounded-2xl w-[350px] shadow-lg">

        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>

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

        <select
          className="w-full mb-4 p-3 rounded bg-gray-700 text-white"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="candidate">Candidate</option>
          <option value="employer">Employer</option>
        </select>

        <button
          onClick={submit}
          className="w-full bg-green-500 py-2 rounded"
        >
          Register
        </button>

        <p onClick={goLogin} className="mt-4 text-center cursor-pointer text-blue-400">
          Back to Login
        </p>

      </div>
    </div>
  );
}

export default Register;