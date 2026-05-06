"use client";

import Link from "next/link";
import { useState } from "react";

type Question = {
  questionId: string;
  text: string;
  options: string[];
  correctIndexes: number[];
};

type Props = {
  testId: string;
  title: string;
  questions: Question[];
};

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function TestForm({ testId, title, questions }: Props) {
  const [shuffledQuestions] = useState(() => shuffleArray(questions));
  const [answers, setAnswers] = useState<number[][]>(() => shuffledQuestions.map(() => []));
  const [shuffledOrders] = useState<number[][]>(() =>
    shuffledQuestions.map((q) => shuffleArray(q.options.map((_, i) => i)))
  );
  const [checkedQuestions, setCheckedQuestions] = useState<Set<number>>(() => new Set());

  async function recordIncorrect(questionIndex: number) {
    await fetch(`/api/tests/${testId}/incorrect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: shuffledQuestions[questionIndex].questionId }),
    });
  }

  async function recordCorrect(questionIndex: number) {
    await fetch(`/api/tests/${testId}/correct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: shuffledQuestions[questionIndex].questionId }),
    });
  }

  function checkQuestion(questionIndex: number) {
    const selected = [...answers[questionIndex]].sort((a, b) => a - b);
    const correct = [...shuffledQuestions[questionIndex].correctIndexes].sort((a, b) => a - b);
    const isMatch =
      selected.length === correct.length &&
      selected.every((v, i) => v === correct[i]);
    if (isMatch) {
      recordCorrect(questionIndex);
    } else {
      recordIncorrect(questionIndex);
    }
    setCheckedQuestions((prev) => new Set(prev).add(questionIndex));
  }

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

  function selectAnswer(questionIndex: number, optionIndex: number) {
    const isCorrect = shuffledQuestions[questionIndex].correctIndexes.includes(optionIndex);
    if (isCorrect) {
      recordCorrect(questionIndex);
    } else {
      recordIncorrect(questionIndex);
    }
    setAnswers((prev) =>
      prev.map((value, index) =>
        index === questionIndex ? [optionIndex] : value
      )
    );
  }

  if (shuffledQuestions.length === 0) {
    return (
      <section className="space-y-4">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This test has no questions yet.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form className="space-y-6">
      <ul className="space-y-5">
        {shuffledQuestions.map((question, questionIndex) => (
          <li key={`${title}-${questionIndex}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="whitespace-pre-line break-words text-sm font-semibold text-zinc-900">
                {questionIndex + 1}. {question.text}
              </p>
            </div>

            <ul className="space-y-2">
              {shuffledOrders[questionIndex].map((originalIndex) => {
                const option = question.options[originalIndex];
                const optionIndex = originalIndex;
                const isSingle = question.correctIndexes.length === 1;
                const isSelected = answers[questionIndex].includes(optionIndex);
                const hasAnswered = isSingle && answers[questionIndex].length > 0;
                const isChecked = !isSingle && checkedQuestions.has(questionIndex);
                const isCorrect = question.correctIndexes.includes(optionIndex);
                const showCorrect = (hasAnswered || isChecked) && isCorrect;
                const showWrong = (hasAnswered || isChecked) && isSelected && !isCorrect;

                return (
                  <li key={`${questionIndex}-${optionIndex}`}>
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        showCorrect
                          ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                          : showWrong
                            ? "border-red-400 bg-red-50 text-red-900"
                            : isSelected
                              ? "border-emerald-300 bg-emerald-50/50"
                              : "border-zinc-300 bg-white hover:bg-zinc-100"
                      }`}
                    >
                      {isSingle ? (
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          checked={isSelected}
                          onChange={() => selectAnswer(questionIndex, optionIndex)}
                          disabled={hasAnswered}
                          className="accent-emerald-600"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAnswer(questionIndex, optionIndex)}
                          disabled={isChecked}
                          className="accent-emerald-600"
                        />
                      )}
                      <span className="whitespace-pre-line break-words">{option}</span>
                      {showCorrect && <span className="ml-auto text-xs font-medium text-emerald-700">Correct</span>}
                      {showWrong && <span className="ml-auto text-xs font-medium text-red-700">Wrong</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
            {question.correctIndexes.length > 1 && !checkedQuestions.has(questionIndex) && (
              <button
                type="button"
                onClick={() => checkQuestion(questionIndex)}
                disabled={answers[questionIndex].length === 0}
                className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
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
