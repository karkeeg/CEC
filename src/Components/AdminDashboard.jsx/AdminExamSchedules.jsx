import React from "react";

const AdminExamSchedules = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-4">Exam Schedules</h1>
        <p className="text-gray-600 mb-4">
          Manage exam schedules here. Create, edit, or delete schedules by program/semester/subject.
        </p>
        {/* TODO: Table of schedules, filters by department/program/semester, modal for create/edit */}
        <div className="text-gray-500">Coming soon...</div>
      </div>
    </div>
  );
};

export default AdminExamSchedules;
