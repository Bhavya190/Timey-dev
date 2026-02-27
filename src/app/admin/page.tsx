"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TaskStatus } from "@/lib/tasks";
import {
  fetchUsersAction,
  fetchProjectsAction,
  fetchClientsAction,
  fetchTasksAction,
  getCurrentUserAction,
  Project,
  Client,
  User,
  Task as TaskType,
} from "@/app/actions";
import TimeTrackerWidget from "@/components/TimeTrackerWidget";
import dynamic from "next/dynamic";
import {
  BarChart3,
  Users,
  Briefcase,
  ClipboardList,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const AdminDashboardCharts = dynamic(() => import("@/components/AdminDashboardCharts"), {
  ssr: false,
});



type ProjectStatus = Project["status"];
type ClientStatus = Client["status"];

// simple YYYY-MM-DD sort helper
const sortByDate = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function toLocalISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekRange(anchor: Date = new Date()) {
  const day = anchor.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - diffToMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return {
    start: toLocalISODate(monday),
    end: toLocalISODate(sunday),
  };
}

export default function AdminDashboard() {
  const { start: initialStart, end: initialEnd } = useMemo(() => getWeekRange(), []);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "all">(
    "all"
  );
  const [startDate, setStartDate] = useState<string>(initialStart);
  const [endDate, setEndDate] = useState<string>(initialEnd);

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetchUsersAction(),
      fetchProjectsAction(),
      fetchClientsAction(),
      fetchTasksAction(),
      getCurrentUserAction(),
    ]).then(([u, p, c, t, session]) => {
      setUsers(u);
      setProjects(p);
      setClients(c);
      setTasks(t);
      if (session) setCurrentEmployeeId(session.id);
      setIsLoading(false);
    });
  }, []);

  const employees = useMemo(() => users.filter(u => u.role === "employee"), [users]);

  const isWithinRange = (date: string) => {
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  };

  // Filtered tasks (employee + date)
  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const byEmployee =
          selectedEmployeeId === "all"
            ? true
            : t.assigneeIds.includes(selectedEmployeeId as number);
        const byDate = isWithinRange(t.date);
        return byEmployee && byDate;
      }),
    [tasks, selectedEmployeeId, startDate, endDate]
  );

  // Project count by status (global)
  const projectStatusData = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => {
      map.set(p.status, (map.get(p.status) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [projects]);

  // Client count by status (global)
  const clientStatusData = useMemo(() => {
    const map = new Map<string, number>();
    clients.forEach((c) => {
      map.set(c.status, (map.get(c.status) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [clients]);

  // Summarized tasks (grouped by project and name)
  const summarizedTasks = useMemo(() => {
    const groups: Record<string, { task: TaskType; totalHours: number }> = {};
    filteredTasks.forEach((t) => {
      const key = `${t.projectId}-${t.name}`;
      if (!groups[key]) {
        groups[key] = { task: t, totalHours: 0 };
      }
      groups[key].totalHours += t.workedHours;
    });
    return Object.values(groups);
  }, [filteredTasks]);

  // Tasks by status (summarized)
  const tasksByStatusData = useMemo(() => {
    const map = new Map<TaskStatus, number>();
    summarizedTasks.forEach(({ task }) => {
      map.set(task.status, (map.get(task.status) ?? 0) + 1);
    });
    const ALL_STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Completed"];
    return ALL_STATUSES.map((status) => ({
      name: status,
      value: map.get(status) ?? 0,
    }));
  }, [summarizedTasks]);

  // Tasks per date (summarized count)
  const tasksByDateData = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filteredTasks.forEach((t) => {
      if (!map.has(t.date)) {
        map.set(t.date, new Set());
      }
      map.get(t.date)!.add(`${t.projectId}-${t.name}`);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => sortByDate(a, b))
      .map(([date, taskSet]) => ({ date, count: taskSet.size }));
  }, [filteredTasks]);

  // Hours per date (filtered)
  const hoursByDateData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTasks.forEach((t) => {
      map.set(t.date, (map.get(t.date) ?? 0) + t.workedHours);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => sortByDate(a, b))
      .map(([date, hours]) => ({ date, hours }));
  }, [filteredTasks]);

  // Totals
  const totalEmployees = employees.length;
  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const openTasks = summarizedTasks.filter(({ task }) => task.status !== "Completed").length;

  const selectedEmployeeName =
    selectedEmployeeId === "all"
      ? "All employees"
      : employees.find((e) => e.id === selectedEmployeeId)?.name ?? "Unknown";

  const dateLabel =
    startDate || endDate ? `${startDate || "…"} – ${endDate || "…"}` : "all dates";

  // shift full week forward/backward
  const shiftWeek = (direction: "prev" | "next") => {
    if (!startDate || !endDate) return;
    const diff = 7 * (direction === "prev" ? -1 : 1);
    const [y, m, d] = startDate.split("-").map(Number);
    const startObj = new Date(y, m - 1, d + diff);
    const { start, end } = getWeekRange(startObj);
    setStartDate(start);
    setEndDate(end);
  };

  // format to "Jan 12, 2026"
  const formatDateShortWithYear = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // given an anchor date, set [Mon..Sun] week
  const setWeekFromAnchor = (anchor: Date) => {
    const { start, end } = getWeekRange(anchor);
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="space-y-6">
      {/* Header + date range pill */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted">
              Visual overview of employees, projects, clients, tasks and timesheet hours.
            </p>
          </div>
        </div>

        {/* Date range bar (same style as timesheet) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground">
            {/* Previous week */}
            <button
              type="button"
              onClick={() => shiftWeek("prev")}
              className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
              title="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Center label + calendar */}
            <div className="flex items-center gap-2">
              <span>
                {formatDateShortWithYear(startDate)} –{" "}
                {formatDateShortWithYear(endDate)}
              </span>

              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const selectedDate = new Date(e.target.value);
                    setWeekFromAnchor(selectedDate);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Select week date"
                />
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted hover:bg-card cursor-pointer pointer-events-none">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Next week */}
            <button
              type="button"
              onClick={() => shiftWeek("next")}
              className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
              title="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {currentEmployeeId && (
        <TimeTrackerWidget employeeId={currentEmployeeId} />
      )}

      {/* Summary cards (3 stats + 1 employee filter) */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total employees */}
        <Link
          href="/admin/employees"
          className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:border-emerald-500 hover:bg-card/90 transition-colors"
        >
          <div>
            <p className="text-xs text-muted">Total employees</p>
            <p className="mt-2 text-2xl font-semibold underline decoration-emerald-500/70 decoration-2 underline-offset-4">
              {totalEmployees}
            </p>
            <p className="text-[11px] text-muted mt-1">
              Click to view the employees list.
            </p>
          </div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-emerald-500">
            <Users className="h-4 w-4" />
          </div>
        </Link>

        {/* Active projects */}
        <Link
          href="/admin/projects"
          className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:border-emerald-500 hover:bg-card/90 transition-colors"
        >
          <div>
            <p className="text-xs text-muted">Active projects</p>
            <p className="mt-2 text-2xl font-semibold underline decoration-emerald-500/70 decoration-2 underline-offset-4">
              {activeProjects}
            </p>
            <p className="text-[11px] text-muted mt-1">
              Click to manage projects.
            </p>
          </div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-emerald-500">
            <Briefcase className="h-4 w-4" />
          </div>
        </Link>

        {/* Open tasks */}
        <Link
          href="/admin/tasks"
          className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:border-emerald-500 hover:bg-card/90 transition-colors"
        >
          <div>
            <p className="text-xs text-muted">Open tasks</p>
            <p className="mt-2 text-2xl font-semibold underline decoration-emerald-500/70 decoration-2 underline-offset-4">
              {openTasks}
            </p>
            <p className="text-[11px] text-muted mt-1">
              Click to see filtered tasks.
            </p>
          </div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-emerald-500">
            <ClipboardList className="h-4 w-4" />
          </div>
        </Link>

        {/* Employee filter card */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted">Employee filter</p>
            <Users className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Filter charts by employee.
          </p>

          <select
            value={selectedEmployeeId}
            onChange={(e) =>
              setSelectedEmployeeId(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
            className="mt-3 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
          >
            <option value="all">All employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Charts */}
      <AdminDashboardCharts
        projectStatusData={projectStatusData}
        clientStatusData={clientStatusData}
        tasksByStatusData={tasksByStatusData}
        tasksByDateData={tasksByDateData}
        hoursByDateData={hoursByDateData}
        selectedEmployeeName={selectedEmployeeName}
        dateLabel={dateLabel}
      />
    </div>
  );
}
