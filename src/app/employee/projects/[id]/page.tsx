"use client";

import { use, useEffect, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import { Project } from "@/lib/projects";
import { Task, fetchProjectsAction, fetchTasksAction, getCurrentUserAction } from "@/app/actions";
import {
  FolderKanban,
  BadgeInfo,
  UserCheck,
  Clock3,
  ListChecks,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

const formatHumanDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export default function EmployeeProjectDetailsPage({ params, currentEmployeeId: propId }: PageProps & { currentEmployeeId?: number }) {
  // Unwrap params Promise with React.use
  const { id } = use(params);
  const projectId = Number(id);

  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(propId ?? null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<"logs" | "summary">("summary");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "date", direction: "desc" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProjectsAction(), fetchTasksAction()]).then(([p, t]) => {
      setProjects(p);
      setTasks(t);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    async function loadSession() {
      try {
        if (propId) {
          setCurrentEmployeeId(propId);
        } else {
          const session = await getCurrentUserAction();
          if (session && session.role === "employee") {
            setCurrentEmployeeId(session.id);
          }
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setLoadingEmployee(false);
      }
    }
    loadSession();
  }, [propId]);

  if (Number.isNaN(projectId)) {
    notFound();
  }

  const project = projects.find((p) => p.id === projectId);
  if (!isLoading && !project) {
    notFound();
  }

  const employeeTasksForProject = useMemo(() => {
    if (currentEmployeeId === null) return [];
    let items = tasks.filter(
      (t) =>
        t.projectId === projectId &&
        t.assigneeIds.includes(currentEmployeeId)
    );

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [tasks, projectId, currentEmployeeId, sortConfig]);

  const summarizedTasks = useMemo(() => {
    const groups: Record<string, { task: Task; totalHours: number }> = {};
    employeeTasksForProject.forEach((t) => {
      const key = t.name;
      if (!groups[key]) {
        groups[key] = { task: t, totalHours: 0 };
      }
      groups[key].totalHours += t.workedHours;
    });

    const items = Object.values(groups);
    if (sortConfig.key) {
      items.sort((a, b) => {
        let aVal: any, bVal: any;
        if (sortConfig.key === "workedHours") {
          aVal = a.totalHours;
          bVal = b.totalHours;
        } else if (sortConfig.key === "name") {
          aVal = a.task.name;
          bVal = b.task.name;
        } else if (sortConfig.key === "status") {
          aVal = a.task.status;
          bVal = b.task.status;
        } else {
          return 0;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [employeeTasksForProject, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  if (loadingEmployee || isLoading || !project) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-muted">
        Loading project...
      </main>
    );
  }

  if (currentEmployeeId === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-muted">
        No employee selected. Please go back and log in as an employee.
      </main>
    );
  }

  if (employeeTasksForProject.length === 0) {
    notFound();
  }

  const totalWorkedHours = employeeTasksForProject.reduce(
    (sum, task) => sum + task.workedHours,
    0
  );
  const totalTasksCount = employeeTasksForProject.length;

  return (
    <div className="space-y-4">
      {/* Header with icon */}
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <FolderKanban className="h-4 w-4" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="text-sm text-muted">
            Project details and tasks assigned to you.
          </p>
        </div>
      </div>

      {/* Project info */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
            <BadgeInfo className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-muted">Project code</p>
            <p className="mt-1 text-sm text-foreground">
              {project.code}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <UserCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-muted">Client</p>
            <p className="mt-1 text-sm text-foreground">
              {project.clientName}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Clock3 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-muted">Status</p>
            <p className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${project.status === "Active"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/40"
                  : project.status === "On Hold"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/40"
                    : "bg-muted/20 text-foreground border border-muted/40"
                  }`}
              >
                {project.status}
              </span>
            </p>
          </div>
        </div>

        {/* Total tasks summary card */}
        <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
            <ListChecks className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-muted">Total tasks</p>
            <p className="mt-1 text-sm text-foreground">
              {totalTasksCount}
            </p>
          </div>
        </div>

        {/* Total hours summary card */}
        <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <Clock3 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-muted">Total hours</p>
            <p className="mt-1 text-sm text-foreground">
              {totalWorkedHours.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-start">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs">
          <button
            onClick={() => setViewMode("logs")}
            className={`px-4 py-1.5 rounded-md font-medium transition-colors ${viewMode === "logs"
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : "text-muted hover:text-foreground"
              }`}
          >
            Task Logs
          </button>
          <button
            onClick={() => setViewMode("summary")}
            className={`px-4 py-1.5 rounded-md font-medium transition-colors ${viewMode === "summary"
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : "text-muted hover:text-foreground"
              }`}
          >
            Task Summary
          </button>
        </div>
      </div>

      {/* Tasks table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
              <ListChecks className="h-4 w-4" />
            </span>
            <span>Tasks assigned to you</span>
          </div>
        </div> */}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-background/80 text-muted border-b border-border">
              <tr>
                {viewMode === "logs" && (
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Date <SortIcon column="date" />
                    </div>
                  </th>
                )}
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Task <SortIcon column="name" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("workedHours")}
                >
                  <div className="flex items-center gap-1">
                    {viewMode === "logs" ? "Worked Hours" : "Total Hours"}
                    <SortIcon column="workedHours" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    Status <SortIcon column="status" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {viewMode === "logs" ? (
                employeeTasksForProject.map((task) => (
                  <tr key={task.id} className="hover:bg-background/60">
                    <td className="px-4 py-3 text-muted">
                      {formatHumanDate(task.date)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {task.name}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {task.workedHours.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted">{task.status}</td>
                  </tr>
                ))
              ) : (
                summarizedTasks.map(({ task, totalHours }: { task: Task; totalHours: number }) => (
                  <tr key={task.id} className="hover:bg-background/60">
                    <td className="px-4 py-3 text-foreground">
                      {task.name}
                    </td>
                    <td className="px-4 py-3 text-foreground font-semibold text-emerald-500">
                      {totalHours.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted">{task.status}</td>
                  </tr>
                ))
              )}

              {(viewMode === "logs" ? employeeTasksForProject : summarizedTasks).length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    No tasks assigned to you for this project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
