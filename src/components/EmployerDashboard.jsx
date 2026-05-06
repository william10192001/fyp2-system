import React, { useState } from "react";

function EmployerDashboard() {
  const [jobText, setJobText] = useState("");
  const [results, setResults] = useState([]);

  const match = async () => {
    const res = await fetch("https://fyp2-backend-gihc.onrender.com/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ jobText })
    });

    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl mb-4">Employer Dashboard</h1>

      <textarea
        placeholder="Paste job description..."
        className="w-full p-2 text-black"
        onChange={(e) => setJobText(e.target.value)}
      />

      <button onClick={match} className="bg-green-500 p-2 mt-2">
        Run AI Matching
      </button>

      <h2 className="mt-6">Results:</h2>

      {results.map((r, i) => (
        <div key={i} className="border p-2 mt-2">
          <b>{r.email}</b>  
          <div>Score: {r.score}%</div>
          <div>Matched: {r.matched.join(", ")}</div>
        </div>
      ))}
    </div>
  );
}

export default EmployerDashboard;