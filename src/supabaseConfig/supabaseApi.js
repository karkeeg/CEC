import supabase from "./supabaseClient";

// ------------------- UTILS: Retry & Abort -------------------
const DEFAULT_RETRY_OPTS = { retries: 2, backoffMs: 300 };
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const isTransient = (error) => {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  // Supabase/PostgREST may surface 429/5xx or network-like issues in error.message
  return (
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("5") // rough 5xx hint
  );
};

async function withRetry(fn, opts = DEFAULT_RETRY_OPTS) {
  const { retries, backoffMs } = { ...DEFAULT_RETRY_OPTS, ...(opts || {}) };
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fn();
      return res;
    } catch (err) {
      if (attempt >= retries || !isTransient(err)) throw err;
      await sleep(backoffMs * Math.pow(2, attempt));
      attempt++;
    }
  }
}

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
export const fetchNotices = async (limit = 10000, offset = 0, options = {}) => {
  let query = supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (options?.signal && query.abortSignal) query = query.abortSignal(options.signal);
  const { data, error } = await withRetry(() => query);
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
  // Normalize file_url to a string for consumers
  return (data || []).map((row) => ({
    ...row,
    file_url: Array.isArray(row?.file_url) ? row.file_url[0] : row?.file_url,
  }));
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
  return (data || []).map((row) => ({
    ...row,
    file_url: Array.isArray(row?.file_url) ? row.file_url[0] : row?.file_url,
  }));
};

// ------------------- DEPARTMENTS -------------------
export const fetchDepartments = async (limit = 10000, offset = 0, options = {}) => {
  let query = supabase
    .from("departments")
    .select(
      "id, name, faculty:faculty_id(id, name), description, courses, image_url"
    )
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);
  if (options?.signal && query.abortSignal) query = query.abortSignal(options.signal);
  const { data, error } = await withRetry(() => query);
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
      "id, name, description, courses, image_url, eligibility, duration, affiliated_body, career_prospects, estimated_fees, faculty:faculty_id(id, name)"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

export const createDepartment = async (department, actor) => {
  // department: { id, name, faculty_id, description, courses, image_url }
  const { data, error } = await supabase
    .from("departments")
    .insert([department]);
  if (error) throw error;
  await logActivitySafe(`Department "${department.name}" created.`, "department", actor);
  return data;
};

export const updateDepartment = async (id, updates, actor) => {
  // updates: { name, faculty_id, description, courses, image_url }
  const { data, error } = await supabase
    .from("departments")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  await logActivitySafe(`Department id=${id} updated.`, "department", actor);
  return data;
};

// Delete a department by id
export const deleteDepartment = async (id, actor) => {
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id);
  if (!error) {
    await logActivitySafe(`Department id=${id} deleted.`, "department", actor);
  }
  return error;
};

// ------------------- STUDENTS -------------------
export const updateStudentProfile = async (studentId, updates, actor) => {
  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", studentId);
  if (!error) {
    await logActivitySafe(`Student id=${studentId} profile updated.`, "student", actor);
  }
  return { data, error };
};
export const fetchStudents = async () => {
  let allStudents = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) throw error;

    if (!data || data.length === 0) break;

    allStudents = [...allStudents, ...data];
    from += pageSize;

    // If we got less than pageSize, we've reached the end
    if (data.length < pageSize) break;
  }

  return allStudents;
};

export const fetchStudentProfileById = async (studentId) => {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle(); // Use maybeSingle for a single record
  if (error) throw error;
  return data;
};

export const updateAdminProfile = async (adminId, updates, actor) => {
  const { data, error } = await supabase
    .from("teachers")
    .update(updates)
    .eq("id", adminId);
  if (!error) {
    await logActivitySafe(`Admin id=${adminId} profile updated.`, "admin", actor);
  }
  return { data, error };
};
// ------------------- TEACHERS -------------------
export const updateTeacherProfile = async (teacherId, updates, actor) => {
  const { data, error } = await supabase
    .from("teachers")
    .update(updates)
    .eq("id", teacherId);
  if (!error) {
    await logActivitySafe(`Teacher id=${teacherId} profile updated.`, "teacher", actor);
  }
  return { data, error };
};
export const fetchTeachers = async (limit = 10000, offset = 0, options = {}) => {
  let query = supabase
    .from("teachers")
    .select("*, department:teacher_department(id, name)")
    .range(offset, offset + limit - 1);
  if (options?.signal && query.abortSignal) query = query.abortSignal(options.signal);
  const { data, error } = await withRetry(() => query);
  if (error) throw error;
  return data;
};

export const fetchTeacherProfileById = async (teacherId) => {
  const { data, error } = await supabase
    .from("teachers")
    .select("*, department:teacher_department(id, name)")
    .eq("id", teacherId)
    .maybeSingle(); // Use maybeSingle for a single record
  if (error) throw error;
  return data;
};

export const deleteTeacher = async (teacherId, actor) => {
  const { error } = await supabase
    .from("teachers")
    .delete()
    .eq("id", teacherId);
  if (!error) {
    await logActivitySafe(`Teacher id=${teacherId} deleted.`, "teacher", actor);
  }
  return { error };
};

