"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Gauge, PlusCircle, Shield, Wrench } from "lucide-react";

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
  { href: "/tasks", label: "Tasks" },
  { href: "/tasks/new", label: "New Task" },
  { href: "/assets", label: "Assets" },
];

function iconFor(href: string) {
  if (href === "/dashboard") return Gauge;
  if (href === "/admin") return Shield;
  if (href === "/tasks") return ClipboardList;
  if (href === "/tasks/new") return PlusCircle;
  return Wrench;
}

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-indigo-100 bg-gradient-to-b from-white via-indigo-50/30 to-white md:block">
      <div className="p-4">
        <div className="text-sm font-semibold text-zinc-900">MADMANREP</div>
        <div className="mt-1 text-xs text-zinc-500">Technician login required</div>
      </div>
      <nav className="p-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = iconFor(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all",
                active
                  ? "bg-indigo-100 text-indigo-900 shadow-sm"
                  : "text-zinc-700 hover:bg-indigo-50 hover:text-indigo-800",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

