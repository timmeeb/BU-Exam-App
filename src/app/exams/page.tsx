import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ExamsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type Enrollment = { course_id: string };
  type ExamWithCourse = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    duration_minutes: number | null;
    start_time: string | null;
    end_time: string | null;
    courses: { code: string; name: string } | null;
  };

  // Get enrolled course IDs
  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select("course_id")
    .eq("student_id", user.id) as { data: Enrollment[] | null };

  const courseIds = enrollments?.map((e) => e.course_id) || [];

  // Get exams for enrolled courses
  const { data: exams } = courseIds.length > 0
    ? await supabase
        .from("exams")
        .select(`
          id,
          title,
          description,
          status,
          duration_minutes,
          start_time,
          end_time,
          courses (
            code,
            name
          )
        `)
        .in("course_id", courseIds)
        .in("status", ["published", "active", "completed"])
        .order("start_time", { ascending: true }) as { data: ExamWithCourse[] | null }
    : { data: [] as ExamWithCourse[] };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Exams</h1>

        {exams && exams.length > 0 ? (
          <div className="space-y-4">
            {exams.map((exam) => {
              const course = exam.courses;
              const statusColors: Record<string, string> = {
                published: "bg-blue-100 text-blue-800",
                active: "bg-green-100 text-green-800",
                completed: "bg-gray-100 text-gray-800",
              };

              return (
                <div key={exam.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {exam.title}
                      </h2>
                      {course && (
                        <p className="text-sm text-gray-600">
                          {course.code} - {course.name}
                        </p>
                      )}
                      {exam.description && (
                        <p className="text-gray-600 mt-2">{exam.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[exam.status] || "bg-gray-100"}`}>
                      {exam.status}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm text-gray-500">
                    {exam.duration_minutes && (
                      <span>Duration: {exam.duration_minutes} minutes</span>
                    )}
                    {exam.start_time && (
                      <span>
                        Starts: {new Date(exam.start_time).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {exam.status === "active" && (
                    <div className="mt-4">
                      <Link
                        href={`/exams/${exam.id}`}
                        className="inline-flex items-center px-4 py-2 bg-bu-red text-white rounded hover:bg-red-700"
                      >
                        Start Exam
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">No upcoming exams at this time.</p>
          </div>
        )}
      </main>
    </div>
  );
}