// ------------------- ASSIGNMENTS -------------------
export const fetchAssignments = async (filters = {}, limit = 10000, offset = 0, options = {}) => {
  let query = supabase
    .from("assignments")
    .select(
      "id, title, due_date,teacher_id, teacher:teacher_id(first_name, last_name), description, subject:subject_id(name), year, class_id, created_at, files"
    )
    .range(offset, offset + limit - 1);
  if (filters.due_date) query = query.gte("due_date", filters.due_date);
  if (filters.teacher_id) query = query.eq("teacher_id", filters.teacher_id);
  if (filters.class_id) query = query.eq("class_id", filters.class_id);
  if (filters.semester) query = query.eq("semester", filters.semester);
  query = query.order("due_date", { ascending: true });
  if (options?.signal && query.abortSignal) query = query.abortSignal(options.signal);
  const { data, error } = await withRetry(() => query);
  if (error) throw error;
  return data;
};

export const fetchAssignmentSubmissions = async (assignmentId, limit = 10000, offset = 0, options = {}) => {
  let query = supabase
    .from("submissions")
    .select(
      `id, assignment_id, class_id, student_id, submitted_at, files, notes, student:student_id (first_name, middle_name, last_name, email), grade:grades(id, grade, feedback, rated_at, rated_by)`
    )
    .range(offset, offset + limit - 1); // join student and grades
  if (assignmentId) {
    query = query.eq("assignment_id", assignmentId);
  }
  if (options?.signal && query.abortSignal) query = query.abortSignal(options.signal);
  const { data, error } = await withRetry(() => query);
  if (error) throw error;
  return data;
};

// ------------------- ATTENDANCE -------------------
export const fetchAttendance = async (filters = {}) => {
  let allAttendance = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    let query = supabase
      .from("attendance")
      .select("*")
      .range(from, from + pageSize - 1);
    if (filters.fromDate) query = query.gte("date", filters.fromDate);
    if (filters.toDate) query = query.lte("date", filters.toDate);
    if (filters.student_id) query = query.eq("student_id", filters.student_id);
    if (filters.subject_id) query = query.eq("subject_id", filters.subject_id);
    if (filters.class_id) query = query.eq("class_id", filters.class_id);
    if (filters.teacher_id) query = query.eq("teacher_id", filters.teacher_id);
    query = query.order && query.order("date", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) break;

    allAttendance = [...allAttendance, ...data];
    from += pageSize;

    // If we got less than pageSize, we've reached the end
    if (data.length < pageSize) break;
  }

  return allAttendance;
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
export const createAttendance = async (records, actor) => {
  // records: array of { student_id, subject_id, date, status, note, teacher_id, class_id, created_at }
  const { error } = await supabase.from("attendance").insert(records);
  if (!error) {
    await logActivitySafe(`Attendance inserted for ${records.length} record(s).`, "attendance", actor);
  }
  return error;
};

// Update a single attendance record
export const updateAttendance = async (attendanceId, updates, actor) => {
  // updates: { status, note, subject_id, ... }
  const { error } = await supabase
    .from("attendance")
    .update(updates)
    .eq("id", attendanceId);
  if (!error) {
    await logActivitySafe(`Attendance id=${attendanceId} updated.`, "attendance", actor);
  }
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
export const fetchGalleryItems = async (limit, offset = 0, options = {}) => {
  let query = supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });
  if (typeof limit === "number" && limit > 0) {
    query = query.range(offset, offset + limit - 1);
  }
  if (options?.signal && query.abortSignal) query = query.abortSignal(options.signal);
  const { data, error } = await withRetry(() => query);
  if (error) throw error;
  return data;
};

export const addGalleryItems = async (items, actor) => {
  // items: [{ title, description, image_url, created_at }]
  const { data, error } = await supabase.from("gallery").insert(items);
  if (!error) {
    await logActivitySafe(`Gallery: ${items?.length || 0} item(s) added.`, "gallery", actor);
  }
  return { data, error };
};

