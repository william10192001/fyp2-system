import React, { useState } from "react";

function EmployerDashboard({ user, logout }) {
  const [jobTitle,      setJobTitle]      = useState("");
  const [companyName,   setCompanyName]   = useState("");
  const [location,      setLocation]      = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  const BADGE = {
    "Perfect Match": { bg: "#f0fdfa", color: "#0f766e", border: "#99f6e4" },
    "Good Match":    { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    "Partial Match": { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    "Weak Match":    { bg: "#f9fafb", color: "#4b5563", border: "#e5e7eb" },
  };

  const saveJob = async () => {
    setSaving(true);
    const res = await fetch("https://fyp2-backend-gihc.onrender.com/job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, jobDescription, jobTitle, companyName, location })
    });
    const data = await res.json();
    alert(data.msg);
    setSaving(false);
  };

  const runMatching = async () => {
    setLoading(true);
    setResults([]);
    const res = await fetch("https://fyp2-backend-gihc.onrender.com/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employerEmail: user.email })
    });
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-gray-800 bg-[#111827]">
        <div>
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-gray-400 mt-1">AI Recruitment System · {user.email}</p>
        </div>
        <button onClick={logout} className="bg-red-500 hover:bg-red-600 transition px-5 py-2 rounded-xl font-semibold">
          Logout
        </button>
      </div>

      <div className="p-8 max-w-5xl mx-auto">

        {/* JOB FORM */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-5">Post a Job</h2>

          {/* Row 1 */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Job Title *</label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="w-full bg-[#1e293b] border border-gray-700 focus:border-blue-500 outline-none rounded-xl p-3 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Company Name</label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Tech Corp Sdn Bhd"
                className="w-full bg-[#1e293b] border border-gray-700 focus:border-blue-500 outline-none rounded-xl p-3 text-white text-sm"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-1 block">Location</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Johor Bahru, Malaysia"
              className="w-full bg-[#1e293b] border border-gray-700 focus:border-blue-500 outline-none rounded-xl p-3 text-white text-sm"
            />
          </div>

          {/* Row 3 */}
          <div className="mb-5">
            <label className="text-gray-400 text-xs mb-1 block">Job Description *</label>
            <textarea
              rows="7"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="e.g. Looking for a React developer with 3 years experience in JavaScript, Node.js..."
              className="w-full bg-[#1e293b] border border-gray-700 focus:border-blue-500 outline-none rounded-xl p-4 text-white text-sm resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button onClick={saveJob} disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 transition px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "💾 Save Job"}
            </button>
            <button onClick={runMatching} disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 transition px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50">
              {loading ? "🤖 Analyzing..." : "🚀 Run AI Matching"}
            </button>
          </div>
        </div>

        {/* RESULTS */}
        {loading && (
          <div className="mt-10 text-center text-gray-400 animate-pulse">
            🤖 Analyzing all candidates... please wait.
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-5">
              Matching Results
              <span className="ml-3 text-gray-400 text-base font-normal">{results.length} candidates found</span>
            </h2>

            <div className="grid gap-5">
              {results.map((c, i) => {
                const badge = BADGE[c.recommendation] || BADGE["Weak Match"];
                return (
                  <div key={i} className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-lg">

                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{c.name || "Unnamed"}</h3>
                          {c.recommendation && (
                            <span className="text-xs px-3 py-1 rounded-full font-semibold"
                              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {c.recommendation}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 mt-1 text-sm">{c.email}</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-extrabold text-green-400">{c.score}%</div>
                        <div className="text-gray-500 text-xs mt-1">AI Score</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-400"
                          style={{ width: `${c.score}%` }} />
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="grid md:grid-cols-2 gap-4 mt-5">
                      <div className="bg-[#1e293b] p-4 rounded-xl">
                        <div className="text-gray-400 text-xs mb-2">✅ Matched Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.matchedKeywords?.length > 0
                            ? c.matchedKeywords.map((w, j) => (
                                <span key={j} className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">{w}</span>
                              ))
                            : <span className="text-gray-500 text-sm">None</span>}
                        </div>
                      </div>
                      <div className="bg-[#1e293b] p-4 rounded-xl">
                        <div className="text-gray-400 text-xs mb-2">❌ Missing Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.missingSkills?.length > 0
                            ? c.missingSkills.map((w, j) => (
                                <span key={j} className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">{w}</span>
                              ))
                            : <span className="text-gray-500 text-sm">None</span>}
                        </div>
                      </div>
                    </div>

                    {c.summary && (
                      <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-purple-300 text-sm">
                        🤖 <strong>AI:</strong> {c.summary}
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-3 mt-4">
                      {[["Phone", c.phone], ["Experience", c.experience], ["Education", c.education]].map(([label, val]) => (
                        <div key={label} className="bg-[#1e293b] p-3 rounded-xl">
                          <div className="text-gray-400 text-xs">{label}</div>
                          <div className="text-sm mt-0.5">{val || "N/A"}</div>
                        </div>
                      ))}
                    </div>

                    {c.resumeText && (
                      <details className="mt-5">
                        <summary className="text-gray-400 text-sm cursor-pointer hover:text-white transition">
                          📄 Resume Preview
                        </summary>
                        <div className="mt-3 bg-black/40 border border-gray-700 rounded-xl p-4 max-h-52 overflow-y-auto whitespace-pre-wrap text-sm text-gray-300 leading-7">
                          {c.resumeText}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="mt-16 text-center text-gray-600">
            <div className="text-5xl mb-4">🤖</div>
            <p>Fill in job details above and click <strong>Run AI Matching</strong>.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployerDashboard;