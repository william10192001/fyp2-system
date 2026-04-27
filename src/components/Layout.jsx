import React from "react";
import CandidateDashboard from "./CandidateDashboard";

function Layout({ user, logout, candidates = [] }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* 🔥 顶部栏 */}
      <div className="flex justify-between p-4 bg-gray-800">
        <h1>AI Recruit System</h1>
        <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">
          Logout
        </button>
      </div>

      {/* 🔥 根据角色 */}
      <div>
        {user.role === "candidate" && (
          <CandidateDashboard user={user} candidates={candidates} />
        )}

        {user.role === "employer" && (
          <div className="p-6">
            <h2>Employer Dashboard</h2>
            <p>View candidates here</p>

            {candidates.map((c, i) => (
              <div key={i} className="border p-3 my-2">
                <p>{c.email}</p>
                <p>{c.skills}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default Layout;