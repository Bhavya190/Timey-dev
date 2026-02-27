"use client";

import React, { useEffect, useState, useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import {
  Project,
  Task,
  User,
  fetchProjectsAction,
  fetchTasksAction,
  fetchUsersAction
} from "@/app/actions";
import {
  FolderKanban,
  Hash,
  Briefcase,
  BadgeCheck,
  CalendarDays,
  FileText,
  Clock4,
  Users,
  Banknote,
  Timer,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const projectId = Number(id);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<"logs" | "summary">("summary");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "name", direction: "asc" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchProjectsAction(),
      fetchTasksAction(),
      fetchUsersAction()
    ]).then(([p, t, u]) => {
      setProjects(p);
      setTasks(t);
      setUsers(u);
      setIsLoading(false);
    });
  }, []);

  const employeesById = useMemo(() =>
    Object.fromEntries(users.map((u) => [u.id, u])),
    [users]
  );

  const project = useMemo(() =>
    projects.find((p) => p.id === projectId),
    [projects, projectId]
  );

  const projectTasks = useMemo(() => {
    let items = tasks.filter((t) => t.projectId === projectId);
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
  }, [tasks, projectId, sortConfig]);

  const summarizedTasks = useMemo(() => {
    const groups: Record<string, { task: Task; totalHours: number }> = {};
    projectTasks.forEach((t) => {
      const key = `${t.projectId}-${t.name}`; // In project context, just name is enough but project-name is safer
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
  }, [projectTasks, sortConfig]);

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

  const totalHours = useMemo(() =>
    projectTasks.reduce((sum, t) => sum + t.workedHours, 0),
    [projectTasks]
  );

  const teamSize = useMemo(() =>
    (project && Array.isArray(project.teamMemberIds)) ? project.teamMemberIds.length : 0,
    [project]
  );

  const formatAssignees = (assigneeIds: number[]) => {
    if (assigneeIds.length === 0) return "-";
    const names = assigneeIds
      .map((id) => employeesById[id]?.name)
      .filter(Boolean) as string[];
    if (names.length === 0) return "-";
    if (names.length === 1) return names[0];
    if (names.length === 2) return names.join(", ");
    return `${names[0]}, ${names[1]} +${names.length - 2} more`;
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-muted">
        Loading project details...
      </main>
    );
  }

  if (!project) return notFound();

  const DetailRow = ({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) => (
    <div className="flex items-center gap-2">
      {icon}
      <dt className="text-muted text-xs w-24 shrink-0">{label}</dt>
      <dd className="text-foreground text-sm font-medium">
        {value}
      </dd>
    </div>
  );

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Project: {project.name}
            </h1>
            <p className="text-sm text-muted">
              Key project details plus tasks, assignees, and worked hours.
            </p>
          </div>
        </div>

        {/* Project details */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Project details
          </h2>
          <dl className="grid gap-3 md:grid-cols-2 text-sm">
            <DetailRow
              label="Code"
              value={project.code}
              icon={<Hash className="h-4 w-4 text-emerald-500" />}
            />
            <DetailRow
              label="Client"
              value={project.clientName}
              icon={<Briefcase className="h-4 w-4 text-emerald-500" />}
            />
            <DetailRow
              label="Status"
              value={project.status}
              icon={<BadgeCheck className="h-4 w-4 text-emerald-500" />}
            />
            <DetailRow
              label="Start Date"
              value={project.startDate || "-"}
              icon={<CalendarDays className="h-4 w-4 text-emerald-500" />}
            />
            <DetailRow
              label="End Date"
              value={project.endDate || "-"}
              icon={<CalendarDays className="h-4 w-4 text-emerald-500" />}
            />
            <DetailRow
              label="Billing"
              value={
                project.billingType
                  ? project.billingType === "hourly"
                    ? `Hourly • ${project.defaultBillingRate ?? "-"} /hr`
                    : `Fixed • ${project.fixedCost ?? "-"}`
                  : "-"
              }
              icon={<Banknote className="h-4 w-4 text-emerald-500" />}
            />
            {(project.estimatedCost || project.duration) && (
              <DetailRow
                label="Estimate"
                value={`${project.estimatedCost ? `Cost ${project.estimatedCost}` : ""}${project.estimatedCost && project.duration ? " • " : ""}${project.duration ? `Duration ${project.duration}` : ""}`}
                icon={<Timer className="h-4 w-4 text-emerald-500" />}
              />
            )}
            <DetailRow
              label="Team size"
              value={teamSize > 0 ? `${teamSize} member${teamSize > 1 ? "s" : ""}` : "Not set"}
              icon={<Users className="h-4 w-4 text-emerald-500" />}
            />
          </dl>

          {project.description && (
            <div className="mt-3 pt-3 border-t border-border flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-medium text-foreground text-xs block mb-1 text-muted">Description</span>
                <p className="text-foreground font-medium leading-relaxed">{project.description}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tasks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Tasks for this project
          </h2>
          <p className="text-xs text-muted flex items-center gap-2">
            <span>{viewMode === "logs" ? projectTasks.length : summarizedTasks.length} tasks</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="inline-flex items-center gap-1">
              <Clock4 className="h-3.5 w-3.5 text-muted" />
              Total worked hours:
              <span className="font-semibold text-foreground">
                {totalHours.toFixed(2)}
              </span>
            </span>
          </p>
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
          {projectTasks.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">
              No tasks have been added for this project yet.
            </p>
          ) : (
            <div className="overflow-x-auto pb-[150px] min-h-[300px]">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead className="bg-background/80 text-muted border-b border-border">
                  <tr>
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
                      <span className="inline-flex items-center gap-1">
                        <Clock4 className="h-3.5 w-3.5" />
                        {viewMode === "logs" ? "Worked Hours" : "Total Hours"}
                        <SortIcon column="workedHours" />
                      </span>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        Assigned To
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {viewMode === "logs" ? (
                    projectTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-background/60">
                        <td className="px-4 py-3 text-foreground">
                          {task.name}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {task.workedHours.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {formatAssignees(task.assigneeIds)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    summarizedTasks.map(({ task, totalHours }) => (
                      <tr key={`${task.projectId}-${task.name}`} className="hover:bg-background/60">
                        <td className="px-4 py-3 text-foreground">
                          {task.name}
                        </td>
                        <td className="px-4 py-3 text-foreground font-semibold text-emerald-500">
                          {totalHours.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {formatAssignees(task.assigneeIds)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
