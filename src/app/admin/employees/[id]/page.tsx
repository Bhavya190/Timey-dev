"use client";

import React, { useEffect, useState, useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import {
  Employee,
  Project,
  Task,
  fetchAdminEmployeesAction,
  fetchProjectsAction,
  fetchTasksAction
} from "@/app/actions";
import {
  UserCircle2,
  Briefcase,
  ListChecks,
  Mail,
  BadgeInfo,
  MapPin,
  Building2,
  ToggleRight,
  Clock4,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const employeeId = Number(id);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<"logs" | "summary">("logs");
  const [sortConfig, setSortConfig] = useState<{
    table: "projects" | "tasks";
    key: string;
    direction: "asc" | "desc"
  }>({ table: "tasks", key: "date", direction: "desc" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAdminEmployeesAction(),
      fetchProjectsAction(),
      fetchTasksAction()
    ]).then(([e, p, t]) => {
      setEmployees(e);
      setProjects(p);
      setTasks(t);
      setIsLoading(false);
    });
  }, []);

  const employee = useMemo(() =>
    employees.find((e) => e.id === employeeId),
    [employees, employeeId]
  );

  const employeeProjects = useMemo(() => {
    let items = projects.filter((p) => Array.isArray(p.teamMemberIds) && p.teamMemberIds.includes(employeeId));
    if (sortConfig.table === "projects" && sortConfig.key) {
      items.sort((a, b) => {
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [projects, employeeId, sortConfig]);

  const employeeTasks = useMemo(() => {
    let items = tasks.filter((t) => Array.isArray(t.assigneeIds) && t.assigneeIds.includes(employeeId));
    if (sortConfig.table === "tasks" && sortConfig.key) {
      items.sort((a, b) => {
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [tasks, employeeId, sortConfig]);

  const summarizedTasks = useMemo(() => {
    const groups: Record<string, { task: Task; totalHours: number }> = {};
    employeeTasks.forEach((t) => {
      const key = `${t.projectId}-${t.name}`;
      if (!groups[key]) {
        groups[key] = { task: t, totalHours: 0 };
      }
      groups[key].totalHours += t.workedHours;
    });

    const items = Object.values(groups);
    if (sortConfig.table === "tasks" && sortConfig.key) {
      items.sort((a, b) => {
        let aVal: any, bVal: any;
        if (sortConfig.key === "workedHours") {
          aVal = a.totalHours;
          bVal = b.totalHours;
        } else if (sortConfig.key === "name") {
          aVal = a.task.name;
          bVal = b.task.name;
        } else if (sortConfig.key === "projectName") {
          aVal = a.task.projectName;
          bVal = b.task.projectName;
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
  }, [employeeTasks, sortConfig]);

  const handleSort = (table: "projects" | "tasks", key: string) => {
    setSortConfig((prev) => ({
      table,
      key,
      direction: prev.table === table && prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ table, column }: { table: "projects" | "tasks", column: string }) => {
    if (sortConfig.table !== table || sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-muted">
        Loading employee details...
      </main>
    );
  }

  if (!employee) return notFound();

  const detailRows: {
    label: string;
    value: string | number | undefined;
    icon?: React.ReactNode;
  }[] = [
      {
        label: "Name",
        value: employee.name,
        icon: <UserCircle2 className="h-4 w-4 text-emerald-500" />,
      },
      {
        label: "Email",
        value: employee.email,
        icon: <Mail className="h-4 w-4 text-emerald-500" />,
      },
      {
        label: "Code",
        value: employee.code,
        icon: <BadgeInfo className="h-4 w-4 text-emerald-500" />,
      },
      {
        label: "Department",
        value: employee.department,
        icon: <Building2 className="h-4 w-4 text-emerald-500" />,
      },
      {
        label: "Location",
        value: employee.location,
        icon: <MapPin className="h-4 w-4 text-emerald-500" />,
      },
      {
        label: "Status",
        value: employee.status,
        icon: <ToggleRight className="h-4 w-4 text-emerald-500" />,
      },
    ];

  return (
    <main className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <UserCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {employee.name}
          </h1>
          <p className="text-sm text-muted">
            Detailed profile, projects and tasks for this employee.
          </p>
        </div>
      </header>

      {/* Employee details */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Employee details
        </h2>
        <dl className="grid gap-3 md:grid-cols-2 text-sm">
          {detailRows.map(
            (row) =>
              row.value !== undefined &&
              row.value !== "" && (
                <div key={row.label} className="flex items-center gap-2">
                  {row.icon}
                  <dt className="text-muted text-xs w-24">{row.label}</dt>
                  <dd className="text-foreground text-sm font-medium">
                    {row.label === "Email" ? (
                      <span className="font-mono text-[11px] sm:text-xs">
                        {row.value}
                      </span>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              )
          )}
        </dl>
      </section>

      {/* Projects assigned */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-emerald-500">
            <Briefcase className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Projects assigned
          </h2>
          <span className="text-[11px] text-muted">
            ({employeeProjects.length})
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {employeeProjects.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">
              No projects assigned to this employee.
            </p>
          ) : (
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="bg-background/80 text-muted border-b border-border">
                <tr>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("projects", "name")}
                  >
                    <div className="flex items-center gap-1">
                      Project <SortIcon table="projects" column="name" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("projects", "clientName")}
                  >
                    <div className="flex items-center gap-1">
                      Client <SortIcon table="projects" column="clientName" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("projects", "status")}
                  >
                    <div className="flex items-center gap-1">
                      Status <SortIcon table="projects" column="status" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {employeeProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-background/60">
                    <td className="px-4 py-3 text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted">
                      {p.clientName}
                    </td>
                    <td className="px-4 py-3 text-muted">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Tasks assigned */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-emerald-500">
            <ListChecks className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Tasks assigned
          </h2>
          <span className="text-[11px] text-muted">
            ({viewMode === "logs" ? employeeTasks.length : summarizedTasks.length})
          </span>
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

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {employeeTasks.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">
              No tasks assigned to this employee.
            </p>
          ) : (
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="bg-background/80 text-muted border-b border-border">
                <tr>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("tasks", "name")}
                  >
                    <div className="flex items-center gap-1">
                      Task <SortIcon table="tasks" column="name" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("tasks", "projectName")}
                  >
                    <div className="flex items-center gap-1">
                      Project <SortIcon table="tasks" column="projectName" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("tasks", "status")}
                  >
                    <div className="flex items-center gap-1">
                      Status <SortIcon table="tasks" column="status" />
                    </div>
                  </th>
                  {viewMode === "logs" && (
                    <th
                      className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort("tasks", "date")}
                    >
                      <div className="flex items-center gap-1">
                        Date <SortIcon table="tasks" column="date" />
                      </div>
                    </th>
                  )}
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("tasks", "workedHours")}
                  >
                    <div className="flex items-center gap-1">
                      {viewMode === "logs" ? "Hours" : "Total Hours"}
                      <SortIcon table="tasks" column="workedHours" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {viewMode === "logs" ? (
                  employeeTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-background/60">
                      <td className="px-4 py-3 text-foreground">{t.name}</td>
                      <td className="px-4 py-3 text-muted">{t.projectName ?? "-"}</td>
                      <td className="px-4 py-3 text-muted">{t.status}</td>
                      <td className="px-4 py-3 text-muted">{t.date}</td>
                      <td className="px-4 py-3 text-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock4 className="h-3.5 w-3.5 text-muted" />
                          {t.workedHours}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  summarizedTasks.map(({ task, totalHours }) => (
                    <tr key={`${task.projectId}-${task.name}`} className="hover:bg-background/60">
                      <td className="px-4 py-3 text-foreground">{task.name}</td>
                      <td className="px-4 py-3 text-muted">{task.projectName ?? "-"}</td>
                      <td className="px-4 py-3 text-muted">{task.status}</td>
                      <td className="px-4 py-3 text-foreground font-semibold text-emerald-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock4 className="h-3.5 w-3.5 text-muted" />
                          {totalHours.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
