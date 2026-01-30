-- BU Exam App Database Schema
-- This migration creates the initial database structure for the exam application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay');
CREATE TYPE exam_status AS ENUM ('draft', 'published', 'active', 'completed', 'archived');
CREATE TYPE submission_status AS ENUM ('in_progress', 'submitted', 'graded');

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  bu_id TEXT UNIQUE, -- Boston University ID
  role user_role DEFAULT 'student' NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- COURSES TABLE
-- ============================================

CREATE TABLE courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL, -- e.g., "CS101"
  name TEXT NOT NULL, -- e.g., "Introduction to Computer Science"
  description TEXT,
  semester TEXT NOT NULL, -- e.g., "Fall 2024"
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(code, semester)
);

-- ============================================
-- COURSE ENROLLMENTS TABLE
-- ============================================

CREATE TABLE course_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(course_id, student_id)
);

-- ============================================
-- EXAMS TABLE
-- ============================================

CREATE TABLE exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  status exam_status DEFAULT 'draft' NOT NULL,
  duration_minutes INTEGER, -- NULL means no time limit
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  passing_score DECIMAL(5,2), -- Minimum score to pass (percentage)
  shuffle_questions BOOLEAN DEFAULT FALSE,
  shuffle_answers BOOLEAN DEFAULT FALSE,
  show_results BOOLEAN DEFAULT TRUE, -- Show results to students after submission
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- QUESTIONS TABLE
-- ============================================

CREATE TABLE questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  points DECIMAL(5,2) DEFAULT 1.0 NOT NULL,
  explanation TEXT, -- Shown after grading
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- ANSWER OPTIONS TABLE (for multiple choice/true-false)
-- ============================================

CREATE TABLE answer_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- EXAM SUBMISSIONS TABLE
-- ============================================

CREATE TABLE exam_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status submission_status DEFAULT 'in_progress' NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  submitted_at TIMESTAMPTZ,
  score DECIMAL(5,2), -- Final score (percentage)
  points_earned DECIMAL(7,2),
  points_possible DECIMAL(7,2),
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  feedback TEXT,
  UNIQUE(exam_id, student_id)
);

-- ============================================
-- STUDENT ANSWERS TABLE
-- ============================================

CREATE TABLE student_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES exam_submissions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_id UUID REFERENCES answer_options(id) ON DELETE SET NULL, -- For multiple choice
  answer_text TEXT, -- For short answer/essay
  is_correct BOOLEAN,
  points_awarded DECIMAL(5,2),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(submission_id, question_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_bu_id ON profiles(bu_id);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_semester ON courses(semester);
CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_exams_course ON exams(course_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_answer_options_question ON answer_options(question_id);
CREATE INDEX idx_submissions_exam ON exam_submissions(exam_id);
CREATE INDEX idx_submissions_student ON exam_submissions(student_id);
CREATE INDEX idx_student_answers_submission ON student_answers(submission_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Instructors and admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

-- Courses policies
CREATE POLICY "Anyone authenticated can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Instructors can update their own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid());

-- Course enrollments policies
CREATE POLICY "Students can view their own enrollments"
  ON course_enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can view enrollments for their courses"
  ON course_enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage enrollments for their courses"
  ON course_enrollments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Exams policies
CREATE POLICY "Students can view published exams for enrolled courses"
  ON exams FOR SELECT
  TO authenticated
  USING (
    status IN ('published', 'active', 'completed') AND
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = exams.course_id
      AND course_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage exams for their courses"
  ON exams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Questions policies
CREATE POLICY "Students can view questions for active exams they have access to"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      JOIN course_enrollments ON course_enrollments.course_id = exams.course_id
      WHERE exams.id = questions.exam_id
      AND exams.status IN ('active', 'completed')
      AND course_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage questions for their exams"
  ON questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      JOIN courses ON courses.id = exams.course_id
      WHERE exams.id = questions.exam_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Answer options policies
CREATE POLICY "Students can view answer options for active exams"
  ON answer_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN exams ON exams.id = questions.exam_id
      JOIN course_enrollments ON course_enrollments.course_id = exams.course_id
      WHERE questions.id = answer_options.question_id
      AND exams.status IN ('active', 'completed')
      AND course_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage answer options"
  ON answer_options FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN exams ON exams.id = questions.exam_id
      JOIN courses ON courses.id = exams.course_id
      WHERE questions.id = answer_options.question_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Exam submissions policies
CREATE POLICY "Students can view their own submissions"
  ON exam_submissions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create submissions for active exams"
  ON exam_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM exams
      JOIN course_enrollments ON course_enrollments.course_id = exams.course_id
      WHERE exams.id = exam_submissions.exam_id
      AND exams.status = 'active'
      AND course_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their in-progress submissions"
  ON exam_submissions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() AND status = 'in_progress');

CREATE POLICY "Instructors can view and grade submissions for their exams"
  ON exam_submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      JOIN courses ON courses.id = exams.course_id
      WHERE exams.id = exam_submissions.exam_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Student answers policies
CREATE POLICY "Students can manage their own answers"
  ON student_answers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_submissions
      WHERE exam_submissions.id = student_answers.submission_id
      AND exam_submissions.student_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can view and grade answers"
  ON student_answers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_submissions
      JOIN exams ON exams.id = exam_submissions.exam_id
      JOIN courses ON courses.id = exams.course_id
      WHERE exam_submissions.id = student_answers.submission_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_answers_updated_at
  BEFORE UPDATE ON student_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to auto-grade multiple choice questions
CREATE OR REPLACE FUNCTION auto_grade_answer()
RETURNS TRIGGER AS $$
DECLARE
  correct_option_id UUID;
  question_points DECIMAL(5,2);
BEGIN
  -- Only auto-grade if an option was selected
  IF NEW.selected_option_id IS NOT NULL THEN
    -- Get the correct option and points for this question
    SELECT ao.id, q.points INTO correct_option_id, question_points
    FROM questions q
    JOIN answer_options ao ON ao.question_id = q.id AND ao.is_correct = true
    WHERE q.id = NEW.question_id;

    -- Set is_correct and points_awarded
    IF NEW.selected_option_id = correct_option_id THEN
      NEW.is_correct = true;
      NEW.points_awarded = question_points;
    ELSE
      NEW.is_correct = false;
      NEW.points_awarded = 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_grade_student_answer
  BEFORE INSERT OR UPDATE ON student_answers
  FOR EACH ROW EXECUTE FUNCTION auto_grade_answer();
