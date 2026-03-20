import { Suspense } from "react";
import StatsClient from "./StatsClient";

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <StatsClient />
    </Suspense>
  );
}
