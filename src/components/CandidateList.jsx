import React, { useEffect, useState } from "react";

function CandidateList() {

  const [list, setList] = useState([]);

  useEffect(() => {
    fetch("https://fyp2-backend-gihc.onrender.com/candidates")
      .then(res => res.json())
      .then(data => setList(data));
  }, []);

  return (
    <div>

      <h2>Candidate List</h2>

      {list.map((c, i) => (
        <div key={i} style={{border:"1px solid", margin:"10px"}}>
          <p>{c.email}</p>
          <p>{c.name}</p>
          <p>{c.skills}</p>
          <p>{c.experience}</p>
        </div>
      ))}

    </div>
  );
}

export default CandidateList;