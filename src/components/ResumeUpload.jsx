import React, { useState } from "react";

function ResumeUpload({ user }) {
  const [file, setFile] = useState(null);
  const [keywords, setKeywords] = useState([]);

  const upload = async () => {
    if (!file) {
      alert("Please select a PDF");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("email", user.email);

    try {
      const res = await fetch("https://fyp2-backend-gihc.onrender.com/upload-resume", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Upload failed");
        return;
      }

      setKeywords(data.keywords);
      alert("Resume analyzed ✅");

    } catch (err) {
      console.error(err);
      alert("Error uploading ❌");
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl mb-4">Upload Resume (PDF)</h2>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />

      <button
        onClick={upload}
        className="bg-green-500 px-4 py-2 rounded"
      >
        Upload & Analyze
      </button>

      {keywords.length > 0 && (
        <div className="mt-4">
          <h3>Extracted Keywords:</h3>
          <p>{keywords.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;