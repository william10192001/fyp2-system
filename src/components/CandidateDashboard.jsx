import React, { useEffect, useState } from "react";
import CandidateProfile from "./CandidateProfile";
import ResumeUpload from "./ResumeUpload";

function CandidateDashboard({ user, logout }) {

  const [myData, setMyData] = useState(null);

  const fetchMyData = () => {

    fetch("https://fyp2-backend-gihc.onrender.com/candidates")
      .then(res => res.json())
      .then(data => {

        const found = data.find(
          c => c.email === user.email
        );

        setMyData(found);
      });
  };

  useEffect(() => {
    fetchMyData();
  }, [user]);

  return (

    <div className="min-h-screen bg-gray-950 text-white">

      {/* TOP NAVBAR */}
      <div className="
        flex
        justify-between
        items-center
        px-8
        py-5
        border-b
        border-gray-800
        bg-gray-900
      ">

        <div>

          <h1 className="text-3xl font-bold">
            Candidate Dashboard
          </h1>

          <p className="text-gray-400 mt-1">
            Welcome back, {user.email}
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

      {/* MAIN CONTENT */}
      <div className="p-8">

        {/* PROFILE + RESUME */}
        <div className="
          grid
          md:grid-cols-2
          gap-6
        ">

          <div className="
            bg-gray-900
            border
            border-gray-800
            rounded-2xl
            p-6
          ">

            <h2 className="text-2xl font-bold mb-4">
              My Profile
            </h2>

            <CandidateProfile
              user={user}
              refresh={fetchMyData}
            />

          </div>

          <div className="
            bg-gray-900
            border
            border-gray-800
            rounded-2xl
            p-6
          ">

            <h2 className="text-2xl font-bold mb-4">
              Resume Upload
            </h2>

            <ResumeUpload user={user} />

          </div>

        </div>

        {/* USER INFO */}
        <div className="
          mt-8
          bg-gray-900
          border
          border-gray-800
          rounded-2xl
          p-8
        ">

          <h2 className="text-2xl font-bold mb-6">
            Candidate Information
          </h2>

          {myData ? (

            <div className="
              grid
              md:grid-cols-2
              gap-6
            ">

              <div className="
                bg-gray-800
                p-5
                rounded-xl
              ">
                <div className="text-gray-400 text-sm">
                  Full Name
                </div>

                <div className="text-xl font-semibold mt-1">
                  {myData.name || "Not set"}
                </div>
              </div>

              <div className="
                bg-gray-800
                p-5
                rounded-xl
              ">
                <div className="text-gray-400 text-sm">
                  Email
                </div>

                <div className="text-xl font-semibold mt-1">
                  {myData.email}
                </div>
              </div>

              <div className="
                bg-gray-800
                p-5
                rounded-xl
              ">
                <div className="text-gray-400 text-sm">
                  Phone
                </div>

                <div className="text-xl font-semibold mt-1">
                  {myData.phone || "Not set"}
                </div>
              </div>

              <div className="
                bg-gray-800
                p-5
                rounded-xl
              ">
                <div className="text-gray-400 text-sm">
                  Education
                </div>

                <div className="text-xl font-semibold mt-1">
                  {myData.education || "Not set"}
                </div>
              </div>

              <div className="
                bg-gray-800
                p-5
                rounded-xl
              ">
                <div className="text-gray-400 text-sm">
                  Experience
                </div>

                <div className="text-xl font-semibold mt-1">
                  {myData.experience || "Not set"}
                </div>
              </div>

              <div className="
                bg-gray-800
                p-5
                rounded-xl
              ">
                <div className="text-gray-400 text-sm">
                  Skills
                </div>

                <div className="text-xl font-semibold mt-1">
                  {myData.skills || "Not set"}
                </div>
              </div>

            </div>

          ) : (

            <div className="text-gray-400">
              Loading candidate profile...
            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default CandidateDashboard;