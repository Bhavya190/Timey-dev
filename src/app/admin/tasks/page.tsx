"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Task,
  TaskStatus,
  TaskBillingType,
} from "@/lib/tasks";
import { Project } from "@/lib/projects";
import { User } from "@/lib/users";
import {
  fetchTasksAction,
  fetchProjectsAction,
  fetchUsersAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/actions";
import TaskModal from "@/components/TaskModal";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  FileDown,
} from "lucide-react";

// Helper to get employees by ID from state
const getEmployeesById = (users: User[]) => Object.fromEntries(users.map((u) => [u.id, u]));

function formatHumanDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

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

function StatusBadge({ status }: { status: TaskStatus }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
  if (status === "Completed") {
    return (
      <span
        className={`${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/40`}
      >
        Completed
      </span>
    );
  }
  if (status === "In Progress") {
    return (
      <span
        className={`${base} bg-sky-500/10 text-sky-500 border-sky-500/40`}
      >
        In Progress
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-amber-500/10 text-amber-500 border-amber-500/40`}
    >
      Not Started
    </span>
  );
}

function BillingBadge({ billingType }: { billingType: TaskBillingType }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
  if (billingType === "billable") {
    return (
      <span
        className={`${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/40`}
      >
        Billable
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-muted text-muted-foreground border-border`}
    >
      Non‑billable
    </span>
  );
}

type StatusFilter = "All" | TaskStatus;

export default function AdminTasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchTasksAction(),
      fetchProjectsAction(),
      fetchUsersAction(),
    ]).then(([t, p, u]) => {
      setTasks(t);
      setProjects(p);
      setUsers(u);
      setIsLoading(false);
    });
  }, []);

  const hasProjects = projects.length > 0;
  const employeesById = useMemo(() => getEmployeesById(users), [users]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"logs" | "summary">("summary");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "date", direction: "desc" });

  // --- Weekly date range state (header) ---
  // Initialize to current week [Mon..Sun]
  const { start: initialStart, end: initialEnd } = useMemo(() => getWeekRange(), []);

  const [startISO, setStartISO] = useState<string>(initialStart);
  const [endISO, setEndISO] = useState<string>(initialEnd);

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

  // "Jan 12, 2026"
  const formatDateShortWithYear = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const goPrevWeek = () => {
    const [y, m, d] = startISO.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 7);
    const { start, end } = getWeekRange(prev);
    setStartISO(start);
    setEndISO(end);
  };

  const goNextWeek = () => {
    const [y, m, d] = startISO.split("-").map(Number);
    const next = new Date(y, m - 1, d + 7);
    const { start, end } = getWeekRange(next);
    setStartISO(start);
    setEndISO(end);
  };

  const setWeekFromAnchor = (anchor: Date) => {
    const { start, end } = getWeekRange(anchor);
    setStartISO(start);
    setEndISO(end);
  };

  const filteredTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let items = tasks.filter((task) => {
      const inRange =
        (!startISO || task.date >= startISO) &&
        (!endISO || task.date <= endISO);

      const matchesSearch =
        !term ||
        task.name.toLowerCase().includes(term) ||
        task.projectName.toLowerCase().includes(term) ||
        formatAssignees(task.assigneeIds).toLowerCase().includes(term) ||
        task.billingType.toLowerCase().includes(term) ||
        task.status.toLowerCase().includes(term);

      return inRange && matchesSearch;
    });

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
  }, [tasks, searchTerm, startISO, endISO, sortConfig]);

  const summarizedTasks = useMemo(() => {
    const groups: Record<string, { task: Task; totalHours: number }> = {};
    filteredTasks.forEach((t) => {
      const key = `${t.projectId}-${t.name}`;
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
        } else if (sortConfig.key === "projectName") {
          aVal = a.task.projectName;
          bVal = b.task.projectName;
        } else if (sortConfig.key === "status") {
          aVal = a.task.status;
          bVal = b.task.status;
        } else if (sortConfig.key === "billingType") {
          aVal = a.task.billingType;
          bVal = b.task.billingType;
        } else {
          return 0;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [filteredTasks, sortConfig]);

  const toggleMenu = (id: number) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleAddTaskClick = () => {
    if (!hasProjects) return;
    setSelectedTask(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setModalMode("edit");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleRemove = async (id: number) => {
    try {
      await deleteTaskAction(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task. Please try again.");
    }
  };

  const handleRemoveGroup = async (projectId: number, name: string) => {
    try {
      const tasksToRemove = filteredTasks.filter(
        (t) => t.projectId === projectId && t.name === name
      );
      await Promise.all(tasksToRemove.map((t) => deleteTaskAction(t.id)));
      setTasks((prev) => prev.filter((t) => !tasksToRemove.some((rem) => rem.id === t.id)));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to remove task group:", err);
      alert("Failed to remove task group. Please try again.");
    }
  };

  const handleView = (task: Task) => {
    const project = projects.find((p) => p.id === task.projectId);
    if (project) {
      router.push(`/admin/projects/${project.id}`);
    }
    setOpenMenuId(null);
  };

  const handleSaveTask = async (task: Task) => {
    try {
      if (modalMode === "add") {
        const { id, ...data } = task;
        const created = await createTaskAction(data);
        setTasks((prev) => [...prev, created]);
      } else {
        const { id, ...data } = task;
        if (viewMode === "summary" && selectedTask) {
          // Update the whole group for this week
          const groupToUpdate = tasks.filter(
            (t) => t.projectId === selectedTask.projectId && t.name === selectedTask.name
          );

          const updatedResults = await Promise.all(
            groupToUpdate.map((t) =>
              updateTaskAction(t.id, {
                ...data,
                workedHours: t.workedHours, // Preserve original hours for each log
                date: t.date,     // Preserve original date
              })
            )
          );

          setTasks((prev) => {
            let newTasks = [...prev];
            updatedResults.forEach((updated) => {
              newTasks = newTasks.map((t) => (t.id === updated.id ? updated : t));
            });
            return newTasks;
          });
        } else {
          // Single update (though UI currently restricts logs to read-only)
          const updated = await updateTaskAction(id, data);
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save task:", err);
      alert("Failed to save task. Please try again.");
    }
  };

  const handleExportCSV = () => {
    if (filteredTasks.length === 0) {
      alert("No data to export for current filters.");
      return;
    }

    const exportRows = filteredTasks.map((t) => ({
      Date: t.date,
      Task: t.name,
      Project: t.projectName,
      WorkedHours: t.workedHours.toFixed(2),
      Assignees: formatAssignees(t.assigneeIds),
      Billing: t.billingType,
      Status: t.status,
      Description: t.description || "",
    }));

    const header = Object.keys(exportRows[0]);
    const csv = [
      header,
      ...exportRows.map((row) => header.map((key) => (row as any)[key])),
    ]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasks_${startISO}_to_${endISO}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const nextId =
    tasks.length === 0 ? 1 : Math.max(...tasks.map((t) => t.id)) + 1;

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

  return (
    <div className="space-y-4">
      {/* Header with date range + Add button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted">
            Tasks grouped by project, with worked hours for timesheet and
            billing.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Date range pill (before Add Task) */}
          <div className="flex flex-wrap items-center justify-end">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground">
              <button
                type="button"
                onClick={goPrevWeek}
                className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                title="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                <span>
                  {formatDateShortWithYear(startISO)} –{" "}
                  {formatDateShortWithYear(endISO)}
                </span>
                <div className="relative">
                  <input
                    type="date"
                    value={startISO}
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

              <button
                type="button"
                onClick={goNextWeek}
                className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                title="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add Task button */}
          <button
            onClick={handleAddTaskClick}
            disabled={!hasProjects}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm ${hasProjects
              ? "bg-emerald-500 text-slate-950 shadow-emerald-500/40 hover:bg-emerald-400"
              : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
          >
            {hasProjects ? "+ Add Task" : "Add a project first"}
          </button>
        </div>
      </div>

      {/* Container */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Toolbar (count + search + toggle) */}
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-medium text-foreground">
              {viewMode === "logs" ? filteredTasks.filter(t => t.workedHours > 0).length : summarizedTasks.length}
            </span>
            <span>tasks</span>
            {(searchTerm) && (
              <span className="text-[11px] text-muted">
                (filtered from {tasks.length})
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder="Search tasks, projects, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            />

            <div className="inline-flex rounded-lg border border-border bg-background p-1 text-xs">
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

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-1.5 text-xs font-medium text-foreground hover:bg-card transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-32 min-h-[300px]">
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
                  onClick={() => handleSort("projectName")}
                >
                  <div className="flex items-center gap-1">
                    Project <SortIcon column="projectName" />
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
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("billingType")}
                >
                  <div className="flex items-center gap-1">
                    Billing <SortIcon column="billingType" />
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
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    Loading tasks...
                  </td>
                </tr>
              ) : viewMode === "logs" ? (
                filteredTasks.filter(t => t.workedHours > 0).length > 0 ? (
                  filteredTasks.filter(t => t.workedHours > 0).map((task) => (
                    <tr key={task.id} className="hover:bg-background/60">
                      <td className="px-4 py-3 text-muted">
                        {formatHumanDate(task.date)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {task.name}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {task.projectName}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {task.workedHours.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatAssignees(task.assigneeIds)}
                      </td>
                      <td className="px-4 py-3">
                        <BillingBadge billingType={task.billingType} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-muted italic">
                        read-only
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-muted"
                    >
                      No matching tasks.
                    </td>
                  </tr>
                )
              ) : summarizedTasks.length > 0 ? (
                summarizedTasks.map(({ task, totalHours }) => (
                  <tr key={`${task.projectId}-${task.name}`} className="hover:bg-background/60">
                    <td className="px-4 py-3 text-foreground font-medium">
                      {task.name}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {task.projectName}
                    </td>
                    <td className="px-4 py-3 text-foreground font-semibold text-emerald-500">
                      {totalHours.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatAssignees(task.assigneeIds)}
                    </td>
                    <td className="px-4 py-3">
                      <BillingBadge billingType={task.billingType} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td
                      className="relative px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setOpenMenuId(openMenuId === (`${task.projectId}-${task.name}` as any) ? null : (`${task.projectId}-${task.name}` as any))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-card"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openMenuId === (`${task.projectId}-${task.name}` as any) && (
                        <div className="absolute right-4 top-11 z-10 w-44 rounded-lg border border-border bg-card text-xs shadow-lg text-left overflow-hidden">
                          <button
                            onClick={() => handleView(task)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-background/70"
                          >
                            <Eye className="h-4 w-4 text-muted" />
                            <span>View project</span>
                          </button>
                          <button
                            onClick={() => handleEdit(task)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-background/70"
                          >
                            <Pencil className="h-4 w-4 text-muted" />
                            <span>Edit task</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to remove this task and all its entries for this week?")) {
                                handleRemoveGroup(task.projectId, task.name);
                              }
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Remove task</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    No matching tasks for summary.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Task Modal */}
      <TaskModal
        open={isModalOpen}
        mode={modalMode}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        nextId={nextId}
        task={selectedTask ?? undefined}
      />
    </div>
  );
}
