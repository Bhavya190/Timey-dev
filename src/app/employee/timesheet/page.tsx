"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import {
  fetchUsersAction,
  fetchProjectsAction,
  fetchTasksAction,
  updateTaskAction,
  createTaskAction,
  fetchEmployeeTimesheetsAction,
  upsertTimesheetAction,
  getCurrentUserAction,
} from "@/app/actions";
import type { User, Project, Task, Timesheet } from "@/types";
import {
  CalendarRange,
  Clock4,
  FileText,
  Timer,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Save,
  ClipboardClock,
  FileInput,
} from "lucide-react";


// Helpers to get by ID from state
const getEmployeesById = (users: User[]) => Object.fromEntries(users.map((u) => [u.id, u]));
const getProjectsById = (projects: Project[]) => Object.fromEntries(projects.map((p) => [p.id, p]));

function toLocalISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekRangeFromAnchor(anchor: Date): {
  days: string[];
  startISO: string;
  endISO: string;
} {
  const day = anchor.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - diffToMonday);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    days.push(toLocalISODate(d));
  }
  return { days, startISO: days[0], endISO: days[6] };
}

function formatDateShortWithYear(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatDateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.toLocaleDateString(undefined, { day: "2-digit" });
  const mon = date.toLocaleDateString(undefined, { month: "short" });
  return `${day} ${mon}`;
}

function formatDayName(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date
    .toLocaleDateString(undefined, {
      weekday: "short",
    })
    .toUpperCase();
}

type EditTarget = {
  taskId: number;
  date: string;
} | null;

type RowDraft = {
  projectId: number | null;
  taskId: number | null;
  rowId: number | null;
};

type PlaceholderState = Record<string, number[]>;

