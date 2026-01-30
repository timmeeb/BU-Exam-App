import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type EnrollmentWithCourse = {
    id: string;
    enrolled_at: string;
    courses: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      semester: string;
    } | null;
  };

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(`
      id,
      enrolled_at,
      courses (
        id,
        code,
        name,
        description,
        semester
      )
    `)
    .eq("student_id", user.id) as { data: EnrollmentWithCourse[] | null };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h1>

        {enrollments && enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.courses;
              if (!course) return null;

              return (
                <div key={enrollment.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {course.code}
                    </h2>
                    <span className="text-sm text-gray-500">{course.semester}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{course.name}</p>
                  {course.description && (
                    <p className="text-gray-600 text-sm">{course.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">You are not enrolled in any courses yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
