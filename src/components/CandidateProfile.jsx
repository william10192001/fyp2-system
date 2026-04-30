import React, { useState, useEffect } from "react";

function CandidateProfile({ user, refresh }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    skills: "",
    experience: "",
    education: ""
  });

  useEffect(() => {
    fetch("https://fyp2-backend-gihc.onrender.com/candidates")
      .then(res => res.json())
      .then(data => {
        const me = data.find(u => u.email === user.email);
        if (me) {
          setForm({
            name: me.name || "",
            phone: me.phone || "",
            skills: me.skills || "",
            experience: me.experience || "",
            education: me.education || ""
          });
        }
      });
  }, [user]);

  const save = async () => {
    await fetch("https://fyp2-backend-gihc.onrender.com/profile", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ ...form, email: user.email })
    });

    alert("Saved ✅");

    // 🔥 正确位置
    if (refresh) refresh();
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl mb-4">My Profile</h2>

      <input
        placeholder="Name"
        value={form.name}
        onChange={e => setForm({...form, name:e.target.value})}
        className="block mb-2 p-2 bg-gray-700 w-full"
      />

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={e => setForm({...form, phone:e.target.value})}
        className="block mb-2 p-2 bg-gray-700 w-full"
      />

      <input
        placeholder="Skills"
        value={form.skills}
        onChange={e => setForm({...form, skills:e.target.value})}
        className="block mb-2 p-2 bg-gray-700 w-full"
      />

      <input
        placeholder="Experience"
        value={form.experience}
        onChange={e => setForm({...form, experience:e.target.value})}
        className="block mb-2 p-2 bg-gray-700 w-full"
      />

      <input
        placeholder="Education"
        value={form.education}
        onChange={e => setForm({...form, education:e.target.value})}
        className="block mb-2 p-2 bg-gray-700 w-full"
      />

      <button
        onClick={save}
        className="bg-blue-500 px-4 py-2 mt-3 rounded"
      >
        Save
      </button>
    </div>
  );
}

export default CandidateProfile;