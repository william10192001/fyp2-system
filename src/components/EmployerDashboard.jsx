import React, { useState } from "react";

function CandidateDashboard({ candidates, setCandidates, user, logout }) {
  const [skill, setSkill] = useState("");
  const [education, setEducation] = useState("");

  const addProfile = () => {
    const score = skill.includes("React") ? 95 : 70;

    setCandidates([
      ...candidates,
      {
        id: Date.now(),
        user: user.email,
        skill,
        education,
        score
      }
    ]);
  };

  return (
    <div>
      <h1>Candidate Dashboard</h1>

      <input placeholder="Skill" onChange={(e)=>setSkill(e.target.value)} />
      <input placeholder="Education" onChange={(e)=>setEducation(e.target.value)} />

      <button onClick={addProfile}>Submit</button>

      <h3>Your Profiles:</h3>

      {candidates.filter(c=>c.user===user.email).map(c=>(
        <div key={c.id}>
          {c.skill} - {c.education} - Score: {c.score}
        </div>
      ))}

      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default CandidateDashboard;