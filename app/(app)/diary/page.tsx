import { Suspense } from "react";
import DiaryClient from "./DiaryClient";

export default function DiaryPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <DiaryClient />
    </Suspense>
  );
}
