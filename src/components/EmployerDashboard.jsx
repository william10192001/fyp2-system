import React, { useState } from "react";

function EmployerDashboard() {

  const [jobText, setJobText] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runMatch = async () => {

    if (!jobText) {
      alert("Enter job description");
      return;
    }

    setLoading(true);

    try {

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

    } catch (err) {
      console.error(err);
      alert("AI Matching failed ❌");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">

      <h1 className="text-3xl font-bold mb-6">
        AI Recruitment Dashboard
      </h1>

      <textarea
        placeholder="Paste Job Description Here..."
        className="w-full h-40 p-4 rounded text-black"
        onChange={(e) => setJobText(e.target.value)}
      />

      <button
        onClick={runMatch}
        className="bg-green-500 px-6 py-3 rounded mt-4"
      >
        {loading ? "Analyzing..." : "Run AI Matching"}
      </button>

      <div className="mt-10">

        {results.map((r, i) => (

          <div
            key={i}
            className="bg-gray-800 p-5 rounded mb-4"
          >
            <h2 className="text-xl font-bold">
              {r.email}
            </h2>

            <div className="mt-2">
              AI Score:
              <span className="text-green-400 ml-2">
                {r.score}%
              </span>
            </div>

            <div className="mt-2">
              Keywords:
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {r.matched.map((m, idx) => (
                <span
                  key={idx}
                  className="bg-blue-500 px-2 py-1 rounded text-sm"
                >
                  {m}
                </span>
              ))}
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default EmployerDashboard;