"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    fetchUsersAction,
    fetchProjectsAction,
    fetchTasksAction,
    getCurrentUserAction,
} from "@/app/actions";
import type { User, Project, Task } from "@/types";
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    BarChart3,
    Clock4,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import dynamic from "next/dynamic";

const EmployeeCharts = dynamic(() => import("@/components/EmployeeCharts"), {
    ssr: false,
});

function toLocalISODate(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getWeekRangeFromDate(base: Date): { startISO: string; endISO: string } {
    const day = base.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - diffToMonday);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { startISO: toLocalISODate(monday), endISO: toLocalISODate(sunday) };
}

function addDaysISO(iso: string, days: number) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d + days);
    return toLocalISODate(dt);
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

export default function EmployeeDashboardContent({ currentEmployeeId: propId }: { currentEmployeeId?: number }) {
    const router = useRouter();

    const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(propId ?? null);
    const [hydrated, setHydrated] = useState(false);

    const initialWeek = getWeekRangeFromDate(new Date());
    const [weekStartISO, setWeekStartISO] = useState<string>(initialWeek.startISO);
    const [weekEndISO, setWeekEndISO] = useState<string>(initialWeek.endISO);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
            }
        }
        loadSession();
    }, [propId]);

    useEffect(() => {
        Promise.all([
            fetchUsersAction(),
            fetchProjectsAction(),
            fetchTasksAction(),
        ]).then(([u, p, t]) => {
            setUsers(u);
            setProjects(p);
            setTasks(t);
            setIsLoading(false);
            setHydrated(true);
        });
    }, []);

    const employee =
        currentEmployeeId != null
            ? users.find((u) => u.id === currentEmployeeId)
            : undefined;
    const employeeName = employee?.name ?? "Employee";

    const employeeTasks = useMemo(
        () =>
            currentEmployeeId == null
                ? []
                : tasks.filter((t) => t.assigneeIds.includes(currentEmployeeId)),
        [tasks, currentEmployeeId]
    );

    const projectIds = useMemo(
        () => new Set(employeeTasks.map((t) => t.projectId)),
        [employeeTasks]
    );

    const employeeProjects = useMemo(
        () => projects.filter((p) => projectIds.has(p.id)),
        [projects, projectIds]
    );

    const totalProjects = employeeProjects.length;
    const totalTasks = employeeTasks.length;

    const todayISO = toLocalISODate(new Date());
    const todayHours = employeeTasks
        .filter((t) => t.date === todayISO)
        .reduce((sum, t) => sum + t.workedHours, 0);

    const weekTasks = useMemo(
        () =>
            employeeTasks.filter(
                (t) =>
                    t.date >= weekStartISO &&
                    t.date <= weekEndISO &&
                    t.workedHours > 0
            ),
        [employeeTasks, weekStartISO, weekEndISO]
    );

    const thisWeekHours = weekTasks.reduce((sum, t) => sum + t.workedHours, 0);

    const projectsByStatus = useMemo(() => {
        const map: Record<string, number> = {};
        for (const p of employeeProjects) {
            map[p.status] = (map[p.status] ?? 0) + 1;
        }
        return Object.entries(map).map(([status, value]) => ({ name: status, value }));
    }, [employeeProjects]);

    const tasksByStatus = useMemo(() => {
        const map: Record<string, number> = {};
        for (const t of weekTasks) {
            map[t.status] = (map[t.status] ?? 0) + 1;
        }
        return Object.entries(map).map(([status, value]) => ({ name: status, value }));
    }, [weekTasks]);

    const tasksByDate = useMemo(() => {
        const map: Record<string, number> = {};
        for (const t of weekTasks) {
            map[t.date] = (map[t.date] ?? 0) + 1;
        }
        return Object.entries(map)
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([date, count]) => ({ date, count }));
    }, [weekTasks]);

    const timesheetByDate = useMemo(() => {
        const map: Record<
            string,
            { total: number; billable: number; nonBillable: number }
        > = {};

        for (const t of weekTasks) {
            if (!map[t.date]) {
                map[t.date] = { total: 0, billable: 0, nonBillable: 0 };
            }
            const bucket = map[t.date];
            bucket.total += t.workedHours;

            const billingType = (t as any).billingType as
                | "billable"
                | "non-billable"
                | undefined;

            if (billingType === "billable") {
                bucket.billable += t.workedHours;
            } else if (billingType === "non-billable") {
                bucket.nonBillable += t.workedHours;
            } else {
                bucket.nonBillable += t.workedHours;
            }
        }

        return Object.entries(map)
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([date, v]) => ({
                date,
                total: v.total,
                billable: v.billable,
                nonBillable: v.nonBillable,
            }));
    }, [weekTasks]);

    const totalAllTimeHours = useMemo(() => {
        const map: Record<string, number> = {};
        for (const t of employeeTasks) {
            map[t.date] = (map[t.date] ?? 0) + t.workedHours;
        }
        return Object.values(map).reduce((sum, v) => sum + v, 0);
    }, [employeeTasks]);

    const weekRangeLabel = `${formatDateShortWithYear(
        weekStartISO
    )} – ${formatDateShortWithYear(weekEndISO)}`;

    const goToPreviousWeek = () => {
        setWeekStartISO((prev) => addDaysISO(prev, -7));
        setWeekEndISO((prev) => addDaysISO(prev, -7));
    };

    const goToNextWeek = () => {
        setWeekStartISO((prev) => addDaysISO(prev, 7));
        setWeekEndISO((prev) => addDaysISO(prev, 7));
    };

    const handleWeekPickerChange = (value: string) => {
        if (!value) return;
        const { startISO, endISO } = getWeekRangeFromDate(new Date(value));
        setWeekStartISO(startISO);
        setWeekEndISO(endISO);
    };

    if (!hydrated || isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-background text-muted">
                Loading dashboard content...
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
        <div className="space-y-6">
            {/* Header with week selector on right */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-muted text-xs mb-1">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Employee Dashboard</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome back, {employeeName}
                    </h1>
                    <p className="text-sm text-muted">
                        Overview of your projects, tasks, and time tracking.
                    </p>
                </div>

                {/* Week range control */}
                <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted">
                    <button
                        type="button"
                        onClick={goToPreviousWeek}
                        className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                        title="Previous week"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                            {weekRangeLabel}
                        </span>
                        <div
                            className="relative h-7 w-7 cursor-pointer"
                            onClick={() => {
                                const input = document.getElementById('dashboard-date-picker') as HTMLInputElement;
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
                                id="dashboard-date-picker"
                                type="date"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                value={weekStartISO}
                                onChange={(e) => handleWeekPickerChange(e.target.value)}
                                aria-label="Select week date"
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded-md border border-border bg-background text-muted hover:bg-card pointer-events-none z-10">
                                <CalendarIcon className="h-3.5 w-3.5" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={goToNextWeek}
                        className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                        title="Next week"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <button
                    type="button"
                    onClick={() => router.push("/employee/projects")}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-emerald-500 hover:bg-card/90 transition"
                >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <FolderKanban className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-xs text-muted mb-0.5">Total Projects</p>
                        <p className="text-xl font-semibold underline decoration-emerald-500 underline-offset-4">
                            {totalProjects}
                        </p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => router.push("/employee/tasks")}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-emerald-500 hover:bg-card/90 transition"
                >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
                        <CheckSquare className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-xs text-muted mb-0.5">Total Tasks</p>
                        <p className="text-xl font-semibold underline decoration-emerald-500 underline-offset-4">
                            {totalTasks}
                        </p>
                    </div>
                </button>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                        <Clock4 className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-xs text-muted mb-1">Timesheet (week)</p>
                        <p className="text-xl font-semibold">
                            {thisWeekHours.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <Clock4 className="h-5 w-5" />
                    </span>
                    <div className="flex flex-col">
                        <p className="text-xs text-muted mb-1">Logged today</p>
                        <p className="text-xl font-semibold">
                            {todayHours.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <Clock4 className="h-5 w-5" />
                    </span>
                    <div className="flex flex-col">
                        <p className="text-xs text-muted mb-1">Total logged</p>
                        <p className="text-xl font-semibold">
                            {totalAllTimeHours.toFixed(2)}
                        </p>
                    </div>
                </div>
            </section>

            {/* Dynamic Charts */}
            <EmployeeCharts
                projectsByStatus={projectsByStatus}
                tasksByStatus={tasksByStatus}
                tasksByDate={tasksByDate}
                timesheetByDate={timesheetByDate}
            />
        </div>
    );
}
