"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ name, active }: { name: "home" | "tasks" | "assets" | "admin" | "techs" | "add"; active: boolean }) {
  const cls = `h-5 w-5 ${active ? "text-indigo-700" : "text-zinc-500"}`;
  if (name === "home")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.8V21h14V9.8" />
      </svg>
    );
  if (name === "tasks")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  if (name === "assets")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 7H4" />
        <path d="M20 7v12H4V7" />
        <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      </svg>
    );
  if (name === "admin")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 4 6v6c0 5 3.5 9.4 8 10 4.5-.6 8-5 8-10V6l-8-4Z" />
        <path d="M9 12l2 2 4-5" />
      </svg>
    );
  if (name === "techs")
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Home" },
  { href: "/admin", label: "Admin" },
  { href: "/tasks", label: "Tasks" },
  { href: "/assets", label: "Assets" },
  { href: "/technicians", label: "Techs" },
  { href: "/tasks/new", label: "Add" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const iconFor = (href: string) => {
    if (href === "/dashboard") return "home" as const;
    if (href === "/admin") return "admin" as const;
    if (href === "/tasks") return "tasks" as const;
    if (href === "/assets") return "assets" as const;
    if (href === "/technicians") return "techs" as const;
    return "add" as const;
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/90 backdrop-blur md:hidden">
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href === "/tasks" && pathname.startsWith("/tasks/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors",
                active ? "text-indigo-700" : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
            >
              <Icon name={iconFor(item.href)} active={active} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

