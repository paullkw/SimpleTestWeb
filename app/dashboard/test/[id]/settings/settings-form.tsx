"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UpdateSettingsResponse = {
  ok?: boolean;
  error?: string;
};

type Props = {
  testId: string;
  initialConsecutiveCorrectToInactivateQuestion: number;
};

export default function SettingsForm({
  testId,
  initialConsecutiveCorrectToInactivateQuestion,
}: Props) {
  const router = useRouter();
  const [consecutiveCorrectToInactivateQuestion, setConsecutiveCorrectToInactivateQuestion] =
    useState(initialConsecutiveCorrectToInactivateQuestion);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !Number.isInteger(consecutiveCorrectToInactivateQuestion) ||
      consecutiveCorrectToInactivateQuestion < 0
    ) {
      setError("Please enter a non-negative whole number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/tests/${testId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consecutiveCorrectToInactivateQuestion,
        }),
      });

      const data = (await response.json()) as UpdateSettingsResponse;

      if (!response.ok) {
        setError(data.error ?? "Failed to update settings.");
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
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Consecutive Correct To Inactivate Question
        </span>
        <input
          type="number"
          min={0}
          step={1}
          value={consecutiveCorrectToInactivateQuestion}
          onChange={(e) => setConsecutiveCorrectToInactivateQuestion(Number(e.target.value))}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none ring-sky-300 transition focus:border-sky-400 focus:ring-2"
        />
        <p className="mt-2 text-xs text-zinc-600">
          Set to 0 to disable automatic inactivation.
        </p>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>

        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
