import React, { useState } from "react";

function EmployerDashboard({ user, logout }) {

  const [jobDescription, setJobDescription] =
    useState("");

  const [results, setResults] = useState([]);

  // SAVE JOB
  const saveJob = async () => {

    if (!jobDescription.trim()) {
      return alert("Please enter job keywords");
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

    alert(data.msg);
  };

  // RUN MATCH
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

    if (data.msg) {
      alert(data.msg);
      return;
    }

    setResults(data);
  };

  return (

    <div className="min-h-screen bg-gray-950 text-white p-8">

      {/* TOP BAR */}
      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold">
          AI Recruitment Dashboard
        </h1>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg"
        >
          Logout
        </button>

      </div>

      {/* JOB INPUT */}
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">

        <h2 className="text-2xl font-semibold mb-4">
          Job Requirements
        </h2>

        <textarea
          value={jobDescription}
          onChange={(e) =>
            setJobDescription(e.target.value)
          }
          className="
            w-full
            h-52
            p-5
            rounded-xl
            bg-gray-800
            text-white
            border
            border-gray-700
            outline-none
          "
          placeholder={`React
Node.js
MongoDB
Cybersecurity
JavaScript
API
Backend`}
        />

        <div className="flex gap-4 mt-6">

          <button
            onClick={saveJob}
            className="
              bg-blue-600
              hover:bg-blue-700
              px-6
              py-3
              rounded-xl
              font-semibold
            "
          >
            Save Job Keywords
          </button>

          <button
            onClick={runMatch}
            className="
              bg-green-600
              hover:bg-green-700
              px-6
              py-3
              rounded-xl
              font-semibold
            "
          >
            Run AI Matching
          </button>

        </div>

      </div>

      {/* RESULTS */}
      <div className="mt-10">

        {results.length === 0 ? (

          <div className="text-gray-400">
            No candidates matched yet.
          </div>

        ) : (

          results.map((candidate, index) => (

            <div
              key={index}
              className="
                bg-gray-900
                border
                border-gray-800
                p-6
                rounded-2xl
                mb-6
              "
            >

              <div className="flex justify-between items-center">

                <h2 className="text-3xl font-bold">
                  {candidate.name || "Unknown"}
                </h2>

                <div className="text-green-400 text-2xl font-bold">
                  {candidate.score}%
                </div>

              </div>

              <div className="mt-5 space-y-2 text-gray-300">

                <div>
                  <span className="font-semibold text-white">
                    Email:
                  </span>{" "}
                  {candidate.email}
                </div>

                <div>
                  <span className="font-semibold text-white">
                    Phone:
                  </span>{" "}
                  {candidate.phone}
                </div>

                <div>
                  <span className="font-semibold text-white">
                    Education:
                  </span>{" "}
                  {candidate.education}
                </div>

                <div>
                  <span className="font-semibold text-white">
                    Experience:
                  </span>{" "}
                  {candidate.experience}
                </div>

                <div>
                  <span className="font-semibold text-white">
                    Skills:
                  </span>{" "}
                  {candidate.skills}
                </div>

              </div>

              <div className="mt-5">

                <div className="text-blue-400 font-semibold mb-2">
                  Matched Keywords
                </div>

                <div className="flex flex-wrap gap-2">

                  {candidate.matchedKeywords.map(
                    (word, i) => (

                      <span
                        key={i}
                        className="
                          bg-blue-500/20
                          text-blue-300
                          px-3
                          py-1
                          rounded-full
                          text-sm
                        "
                      >
                        {word}
                      </span>
                    )
                  )}

                </div>

              </div>

            </div>
          ))
        )}

      </div>

    </div>
  );
}

export default EmployerDashboard;