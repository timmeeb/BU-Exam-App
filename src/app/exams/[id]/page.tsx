import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type ExamWithDetails = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  status: string;
  duration_minutes: number | null;
  start_time: string | null;
  end_time: string | null;
  courses: { code: string; name: string } | null;
};

type ExistingSubmission = {
  id: string;
  status: string;
};

export default async function ExamDetailPage({
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

  const { data: exam } = (await supabase
    .from("exams")
    .select(
      `
      id,
      title,
      description,
      instructions,
      status,
      duration_minutes,
      start_time,
      end_time,
      courses (
        code,
        name
      )
    `
    )
    .eq("id", id)
    .single()) as { data: ExamWithDetails | null };

  if (!exam) {
    redirect("/exams");
  }

  // Check if user already has a submission
  const { data: existingSubmission } = (await supabase
    .from("exam_submissions")
    .select("id, status")
    .eq("exam_id", id)
    .eq("student_id", user.id)
    .single()) as { data: ExistingSubmission | null };

  const canTakeExam = exam.status === "active";
  const hasSubmitted =
    existingSubmission?.status === "submitted" ||
    existingSubmission?.status === "graded";
  const hasInProgress = existingSubmission?.status === "in_progress";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-bu-red">
                BU Exam App
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/exams"
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Exams
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            {exam.courses && (
              <p className="text-sm text-gray-600 mb-1">
                {exam.courses.code} - {exam.courses.name}
              </p>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
          </div>

          {exam.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-gray-600">{exam.description}</p>
            </div>
          )}

          {exam.instructions && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Instructions
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {exam.instructions}
              </p>
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  exam.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {exam.status}
              </span>
            </div>
            {exam.duration_minutes && (
              <div>
                <span className="font-medium text-gray-700">Duration:</span>{" "}
                {exam.duration_minutes} minutes
              </div>
            )}
            {exam.start_time && (
              <div>
                <span className="font-medium text-gray-700">Start:</span>{" "}
                {new Date(exam.start_time).toLocaleString()}
              </div>
            )}
            {exam.end_time && (
              <div>
                <span className="font-medium text-gray-700">End:</span>{" "}
                {new Date(exam.end_time).toLocaleString()}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            {hasSubmitted ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  You have already submitted this exam.
                </p>
                <Link
                  href="/results"
                  className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  View Results
                </Link>
              </div>
            ) : hasInProgress ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  You have an exam in progress.
                </p>
                <Link
                  href={`/exams/${exam.id}/take`}
                  className="inline-flex items-center px-6 py-3 bg-bu-red text-white rounded-lg hover:bg-red-700"
                >
                  Continue Exam
                </Link>
              </div>
            ) : canTakeExam ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  When you&apos;re ready, click the button below to start the
                  exam.
                </p>
                <Link
                  href={`/exams/${exam.id}/take`}
                  className="inline-flex items-center px-6 py-3 bg-bu-red text-white rounded-lg hover:bg-red-700"
                >
                  Start Exam
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600">
                  This exam is not currently available.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
