import supabase from "./supabaseClient";

// ------------------- ARTICLES -------------------
export const fetchArticles = async () => {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchArticleBySlug = async (slug) => {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// ------------------- NOTICES -------------------
export const fetchNotices = async () => {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchNoticeTitles = async () => {
  const { data, error } = await supabase
    .from("notices")
    .select("title,description,created_at,notice_id");
  if (error) throw error;
  return data;
};

// ------------------- DOWNLOADS -------------------
export const fetchDownloadCategories = async () => {
  const { data, error } = await supabase
    .from("download_categories")
    .select("id, name, description")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchDownloadFilesByCategory = async (categoryId) => {
  const { data, error } = await supabase
    .from("download_files")
    .select("id, file_name, file_url, description, uploaded_at, uploaded_by")
    .eq("category_id", categoryId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchMoreDownloadFiles = async (excludeCategoryId, limit = 3) => {
  const { data, error } = await supabase
    .from("download_files")
    .select(
      "id, file_name, file_url, description, uploaded_at, uploaded_by, category_id"
    )
    .neq("category_id", excludeCategoryId)
    .order("uploaded_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

// ------------------- DEPARTMENTS -------------------
export const fetchDepartments = async () => {
  const { data, error } = await supabase
    .from("departments")
    .select(
      "id, name, faculty:faculty_id(id, name), description, courses, image_url"
    )
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchSubjects = async () => {
  const { data, error } = await supabase.from("subjects").select("id, name");
  if (error) throw error;
  return data;
};

export const fetchDepartmentById = async (id) => {
  const { data, error } = await supabase
    .from("departments")
    .select(
      "id, name, description, courses, image_url, faculty:faculty_id(id, name)"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

export const createDepartment = async (department) => {
  // department: { id, name, faculty_id, description, courses, image_url }
  const { data, error } = await supabase
    .from("departments")
    .insert([department]);
  if (error) throw error;
  return data;
};

export const updateDepartment = async (id, updates) => {
  // updates: { name, faculty_id, description, courses, image_url }
  const { data, error } = await supabase
    .from("departments")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  return data;
};

// ------------------- STUDENTS -------------------
export const fetchStudents = async () => {
  const { data, error } = await supabase.from("students").select("*");
  if (error) throw error;
  return data;
};

// ------------------- TEACHERS -------------------
export const fetchTeachers = async () => {
  const { data, error } = await supabase
    .from("teachers")
    .select("*, department:teacher_department(id, name)");
  if (error) throw error;
  return data;
};

// ------------------- ASSIGNMENTS -------------------
export const fetchAssignments = async (filters = {}) => {
  let query = supabase
    .from("assignments")
    .select(
      "id, title, due_date, teacher_id, description, subject:subject_id(name), year, class_id, created_at, files"
    );
  if (filters.due_date) query = query.gte("due_date", filters.due_date);
  if (filters.teacher_id) query = query.eq("teacher_id", filters.teacher_id);
  if (filters.class_id) query = query.eq("class_id", filters.class_id);
  if (filters.semester) query = query.eq("semester", filters.semester);
  query = query.order("due_date", { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const fetchAssignmentSubmissions = async (assignmentId) => {
  let query = supabase
    .from("submissions")
    .select(
      `id, assignment_id, class_id, student_id, submitted_at, files, notes, student:student_id (first_name, middle_name, last_name, email), grade:grades(id, grade, feedback, rated_at, rated_by)`
    ); // join student and grades
  if (assignmentId) {
    query = query.eq("assignment_id", assignmentId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ------------------- ATTENDANCE -------------------
export const fetchAttendance = async (filters = {}) => {
  let query = supabase.from("attendance").select("*");
  if (filters.fromDate) query = query.gte("date", filters.fromDate);
  if (filters.toDate) query = query.lte("date", filters.toDate);
  if (filters.student_id) query = query.eq("student_id", filters.student_id);
  if (filters.subject_id) query = query.eq("subject_id", filters.subject_id);
  if (filters.class_id) query = query.eq("class_id", filters.class_id);
  if (filters.teacher_id) query = query.eq("teacher_id", filters.teacher_id);
  query = query.order && query.order("date", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Fetch attendance for a specific student
export const getAttendanceByStudent = async (studentId, fromDate, toDate) => {
  let query = supabase
    .from("attendance")
    .select("*")
    .eq("student_id", studentId);
  if (fromDate) query = query.gte("date", fromDate);
  if (toDate) query = query.lte("date", toDate);
  query = query.order("date", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Create attendance records (array of objects)
export const createAttendance = async (records) => {
  // records: array of { student_id, subject_id, date, status, note, teacher_id, class_id, created_at }
  const { error } = await supabase.from("attendance").insert(records);
  return error;
};

// Update a single attendance record
export const updateAttendance = async (attendanceId, updates) => {
  // updates: { status, note, subject_id, ... }
  const { error } = await supabase
    .from("attendance")
    .update(updates)
    .eq("id", attendanceId);
  return error;
};

// Fetch attendance by class and date
export const getAttendanceByClassAndDate = async (classId, date) => {
  const { data, error } = await supabase
    .from("attendance")
    .select(
      "id, student_id, status, subject_id, note, teacher_id, date, class_id, created_at"
    )
    .eq("class_id", classId)
    .eq("date", date);
  if (error) throw error;
  return data;
};

// ------------------- GALLERY -------------------
export const fetchGalleryItems = async () => {
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const addGalleryItems = async (items) => {
  // items: [{ title, description, image_url, created_at }]
  const { data, error } = await supabase.from("gallery").insert(items);
  return { data, error };
};

// ------------------- CLASSES -------------------
export const fetchClasses = async () => {
  const { data, error } = await supabase
    .from("classes")
    .select(
      `class_id, name, subject:subject_id(name), room_no, teacher:teacher_id (first_name, middle_name, last_name), schedule,year, semester, capacity, department_id, description`
    );
  if (error) throw error;
  return data;
};

export const fetchRooms = async () => {
  const { data, error } = await supabase
    .from("sections")
    .select("room_no, name");
  if (error) throw error;
  return data;
};

export const fetchSections = async () => {
  const { data, error } = await supabase.from("sections").select("id, name");
  if (error) throw error;
  return data;
};

// ------------------- AUTH -------------------
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email, password, role) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data;
};

export const updateUserProfile = async (data) => {
  const { error } = await supabase.auth.updateUser({ data });
  if (error) throw error;
};

export const updateUserPassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

// --- Aliases for compatibility with refactored components ---
export const getAllClasses = fetchClasses;
export const getAllDepartments = fetchDepartments;
export const getAllStudents = fetchStudents;
export const getAllTeachers = fetchTeachers;
export const getAllTeacherDepartments = async () => {
  const { data, error } = await supabase
    .from("teacher_departments")
    .select(
      `id, teacher:teacher_id(id, first_name, middle_name, last_name, email), department:department_id(id, name)`
    );
  if (error) throw error;
  return data;
};
export const getAssignmentsByTeacher = (teacherId) =>
  fetchAssignments({ teacher_id: teacherId });
export const getAssignmentSubmissions = fetchAssignmentSubmissions;
export const getSubjects = async () => {
  const { data, error } = await supabase.from("subjects").select("id, name");
  if (error) throw error;
  return data;
};
export const createAssignment = async (assignment) => {
  const { data, error } = await supabase
    .from("assignments")
    .insert([assignment]);
  return { data, error };
};
export const deleteAssignment = async (assignmentId) => {
  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId);
  return error;
};
export const updateAssignmentSubmissionGrade = async (
  submissionId,
  updates
) => {
  const { error } = await supabase
    .from("submissions")
    .update(updates)
    .eq("id", submissionId);
  return error;
};
export const updateAssignment = async (assignmentId, updates) => {
  const { error } = await supabase
    .from("assignments")
    .update(updates)
    .eq("id", assignmentId);
  return error;
};
export const getTeacherDepartmentsWithClasses = async (teacherId) => {
  const { data, error } = await supabase
    .from("teacher_departments")
    .select(`id, department:department_id(id, name), classes:classes(id, name)`) // assumes FK
    .eq("teacher_id", teacherId);
  if (error) throw error;
  return data;
};
export const getStudentsByClass = async (classId) => {
  const { data, error } = await supabase
    .from("student_classes")
    .select(`id, student:student_id(id, first_name, middle_name, last_name)`)
    .eq("class_id", classId);
  if (error) throw error;
  return data;
};
export const updateTeacherProfile = async (teacherId, updates) => {
  const { error } = await supabase
    .from("teachers")
    .update(updates)
    .eq("id", teacherId);
  return error;
};
export const updateTeacherPassword = async (teacherId, newPassword) => {
  // This assumes you use Supabase Auth for password
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error;
};
export const deleteStudent = async (idOrRegNo) => {
  // Try both id and reg_no for compatibility
  let { error } = await supabase.from("students").delete().eq("id", idOrRegNo);
  if (error) {
    // Try reg_no if id fails
    error = (await supabase.from("students").delete().eq("reg_no", idOrRegNo))
      .error;
  }
  return error;
};
export const updateStudent = async (reg_no, updates) => {
  const { error } = await supabase
    .from("students")
    .update(updates)
    .eq("reg_no", reg_no);
  return error;
};
export const createStudent = async (student) => {
  const { data, error } = await supabase.from("students").insert([student]);
  return { data, error };
};
export const createTeacher = async (teacher) => {
  const { data, error } = await supabase.from("teachers").insert([teacher]);
  return { data, error };
};
export const createNotice = async (notice) => {
  const { data, error } = await supabase.from("notices").insert([notice]);
  return { data, error };
};
export const getGradesByTeacher = async (teacherId) => {
  const { data, error } = await supabase
    .from("grades")
    .select("date, average_grade")
    .eq("teacher_id", teacherId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data;
};
export const getClassesByTeacher = async (teacherId) => {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId);
  if (error) throw error;
  return data;
};
export const getAllAssignments = fetchAssignments;
export const getAllSubjects = getSubjects;
export const getAllAttendance = fetchAttendance;
export const getAllFees = async () => {
  const { data, error } = await supabase.from("fees").select("*");
  if (error) throw error;
  return data;
};

export const createFee = async (fee) => {
  const { data, error } = await supabase.from("fees").insert([fee]);
  return { data, error };
};

export const updateFee = async (id, updates) => {
  const { data, error } = await supabase
    .from("fees")
    .update(updates)
    .eq("id", id);
  return { data, error };
};

// ------------------- CUSTOM AUTH -------------------
export const checkCredentials = async (table, email, password) => {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error || !data) return null;
  // WARNING: Plain text password check. Use hashing in production!
  if (data.hashed_password === password) {
    return data;
  }
  return null;
};

export const updateStudentClass = async (studentId, classId) => {
  return await supabase
    .from("students")
    .update({ class_id: classId })
    .eq("id", studentId);
};

export const enrollStudentsInClass = async (studentIds, classId) => {
  // studentIds: array of student_id
  const records = studentIds.map((student_id) => ({
    student_id,
    class_id: classId,
  }));
  const { error } = await supabase.from("student_classes").insert(records);
  return error;
};

export const createClass = async (classData) => {
  return await supabase.from("classes").insert([classData]);
};

export const updateClass = async (classId, updates) => {
  const { error } = await supabase
    .from("classes")
    .update(updates)
    .eq("class_id", classId)
    .select();
  return error;
};

export const getStudentCountByClass = async (classId) => {
  const { count, error } = await supabase
    .from("student_classes")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId);
  if (error) throw error;
  return count;
};

export const removeStudentFromClass = async (studentId, classId) => {
  const { error } = await supabase
    .from("student_classes")
    .delete()
    .eq("student_id", studentId)
    .eq("class_id", classId);
  return error;
};

export const fetchRecentSubmissions = async (limit = 10) => {
  const { data, error } = await supabase
    .from("submissions")
    .select(
      "id, student_id, assignment_id, submitted_at, notes, assignments(title), students(first_name, last_name)"
    )
    .order("submitted_at", { ascending: false })
    .limit(limit);
  return data || [];
};

export const fetchRecentAssignments = async (limit = 10) => {
  const { data, error } = await supabase
    .from("assignments")
    .select(
      "id, title, teacher_id, created_at, teachers(first_name, last_name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
};

export const fetchRecentNotices = async (limit = 10) => {
  const { data, error } = await supabase
    .from("notices")
    .select("notice_id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
};

export const updateNotice = async (notice_id, updates) => {
  const { data, error } = await supabase
    .from("notices")
    .update(updates)
    .eq("notice_id", notice_id);
  return { data, error };
};

export const deleteNotice = async (notice_id) => {
  const { data, error } = await supabase
    .from("notices")
    .delete()
    .eq("notice_id", notice_id);
  return { data, error };
};

export const getAllNotices = fetchNotices;

export const logActivity = async (message, type = "notice", user = {}) => {
  const { user_id, user_role, user_name } = user;
  const { error } = await supabase.from("notifications").insert([
    {
      message,
      type,
      date: new Date().toISOString(),
      user_id,
      user_role,
      user_name,
    },
  ]);
  return { error };
};

export const fetchNotifications = async () => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("date", { ascending: false });
  return { data, error };
};

export const createGrade = async (grade) => {
  const { data, error } = await supabase
    .from("grades")
    .insert([grade])
    .select();
  return { data, error };
};

export const updateGrade = async (gradeId, updates) => {
  const { data, error } = await supabase
    .from("grades")
    .update(updates)
    .eq("id", gradeId)
    .select();
  return { data, error };
};

export const getGradeBySubmissionId = async (submissionId) => {
  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .eq("submission_id", submissionId)
    .single();
  return { data, error };
};

// Fetch attendance by date range (for admin attendance page)
export const getAttendanceByDateRange = async (fromDate, toDate) => {
  let query = supabase.from("attendance").select("*");
  if (fromDate) query = query.gte("date", fromDate);
  if (toDate) query = query.lte("date", toDate);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Fetch assignments for a student (by student_id and after a date)
export const getAssignmentsForStudent = async (studentId, fromDate) => {
  // Get all class_ids for this student
  const { data: studentClasses, error: scError } = await supabase
    .from("student_classes")
    .select("class_id")
    .eq("student_id", studentId);
  if (scError) return [];
  const classIds = (studentClasses || []).map((sc) => sc.class_id);
  if (!classIds.length) return [];
  let query = supabase
    .from("assignments")
    .select(
      "id, title, due_date, subject:subject_id(name), class_id, teacher:teacher_id(first_name, last_name), year, description, files"
    )
    .gte("due_date", fromDate)
    .order("due_date", { ascending: true })
    .in("class_id", classIds)
    .limit(5);
  const { data, error } = await query;
  if (error) return [];
  return data;
};

// Fetch submissions for a student for a set of assignments
export const getSubmissionsForStudent = async (studentId, assignmentIds) => {
  if (!assignmentIds.length) return [];
  const { data, error } = await supabase
    .from("submissions")
    .select("assignment_id, files, notes")
    .in("assignment_id", assignmentIds)
    .eq("student_id", studentId);
  if (error) return [];
  return data;
};

// Fetch recent notices (limit N)
export const getRecentNotices = async (limit = 5) => {
  const { data, error } = await supabase
    .from("notices")
    .select("title, description, created_at, notice_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data;
};

// Fetch all feedback for a student (joins submissions, assignments, grades, teachers)
export const getFeedbackForStudent = async (studentId) => {
  // Get all submissions for this student
  const { data: submissions, error: subError } = await supabase
    .from("submissions")
    .select(
      `
      id,
      assignment_id,
      submitted_at,
      files,
      notes,
      assignment:assignment_id (title, subject:subject_id(name)),
      grade:grades(id, grade, feedback, rated_at, rated_by, rating),
      teacher:assignment_id(teacher_id)
    `
    )
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false });
  if (subError) throw subError;
  return submissions;
};

// Fetch average grade for a subject across all students
export const getClassAverageBySubject = async (subjectName) => {
  // Get all assignments for this subject
  const { data: assignments, error: aError } = await supabase
    .from("assignments")
    .select("id")
    .eq("subject_id", subjectName);
  if (aError || !assignments || assignments.length === 0) return 0;
  const assignmentIds = assignments.map((a) => a.id);
  if (!assignmentIds.length) return 0;
  // Get all submissions for these assignments
  const { data: submissions, error: sError } = await supabase
    .from("submissions")
    .select("id")
    .in("assignment_id", assignmentIds);
  if (sError || !submissions || submissions.length === 0) return 0;
  const submissionIds = submissions.map((s) => s.id);
  if (!submissionIds.length) return 0;
  // Get all grades for these submissions
  const { data: grades, error: gError } = await supabase
    .from("grades")
    .select("grade")
    .in("submission_id", submissionIds);
  if (gError || !grades || grades.length === 0) return 0;
  const gradeVals = grades
    .map((g) => g.grade)
    .filter((g) => typeof g === "number");
  if (!gradeVals.length) return 0;
  return gradeVals.reduce((a, b) => a + b, 0) / gradeVals.length;
};

// Fetch assignment submission rate for a subject across all students
export const getAssignmentSubmissionRateBySubject = async (subjectId) => {
  // Get all assignments for this subject
  const { data: assignments, error: aError } = await supabase
    .from("assignments")
    .select("id")
    .eq("subject_id", subjectId);
  if (aError || !assignments || assignments.length === 0)
    return { submitted: 0, total: 0 };
  const assignmentIds = assignments.map((a) => a.id);
  if (!assignmentIds.length) return { submitted: 0, total: 0 };
  // For each assignment, check if there is at least one submission
  let submitted = 0;
  for (const id of assignmentIds) {
    const { data: subs, error: sError } = await supabase
      .from("submissions")
      .select("id")
      .eq("assignment_id", id);
    if (!sError && subs && subs.length > 0) submitted++;
  }
  return { submitted, total: assignmentIds.length };
};