// ------------------- CLASSES -------------------
export const fetchClasses = async (limit = 10000, offset = 0, options = {}) => {
  let query = supabase
    .from("classes")
    .select(
      `class_id, name, subject:subject_id(name), room_no, teacher:teacher_id (first_name, middle_name, last_name), schedule,year, semester, capacity, department_id, description`
    )
    .range(offset, offset + limit - 1);
  if (options?.signal && query.abortSignal) query = query.abortSignal(options.signal);
  const { data, error } = await withRetry(() => query);
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
export const getAssignmentsByTeacher = async (teacherId) => {
  // First get the teacher's classes
  const teacherClasses = await getClassesByTeacher(teacherId);
  const classIds = teacherClasses.map((cls) => cls.id || cls.class_id);

  if (classIds.length === 0) {
    return [];
  }

  // Then get assignments for those classes
  const { data, error } = await supabase
    .from("assignments")
    .select(
      "id, title, due_date, teacher_id, description, subject:subject_id(name), year, class_id, created_at, files"
    )
    .in("class_id", classIds)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data || [];
};
export const getAssignmentSubmissions = fetchAssignmentSubmissions;
export const getSubjects = fetchSubjects;
export const createAssignment = async (assignment, actor) => {
  const { data, error } = await supabase
    .from("assignments")
    .insert([assignment]);
  if (!error) {
    await logActivitySafe(`Assignment "${assignment.title}" created.`, "assignment", actor);
  }
  return { data, error };
};
export const deleteAssignment = async (assignmentId, actor) => {
  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId);
  if (!error) {
    await logActivitySafe(`Assignment id=${assignmentId} deleted.`, "assignment", actor);
  }
  return error;
};
export const updateAssignmentSubmissionGrade = async (
  submissionId,
  updates,
  actor
) => {
  const { error } = await supabase
    .from("submissions")
    .update(updates)
    .eq("id", submissionId);
  if (!error) {
    await logActivitySafe(`Submission id=${submissionId} updated by grading.`, "submission", actor);
  }
  return error;
};
export const updateAssignment = async (assignmentId, updates, actor) => {
  const { error } = await supabase
    .from("assignments")
    .update(updates)
    .eq("id", assignmentId);
  if (!error) {
    await logActivitySafe(`Assignment id=${assignmentId} updated.`, "assignment", actor);
  }
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

// Get all students for a teacher directly using student_classes table
export const getStudentsByTeacher = async (teacherId) => {
  try {
    // First, get the class IDs for this teacher
    const { data: teacherClasses, error: classError } = await supabase
      .from('classes')
      .select('class_id')
      .eq('teacher_id', teacherId);
    
    if (classError) throw classError;
    
    if (!teacherClasses || teacherClasses.length === 0) {
      return [];
    }
    
    const classIds = teacherClasses.map(cls => cls.class_id);
    
    // Then get students from student_classes table for those class IDs
    const { data, error } = await supabase
      .from("student_classes")
      .select(`
        id,
        class_id,
        student_id,
        created_at,
        student:student_id(
          id,
          first_name,
          middle_name,
          last_name,
          email,
          gender,
          year
        )
      `)
      .in('class_id', classIds);
    
    if (error) throw error;
    
    // Transform the data to match the expected format
    const students = data
      ?.map(item => ({
        id: item.student?.id,
        first_name: item.student?.first_name,
        middle_name: item.student?.middle_name,
        last_name: item.student?.last_name,
        email: item.student?.email,
        gender: item.student?.gender,
        year: item.student?.year,
      }))
      .filter(student => student.id); // Filter out any null students
    
    // Remove duplicates based on student ID
    const uniqueStudents = students?.filter(
      (student, index, self) =>
        index === self.findIndex((s) => s.id === student.id)
    ) || [];
    
    return uniqueStudents;
    
  } catch (error) {
    console.error('Error in getStudentsByTeacher:', error);
    throw error;
  }
};

// Update teacher password directly in teachers table
export const updateTeacherPassword = async (teacherId, newPassword, actor) => {
  const { error } = await supabase
    .from("teachers")
    .update({ hashed_password: newPassword })
    .eq("id", teacherId);
  if (!error) {
    await logActivitySafe(`Teacher password updated for id=${teacherId}.`, "teacher", actor);
  }
  return error;
};

// Update student password directly in students table
export const updateStudentPassword = async (studentId, newPassword, actor) => {
  const { error } = await supabase
    .from("students")
    .update({ hashed_password: newPassword })
    .eq("id", studentId);
  if (!error) {
    await logActivitySafe(`Student password updated for id=${studentId}.`, "student", actor);
  }
  return error;
};

// Update admin password directly in admins table
export const updateAdminPassword = async (adminId, newPassword, actor) => {
  const { error } = await supabase
    .from("admins")
    .update({ hashed_password: newPassword })
    .eq("id", adminId);
  if (!error) {
    await logActivitySafe(`Admin password updated for id=${adminId}.`, "admin", actor);
  }
  return error;
};
export const deleteStudent = async (idOrRegNo, actor) => {
  // First, delete related records in the 'fees' table
  const { error: feesError } = await supabase
    .from("fees")
    .delete()
    .eq("student_id", idOrRegNo);

  if (feesError) {
    console.error("Error deleting associated fees records:", feesError);
    throw feesError;
  }

  // Then, try delete student by id or reg_no
  let resp = await supabase
    .from("students")
    .delete()
    .eq("id", idOrRegNo)
    .select("id, reg_no");

  if (resp.error) return resp.error;

  if (!resp.data || resp.data.length === 0) {
    // No rows deleted by id; try reg_no
    resp = await supabase
      .from("students")
      .delete()
      .eq("reg_no", idOrRegNo)
      .select("id, reg_no");
    if (!resp.error) {
      await logActivitySafe(`Student reg_no=${idOrRegNo} deleted.`, "student", actor);
    }
    return resp.error || null;
  }
  await logActivitySafe(`Student id=${idOrRegNo} deleted.`, "student", actor);
  return null;
};
export const updateStudent = async (reg_no, updates, actor) => {
  const { error } = await supabase
    .from("students")
    .update(updates)
    .eq("reg_no", reg_no);
  if (!error) {
    await logActivitySafe(`Student reg_no=${reg_no} updated.`, "student", actor);
  }
  return error;
};
export const createStudent = async (student, actor) => {
  const { data, error } = await supabase.from("students").insert([student]);
  if (!error) {
    const name = [student.first_name, student.last_name].filter(Boolean).join(" ") || student.reg_no || "student";
    await logActivitySafe(`Student "${name}" created.`, "student", actor);
  }
  return { data, error };
};
export const createTeacher = async (teacher, actor) => {
  const { data, error } = await supabase.from("teachers").insert([teacher]);
  if (!error) {
    const name = [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") || teacher.email || "teacher";
    await logActivitySafe(`Teacher "${name}" created.`, "teacher", actor);
  }
  return { data, error };
};
export const createNotice = async (notice, actor) => {
  const { data, error } = await supabase.from("notices").insert([notice]);
  if (!error) {
    await logActivitySafe(`Notice "${notice.title}" published.`, "notice", actor);
  }
  return { data, error };
};
export const getGradesByTeacher = async (teacherId) => {
  // Get grades that were rated by this teacher
  const { data, error } = await supabase
    .from("grades")
    .select("id, submission_id, grade, feedback, rated_at, rated_by, rating")
    .eq("rated_by", teacherId)
    .order("rated_at", { ascending: true });
  if (error) throw error;
  return data;
};
// Fetch submissions with joined student info for a list of submission IDs
export const getSubmissionsWithStudentsByIds = async (submissionIds) => {
  if (!submissionIds || submissionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("submissions")
    .select(
      `id, student:student_id (id, first_name, middle_name, last_name, email)`
    )
    .in("id", submissionIds);
  if (error) throw error;
  return data || [];
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
  let allFees = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("fees")
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) throw error;

    if (!data || data.length === 0) break;

    allFees = [...allFees, ...data];
    from += pageSize;

    // If we got less than pageSize, we've reached the end
    if (data.length < pageSize) break;
  }

  return allFees;
};

export const createFee = async (fee, actor) => {
  const { data, error } = await supabase.from("fees").insert([fee]);
  if (!error) {
    await logActivitySafe(`Fee created for student_id=${fee.student_id}.`, "fee", actor);
  }
  return { data, error };
};

export const updateFee = async (id, updates, actor) => {
  const { data, error } = await supabase
    .from("fees")
    .update(updates)
    .eq("id", id);
  if (!error) {
    await logActivitySafe(`Fee id=${id} updated.`, "fee", actor);
  }
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

export const updateStudentClass = async (studentId, classId, actor) => {
  const res = await supabase
    .from("students")
    .update({ class_id: classId })
    .eq("id", studentId);
  if (!res.error) {
    await logActivitySafe(`Student id=${studentId} moved to class_id=${classId}.`, "class", actor);
  }
  return res;
};

export const enrollStudentsInClass = async (studentIds, classId, actor) => {
  // studentIds: array of student_id
  const records = studentIds.map((student_id) => ({
    student_id,
    class_id: classId,
  }));
  const { error } = await supabase.from("student_classes").insert(records);
  if (!error) {
    await logActivitySafe(`Enrolled ${studentIds.length} student(s) to class_id=${classId}.`, "class", actor);
  }
  return error;
};

export const createClass = async (classData, actor) => {
  const res = await supabase.from("classes").insert([classData]);
  if (!res.error) {
    await logActivitySafe(`Class "${classData.name || classData.class_id}" created.`, "class", actor);
  }
  return res;
};

export const updateClass = async (classId, updates, actor) => {
  const { data, error } = await supabase
    .from("classes")
    .update(updates)
    .eq("class_id", classId)
    .select();
  
  if (error) {
    console.error("Error updating class:", error);
    throw error;
  }
  await logActivitySafe(`Class id=${classId} updated.`, "class", actor);
  
  return data;
};

export const getClassById = async (classId) => {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("class_id", classId)
    .single();
  
  if (error) {
    console.error("Error fetching class:", error);
    return null;
  }
  
  return data;
};

export const getStudentCountByClass = async (classId) => {
  const { count, error } = await supabase
    .from("student_classes")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId);
  if (error) throw error;
  return count;
};

export const removeStudentFromClass = async (studentId, classId, actor) => {
  const { error } = await supabase
    .from("student_classes")
    .delete()
    .eq("student_id", studentId)
    .eq("class_id", classId);
  if (!error) {
    await logActivitySafe(`Removed student_id=${studentId} from class_id=${classId}.`, "class", actor);
  }
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

// Alias used by UI components
// export const getRecentNotices = fetchRecentNotices;

export const updateNotice = async (notice_id, updates, actor) => {
  const { data, error } = await supabase
    .from("notices")
    .update(updates)
    .eq("notice_id", notice_id);
  if (!error) {
    await logActivitySafe(`Notice id=${notice_id} updated.`, "notice", actor);
  }
  return { data, error };
};

export const deleteNotice = async (notice_id, actor) => {
  const { data, error } = await supabase
    .from("notices")
    .delete()
    .eq("notice_id", notice_id);
  if (!error) {
    await logActivitySafe(`Notice id=${notice_id} deleted.`, "notice", actor);
  }
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

// Helper to normalize actor object and log safely (non-throwing)
const _actorInfo = (actor) => {
  if (!actor) return { user_id: null, user_role: null, user_name: null };
  const { id, user_id, role, user_role, name, user_name, first_name, middle_name, last_name, display_name, email } = actor || {};
  const actorId = user_id ?? id ?? null;
  const actorRole = user_role ?? role ?? null;
  const nameParts = [first_name, middle_name, last_name].filter(Boolean);
  const fullName = user_name ?? name ?? display_name ?? (nameParts.length ? nameParts.join(" ") : null);
  const actorName = fullName || email || null;
  return { user_id: actorId, user_role: actorRole, user_name: actorName };
};

// Attempt to read actor info from localStorage (browser-only)
const getDefaultActorFromStorage = () => {
  try {
    if (typeof window === "undefined") return null;
    const role = localStorage.getItem("role");
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    const u = JSON.parse(rawUser);
    // Shape best-effort actor
    const actor = {
      id: u?.id ?? u?.user_id ?? null,
      role: role ?? u?.role ?? null,
      first_name: u?.first_name,
      middle_name: u?.middle_name,
      last_name: u?.last_name,
      display_name: u?.display_name || u?.name,
      email: u?.email,
    };
    const info = _actorInfo(actor);
    if (!info.user_id && !info.user_role && !info.user_name) return null;
    return info;
  } catch {
    return null;
  }
};

export const logActivitySafe = async (message, type = "notice", actor) => {
  try {
    let info = _actorInfo(actor);
    // If no actor provided or missing basics, try default from storage
    if (!info.user_id && !info.user_role && !info.user_name) {
      const fallback = getDefaultActorFromStorage();
      if (fallback) info = fallback;
    }
    await logActivity(message, type, info);
  } catch (e) {
    console.warn("logActivitySafe failed:", e?.message || e);
  }
};

export const fetchNotifications = async () => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("date", { ascending: false });
  return { data, error };
};

// Paginated notifications: returns { data, error }
export const fetchNotificationsPaged = async (limit = 10, offset = 0) => {
  const from = offset;
  const to = offset + limit - 1;
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("date", { ascending: false })
    .range(from, to);
  return { data, error };
};

// Only global notifications (no actor), for student/teacher visibility
export const fetchNotificationsGlobalPaged = async (limit = 10, offset = 0) => {
  const from = offset;
  const to = offset + limit - 1;
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .is("user_id", null)
    .is("user_role", null)
    .order("date", { ascending: false })
    .range(from, to);
  return { data, error };
};

export const createGrade = async (grade) => {
  console.log("=== CREATE GRADE DEBUG ===");
  console.log("Original grade data:", grade);

  try {
    // Clean the grade data - remove any undefined or null values that might cause issues
    const cleanGrade = {
      submission_id: grade.submission_id,
      grade:
        grade.grade !== null && grade.grade !== undefined
          ? parseInt(grade.grade)
          : null,
      feedback: grade.feedback || null,
      rating:
        grade.rating !== null && grade.rating !== undefined
          ? grade.rating.toString()
          : null, // Convert to string to match DB
      rated_by: grade.rated_by || null,
      rated_at: grade.rated_at || new Date().toISOString(),
    };

    console.log("Cleaned grade data:", cleanGrade);

    // Validate required fields
    if (!cleanGrade.submission_id) {
      throw new Error("submission_id is required");
    }

    if (!cleanGrade.rated_by) {
      throw new Error("rated_by is required");
    }

    if (!cleanGrade.rated_at) {
      throw new Error("rated_at is required");
    }

    console.log("About to insert into database:", cleanGrade);

    const { data, error } = await supabase
      .from("grades")
      .insert([cleanGrade])
      .select();

    console.log("Database response:", { data, error });

    if (error) {
      console.error("Database error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    return { data, error };
  } catch (err) {
    console.error("Exception in createGrade:", err);
    return { data: null, error: err };
  }
};

export const updateGrade = async (gradeId, updates) => {
  try {
    // Clean the update data
    const cleanUpdates = {
      ...updates,
      grade:
        updates.grade !== null && updates.grade !== undefined
          ? parseInt(updates.grade)
          : null,
      rating:
        updates.rating !== null && updates.rating !== undefined
          ? updates.rating.toString()
          : null,
    };

    const { data, error } = await supabase
      .from("grades")
      .update(cleanUpdates)
      .eq("id", gradeId)
      .select();

    return { data, error };
  } catch (err) {
    console.error("Exception in updateGrade:", err);
    return { data: null, error: err };
  }
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
  // Single batched query: get submissions for all assignments and count distinct assignment_ids
  const { data: subsAll, error: sError } = await supabase
    .from("submissions")
    .select("assignment_id")
    .in("assignment_id", assignmentIds);
  if (sError) return { submitted: 0, total: assignmentIds.length };
  const submittedSet = new Set((subsAll || []).map((s) => s.assignment_id));
  return { submitted: submittedSet.size, total: assignmentIds.length };
};

/**
 * Get performance summary stats for all students taught by a teacher.
 * Returns: {
 *   totalStudents, averageAttendance, averageGrade, highPerformers, needsAttention, recentActivity,
 *   highPerformerNames, needsAttentionNames
 * }
 */
export const getTeacherStudentPerformanceStats = async (teacherId) => {
  // 1. Get all classes for this teacher
  const teacherClasses = await getClassesByTeacher(teacherId);
  const classIds = teacherClasses.map((cls) => cls.id || cls.class_id);
  if (classIds.length === 0) {
    return {
      totalStudents: 0,
      averageAttendance: 0,
      averageGrade: 0,
      highPerformers: 0,
      needsAttention: 0,
      recentActivity: 0,
      highPerformerNames: [],
      needsAttentionNames: [],
    };
  }
  // 2. Get all students in these classes (batched)
  const { data: scRows, error: scError } = await supabase
    .from("student_classes")
    .select("student_id, class_id")
    .in("class_id", classIds);
  if (scError) throw scError;
  let allStudents = (scRows || []).map((r) => r.student_id).filter(Boolean);
  // Remove duplicates
  allStudents = Array.from(new Set(allStudents));
  const totalStudents = allStudents.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      averageAttendance: 0,
      averageGrade: 0,
      highPerformers: 0,
      needsAttention: 0,
      recentActivity: 0,
      highPerformerNames: [],
      needsAttentionNames: [],
    };
  }
  // 3. Get all assignments for this teacher
  const assignments = await getAssignmentsByTeacher(teacherId);
  const assignmentIds = assignments.map((a) => a.id);
  // 4. Get all submissions for these assignments in one query, including grades
  let allGradeValues = [];
  let studentGradeMap = {};
  let allSubmissions = [];
  if (assignmentIds.length > 0) {
    const { data: subs, error: subsError } = await supabase
      .from("submissions")
      .select("id, student_id, assignment_id, submitted_at, grade:grades(grade)")
      .in("assignment_id", assignmentIds);
    if (subsError) throw subsError;
    allSubmissions = subs || [];
    for (const submission of allSubmissions) {
      const gradeValue = submission.grade?.grade;
      if (gradeValue !== undefined && gradeValue !== null) {
        const numericGrade = Number(gradeValue);
        if (!isNaN(numericGrade)) {
          allGradeValues.push(numericGrade);
          const studentId = submission.student_id;
          if (studentId) {
            if (!studentGradeMap[studentId]) studentGradeMap[studentId] = [];
            studentGradeMap[studentId].push(numericGrade);
          }
        }
      }
    }
  }

  console.log("=== GRADES DEBUG ===");
  console.log("Teacher ID:", teacherId);
  console.log("Assignment IDs:", assignmentIds);
  console.log("Total assignments:", assignments.length);
  console.log("Total submissions found:", allSubmissions.length);
  console.log("Total grade values found:", allGradeValues.length);
  console.log("All grade values:", allGradeValues);
  console.log("Student grade map:", studentGradeMap);
  // 6. For each student, calculate attendance and performance stats
  let totalAttendance = 0;
  let highPerformers = 0;
  let needsAttention = 0;
  let recentActivity = 0;
  let highPerformerNames = [];
  let needsAttentionNames = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get student details for names
  const { data: studentDetails, error: studentError } = await supabase
    .from("students")
    .select("id, first_name, middle_name, last_name")
    .in("id", allStudents);

  const studentNameMap = {};
  if (!studentError && studentDetails) {
    studentDetails.forEach((student) => {
      const fullName = `${student.first_name || ""} ${
        student.middle_name || ""
      } ${student.last_name || ""}`.trim();
      studentNameMap[student.id] = fullName;
    });
  }

  // Fetch attendance for all students in a single query over the last 30 days
  const fromISO = thirtyDaysAgo.toISOString().split("T")[0];
  const toISO = now.toISOString().split("T")[0];
  const { data: attendanceAll, error: attError } = await supabase
    .from("attendance")
    .select("id, student_id, status, date")
    .in("student_id", allStudents)
    .gte("date", fromISO)
    .lte("date", toISO);
  if (attError) throw attError;
  const attendanceByStudent = {};
  for (const a of attendanceAll || []) {
    if (!attendanceByStudent[a.student_id]) attendanceByStudent[a.student_id] = [];
    attendanceByStudent[a.student_id].push(a);
  }

  for (const studentId of allStudents) {
    const attendance = attendanceByStudent[studentId] || [];
    if (attendance.length > 0) {
      const presentCount = attendance.filter((a) => a.status === "present").length;
      const totalSessions = attendance.length;
      const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
      totalAttendance += attendanceRate;
      const recentAttendance = attendance.filter((a) => new Date(a.date) >= sevenDaysAgo);
      if (recentAttendance.length > 0) {
        recentActivity++;
      }
    }
    // Grades - use the pre-calculated student grade map
    const studentGrades = studentGradeMap[studentId] || [];
    if (studentGrades.length > 0) {
      const avgGrade = studentGrades.reduce((sum, grade) => sum + grade, 0) / studentGrades.length;
      const studentName = studentNameMap[studentId] || `Student ${studentId}`;
      if (avgGrade >= 85) {
        highPerformers++;
        highPerformerNames.push({ name: studentName, averageGrade: Math.round(avgGrade) });
      } else if (avgGrade < 60) {
        needsAttention++;
        needsAttentionNames.push({ name: studentName, averageGrade: Math.round(avgGrade) });
      }
      console.log(`Student ${studentName}: ${studentGrades.length} grades, avg: ${avgGrade.toFixed(2)}, grades: [${studentGrades.join(", ")} ]`);
      const recentSubmission = allSubmissions.find((s) => {
        const submittedAt = s.submitted_at ? new Date(s.submitted_at) : null;
        return s.student_id === studentId && submittedAt && submittedAt >= sevenDaysAgo;
      });
      if (recentSubmission) recentActivity++;
    }
  }
  // Calculate averages
  const avgAttendance =
    totalStudents > 0 ? Math.round(totalAttendance / totalStudents) : 0;
  const avgGrade =
    allGradeValues.length > 0
      ? Math.round(
          allGradeValues.reduce((sum, grade) => sum + grade, 0) /
            allGradeValues.length
        )
      : 0;

  console.log("=== FINAL RESULTS ===");
  console.log("Total students:", totalStudents);
  console.log("Total individual grades:", allGradeValues.length);
  console.log("All grade values:", allGradeValues);
  console.log(
    "Sum of all grades:",
    allGradeValues.reduce((sum, grade) => sum + grade, 0)
  );
  console.log("Average grade:", avgGrade);
  console.log("High performers:", highPerformers);
  console.log("Needs attention:", needsAttention);
  console.log("Recent activity:", recentActivity);

  // Sort the arrays by grades before returning
  const sortedHighPerformerNames = highPerformerNames.sort(
    (a, b) => b.averageGrade - a.averageGrade
  );
  const sortedNeedsAttentionNames = needsAttentionNames.sort(
    (a, b) => a.averageGrade - b.averageGrade
  );

  return {
    totalStudents,
    averageAttendance: avgAttendance,
    averageGrade: avgGrade,
    highPerformers,
    needsAttention,
    recentActivity,
    highPerformerNames: sortedHighPerformerNames,
    needsAttentionNames: sortedNeedsAttentionNames,
  };
};

// ------------------- EXAMS -------------------
// Note: Using generic selects to avoid coupling to specific column names.
// Tables: `exam_category` and `exam` where `exam.category` references `exam_category.id`.

// Fetch all exam categories
export const fetchExamCategories = async () => {
  const { data, error } = await supabase
    .from("exam_category")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
};

// Fetch exam items, optionally by category id
export const fetchExamItems = async (filters = {}) => {
  let query = supabase.from("exam").select("*");
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.limit) query = query.limit(filters.limit);
  query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getExamItemsByCategory = async (categoryId, limit) => {
  return await fetchExamItems({ category: categoryId, limit });
};

// Create a new exam item
// exam: { details, files, category, created_at? }
export const createExamItem = async (exam, actor) => {
  const { data, error } = await supabase.from("exam").insert([exam]);
  if (!error) {
    await logActivitySafe(`Exam item created (category=${exam?.category || "n/a"}).`, "exam", actor);
  }
  return { data, error };
};

// Update an exam item by id
export const updateExamItem = async (id, updates, actor) => {
  const { data, error } = await supabase
    .from("exam")
    .update(updates)
    .eq("id", id)
    .select();
  if (!error) {
    await logActivitySafe(`Exam item id=${id} updated.`, "exam", actor);
  }
  return { data, error };
};

// Delete an exam item by id
export const deleteExamItem = async (id, actor) => {
  const { data, error } = await supabase
    .from("exam")
    .delete()
    .eq("id", id);
  if (!error) {
    await logActivitySafe(`Exam item id=${id} deleted.`, "exam", actor);
  }
  return { data, error };
};

// ------------------- GRADE CALCULATION -------------------

/**
 * Calculate average grade for a student or class
 * @param {string} [studentId] - Optional student ID
 * @param {string} [classId] - Optional class ID (requires teacherId if provided)
 * @param {string} [teacherId] - Required if classId is provided
 * @returns {Promise<{averageGrade: number, totalGrades: number}>} Average grade and count of grades
 */
/**
 * Get submission statistics for a teacher's assignments
 * @param {string} teacherId - ID of the teacher
 * @returns {Promise<Array>} Array of assignment submission stats
 */
export const getTeacherSubmissionStats = async (teacherId) => {
  try {
    if (!teacherId) {
      throw new Error('teacherId is required');
    }

    // 1. Get all assignments for the teacher
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, title, class_id, due_date')
      .eq('teacher_id', teacherId);

    if (assignmentsError) throw assignmentsError;
    if (!assignments || assignments.length === 0) return [];

    // 2. Process each assignment to get submission stats
    const results = await Promise.all(
      assignments.map(async (assignment) => {
        // Get total students in the class
        const { count: totalStudents, error: countError } = await supabase
          .from('student_classes')
          .select('student_id', { count: 'exact', head: true })
          .eq('class_id', assignment.class_id);

        if (countError) throw countError;

        // Get number of submissions for this assignment
        const { count: submissionCount, error: subsError } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('assignment_id', assignment.id);

        if (subsError) throw subsError;

        const submissionRate = totalStudents > 0 
          ? Math.round((submissionCount / totalStudents) * 100) 
          : 0;

        return {
          assignmentId: assignment.id,
          title: assignment.title,
          classId: assignment.class_id,
          dueDate: assignment.due_date,
          totalStudents,
          submissions: submissionCount,
          submissionRate, // percentage
          isLate: new Date(assignment.due_date) < new Date()
        };
      })
    );

    return results;
  } catch (error) {
    console.error('Error getting teacher submission stats:', error);
    return [];
  }
};

export const getAverageGrade = async ({ studentId, classId, teacherId } = {}) => {
  try {
    if (!studentId && !classId) {
      throw new Error('Either studentId or classId must be provided');
    }

    if (classId && !teacherId) {
      throw new Error('teacherId is required when classId is provided');
    }

    let query = supabase
      .from('grades')
      .select('grade, submissions!inner(assignment_id, student_id, assignment:assignments!inner(teacher_id))');

    if (studentId) {
      query = query.eq('submissions.student_id', studentId);
    }

    if (classId) {
      // Get all students in the class
      const { data: classStudents } = await supabase
        .from('student_classes')
        .select('student_id')
        .eq('class_id', classId);
      
      if (!classStudents || classStudents.length === 0) {
        return { averageGrade: 0, totalGrades: 0 };
      }
      
      const studentIds = classStudents.map(s => s.student_id);
      query = query.in('submissions.student_id', studentIds);
    }

    // Filter by teacher if class is specified
    if (teacherId) {
      query = query.eq('submissions.assignment.teacher_id', teacherId);
    }

    const { data: grades, error } = await query;
    
    if (error) throw error;
    if (!grades || grades.length === 0) {
      return { averageGrade: 0, totalGrades: 0 };
    }

    const validGrades = grades
      .map(g => parseFloat(g.grade))
      .filter(grade => !isNaN(grade) && grade >= 0 && grade <= 100);

    if (validGrades.length === 0) {
      return { averageGrade: 0, totalGrades: 0 };
    }

    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    const average = sum / validGrades.length;

    return {
      averageGrade: parseFloat(average.toFixed(2)),
      totalGrades: validGrades.length
    };
  } catch (error) {
    console.error('Error calculating average grade:', error);
    return { averageGrade: 0, totalGrades: 0, error: error.message };
  }
};

// ------------------- LIGHTWEIGHT COUNTS -------------------
export const countStudents = async () => {
  const { count, error } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
};

export const countTeachers = async () => {
  const { count, error } = await supabase
    .from("teachers")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
};

export const countAssignments = async () => {
  const { count, error } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
};

export const countNotices = async () => {
  const { count, error } = await supabase
    .from("notices")
    .select("notice_id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
};

export const countClasses = async () => {
  const { count, error } = await supabase
    .from("classes")
    .select("class_id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
};

export const countDepartments = async () => {
  const { count, error } = await supabase
    .from("departments")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
};

// ------------------- GROUPED EXPORTS (non-breaking) -------------------
export const StudentsAPI = {
  fetch: fetchStudents,
  fetchById: fetchStudentProfileById,
  create: createStudent,
  updateByRegNo: updateStudent,
  updateProfile: updateStudentProfile,
  updatePassword: updateStudentPassword,
  delete: deleteStudent,
  attendanceByStudent: getAttendanceByStudent,
  assignmentsForStudent: getAssignmentsForStudent,
  submissionsForStudent: getSubmissionsForStudent,
  feedbackForStudent: getFeedbackForStudent,
  count: countStudents,
};

export const TeachersAPI = {
  fetch: fetchTeachers,
  fetchById: fetchTeacherProfileById,
  create: createTeacher,
  delete: deleteTeacher,
  updateProfile: updateTeacherProfile,
  updatePassword: updateTeacherPassword,
  departmentsWithClasses: getTeacherDepartmentsWithClasses,
  classes: getClassesByTeacher,
  assignments: getAssignmentsByTeacher,
  grades: getGradesByTeacher,
  count: countTeachers,
};

export const ClassesAPI = {
  fetch: fetchClasses,
  fetchById: getClassById,
  create: createClass,
  update: updateClass,
  enrollStudents: enrollStudentsInClass,
  removeStudent: removeStudentFromClass,
  updateStudentClass,
  studentsByClass: getStudentsByClass,
  countStudents: getStudentCountByClass,
  rooms: fetchRooms,
  sections: fetchSections,
  count: countClasses,
};

export const AssignmentsAPI = {
  fetch: fetchAssignments,
  fetchSubmissions: fetchAssignmentSubmissions,
  create: createAssignment,
  update: updateAssignment,
  delete: deleteAssignment,
  updateSubmissionGrade: updateAssignmentSubmissionGrade,
  recent: fetchRecentAssignments,
  count: countAssignments,
};

export const AttendanceAPI = {
  fetch: fetchAttendance,
  create: createAttendance,
  update: updateAttendance,
  byStudent: getAttendanceByStudent,
  byClassAndDate: getAttendanceByClassAndDate,
  byDateRange: getAttendanceByDateRange,
};

export const DepartmentsAPI = {
  fetch: fetchDepartments,
  fetchById: fetchDepartmentById,
  create: createDepartment,
  update: updateDepartment,
  delete: deleteDepartment,
  count: countDepartments,
};

export const NoticesAPI = {
  fetch: fetchNotices,
  fetchTitles: fetchNoticeTitles,
  recent: fetchRecentNotices,
  create: createNotice,
  update: updateNotice,
  delete: deleteNotice,
  count: countNotices,
};

export const ExamsAPI = {
  fetchCategories: fetchExamCategories,
  fetchItems: fetchExamItems,
  fetchItemsByCategory: getExamItemsByCategory,
  createItem: createExamItem,
  updateItem: updateExamItem,
  deleteItem: deleteExamItem,
};

export const GalleryAPI = {
  fetch: fetchGalleryItems,
  add: addGalleryItems,
};

export const SubjectsAPI = {
  fetch: fetchSubjects,
  get: getSubjects,
};

export const GradesAPI = {
  create: createGrade,
  update: updateGrade,
  getBySubmissionId: getGradeBySubmissionId,
};

export const AuthAPI = {
  signIn,
  signUp,
  signOut,
  getSession,
  updateUserProfile,
  updateUserPassword,
  checkCredentials,
};

export const NotificationsAPI = {
  fetch: fetchNotifications,
  fetchPaged: fetchNotificationsPaged,
  fetchGlobalPaged: fetchNotificationsGlobalPaged,
  log: logActivity,
  logSafe: logActivitySafe,
};
