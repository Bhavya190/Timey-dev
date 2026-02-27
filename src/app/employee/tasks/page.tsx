"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  type Task,
  fetchTasksAction,
  fetchUsersAction,
  type User as UserType,
  getCurrentUserAction,
} from "@/app/actions";
import type { TaskStatus } from "@/types";
import {
  MoreVertical,
  Eye,
  Pencil,
  X,
  Clock,
  User,
  CheckCircle2,
  CircleDot,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Trash2,
  Save,
} from "lucide-react";
import type { TaskStatus as TaskStatusType } from "@/types";

// Helper to get employees by ID from state
const getEmployeesById = (users: UserType[]) => Object.fromEntries(users.map((u) => [u.id, u]));

function formatHumanDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

type DateRange = {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
};

function toLocalISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Monday–Sunday week
function getWeekRange(base: Date = new Date()): DateRange {
  const day = base.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - diffToMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return {
    start: toLocalISODate(monday),
    end: toLocalISODate(sunday),
  };
}

function addWeeks(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n * 7);
  return d;
}

export default function EmployeeTasksPage({ currentEmployeeId: propId }: { currentEmployeeId?: number }) {
  const router = useRouter();

  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(propId ?? null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  const [users, setUsers] = useState<UserType[]>([]);
  const [dbTasks, setDbTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchUsersAction(),
      fetchTasksAction(),
    ]).then(([u, t]) => {
      setUsers(u);
      setDbTasks(t);
      setIsLoading(false);
    });
  }, []);

  const employeesById = useMemo(() => getEmployeesById(users), [users]);

  // date range for "this week" control
  const [dateRange, setDateRange] = useState<DateRange>(() => getWeekRange());

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

  // All tasks for this employee (unfiltered by week)
  const employeeInitialTasks = useMemo(
    () =>
      currentEmployeeId == null
        ? []
        : dbTasks.filter((t) => t.assigneeIds.includes(currentEmployeeId)),
    [currentEmployeeId, dbTasks]
  );

  // Filter by selected week range
  const filteredTasksByWeek = useMemo(() => {
    const { start, end } = dateRange;
    return employeeInitialTasks.filter(
      (t) => t.date >= start && t.date <= end
    );
  }, [employeeInitialTasks, dateRange]);

  const [viewMode, setViewMode] = useState<"logs" | "summary">("summary");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "date", direction: "desc" });
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editedHours, setEditedHours] = useState<string>("0");
  const [editedDescription, setEditedDescription] = useState<string>("");

  const [editingGroup, setEditingGroup] = useState<{ projectId: number; name: string } | null>(null);
  const [editedName, setEditedName] = useState<string>("");
  const [editedStatus, setEditedStatus] = useState<TaskStatus>("Not Started");

  // keep tasks in sync with filters and SORT them
  const sortedTasks = useMemo(() => {
    const items = [...filteredTasksByWeek];
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
  }, [filteredTasksByWeek, sortConfig]);

  const tasks = sortedTasks;

  const totalHours = useMemo(
    () => filteredTasksByWeek.reduce((sum, t) => sum + t.workedHours, 0),
    [filteredTasksByWeek]
  );
  const totalTasks = useMemo(
    () => filteredTasksByWeek.filter(t => t.workedHours > 0).length,
    [filteredTasksByWeek]
  );

  const summarizedTasks = useMemo(() => {
    const groups: Record<string, { task: Task; totalHours: number }> = {};
    filteredTasksByWeek.forEach((t) => {
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
        } else {
          return 0;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [tasks, sortConfig]);

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

  // Week shifted by +/- 1 week
  const shiftWeek = (direction: "prev" | "next") => {
    const [y, m, d] = dateRange.start.split("-").map(Number);
    const startObj = new Date(y, m - 1, d + (direction === "prev" ? -7 : 7));
    setDateRange(getWeekRange(startObj));
  };

  const handlePrevWeek = () => shiftWeek("prev");
  const handleNextWeek = () => shiftWeek("next");

  const toggleMenu = (id: number) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleViewProject = (task: Task) => {
    router.push(`/employee/projects/${task.projectId}`);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditedHours(String(task.workedHours));
    setEditedDescription(task.description ?? "");
    setIsEditOpen(true);
    setOpenMenuId(null);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingTask(null);
    setEditedHours("0");
    setEditedDescription("");
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    const hours = Number(editedHours) || 0;
    const desc = editedDescription.trim() || undefined;

    try {
      const { updateTaskAction } = await import("@/app/actions");
      const updated = await updateTaskAction(editingTask.id, {
        workedHours: hours,
        description: desc,
      });

      setDbTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      handleCloseEdit();
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("Failed to update task. Please try again.");
    }
  };

  const formatAssignees = (assigneeIds: number[]) => {
    if (currentEmployeeId == null || !assigneeIds.includes(currentEmployeeId))
      return "-";
    const emp = employeesById[currentEmployeeId];
    return emp ? emp.name : "-";
  };

  const handleRemoveGroup = async (projectId: number, name: string) => {
    try {
      const { deleteTaskAction } = await import("@/app/actions");
      const { start, end } = dateRange;
      const tasksToRemove = employeeInitialTasks.filter(
        (t) => t.projectId === projectId && t.name === name && t.date >= start && t.date <= end
      );

      await Promise.all(tasksToRemove.map((t) => deleteTaskAction(t.id)));
      setDbTasks((prev) => prev.filter((t) => !tasksToRemove.some((rem) => rem.id === t.id)));
    } catch (err) {
      console.error("Failed to remove task group:", err);
      alert("Failed to remove task group. Please try again.");
    }
  };

  const handleSaveGroupEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    try {
      const { updateTaskAction } = await import("@/app/actions");
      const { start, end } = dateRange;
      const tasksToUpdate = employeeInitialTasks.filter(
        (t) => t.projectId === editingGroup.projectId && t.name === editingGroup.name && t.date >= start && t.date <= end
      );

      const updatedResults = await Promise.all(
        tasksToUpdate.map((t) =>
          updateTaskAction(t.id, {
            name: editedName,
            status: editedStatus,
          })
        )
      );

      setDbTasks((prev) => {
        let newDb = [...prev];
        updatedResults.forEach((updated) => {
          newDb = newDb.map((t) => (t.id === updated.id ? updated : t));
        });
        return newDb;
      });
      setEditingGroup(null);
    } catch (err) {
      console.error("Failed to update task group:", err);
      alert("Failed to update task group. Please try again.");
    }
  };

  const renderStatus = (status: Task["status"]) => {
    if (status === "Completed") {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
          {status}
        </span>
      );
    }
    if (status === "In Progress") {
      return (
        <span className="inline-flex items-center gap-1 text-sky-500">
          <CircleDot className="h-4 w-4" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-muted">
        <CircleDot className="h-4 w-4" />
        {status}
      </span>
    );
  };

  if (loadingEmployee || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-muted">
        Loading tasks...
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            My Tasks
          </h1>
          <p className="text-sm text-muted flex items-center gap-1">
            <User className="h-4 w-4 text-muted" />
            Tasks assigned to you, from all projects.
          </p>
        </div>

        {/* This week card with prev/next + calendar */}
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-background"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>

          <div className="flex items-center gap-2">

            <span>
              {formatHumanDate(dateRange.start)} &ndash;{" "}
              {formatHumanDate(dateRange.end)}
            </span>
          </div>

          <div
            className="relative h-6 w-6 cursor-pointer"
            onClick={() => {
              const input = document.getElementById('tasks-date-picker') as HTMLInputElement;
              if (input) {
                if (typeof input.showPicker === 'function') {
                  input.showPicker();
                } else {
                  input.click();
                }
              }
            }}
          >
            <input
              id="tasks-date-picker"
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                if (!e.target.value) return;
                const [y, m, d] = e.target.value.split("-").map(Number);
                const selectedDate = new Date(y, m - 1, d);
                setDateRange(getWeekRange(selectedDate));
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              aria-label="Select week date"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-md border border-border bg-background hover:bg-card pointer-events-none z-10">
              <Calendar className="h-3.5 w-3.5 text-muted" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextWeek}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-background"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Total hours (week)</p>
            <p className="text-lg font-semibold text-foreground">
              {totalHours.toFixed(2)}
            </p>
          </div>
          <Clock className="h-5 w-5 text-emerald-500" />
        </div>

        <div className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Total tasks (week)</p>
            <p className="text-lg font-semibold text-foreground">
              {totalTasks}
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-sky-500" />
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

      {/* Table wrapper */}

      {/* Table wrapper */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
                <th className="px-4 py-3 font-medium text-muted">Assigned To</th>
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
              {viewMode === "logs" ? (
                tasks.filter(t => t.workedHours > 0).map((task) => (
                  <tr key={task.id} className="hover:bg-background/60">
                    <td className="px-4 py-3 text-foreground">
                      {formatHumanDate(task.date)}
                    </td>
                    <td className="px-4 py-3 text-foreground">{task.name}</td>
                    <td className="px-4 py-3 text-muted">{task.projectName}</td>
                    <td className="px-4 py-3 text-foreground">
                      {task.workedHours.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatAssignees(task.assigneeIds)}
                    </td>
                    <td className="px-4 py-3">{renderStatus(task.status)}</td>
                    <td className="px-4 py-3 text-right text-muted italic">
                      read-only
                    </td>
                  </tr>
                ))
              ) : (
                summarizedTasks.map(({ task, totalHours }) => {
                  const groupKey = `${task.projectId}-${task.name}`;
                  return (
                    <tr key={groupKey} className="hover:bg-background/60">
                      <td className="px-4 py-3 text-foreground">{task.name}</td>
                      <td className="px-4 py-3 text-muted">{task.projectName}</td>
                      <td className="px-4 py-3 text-foreground font-semibold text-emerald-500">
                        {totalHours.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatAssignees(task.assigneeIds)}
                      </td>
                      <td className="px-4 py-3">{renderStatus(task.status)}</td>
                      <td
                        className="relative px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setOpenMenuId(openMenuId === (groupKey as any) ? null : (groupKey as any))}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-card"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuId === (groupKey as any) && (
                          <div className="absolute right-4 top-11 z-10 w-44 rounded-lg border border-border bg-card text-xs shadow-lg">
                            <button
                              onClick={() => {
                                handleViewProject(task);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-background/70"
                            >
                              <Eye className="h-4 w-4 text-muted" />
                              <span>View project</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingGroup({ projectId: task.projectId, name: task.name });
                                setEditedName(task.name);
                                setEditedStatus(task.status as TaskStatus);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-background/70"
                            >
                              <Pencil className="h-4 w-4 text-muted" />
                              <span>Edit task</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to remove this task and all its log entries for this week?")) {
                                  handleRemoveGroup(task.projectId, task.name);
                                }
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-red-500/10 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Remove task</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}

              {(viewMode === "logs" ? tasks : summarizedTasks).length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    No tasks in this week range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {isEditOpen && editingTask && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-card text-foreground shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Pencil className="h-4 w-4 text-emerald-500" />
                Edit worked hours
              </h2>
              <button
                onClick={handleCloseEdit}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-border text-muted hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              className="px-5 py-4 space-y-4 text-sm"
            >
              <div>
                <p className="text-xs text-muted mb-1">Task</p>
                <p className="text-foreground">{editingTask.name}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted" />
                  Worked hours
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={editedHours}
                  onChange={(e) => setEditedHours(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Description of work
                </label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 resize-y"
                  placeholder="Briefly describe what you did in this time."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Group modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-card text-foreground shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Pencil className="h-4 w-4 text-emerald-500" />
                Edit Task
              </h2>
              <button
                onClick={() => setEditingGroup(null)}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-border text-muted hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <form
              onSubmit={handleSaveGroupEdit}
              className="px-5 py-4 space-y-4 text-sm"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted uppercase tracking-wider">Task Name</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted uppercase tracking-wider">Status</label>
                <select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2 rounded-lg border border-border text-muted hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
