"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/diary", label: "Diary" },
  { href: "/log", label: "Log" },
  { href: "/stats", label: "Stats" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-40 shadow-[0_1px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/diary" className="font-bold text-white text-lg tracking-tight">
          Box<span className="text-blue-400">Scord</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
                pathname?.startsWith(link.href)
                  ? "border-blue-400 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {loggingOut ? "..." : "Logout"}
          </button>
        </div>
      </div>
    </nav>
  );
}
