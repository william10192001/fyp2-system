import React, { useState } from "react";

function EmployerDashboard({ user, logout }) {
    
    <button onClick={logout} className="bg-red-500 px-4 py-2 rounded mt-6">
  Logout
</button>

  const [jobDescription, setJobDescription] =
    useState("");

  const [results, setResults] = useState([]);

  // 🔥 save employer keywords
  const saveJob = async () => {

    const res = await fetch(
      "https://fyp2-backend-gihc.onrender.com/job",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          jobDescription
        })
      }
    );

    const data = await res.json();

    alert(data.msg);
  };

  // 🔥 AI match
  const runMatch = async () => {

    const res = await fetch(
      "https://fyp2-backend-gihc.onrender.com/match",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          employerEmail: user.email
        })
      }
    );

    const data = await res.json();

    setResults(data);
  };

  return (

    <div className="p-6 text-white">

      <h1 className="text-3xl font-bold mb-6">
        AI Recruitment Dashboard
      </h1>

      <textarea
        className="w-full h-40 p-4 rounded text-black"
        placeholder="
Required Skills:
React
Node.js
MongoDB
Cybersecurity
2 years experience
Bachelor Degree
"
        onChange={(e) =>
          setJobDescription(e.target.value)
        }
      />

      <div className="flex gap-4 mt-4">

        <button
          onClick={saveJob}
          className="bg-blue-500 px-6 py-3 rounded"
        >
          Save Job Keywords
        </button>

        <button
          onClick={runMatch}
          className="bg-green-500 px-6 py-3 rounded"
        >
          Run AI Matching
        </button>

      </div>

      <div className="mt-10">

        {results.map((candidate, index) => (

          <div
            key={index}
            className="bg-gray-800 p-6 rounded mb-6"
          >

            <h2 className="text-2xl font-bold">
              {candidate.name}
            </h2>

            <div className="mt-2">
              Email: {candidate.email}
            </div>

            <div>
              Phone: {candidate.phone}
            </div>

            <div>
              Education: {candidate.education}
            </div>

            <div>
              Experience: {candidate.experience}
            </div>

            <div>
              Skills: {candidate.skills}
            </div>

            <div className="mt-4 text-green-400">
              AI Match Score:
              {" "}
              {candidate.score}%
            </div>

            <div className="mt-2 text-gray-300">

              Matched Keywords:

              <div className="mt-1">
                {candidate.matchedKeywords.join(", ")}
              </div>

            </div>

          </div>
        ))}

      </div>
    </div>
  );
}

export default EmployerDashboard;