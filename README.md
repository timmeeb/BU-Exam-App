# BU Exam App

Boston University Online Examination Platform built with Next.js and Supabase.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bu-exam-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API to get your project URL and anon key
   - Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Run database migrations**
   - Go to your Supabase dashboard > SQL Editor
   - Copy the contents of `supabase/migrations/20240101000000_initial_schema.sql`
   - Run the SQL to create the database schema

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following main tables:

- **profiles**: User profiles linked to Supabase Auth
- **courses**: Course information
- **course_enrollments**: Student-course relationships
- **exams**: Exam definitions
- **questions**: Exam questions
- **answer_options**: Multiple choice answer options
- **exam_submissions**: Student exam attempts
- **student_answers**: Individual question responses

## User Roles

- **student**: Can take exams, view results
- **instructor**: Can create/manage exams, grade submissions
- **admin**: Full system access

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## License

MIT
