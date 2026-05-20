import React, { useState } from "react";

function EmployerDashboard({ user, logout }) {

  const [jobDescription, setJobDescription] =
    useState("");

  const [results, setResults] = useState([]);

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

  const runMatching = async () => {

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

    <div className="min-h-screen bg-gray-950 text-white p-8">

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-4xl font-bold">
            Employer Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            AI Recruitment System
          </p>

        </div>

        <button
          onClick={logout}
          className="
            bg-red-500
            hover:bg-red-600
            px-5
            py-2
            rounded-xl
            font-semibold
          "
        >
          Logout
        </button>

      </div>

      {/* JOB DESCRIPTION */}

      <div className="
        bg-gray-900
        border
        border-gray-800
        rounded-2xl
        p-6
      ">

        <h2 className="text-2xl font-bold mb-4">
          Job Description
        </h2>

        <textarea
          rows="8"
          value={jobDescription}
          onChange={(e) =>
            setJobDescription(e.target.value)
          }
          className="
            w-full
            bg-gray-800
            border
            border-gray-700
            rounded-xl
            p-4
            outline-none
          "
          placeholder="
Example:
Looking for React developer with 3 years experience in JavaScript, Node.js and MongoDB...
"
        />

        <div className="flex gap-4 mt-5">

          <button
            onClick={saveJob}
            className="
              bg-blue-600
              hover:bg-blue-700
              px-5
              py-2
              rounded-xl
              font-semibold
            "
          >
            Save Job
          </button>

          <button
            onClick={runMatching}
            className="
              bg-green-600
              hover:bg-green-700
              px-5
              py-2
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

        <h2 className="text-3xl font-bold mb-6">
          Matching Results
        </h2>

        <div className="grid gap-6">

          {results.map((candidate, index) => (

            <div
              key={index}
              className="
                bg-gray-900
                border
                border-gray-800
                rounded-2xl
                p-6
              "
            >

              <div className="
                flex
                justify-between
                items-start
              ">

                <div>

                  <h3 className="text-2xl font-bold">
                    {candidate.name || "Unnamed"}
                  </h3>

                  <p className="text-gray-400 mt-1">
                    {candidate.email}
                  </p>

                </div>

                <div className="
                  bg-green-500/20
                  text-green-400
                  px-4
                  py-2
                  rounded-xl
                  font-bold
                  text-xl
                ">
                  {candidate.score}%
                </div>

              </div>

              <div className="
                grid
                md:grid-cols-2
                gap-4
                mt-6
              ">

                <div className="
                  bg-gray-800
                  p-4
                  rounded-xl
                ">
                  <div className="text-gray-400 text-sm">
                    Skills
                  </div>

                  <div className="mt-1">
                    {candidate.skills || "N/A"}
                  </div>
                </div>

                <div className="
                  bg-gray-800
                  p-4
                  rounded-xl
                ">
                  <div className="text-gray-400 text-sm">
                    Experience
                  </div>

                  <div className="mt-1">
                    {candidate.experience || "N/A"}
                  </div>
                </div>

              </div>

              {/* MATCHED KEYWORDS */}

              <div className="mt-6">

                <div className="
                  text-gray-400
                  text-sm
                  mb-3
                ">
                  AI Matched Keywords
                </div>

                <div className="flex flex-wrap gap-2">

                  {candidate.matchedKeywords?.map(
                    (word, i) => (

                      <span
                        key={i}
                        className="
                          bg-green-500/20
                          text-green-400
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

              {/* RESUME TEXT */}

              <div className="mt-6">

                <div className="
                  text-gray-400
                  text-sm
                  mb-3
                ">
                  Resume Preview
                </div>

                <div className="
                  bg-black/40
                  border
                  border-gray-700
                  rounded-xl
                  p-5
                  max-h-[400px]
                  overflow-y-auto
                  whitespace-pre-wrap
                  text-sm
                  leading-7
                ">

                  {candidate.resumeText || "No resume"}

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

export default EmployerDashboard;