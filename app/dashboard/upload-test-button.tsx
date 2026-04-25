"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UploadResponse = {
  testId?: string;
  error?: string;
};

export default function UploadTestButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openFilePicker() {
    if (loading) {
      return;
    }
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/tests/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadResponse;

      if (!response.ok || !data.testId) {
        setError(data.error ?? "Failed to upload test.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong while uploading.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={openFilePicker}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Upload Test"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
