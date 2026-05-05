import React, { useState } from "react";

function ResumeUpload({ user }) {
  const [file, setFile] = useState(null);

  const upload = async () => {
    if (!file) {
      alert("Select file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", user.email);

    try {
      const res = await fetch("https://fyp2-backend-gihc.onrender.com/upload-resume", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Upload failed ❌");
        return;
      }

      alert("Upload success ✅");

    } catch (err) {
      console.error(err);
      alert("Error uploading ❌");
    }
  };

  return (
    <div className="p-6 text-white">
      <h2>Upload Resume</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={upload} className="bg-blue-500 p-2 mt-2">
        Upload & Analyze
      </button>
    </div>
  );
}

export default ResumeUpload;