"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { fetchTasksAction, fetchProjectsAction, fetchUsersAction, updateTaskAction, createTaskAction } from "@/app/actions";
import type { Task, Project, User } from "@/types";
import {
  CalendarRange,
  Clock4,
  FileSpreadsheet,
  FileDown,
  FileText,
  Timer,
  BadgeDollarSign,
  Filter,
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Save,
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

type DateRangeFilter = "today" | "this_week" | "this_month" | "custom";

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

export default function AdminTimesheetPage() {
  const [currentAnchor, setCurrentAnchor] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { days, startISO, endISO } = useMemo(
    () => getWeekRangeFromAnchor(currentAnchor),
    [currentAnchor]
  );
  const weekKey = startISO;
  const todayISO = toLocalISODate(new Date());

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

  const employeesById = useMemo(() => getEmployeesById(users), [users]);
  const projectsById = useMemo(() => getProjectsById(projects), [projects]);

  const [projectFilter, setProjectFilter] = useState<number | "all">("all");
  const [employeeFilter, setEmployeeFilter] = useState<number | "all">("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>("this_week");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">(
    "csv"
  );

  // NOTE: for "this_week" we now always use the visible header range (startISO/endISO)
  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    if (dateRangeFilter === "today") {
      const iso = toLocalISODate(now);
      return { rangeStart: iso, rangeEnd: iso };
    }
    if (dateRangeFilter === "this_month") {
      const y = now.getFullYear();
      const m = now.getMonth();
      const start = toLocalISODate(new Date(y, m, 1));
      const end = toLocalISODate(new Date(y, m + 1, 0));
      return { rangeStart: start, rangeEnd: end };
    }
    if (dateRangeFilter === "custom" && customStart && customEnd) {
      return { rangeStart: customStart, rangeEnd: customEnd };
    }
    // this_week -> use current header week
    return { rangeStart: startISO, rangeEnd: endISO };
  }, [dateRangeFilter, customStart, customEnd, startISO, endISO]);

  const rawRangeTasks: Task[] = useMemo(
    () => tasks.filter((t) => t.date >= rangeStart && t.date <= rangeEnd),
    [tasks, rangeStart, rangeEnd]
  );

  const rangeTasks: Task[] = useMemo(
    () =>
      rawRangeTasks.filter((t) => {
        if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
        if (
          employeeFilter !== "all" &&
          !t.assigneeIds.includes(employeeFilter)
        ) {
          return false;
        }
        if (dateFilter && t.date !== dateFilter) return false;
        return true;
      }),
    [rawRangeTasks, projectFilter, employeeFilter, dateFilter]
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
  const billableHours = rangeTasks
    .filter((t) => t.billingType === "billable")
    .reduce((sum, t) => sum + t.workedHours, 0);

  const nonBillableHours = rangeTasks
    .filter((t) => t.billingType === "non-billable")
    .reduce((sum, t) => sum + t.workedHours, 0);

  const tasksByGroup = Object.entries(displayTasks);

  const exportRows = useMemo(
    () =>
      rangeTasks.map((t) => {
        const assignees = t.assigneeIds
          .map((id) => employeesById[id]?.name)
          .filter(Boolean)
          .join(", ");
        return {
          Date: t.date,
          Project: t.projectName,
          Task: t.name,
          Status: t.status,
          Assignees: assignees,
          WorkedHours: t.workedHours.toFixed(2),
          BillingType: t.billingType,
          Description: t.description ?? "",
        };
      }),
    [rangeTasks]
  );

  const handleExportCSV = () => {
    if (exportRows.length === 0) {
      alert("No data to export for current filters.");
      return;
    }
    const header = Object.keys(exportRows[0]);
    const rows = exportRows.map((row) => header.map((key) => (row as any)[key]));
    const csv = [header, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet_${rangeStart}_${rangeEnd}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    if (exportRows.length === 0) {
      alert("No data to export for current filters.");
      return;
    }
    alert("XLSX export: connect SheetJS here using exportRows.");
  };

  const handleExportPDF = () => {
    if (exportRows.length === 0) {
      alert("No data to export for current filters.");
      return;
    }
    alert("PDF export: connect jsPDF + autotable here using exportRows.");
  };

  const handleExport = () => {
    if (exportFormat === "csv") handleExportCSV();
    else if (exportFormat === "xlsx") handleExportXLSX();
    else handleExportPDF();
  };

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

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editedHours, setEditedHours] = useState<string>("0");
  const [editedDescription, setEditedDescription] = useState<string>("");

  const openEditFor = (task: Task, date: string) => {
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
    if (!editTarget) return;
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
        setTasks((prev) =>
          prev.map((t) =>
            t.id === updated.id && t.date === updated.date ? updated : t
          )
        );
      }
      closeEdit();
    } catch (err) {
      console.error("Failed to save timesheet edit:", err);
      alert("Failed to save changes. Please try again.");
    }
  };

  const projectOptions = projects;
  const employeeOptions = users.filter((u) => u.role === "employee");

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

  const handleDatePickerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.value) {
      const selectedDate = new Date(e.target.value);
      setCurrentAnchor(selectedDate);
      setShowDatePicker(false);
    }
  };

  const tasksByProject = useMemo(() => {
    const map: Record<number, { id: number; name: string }[]> = {};
    tasks.forEach((t) => {
      if (!t.projectId) return;
      if (!map[t.projectId]) map[t.projectId] = [];
      if (!map[t.projectId].some((x) => x.name === t.name)) {
        map[t.projectId].push({ id: t.id, name: t.name });
      }
    });
    return map;
  }, [tasks]);

  // ---------- placeholder rows + row editor ----------
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
    if (rowId === null) {
      const newId = Date.now();
      setWeekPlaceholders(weekKey, (prev) => [...prev, newId]);
      setRowDraft({ projectId: null, taskId: null, rowId: newId });
    } else {
      setRowDraft({ projectId: null, taskId: null, rowId });
    }
    setShowRowEditor(true);
  };

  const groupKey = (t: Task) => `${t.projectId}::${t.name}`;

  const existingGroupKeysThisWeek = useMemo(() => {
    const keys = new Set<string>();
    weekTasks.forEach((t) => {
      keys.add(groupKey(t));
    });
    return keys;
  }, [weekTasks]);

  const handleSaveRowDraft = async () => {
    if (!rowDraft.projectId || !rowDraft.taskId) return;

    try {
      const project = projectsById[rowDraft.projectId];
      const sourceTask = tasks.find((t) => t.id === rowDraft.taskId);

      const key = `${project.id}::${sourceTask?.name ?? "New task"}::${[...(sourceTask?.assigneeIds || [employeeOptions[0]?.id || 1])].sort().join(",")}`;
      if (weekTasks.some(t => getTaskGroupKey(t) === key)) {
        setShowRowEditor(false);
        return;
      }

      // Create ONE entry for the first day of the week to "hold" the row
      const created: Task = await createTaskAction({
        name: sourceTask?.name ?? "New task",
        projectId: project.id,
        projectName: project.name,
        assigneeIds: sourceTask?.assigneeIds || [employeeOptions[0]?.id || 1],
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

  // ---- new behavior: keep header in sync with filters ----

  // when user picks an exact date, move anchor to that date’s week
  const handleExactDateChange = (value: string) => {
    setDateFilter(value);
    if (value) {
      const d = new Date(value);
      setCurrentAnchor(d); // only move anchor; do NOT touch dateRangeFilter
    }
  };

  // when user sets custom range, move anchor to "from" date week
  const handleCustomStartChange = (value: string) => {
    setCustomStart(value);
    if (value) {
      const d = new Date(value);
      setCurrentAnchor(d);
    }
  };

  const handleDateRangeFilterChange = (value: DateRangeFilter) => {
    setDateRangeFilter(value);

    if (value === "this_week") {
      // go to today's week when explicitly switching to "This week"
      setCurrentAnchor(new Date());
    } else if (value === "today") {
      const today = new Date();
      setCurrentAnchor(today);
    } else if (value === "custom" && customStart) {
      const d = new Date(customStart);
      setCurrentAnchor(d);
    }
  };

  const handleClearFilters = () => {
    setProjectFilter("all");
    setEmployeeFilter("all");
    setDateFilter("");
    setDateRangeFilter("this_week");
    setCustomStart("");
    setCustomEnd("");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-muted">
        Loading timesheet...
      </main>
    );
  }

  return (
    <main className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Timesheet
            </h1>
            <p className="text-sm text-muted">
              Time entries with flexible filters and export options.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
                    setCurrentAnchor(selectedDate);
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
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-border bg-card px-4 py-3 text-xs space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <Filter className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-sm">Filters</span>
          <span className="text-[11px] text-muted">
            Narrow down by project, employee, and date range before exporting.
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {/* Project filter */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] font-medium text-foreground">
              <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
              Project
            </label>
            <select
              value={projectFilter === "all" ? "" : String(projectFilter)}
              onChange={(e) =>
                setProjectFilter(
                  e.target.value === "" ? "all" : Number(e.target.value)
                )
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            >
              <option value="">All projects</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee filter */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] font-medium text-foreground">
              <Users className="h-3.5 w-3.5 text-emerald-500" />
              Employee
            </label>
            <select
              value={employeeFilter === "all" ? "" : String(employeeFilter)}
              onChange={(e) =>
                setEmployeeFilter(
                  e.target.value === "" ? "all" : Number(e.target.value)
                )
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            >
              <option value="">All employees</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date range filter */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] font-medium text-foreground">
              <CalendarRange className="h-3.5 w-3.5 text-emerald-500" />
              Date range
            </label>
            <select
              value={dateRangeFilter}
              onChange={(e) =>
                handleDateRangeFilterChange(e.target.value as DateRangeFilter)
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            >
              <option value="today">Today</option>
              <option value="this_week">This week</option>
              <option value="this_month">This month</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Exact date */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] font-medium text-foreground">
              <CalendarRange className="h-3.5 w-3.5 text-emerald-500" />
              Exact date (optional)
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleExactDateChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        {dateRangeFilter === "custom" && (
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                From
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => handleCustomStartChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                To
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
          </div>
        )}

        {(projectFilter !== "all" ||
          employeeFilter !== "all" ||
          dateFilter ||
          dateRangeFilter !== "this_week" ||
          customStart ||
          customEnd) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-1 text-[11px] text-emerald-500 hover:underline"
            >
              Clear filters
            </button>
          )}
      </section>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs flex items-center gap-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary-500">
            <Clock4 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-muted mb-1">Worked Today</p>
            <p className="text-xl font-semibold">
              {totalWorkedToday.toFixed(2)} h
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs flex items-center gap-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary-500">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <p className="text-muted mb-1">Total Range Hours</p>
            <p className="text-xl font-semibold">
              {totalWorkedRange.toFixed(2)} h
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs flex items-center gap-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary-500">
            <BadgeDollarSign className="h-4 w-4" />
          </div>
          <div>
            <p className="text-muted mb-1">Billable Hours</p>
            <p className="text-xl font-semibold">
              {billableHours.toFixed(2)} h
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs flex items-center gap-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-muted">
            <BadgeDollarSign className="h-4 w-4 opacity-60" />
          </div>
          <div>
            <p className="text-muted mb-1">Non‑Billable Hours</p>
            <p className="text-xl font-semibold">
              {nonBillableHours.toFixed(2)} h
            </p>
          </div>
        </div>
      </section>

      {/* Export */}
      <section className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 text-xs text-foreground">
          <span>Export as</span>
          <select
            value={exportFormat}
            onChange={(e) =>
              setExportFormat(e.target.value as "csv" | "xlsx" | "pdf")
            }
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
        >
          {exportFormat === "csv" || exportFormat === "xlsx" ? (
            <FileSpreadsheet className="h-3.5 w-3.5" />
          ) : (
            <FileDown className="h-3.5 w-3.5" />
          )}
          <span>Export filtered data</span>
        </button>
        <span className="text-[11px] text-muted">
          {exportRows.length} rows will be exported based on current filters and
          date range.
        </span>
      </section>

      {/* Weekly grid with totals footer */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-2 bg-background/60 flex justify-end">
          <button
            type="button"
            onClick={() => openRowEditor(null)}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:bg-card"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add row</span>
          </button>
        </div>

        <div className="overflow-x-auto pb-[150px] min-h-[300px]">
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
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{formatAssignees(task.assigneeIds)}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>
                        {task.billingType === "billable"
                          ? "Billable"
                          : "Non‑billable"}
                      </span>
                    </p>
                  </td>
                  {days.map((iso) => {
                    const hours = hoursByTaskDay[gKey]?.[iso] ?? 0;
                    return (
                      <td
                        key={iso}
                        className="px-3 py-3 text-center text-foreground cursor-pointer hover:bg-background/70"
                        onClick={() => openEditFor(task, iso)}
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
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:bg-background"
                          title="Edit row"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePlaceholderRow(rowId)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:bg-background"
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
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-1.5 text-xs text-foreground hover:bg-card"
                >
                  <Clock4 className="h-3.5 w-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Row editor modal */}
      {showRowEditor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-card text-foreground shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Update Timesheet</h2>
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
                    {projects.map((p) => (
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
                      (tasksByProject[rowDraft.projectId] ?? []).map((t) => (
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
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-1.5 text-xs text-foreground hover:bg-card"
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
