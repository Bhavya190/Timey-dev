"use client";

import { useState, useEffect } from "react";
import { X, Check, XCircle, Clock4 } from "lucide-react";
import { fetchTimesheetsAction, approveTimesheetAction, rejectTimesheetAction, fetchUsersAction } from "@/app/actions";
import type { Timesheet, User } from "@/types";
import toast from "react-hot-toast";

interface Props {
    onClose: () => void;
    adminId: number;
}

export function ApprovalsModal({ onClose, adminId }: Props) {
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // For rejection comments
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [comment, setComment] = useState("");

    useEffect(() => {
        Promise.all([
            fetchTimesheetsAction(),
            fetchUsersAction()
        ]).then(([ts, us]) => {
            // Only show submitted timesheets
            setTimesheets(ts.filter(t => t.status === "Submitted"));
            setUsers(us);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-xl bg-card p-6 shadow-xl flex flex-col max-h-[90vh]">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Timesheet Approvals</h2>
                        <p className="text-sm text-muted-foreground mt-1">Review and approve employee submissions.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-2 text-muted hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {isLoading ? (
                        <p className="text-center text-muted-foreground py-8">Loading submissions...</p>
                    ) : timesheets.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
                                <Check className="h-6 w-6" />
                            </div>
                            <p className="text-muted-foreground">All caught up! No pending approvals.</p>
                        </div>
                    ) : (
                        timesheets.map(ts => {
                            const emp = usersById[ts.employeeId];
                            const empName = emp ? emp.name : `Employee #${ts.employeeId}`;
                            const isRejecting = rejectingId === ts.id;
                            const isProcessing = processingId === ts.id;

                            return (
                                <div key={ts.id} className="rounded-lg border border-border p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-background/50 hover:bg-background transition-colors">
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
                                        <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                                            <input
                                                type="text"
                                                placeholder="Reason for rejection..."
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                className="flex-1 sm:w-64 rounded-md border border-border px-3 py-1.5 text-sm outline-none focus:border-red-500"
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
                                                className="px-3 py-1.5 border border-border text-foreground text-xs font-semibold rounded-md hover:bg-muted disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
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
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
