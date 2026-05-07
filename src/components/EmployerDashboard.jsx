import React, { useState } from "react";

function EmployerDashboard() {

  const [jobText, setJobText] = useState("");
  const [results, setResults] = useState([]);

  const runMatch = async () => {

    const res = await fetch(
      "https://fyp2-backend-gihc.onrender.com/match",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jobText })
      }
    );

    const data = await res.json();

    setResults(data);
  };

  return (
    <div className="p-6 text-white">

      <h1 className="text-3xl mb-6 font-bold">
        AI Recruitment Dashboard
      </h1>

      <textarea
        placeholder="Paste Job Description..."
        className="w-full p-4 rounded text-black h-40"
        onChange={(e) => setJobText(e.target.value)}
      />

      <button
        onClick={runMatch}
        className="bg-green-500 px-6 py-3 rounded mt-4"
      >
        Run AI Matching
      </button>

      <div className="mt-8">

        {results.map((r, i) => (

          <div
            key={i}
            className="bg-gray-800 p-4 rounded mb-4"
          >

            <h2 className="text-xl font-bold">
              {r.email}
            </h2>

            <div className="mt-2">
              AI Score:
              <span className="text-green-400">
                {" "} {r.score}%
              </span>
            </div>

            <div className="mt-2">
              Keywords:
            </div>

            <div className="text-sm text-gray-300">
              {r.matchedKeywords.join(", ")}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

export default EmployerDashboard;