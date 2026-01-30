import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

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
              <span className="text-gray-600">
                {profile?.full_name || user.email}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded">
                {profile?.role || "student"}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              My Courses
            </h2>
            <p className="text-gray-600 mb-4">
              View your enrolled courses and upcoming exams.
            </p>
            <Link
              href="/courses"
              className="text-bu-red hover:text-red-700 font-medium"
            >
              View courses &rarr;
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Upcoming Exams
            </h2>
            <p className="text-gray-600 mb-4">
              See your scheduled exams and deadlines.
            </p>
            <Link
              href="/exams"
              className="text-bu-red hover:text-red-700 font-medium"
            >
              View exams &rarr;
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              My Results
            </h2>
            <p className="text-gray-600 mb-4">
              Check your exam scores and feedback.
            </p>
            <Link
              href="/results"
              className="text-bu-red hover:text-red-700 font-medium"
            >
              View results &rarr;
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
