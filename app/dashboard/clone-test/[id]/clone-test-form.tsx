"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndexes: number[];
  active: boolean;
  incorrectCount: number;
  selected: boolean;
};

type CreateTestResponse = {
  testId?: string;
  error?: string;
};

type Props = {
  initialTitle: string;
  initialDescription: string;
  initialQuestions: Question[];
};

export default function CloneTestForm({
  initialTitle,
  initialDescription,
  initialQuestions,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleQuestionSelected(id: string) {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id ? { ...question, selected: !question.selected } : question
      )
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const selectedQuestions = questions.filter((question) => question.selected);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (selectedQuestions.length === 0) {
      setError("Select at least one question to clone.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          questions: selectedQuestions.map(({ text, options, correctIndexes }) => ({
            text,
            options,
            correctIndexes,
            active: true,
          })),
        }),
      });

      const data = (await response.json()) as CreateTestResponse;

      if (!response.ok || !data.testId) {
        setError(data.error ?? "Failed to clone test.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Title *</span>
          <input
            required
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none ring-violet-300 transition focus:border-violet-400 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none ring-violet-300 transition focus:border-violet-400 focus:ring-2"
          />
        </label>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">
            Questions to Clone ({questions.filter((question) => question.selected).length}/{questions.length})
          </h2>
        </div>

        {questions.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This test has no questions to clone.
          </p>
        ) : (
          <ul className="space-y-4">
            {questions.map((question, index) => (
              <li
                key={question.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={question.selected}
                    onChange={() => toggleQuestionSelected(question.id)}
                    className="mt-1 accent-violet-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">
                        #{index + 1} {question.text}
                      </span>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                        Incorrect: {question.incorrectCount}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-zinc-600">
                      {question.options.map((option, optionIndex) => {
                        const isCorrect = question.correctIndexes.includes(optionIndex);
                        return (
                          <li key={`${question.id}-${optionIndex}`}>
                            <span className={isCorrect ? "font-medium text-emerald-800" : undefined}>
                              {option}
                            </span>
                            {isCorrect ? " (correct)" : ""}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || questions.length === 0}
          className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Cloning..." : "Clone Test"}
        </button>
        <button
          type="button"
          onClick={() => router.replace("/dashboard")}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
