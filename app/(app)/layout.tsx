import { Nav } from "@/components/Nav";
import { ToastProvider } from "@/components/Toast";
import { StadiumBackground } from "@/components/StadiumBackground";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen relative">
        <StadiumBackground />
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">{children}</main>
      </div>
    </ToastProvider>
  );
}
