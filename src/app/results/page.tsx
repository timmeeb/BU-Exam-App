import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ResultsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type SubmissionWithExam = {
    id: string;
    status: string;
    score: number | null;
    points_earned: number | null;
    points_possible: number | null;
    submitted_at: string | null;
    graded_at: string | null;
    feedback: string | null;
    exams: {
      title: string;
      courses: { code: string; name: string } | null;
    } | null;
  };

  const { data: submissions } = await supabase
    .from("exam_submissions")
    .select(`
      id,
      status,
      score,
      points_earned,
      points_possible,
      submitted_at,
      graded_at,
      feedback,
      exams (
        title,
        courses (
          code,
          name
        )
      )
    `)
    .eq("student_id", user.id)
    .in("status", ["submitted", "graded"])
    .order("submitted_at", { ascending: false }) as { data: SubmissionWithExam[] | null };

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
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-gray-600 hover:text-gray-900">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Results</h1>

        {submissions && submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const exam = submission.exams;

              return (
                <div key={submission.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {exam?.title || "Unknown Exam"}
                      </h2>
                      {exam?.courses && (
                        <p className="text-sm text-gray-600">
                          {exam.courses.code} - {exam.courses.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {submission.status === "graded" && submission.score !== null ? (
                        <div>
                          <span className={`text-2xl font-bold ${
                            submission.score >= 70 ? "text-green-600" : "text-red-600"
                          }`}>
                            {submission.score.toFixed(1)}%
                          </span>
                          {submission.points_earned !== null && submission.points_possible !== null && (
                            <p className="text-sm text-gray-500">
                              {submission.points_earned} / {submission.points_possible} points
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          Pending Grade
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    {submission.submitted_at && (
                      <p>Submitted: {new Date(submission.submitted_at).toLocaleString()}</p>
                    )}
                    {submission.graded_at && (
                      <p>Graded: {new Date(submission.graded_at).toLocaleString()}</p>
                    )}
                  </div>
                  {submission.feedback && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-700">Feedback:</p>
                      <p className="text-sm text-gray-600">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">No exam results yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
