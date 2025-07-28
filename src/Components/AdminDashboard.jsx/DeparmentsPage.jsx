import React, { useEffect, useState } from "react";
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
} from "../../supabaseConfig/supabaseApi";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import supabase from "../../supabaseConfig/supabaseClient";
import DepartmentForm from "../Forms/DepartmentForm";
import Loader from "../Loader";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A569BD",
  "#E74C3C",
];

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDepartment, setEditDepartment] = useState(null);
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      const data = await getAllDepartments();
      setDepartments(data);
      setLoading(false);
    };
    fetchDepartments();
    // Fetch faculties for dropdown
    supabase
      .from("faculties")
      .select("id, name")
      .then(({ data }) => {
        setFaculties(data || []);
      });
  }, []);

  const filtered = departments.filter((dept) =>
    `${dept.name} ${dept.faculty.name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const facultyCounts = filtered.reduce((acc, dept) => {
    const facultyName = dept.faculty.name;
    acc[facultyName] = (acc[facultyName] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(facultyCounts).map(([faculty, count]) => ({
    faculty,
    count,
  }));

  const exportToPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18);
    doc.text("Departments Report", 40, 40);
    autoTable(doc, {
      startY: 60,
      head: [["Name", "Faculty"]],
      body: filtered
        .slice(0, visibleCount)
        .map((dept) => [dept.name, dept.faculty.name]),
      theme: "grid",
      headStyles: {
        fillColor: [30, 108, 123],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 40, right: 40 },
    });
    doc.save("departments-report.pdf");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading departments data..." />
      </div>
    );
  }

  return (
    <div className="bg-white p-2 sm:p-4 md:p-8 border rounded-lg shadow-md bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen min-w-0">
      {/* Heading and Export PDF */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2 min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-0 text-center md:text-left">
          Departments
        </h1>
        <button
          onClick={exportToPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto"
        >
          Export PDF
        </button>
      </div>
      {/* Search and Add Department */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2 min-w-0">
        <input
          type="text"
          placeholder="Search department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded-md w-full sm:w-64 text-base"
        />
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto"
          >
            Add New Department
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto min-w-0" id="departments-table">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="loader" />
          </div>
        ) : departments.length === 0 ? (
          <p className="text-gray-500">No departments found.</p>
        ) : (
          <table className="w-full bg-white border text-sm md:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Faculty</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visibleCount).map((dept) => (
                <tr
                  key={dept.id}
                  className="text-center border-t hover:bg-blue-50 transition"
                >
                  <td className="px-4 py-2">{dept.name}</td>
                  <td className="px-4 py-2">{dept.faculty.name}</td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => {
                        setEditDepartment(dept);
                        setShowEditModal(true);
                      }}
                    >
                      Update
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length > visibleCount && (
          <div className="text-center mb-4 mt-4">
            <button
              onClick={() => setVisibleCount((prev) => prev + 5)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Show More
            </button>
          </div>
        )}
      </div>

      <div className="flex mt-8 bg-gray-100 flex-col md:flex-row gap-4 sm:gap-8 items-center rounded-lg p-4 min-w-0">
        {/* Pie Chart */}
        <div className="md:w-1/2 mb-8 w-full h-72 flex items-center justify-center min-w-0 overflow-x-auto">
          {chartData.length === 0 ? (
            <p>No data to display.</p>
          ) : (
            <>
              <h2 className="text-center mt-4 mb-6 text-2xl font-bold text-gray-400">
                Pie Charts
              </h2>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="faculty"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Custom Legend */}
        <div className="md:w-1/2 w-full mt-8 md:mt-0 min-w-0">
          <h2 className="text-xl font-semibold mb-4">Faculty Colors</h2>
          <ul className="space-y-2">
            {chartData.map((entry, index) => (
              <li key={entry.faculty} className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span className="text-lg">{entry.faculty}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-2 md:p-6">
          <div className="w-full max-w-xs md:max-w-lg min-w-0">
            <DepartmentForm
              mode="add"
              faculties={faculties}
              onClose={() => setShowAddModal(false)}
              onSubmit={async (formData) => {
                try {
                  let imageUrl = formData.image_url;
                  if (formData.image) {
                    const filePath = `departments/${Date.now()}_${
                      formData.image.name
                    }`;
                    const { error } = await supabase.storage
                      .from("public-files")
                      .upload(filePath, formData.image);
                    if (error) throw error;
                    const { data } = supabase.storage
                      .from("public-files")
                      .getPublicUrl(filePath);
                    imageUrl = data.publicUrl;
                  }
                  let coursesJson = formData.courses;
                  try {
                    coursesJson = JSON.stringify(JSON.parse(formData.courses));
                  } catch {}
                  await createDepartment({
                    id: crypto.randomUUID(),
                    name: formData.name,
                    faculty_id: formData.faculty_id,
                    description: formData.description,
                    courses: coursesJson,
                    image_url: imageUrl,
                  });
                  setShowAddModal(false);
                  const data = await getAllDepartments();
                  setDepartments(data);
                } catch (err) {
                  alert("Failed to add department: " + (err.message || err));
                }
              }}
            />
          </div>
        </div>
      )}
      {/* Edit Department Modal */}
      {showEditModal && editDepartment && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-2 md:p-6">
          <div className="w-full max-w-xs md:max-w-lg min-w-0">
            <DepartmentForm
              mode="edit"
              faculties={faculties}
              initialValues={{
                name: editDepartment.name,
                faculty_id: editDepartment.faculty?.id,
                facultyName: editDepartment.faculty?.name,
                description: editDepartment.description,
                courses: editDepartment.courses,
                image_url: editDepartment.image_url,
              }}
              onClose={() => {
                setShowEditModal(false);
                setEditDepartment(null);
              }}
              onSubmit={async (formData) => {
                try {
                  let imageUrl = formData.image_url;
                  if (formData.image) {
                    const filePath = `departments/${Date.now()}_${
                      formData.image.name
                    }`;
                    const { error } = await supabase.storage
                      .from("public-files")
                      .upload(filePath, formData.image);
                    if (error) throw error;
                    const { data } = supabase.storage
                      .from("public-files")
                      .getPublicUrl(filePath);
                    imageUrl = data.publicUrl;
                  }
                  let coursesJson = formData.courses;
                  try {
                    coursesJson = JSON.stringify(JSON.parse(formData.courses));
                  } catch {}
                  await updateDepartment(editDepartment.id, {
                    name: formData.name,
                    faculty_id: formData.faculty_id,
                    description: formData.description,
                    courses: coursesJson,
                    image_url: imageUrl,
                  });
                  setShowEditModal(false);
                  setEditDepartment(null);
                  const data = await getAllDepartments();
                  setDepartments(data);
                } catch (err) {
                  alert("Failed to update department: " + (err.message || err));
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
