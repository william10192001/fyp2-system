import React, { useState } from "react";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const submit = async () => {
  try {
    console.log("Sending request...");

    let res;

    // 🔥 retry 机制
    for (let i = 0; i < 2; i++) {
      try {
        res = await fetch("https://fyp2-backend-gihc.onrender.com/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });

        break; // 成功就跳出
      } catch (err) {
        console.log("Retrying...");
      }
    }

    if (!res) {
      alert("Server sleeping, try again in 10s ⏳");
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Error");
      return;
    }

    alert("Email sent ✅");

  } catch (err) {
    console.error(err);
    alert("Cannot connect to server ❌");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-800 p-8 rounded w-[350px]">
        <h2 className="text-xl mb-4 text-center">Forgot Password</h2>

        <input
          className="w-full p-2 mb-4 text-black"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-red-500 py-2"
        >
          Send Reset Link
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;