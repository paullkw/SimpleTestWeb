"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Question = {
  text: string;
  options: string[];
  correctIndexes: number[];
};

type Props = {
  title: string;
  questions: Question[];
};

export default function TestForm({ title, questions }: Props) {
  const [answers, setAnswers] = useState<number[][]>(() => questions.map(() => []));
  const [submitted, setSubmitted] = useState(false);

  const unansweredCount = useMemo(
    () => answers.filter((answer) => answer.length === 0).length,
    [answers]
  );

  const score = useMemo(() => {
    if (!submitted) {
      return 0;
    }

    return questions.reduce((count, question, index) => {
      const selected = [...answers[index]].sort((a, b) => a - b);
      const correct = [...question.correctIndexes].sort((a, b) => a - b);
      const isMatch =
        selected.length === correct.length &&
        selected.every((value, valueIndex) => value === correct[valueIndex]);

      return isMatch ? count + 1 : count;
    }, 0);
  }, [answers, questions, submitted]);

  function toggleAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) =>
      prev.map((value, index) => {
        if (index !== questionIndex) {
          return value;
        }

        const hasOption = value.includes(optionIndex);

        if (hasOption) {
          return value.filter((selected) => selected !== optionIndex);
        }

        return [...value, optionIndex].sort((a, b) => a - b);
      })
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (unansweredCount > 0) {
      return;
    }

    setSubmitted(true);
  }

  if (questions.length === 0) {
    return (
      <section className="space-y-4">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This test has no questions yet.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Back to Dashboard
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ul className="space-y-5">
        {questions.map((question, questionIndex) => (
          <li key={`${title}-${questionIndex}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-zinc-900">
              {questionIndex + 1}. {question.text}
            </p>

            <ul className="space-y-2">
              {question.options.map((option, optionIndex) => {
                const isSelected = answers[questionIndex].includes(optionIndex);
                const isCorrect = question.correctIndexes.includes(optionIndex);
                const showCorrect = submitted && isCorrect;
                const showWrong = submitted && isSelected && !isCorrect;

                return (
                  <li key={`${questionIndex}-${optionIndex}`}>
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        showCorrect
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : showWrong
                            ? "border-red-300 bg-red-50 text-red-900"
                            : isSelected
                              ? "border-emerald-300 bg-emerald-50/50"
                              : "border-zinc-300 bg-white hover:bg-zinc-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAnswer(questionIndex, optionIndex)}
                        disabled={submitted}
                        className="accent-emerald-600"
                      />
                      <span>{option}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      {submitted ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          You scored {score} / {questions.length}
        </div>
      ) : unansweredCount > 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Please answer all questions before submitting. Remaining: {unansweredCount}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {!submitted ? (
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Submit Test
          </button>
        ) : null}

        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Back to Dashboard
        </Link>
      </div>
    </form>
  );
}
