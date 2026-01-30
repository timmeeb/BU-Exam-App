"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ExistingSubmission = { id: string };
type NewSubmission = { id: string };
type ExistingAnswer = { id: string };
type SubmissionWithOwner = { id: string; exam_id: string; student_id: string };
type AnswerWithQuestion = {
  id: string;
  is_correct: boolean | null;
  points_awarded: number | null;
  questions: { points: number } | null;
};

export async function startExam(examId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if submission already exists
  const { data: existing } = (await supabase
    .from("exam_submissions")
    .select("id")
    .eq("exam_id", examId)
    .eq("student_id", user.id)
    .single()) as { data: ExistingSubmission | null };

  if (existing) {
    return { submissionId: existing.id };
  }

  // Create new submission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submission, error } = (await (supabase as any)
    .from("exam_submissions")
    .insert({
      exam_id: examId,
      student_id: user.id,
      status: "in_progress",
    })
    .select("id")
    .single()) as { data: NewSubmission | null; error: Error | null };

  if (error) {
    return { error: error.message };
  }

  return { submissionId: submission?.id };
}

export async function saveAnswer(
  submissionId: string,
  questionId: string,
  selectedOptionId: string | null,
  answerText: string | null
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if answer already exists
  const { data: existing } = (await supabase
    .from("student_answers")
    .select("id")
    .eq("submission_id", submissionId)
    .eq("question_id", questionId)
    .single()) as { data: ExistingAnswer | null };

  if (existing) {
    // Update existing answer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("student_answers")
      .update({
        selected_option_id: selectedOptionId,
        answer_text: answerText,
      })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Insert new answer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("student_answers").insert({
      submission_id: submissionId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
      answer_text: answerText,
    });

    if (error) {
      return { error: error.message };
    }
  }

  return { success: true };
}

export async function submitExam(submissionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get submission to verify ownership
  const { data: submission } = (await supabase
    .from("exam_submissions")
    .select("id, exam_id, student_id")
    .eq("id", submissionId)
    .single()) as { data: SubmissionWithOwner | null };

  if (!submission || submission.student_id !== user.id) {
    return { error: "Submission not found" };
  }

  // Calculate score for auto-graded questions
  const { data: answers } = (await supabase
    .from("student_answers")
    .select(
      `
      id,
      is_correct,
      points_awarded,
      questions (
        points
      )
    `
    )
    .eq("submission_id", submissionId)) as { data: AnswerWithQuestion[] | null };

  let pointsEarned = 0;
  let pointsPossible = 0;

  if (answers) {
    for (const answer of answers) {
      const questionPoints = answer.questions?.points || 0;
      pointsPossible += questionPoints;
      if (answer.points_awarded !== null) {
        pointsEarned += answer.points_awarded;
      }
    }
  }

  const score = pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : 0;

  // Update submission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("exam_submissions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      score,
      points_earned: pointsEarned,
      points_possible: pointsPossible,
    })
    .eq("id", submissionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/results");
  return { success: true, score };
}
