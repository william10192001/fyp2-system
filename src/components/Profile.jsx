import React, { useState } from "react";

function Profile({ user }) {

  const [form, setForm] = useState({
    name: "",
    phone: "",
    skills: "",
    experience: "",
    education: ""
  });

  const save = async () => {
    await fetch("https://fyp2-backend-gihc.onrender.com/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: user.email,
        ...form
      })
    });

    alert("Profile saved ✅");
  };

  return (
    <div className="p-10">

      <h2 className="text-xl mb-4">My Profile</h2>

      <input placeholder="Name"
        onChange={(e) => setForm({...form, name: e.target.value})} />

      <input placeholder="Phone"
        onChange={(e) => setForm({...form, phone: e.target.value})} />

      <input placeholder="Skills"
        onChange={(e) => setForm({...form, skills: e.target.value})} />

      <input placeholder="Experience"
        onChange={(e) => setForm({...form, experience: e.target.value})} />

      <input placeholder="Education"
        onChange={(e) => setForm({...form, education: e.target.value})} />

      <button onClick={save}>Save</button>

    </div>
  );
}

export default Profile;