"use client";

import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
    Legend,
} from "recharts";
import { PieChart as PieIcon, BarChart3, LineChart as LineIcon } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
    Active: "#22c55e",
    "On Hold": "#eab308",
    Completed: "#22c55e",
    "Not Started": "#ef4444",
    "In Progress": "#3b82f6",
};

const legendProps = {
    verticalAlign: "bottom" as const,
    align: "left" as const,
    iconType: "circle" as const,
    wrapperStyle: { fontSize: 11, paddingTop: 8 },
};

interface DashboardChartsProps {
    projectsByStatus: { name: string; value: number }[];
    tasksByStatus: { name: string; value: number }[];
    tasksByDate: { date: string; count: number }[];
    timesheetByDate: { date: string; total: number; billable: number; nonBillable: number }[];
}

export default function DashboardCharts({
    projectsByStatus,
    tasksByStatus,
    tasksByDate,
    timesheetByDate,
}: DashboardChartsProps) {
    return (
        <>
            {/* Charts: projects/tasks */}
            <section className="grid gap-4 xl:grid-cols-3">
                {/* Projects by status */}
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col">
                    <div className="flex items-center mb-3 gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                            <PieIcon className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-xs text-muted">Projects</p>
                            <p className="text-sm font-semibold">By status</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        {projectsByStatus.length === 0 ? (
                            <p className="text-xs text-muted text-center mt-6">
                                No project data available.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={projectsByStatus}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={80}
                                        paddingAngle={2}
                                    >
                                        {projectsByStatus.map((entry) => (
                                            <Cell
                                                key={entry.name}
                                                fill={STATUS_COLORS[entry.name] ?? "#6b7280"}
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend {...legendProps} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Tasks by status */}
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col">
                    <div className="flex items-center mb-3 gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
                            <PieIcon className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-xs text-muted">Tasks</p>
                            <p className="text-sm font-semibold">By status</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        {tasksByStatus.length === 0 ? (
                            <p className="text-xs text-muted text-center mt-6">
                                No task data available.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={tasksByStatus}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={80}
                                        paddingAngle={2}
                                    >
                                        {tasksByStatus.map((entry) => (
                                            <Cell
                                                key={entry.name}
                                                fill={STATUS_COLORS[entry.name] ?? "#6b7280"}
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend {...legendProps} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Task count by date */}
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col">
                    <div className="flex items-center mb-3 gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                            <BarChart3 className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-xs text-muted">Tasks</p>
                            <p className="text-sm font-semibold">Task count by date</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        {tasksByDate.length === 0 ? (
                            <p className="text-xs text-muted text-center mt-6">
                                No task data available.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={tasksByDate}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Legend {...legendProps} />
                                    <Bar dataKey="count" fill="#22c55e" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </section>

            {/* Time charts */}
            <section className="grid gap-4 xl:grid-cols-3">
                {/* Total hours by date */}
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                            <LineIcon className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-xs text-muted">Timesheet</p>
                            <p className="text-sm font-semibold">Hours by date</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        {timesheetByDate.length === 0 ? (
                            <p className="text-xs text-muted text-center mt-6">
                                No timesheet data available.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={timesheetByDate}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Legend {...legendProps} />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Billable hours by date */}
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                            <LineIcon className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-xs text-muted">Timesheet</p>
                            <p className="text-sm font-semibold">Billable hours by date</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        {timesheetByDate.length === 0 ? (
                            <p className="text-xs text-muted text-center mt-6">
                                No billable data available.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={timesheetByDate}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Legend {...legendProps} />
                                    <Line
                                        type="monotone"
                                        dataKey="billable"
                                        stroke="#eab308"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Non‑billable hours by date */}
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                            <LineIcon className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-xs text-muted">Timesheet</p>
                            <p className="text-sm font-semibold">Non‑billable hours by date</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        {timesheetByDate.length === 0 ? (
                            <p className="text-xs text-muted text-center mt-6">
                                No non‑billable data available.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={timesheetByDate}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Legend {...legendProps} />
                                    <Line
                                        type="monotone"
                                        dataKey="nonBillable"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
