import supabase from "../src/supabaseConfig/supabaseClient.js";
import {
  fetchStudents,
  fetchClasses,
  enrollStudentsInClass,
  createAssignment,
  createGrade,
  createAttendance,
  fetchTeachers,
} from "../src/supabaseConfig/supabaseApi.js";

const STUDENT_ID = "4b6a9eb7-9e47-41a3-abeb-f42104e4dcbe"; // Replace with the actual student ID

async function addStudentData() {
  console.log("Starting data addition process...");

  try {
    // 1. Fetch student details
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*, classes:student_classes(class_id)")
      .eq("id", STUDENT_ID)
      .single();

    if (studentError || !student) {
      console.error("Error fetching student: ", studentError?.message || "Student not found");
      return;
    }
    console.log(`Found student: ${student.first_name} ${student.last_name} (Year: ${student.academic_year})`);

    // 2. Fetch classes matching the student's year
    const { data: allClasses, error: classesError } = await fetchClasses();
    if (classesError) throw classesError;

    const relevantClasses = (allClasses || []).filter(
      (cls) => cls.year === student.academic_year
    );
    if (relevantClasses.length === 0) {
      console.log("No relevant classes found for the student's year.");
      return;
    }
    console.log(`Found ${relevantClasses.length} relevant classes for the student's year.`);

    // 3. Enroll student in up to 5 different classes (if not already enrolled)
    const enrolledClassIds = new Set(student.classes.map(c => c.class_id));
    const classesToEnroll = relevantClasses.filter(cls => !enrolledClassIds.has(cls.class_id || cls.id)).slice(0, 5);

    for (const cls of classesToEnroll) {
      console.log(`Enrolling student in class: ${cls.name}`);
      const error = await enrollStudentsInClass([student.id], cls.class_id || cls.id);
      if (error) {
        console.error(`Failed to enroll student in class ${cls.name}:`, error.message);
      } else {
        console.log(`Successfully enrolled student in class: ${cls.name}`);
      }
    }

    // 4. Add assignments, submissions, and grades for the newly enrolled classes
    const classesForAssignments = classesToEnroll.length > 0 ? classesToEnroll : relevantClasses.slice(0, 5); // Use newly enrolled, or existing relevant classes
    const teachers = await fetchTeachers();

    for (const cls of classesForAssignments) {
        const assignedTeacher = teachers.find(t => t.id === cls.teacher_id);
        if (!assignedTeacher) {
            console.log(`No teacher found for class ${cls.name}, skipping assignment creation.`);
            continue;
        }

        for (let i = 1; i <= 2; i++) { // Add 2 assignments per class
            const assignmentTitle = `${cls.name} Assignment ${i}`;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (i * 7)); // Due in 1 or 2 weeks

            const newAssignment = {
                title: assignmentTitle,
                description: `This is a sample assignment for ${cls.name}.`,
                due_date: dueDate.toISOString(),
                subject_id: cls.subject_id, // Ensure this is correct
                teacher_id: assignedTeacher.id,
                class_id: cls.class_id || cls.id,
                year: cls.year,
            };

            console.log(`Creating assignment: ${assignmentTitle}`);
            const { data: assignmentData, error: assignmentError } = await createAssignment(newAssignment);

            if (assignmentError) {
                console.error(`Failed to create assignment ${assignmentTitle}:`, assignmentError.message);
                continue;
            }
            const assignment = assignmentData[0];
            console.log(`Created assignment: ${assignment.title}`);

            // Simulate submission
            const submissionId = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `${student.id}-${assignment.id}-${Date.now()}`;
            console.log(`Creating submission for ${assignment.title}`);
            const { error: submissionError } = await supabase.from("submissions").insert([
                {
                    id: submissionId,
                    assignment_id: assignment.id,
                    student_id: student.id,
                    submitted_at: new Date().toISOString(),
                    notes: `Student ${student.first_name} notes for ${assignment.title}.`,
                    files: [], // No files for simplicity
                },
            ]);

            if (submissionError) {
                console.error(`Failed to create submission for ${assignment.title}:`, submissionError.message);
                continue;
            }
            console.log(`Submitted assignment: ${assignment.title}`);

            // Simulate grading
            const gradeValue = Math.floor(Math.random() * (100 - 60 + 1)) + 60; // Random grade between 60-100
            const feedbackComment = `Good effort on ${assignment.title}. Keep up the good work!`;
            console.log(`Grading submission for ${assignment.title}`);

            const { error: gradeError } = await createGrade({
                submission_id: submissionId,
                grade: gradeValue,
                feedback: feedbackComment,
                rated_by: assignedTeacher.id,
                rated_at: new Date().toISOString(),
                rating: (gradeValue / 100) * 5, // Rating out of 5
            });

            if (gradeError) {
                console.error(`Failed to grade submission for ${assignment.title}:`, gradeError.message);
                continue;
            }
            console.log(`Graded submission for ${assignment.title} with ${gradeValue}%`);
        }

        // 5. Add attendance records for the class
        for (let i = 0; i < 3; i++) { // Add 3 attendance records per class
            const attendanceDate = new Date();
            attendanceDate.setDate(attendanceDate.getDate() - (i * 2)); // A few days ago
            const status = i === 0 ? "present" : (i === 1 ? "late" : "absent"); // Vary status

            const newAttendance = {
                student_id: student.id,
                subject_id: cls.subject_id, // Use class subject
                class_id: cls.class_id || cls.id,
                teacher_id: assignedTeacher.id,
                date: attendanceDate.toISOString().split('T')[0],
                status: status,
                note: `Attendance for ${attendanceDate.toDateString()}`,
            };

            console.log(`Adding attendance for ${cls.name} on ${newAttendance.date} with status ${newAttendance.status}`);
            const error = await createAttendance([newAttendance]);
            if (error) {
                console.error(`Failed to add attendance:`, error.message);
            } else {
                console.log(`Successfully added attendance for ${cls.name} on ${newAttendance.date}`);
            }
        }
    }

    console.log("Data addition process completed.");

  } catch (error) {
    console.error("An error occurred during data addition:", error.message);
  }
}

addStudentData();
