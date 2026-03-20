import { Nav } from "@/components/Nav";
import { ToastProvider } from "@/components/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0f1117]">
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
