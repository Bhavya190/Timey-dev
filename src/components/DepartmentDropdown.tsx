"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, Check, ChevronDown, Loader2 } from "lucide-react";
import { Department } from "@/types";
import { fetchDepartmentsAction, createDepartmentAction } from "@/app/actions";
import { toast } from "react-hot-toast";

interface Props {
    selectedId?: number;
    onSelect: (dept: Department) => void;
}

export default function DepartmentDropdown({ selectedId, onSelect }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchDepartmentsAction();
            setDepartments(data);
            setLoading(false);
        };
        if (open) load();
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = departments.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedDept = departments.find((d) => d.id === selectedId);

    const handleCreate = async () => {
        if (!search.trim()) return;
        setCreating(true);
        const result = await createDepartmentAction({ name: search.trim() });
        setCreating(false);

        if ("error" in result) {
            toast.error(result.error as string);
        } else {
            toast.success(`Department "${result.name}" created!`);
            setDepartments([...departments, result]);
            onSelect(result);
            setOpen(false);
            setSearch("");
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            >
                <span className={selectedDept ? "text-foreground" : "text-muted"}>
                    {selectedDept ? selectedDept.name : "Select Department"}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card p-1 shadow-xl animate-in fade-in zoom-in duration-200">
                    <div className="relative mb-1">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search or create department..."
                            className="w-full rounded-lg bg-muted/50 py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-emerald-500/40"
                        />
                    </div>

                    <div className="max-h-48 overflow-y-auto overflow-x-hidden py-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                            </div>
                        ) : filtered.length > 0 ? (
                            filtered.map((dept) => (
                                <button
                                    key={dept.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(dept);
                                        setOpen(false);
                                    }}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                                >
                                    <span>{dept.name}</span>
                                    {selectedId === dept.id && <Check className="h-3.5 w-3.5" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center">
                                <p className="text-xs text-muted">No department found</p>
                            </div>
                        )}
                    </div>

                    {search.trim() && !departments.some(d => d.name.toLowerCase() === search.toLowerCase().trim()) && (
                        <div className="border-t border-border mt-1 pt-1">
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={creating}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            >
                                {creating ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                )}
                                Create &quot;{search.trim()}&quot;
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
