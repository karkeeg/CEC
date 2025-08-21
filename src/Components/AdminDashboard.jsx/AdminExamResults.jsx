import React from "react";

const AdminExamResults = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-4">Exam Results</h1>
        <p className="text-gray-600 mb-4">
          Upload or manage exam results, edit entries, and control publish status.
        </p>
        {/* TODO: Upload CSV, results table with inline edit, publish toggle */}
        <div className="text-gray-500">Coming soon...</div>
      </div>
    </div>
  );
};

export default AdminExamResults;
