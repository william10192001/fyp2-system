import React, { useEffect, useState } from "react";
import CandidateProfile from "./CandidateProfile";

function CandidateDashboard({ user }) {
  const [myData, setMyData] = useState(null);

  const fetchMyData = () => {
    fetch("https://fyp2-backend-gihc.onrender.com/candidates")
      .then(res => res.json())
      .then(data => {
        const found = data.find(c => c.email === user.email);
        setMyData(found);
      });
  };

  useEffect(() => {
    fetchMyData();
  }, [user]);

  return (
    <>
      {/* Profile */}
      <CandidateProfile user={user} refresh={fetchMyData} />

      {/* Dashboard */}
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