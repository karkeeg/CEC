# Recommended Database Indexes (Supabase/Postgres)

These indexes are safe to add and improve filter/sort performance for common queries. They do not change any API outputs.

Notes:
- Create only if they do not already exist.
- Use pluralized names consistently. Adjust table/column names if your schema differs.
- For composite indexes, order columns by selectivity and common filter patterns.

## Attendance
```sql
-- Filters by student/date ranges
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance (student_id, date);

-- Filters by class/date for daily views
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance (class_id, date);

-- Filters by teacher/date for teacher dashboards
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance (teacher_id, date);
```

## Submissions
```sql
-- Lookups by assignment
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions (assignment_id);

-- Lookups by student across assignments
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions (student_id);
```

## Grades
```sql
-- Join to submissions and frequent lookup
CREATE INDEX IF NOT EXISTS idx_grades_submission ON grades (submission_id);
```

## Assignments
```sql
-- Teacher dashboards
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments (teacher_id);

-- Class drill-downs
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments (class_id);

-- Subject analytics
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments (subject_id);

-- Sorting and filtering by due date
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments (due_date);
```

## Student Classes (enrollments)
```sql
-- Fetch all students in class and vice-versa
CREATE INDEX IF NOT EXISTS idx_student_classes_class ON student_classes (class_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_student ON student_classes (student_id);
```

## Notices
```sql
-- Sorting by created_at
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices (created_at);
```

## General Tips
- Prefer partial indexes if you have soft-deletes or status flags used in filters, e.g.
  `CREATE INDEX ... ON table(column) WHERE deleted_at IS NULL;`
- Avoid redundant indexes (same leading columns or duplicates).
- Periodically run `EXPLAIN ANALYZE` for slow queries to verify index usage.
- Reindex or vacuum as needed on large write-heavy tables.
