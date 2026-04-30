import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");

  const submit = async () => {
    const res = await fetch(`https://fyp2-backend-gihc.onrender.com/reset-password/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    alert(data.msg);

    navigate("/"); // ✅ 正确写法
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-10 rounded-xl">
        <h2>Reset Password</h2>

        <input
          type="password"
          placeholder="New password"
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 mt-4 w-full text-black"
        />

        <button onClick={submit} className="mt-4 bg-green-500 p-2 w-full">
          Reset Password
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;