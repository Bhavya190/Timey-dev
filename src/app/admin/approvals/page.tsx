"use client";

import { useState, useEffect } from "react";
import { Check, XCircle, Clock4, ChevronDown, ChevronUp } from "lucide-react";
import { fetchTimesheetsAction, approveTimesheetAction, rejectTimesheetAction, fetchUsersAction, fetchTasksAction, fetchProjectsAction } from "@/app/actions";
import type { Timesheet, User, Task, Project } from "@/types";
import toast from "react-hot-toast";

export default function ApprovalsPage() {
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [reviewingTsId, setReviewingTsId] = useState<number | null>(null);

    // For rejection comments
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [comment, setComment] = useState("");

    useEffect(() => {
        Promise.all([
            fetchTimesheetsAction(),
            fetchUsersAction(),
            fetchTasksAction(),
            fetchProjectsAction()
        ]).then(([ts, us, tks, prjs]) => {
            // Only show submitted timesheets
            setTimesheets(ts.filter(t => t.status === "Submitted"));
            setUsers(us);
            setTasks(tks);
            setProjects(prjs);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load approvals data", err);
            setIsLoading(false);
        });
    }, []);

    const usersById = users.reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
    }, {} as Record<number, User>);

    const projectsById = projects.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
    }, {} as Record<number, Project>);

    const handleApprove = async (ts: Timesheet) => {
        setProcessingId(ts.id);
        try {
            await approveTimesheetAction(ts.id, ts.employeeId, ts.weekStart);
            setTimesheets(prev => prev.filter(t => t.id !== ts.id));
            toast.success("Timesheet approved");
        } catch (err) {
            console.error("Failed to approve", err);
            toast.error("Failed to approve timesheet.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectInit = (id: number) => {
        setRejectingId(id);
        setComment("");
    };

    const handleRejectConfirm = async (ts: Timesheet) => {
        if (!comment.trim()) {
            toast.error("Please provide a rejection comment.");
            return;
        }
        setProcessingId(ts.id);
        try {
            await rejectTimesheetAction(ts.id, ts.employeeId, ts.weekStart, comment);
            setTimesheets(prev => prev.filter(t => t.id !== ts.id));
            setRejectingId(null);
            toast.success("Timesheet rejected");
        } catch (err) {
            console.error("Failed to reject", err);
            toast.error("Failed to reject timesheet.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Timesheet Approvals
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Review and approve employee submissions.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm min-h-[500px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <p className="text-muted-foreground">Loading submissions...</p>
                    </div>
                ) : timesheets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 mb-4">
                            <Check className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                        <p className="text-muted-foreground mt-1">No pending timesheet approvals at the moment.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {timesheets.map(ts => {
                            const emp = usersById[ts.employeeId];
                            const empName = emp ? emp.name : `Employee #${ts.employeeId}`;
                            const isRejecting = rejectingId === ts.id;
                            const isProcessing = processingId === ts.id;
                            const isReviewing = reviewingTsId === ts.id;

                            // Filter tasks for this timesheet (by employee and week)
                            const tsEnd = new Date(ts.weekStart);
                            tsEnd.setDate(tsEnd.getDate() + 6);
                            const endISO = tsEnd.toISOString().split("T")[0];
                            const relevantTasks = tasks.filter(t =>
                                t.assigneeIds.includes(ts.employeeId) &&
                                t.date >= ts.weekStart &&
                                t.date <= endISO
                            );

                            return (
                                <div key={ts.id} className="rounded-lg border border-border bg-background/50 hover:bg-background transition-colors overflow-hidden">
                                    <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold uppercase">
                                                {empName.slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{empName}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Clock4 className="h-3.5 w-3.5" />
                                                    <span>Week of {ts.weekStart}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isRejecting ? (
                                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                                                <input
                                                    type="text"
                                                    placeholder="Reason for rejection..."
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    className="flex-1 sm:w-64 rounded-md border border-border px-3 py-1.5 text-sm outline-none focus:border-red-500 bg-background"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleRejectConfirm(ts)}
                                                    disabled={isProcessing}
                                                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-md hover:bg-red-600 disabled:opacity-50"
                                                >
                                                    {isProcessing ? "..." : "Confirm"}
                                                </button>
                                                <button
                                                    onClick={() => setRejectingId(null)}
                                                    disabled={isProcessing}
                                                    className="px-3 py-1.5 border border-border bg-background text-foreground text-xs font-semibold rounded-md hover:bg-muted disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setReviewingTsId(isReviewing ? null : ts.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors text-xs font-semibold rounded-md"
                                                >
                                                    {isReviewing ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                    Review
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(ts)}
                                                    disabled={isProcessing}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors text-xs font-semibold rounded-md disabled:opacity-50"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectInit(ts.id)}
                                                    disabled={isProcessing}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors text-xs font-semibold rounded-md disabled:opacity-50"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isReviewing && (
                                        <div className="border-t border-border bg-card p-4 text-sm">
                                            <h4 className="font-semibold mb-3 text-foreground">Task Breakdown</h4>
                                            {relevantTasks.length === 0 ? (
                                                <p className="text-muted-foreground text-xs">No tasks logged for this week.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {relevantTasks.map((task) => {
                                                        const pName = projectsById[task.projectId]?.name || "Unassigned Project";
                                                        return (
                                                            <div key={task.id} className="grid grid-cols-12 gap-4 pb-2 border-b border-border text-xs rounded-lg p-2 bg-muted/30">
                                                                <div className="col-span-12 sm:col-span-2 font-medium text-foreground">{task.date}</div>
                                                                <div className="col-span-12 sm:col-span-3 text-muted-foreground truncate" title={pName}>{pName}</div>
                                                                <div className="col-span-12 sm:col-span-4 font-medium text-foreground truncate" title={task.name}>{task.name}</div>
                                                                <div className="col-span-6 sm:col-span-2 text-primary-500 font-semibold">{task.workedHours} hrs</div>
                                                                <div className="col-span-6 sm:col-span-1">
                                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase ${task.billingType === 'billable' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'
                                                                        }`}>
                                                                        {task.billingType === 'billable' ? '$' : '-'}
                                                                    </span>
                                                                </div>
                                                                {task.description && (
                                                                    <div className="col-span-12 text-muted-foreground mt-1 text-[11px] italic">
                                                                        "{task.description}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
