import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExamTaker from "./ExamTaker";

type Question = {
  id: string;
  question_type: string;
  question_text: string;
  question_order: number;
  points: number;
  answer_options: {
    id: string;
    option_text: string;
    option_order: number;
  }[];
};

type ExamData = {
  id: string;
  title: string;
  duration_minutes: number | null;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  courses: { code: string; name: string } | null;
};

type SubmissionData = {
  id: string;
  started_at: string;
};

type StudentAnswer = {
  question_id: string;
  selected_option_id: string | null;
  answer_text: string | null;
};

export default async function TakeExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get exam details
  const { data: exam } = (await supabase
    .from("exams")
    .select(
      `
      id,
      title,
      duration_minutes,
      shuffle_questions,
      shuffle_answers,
      courses (
        code,
        name
      )
    `
    )
    .eq("id", id)
    .eq("status", "active")
    .single()) as { data: ExamData | null };

  if (!exam) {
    redirect("/exams");
  }

  // Get or create submission
  let { data: submission } = (await supabase
    .from("exam_submissions")
    .select("id, started_at")
    .eq("exam_id", id)
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .single()) as { data: SubmissionData | null };

  if (!submission) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newSubmission, error } = (await (supabase as any)
      .from("exam_submissions")
      .insert({
        exam_id: id,
        student_id: user.id,
        status: "in_progress",
      })
      .select("id, started_at")
      .single()) as { data: SubmissionData | null; error: Error | null };

    if (error || !newSubmission) {
      redirect("/exams");
    }
    submission = newSubmission;
  }

  // Get questions with answer options
  const { data: questions } = (await supabase
    .from("questions")
    .select(
      `
      id,
      question_type,
      question_text,
      question_order,
      points,
      answer_options (
        id,
        option_text,
        option_order
      )
    `
    )
    .eq("exam_id", id)
    .order("question_order", { ascending: true })) as {
    data: Question[] | null;
  };

  if (!questions || questions.length === 0) {
    redirect("/exams");
  }

  // Sort answer options
  const sortedQuestions = questions.map((q) => ({
    ...q,
    answer_options: [...q.answer_options].sort(
      (a, b) => a.option_order - b.option_order
    ),
  }));

  // Get existing answers
  const { data: existingAnswers } = (await supabase
    .from("student_answers")
    .select("question_id, selected_option_id, answer_text")
    .eq("submission_id", submission.id)) as { data: StudentAnswer[] | null };

  const answersMap: Record<
    string,
    { selectedOptionId: string | null; answerText: string | null }
  > = {};
  if (existingAnswers) {
    for (const answer of existingAnswers) {
      answersMap[answer.question_id] = {
        selectedOptionId: answer.selected_option_id,
        answerText: answer.answer_text,
      };
    }
  }

  return (
    <ExamTaker
      exam={exam}
      questions={sortedQuestions}
      submissionId={submission.id}
      startedAt={submission.started_at}
      existingAnswers={answersMap}
    />
  );
}
