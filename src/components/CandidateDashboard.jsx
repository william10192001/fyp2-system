import React, { useEffect, useState } from "react";
import CandidateProfile from "./CandidateProfile";

function CandidateDashboard({ user, candidates = [] }) {
  const [myData, setMyData] = useState(null);

  useEffect(() => {
    if (!candidates || candidates.length === 0) return;

    const found = candidates.find(c => c.email === user.email);
    setMyData(found);
  }, [candidates, user]);

  return (
    <>
      {/* 🔥 Profile */}
      <CandidateProfile user={user} />

      {/* 🔥 Dashboard */}
      <div className="p-6 text-white">
        <h2 className="text-xl mb-4">Candidate Dashboard</h2>

        {myData ? (
          <div>
            <p>Name: {myData.name}</p>
            <p>Email: {myData.email}</p>
            <p>Phone: {myData.phone}</p>
            <p>Skills: {myData.skills}</p>
            <p>Experience: {myData.experience}</p>
            <p>Education: {myData.education}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </>
  );
}

export default CandidateDashboard;