"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveAnswer, submitExam } from "@/app/actions/exam";

type AnswerOption = {
  id: string;
  option_text: string;
  option_order: number;
};

type Question = {
  id: string;
  question_type: string;
  question_text: string;
  question_order: number;
  points: number;
  answer_options: AnswerOption[];
};

type ExamData = {
  id: string;
  title: string;
  duration_minutes: number | null;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  courses: { code: string; name: string } | null;
};

type ExistingAnswers = Record<
  string,
  { selectedOptionId: string | null; answerText: string | null }
>;

interface ExamTakerProps {
  exam: ExamData;
  questions: Question[];
  submissionId: string;
  startedAt: string;
  existingAnswers: ExistingAnswers;
}

export default function ExamTaker({
  exam,
  questions,
  submissionId,
  startedAt,
  existingAnswers,
}: ExamTakerProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { selectedOptionId: string | null; answerText: string | null }>
  >(existingAnswers);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Timer effect
  useEffect(() => {
    if (!exam.duration_minutes) return;

    const startTime = new Date(startedAt).getTime();
    const endTime = startTime + exam.duration_minutes * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleSubmit();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [exam.duration_minutes, startedAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = async (
    questionId: string,
    selectedOptionId: string | null,
    answerText: string | null
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selectedOptionId, answerText },
    }));

    setSaving(true);
    await saveAnswer(submissionId, questionId, selectedOptionId, answerText);
    setSaving(false);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    const result = await submitExam(submissionId);

    if (result.error) {
      alert("Error submitting exam: " + result.error);
      setSubmitting(false);
      return;
    }

    router.push("/results");
  };

  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {exam.title}
              </h1>
              {exam.courses && (
                <p className="text-sm text-gray-600">
                  {exam.courses.code} - {exam.courses.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div
                  className={`text-lg font-mono ${
                    timeRemaining < 300 ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </div>
              )}
              {saving && (
                <span className="text-sm text-gray-500">Saving...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-gray-200">
        <div
          className="h-1 bg-bu-red transition-all duration-300"
          style={{
            width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Question header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="ml-2 text-sm text-gray-400">
                ({currentQuestion.points} point
                {currentQuestion.points !== 1 ? "s" : ""})
              </span>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded ${
                currentAnswer
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {currentAnswer ? "Answered" : "Not answered"}
            </span>
          </div>

          {/* Question text */}
          <div className="mb-6">
            <p className="text-lg text-gray-900">{currentQuestion.question_text}</p>
          </div>

          {/* Answer options */}
          <div className="space-y-3">
            {currentQuestion.question_type === "multiple_choice" ||
            currentQuestion.question_type === "true_false" ? (
              currentQuestion.answer_options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    currentAnswer?.selectedOptionId === option.id
                      ? "border-bu-red bg-red-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={currentAnswer?.selectedOptionId === option.id}
                    onChange={() =>
                      handleAnswerChange(currentQuestion.id, option.id, null)
                    }
                    className="h-4 w-4 text-bu-red focus:ring-bu-red"
                  />
                  <span className="ml-3 text-gray-900">{option.option_text}</span>
                </label>
              ))
            ) : currentQuestion.question_type === "short_answer" ? (
              <input
                type="text"
                value={currentAnswer?.answerText || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, null, e.target.value)
                }
                placeholder="Enter your answer..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-bu-red focus:border-bu-red"
              />
            ) : currentQuestion.question_type === "essay" ? (
              <textarea
                value={currentAnswer?.answerText || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, null, e.target.value)
                }
                placeholder="Enter your answer..."
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-bu-red focus:border-bu-red"
              />
            ) : null}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &larr; Previous
          </button>

          <div className="flex gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded text-sm font-medium ${
                  index === currentQuestionIndex
                    ? "bg-bu-red text-white"
                    : answers[questions[index].id]
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-bu-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 text-bu-red hover:text-red-700"
            >
              Next &rarr;
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
