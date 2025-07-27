-- Add Assignment Submissions for Enrolled Students
-- This script creates realistic submission data based on class enrollments and assignments

-- First, let's see the current state
SELECT 'Current submissions count:' as info, COUNT(*) as count FROM "public"."submissions";

-- Let's see assignments by year
SELECT 'Assignments by year:' as info, year, COUNT(*) as count 
FROM "public"."assignments" 
GROUP BY year 
ORDER BY year;

-- Let's see class enrollments by year
SELECT 'Class enrollments by year:' as info, 
       c.year, 
       COUNT(DISTINCT sc.student_id) as enrolled_students,
       COUNT(DISTINCT sc.class_id) as classes_with_students
FROM "public"."student_classes" sc
JOIN "public"."classes" c ON sc.class_id = c.class_id
GROUP BY c.year
ORDER BY c.year;

-- Now create realistic submissions
-- Students will submit assignments with different submission rates and statuses

WITH assignment_class_matches AS (
  SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    a.due_date as assignment_due_date,
    a.year as assignment_year,
    c.class_id,
    c.name as class_name,
    c.year as class_year
  FROM "public"."assignments" a
  JOIN "public"."classes" c ON a.class_id = c.class_id
  WHERE a.class_id IS NOT NULL
),
enrolled_students AS (
  SELECT 
    sc.student_id,
    sc.class_id,
    s.first_name,
    s.last_name,
    s.year as student_year
  FROM "public"."student_classes" sc
  JOIN "public"."students" s ON sc.student_id = s.id
),
student_assignment_combinations AS (
  SELECT 
    acm.assignment_id,
    acm.assignment_title,
    acm.assignment_due_date,
    acm.class_id,
    acm.class_name,
    es.student_id,
    es.first_name,
    es.last_name,
    es.student_year,
    -- Random submission probability (70% of students submit)
    CASE WHEN RANDOM() < 0.7 THEN true ELSE false END as will_submit,
    -- Random submission timing (before or after due date)
    CASE 
      WHEN RANDOM() < 0.8 THEN 'on_time'  -- 80% on time
      WHEN RANDOM() < 0.9 THEN 'late'     -- 10% late
      ELSE 'not_submitted'                -- 10% not submitted
    END as submission_status
  FROM assignment_class_matches acm
  JOIN enrolled_students es ON acm.class_id = es.class_id
  WHERE acm.assignment_year = es.student_year  -- Ensure year matching
),
submission_data AS (
  SELECT 
    assignment_id,
    class_id,
    student_id,
    assignment_due_date,
    submission_status,
    -- Generate submission timestamp based on status
    CASE 
      WHEN submission_status = 'on_time' THEN
        assignment_due_date - INTERVAL '1 day' + (RANDOM() * INTERVAL '2 days')
      WHEN submission_status = 'late' THEN
        assignment_due_date + (RANDOM() * INTERVAL '7 days')
      ELSE NULL
    END as submitted_at,
    -- Generate realistic files array
    CASE 
      WHEN submission_status != 'not_submitted' THEN
        CASE WHEN RANDOM() < 0.3 THEN
          ARRAY['https://example.com/submissions/' || student_id::text || '_' || assignment_id::text || '_main.pdf',
                'https://example.com/submissions/' || student_id::text || '_' || assignment_id::text || '_appendix.docx']
        ELSE
          ARRAY['https://example.com/submissions/' || student_id::text || '_' || assignment_id::text || '_main.pdf']
        END
      ELSE ARRAY[]::text[]
    END as files,
    -- Generate realistic notes
    CASE 
      WHEN submission_status = 'on_time' AND RANDOM() < 0.2 THEN
        ARRAY['Submitted on time', 'All requirements met', 'Ready for grading']
      WHEN submission_status = 'late' AND RANDOM() < 0.4 THEN
        ARRAY['Late submission', 'Apologies for the delay', 'Technical issues encountered']
      WHEN submission_status = 'not_submitted' THEN
        ARRAY[]::text[]
      ELSE
        ARRAY['Assignment completed']
    END as notes
  FROM student_assignment_combinations
  WHERE will_submit = true AND submission_status != 'not_submitted'
)
INSERT INTO "public"."submissions" (
  "id",
  "assignment_id", 
  "class_id", 
  "student_id", 
  "due_at", 
  "submitted_at", 
  "files", 
  "notes"
)
SELECT 
  gen_random_uuid() as id,
  assignment_id,
  class_id,
  student_id,
  assignment_due_date as due_at,
  submitted_at,
  files,
  notes
FROM submission_data
WHERE array_length(files, 1) > 0;  -- Only insert if files are provided

-- Verification queries
SELECT 'Total submissions created:' as info, COUNT(*) as count 
FROM "public"."submissions" 
WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Show submission distribution by year
SELECT 'Submissions by year:' as info, 
       a.year, 
       COUNT(s.id) as submission_count,
       COUNT(DISTINCT s.student_id) as unique_students,
       COUNT(DISTINCT s.assignment_id) as unique_assignments
