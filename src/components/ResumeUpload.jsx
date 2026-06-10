import React, { useState } from "react";

function ResumeUpload({ user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const upload = async () => {
    if (!file) { alert("Please select a PDF file first"); return; }
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", user.email);

    try {
      const res = await fetch("https://fyp2-backend-gihc.onrender.com/upload-resume", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) { alert(data.msg || "Upload failed ❌"); return; }
      setResult(data);
    } catch (err) {
      alert("Error uploading ❌");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">

      {/* DROP ZONE */}
      <label className="block border-2 border-dashed border-gray-700 hover:border-blue-500 transition rounded-xl p-8 text-center cursor-pointer">
        <div className="text-4xl mb-2">📄</div>
        <div className="text-gray-400 text-sm">
          {file ? (
            <span className="text-blue-400 font-semibold">{file.name}</span>
          ) : (
            <>Click to select PDF resume</>
          )}
        </div>
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={e => setFile(e.target.files[0])}
        />
      </label>

      <button
        onClick={upload}
        disabled={loading || !file}
        className="w-full bg-blue-600 hover:bg-blue-700 transition py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {loading ? "⏳ Processing..." : "Upload & Analyze"}
      </button>

      {/* RESULT */}
      {result && (
        <div className="bg-[#1e293b] border border-green-500/30 rounded-xl p-5">
          <div className="text-green-400 font-semibold mb-3">
            ✅ Resume analyzed! {result.totalKeywords} keywords extracted.
          </div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {result.keywords?.slice(0, 50).map((kw, i) => (
              <span key={i} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default ResumeUpload;