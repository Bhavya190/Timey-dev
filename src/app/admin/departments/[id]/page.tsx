"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    fetchDepartmentByIdAction,
    fetchEmployeesAction
} from "@/app/actions";
import { Department, Employee } from "@/types";
import {
    ArrowLeft,
    Building2,
    Users,
    Mail,
    BadgeCheck,
    IdentificationCard,
    Loader2
} from "lucide-react";

export default function DepartmentDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [department, setDepartment] = useState<Department | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const dept = await fetchDepartmentByIdAction(Number(id));
                if (dept) {
                    setDepartment(dept);
                    const allEmps = await fetchEmployeesAction();
                    // Filter employees by this department
                    const deptEmps = allEmps.filter(emp => emp.departmentId === Number(id));
                    setEmployees(deptEmps);
                }
            } catch (err) {
                console.error("Failed to load department details:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!department) {
        return (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
                <h2 className="text-xl font-bold mb-2">Department not found</h2>
                <button
                    onClick={() => router.push("/admin/departments")}
                    className="text-emerald-500 font-semibold hover:underline"
                >
                    Back to list
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button & Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.push("/admin/departments")}
                    className="inline-flex items-center gap-2 text-sm text-muted hover:text-emerald-500 transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Departments
                </button>

                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                        <Building2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
                        <p className="text-muted text-sm max-w-2xl">{department.description || "No description provided for this department."}</p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-emerald-500" />
                        <div>
                            <p className="text-xs text-muted font-medium">Headcount</p>
                            <h3 className="text-xl font-bold">{employees.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Employees Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                    <BadgeCheck className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-lg font-bold text-foreground">Assigned Employees</h2>
                </div>

                {employees.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {employees.map((emp) => (
                            <div
                                key={emp.id}
                                className="group relative rounded-2xl border border-border bg-card p-4 hover:border-emerald-500/40 hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => router.push(`/admin/employees?id=${emp.id}`)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border shrink-0 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors">
                                        {emp.avatarUrl ? (
                                            <img src={emp.avatarUrl} alt={emp.firstName} className="h-full w-full rounded-xl object-cover" />
                                        ) : (
                                            <IdentificationCard className="h-5 w-5 text-muted group-hover:text-emerald-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm truncate group-hover:text-emerald-500 transition-colors">
                                            {emp.firstName} {emp.lastName}
                                        </h3>
                                        <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
                                            {emp.role}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-xs text-muted truncate">
                                            <Mail className="h-3 w-3" />
                                            {emp.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center text-muted">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No employees currently assigned to this department.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
