"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
  { href: "/tasks", label: "Tasks" },
  { href: "/tasks/new", label: "New Task" },
  { href: "/assets", label: "Assets" },
  { href: "/technicians", label: "Technicians" },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white md:block">
      <div className="p-4">
        <div className="text-sm font-semibold text-zinc-900">MADMANREP</div>
          <div className="mt-1 text-xs text-zinc-500">Technician login required</div>
      </div>
      <nav className="p-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

