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
        return <div className={`animate-pulse rounded-lg border border-border bg-card px-3 py-1.5 h-10 w-48 ${className}`} />;
    }

    const isActive = status === "Clocked In";
    const isFinished = status === "Clocked Out";

    return (
        <div className={`inline-flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5 transition-colors ${isActive ? 'border-emerald-500/50 bg-emerald-500/5' : ''} ${className}`}>
            <div className="flex items-center gap-2">
                <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${isActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-background text-emerald-500 border border-border'}`}>
                    <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                    <p className="font-mono text-sm font-bold tabular-nums tracking-tight text-foreground leading-none">
                        {formatTime(displaySeconds)}
                    </p>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none mt-0.5" style={{ color: isFinished ? '#ef4444' : isActive ? '#10b981' : status === 'Paused' ? '#f59e0b' : undefined }}>
                        {isFinished ? "Finished" : isActive ? "Clocked In" : status === "Paused" ? "Paused" : "Not Started"}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1 border-l border-border pl-3">
                {(status === "Not Started" || status === "Paused") && !isFinished && (
                    <button
                        onClick={handleClockIn}
                        disabled={loading}
                        className="p-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        title={status === "Paused" ? "Resume" : "Clock In"}
                    >
                        <Play className="h-3.5 w-3.5" fill="currentColor" />
                    </button>
                )}

                {isActive && (
                    <button
                        onClick={handlePause}
                        disabled={loading}
                        className="p-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        title="Pause"
                    >
                        <Pause className="h-3.5 w-3.5" fill="currentColor" />
                    </button>
                )}

                {!isFinished && (
                    <button
                        onClick={handleClockOut}
                        disabled={loading || status === "Not Started"}
                        className="p-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                        title="Clock Out"
                    >
                        <Square className="h-3.5 w-3.5" fill="currentColor" />
                    </button>
                )}
            </div>
        </div>
    );
}
