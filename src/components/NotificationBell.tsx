"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock4 } from "lucide-react";
import { fetchNotificationsAction, markNotificationReadAction } from "@/app/actions";
import type { Notification } from "@/types";

export function NotificationBell({ userId }: { userId: number }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifs = async () => {
        try {
            if (userId) {
                setIsLoading(true);
                const data = await fetchNotificationsAction(userId);
                setNotifications(data);
            }
        } catch (err) {
            console.error("Failed to load notifications:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifs();

        // Poll every 1 minute
        const intervalId = setInterval(() => {
            fetchNotifs();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [userId]);

    // Handle outside click to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkRead = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await markNotificationReadAction(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                title="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto origin-top-right bg-card border border-border rounded-xl shadow-lg z-[100] focus:outline-none flex flex-col">
                    <div className="px-4 py-3 border-b border-border bg-muted/50 rounded-t-xl shrink-0 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-muted">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>
                    <div className="p-2 space-y-1 flex-1 overflow-y-auto">
                        {isLoading && notifications.length === 0 ? (
                            <p className="text-center text-xs text-muted py-4">Loading...</p>
                        ) : notifications.length === 0 ? (
                            <p className="text-center text-xs text-muted py-4">No notifications yet.</p>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg text-sm transition-colors ${notif.isRead ? "bg-transparent text-muted-foreground" : "bg-primary-500/5 text-foreground font-medium border border-primary-500/20"
                                        }`}
                                >
                                    <div className="shrink-0 mt-0.5 text-primary-500">
                                        <Clock4 className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="leading-snug text-[13px]">{notif.message}</p>
                                        <p className="text-[10px] text-muted-foreground opacity-70">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {!notif.isRead && (
                                        <button
                                            onClick={(e) => handleMarkRead(e, notif.id)}
                                            className="shrink-0 p-1 rounded hover:bg-background text-emerald-500"
                                            title="Mark as read"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
