"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
};

type CreateTestResponse = {
  testId?: string;
  error?: string;
};

export default function CreateTestForm() {
  const router = useRouter();
  const nextId = useRef(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: 0, text: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: nextId.current++, text: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  }

  function removeQuestion(id: number) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function updateQuestionText(id: number, text: string) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text } : q)));
  }

  function updateOption(id: number, optionIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, options: q.options.map((o, i) => (i === optionIndex ? value : o)) }
          : q
      )
    );
  }

  function updateCorrectIndex(id: number, correctIndex: number) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, correctIndex } : q)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (questions.length === 0) {
      setError("Add at least one question.");
      return;
    }

    for (const q of questions) {
      if (!q.text.trim()) {
        setError("All question texts are required.");
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        setError("All answer options must be filled in.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          questionsCount: questions.length,
          questions: questions.map(({ text, options, correctIndex }) => ({
            text,
            options,
            correctIndex,
          })),
        }),
      });

      const data = (await response.json()) as CreateTestResponse;

      if (!response.ok || !data.testId) {
        setError(data.error ?? "Failed to create test.");
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
      {/* Basic info */}
      <section className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Title *</span>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. JavaScript Fundamentals"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none ring-orange-300 transition focus:border-orange-400 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the test (optional)"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none ring-orange-300 transition focus:border-orange-400 focus:ring-2"
          />
        </label>
      </section>

      {/* Questions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">
            Questions ({questions.length})
          </h2>
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-lg border border-orange-300 px-3 py-1.5 text-sm font-medium text-orange-900 transition hover:bg-orange-50"
          >
            + Add Question
          </button>
        </div>

        <ul className="space-y-5">
          {questions.map((q, qIndex) => (
            <li
              key={q.id}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="mt-0.5 text-sm font-medium text-zinc-600">
                  Q{qIndex + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                required
                type="text"
                value={q.text}
                onChange={(e) => updateQuestionText(q.id, e.target.value)}
                placeholder="Question text"
                className="mb-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-orange-300 transition focus:border-orange-400 focus:ring-2"
              />

              <p className="mb-2 text-xs font-medium text-zinc-600">
                Options — select the correct answer
              </p>
              <ul className="space-y-2">
                {q.options.map((opt, oIndex) => (
                  <li key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctIndex === oIndex}
                      onChange={() => updateCorrectIndex(q.id, oIndex)}
                      className="accent-orange-600"
                    />
                    <input
                      required
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(q.id, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-orange-300 transition focus:border-orange-400 focus:ring-2"
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Create Test"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
