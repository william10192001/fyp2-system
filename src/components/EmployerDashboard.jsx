import React, { useState } from "react";
              </div>

              <div className="bg-gray-800 p-4 rounded-xl">
                <div className="text-gray-400 text-sm">
                  Education
                </div>
                <div className="mt-1">
                  {candidate.education}
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-xl">
                <div className="text-gray-400 text-sm">
                  Experience
                </div>
                <div className="mt-1">
                  {candidate.experience}
                </div>
              </div>

            </div>

            {/* MATCHED KEYWORDS */}
            <div className="mb-6">

              <h3 className="text-xl font-bold mb-3">
                Matched Keywords
              </h3>

              <div className="flex flex-wrap gap-2">

                {candidate.matchedKeywords.map((k, i) => (

                  <div
                    key={i}
                    className="bg-green-500/20 text-green-400 px-3 py-2 rounded-xl border border-green-500/30"
                  >
                    {k}
                  </div>

                ))}

              </div>

            </div>

            {/* RESUME PREVIEW */}
            <div>

              <h3 className="text-xl font-bold mb-4">
                Resume Preview
              </h3>

              <div
                className="bg-white text-black rounded-2xl p-6 max-h-[500px] overflow-y-auto leading-7"
                dangerouslySetInnerHTML={{
                  __html: highlightKeywords(
                    candidate.resumeText,
                    candidate.matchedKeywords
                  )
                }}
              />

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}

export default EmployerDashboard;