FROM "public"."submissions" s
JOIN "public"."assignments" a ON s.assignment_id = a.id
WHERE s.created_at >= NOW() - INTERVAL '1 minute'
GROUP BY a.year
ORDER BY a.year;

-- Show submission status distribution
SELECT 'Submission status distribution:' as info;
SELECT 
  CASE 
    WHEN s.submitted_at <= s.due_at THEN 'On Time'
    WHEN s.submitted_at > s.due_at THEN 'Late'
    ELSE 'Not Submitted'
  END as status,
  COUNT(*) as count,
  ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM "public"."submissions" WHERE created_at >= NOW() - INTERVAL '1 minute')) * 100, 1) as percentage
FROM "public"."submissions" s
WHERE s.created_at >= NOW() - INTERVAL '1 minute'
GROUP BY 
  CASE 
    WHEN s.submitted_at <= s.due_at THEN 'On Time'
    WHEN s.submitted_at > s.due_at THEN 'Late'
    ELSE 'Not Submitted'
  END
ORDER BY count DESC;

-- Show average submissions per student
SELECT 'Average submissions per student:' as info,
       ROUND(AVG(submission_count), 2) as avg_submissions_per_student
FROM (
  SELECT student_id, COUNT(*) as submission_count
  FROM "public"."submissions"
  WHERE created_at >= NOW() - INTERVAL '1 minute'
  GROUP BY student_id
) student_submission_counts;

-- Show average submissions per assignment
SELECT 'Average submissions per assignment:' as info,
       ROUND(AVG(submission_count), 2) as avg_submissions_per_assignment
FROM (
  SELECT assignment_id, COUNT(*) as submission_count
  FROM "public"."submissions"
  WHERE created_at >= NOW() - INTERVAL '1 minute'
  GROUP BY assignment_id
) assignment_submission_counts;

-- Check for any year mismatches (should be 0)
SELECT 'Year mismatches (should be 0):' as info, COUNT(*) as count
FROM "public"."submissions" s
JOIN "public"."assignments" a ON s.assignment_id = a.id
JOIN "public"."students" st ON s.student_id = st.id
WHERE a.year != st.year
  AND s.created_at >= NOW() - INTERVAL '1 minute';

-- Sample submissions
SELECT 'Sample submissions:' as info;
SELECT 
  st.first_name || ' ' || st.last_name as student_name,
  st.year as student_year,
  a.title as assignment_title,
  a.year as assignment_year,
  c.name as class_name,
  s.submitted_at,
  s.due_at,
  CASE 
    WHEN s.submitted_at <= s.due_at THEN 'On Time'
    WHEN s.submitted_at > s.due_at THEN 'Late'
    ELSE 'Not Submitted'
  END as status,
  array_length(s.files, 1) as file_count
FROM "public"."submissions" s
JOIN "public"."assignments" a ON s.assignment_id = a.id
JOIN "public"."students" st ON s.student_id = st.id
JOIN "public"."classes" c ON s.class_id = c.class_id
WHERE s.created_at >= NOW() - INTERVAL '1 minute'
ORDER BY st.year, st.first_name, a.title
LIMIT 15;

-- Show assignments with no submissions (for comparison)
SELECT 'Assignments with no submissions:' as info;
SELECT 
  a.title as assignment_title,
  a.year as assignment_year,
  c.name as class_name,
  COUNT(sc.student_id) as enrolled_students,
  COUNT(s.id) as submissions_received
FROM "public"."assignments" a
JOIN "public"."classes" c ON a.class_id = c.class_id
LEFT JOIN "public"."student_classes" sc ON c.class_id = sc.class_id
LEFT JOIN "public"."submissions" s ON a.id = s.assignment_id
GROUP BY a.id, a.title, a.year, c.name
HAVING COUNT(s.id) = 0
ORDER BY a.year, a.title
LIMIT 10;

-- Summary statistics
SELECT 'Summary:' as info;
SELECT 
  'Total Assignments' as metric, COUNT(*) as value FROM "public"."assignments"
UNION ALL
SELECT 
  'Total Enrolled Students' as metric, COUNT(DISTINCT student_id) as value FROM "public"."student_classes"
UNION ALL
SELECT 
  'Total Submissions' as metric, COUNT(*) as value FROM "public"."submissions"
UNION ALL
SELECT 
  'Avg Submissions per Assignment' as metric, 
  ROUND(AVG(submission_count), 1) as value 
FROM (
  SELECT COUNT(*) as submission_count 
  FROM "public"."submissions" 
  GROUP BY assignment_id
) assignment_counts
UNION ALL
SELECT 
  'Avg Submissions per Student' as metric, 
  ROUND(AVG(submission_count), 1) as value 
FROM (
  SELECT COUNT(*) as submission_count 
  FROM "public"."submissions" 
  GROUP BY student_id
) student_counts; 