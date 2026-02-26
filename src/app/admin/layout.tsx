"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock4,
  Users,
  Briefcase,
  FolderKanban,
  ClipboardList,
  LogOut,
  Settings,
  User as UserIcon,
  Clock,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/app/actions";
import { useUser } from "@/components/UserProvider";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/timesheet", label: "Timesheet", icon: Clock4 },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/clients", label: "Clients", icon: Briefcase },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentAdmin, isLoading, logout } = useUser();

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 text-center max-w-md">
          <h1 className="text-lg font-semibold mb-2">
            Loading admin profile...
          </h1>
          <p className="text-sm text-muted">
            Please wait while your profile is loaded.
          </p>
        </div>
      </main>
    );
  }

  if (!currentAdmin || (currentAdmin.role !== "admin" && currentAdmin.role !== "teamLead")) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 text-center max-w-md">
          <h1 className="text-lg font-semibold mb-2">
            Access Restricted
          </h1>
          <p className="text-sm text-muted">
            Please log in with an administrator or team lead account to continue.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 font-medium"
          >
            Go to login
          </button>
        </div>
      </main>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen bg-background text-foreground flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/95 sticky top-0 h-screen overflow-y-auto">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/40">
              <Clock className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.25em] text-emerald-500 uppercase mb-0.5">
                Timey
              </p>
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-500 px-1 rounded bg-emerald-500/10 w-fit mb-0.5 font-bold uppercase tracking-wider">
                  {currentAdmin.role}
                </span>
                <p className="text-xs text-muted flex items-center gap-1">
                  {currentAdmin.avatarUrl ? (
                    <img
                      src={currentAdmin.avatarUrl}
                      alt="Avatar"
                      className="h-3.5 w-3.5 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 text-muted" />
                  )}
                  <span className="text-foreground font-medium">{currentAdmin.name}</span>
                </p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {adminLinks.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-2 w-full text-left rounded-lg px-3 py-2 font-medium transition ${active
                  ? "bg-emerald-500 text-slate-950"
                  : "text-muted hover:bg-background/80 hover:text-foreground"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Right side */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 flex items-center justify-between border-b border-border px-4 bg-card/95">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/40">
              <Clock className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-500">
                Timey
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-emerald-500 px-1 rounded bg-emerald-500/10 font-bold uppercase tracking-wider">
                  {currentAdmin.role}
                </span>
                <span className="text-[11px] text-muted flex items-center gap-1">
                  {currentAdmin.avatarUrl ? (
                    <img
                      src={currentAdmin.avatarUrl}
                      alt="Avatar"
                      className="h-3 w-3 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-3 w-3 text-muted" />
                  )}
                  <span className="text-foreground font-medium">{currentAdmin.name}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:bg-card"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </header>

        {/* Mobile horizontal nav */}
        <nav className="md:hidden flex gap-2 overflow-x-auto px-3 py-2 border-b border-border bg-card/95">
          {adminLinks.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${active
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-background text-muted"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
