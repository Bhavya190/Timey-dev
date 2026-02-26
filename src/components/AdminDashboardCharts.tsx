"use client";

import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#eab308", "#3b82f6", "#a855f7"];

interface AdminDashboardChartsProps {
    projectStatusData: { name: string; value: number }[];
    clientStatusData: { name: string; value: number }[];
    tasksByStatusData: { name: string; value: number }[];
    tasksByDateData: { date: string; count: number }[];
    hoursByDateData: { date: string; hours: number }[];
    selectedEmployeeName: string;
    dateLabel: string;
}

export default function AdminDashboardCharts({
    projectStatusData,
    clientStatusData,
    tasksByStatusData,
    tasksByDateData,
    hoursByDateData,
    selectedEmployeeName,
    dateLabel,
}: AdminDashboardChartsProps) {
    return (
        <div className="grid gap-6 xl:grid-cols-3">
            {/* Projects by status */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
                <p className="text-xs text-muted mb-2">Projects by status</p>
                <div className="flex-1 min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={projectStatusData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                labelLine={false}
                            >
                                {projectStatusData.map((_, index) => (
                                    <Cell
                                        key={`p-proj-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-1 text-[11px] text-foreground">
                    {projectStatusData.map((s, i) => (
                        <li key={s.name} className="flex items-center gap-2">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span>{s.name}</span>
                            <span className="ml-auto text-muted">{s.value}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Clients by status */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
                <p className="text-xs text-muted mb-2">Clients by status</p>
                <div className="flex-1 min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={clientStatusData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                labelLine={false}
                            >
                                {clientStatusData.map((_, index) => (
                                    <Cell
                                        key={`p-client-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-1 text-[11px] text-foreground">
                    {clientStatusData.map((s, i) => (
                        <li key={s.name} className="flex items-center gap-2">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span>{s.name}</span>
                            <span className="ml-auto text-muted">{s.value}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Tasks by status */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
                <p className="text-xs text-muted mb-1">Tasks by status</p>
                <p className="text-[11px] text-muted mb-2">
                    {selectedEmployeeName}, {dateLabel}
                </p>
                <div className="flex-1 min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={tasksByStatusData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                labelLine={false}
                            >
                                {tasksByStatusData.map((_, index) => (
                                    <Cell
                                        key={`p-task-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-1 text-[11px] text-foreground">
                    {tasksByStatusData.map((s, i) => (
                        <li key={s.name} className="flex items-center gap-2">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span>{s.name}</span>
                            <span className="ml-auto text-muted">{s.value}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Tasks per date */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col xl:col-span-2">
                <p className="text-xs text-muted mb-1">Tasks count by date</p>
                <p className="text-[11px] text-muted mb-2">
                    {selectedEmployeeName}, {dateLabel}
                </p>
                <div className="flex-1 min-h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tasksByDateData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: "#9ca3af" }}
                            />
                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#22c55e" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Hours per date */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
                <p className="text-xs text-muted mb-1">
                    Timesheet hours by date
                </p>
                <p className="text-[11px] text-muted mb-2">
                    {selectedEmployeeName}, {dateLabel}
                </p>
                <div className="flex-1 min-h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hoursByDateData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: "#9ca3af" }}
                            />
                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="hours"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
