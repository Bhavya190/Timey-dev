"use client";

import { useState, useEffect } from "react";
import { 
    getDailyTimeAction, 
    clockInAction, 
    pauseTimeAction, 
    clockOutAction 
} from "@/app/actions";
import { Clock, Play, Pause, Square } from "lucide-react";

type TimeTrackerWidgetProps = {
    employeeId: number;
    className?: string;
};

// Return YYYY-MM-DD
function getTodayISODate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function TimeTrackerWidget({ employeeId, className = "" }: TimeTrackerWidgetProps) {
    const today = getTodayISODate();
    const [status, setStatus] = useState<"Not Started" | "Clocked In" | "Paused" | "Clocked Out">("Not Started");
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [lastClockInTime, setLastClockInTime] = useState<string | null>(null);
    const [displaySeconds, setDisplaySeconds] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch initial state
    useEffect(() => {
        const fetchTime = async () => {
            setLoading(true);
            const res = await getDailyTimeAction(employeeId, today);
            if (res && !("error" in res)) {
                setStatus(res.status);
                setTotalSeconds(res.totalSeconds);
                setLastClockInTime(res.lastClockInTime);
            }
            setLoading(false);
        };
        fetchTime();
    }, [employeeId, today]);

    // Live Ticker loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (status === "Clocked In" && lastClockInTime) {
            interval = setInterval(() => {
                const now = new Date().getTime();
                const clockInMs = new Date(lastClockInTime).getTime();
                const elapsedSinceClockIn = Math.floor((now - clockInMs) / 1000);
                
                // Add the dynamically elapsed time to the previously persisted totalSeconds from DB
                setDisplaySeconds(totalSeconds + elapsedSinceClockIn);
            }, 1000);
        } else {
            // If not actively running, just show the persisted DB totalSeconds directly
            setDisplaySeconds(totalSeconds);
        }

        return () => clearInterval(interval);
    }, [status, totalSeconds, lastClockInTime]);

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600).toString().padStart(2, '0');
        const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleClockIn = async () => {
        setLoading(true);
        const res = await clockInAction(employeeId, today);
        if (!("error" in res)) {
            setStatus(res.status);
            setTotalSeconds(res.totalSeconds);
            setLastClockInTime(res.lastClockInTime);
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    const handlePause = async () => {
        setLoading(true);
        const res = await pauseTimeAction(employeeId, today);
        if (!("error" in res)) {
            setStatus(res.status);
            setTotalSeconds(res.totalSeconds);
            setLastClockInTime(res.lastClockInTime);
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    const handleClockOut = async () => {
        if (!confirm("Are you sure you want to clock out for the day? You cannot resume once clocked out.")) return;
        setLoading(true);
        const res = await clockOutAction(employeeId, today);
        if (!("error" in res)) {
            setStatus(res.status);
            setTotalSeconds(res.totalSeconds);
            setLastClockInTime(res.lastClockInTime);
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    if (loading && status === "Not Started" && totalSeconds === 0) {
        return <div className={`animate-pulse rounded-xl border border-border bg-card p-4 h-24 ${className}`} />;
    }

    const isActive = status === "Clocked In";
    const isFinished = status === "Clocked Out";

    return (
        <div className={`rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isActive ? 'border-emerald-500/50 bg-emerald-500/5' : ''} ${className}`}>
            <div className="flex items-center gap-3 relative">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-background text-emerald-500 border border-border'}`}>
                    <Clock className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted mb-0.5">Today's Time</h3>
                    <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
                        {formatTime(displaySeconds)}
                    </p>
                    {isFinished && (
                        <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Clocked Out</span>
                    )}
                    {isActive && (
                        <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Clocked In</span>
                    )}
                    {status === "Paused" && (
                        <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Paused</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                {(status === "Not Started" || status === "Paused") && !isFinished && (
                    <button
                        onClick={handleClockIn}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                    >
                        <Play className="h-4 w-4" fill="currentColor" />
                        {status === "Paused" ? "Resume" : "Clock In"}
                    </button>
                )}

                {isActive && (
                    <button
                        onClick={handlePause}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                        <Pause className="h-4 w-4" fill="currentColor" />
                        Pause
                    </button>
                )}

                {!isFinished && (
                    <button
                        onClick={handleClockOut}
                        disabled={loading || status === "Not Started"}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50 transition-colors"
                    >
                        <Square className="h-4 w-4" fill="currentColor" />
                        Clock Out
                    </button>
                )}
            </div>
        </div>
    );
}