export default function EmployeeTimesheetPage({ currentEmployeeId: propId }: { currentEmployeeId?: number }) {
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(propId ?? null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [dbTasks, setDbTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchUsersAction(),
      fetchProjectsAction(),
      fetchTasksAction(),
    ]).then(([u, p, t]) => {
      setUsers(u);
      setDbProjects(p);
      setDbTasks(t);
      setIsLoading(false);
    });
  }, []);

  const [dbTimesheets, setDbTimesheets] = useState<Timesheet[]>([]);
  useEffect(() => {
    if (currentEmployeeId == null) return;
    fetchEmployeeTimesheetsAction(currentEmployeeId).then(setDbTimesheets);
  }, [currentEmployeeId]);

  const employeesById = useMemo(() => getEmployeesById(users), [users]);
  const projectsById = useMemo(() => getProjectsById(dbProjects), [dbProjects]);

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

  const [currentAnchor, setCurrentAnchor] = useState<Date>(new Date());

  const { days, startISO, endISO } = useMemo(
    () => getWeekRangeFromAnchor(currentAnchor),
    [currentAnchor]
  );
  const weekKey = startISO;
  const todayISO = toLocalISODate(new Date());

  const isSubmitted = useMemo(() => {
    return dbTimesheets.find(ts => ts.weekStart === weekKey)?.status === "Submitted";
  }, [dbTimesheets, weekKey]);

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (currentEmployeeId == null || isLoading) return;
    setTasks(
      dbTasks.filter((t) => t.assigneeIds.includes(currentEmployeeId))
    );
  }, [currentEmployeeId, dbTasks, isLoading]);

  const rangeStart = startISO;
  const rangeEnd = endISO;

  const rangeTasks: Task[] = useMemo(
    () => tasks.filter((t) => t.date >= rangeStart && t.date <= rangeEnd),
    [tasks, rangeStart, rangeEnd]
  );

  const weekTasks = useMemo(
    () => rangeTasks.filter((t) => t.date >= startISO && t.date <= endISO),
    [rangeTasks, startISO, endISO]
  );

  // Revised grouping function for rows
  const getTaskGroupKey = (t: Task) => `${t.projectId}::${t.name}::${[...(t.assigneeIds || [])].sort().join(",")}`;

  const displayTasks = useMemo(() => {
    const groups: Record<string, Task> = {};
    weekTasks.forEach((t) => {
      const gKey = getTaskGroupKey(t);
      if (!groups[gKey]) {
        groups[gKey] = t;
      }
    });
    return groups;
  }, [weekTasks]);

  const hoursByTaskDay: Record<string, Record<string, number>> = {};
  for (const t of weekTasks) {
    const gKey = getTaskGroupKey(t);
    if (!hoursByTaskDay[gKey]) hoursByTaskDay[gKey] = {};
    hoursByTaskDay[gKey][t.date] =
      (hoursByTaskDay[gKey][t.date] ?? 0) + t.workedHours;
  }

  const totalWorkedToday = rangeTasks
    .filter((t) => t.date === todayISO)
    .reduce((sum, t) => sum + t.workedHours, 0);

  const totalWorkedRange = rangeTasks.reduce(
    (sum, t) => sum + t.workedHours,
    0
  );

  const tasksByGroup = Object.entries(displayTasks);

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editedHours, setEditedHours] = useState<string>("0");
  const [editedDescription, setEditedDescription] = useState<string>("");

  const openEditFor = (task: Task, date: string) => {
    if (isSubmitted) return;
    const gKey = getTaskGroupKey(task);
    setEditTarget({ taskId: task.id, date });
    const cellHours = hoursByTaskDay[gKey]?.[date] ?? 0;
    setEditedHours(cellHours.toString());
    const existing = weekTasks.find(
      (t) => getTaskGroupKey(t) === gKey && t.date === date
    );
    setEditedDescription(existing?.description ?? "");
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditedHours("0");
    setEditedDescription("");
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTarget || isSubmitted) return;
    const { taskId, date } = editTarget;
    const newHours = Number(editedHours) || 0;
    const desc = editedDescription.trim() || undefined;

    try {
      const representative = tasks.find(t => t.id === taskId);
      if (!representative) {
        closeEdit();
        return;
      }
      const gKey = getTaskGroupKey(representative);
      const matching = tasks.filter(
        (t) => getTaskGroupKey(t) === gKey && t.date === date
      );
      if (matching.length === 0) {
        if (newHours === 0) {
          // No task exists and new hours are 0, nothing to create
          closeEdit();
          return;
        }
        const { id, ...data } = representative;
        const created: Task = await createTaskAction({
          ...data,
          date,
          workedHours: newHours,
          description: desc,
        });
        setTasks((prev) => [...prev, created]);
        closeEdit();
        return;
      }

      // Update existing
      if (newHours === 0) {
        const { deleteTaskAction } = await import("@/app/actions");
        await deleteTaskAction(matching[0].id);
        setTasks((prev) => prev.filter((t) => t.id !== matching[0].id));
      } else {
        const updated = await updateTaskAction(matching[0].id, {
          workedHours: newHours,
          description: desc,
        });
        setTasks((prev) => prev.map((t) => (t.id === updated.id && t.date === updated.date ? updated : t)));
      }
      closeEdit();
    } catch (err) {
      console.error("Failed to save timesheet edit:", err);
      alert("Failed to save changes. Please try again.");
    }
  };

  const [placeholderRowsByWeek, setPlaceholderRowsByWeek] =
    useState<PlaceholderState>({});

  const currentPlaceholderRowIds = placeholderRowsByWeek[weekKey] ?? [1, 2, 3];

  const [rowDraft, setRowDraft] = useState<RowDraft>({
    projectId: null,
    taskId: null,
    rowId: null,
  });
  const [showRowEditor, setShowRowEditor] = useState(false);

  const setWeekPlaceholders = (
    week: string,
    updater: (prev: number[]) => number[]
  ) => {
    setPlaceholderRowsByWeek((prev) => {
      const prevRows = prev[week] ?? [1, 2, 3];
      return {
        ...prev,
        [week]: updater(prevRows),
      };
    });
  };

  const removePlaceholderRow = (id: number) => {
    setWeekPlaceholders(weekKey, (prev) => prev.filter((r) => r !== id));
  };

  const openRowEditor = (rowId: number | null) => {
    if (isSubmitted) return;
    if (rowId === null) {
      const newId = Date.now();
      setWeekPlaceholders(weekKey, (prev) => [...prev, newId]);
      setRowDraft({ projectId: null, taskId: null, rowId: newId });
    } else {
      setRowDraft({ projectId: null, taskId: null, rowId });
    }
    setShowRowEditor(true);
  };


  const handleSaveRowDraft = async () => {
    if (!rowDraft.projectId || !rowDraft.taskId || currentEmployeeId == null)
      return;

    try {
      const project = projectsById[rowDraft.projectId];
      const sourceTask = dbTasks.find((t) => t.id === rowDraft.taskId);

      const key = `${project.id}::${sourceTask?.name ?? "New task"}::${currentEmployeeId}`;
      if (weekTasks.some(t => getTaskGroupKey(t) === key)) {
        setShowRowEditor(false);
        return;
      }

      // Create ONE entry for the first day of the week to "hold" the row
      const created: Task = await createTaskAction({
        name: sourceTask?.name ?? "New task",
        projectId: project.id,
        projectName: project.name,
        assigneeIds: [currentEmployeeId],
        status: "Completed",
        billingType: "billable",
        date: days[0],
        workedHours: 0,
        description: "",
      });

      setTasks((prev) => [...prev, created]);
      setShowRowEditor(false);

      if (rowDraft.rowId !== null) {
        setWeekPlaceholders(weekKey, (prev) =>
          prev.filter((id) => id !== rowDraft.rowId)
        );
      }
    } catch (err) {
      console.error("Failed to add row:", err);
      alert("Failed to add row. Please try again.");
    }
  };

  const hasAnyTasksThisWeek = tasksByGroup.length > 0;
  const hasAnyTasksInRange = rangeTasks.length > 0;
  const hasPlaceholdersThisWeek = currentPlaceholderRowIds.length > 0;

  const goPrevWeek = () => {
    const d = new Date(currentAnchor);
    d.setDate(d.getDate() - 7);
    setCurrentAnchor(d);
  };

  const goNextWeek = () => {
    const d = new Date(currentAnchor);
    d.setDate(d.getDate() + 7);
    setCurrentAnchor(d);
  };

  const handleSubmitWeek = async () => {
    if (isSubmitted || currentEmployeeId == null) return;
    try {
      const updated = await upsertTimesheetAction({
        employeeId: currentEmployeeId,
        weekStart: weekKey,
        status: "Submitted"
      });
      setDbTimesheets(prev => {
        const other = prev.filter(ts => ts.id !== updated.id);
        return [...other, updated];
      });
    } catch (err) {
      console.error("Failed to submit week:", err);
      alert("Failed to submit week. Please try again.");
    }
  };

  const employee =
    currentEmployeeId != null ? employeesById[currentEmployeeId] : undefined;

  if (loadingEmployee || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-muted">
        Loading timesheet...
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
    <main className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
            <ClipboardClock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My Timesheet
            </h1>
            <p className="text-sm text-muted">
              Weekly hours for {employee?.name ?? "this employee"}.
            </p>
          </div>
        </div>

        {/* Week nav */}
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
            <div
              className="relative h-7 w-7 cursor-pointer"
              onClick={() => {
                const input = document.getElementById('timesheet-date-picker') as HTMLInputElement;
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
                id="timesheet-date-picker"
                type="date"
                value={startISO}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const selectedDate = new Date(e.target.value);
                  setCurrentAnchor(selectedDate);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                aria-label="Select week date"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-md border border-border bg-background text-muted hover:bg-card pointer-events-none z-10">
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

      {/* Summary cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <Timer className="h-4 w-4" />
          </span>
          <div>
            <p className="text-muted mb-1">Total Week Hours</p>
            <p className="text-xl font-semibold">
              {totalWorkedRange.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
            <CalendarRange className="h-4 w-4" />
          </span>
          <div>
            <p className="text-muted mb-1">Week Range</p>
            <p className="text-sm">
              {formatDateShortWithYear(startISO)} –{" "}
              {formatDateShortWithYear(endISO)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <ClipboardClock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-muted mb-1">Status</p>
            <p className="text-xl font-semibold">
              {isSubmitted ? "Submitted" : "Not Submitted"}
            </p>
          </div>
        </div>
      </section>

      {/* Weekly grid with header toolbar (Add row + Submit week) */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-2 bg-background/60 flex justify-between items-center">
          <span className="text-xs text-muted">
            Manage your timesheet rows for this week.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openRowEditor(null)}
              disabled={isSubmitted}
              className={`inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs ${isSubmitted
                ? "text-muted opacity-60 cursor-not-allowed"
                : "text-muted hover:bg-card"
                }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitWeek}
              disabled={isSubmitted}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm ${isSubmitted
                ? "bg-emerald-500/10 text-emerald-500 cursor-default"
                : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                }`}
            >
              <FileInput className="h-3.5 w-3.5" />
              {isSubmitted ? "Week Submitted" : "Submit week"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-background/80 text-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium w-64">Project – Task</th>
                {days.map((iso) => (
                  <th
                    key={iso}
                    className="px-3 py-3 font-medium text-center"
                  >
                    <div>{formatDayName(iso)}</div>
                    <div className="text-[11px] text-muted">
                      {formatDateLabel(iso)}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 font-medium text-right w-20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {tasksByGroup.map(([gKey, task]) => (
                <tr key={gKey}>
                  <td className="px-4 py-3">
                    <p className="text-foreground font-medium">{task.name}</p>
                    <p className="text-[11px] text-muted inline-flex items-center gap-1 flex-wrap">
                      <span>
                        {projectsById[task.projectId]?.name ??
                          task.projectName}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{task.status}</span>
                    </p>
                  </td>
                  {days.map((iso) => {
                    const hours = hoursByTaskDay[gKey]?.[iso] ?? 0;
                    return (
                      <td
                        key={iso}
                        className={`px-3 py-3 text-center text-foreground ${isSubmitted
                          ? "cursor-default"
                          : "cursor-pointer hover:bg-background/70"
                          }`}
                        onClick={() => !isSubmitted && openEditFor(task, iso)}
                      >
                        {hours.toFixed(2)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right text-foreground font-medium">
                    {Object.values(hoursByTaskDay[gKey] || {})
                      .reduce((sum, h) => sum + h, 0)
                      .toFixed(2)}
                  </td>
                </tr>
              ))}

              {!hasAnyTasksThisWeek &&
                hasPlaceholdersThisWeek &&
                currentPlaceholderRowIds.map((rowId) => (
                  <tr key={rowId} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openRowEditor(rowId)}
                          disabled={isSubmitted}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-muted ${isSubmitted
                            ? "opacity-60 cursor-not-allowed border-border"
                            : "border-border hover:bg-background"
                            }`}
                          title="Edit row"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            !isSubmitted && removePlaceholderRow(rowId)
                          }
                          disabled={isSubmitted}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-muted ${isSubmitted
                            ? "opacity-60 cursor-not-allowed border-border"
                            : "border-border hover:bg-background"
                            }`}
                          title="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs text-muted">
                          &lt; No project selected &gt;
                        </span>
                      </div>
                    </td>
                    {days.map((iso) => (
                      <td key={iso} className="px-3 py-3">
                        <div className="h-8 w-full rounded-lg border border-border bg-background" />
                      </td>
                    ))}
                    <td className="px-4 py-3" />
                  </tr>
                ))}

              {!hasAnyTasksInRange && !hasPlaceholdersThisWeek && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-xs text-muted"
                    colSpan={days.length + 2}
                  >
                    no tasks found
                  </td>
                </tr>
              )}
            </tbody>

            {tasksByGroup.length > 0 && (
              <tfoot className="bg-background/80 border-t border-border text-xs text-muted">
                <tr>
                  <td className="px-4 py-3 font-medium">TOTAL HOURS</td>
                  {days.map((iso) => {
                    const dayTotal = tasksByGroup.reduce((sum, [gKey, task]) => {
                      const h = hoursByTaskDay[gKey]?.[iso] ?? 0;
                      return sum + h;
                    }, 0);
                    return (
                      <td key={iso} className="px-3 py-3 text-center">
                        {dayTotal.toFixed(2)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {Object.values(hoursByTaskDay)
                      .reduce((sumTask, dayMap) => {
                        const taskTotal = Object.values(dayMap).reduce(
                          (s, h) => s + h,
                          0
                        );
                        return sumTask + taskTotal;
                      }, 0)
                      .toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Edit hours modal */}
      {editTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-card text-foreground shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Clock4 className="h-4 w-4 text-primary-500" />
                Edit hours
              </h2>
              <button
                onClick={closeEdit}
                className="h-7 w-7 rounded-full border border-border text-muted hover:bg-background"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              className="px-5 py-4 space-y-4 text-sm"
            >
              <div>
                <p className="text-xs text-muted mb-1">Date</p>
                <p className="text-foreground">
                  {formatDateShortWithYear(editTarget.date)}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Worked hours
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={editedHours}
                  onChange={(e) => setEditedHours(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40"
                  required
                  disabled={isSubmitted}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-primary-500" />
                  Description of work
                </label>
                <textarea
                  value={editedDescription}
                  onChange={(e) =>
                    setEditedDescription(e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 resize-y"
                  placeholder="Briefly describe what was done in this time."
                  disabled={isSubmitted}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-card"
                >
                  Cancel
                </button>
                {!isSubmitted && (
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-1.5 text-xs text-foreground hover:bg-card"
                  >
                    <Clock4 className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Timesheet (row editor) */}
      {showRowEditor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-card text-foreground shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Select Projects And Tasks</h2>
              <button
                type="button"
                onClick={() => setShowRowEditor(false)}
                className="h-7 w-7 rounded-full border border-border text-muted hover:bg-background"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveRowDraft();
              }}
            >
              <div className="px-5 py-4 space-y-4 text-sm">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Project Name
                  </label>
                  <select
                    value={rowDraft.projectId ?? ""}
                    onChange={(e) =>
                      setRowDraft((prev) => ({
                        ...prev,
                        projectId: e.target.value
                          ? Number(e.target.value)
                          : null,
                        taskId: null,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40"
                    required
                  >
                    <option value="">Select Project</option>
                    {dbProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Task Name
                  </label>
                  <select
                    value={rowDraft.taskId ?? ""}
                    onChange={(e) =>
                      setRowDraft((prev) => ({
                        ...prev,
                        taskId: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    disabled={rowDraft.projectId === null}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none disabled:opacity-60 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40"
                    required
                  >
                    <option value="">Select Task</option>
                    {rowDraft.projectId !== null &&
                      dbTasks
                        .filter(
                          (t) => t.projectId === rowDraft.projectId
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border bg-background/60 px-5 py-3">
                <button
                  type="submit"
                  disabled={isSubmitted}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-1.5 text-xs text-foreground hover:bg-card disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRowEditor(false)}
                  className="rounded-lg border border-border bg-background px-4 py-1.5 text-xs text-foreground hover:bg-card"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
