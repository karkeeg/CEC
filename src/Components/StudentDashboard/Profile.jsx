import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { fetchStudents, fetchTeachers } from "../../supabaseConfig/supabaseApi";
import supabase from "../../supabaseConfig/supabaseClient";
import Modal from "../Modal";
import Swal from 'sweetalert2';

const Profile = () => {
  const { user, role, setProfile, fetchUserProfile, profile } = useUser();
  const [studentData, setStudentData] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  // No departments state needed
  const [loading, setLoading] = useState(true);
  const [profileUploading, setProfileUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (role === "student" && user?.id) {
        const students = await fetchStudents();
        const student = students.find((s) => s.id === user.id);
        setStudentData(student);
      } else if (role === "teacher" && user?.id) {
        const teachers = await fetchTeachers();
        const teacher = teachers.find((t) => t.id === user.id);
        setTeacherData(teacher);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, role]);

  useEffect(() => {
    function getLastUrl(val) {
      if (Array.isArray(val)) return val.length > 0 ? val[val.length - 1] : "";
      return val || "";
    }
    let url = "";
    if (role === "student" && studentData) {
      url = getLastUrl(studentData.profile_pic);
      setProfileUrl(url);
      setCoverUrl(getLastUrl(studentData.cover_pic));
      setProfile(studentData);
    } else if (role === "teacher" && teacherData) {
      url = getLastUrl(teacherData.profile_pic);
      setProfileUrl(url);
      setCoverUrl(getLastUrl(teacherData.cover_pic));
      setProfile(teacherData);
    }
  }, [studentData, teacherData, role, setProfile]);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const folder = type === "cover" ? "cover" : "profile";
    const filePath = `${folder}/${role}_${user.id}_${type}_${Date.now()}`;
    if (type === "profile") setProfileUploading(true);
    else setCoverUploading(true);
    const { data, error } = await supabase.storage
      .from("profile")
      .upload(filePath, file, { upsert: true });
    if (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Upload failed: ' + error.message,
        icon: 'error',
        customClass: {
          popup: 'swal-small'
        }
      });
      setProfileUploading(false);
      setCoverUploading(false);
      return;
    }
    const url = supabase.storage.from("profile").getPublicUrl(filePath)
      .data.publicUrl;
    const table = role === "student" ? "students" : "teachers";
    const field = type === "profile" ? "profile_pic" : "cover_pic";
    // If the field is text[], fetch the current array and append
    let newArr = [url];
    if (role === "student") {
      const { data: current, error: fetchErr } = await supabase
        .from(table)
        .select(field)
        .eq("id", user.id)
        .single();
      if (!fetchErr && current && Array.isArray(current[field])) {
        newArr = [...current[field], url];
      }
    }
    await supabase
      .from(table)
      .update({ [field]: newArr })
      .eq("id", user.id);
    // Immediately update the UI state
    if (type === "profile") setProfileUrl(url);
    else setCoverUrl(url);
    await fetchProfile();
    await fetchUserProfile(user.id, role); // update context profile
    if (type === "profile") setProfileUploading(false);
    else setCoverUploading(false);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading profile...</div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center py-8 px-2 md:px-0">
      {/* Cover Image */}
      <div className="w-full h-80 md:h-[480px] rounded-none overflow-hidden relative bg-gray-200 flex items-center justify-center">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="Cover"
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-green-200 via-green-100 to-green-300" />
        )}
        <label
          className="absolute top-4 right-6 bg-white/80 text-green-700 p-2 rounded-full shadow cursor-pointer hover:bg-green-100 transition-all duration-200 z-10 flex items-center justify-center"
          title="Edit cover image"
        >
          {coverUploading ? (
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536M9 13h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m4 0v6m0 0l-2-2m2 2l2-2"
              />
            </svg>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e, "cover")}
          />
        </label>
      </div>
      {/* Main Card */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl -mt-32 md:-mt-48 flex flex-col md:flex-row p-6 md:p-10 gap-8 relative z-10">
        {/* Left: Profile and info */}
        <div className="flex-1 flex flex-col items-center md:items-start">
          {/* Profile Image */}
          <div className="relative -mt-20 md:-mt-28 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {profileUrl ? (
              <img
                src={profileUrl}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-gray-400 flex items-center justify-center w-full h-full">
                No profile
              </span>
            )}
            <label
              className="absolute bottom-2 right-2 bg-green-600/90 text-white p-2 rounded-full shadow cursor-pointer hover:bg-green-700 transition-all duration-200 flex items-center justify-center"
              title="Edit profile image"
            >
              {profileUploading ? (
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536M9 13h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m4 0v6m0 0l-2-2m2 2l2-2"
                  />
                </svg>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "profile")}
              />
            </label>
          </div>
          {/* Name and info */}
          <div className="mt-4 w-full">
            <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center md:text-left">
              {role === "student" && studentData
                ? `${studentData.first_name} ${studentData.middle_name || ""} ${
                    studentData.last_name
                  }`
                : role === "teacher" && teacherData
                ? `${teacherData.first_name} ${teacherData.middle_name || ""} ${
                    teacherData.last_name
                  }`
                : "User"}
            </div>
            {role === "student" && studentData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-gray-700 text-base mt-4">
                <div>
                  <span className="font-semibold">Registration No:</span>{" "}
                  {studentData.reg_no}
                </div>
                <div>
                  <span className="font-semibold">Email:</span>{" "}
                  {studentData.email}
                </div>
                <div>
                  <span className="font-semibold">DOB:</span>{" "}
                  {studentData.date_of_birth}
                </div>
                <div>
                  <span className="font-semibold">Gender:</span>{" "}
                  {studentData.gender}
                </div>
                <div>
                  <span className="font-semibold">Guardian:</span>{" "}
                  {studentData.guardian_name}
                </div>
                <div>
                  <span className="font-semibold">Address:</span>{" "}
                  {studentData.address}
                </div>
                <div>
                  <span className="font-semibold">Year:</span>{" "}
                  {studentData.year}
                </div>
                <div>
                  <span className="font-semibold">Faculty:</span>{" "}
                  {studentData.faculty_id}
                </div>
                <div>
                  <span className="font-semibold">Department:</span>{" "}
                  {studentData.department_id}
                </div>
                <div>
                  <span className="font-semibold">Section:</span>{" "}
                  {studentData.section_id}
                </div>
              </div>
            )}
            {role === "teacher" && teacherData && (
              <div className="grid grid-cols-1 gap-y-2 text-gray-700 text-base mt-4">
                <div>
                  <span className="font-semibold">Email:</span>{" "}
                  {teacherData.email}
                </div>
                <div>
                  <span className="font-semibold">Phone:</span>{" "}
                  {teacherData.phone}
                </div>
                <div>
                  <span className="font-semibold">Gender:</span>{" "}
                  {teacherData.gender}
                </div>
                <div>
                  <span className="font-semibold">Department:</span>{" "}
                  {teacherData.department?.name}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right: (empty or future use) */}
        <div className="w-full md:w-64 flex flex-col gap-6 mt-8 md:mt-0"></div>
      </div>
      {/* Edit Profile Button */}
      {role === "teacher" && (
        <div className="w-full flex justify-end max-w-5xl mt-4">
          <button
            onClick={() => {
              setEditForm(teacherData);
              setEditOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition"
          >
            Edit Profile
          </button>
        </div>
      )}
      {role === "teacher" && editOpen && (
        <Modal onClose={() => setEditOpen(false)}>
          <form
            className="p-4 flex flex-col gap-4 min-w-[300px]"
            onSubmit={async (e) => {
              e.preventDefault();
              setEditLoading(true);
              const table = role === "student" ? "students" : "teachers";
              const idField = "id";
              const updateFields = { ...editForm };
              delete updateFields.id;
              const { error } = await supabase
                .from(table)
                .update(updateFields)
                .eq("id", editForm.id);
              setEditLoading(false);
              if (!error) {
                setEditOpen(false);
                await fetchProfile();
              } else {
                alert("Update failed: " + error.message);
              }
            }}
          >
            <h2 className="text-lg font-bold mb-2">Edit Profile</h2>
            {role === "student" && studentData && (
              <>
                <input
                  className="border p-2 rounded"
                  value={editForm.first_name || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  placeholder="First Name"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.middle_name || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, middle_name: e.target.value }))
                  }
                  placeholder="Middle Name"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.last_name || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  placeholder="Last Name"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.reg_no || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, reg_no: e.target.value }))
                  }
                  placeholder="Registration No"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="Email"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.date_of_birth || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      date_of_birth: e.target.value,
                    }))
                  }
                  placeholder="Date of Birth"
                  type="date"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.gender || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, gender: e.target.value }))
                  }
                  placeholder="Gender"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.guardian_name || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      guardian_name: e.target.value,
                    }))
                  }
                  placeholder="Guardian Name"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.address || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Address"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.year || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, year: e.target.value }))
                  }
                  placeholder="Year"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.faculty_id || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, faculty_id: e.target.value }))
                  }
                  placeholder="Faculty"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.department_id || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      department_id: e.target.value,
                    }))
                  }
                  placeholder="Department"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.section_id || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, section_id: e.target.value }))
                  }
                  placeholder="Section"
                />
              </>
            )}
            {role === "teacher" && teacherData && (
              <>
                <input
                  className="border p-2 rounded"
                  value={editForm.first_name || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  placeholder="First Name"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.middle_name || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, middle_name: e.target.value }))
                  }
                  placeholder="Middle Name"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.last_name || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  placeholder="Last Name"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="Email"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Phone"
                />
                <input
                  className="border p-2 rounded"
                  value={editForm.gender || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, gender: e.target.value }))
                  }
                  placeholder="Gender"
                />
              </>
            )}
            <div className="flex gap-4 mt-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Description section (bottom) */}
      <div className="w-full max-w-3xl mt-8">
        <div className="bg-white rounded-2xl shadow p-6 text-gray-600 text-sm">
          {/* Optionally, a short description or about section can go here. */}
        </div>
      </div>
    </div>
  );
};

export default Profile;
