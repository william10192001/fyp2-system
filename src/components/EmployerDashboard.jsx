import React, { useState } from "react";

function EmployerDashboard({ user, logout }) {

  const [jobDescription, setJobDescription] =
    useState("");

  const [results, setResults] = useState([]);

  const [savedKeywords, setSavedKeywords] =
    useState([]);

  /* SAVE JOB */
  const saveJob = async () => {

    if (!jobDescription.trim()) {
      alert("Please enter job requirements");
      return;
    }

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

    if (data.keywords) {
      setSavedKeywords(data.keywords);
    }

    alert(data.msg);
  };

  /* RUN AI MATCH */
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

    if (Array.isArray(data)) {
      setResults(data);
    } else {
      alert(data.msg || "Matching failed");
    }
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">

        <div>
          <h1 className="text-4xl font-bold">
            AI Recruitment Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            Intelligent Candidate Matching System
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl font-semibold"
        >
          Logout
        </button>

      </div>

      {/* JOB INPUT */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">

        <h2 className="text-2xl font-bold mb-4">
          Job Requirements
        </h2>

        <textarea
          value={jobDescription}
          onChange={(e) =>
            setJobDescription(e.target.value)
          }
          className="w-full h-52 p-5 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          placeholder={`Example:

React
Node.js
MongoDB
Cybersecurity
2 years experience
Bachelor Degree`}
        />

        {/* BUTTONS */}
        <div className="flex gap-4 mt-6">

          <button
            onClick={saveJob}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
          >
            Save Job Keywords
          </button>

          <button
            onClick={runMatch}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold"
          >
            Run AI Matching
          </button>

        </div>

      </div>

      {/* SAVED KEYWORDS */}
      {savedKeywords.length > 0 && (

        <div className="mt-8 bg-gray-900 border border-gray-700 rounded-2xl p-6">

          <h2 className="text-2xl font-bold mb-4">
            Saved Keywords
          </h2>

          <div className="flex flex-wrap gap-3">

            {savedKeywords.map((word, index) => (

              <div
                key={index}
                className="bg-blue-600 px-4 py-2 rounded-full text-sm"
              >
                {word}
              </div>

            ))}

          </div>

        </div>

      )}

      {/* MATCH RESULTS */}
      <div className="mt-10">

        <h2 className="text-3xl font-bold mb-6">
          Candidate Results
        </h2>

        {results.length === 0 && (

          <div className="text-gray-400">
            No matching candidates yet
          </div>

        )}

        {results.map((candidate, index) => (

          <div
            key={index}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-6 shadow-xl"
          >

            <div className="flex justify-between items-center">

              <div>

                <h2 className="text-2xl font-bold">
                  {candidate.name}
                </h2>

                <div className="text-gray-400 mt-1">
                  {candidate.email}
                </div>

              </div>

              <div className="bg-green-600 px-5 py-3 rounded-xl text-xl font-bold">
                {candidate.score}%
              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">

              <div>
                <span className="text-gray-400">
                  Phone:
                </span>
                <div>{candidate.phone}</div>
              </div>

              <div>
                <span className="text-gray-400">
                  Education:
                </span>
                <div>{candidate.education}</div>
              </div>

              <div>
                <span className="text-gray-400">
                  Experience:
                </span>
                <div>{candidate.experience}</div>
              </div>

              <div>
                <span className="text-gray-400">
                  Skills:
                </span>
                <div>{candidate.skills}</div>
              </div>

            </div>

            {/* MATCHED KEYWORDS */}
            <div className="mt-6">

              <div className="text-lg font-semibold mb-3">
                Matched Keywords
              </div>

              <div className="flex flex-wrap gap-3">

                {candidate.matchedKeywords.map(
                  (word, i) => (

                    <div
                      key={i}
                      className="bg-gray-700 px-4 py-2 rounded-full text-sm"
                    >
                      {word}
                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default EmployerDashboard;