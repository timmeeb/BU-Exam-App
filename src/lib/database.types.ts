export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          bu_id: string | null;
          role: Database["public"]["Enums"]["user_role"];
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          bu_id?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          bu_id?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      courses: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          semester: string;
          instructor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          semester: string;
          instructor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          semester?: string;
          instructor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey";
            columns: ["instructor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      course_enrollments: {
        Row: {
          id: string;
          course_id: string;
          student_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          student_id: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          student_id?: string;
          enrolled_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      exams: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          instructions: string | null;
          status: Database["public"]["Enums"]["exam_status"];
          duration_minutes: number | null;
          start_time: string | null;
          end_time: string | null;
          passing_score: number | null;
          shuffle_questions: boolean;
          shuffle_answers: boolean;
          show_results: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          instructions?: string | null;
          status?: Database["public"]["Enums"]["exam_status"];
          duration_minutes?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          passing_score?: number | null;
          shuffle_questions?: boolean;
          shuffle_answers?: boolean;
          show_results?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          instructions?: string | null;
          status?: Database["public"]["Enums"]["exam_status"];
          duration_minutes?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          passing_score?: number | null;
          shuffle_questions?: boolean;
          shuffle_answers?: boolean;
          show_results?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      questions: {
        Row: {
          id: string;
          exam_id: string;
          question_type: Database["public"]["Enums"]["question_type"];
          question_text: string;
          question_order: number;
          points: number;
          explanation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          question_type: Database["public"]["Enums"]["question_type"];
          question_text: string;
          question_order: number;
          points?: number;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          question_text?: string;
          question_order?: number;
          points?: number;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          }
        ];
      };
      answer_options: {
        Row: {
          id: string;
          question_id: string;
          option_text: string;
          option_order: number;
          is_correct: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_text: string;
          option_order: number;
          is_correct?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          option_text?: string;
          option_order?: number;
          is_correct?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          }
        ];
      };
      exam_submissions: {
        Row: {
          id: string;
          exam_id: string;
          student_id: string;
          status: Database["public"]["Enums"]["submission_status"];
          started_at: string;
          submitted_at: string | null;
          score: number | null;
          points_earned: number | null;
          points_possible: number | null;
          graded_at: string | null;
          graded_by: string | null;
          feedback: string | null;
        };
        Insert: {
          id?: string;
          exam_id: string;
          student_id: string;
          status?: Database["public"]["Enums"]["submission_status"];
          started_at?: string;
          submitted_at?: string | null;
          score?: number | null;
          points_earned?: number | null;
          points_possible?: number | null;
          graded_at?: string | null;
          graded_by?: string | null;
          feedback?: string | null;
        };
        Update: {
          id?: string;
          exam_id?: string;
          student_id?: string;
          status?: Database["public"]["Enums"]["submission_status"];
          started_at?: string;
          submitted_at?: string | null;
          score?: number | null;
          points_earned?: number | null;
          points_possible?: number | null;
          graded_at?: string | null;
          graded_by?: string | null;
          feedback?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_submissions_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_submissions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_submissions_graded_by_fkey";
            columns: ["graded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      student_answers: {
        Row: {
          id: string;
          submission_id: string;
          question_id: string;
          selected_option_id: string | null;
          answer_text: string | null;
          is_correct: boolean | null;
          points_awarded: number | null;
          feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          question_id: string;
          selected_option_id?: string | null;
          answer_text?: string | null;
          is_correct?: boolean | null;
          points_awarded?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          question_id?: string;
          selected_option_id?: string | null;
          answer_text?: string | null;
          is_correct?: boolean | null;
          points_awarded?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_answers_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "exam_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_answers_selected_option_id_fkey";
            columns: ["selected_option_id"];
            isOneToOne: false;
            referencedRelation: "answer_options";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "student" | "instructor" | "admin";
      question_type: "multiple_choice" | "true_false" | "short_answer" | "essay";
      exam_status: "draft" | "published" | "active" | "completed" | "archived";
      submission_status: "in_progress" | "submitted" | "graded";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// Convenience type aliases
export type Profile = Tables<"profiles">;
export type Course = Tables<"courses">;
export type CourseEnrollment = Tables<"course_enrollments">;
export type Exam = Tables<"exams">;
export type Question = Tables<"questions">;
export type AnswerOption = Tables<"answer_options">;
export type ExamSubmission = Tables<"exam_submissions">;
export type StudentAnswer = Tables<"student_answers">;

export type UserRole = Enums<"user_role">;
export type QuestionType = Enums<"question_type">;
export type ExamStatus = Enums<"exam_status">;
export type SubmissionStatus = Enums<"submission_status">;
