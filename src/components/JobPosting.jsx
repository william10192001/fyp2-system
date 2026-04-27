import React, { useState } from "react";

function JobPosting({ jobs, setJobs }) {
  const [title, setTitle] = useState("");

  const addJob = () => {
    if (!title) return;

    setJobs([...jobs, { id: Date.now(), title }]);
    setTitle("");
  };

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Job Postings</h1>
          <p className="text-gray-500">
            Create, manage, and track your jobs
          </p>
        </div>

        <button className="btn-primary" onClick={addJob}>
          + Create Job
        </button>
      </div>

      <input
        className="input mb-6"
        placeholder="Job title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Job Title</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t">
                <td className="p-4">{job.title}</td>
                <td>
                  <span className="bg-green-50 text-green-600 px-2 py-1 rounded">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default JobPosting;