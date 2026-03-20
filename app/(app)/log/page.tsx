import { Suspense } from "react";
import LogClient from "./LogClient";

export default function LogPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <LogClient />
    </Suspense>
  );
}
