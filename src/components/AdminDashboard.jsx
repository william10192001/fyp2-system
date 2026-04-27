import React from "react";

function AdminDashboard({ users, logout }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-heading font-bold mb-6">Admin Dashboard</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 text-left">Email</th>
              <th>Password</th>
              <th>Role</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.email} className="border-t">
                <td className="p-4">{u.email}</td>
                <td>{u.password}</td>
                <td>
                  <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs">
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={logout} className="btn-primary mt-6">
        Logout
      </button>
    </div>
  );
}

export default AdminDashboard;